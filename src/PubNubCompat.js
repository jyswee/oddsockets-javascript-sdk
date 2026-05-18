const OddSockets = require('./OddSockets');

/**
 * PubNub Compatibility Layer
 * 
 * Provides a PubNub-compatible API that wraps the OddSockets client.
 * This allows for easy migration from PubNub to OddSockets with minimal code changes.
 */
class PubNubCompat {
  /**
   * Create a PubNub-compatible client
   * @param {Object} config - Configuration options
   * @param {string} config.publishKey - Your OddSockets API key (PubNub compatibility)
   * @param {string} config.subscribeKey - Your OddSockets API key (should match publishKey)
   * @param {string} [config.userId] - User ID
   * @param {Object} [config.options] - Additional options
   */
  constructor(config) {
    if (!config) {
      throw new Error('Configuration is required');
    }
    
    // Validate required PubNub-style parameters
    if (!config.publishKey) {
      throw new Error('publishKey is required (use your OddSockets API key)');
    }
    
    if (!config.subscribeKey) {
      throw new Error('subscribeKey is required (use your OddSockets API key)');
    }
    
    // In PubNub, publish and subscribe keys can be different, but in OddSockets they should be the same
    if (config.publishKey !== config.subscribeKey) {
      console.warn('PubNubCompat: publishKey and subscribeKey should be the same for OddSockets. Using publishKey.');
    }
    
    this.client = new OddSockets({
      apiKey: config.publishKey, // Use publishKey as the OddSockets API key
      userId: config.userId,
      options: config.options,
      autoConnect: false // We'll handle connection manually for PubNub compatibility
    });
    
    this.listeners = [];
    this.subscribedChannels = new Set();
    this.presenceChannels = new Set();
    
    // Set up event forwarding
    this._setupEventForwarding();
  }
  
  /**
   * Subscribe to channels (PubNub-compatible)
   * @param {Object} params - Subscription parameters
   * @param {string|Array<string>} params.channels - Channel(s) to subscribe to
   * @param {boolean} [params.withPresence=false] - Enable presence
   * @param {number} [params.timetoken] - Not used in OddSockets
   */
  subscribe(params) {
    if (!params || !params.channels) {
      throw new Error('Channels parameter is required');
    }
    
    const channels = Array.isArray(params.channels) ? params.channels : [params.channels];
    const withPresence = params.withPresence || false;
    
    // Connect if not already connected
    if (this.client.getState() === 'disconnected') {
      this.client.connect();
    }
    
    // Subscribe to each channel
    channels.forEach(channelName => {
      if (!this.subscribedChannels.has(channelName)) {
        const channel = this.client.channel(channelName);
        
        // Subscribe with presence if requested
        channel.subscribe((message) => {
          this._notifyListeners('message', {
            channel: channelName,
            message: message.message,
            publisher: message.publisher?.userId,
            timetoken: new Date(message.timestamp).getTime() * 10000, // Convert to PubNub timetoken format
            subscription: channelName,
            actualChannel: channelName
          });
        }, {
          enablePresence: withPresence
        });
        
        // Handle presence events if enabled
        if (withPresence) {
          this.presenceChannels.add(channelName);
          
          channel.on('presence_change', (data) => {
            this._notifyListeners('presence', {
              channel: channelName,
              action: data.action,
              uuid: data.user.userId,
              occupancy: data.occupancy,
              timestamp: new Date().getTime(),
              subscription: channelName,
              actualChannel: channelName
            });
          });
        }
        
        this.subscribedChannels.add(channelName);
      }
    });
    
    // Notify status
    this._notifyListeners('status', {
      category: 'PNConnectedCategory',
      operation: 'PNSubscribeOperation',
      affectedChannels: channels,
      subscribedChannels: Array.from(this.subscribedChannels),
      affectedChannelGroups: [],
      lastTimetoken: new Date().getTime() * 10000,
      currentTimetoken: new Date().getTime() * 10000
    });
  }
  
  /**
   * Unsubscribe from channels (PubNub-compatible)
   * @param {Object} params - Unsubscription parameters
   * @param {string|Array<string>} params.channels - Channel(s) to unsubscribe from
   */
  unsubscribe(params) {
    if (!params || !params.channels) {
      throw new Error('Channels parameter is required');
    }
    
    const channels = Array.isArray(params.channels) ? params.channels : [params.channels];
    
    channels.forEach(channelName => {
      if (this.subscribedChannels.has(channelName)) {
        const channel = this.client.channel(channelName);
        channel.unsubscribe();
        
        this.subscribedChannels.delete(channelName);
        this.presenceChannels.delete(channelName);
      }
    });
    
    // Notify status
    this._notifyListeners('status', {
      category: 'PNDisconnectedCategory',
      operation: 'PNUnsubscribeOperation',
      affectedChannels: channels,
      subscribedChannels: Array.from(this.subscribedChannels),
      affectedChannelGroups: [],
      lastTimetoken: new Date().getTime() * 10000,
      currentTimetoken: new Date().getTime() * 10000
    });
  }
  
  /**
   * Publish a message (PubNub-compatible)
   * @param {Object} params - Publishing parameters
   * @param {string} params.channel - Channel to publish to
   * @param {*} params.message - Message to publish
   * @param {Object} [params.meta] - Message metadata
   * @param {Function} [callback] - Callback function
   * @returns {Promise} Promise that resolves with publish result
   */
  publish(params, callback) {
    if (!params || !params.channel || params.message === undefined) {
      const error = new Error('Channel and message parameters are required');
      if (callback) callback({ error: error });
      return Promise.reject(error);
    }
    
    const channel = this.client.channel(params.channel);
    const publishPromise = channel.publish(params.message, {
      metadata: params.meta
    }).then(result => {
      const response = {
        timetoken: new Date(result.timestamp).getTime() * 10000,
        error: false
      };
      
      if (callback) callback(response);
      return response;
    }).catch(error => {
      const response = { error: error };
      if (callback) callback(response);
      throw error;
    });
    
    return publishPromise;
  }
  
  /**
   * Get message history (PubNub-compatible)
   * @param {Object} params - History parameters
   * @param {string} params.channel - Channel to get history for
   * @param {number} [params.count=100] - Number of messages
   * @param {number} [params.start] - Start timetoken
   * @param {number} [params.end] - End timetoken
   * @param {Function} [callback] - Callback function
   * @returns {Promise} Promise that resolves with history
   */
  history(params, callback) {
    if (!params || !params.channel) {
      const error = new Error('Channel parameter is required');
      if (callback) callback({ error: error });
      return Promise.reject(error);
    }
    
    const channel = this.client.channel(params.channel);
    const historyOptions = {
      count: params.count || 100
    };
    
    // Convert PubNub timetokens to ISO strings if provided
    if (params.start) {
      historyOptions.start = new Date(params.start / 10000).toISOString();
    }
    if (params.end) {
      historyOptions.end = new Date(params.end / 10000).toISOString();
    }
    
    const historyPromise = channel.getHistory(historyOptions).then(messages => {
      const response = {
        messages: messages.map(msg => [
          msg.message,
          new Date(msg.timestamp).getTime() * 10000 // Convert to PubNub timetoken
        ]),
        startTimeToken: messages.length > 0 ? new Date(messages[0].timestamp).getTime() * 10000 : null,
        endTimeToken: messages.length > 0 ? new Date(messages[messages.length - 1].timestamp).getTime() * 10000 : null,
        error: false
      };
      
      if (callback) callback(response);
      return response;
    }).catch(error => {
      const response = { error: error };
      if (callback) callback(response);
      throw error;
    });
    
    return historyPromise;
  }
  
  /**
   * Get presence information (PubNub-compatible)
   * @param {Object} params - Presence parameters
   * @param {string|Array<string>} params.channels - Channel(s) to get presence for
   * @param {Function} [callback] - Callback function
   * @returns {Promise} Promise that resolves with presence info
   */
  hereNow(params, callback) {
    if (!params || !params.channels) {
      const error = new Error('Channels parameter is required');
      if (callback) callback({ error: error });
      return Promise.reject(error);
    }
    
    const channels = Array.isArray(params.channels) ? params.channels : [params.channels];
    const presencePromises = channels.map(channelName => {
      const channel = this.client.channel(channelName);
      return channel.getPresence().then(presence => ({
        channel: channelName,
        occupancy: presence.occupancy || 0,
        occupants: (presence.occupants || []).map(occupant => ({
          uuid: occupant.userId,
          state: occupant.state
        }))
      }));
    });
    
    const hereNowPromise = Promise.all(presencePromises).then(results => {
      const response = {
        totalChannels: results.length,
        totalOccupancy: results.reduce((sum, r) => sum + r.occupancy, 0),
        channels: {}
      };
      
      results.forEach(result => {
        response.channels[result.channel] = {
          occupancy: result.occupancy,
          occupants: result.occupants
        };
      });
      
      if (callback) callback(response);
      return response;
    }).catch(error => {
      const response = { error: error };
      if (callback) callback(response);
      throw error;
    });
    
    return hereNowPromise;
  }
  
  /**
   * Set user state (PubNub-compatible)
   * @param {Object} params - State parameters
   * @param {string|Array<string>} params.channels - Channel(s) to set state for
   * @param {Object} params.state - State object
   * @param {Function} [callback] - Callback function
   * @returns {Promise} Promise that resolves with state result
   */
  setState(params, callback) {
    if (!params || !params.channels || !params.state) {
      const error = new Error('Channels and state parameters are required');
      if (callback) callback({ error: error });
      return Promise.reject(error);
    }
    
    const channels = Array.isArray(params.channels) ? params.channels : [params.channels];
    
    // Update state on first subscribed channel (OddSockets updates state globally)
    const firstChannel = channels.find(ch => this.subscribedChannels.has(ch));
    if (!firstChannel) {
      const error = new Error('Must be subscribed to at least one channel to set state');
      if (callback) callback({ error: error });
      return Promise.reject(error);
    }
    
    const channel = this.client.channel(firstChannel);
    const statePromise = channel.updateState(params.state).then(result => {
      const response = {
        state: params.state,
        channels: channels.reduce((acc, ch) => {
          acc[ch] = params.state;
          return acc;
        }, {})
      };
      
      if (callback) callback(response);
      return response;
    }).catch(error => {
      const response = { error: error };
      if (callback) callback(response);
      throw error;
    });
    
    return statePromise;
  }
  
  /**
   * Add listener (PubNub-compatible)
   * @param {Object} listener - Event listener object
   */
  addListener(listener) {
    if (listener && typeof listener === 'object') {
      this.listeners.push(listener);
    }
  }
  
  /**
   * Remove listener (PubNub-compatible)
   * @param {Object} listener - Event listener object to remove
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Remove all listeners (PubNub-compatible)
   */
  removeAllListeners() {
    this.listeners = [];
  }
  
  /**
   * Disconnect (PubNub-compatible)
   */
  disconnect() {
    this.client.disconnect();
    this.subscribedChannels.clear();
    this.presenceChannels.clear();
  }
  
  /**
   * Reconnect (PubNub-compatible)
   */
  reconnect() {
    this.client.connect();
  }
  
  /**
   * Get subscribed channels (PubNub-compatible)
   * @returns {Array<string>} List of subscribed channels
   */
  getSubscribedChannels() {
    return Array.from(this.subscribedChannels);
  }
  
  /**
   * Internal: Setup event forwarding from OddSockets client
   * @private
   */
  _setupEventForwarding() {
    this.client.on('connected', () => {
      this._notifyListeners('status', {
        category: 'PNConnectedCategory',
        operation: 'PNSubscribeOperation'
      });
    });
    
    this.client.on('disconnected', () => {
      this._notifyListeners('status', {
        category: 'PNDisconnectedCategory',
        operation: 'PNUnsubscribeOperation'
      });
    });
    
    this.client.on('error', (error) => {
      this._notifyListeners('status', {
        category: 'PNNetworkIssuesCategory',
        operation: 'PNSubscribeOperation',
        error: error
      });
    });
    
    this.client.on('reconnecting', (data) => {
      this._notifyListeners('status', {
        category: 'PNReconnectedCategory',
        operation: 'PNSubscribeOperation'
      });
    });
  }
  
  /**
   * Internal: Notify all listeners of an event
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   * @private
   */
  _notifyListeners(eventType, data) {
    this.listeners.forEach(listener => {
      if (listener[eventType] && typeof listener[eventType] === 'function') {
        try {
          listener[eventType](data);
        } catch (error) {
          console.error('Error in PubNub listener:', error);
        }
      }
    });
  }
}

module.exports = PubNubCompat;
