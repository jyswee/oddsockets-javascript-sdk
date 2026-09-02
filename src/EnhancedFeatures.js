/**
 * Enhanced Features for OddSockets SDK
 * Provides methods for all 67 new Slack-like events
 */

class EnhancedFeatures {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get socket instance
   * @private
   */
  _getSocket() {
    if (!this.client._isConnected()) {
      throw new Error('Not connected to OddSockets');
    }
    return this.client._getSocket();
  }

  // ==================== THREAD EVENTS ====================

  /**
   * Reply to a message in a thread
   * @param {Object} params - Thread reply parameters
   * @param {string} params.channel - Channel name
   * @param {string} params.parentMessageId - Parent message ID
   * @param {string} params.message - Reply message
   * @param {string} params.userId - User ID
   * @param {string} params.userName - User name
   * @returns {Promise<Object>} Reply result
   */
  threadReply(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('thread_reply', params);
      
      socket.once('thread_reply_success', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'thread_reply') reject(new Error(error.message));
      });
    });
  }

  /**
   * Get thread with all replies
   * @param {string} threadId - Thread ID
   * @returns {Promise<Object>} Thread data
   */
  getThread(threadId) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('get_thread', { threadId });
      
      socket.once('thread_data', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'get_thread') reject(new Error(error.message));
      });
    });
  }

  /**
   * Subscribe to thread updates
   * @param {string} threadId - Thread ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Subscription result
   */
  subscribeThread(threadId, userId) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('subscribe_thread', { threadId, userId });
      
      socket.once('thread_subscribed', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'subscribe_thread') reject(new Error(error.message));
      });
    });
  }

  /**
   * Mark thread as read
   * @param {string} threadId - Thread ID
   * @param {string} userId - User ID
   */
  markThreadRead(threadId, userId) {
    const socket = this._getSocket();
    socket.emit('mark_thread_read', { threadId, userId });
  }

  /**
   * Follow a thread
   * @param {string} threadId - Thread ID
   * @param {string} userId - User ID
   */
  followThread(threadId, userId) {
    const socket = this._getSocket();
    socket.emit('follow_thread', { threadId, userId });
  }

  /**
   * Unfollow a thread
   * @param {string} threadId - Thread ID
   * @param {string} userId - User ID
   */
  unfollowThread(threadId, userId) {
    const socket = this._getSocket();
    socket.emit('unfollow_thread', { threadId, userId });
  }

  // ==================== REACTION EVENTS ====================

  /**
   * Add reaction to a message
   * @param {Object} params - Reaction parameters
   * @param {string} params.messageId - Message ID
   * @param {string} params.channel - Channel name
   * @param {string} params.emoji - Emoji to add
   * @param {string} params.userId - User ID
   * @param {string} params.userName - User name
   */
  addReaction(params) {
    const socket = this._getSocket();
    socket.emit('add_reaction', params);
  }

  /**
   * Remove reaction from a message
   * @param {Object} params - Reaction parameters
   * @param {string} params.messageId - Message ID
   * @param {string} params.channel - Channel name
   * @param {string} params.emoji - Emoji to remove
   * @param {string} params.userId - User ID
   */
  removeReaction(params) {
    const socket = this._getSocket();
    socket.emit('remove_reaction', params);
  }

  /**
   * Get all reactions for a message
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Reactions data
   */
  getReactions(messageId) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('get_reactions', { messageId });
      
      socket.once('message_reactions', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'get_reactions') reject(new Error(error.message));
      });
    });
  }

  // ==================== READ RECEIPT EVENTS ====================

  /**
   * Mark message as read
   * @param {Object} params - Read receipt parameters
   * @param {string} params.messageId - Message ID
   * @param {string} params.channel - Channel name
   * @param {string} params.userId - User ID
   * @param {string} params.userName - User name
   */
  markRead(params) {
    const socket = this._getSocket();
    socket.emit('mark_read', params);
  }

  /**
   * Get unread counts for channels
   * @param {string} userId - User ID
   * @param {Array<string>} channels - Channel names
   * @returns {Promise<Object>} Unread counts
   */
  getUnreadCounts(userId, channels) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('get_unread_counts', { userId, channels });
      
      socket.once('unread_counts', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'get_unread_counts') reject(new Error(error.message));
      });
    });
  }

  /**
   * Mark all messages in channel as read
   * @param {string} channel - Channel name
   * @param {string} userId - User ID
   */
  markAllRead(channel, userId) {
    const socket = this._getSocket();
    socket.emit('mark_all_read', { channel, userId });
  }

  // ==================== CHANNEL EVENTS ====================

  /**
   * Create a new channel
   * @param {Object} params - Channel parameters
   * @param {string} params.name - Channel name
   * @param {string} params.type - Channel type ('public' or 'private')
   * @param {string} params.description - Channel description
   * @param {string} params.topic - Channel topic
   * @param {string} params.createdBy - Creator user ID
   * @param {string} params.createdByName - Creator user name
   * @param {Array} [params.members] - Initial members
   * @returns {Promise<Object>} Created channel
   */
  createChannel(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('create_channel', params);
      
      socket.once('channel_create_success', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'create_channel') reject(new Error(error.message));
      });
    });
  }

  /**
   * Update channel details
   * @param {Object} params - Update parameters
   * @param {string} params.channelId - Channel ID
   * @param {Object} params.updates - Updates to apply
   * @param {string} params.userId - User ID
   */
  updateChannel(params) {
    const socket = this._getSocket();
    socket.emit('update_channel', params);
  }

  /**
   * Archive a channel
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   */
  archiveChannel(channelId, userId) {
    const socket = this._getSocket();
    socket.emit('archive_channel', { channelId, userId });
  }

  /**
   * Invite user to channel
   * @param {Object} params - Invite parameters
   * @param {string} params.channelId - Channel ID
   * @param {string} params.invitedUserId - Invited user ID
   * @param {string} params.invitedUserName - Invited user name
   * @param {string} params.invitedBy - Inviter user ID
   */
  inviteToChannel(params) {
    const socket = this._getSocket();
    socket.emit('invite_to_channel', params);
  }

  /**
   * Remove user from channel
   * @param {Object} params - Remove parameters
   * @param {string} params.channelId - Channel ID
   * @param {string} params.removedUserId - User ID to remove
   * @param {string} params.removedBy - Remover user ID
   */
  removeFromChannel(params) {
    const socket = this._getSocket();
    socket.emit('remove_from_channel', params);
  }

  /**
   * Join a public channel
   * @param {Object} params - Join parameters
   * @param {string} params.channelId - Channel ID
   * @param {string} params.userId - User ID
   * @param {string} params.userName - User name
   */
  joinChannel(params) {
    const socket = this._getSocket();
    socket.emit('join_channel', params);
  }

  /**
   * Leave a channel
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   */
  leaveChannel(channelId, userId) {
    const socket = this._getSocket();
    socket.emit('leave_channel', { channelId, userId });
  }

  /**
   * Get channel members
   * @param {string} channelId - Channel ID
   * @returns {Promise<Object>} Channel members
   */
  getChannelMembers(channelId) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('get_channel_members', { channelId });
      
      socket.once('channel_members', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'get_channel_members') reject(new Error(error.message));
      });
    });
  }

  // ==================== DIRECT MESSAGE EVENTS ====================

  /**
   * Create or get DM conversation
   * @param {Object} params - DM parameters
   * @param {Array<string>} params.userIds - User IDs
   * @param {string} [params.type] - Type ('1-on-1' or 'group')
   * @param {string} [params.groupName] - Group name for group DMs
   * @returns {Promise<Object>} DM conversation
   */
  createDM(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('create_dm', params);
      
      socket.once('dm_create_success', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'create_dm') reject(new Error(error.message));
      });
    });
  }

  /**
   * Send direct message
   * @param {Object} params - DM parameters
   * @param {string} params.conversationId - Conversation ID
   * @param {string} params.message - Message content
   * @param {string} params.userId - User ID
   * @param {string} params.userName - User name
   */
  sendDM(params) {
    const socket = this._getSocket();
    socket.emit('send_dm', params);
  }

  /**
   * Get user's DM conversations
   * @param {string} userId - User ID
   * @param {boolean} [includeArchived] - Include archived conversations
   * @returns {Promise<Object>} DM conversations
   */
  getDMConversations(userId, includeArchived = false) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('get_dm_conversations', { userId, includeArchived });
      
      socket.once('dm_conversations', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'get_dm_conversations') reject(new Error(error.message));
      });
    });
  }

  // ==================== NOTIFICATION EVENTS ====================

  /**
   * Subscribe to user notifications
   * @param {string} userId - User ID
   */
  subscribeNotifications(userId) {
    const socket = this._getSocket();
    socket.emit('subscribe_notifications', { userId });
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   */
  markNotificationRead(notificationId, userId) {
    const socket = this._getSocket();
    socket.emit('mark_notification_read', { notificationId, userId });
  }

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   */
  markAllNotificationsRead(userId) {
    const socket = this._getSocket();
    socket.emit('mark_all_notifications_read', { userId });
  }

  /**
   * Clear all notifications
   * @param {string} userId - User ID
   */
  clearNotifications(userId) {
    const socket = this._getSocket();
    socket.emit('clear_notifications', { userId });
  }

  /**
   * Get user notifications
   * @param {Object} params - Query parameters
   * @param {string} params.userId - User ID
   * @param {number} [params.limit] - Limit
   * @param {string} [params.status] - Status filter
   * @returns {Promise<Object>} Notifications
   */
  getNotifications(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('get_notifications', params);
      
      socket.once('notifications_data', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'get_notifications') reject(new Error(error.message));
      });
    });
  }

  // ==================== FILE UPLOAD EVENTS ====================

  /**
   * Start file upload
   * @param {Object} params - Upload parameters
   * @param {string} params.fileName - File name
   * @param {number} params.fileSize - File size in bytes
   * @param {string} params.mimeType - MIME type
   * @param {string} params.channel - Channel name
   * @param {string} params.userId - User ID
   * @param {string} params.userName - User name
   * @returns {Promise<Object>} Upload info
   */
  startFileUpload(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('start_file_upload', params);
      
      socket.once('upload_started', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'start_file_upload') reject(new Error(error.message));
      });
    });
  }

  /**
   * Update upload progress
   * @param {Object} params - Progress parameters
   * @param {string} params.uploadId - Upload ID
   * @param {number} params.bytesUploaded - Bytes uploaded
   * @param {string} [params.channel] - Channel name
   */
  uploadProgress(params) {
    const socket = this._getSocket();
    socket.emit('upload_progress', params);
  }

  /**
   * Complete file upload
   * @param {Object} params - Completion parameters
   * @param {string} params.uploadId - Upload ID
   * @param {string} params.fileId - File ID
   * @param {Object} params.storageInfo - Storage information
   * @param {string} [params.channel] - Channel name
   * @param {string} [params.messageId] - Message ID
   */
  uploadComplete(params) {
    const socket = this._getSocket();
    socket.emit('upload_complete', params);
  }

  // ==================== PRESENCE EVENTS ====================

  /**
   * Set user status
   * @param {string} userId - User ID
   * @param {string} status - Status ('online', 'away', 'dnd', 'offline')
   */
  setStatus(userId, status) {
    const socket = this._getSocket();
    socket.emit('set_status', { userId, status });
  }

  /**
   * Set custom status
   * @param {Object} params - Status parameters
   * @param {string} params.userId - User ID
   * @param {string} params.emoji - Status emoji
   * @param {string} params.text - Status text
   * @param {string} [params.expiresAt] - Expiration date
   */
  setCustomStatus(params) {
    const socket = this._getSocket();
    socket.emit('set_custom_status', params);
  }

  /**
   * Clear custom status
   * @param {string} userId - User ID
   */
  clearCustomStatus(userId) {
    const socket = this._getSocket();
    socket.emit('clear_custom_status', { userId });
  }

  /**
   * Enable Do Not Disturb
   * @param {string} userId - User ID
   * @param {string} [until] - Until date
   */
  setDND(userId, until) {
    const socket = this._getSocket();
    socket.emit('set_dnd', { userId, until });
  }

  /**
   * Disable Do Not Disturb
   * @param {string} userId - User ID
   */
  clearDND(userId) {
    const socket = this._getSocket();
    socket.emit('clear_dnd', { userId });
  }

  /**
   * Start typing indicator
   * @param {string} userId - User ID
   * @param {string} channel - Channel name
   */
  startTyping(userId, channel) {
    const socket = this._getSocket();
    socket.emit('start_typing', { userId, channel });
  }

  /**
   * Stop typing indicator
   * @param {string} userId - User ID
   * @param {string} channel - Channel name
   */
  stopTyping(userId, channel) {
    const socket = this._getSocket();
    socket.emit('stop_typing', { userId, channel });
  }

  /**
   * Get user presence information
   * @param {Array<string>} userIds - User IDs
   * @returns {Promise<Object>} Presence data
   */
  getUserPresence(userIds) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('get_user_presence', { userIds });
      
      socket.once('user_presence_data', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'get_user_presence') reject(new Error(error.message));
      });
    });
  }

  // ==================== MESSAGE EDITING EVENTS ====================

  /**
   * Edit a message
   * @param {Object} params - Edit parameters
   * @param {string} params.messageId - Message ID
   * @param {string} params.channel - Channel name
   * @param {string} params.newContent - New message content
   * @param {string} params.userId - User ID
   */
  editMessage(params) {
    const socket = this._getSocket();
    socket.emit('edit_message', params);
  }

  /**
   * Delete a message
   * @param {Object} params - Delete parameters
   * @param {string} params.messageId - Message ID
   * @param {string} params.channel - Channel name
   * @param {string} params.userId - User ID
   */
  deleteMessage(params) {
    const socket = this._getSocket();
    socket.emit('delete_message', params);
  }

  /**
   * Pin message to channel
   * @param {Object} params - Pin parameters
   * @param {string} params.messageId - Message ID
   * @param {string} params.channel - Channel name
   * @param {string} params.userId - User ID
   */
  pinMessage(params) {
    const socket = this._getSocket();
    socket.emit('pin_message', params);
  }

  /**
   * Unpin message from channel
   * @param {Object} params - Unpin parameters
   * @param {string} params.messageId - Message ID
   * @param {string} params.channel - Channel name
   * @param {string} params.userId - User ID
   */
  unpinMessage(params) {
    const socket = this._getSocket();
    socket.emit('unpin_message', params);
  }

  /**
   * Get pinned messages in channel
   * @param {string} channel - Channel name
   * @returns {Promise<Object>} Pinned messages
   */
  getPinnedMessages(channel) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('get_pinned_messages', { channel });
      
      socket.once('pinned_messages', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'get_pinned_messages') reject(new Error(error.message));
      });
    });
  }

  // ==================== SEARCH EVENTS ====================

  /**
   * Search messages across all channels
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {number} [params.limit] - Result limit
   * @param {string} params.userId - User ID
   * @returns {Promise<Object>} Search results
   */
  searchMessages(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('search_messages', params);
      
      socket.once('search_results', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'search_messages') reject(new Error(error.message));
      });
    });
  }

  /**
   * Filter messages by criteria
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Filter results
   */
  filterMessages(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('filter_messages', params);
      
      socket.once('filter_results', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'filter_messages') reject(new Error(error.message));
      });
    });
  }

  /**
   * Search within specific channel
   * @param {Object} params - Search parameters
   * @param {string} params.channel - Channel name
   * @param {string} params.query - Search query
   * @param {number} [params.limit] - Result limit
   * @returns {Promise<Object>} Search results
   */
  searchInChannel(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();
      
      socket.emit('search_in_channel', params);
      
      socket.once('channel_search_results', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'search_in_channel') reject(new Error(error.message));
      });
    });
  }

  /**
   * Search messages by user
   * @param {Object} params - Search parameters
   * @param {string} params.userId - User ID
   * @param {string} [params.query] - Search query
   * @param {number} [params.limit] - Result limit
   * @returns {Promise<Object>} Search results
   */
  searchByUser(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();

      socket.emit('search_by_user', params);

      socket.once('user_search_results', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'search_by_user') reject(new Error(error.message));
      });
    });
  }

  // ==================== CHALLENGE / LEADERBOARD EVENTS ====================
  // Server-authoritative challenge lifecycle. Progress and completions land on
  // the shared room envelope so every member (and any partner resultWebhookUrl)
  // sees challenge_progress / leaderboard_rank_change / challenge_complete /
  // achievement_unlock — subscribe with client.on('leaderboard_rank_change', ...).

  /**
   * Create (register) a challenge run and its optional result-webhook target.
   * @param {Object} params
   * @param {string} params.challengeId - Unique challenge id
   * @param {string} params.metric - Metric being tracked (e.g. 'score')
   * @param {boolean} [params.ranked] - Ranked (leaderboard) vs unranked
   * @param {string} [params.channel] - Room to broadcast on (default challenge:<id>)
   * @param {string} [params.resultWebhookUrl] - Partner receiver for signed delivery
   * @param {string} [params.standingsUrl] - Public standings URL echoed on events
   * @param {number} [params.startedAt] - Start time (ms); defaults to server now
   * @returns {Promise<Object>} { challengeId, metric, ranked, startedAt, channel }
   */
  createChallenge(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();

      socket.emit('challenge_create', params);

      socket.once('challenge_create_success', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'challenge_create') reject(new Error(error.message));
      });
    });
  }

  /**
   * Report a progress value for the connected player. Fire-and-forget: the
   * server echoes challenge_progress (and leaderboard_rank_change if the player
   * moved) to the room, which arrives via client.on(...). Pass a stable eventId
   * to make retries idempotent.
   * @param {Object} params
   * @param {string} params.challengeId - Challenge id
   * @param {number} params.value - Finite progress value
   * @param {string} [params.metric] - Metric (used only to auto-open a run)
   * @param {string} [params.cohort] - Optional cohort tag
   * @param {string} [params.platform] - Optional platform tag
   * @param {string} [params.eventId] - Idempotency key for retries
   */
  reportProgress(params) {
    const socket = this._getSocket();
    socket.emit('challenge_progress', params);
  }

  /**
   * Complete the connected player's run. Resolves with the server-authoritative
   * result; the room also receives a challenge_complete broadcast.
   * @param {Object} params
   * @param {string} params.challengeId - Challenge id
   * @param {string} params.outcome - 'completed' | 'failed' | 'expired' | 'conceded' | 'tied'
   *   (chess/turn-based mapping: win=completed+rank1, loss=failed, draw=tied,
   *    resign=conceded, timeout=expired)
   * @param {*} [params.reward] - Optional reward payload echoed on the event
   * @param {string} [params.cohort] - Optional cohort tag
   * @param {string} [params.platform] - Optional platform tag
   * @param {string} [params.eventId] - Idempotency key for retries
   * @returns {Promise<Object>} { challengeId, outcome, finalValue, rank }
   */
  completeChallenge(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();

      socket.emit('challenge_complete', params);

      socket.once('challenge_complete_success', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'challenge_complete') reject(new Error(error.message));
      });
    });
  }

  /**
   * Report achievement progress or unlock. Fire-and-forget. Pass percentComplete
   * (0-100) for progressive achievements: <100 broadcasts achievement_progress
   * (status in_progress); >=100 or omitted broadcasts achievement_unlock (status
   * unlocked, banner). State is persisted server-side and queryable via
   * getAchievements(). Arrives on peers via client.on('achievement_progress'|
   * 'achievement_unlock', ...).
   * @param {Object} params
   * @param {string} params.achievementId - Achievement id (required)
   * @param {number} [params.percentComplete] - 0-100; omit for straight unlock
   * @param {string} [params.challengeId] - Optional owning challenge id
   * @param {string} [params.name] - Display name
   * @param {string} [params.tier] - Tier label
   * @param {*} [params.reward] - Optional reward payload
   * @param {string} [params.cohort] - Optional cohort tag
   * @param {string} [params.platform] - Optional platform tag
   * @param {string} [params.eventId] - Idempotency key for retries
   */
  unlockAchievement(params) {
    const socket = this._getSocket();
    socket.emit('achievement_unlock', params);
  }

  /**
   * Fetch server-ordered leaderboard standings for a ranked challenge (GameKit
   * loadEntries). Resolves with the top-N and the caller's own rank.
   * @param {Object} params
   * @param {string} params.challengeId - Challenge id
   * @param {number} [params.limit=20] - Max rows to return
   * @param {number} [params.offset=0] - Row offset (paging)
   * @returns {Promise<Object>} { challengeId, metric, standings:
   *   [{ identity, value, rank, cohort, platform }], yourRank }
   */
  getStandings(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();

      socket.emit('challenge_standings', params);

      socket.once('challenge_standings_success', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'challenge_standings') reject(new Error(error.message));
      });
    });
  }

  /**
   * Query persisted achievement state for the connected player (GameKit
   * loadAchievements). Pass achievementId to fetch a single one.
   * @param {Object} [params]
   * @param {string} [params.achievementId] - Optional single achievement id
   * @returns {Promise<Object>} { achievements:
   *   [{ achievementId, percentComplete, status, unlockedAt, name, tier }] }
   */
  getAchievements(params = {}) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();

      socket.emit('achievement_query', params);

      socket.once('achievement_state', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'achievement_query') reject(new Error(error.message));
      });
    });
  }

  /**
   * Send a directed 1:1 challenge/invite to a specific player (GameKit
   * sendChallenge). The invitee receives a challenge_invited event via
   * client.on('challenge_invited', ...); you resolve when the server persists it.
   * The invite is stored with a TTL so an offline player can pull it on reconnect
   * (getChallengeInvites). `type` is free-form ('match' | 'clan' | ...), so the
   * same primitive carries clan/party invites.
   * @param {Object} params
   * @param {string} params.toUserId - Recipient's user id (as seen in presence/roster)
   * @param {string} [params.type='match'] - Invite kind ('match' | 'clan' | ...)
   * @param {Object} [params.payload] - Arbitrary data (e.g. {matchId, seed, duration, mode}); <=8KB
   * @param {number} [params.ttl=300] - Seconds until the invite expires (max 7 days)
   * @param {string} [params.channel] - Optional match/room channel to carry
   * @param {string} [params.inviteId] - Optional caller-supplied id (else server assigns)
   * @returns {Promise<Object>} { inviteId, toUserId, type, status:'pending', expiresAt }
   */
  sendChallengeInvite(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();

      socket.emit('challenge_invite', params);

      socket.once('challenge_invite_success', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'challenge_invite') reject(new Error(error.message));
      });
    });
  }

  /**
   * Accept or decline a received invite. The original inviter is notified via
   * client.on('challenge_reply_received', ...).
   * @param {Object} params
   * @param {string} params.inviteId - The invite id from challenge_invited
   * @param {boolean} params.accept - true to accept, false to decline
   * @param {string} [params.reason] - Optional decline reason
   * @returns {Promise<Object>} { inviteId, accept, type, payload, channel }
   */
  replyChallengeInvite(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();

      socket.emit('challenge_reply', params);

      socket.once('challenge_reply_success', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'challenge_reply') reject(new Error(error.message));
      });
    });
  }

  /**
   * Cancel a pending invite you sent. The invitee is notified via
   * client.on('challenge_invite_cancelled', ...).
   * @param {Object} params
   * @param {string} params.inviteId - The invite id to cancel
   * @returns {Promise<Object>} { inviteId }
   */
  cancelChallengeInvite(params) {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();

      socket.emit('challenge_invite_cancel', params);

      socket.once('challenge_invite_cancel_success', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'challenge_invite_cancel') reject(new Error(error.message));
      });
    });
  }

  /**
   * Pull the connected player's still-pending invites (e.g. on reconnect).
   * @returns {Promise<Object>} { invites: [{ inviteId, fromUserId, fromIdentity,
   *   type, payload, status, channel, createdAt, expiresAt }] }
   */
  getChallengeInvites() {
    return new Promise((resolve, reject) => {
      const socket = this._getSocket();

      socket.emit('challenge_invites_query', {});

      socket.once('challenge_invites', (data) => resolve(data));
      socket.once('error', (error) => {
        if (error.event === 'challenge_invites_query') reject(new Error(error.message));
      });
    });
  }
}

module.exports = EnhancedFeatures;
