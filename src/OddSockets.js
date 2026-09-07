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
   * @param {string} [config.apiKey] - Your OddSockets API key. Omit when using tokenProvider.
   * @param {Function} [config.tokenProvider] - Async callback returning a fresh minted
   *   realtime token, used INSTEAD of an apiKey by game clients that exchange a player
   *   JWT for a short-lived scoped token via the OddSockets /v1/token front door. Called
   *   before every (re)connect and again shortly before the token expires. May resolve to
   *   a token string or an object {token, expiresAt, exp, baseUrl}. (FEAT-2026-0824-0040)
   * @param {number} [config.tokenRefreshLeadMs=120000] - Refresh a minted token this many
   *   milliseconds before it expires.
   * @param {string} [config.userId] - User ID (defaults to API key's user)
   * @param {Object} [config.options] - Additional connection options
   */
  constructor(config) {
    super();

    // Either a static API key OR an async tokenProvider callback is required.
    // Game clients (front-door auth) carry no API key: they exchange a player
    // JWT for a short-lived minted realtime token via tokenProvider. (FEAT-2026-0824-0040)
    if (!config || (!config.apiKey && typeof config.tokenProvider !== 'function')) {
      throw new Error('Either an API key or a tokenProvider callback is required');
    }

    this.config = {
      apiKey: config.apiKey,
      tokenProvider: config.tokenProvider,
      tokenRefreshLeadMs: config.tokenRefreshLeadMs || 120000,
      userId: config.userId,
      managerUrl: config.managerUrl,
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
    // Minted-token state (token mode only). (FEAT-2026-0824-0040)
    this._token = null;
    this._tokenExpiresAt = null;
    this._tokenRefreshTimer = null;
    
    // Initialize enhanced features (67 new Slack-like events)
    this.enhanced = new EnhancedFeatures(this);
    
    // Auto-connect by default
    if (config.autoConnect !== false) {
      // Fire-and-forget: failures are reported via the 'error' event and
      // retried by _scheduleReconnect. Swallow here so autoConnect never
      // produces an unhandled rejection.
      this.connect().catch(() => {});
    }
  }
  
  /**
   * Connect to the OddSockets platform
   * Handles the Manager → Worker assignment internally
   */
  async connect() {
    if (this.connectionState === 'connected') {
      return;
    }

    // A connect is already in flight — usually the constructor's autoConnect,
    // which fires before the caller gets a chance to `await client.connect()`.
    // Await THAT attempt instead of returning immediately: returning early made
    // the awaited promise resolve while the socket was still connecting, so the
    // documented `await connect(); channel.subscribe()` pattern threw
    // 'Client is not connected' (BUG-2026-0728-0012).
    if (this._connectPromise) {
      return this._connectPromise;
    }

    this._connectPromise = this._establishConnection();
    try {
      return await this._connectPromise;
    } finally {
      this._connectPromise = null;
    }
  }

  /**
   * Perform the actual Manager assignment + worker connection.
   * Always use connect() — it de-duplicates concurrent attempts.
   * @private
   */
  async _establishConnection() {
    this.connectionState = 'connecting';
    this.emit('connecting');
    
    try {
      // Step 0: In token mode, mint/refresh a realtime token before every
      // (re)connect so the worker assignment and handshake carry a fresh
      // credential rather than an API key. (FEAT-2026-0824-0040)
      if (this._isTokenMode()) {
        await this._resolveToken();
      }

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

      // Surface the failure to the caller. Background reconnection still runs,
      // but `await connect()` must not resolve when nothing connected — that
      // left callers with no way to detect failure (BUG-2026-0807-0035).
      throw error;
    }
  }
  
  /**
   * Disconnect from the platform
   */
  disconnect() {
    this.connectionState = 'disconnected';

    // Stop any pending minted-token refresh. (FEAT-2026-0824-0040)
    if (this._tokenRefreshTimer) {
      clearTimeout(this._tokenRefreshTimer);
      this._tokenRefreshTimer = null;
    }

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
   * Fetch this tenant's headline usage tiles (MAU / DAU / total messages /
   * error-rate) for the account that owns the configured API key.
   *
   * Server contract: GET {managerUrl}/api/tenant/usage with the X-API-Key
   * header. Requires an apiKey — keyless/token-only clients have no owner key
   * to scope by, so this throws for them.
   *
   * HONESTY: any tile the server can't compute yet comes back as null. This
   * method preserves null verbatim (it never coerces to 0) so callers can
   * render an em-dash instead of a fabricated zero.
   *
   * @returns {Promise<{mau:(number|null), dau:(number|null), totalMessages:(number|null), errorRate:(number|null), ownerScope:string, detail:Object, timestamp:string}>}
   */
  async getUsageStats() {
    if (this._isTokenMode() || !this.config.apiKey) {
      throw new Error('getUsageStats requires an apiKey (keyless/token clients have no owner scope to query)');
    }

    const managerUrl = await managerDiscovery.discoverManagerUrl(
      this.config.apiKey,
      this.config.managerUrl
    );

    const response = await axios.get(`${managerUrl}/api/tenant/usage`, {
      headers: {
        'X-API-Key': this.config.apiKey,
        'User-Agent': 'OddSockets-JS-SDK/1.0.0'
      },
      timeout: 10000
    });

    const data = response.data || {};
    const tiles = data.tiles || {};
    return {
      mau: tiles.mau ?? null,
      dau: tiles.dau ?? null,
      totalMessages: tiles.totalMessages ?? null,
      errorRate: tiles.errorRate ?? null,
      ownerScope: data.ownerScope,
      detail: data.detail || null,
      timestamp: data.timestamp
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
      // Honour the configured manager verbatim. If it is unreachable the
      // connection fails — we never silently retarget the default manager.
      const managerUrl = await managerDiscovery.discoverManagerUrl(
        this.config.apiKey,
        this.config.managerUrl
      );

      // In token mode present the minted token (not an API key) to the manager.
      // (FEAT-2026-0824-0040 / FEAT-2026-0824-0041)
      const selectParams = {
        userId: this.config.userId || this.clientIdentifier,
        clientIdentifier: this.clientIdentifier
      };
      if (this._isTokenMode()) {
        selectParams.token = this._token;
      } else {
        selectParams.apiKey = this.config.apiKey;
      }

      const response = await axios.get(`${managerUrl}/api/cluster/select-worker`, {
        params: selectParams,
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
        // Present the minted token at the Socket.IO handshake in token mode; the
        // worker verifies auth.token (FEAT-2026-0824-0039). Otherwise send the
        // API key as before. (FEAT-2026-0824-0040)
        auth: this._isTokenMode()
          ? { token: this._token, userId: this.config.userId }
          : { apiKey: this.config.apiKey, userId: this.config.userId },
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

    // Forward enhanced-feature broadcasts to the client event surface so apps can
    // listen with client.on('reaction_added', handler), etc. These are the events
    // the worker broadcasts to OTHER members of a room; the request/response acks
    // consumed by EnhancedFeatures methods are intentionally not in this list.
    OddSockets.ENHANCED_BROADCAST_EVENTS.forEach((event) => {
      this.socket.on(event, (data) => this.emit(event, data));
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
        this.connect().catch(() => {});
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
    // Create a consistent identifier based on API key and user ID. Token-mode
    // clients carry no API key, so fall back to a stable seed. (FEAT-2026-0824-0040)
    const baseId = this.config.userId || 'default';
    const seed = this.config.apiKey || 'token-client';
    const apiKeyHash = this._hashString(seed);
    return `${apiKeyHash}_${baseId}`;
  }

  /**
   * Internal: is this client authenticating with a minted token (vs an API key)?
   * @private
   */
  _isTokenMode() {
    return typeof this.config.tokenProvider === 'function';
  }

  /**
   * Internal: call the configured tokenProvider, cache the fresh token and its
   * expiry, and schedule a refresh ahead of expiry. (FEAT-2026-0824-0040)
   * @private
   */
  async _resolveToken() {
    const result = await this.config.tokenProvider();
    if (!result) {
      throw new Error('tokenProvider returned no token');
    }

    // Accept either a bare token string or a {token, expiresAt, exp} object,
    // mirroring the OddSockets /v1/token mint response shape.
    let token;
    let expiresAtMs = null;
    if (typeof result === 'string') {
      token = result;
    } else {
      token = result.token;
      if (result.expiresAt !== undefined && result.expiresAt !== null) {
        if (typeof result.expiresAt === 'number') {
          // < 1e12 ⇒ epoch seconds, else already milliseconds.
          expiresAtMs = result.expiresAt < 1e12
            ? result.expiresAt * 1000
            : result.expiresAt;
        } else {
          const parsed = Date.parse(result.expiresAt);
          if (!Number.isNaN(parsed)) expiresAtMs = parsed;
        }
      } else if (typeof result.exp === 'number') {
        expiresAtMs = result.exp * 1000;
      }
    }

    if (!token || typeof token !== 'string') {
      throw new Error('tokenProvider returned an invalid token');
    }

    // Fall back to the JWT's own exp claim if the provider gave no expiry.
    if (expiresAtMs === null) {
      expiresAtMs = this._expiryFromJwt(token);
    }

    this._token = token;
    this._tokenExpiresAt = expiresAtMs;
    this._scheduleTokenRefresh();
  }

  /**
   * Internal: extract exp (epoch ms) from a JWT payload without verifying it.
   * Browser-safe base64url decode (no Node Buffer). Returns null on failure.
   * @private
   */
  _expiryFromJwt(token) {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      let b64 = part.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const json = typeof atob === 'function'
        ? atob(b64)
        : Buffer.from(b64, 'base64').toString('binary');
      const payload = JSON.parse(json);
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Internal: schedule a one-shot refresh that re-mints the token shortly before
   * it expires and swaps it into the live socket handshake auth in place, with no
   * reconnect. Emits 'token_refreshed' on success, 'error' on failure. (FEAT-2026-0824-0040)
   * @private
   */
  _scheduleTokenRefresh() {
    if (this._tokenRefreshTimer) {
      clearTimeout(this._tokenRefreshTimer);
      this._tokenRefreshTimer = null;
    }
    if (!this._tokenExpiresAt) return;

    const lead = this.config.tokenRefreshLeadMs;
    const delay = this._tokenExpiresAt - Date.now() - lead;
    if (delay <= 0) return; // Too close to expiry to usefully schedule; next connect re-resolves.

    this._tokenRefreshTimer = setTimeout(async () => {
      try {
        await this._resolveToken();
        if (this.socket) {
          this.socket.auth = { ...this.socket.auth, token: this._token };
        }
        this.emit('token_refreshed', { expiresAt: this._tokenExpiresAt });
      } catch (error) {
        this.emit('error', error);
      }
    }, delay);

    // Don't keep the Node process alive just for a refresh timer (no-op in browser).
    if (this._tokenRefreshTimer && typeof this._tokenRefreshTimer.unref === 'function') {
      this._tokenRefreshTimer.unref();
    }
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

// Enhanced-feature broadcast events the worker delivers to other members of a room.
// Forwarded onto the client event surface so apps can subscribe with client.on(name).
OddSockets.ENHANCED_BROADCAST_EVENTS = [
  'reaction_added', 'reaction_removed',
  'user_typing', 'user_stopped_typing',
  'user_read', 'unread_count_updated', 'all_marked_read',
  'thread_reply', 'thread_subscribed', 'thread_followed', 'thread_unfollowed', 'thread_read_updated',
  'message_edited', 'message_deleted', 'message_pinned', 'message_unpinned',
  'user_status_changed', 'custom_status_updated', 'custom_status_cleared', 'dnd_status_changed', 'status_updated',
  'file_upload_completed', 'file_upload_progress', 'file_upload_failed',
  'dm_created', 'dm_received',
  'notification', 'notification_read', 'all_notifications_read', 'notifications_cleared',
  'channel_created', 'channel_updated', 'user_invited', 'user_joined_channel', 'user_left_channel', 'user_removed',
  'challenge_progress', 'leaderboard_rank_change', 'challenge_complete', 'achievement_unlock', 'achievement_progress',
  'challenge_invited', 'challenge_reply_received', 'challenge_invite_cancelled'
];

module.exports = OddSockets;
