/**
 * OddSockets SDK - Enhanced Features Usage Example
 * Demonstrates all 67 new Slack-like events
 */

const OddSockets = require('../src/index');

// Initialize client
const client = new OddSockets({
  apiKey: 'your_api_key_here',
  userId: 'user_123'
});

// Wait for connection
client.on('connected', async () => {
  console.log('✅ Connected to OddSockets!');
  
  try {
    // ==================== THREAD EVENTS ====================
    console.log('\n📝 Thread Events:');
    
    // Reply to a message in a thread
    const threadReply = await client.enhanced.threadReply({
      channel: 'general',
      parentMessageId: 'msg_123',
      message: 'This is a threaded reply!',
      userId: 'user_123',
      userName: 'John Doe'
    });
    console.log('Thread reply created:', threadReply);
    
    // Get thread with all replies
    const thread = await client.enhanced.getThread('thread_123');
    console.log('Thread data:', thread);
    
    // Subscribe to thread updates
    await client.enhanced.subscribeThread('thread_123', 'user_123');
    
    // Mark thread as read
    client.enhanced.markThreadRead('thread_123', 'user_123');
    
    // Follow/unfollow thread
    client.enhanced.followThread('thread_123', 'user_123');
    
    // ==================== REACTION EVENTS ====================
    console.log('\n😀 Reaction Events:');
    
    // Add reaction to message
    client.enhanced.addReaction({
      messageId: 'msg_123',
      channel: 'general',
      emoji: '👍',
      userId: 'user_123',
      userName: 'John Doe'
    });
    
    // Remove reaction
    client.enhanced.removeReaction({
      messageId: 'msg_123',
      channel: 'general',
      emoji: '👍',
      userId: 'user_123'
    });
    
    // Get all reactions for a message
    const reactions = await client.enhanced.getReactions('msg_123');
    console.log('Message reactions:', reactions);
    
    // ==================== READ RECEIPT EVENTS ====================
    console.log('\n✓ Read Receipt Events:');
    
    // Mark message as read
    client.enhanced.markRead({
      messageId: 'msg_123',
      channel: 'general',
      userId: 'user_123',
      userName: 'John Doe'
    });
    
    // Get unread counts
    const unreadCounts = await client.enhanced.getUnreadCounts('user_123', ['general', 'random']);
    console.log('Unread counts:', unreadCounts);
    
    // Mark all messages in channel as read
    client.enhanced.markAllRead('general', 'user_123');
    
    // ==================== CHANNEL EVENTS ====================
    console.log('\n📢 Channel Events:');
    
    // Create a new channel
    const newChannel = await client.enhanced.createChannel({
      name: 'new-channel',
      type: 'public',
      description: 'A new channel for testing',
      topic: 'Testing enhanced features',
      createdBy: 'user_123',
      createdByName: 'John Doe',
      members: [
        { userId: 'user_456', userName: 'Jane Smith' }
      ]
    });
    console.log('Channel created:', newChannel);
    
    // Update channel
    client.enhanced.updateChannel({
      channelId: 'channel_123',
      updates: {
        description: 'Updated description',
        topic: 'New topic'
      },
      userId: 'user_123'
    });
    
    // Join a public channel
    client.enhanced.joinChannel({
      channelId: 'channel_123',
      userId: 'user_123',
      userName: 'John Doe'
    });
    
    // Get channel members
    const members = await client.enhanced.getChannelMembers('channel_123');
    console.log('Channel members:', members);
    
    // Invite user to channel
    client.enhanced.inviteToChannel({
      channelId: 'channel_123',
      invitedUserId: 'user_789',
      invitedUserName: 'Bob Wilson',
      invitedBy: 'user_123'
    });
    
    // ==================== DIRECT MESSAGE EVENTS ====================
    console.log('\n💬 Direct Message Events:');
    
    // Create DM conversation
    const dmConversation = await client.enhanced.createDM({
      userIds: ['user_123', 'user_456'],
      type: '1-on-1'
    });
    console.log('DM conversation:', dmConversation);
    
    // Send DM
    client.enhanced.sendDM({
      conversationId: dmConversation.conversationId,
      message: 'Hello! This is a direct message.',
      userId: 'user_123',
      userName: 'John Doe'
    });
    
    // Get user's DM conversations
    const conversations = await client.enhanced.getDMConversations('user_123');
    console.log('DM conversations:', conversations);
    
    // ==================== NOTIFICATION EVENTS ====================
    console.log('\n🔔 Notification Events:');
    
    // Subscribe to notifications
    client.enhanced.subscribeNotifications('user_123');
    
    // Get notifications
    const notifications = await client.enhanced.getNotifications({
      userId: 'user_123',
      limit: 50,
      status: 'unread'
    });
    console.log('Notifications:', notifications);
    
    // Mark notification as read
    client.enhanced.markNotificationRead('notif_123', 'user_123');
    
    // Mark all notifications as read
    client.enhanced.markAllNotificationsRead('user_123');
    
    // ==================== FILE UPLOAD EVENTS ====================
    console.log('\n📎 File Upload Events:');
    
    // Start file upload
    const upload = await client.enhanced.startFileUpload({
      fileName: 'document.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      channel: 'general',
      userId: 'user_123',
      userName: 'John Doe'
    });
    console.log('Upload started:', upload);
    
    // Update progress
    client.enhanced.uploadProgress({
      uploadId: upload.uploadId,
      bytesUploaded: 512000,
      channel: 'general'
    });
    
    // Complete upload
    client.enhanced.uploadComplete({
      uploadId: upload.uploadId,
      fileId: 'file_456',
      storageInfo: {
        url: 'https://cdn.example.com/file.pdf',
        bucket: 'uploads',
        key: 'files/file.pdf'
      },
      channel: 'general'
    });
    
    // ==================== PRESENCE EVENTS ====================
    console.log('\n👤 Presence Events:');
    
    // Set user status
    client.enhanced.setStatus('user_123', 'online');
    
    // Set custom status
    client.enhanced.setCustomStatus({
      userId: 'user_123',
      emoji: '🏖️',
      text: 'On vacation',
      expiresAt: '2025-01-15T00:00:00Z'
    });
    
    // Clear custom status
    client.enhanced.clearCustomStatus('user_123');
    
    // Enable Do Not Disturb
    client.enhanced.setDND('user_123', '2025-01-10T18:00:00Z');
    
    // Start typing indicator
    client.enhanced.startTyping('user_123', 'general');
    
    // Stop typing after 3 seconds
    setTimeout(() => {
      client.enhanced.stopTyping('user_123', 'general');
    }, 3000);
    
    // Get user presence
    const presence = await client.enhanced.getUserPresence(['user_123', 'user_456']);
    console.log('User presence:', presence);
    
    // ==================== MESSAGE EDITING EVENTS ====================
    console.log('\n✏️ Message Editing Events:');
    
    // Edit message
    client.enhanced.editMessage({
      messageId: 'msg_123',
      channel: 'general',
      newContent: 'Updated message content',
      userId: 'user_123'
    });
    
    // Delete message
    client.enhanced.deleteMessage({
      messageId: 'msg_456',
      channel: 'general',
      userId: 'user_123'
    });
    
    // Pin message
    client.enhanced.pinMessage({
      messageId: 'msg_789',
      channel: 'general',
      userId: 'user_123'
    });
    
    // Get pinned messages
    const pinnedMessages = await client.enhanced.getPinnedMessages('general');
    console.log('Pinned messages:', pinnedMessages);
    
    // Unpin message
    client.enhanced.unpinMessage({
      messageId: 'msg_789',
      channel: 'general',
      userId: 'user_123'
    });
    
    // ==================== SEARCH EVENTS ====================
    console.log('\n🔍 Search Events:');
    
    // Search messages across all channels
    const searchResults = await client.enhanced.searchMessages({
      query: 'important',
      limit: 50,
      userId: 'user_123'
    });
    console.log('Search results:', searchResults);
    
    // Filter messages by criteria
    const filterResults = await client.enhanced.filterMessages({
      channel: 'general',
      userId: 'user_123',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-10T00:00:00Z',
      hasAttachments: true,
      limit: 50
    });
    console.log('Filter results:', filterResults);
    
    // Search in specific channel
    const channelSearch = await client.enhanced.searchInChannel({
      channel: 'general',
      query: 'meeting',
      limit: 50
    });
    console.log('Channel search results:', channelSearch);
    
    // Search by user
    const userSearch = await client.enhanced.searchByUser({
      userId: 'user_456',
      query: 'project',
      limit: 50
    });
    console.log('User search results:', userSearch);
    
    console.log('\n✅ All enhanced features demonstrated!');
    
  } catch (error) {
    console.error('Error:', error);
  }
});

// Listen for enhanced event broadcasts
client.on('connected', () => {
  const socket = client._getSocket();
  
  // Thread events
  socket.on('new_thread_reply', (data) => {
    console.log('New thread reply:', data);
  });
  
  // Reaction events
  socket.on('reaction_added', (data) => {
    console.log('Reaction added:', data);
  });
  
  socket.on('reaction_removed', (data) => {
    console.log('Reaction removed:', data);
  });
  
  // Read receipt events
  socket.on('message_read', (data) => {
    console.log('Message read:', data);
  });
  
  // Channel events
  socket.on('channel_created', (data) => {
    console.log('Channel created:', data);
  });
  
  socket.on('user_joined_channel', (data) => {
    console.log('User joined channel:', data);
  });
  
  // DM events
  socket.on('dm_received', (data) => {
    console.log('DM received:', data);
  });
  
  // Notification events
  socket.on('notification', (data) => {
    console.log('New notification:', data);
  });
  
  // File upload events
  socket.on('file_upload_completed', (data) => {
    console.log('File upload completed:', data);
  });
  
  // Presence events
  socket.on('user_status_changed', (data) => {
    console.log('User status changed:', data);
  });
  
  socket.on('user_typing', (data) => {
    console.log('User typing:', data);
  });
  
  socket.on('custom_status_updated', (data) => {
    console.log('Custom status updated:', data);
  });
  
  // Message editing events
  socket.on('message_edited', (data) => {
    console.log('Message edited:', data);
  });
  
  socket.on('message_deleted', (data) => {
    console.log('Message deleted:', data);
  });
  
  socket.on('message_pinned', (data) => {
    console.log('Message pinned:', data);
  });
});

// Handle errors
client.on('error', (error) => {
  console.error('OddSockets error:', error);
});

// Handle disconnection
client.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
});
