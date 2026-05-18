const EventEmitter = require('eventemitter3');

/**
 * Message size limits (industry standard - matches PubNub)
 */
const MESSAGE_SIZE_LIMITS = {
  MAX_MESSAGE_SIZE: 32768, // 32KB in bytes
  MAX_MESSAGE_SIZE_KB: 32
};

/**
 * Validate message size
 * @param {*} message - Message to validate
 * @throws {Error} If message exceeds size limit
 */
function validateMessageSize(message) {
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
  const messageSize = new TextEncoder().encode(messageStr).length;
  
  if (messageSize > MESSAGE_SIZE_LIMITS.MAX_MESSAGE_SIZE) {
    throw new Error(
      `Message size (${Math.round(messageSize / 1024)}KB) exceeds maximum allowed size of ${MESSAGE_SIZE_LIMITS.MAX_MESSAGE_SIZE_KB}KB. ` +
      `This limit matches industry standards (PubNub, Socket.IO) for reliable real-time messaging.`
    );
  }
  
  return messageSize;
}

/**
 * Channel class for pub/sub messaging
 * 
 * Provides methods for subscribing, publishing, and managing presence
 * on a specific channel within the OddSockets platform.
 */
class Channel extends EventEmitter {
  /**
   * Create a Channel instance
   * @param {string} name - Channel name
   * @param {OddSockets} client - Parent OddSockets client
   */
  constructor(name, client) {
    super();
    
    this.name = name;
    this.client = client;
    this.subscribed = false;
    this.subscribing = false;
    this.options = {};
    this.presence = new Map();
    this.messageHistory = [];
    this.maxHistorySize = 100;
  }
  
  /**
   * Subscribe to the channel
   * @param {Function} callback - Message callback function
   * @param {Object} [options] - Subscription options
   * @param {number} [options.maxHistory=100] - Maximum history messages to retain
   * @param {boolean} [options.retainHistory=true] - Whether to retain message history
   * @param {boolean} [options.enablePresence=false] - Whether to enable presence tracking
   * @returns {Promise<void>}
   */
  async subscribe(callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new Error('Callback function is required');
    }
    
    if (this.subscribed || this.subscribing) {
      // Add callback to existing subscription
      this.on('message', callback);
      return;
    }
    
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    this.subscribing = true;
    this.options = {
      maxHistory: options.maxHistory || 100,
      retainHistory: options.retainHistory !== false,
      enablePresence: options.enablePresence || false,
      ...options
    };
    
    this.maxHistorySize = this.options.maxHistory;
    
    return new Promise((resolve, reject) => {
      const socket = this.client._getSocket();
      
      // Set up one-time listeners for subscription response
      const onSubscribed = (data) => {
        if (data.channel === this.name) {
          this.subscribed = true;
          this.subscribing = false;
          this.on('message', callback);
          
          socket.off('subscribed', onSubscribed);
          socket.off('error', onError);
          
          this.emit('subscribed', data);
          resolve();
        }
      };
      
      const onError = (error) => {
        this.subscribing = false;
        socket.off('subscribed', onSubscribed);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('subscribed', onSubscribed);
      socket.on('error', onError);
      
      // Send subscription request
      socket.emit('subscribe', {
        channel: this.name,
        options: this.options
      });
      
      // Timeout fallback
      setTimeout(() => {
        if (this.subscribing) {
          socket.off('subscribed', onSubscribed);
          socket.off('error', onError);
          this.subscribing = false;
          reject(new Error('Subscription timeout'));
        }
      }, 10000);
    });
  }
  
  /**
   * Unsubscribe from the channel
   * @returns {Promise<void>}
   */
  async unsubscribe() {
    if (!this.subscribed) {
      return;
    }
    
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    return new Promise((resolve, reject) => {
      const socket = this.client._getSocket();
      
      const onUnsubscribed = (data) => {
        if (data.channel === this.name) {
          this.subscribed = false;
          this.removeAllListeners('message');
          
          socket.off('unsubscribed', onUnsubscribed);
          socket.off('error', onError);
          
          this.emit('unsubscribed', data);
          resolve();
        }
      };
      
      const onError = (error) => {
        socket.off('unsubscribed', onUnsubscribed);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('unsubscribed', onUnsubscribed);
      socket.on('error', onError);
      
      socket.emit('unsubscribe', {
        channel: this.name
      });
      
      // Timeout fallback
      setTimeout(() => {
        socket.off('unsubscribed', onUnsubscribed);
        socket.off('error', onError);
        reject(new Error('Unsubscription timeout'));
      }, 5000);
    });
  }
  
  /**
   * Publish a message to the channel
   * @param {*} message - Message to publish (string, object, or array)
   * @param {Object} [options] - Publishing options
   * @param {number} [options.ttl] - Time to live in seconds
   * @param {Object} [options.metadata] - Additional message metadata
   * @returns {Promise<Object>} Publication result
   */
  async publish(message, options = {}) {
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    // Validate message size before publishing
    try {
      validateMessageSize(message);
    } catch (error) {
      throw error;
    }
    
    return new Promise((resolve, reject) => {
      const socket = this.client._getSocket();
      
      const onPublished = (data) => {
        if (data.channel === this.name) {
          socket.off('published', onPublished);
          socket.off('error', onError);
          resolve(data);
        }
      };
      
      const onError = (error) => {
        socket.off('published', onPublished);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('published', onPublished);
      socket.on('error', onError);
      
      socket.emit('publish', {
        channel: this.name,
        message: message,
        options: options
      });
      
      // Timeout fallback
      setTimeout(() => {
        socket.off('published', onPublished);
        socket.off('error', onError);
        reject(new Error('Publish timeout'));
      }, 10000);
    });
  }
  
  /**
   * Get message history for the channel
   * @param {Object} [options] - History options
   * @param {number} [options.count=50] - Number of messages to retrieve
   * @param {string} [options.start] - Start time (ISO string)
   * @param {string} [options.end] - End time (ISO string)
   * @returns {Promise<Array>} Message history
   */
  async getHistory(options = {}) {
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    return new Promise((resolve, reject) => {
      const socket = this.client._getSocket();
      
      const onHistory = (data) => {
        if (data.channel === this.name) {
          socket.off('history', onHistory);
          socket.off('error', onError);
          resolve(data.messages || []);
        }
      };
      
      const onError = (error) => {
        socket.off('history', onHistory);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('history', onHistory);
      socket.on('error', onError);
      
      socket.emit('get_history', {
        channel: this.name,
        count: options.count || 50,
        start: options.start,
        end: options.end
      });
      
      // Timeout fallback
      setTimeout(() => {
        socket.off('history', onHistory);
        socket.off('error', onError);
        reject(new Error('History request timeout'));
      }, 10000);
    });
  }
  
  /**
   * Get current presence information
   * @returns {Promise<Object>} Presence information
   */
  async getPresence() {
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    return new Promise((resolve, reject) => {
      const socket = this.client._getSocket();
      
      const onPresence = (data) => {
        if (data.channel === this.name) {
          socket.off('presence', onPresence);
          socket.off('error', onError);
          resolve(data);
        }
      };
      
      const onError = (error) => {
        socket.off('presence', onPresence);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('presence', onPresence);
      socket.on('error', onError);
      
      socket.emit('get_presence', {
        channel: this.name
      });
      
      // Timeout fallback
      setTimeout(() => {
        socket.off('presence', onPresence);
        socket.off('error', onError);
        reject(new Error('Presence request timeout'));
      }, 5000);
    });
  }
  
  /**
   * Update user state
   * @param {Object} state - User state object
   * @returns {Promise<void>}
   */
  async updateState(state) {
    if (!this.client._isConnected()) {
      throw new Error('Client is not connected');
    }
    
    return new Promise((resolve, reject) => {
      const socket = this.client._getSocket();
      
      const onStateUpdated = (data) => {
        socket.off('state_updated', onStateUpdated);
        socket.off('error', onError);
        resolve(data);
      };
      
      const onError = (error) => {
        socket.off('state_updated', onStateUpdated);
        socket.off('error', onError);
        reject(error);
      };
      
      socket.on('state_updated', onStateUpdated);
      socket.on('error', onError);
      
      socket.emit('update_state', {
        state: state
      });
      
      // Timeout fallback
      setTimeout(() => {
        socket.off('state_updated', onStateUpdated);
        socket.off('error', onError);
        reject(new Error('State update timeout'));
      }, 5000);
    });
  }
  
  /**
   * Get channel subscription status
   * @returns {boolean} Whether channel is subscribed
   */
  isSubscribed() {
    return this.subscribed;
  }
  
  /**
   * Get channel name
   * @returns {string} Channel name
   */
  getName() {
    return this.name;
  }
  
  /**
   * Get current presence map
   * @returns {Map} Presence map
   */
  getPresenceMap() {
    return new Map(this.presence);
  }
  
  /**
   * Get cached message history
   * @returns {Array} Cached messages
   */
  getCachedHistory() {
    return [...this.messageHistory];
  }
  
  /**
   * Internal: Handle incoming message
   * @param {Object} data - Message data
   * @private
   */
  _handleMessage(data) {
    // Add to history if enabled
    if (this.options.retainHistory) {
      this.messageHistory.push(data);
      
      // Trim history if too large
      if (this.messageHistory.length > this.maxHistorySize) {
        this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
      }
    }
    
    this.emit('message', data);
  }
  
  /**
   * Internal: Handle subscription confirmation
   * @param {Object} data - Subscription data
   * @private
   */
  _handleSubscribed(data) {
    this.emit('subscribed', data);
  }
  
  /**
   * Internal: Handle unsubscription confirmation
   * @param {Object} data - Unsubscription data
   * @private
   */
  _handleUnsubscribed(data) {
    this.emit('unsubscribed', data);
  }
  
  /**
   * Internal: Handle publish confirmation
   * @param {Object} data - Publish confirmation data
   * @private
   */
  _handlePublished(data) {
    this.emit('published', data);
  }
  
  /**
   * Internal: Handle presence information
   * @param {Object} data - Presence data
   * @private
   */
  _handlePresence(data) {
    // Update presence map
    if (data.occupants) {
      this.presence.clear();
      data.occupants.forEach(occupant => {
        this.presence.set(occupant.userId, occupant);
      });
    }
    
    this.emit('presence', data);
  }
  
  /**
   * Internal: Handle presence changes
   * @param {Object} data - Presence change data
   * @private
   */
  _handlePresenceChange(data) {
    // Update presence map
    if (data.action === 'join') {
      this.presence.set(data.user.userId, data.user);
    } else if (data.action === 'leave') {
      this.presence.delete(data.user.userId);
    }
    
    this.emit('presence_change', data);
  }
  
  /**
   * Internal: Handle message history
   * @param {Object} data - History data
   * @private
   */
  _handleHistory(data) {
    this.emit('history', data);
  }
}

module.exports = Channel;
