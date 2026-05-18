const OddSockets = require('../src/index');

/**
 * Basic OddSockets SDK Usage Example
 * 
 * This example demonstrates the core functionality of the OddSockets JavaScript SDK:
 * - Connecting to the platform
 * - Subscribing to channels
 * - Publishing messages
 * - Handling events
 */

async function basicExample() {
  console.log('🚀 Starting OddSockets Basic Example');
  
  // Create OddSockets client
  const client = new OddSockets({
    apiKey: 'ak_live_1234567890abcdef', // Replace with your API key
    userId: 'user123' // Optional: defaults to API key's user
  });
  
  // Listen for connection events
  client.on('connecting', () => {
    console.log('🔄 Connecting to OddSockets...');
  });
  
  client.on('connected', () => {
    console.log('✅ Connected to OddSockets!');
  });
  
  client.on('worker_assigned', (data) => {
    console.log('🎯 Assigned to worker:', data.workerId);
  });
  
  client.on('error', (error) => {
    console.error('❌ Connection error:', error.message);
  });
  
  client.on('disconnected', (reason) => {
    console.log('🔌 Disconnected:', reason);
  });
  
  // Wait for connection
  await new Promise(resolve => {
    if (client.getState() === 'connected') {
      resolve();
    } else {
      client.once('connected', resolve);
    }
  });
  
  // Get a channel
  const channel = client.channel('demo-channel');
  
  // Subscribe to the channel
  console.log('📡 Subscribing to demo-channel...');
  await channel.subscribe((message) => {
    console.log('📨 Received message:', {
      content: message.message,
      from: message.publisher?.userId,
      timestamp: message.timestamp
    });
  }, {
    enablePresence: true, // Enable presence tracking
    retainHistory: true   // Keep message history
  });
  
  console.log('✅ Subscribed to demo-channel');
  
  // Listen for presence events
  channel.on('presence_change', (data) => {
    console.log(`👤 User ${data.user.userId} ${data.action}ed the channel`);
  });
  
  // Publish some messages
  console.log('📤 Publishing messages...');
  
  // Simple text message
  await channel.publish('Hello, OddSockets!');
  
  // Object message
  await channel.publish({
    type: 'notification',
    title: 'Welcome!',
    body: 'Thanks for trying OddSockets',
    data: { userId: 'user123', timestamp: Date.now() }
  });
  
  // Message with metadata
  await channel.publish('This message has metadata', {
    ttl: 3600, // 1 hour TTL
    metadata: {
      priority: 'high',
      category: 'demo'
    }
  });
  
  console.log('✅ Messages published');
  
  // Test bulk publishing
  console.log('📦 Testing bulk publishing...');
  const bulkMessages = [
    { channel: 'demo-channel', message: 'Bulk message 1' },
    { channel: 'demo-channel', message: 'Bulk message 2' },
    { channel: 'demo-channel', message: { type: 'bulk', content: 'Bulk message 3' } }
  ];
  
  const bulkResults = await client.publishBulk(bulkMessages);
  const successful = bulkResults.filter(r => r.success).length;
  console.log(`✅ Bulk published ${successful}/${bulkMessages.length} messages successfully`);
  
  // Get message history
  console.log('📚 Fetching message history...');
  const history = await channel.getHistory({ count: 10 });
  console.log(`📖 Found ${history.length} messages in history`);
  
  // Get presence information
  console.log('👥 Fetching presence information...');
  const presence = await channel.getPresence();
  console.log(`👤 ${presence.occupancy} users in channel`);
  
  // Update user state
  console.log('🔄 Updating user state...');
  await channel.updateState({
    status: 'online',
    mood: 'excited',
    lastActive: new Date().toISOString()
  });
  
  console.log('✅ User state updated');
  
  // Keep the example running for a bit to see events
  console.log('⏳ Keeping connection alive for 30 seconds...');
  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    client.disconnect();
    console.log('👋 Example completed!');
    process.exit(0);
  }, 30000);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the example
basicExample().catch(console.error);
