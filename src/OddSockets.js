const EventEmitter = require('eventemitter3');
const axios = require('axios');
const io = require('socket.io-client');
const Channel = require('./Channel');
const managerDiscovery = require('./ManagerDiscovery');
const EnhancedFeatures = require('./EnhancedFeatures');

/**
 * OddSockets JavaScript SDK
 * 
 * Provides a simple interface to the OddSockets real-time messaging platform.
 * Automatically handles manager discovery and Worker load balancing internally.
 */
class OddSockets extends EventEmitter {
  /**
   * Create an OddSockets client
   * @param {Object} config - Configuration options
   * @param {string} config.apiKey - Your OddSockets API key
   * @param {string} [config.userId] - User ID (defaults to API key's user)
   * @param {Object} [config.options] - Additional connection options
   */
  constructor(config) {
    super();
    
    if (!config || !config.apiKey) {
      throw new Error('API key is required');
    }
    
    this.config = {
      apiKey: config.apiKey,
      userId: config.userId,
      options: config.options || {}
    };
    
    this.socket = null;
    this.workerUrl = null;
    this.workerId = null;
    this.channels = new Map();
    this.connectionState = 'disconnected'; // disconnected, connecting, connected, reconnecting
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.clientIdentifier = this._generateClientIdentifier();
    this.sessionInfo = null;
    
    // Initialize enhanced features (67 new Slack-like events)
    this.enhanced = new EnhancedFeatures(this);
    
    // Auto-connect by default
    if (config.autoConnect !== false) {
      this.connect();
    }
  }
  
  /**
   * Connect to the OddSockets platform
   * Handles the Manager → Worker assignment internally
   */
  async connect() {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      return;
    }
    
    this.connectionState = 'connecting';
    this.emit('connecting');
    
    try {
      // Step 1: Get worker assignment from manager
      await this._getWorkerAssignment();
      
      // Step 2: Connect to assigned worker
      await this._connectToWorker();
      
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emit('connected');
      
    } catch (error) {
      this.connectionState = 'disconnected';
      this.emit('error', error);
      
      // Auto-reconnect with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this._scheduleReconnect();
      } else {
        this.emit('max_reconnect_attempts_reached');
      }
    }
  }
  
  /**
   * Disconnect from the platform
   */
  disconnect() {
    this.connectionState = 'disconnected';
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.workerUrl = null;
    this.workerId = null;
    this.emit('disconnected');
  }
  
  /**
   * Get or create a channel
   * @param {string} channelName - Name of the channel
   * @returns {Channel} Channel instance
   */
  channel(channelName) {
    if (!channelName || typeof channelName !== 'string') {
      throw new Error('Channel name must be a non-empty string');
    }
    
    if (!this.channels.has(channelName)) {
      const channel = new Channel(channelName, this);
      this.channels.set(channelName, channel);
    }
    
    return this.channels.get(channelName);
  }
  
  /**
   * Get current connection state
   * @returns {string} Connection state
   */
  getState() {
    return this.connectionState;
  }
  
  /**
   * Get assigned worker information
   * @returns {Object|null} Worker info
   */
  getWorkerInfo() {
    if (!this.workerId || !this.workerUrl) {
      return null;
    }
    
    return {
      workerId: this.workerId,
      workerUrl: this.workerUrl
    };
  }
  
  /**
   * Publish multiple messages at once
   * @param {Array} messages - Array of message objects with {channel, message, options?} structure
   * @returns {Promise<Array>} Array of publish results
   */
  async publishBulk(messages) {
    if (!Array.isArray(messages)) {
      throw new Error('Messages must be an array');
    }
    
    if (!this._isConnected()) {
      throw new Error('Not connected to OddSockets');
    }
    
    const results = [];
    
    for (const msg of messages) {
      try {
        if (!msg.channel || msg.message === undefined) {
          results.push({
            success: false,
            error: 'Missing channel or message'
          });
          continue;
        }
        
        const channel = this.channel(msg.channel);
        const result = await channel.publish(msg.message, msg.options || {});
        results.push({
          success: true,
          result: result
        });
        
      } catch (error) {
        results.push({
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Internal: Get worker assignment from manager
   * @private
   */
  async _getWorkerAssignment() {
    try {
      // Discover the optimal manager URL automatically
      const managerUrl = await managerDiscovery.discoverManagerUrl(this.config.apiKey);
      
      const response = await axios.get(`${managerUrl}/api/cluster/select-worker`, {
        params: {
          apiKey: this.config.apiKey,
          userId: this.config.userId || this.clientIdentifier,
          clientIdentifier: this.clientIdentifier
        },
        headers: {
          'User-Agent': 'OddSockets-JS-SDK/1.0.0'
        },
        timeout: 10000
      });
      
      if (!response.data || !response.data.url) {
        throw new Error('Invalid worker assignment response');
      }
      
      this.workerUrl = response.data.url;
      this.workerId = response.data.workerId;
      this.sessionInfo = response.data.session;
      
      this.emit('worker_assigned', {
        workerId: this.workerId,
        workerUrl: this.workerUrl,
        session: this.sessionInfo,
        clientIdentifier: this.clientIdentifier,
        managerUrl: managerUrl // Include discovered manager URL for debugging
      });
      
    } catch (error) {
      // If manager is offline, try fallback logic
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Manager is offline. Cannot assign worker without session stickiness.');
      }
      throw error;
    }
  }
  
  /**
   * Internal: Connect to assigned worker
   * @private
   */
  async _connectToWorker() {
    if (!this.workerUrl) {
      throw new Error('No worker URL available');
    }
    
    return new Promise((resolve, reject) => {
      const socketOptions = {
        auth: {
          apiKey: this.config.apiKey,
          userId: this.config.userId
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        ...this.config.options
      };
      
      this.socket = io(this.workerUrl, socketOptions);
      
      // Connection success
      this.socket.on('connect', () => {
        this._setupSocketEventHandlers();
        resolve();
      });
      
      // Connection error
      this.socket.on('connect_error', (error) => {
        reject(new Error(`Failed to connect to worker: ${error.message}`));
      });
      
      // Timeout fallback
      setTimeout(() => {
        if (this.connectionState === 'connecting') {
          reject(new Error('Connection timeout'));
        }
      }, 15000);
    });
  }
  
  /**
   * Internal: Setup socket event handlers
   * @private
   */
  _setupSocketEventHandlers() {
    if (!this.socket) return;
    
    // Handle disconnection
    this.socket.on('disconnect', (reason) => {
      this.connectionState = 'disconnected';
      this.emit('disconnected', reason);
      
      // Auto-reconnect unless manually disconnected
      if (reason !== 'io client disconnect') {
        this._scheduleReconnect();
      }
    });
    
    // Handle errors
    this.socket.on('error', (error) => {
      this.emit('error', error);
    });
    
    // Forward channel-related events to appropriate channels
    this.socket.on('message', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        channel._handleMessage(data);
      }
    });
    
    this.socket.on('subscribed', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        channel._handleSubscribed(data);
      }
    });
    
    this.socket.on('unsubscribed', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        channel._handleUnsubscribed(data);
      }
    });
    
    this.socket.on('published', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        channel._handlePublished(data);
      }
    });
    
    this.socket.on('presence', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        channel._handlePresence(data);
      }
    });
    
    this.socket.on('presence_change', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        channel._handlePresenceChange(data);
      }
    });
    
    this.socket.on('history', (data) => {
      const channel = this.channels.get(data.channel);
      if (channel) {
        channel._handleHistory(data);
      }
    });
  }
  
  /**
   * Internal: Schedule reconnection with exponential backoff
   * @private
   */
  _scheduleReconnect() {
    if (this.connectionState === 'connected') return;
    
    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay: delay
    });
    
    setTimeout(() => {
      if (this.connectionState === 'reconnecting') {
        this.connect();
      }
    }, delay);
  }
  
  /**
   * Internal: Get socket instance (for Channel class)
   * @private
   */
  _getSocket() {
    return this.socket;
  }
  
  /**
   * Internal: Check if connected (for Channel class)
   * @private
   */
  _isConnected() {
    return this.connectionState === 'connected' && this.socket && this.socket.connected;
  }
  
  /**
   * Internal: Generate consistent client identifier for session stickiness
   * @private
   */
  _generateClientIdentifier() {
    // Create a consistent identifier based on API key and user ID
    const baseId = this.config.userId || 'default';
    const apiKeyHash = this._hashString(this.config.apiKey);
    return `${apiKeyHash}_${baseId}`;
  }
  
  /**
   * Internal: Simple hash function for API key
   * @private
   */
  _hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Get client identifier used for session stickiness
   * @returns {string} Client identifier
   */
  getClientIdentifier() {
    return this.clientIdentifier;
  }
  
  /**
   * Get session information
   * @returns {Object|null} Session info
   */
  getSessionInfo() {
    return this.sessionInfo;
  }
}

module.exports = OddSockets;
