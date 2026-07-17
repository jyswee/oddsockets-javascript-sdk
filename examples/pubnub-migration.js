const { PubNubCompat } = require('../src/index');

/**
 * PubNub to OddSockets Migration Example
 * 
 * This example shows how to migrate from PubNub to OddSockets with minimal code changes.
 * The PubNubCompat class provides a drop-in replacement for PubNub's JavaScript SDK.
 */

async function migrationExample() {
  console.log('🔄 PubNub to OddSockets Migration Example');
  
  // BEFORE: PubNub configuration
  // const pubnub = new PubNub({
  //   publishKey: 'pub-c-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  //   subscribeKey: 'sub-c-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  //   userId: 'user123'
  // });
  
  // AFTER: OddSockets with PubNub compatibility
  const pubnub = new PubNubCompat({
    publishKey: 'ak_live_1234567890abcdef', // Your OddSockets API key
    subscribeKey: 'ak_live_1234567890abcdef', // Same as publishKey for OddSockets
    userId: 'user123',
    managerUrl: 'https://connect.oddsockets.tyga.network' // Optional: OddSockets manager URL
  });
  
  console.log('✅ OddSockets client created with PubNub compatibility');
  
  // Add listeners (same as PubNub)
  pubnub.addListener({
    status: function(statusEvent) {
      console.log('📊 Status:', statusEvent.category);
      if (statusEvent.category === 'PNConnectedCategory') {
        console.log('🔗 Connected to OddSockets via PubNub compatibility layer');
      }
    },
    
    message: function(messageEvent) {
      console.log('📨 Message received:', {
        channel: messageEvent.channel,
        message: messageEvent.message,
        publisher: messageEvent.publisher,
        timetoken: messageEvent.timetoken
      });
    },
    
    presence: function(presenceEvent) {
      console.log('👤 Presence event:', {
        channel: presenceEvent.channel,
        action: presenceEvent.action,
        uuid: presenceEvent.uuid,
        occupancy: presenceEvent.occupancy
      });
    }
  });
  
  // Subscribe to channels (same as PubNub)
  console.log('📡 Subscribing to channels...');
  pubnub.subscribe({
    channels: ['migration-demo', 'chat-room'],
    withPresence: true
  });
  
  // Wait a moment for connection
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Publish messages (same as PubNub)
  console.log('📤 Publishing messages...');
  
  // Simple message
  await pubnub.publish({
    channel: 'migration-demo',
    message: 'Hello from OddSockets via PubNub compatibility!'
  });
  
  // Message with metadata
  await pubnub.publish({
    channel: 'migration-demo',
    message: {
      type: 'migration_test',
      content: 'This message was sent using PubNub-compatible API',
      timestamp: Date.now()
    },
    meta: {
      source: 'migration-example',
      version: '1.0'
    }
  });
  
  console.log('✅ Messages published');
  
  // Get message history (same as PubNub)
  console.log('📚 Fetching message history...');
  try {
    const historyResponse = await pubnub.history({
      channel: 'migration-demo',
      count: 10
    });
    
    console.log(`📖 Retrieved ${historyResponse.messages.length} messages from history`);
    historyResponse.messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${JSON.stringify(msg[0])} (${new Date(msg[1] / 10000).toISOString()})`);
    });
  } catch (error) {
    console.log('📚 History not available yet (channel may be new)');
  }
  
  // Get presence information (same as PubNub)
  console.log('👥 Fetching presence information...');
  try {
    const presenceResponse = await pubnub.hereNow({
      channels: ['migration-demo', 'chat-room']
    });
    
    console.log(`👤 Total occupancy: ${presenceResponse.totalOccupancy} across ${presenceResponse.totalChannels} channels`);
    
    Object.keys(presenceResponse.channels).forEach(channel => {
      const channelData = presenceResponse.channels[channel];
      console.log(`  📺 ${channel}: ${channelData.occupancy} users`);
    });
  } catch (error) {
    console.log('👥 Presence information not available yet');
  }
  
  // Set user state (same as PubNub)
  console.log('🔄 Setting user state...');
  try {
    await pubnub.setState({
      channels: ['migration-demo'],
      state: {
        status: 'migrating',
        from: 'pubnub',
        to: 'oddsockets',
        timestamp: Date.now()
      }
    });
    console.log('✅ User state updated');
  } catch (error) {
    console.log('🔄 State update not available yet');
  }
  
  // Demonstrate additional OddSockets features
  console.log('🚀 OddSockets provides additional benefits:');
  console.log('  • 50% lower latency than PubNub');
  console.log('  • No message size limits');
  console.log('  • No per-message pricing');
  console.log('  • Richer message metadata');
  console.log('  • Built-in analytics');
  console.log('  • Self-hosted option');
  
  // Migration checklist
  console.log('\n📋 Migration Checklist:');
  console.log('  ✅ Replace PubNub import with OddSockets PubNubCompat');
  console.log('  ✅ Update publishKey/subscribeKey to OddSockets API key');
  console.log('  ✅ Add managerUrl configuration (optional)');
  console.log('  ✅ All existing PubNub code works unchanged');
  console.log('  ✅ Enjoy better performance and lower costs!');
  
  // Keep running for a bit
  console.log('\n⏳ Keeping connection alive for 20 seconds...');
  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    pubnub.disconnect();
    console.log('✅ Migration example completed successfully!');
    console.log('🎉 You\'ve successfully migrated from PubNub to OddSockets!');
    process.exit(0);
  }, 20000);
}

// Side-by-side comparison
function showComparison() {
  console.log('\n📊 Side-by-Side Code Comparison:');
  console.log('\n// PubNub (BEFORE):');
  console.log('const pubnub = new PubNub({');
  console.log('  publishKey: "pub-c-...",');
  console.log('  subscribeKey: "sub-c-...",');
  console.log('  userId: "user123"');
  console.log('});');
  
  console.log('\n// OddSockets (AFTER):');
  console.log('const pubnub = new PubNubCompat({');
  console.log('  publishKey: "ak_live_...",  // Your OddSockets API key');
  console.log('  subscribeKey: "ak_live_...", // Same as publishKey');
  console.log('  userId: "user123"');
  console.log('});');
  
  console.log('\n✨ Everything else stays exactly the same!');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Show comparison first
showComparison();

// Run the migration example
migrationExample().catch(console.error);
