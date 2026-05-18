const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger-config');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Custom CSS for OddSockets branding
const customCss = `
  .swagger-ui .topbar { 
    background-color: #1a1a2e; 
    border-bottom: 3px solid #16213e;
  }
  .swagger-ui .topbar .download-url-wrapper { 
    display: none; 
  }
  .swagger-ui .info .title {
    color: #4f46e5;
  }
  .swagger-ui .scheme-container {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 15px;
    margin: 20px 0;
  }
  .swagger-ui .info .description p {
    font-size: 14px;
    line-height: 1.6;
  }
  .swagger-ui .info .description h2 {
    color: #1e293b;
    border-bottom: 2px solid #4f46e5;
    padding-bottom: 5px;
  }
  .swagger-ui .info .description h3 {
    color: #475569;
  }
  .swagger-ui .opblock.opblock-post {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
  }
  .swagger-ui .opblock.opblock-post .opblock-summary {
    border-color: #10b981;
  }
  .swagger-ui .opblock.opblock-get {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }
  .swagger-ui .opblock.opblock-get .opblock-summary {
    border-color: #3b82f6;
  }
  .swagger-ui .btn.authorize {
    background-color: #4f46e5;
    border-color: #4f46e5;
  }
  .swagger-ui .btn.authorize:hover {
    background-color: #4338ca;
    border-color: #4338ca;
  }
  .swagger-ui .highlight-code {
    background: #1e293b;
  }
  .swagger-ui .highlight-code .hljs {
    background: #1e293b;
    color: #e2e8f0;
  }
`;

// Swagger UI options
const swaggerOptions = {
  customCss: customCss,
  customSiteTitle: 'OddSockets JavaScript SDK Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
};

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// API routes for interactive examples
app.get('/api/sdk/info', (req, res) => {
  res.json({
    name: '@oddsockets/javascript-sdk',
    version: '1.0.0',
    description: 'Official JavaScript SDK for OddSockets real-time messaging',
    features: [
      'Automatic load balancing (Manager → Worker)',
      'PubNub compatibility layer',
      'Real-time WebSocket messaging',
      'Presence tracking',
      'Message history',
      'Automatic failover',
      'Session stickiness'
    ],
    benefits: [
      '50% lower latency than PubNub',
      'No message size limits',
      'No per-message pricing',
      'Richer metadata support',
      'Built-in analytics',
      'Self-hosted option'
    ],
    installation: 'npm install @oddsockets/javascript-sdk',
    repository: 'https://github.com/oddsockets/javascript-sdk',
    documentation: 'https://docs.oddsockets.com/sdks/javascript'
  });
});

// Mock SDK endpoints for demonstration
app.post('/sdk/client/create', (req, res) => {
  const { apiKey, managerUrl, userId, autoConnect, options } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({
      name: 'ConfigurationError',
      message: 'API key is required',
      code: 'MISSING_API_KEY'
    });
  }
  
  // Simulate client creation
  res.json({
    success: true,
    clientId: `client_${Math.random().toString(36).substr(2, 9)}`,
    state: autoConnect !== false ? 'connected' : 'disconnected',
    workerInfo: autoConnect !== false ? {
      workerId: 'worker-3000',
      workerUrl: 'https://worker-3000.oddsockets.com'
    } : null,
    config: {
      apiKey: apiKey.substring(0, 12) + '...',
      managerUrl: managerUrl || 'https://manager1.oddsockets.tyga.network',
      userId: userId || 'auto-generated',
      autoConnect: autoConnect !== false
    }
  });
});

app.post('/sdk/client/connect', (req, res) => {
  // Simulate connection process
  setTimeout(() => {
    res.json({
      success: true,
      state: 'connected',
      workerInfo: {
        workerId: 'worker-3000',
        workerUrl: 'https://worker-3000.oddsockets.com'
      },
      connectionTime: Math.floor(Math.random() * 2000) + 500
    });
  }, 1000);
});

app.post('/sdk/client/disconnect', (req, res) => {
  res.json({
    success: true,
    state: 'disconnected'
  });
});

app.get('/sdk/client/state', (req, res) => {
  res.json({
    state: 'connected',
    workerInfo: {
      workerId: 'worker-3000',
      workerUrl: 'https://worker-3000.oddsockets.com'
    },
    uptime: Math.floor(Math.random() * 300000) + 10000
  });
});

app.post('/sdk/channel/subscribe', (req, res) => {
  const { channel, options } = req.body;
  
  if (!channel) {
    return res.status(400).json({
      name: 'ValidationError',
      message: 'Channel name is required',
      code: 'MISSING_CHANNEL'
    });
  }
  
  res.json({
    success: true,
    channel: channel,
    subscriberCount: Math.floor(Math.random() * 50) + 1,
    timestamp: new Date().toISOString(),
    options: options || {}
  });
});

app.post('/sdk/channel/unsubscribe', (req, res) => {
  const { channel } = req.body;
  
  res.json({
    success: true,
    channel: channel,
    timestamp: new Date().toISOString()
  });
});

app.post('/sdk/channel/publish', (req, res) => {
  const { channel, message, options } = req.body;
  
  if (!channel || message === undefined) {
    return res.status(400).json({
      name: 'ValidationError',
      message: 'Channel and message are required',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  
  res.json({
    messageId: `msg_${Math.random().toString(36).substr(2, 16)}`,
    channel: channel,
    timestamp: new Date().toISOString(),
    subscriberCount: Math.floor(Math.random() * 50) + 1,
    message: message,
    options: options || {}
  });
});

app.post('/sdk/channel/history', (req, res) => {
  const { channel, options } = req.body;
  const count = options?.count || 10;
  
  // Generate mock message history
  const messages = [];
  for (let i = 0; i < Math.min(count, 25); i++) {
    const timestamp = new Date(Date.now() - (i * 60000)).toISOString();
    messages.unshift({
      id: `msg_${Math.random().toString(36).substr(2, 16)}`,
      channel: channel,
      message: `Sample message ${i + 1}`,
      publisher: {
        userId: `user${Math.floor(Math.random() * 100)}`,
        apiKeyId: 'ak_live_sample'
      },
      timestamp: timestamp,
      ttl: 3600,
      metadata: {
        source: 'demo',
        index: i + 1
      }
    });
  }
  
  res.json({
    success: true,
    channel: channel,
    messages: messages,
    count: messages.length,
    hasMore: count > 25
  });
});

app.post('/sdk/channel/presence', (req, res) => {
  const { channel } = req.body;
  const occupancy = Math.floor(Math.random() * 20) + 1;
  
  // Generate mock occupants
  const occupants = [];
  for (let i = 0; i < occupancy; i++) {
    occupants.push({
      userId: `user${i + 1}`,
      joinedAt: new Date(Date.now() - (Math.random() * 3600000)).toISOString(),
      state: {
        status: Math.random() > 0.3 ? 'online' : 'away',
        typing: Math.random() > 0.8
      }
    });
  }
  
  res.json({
    channel: channel,
    occupancy: occupancy,
    occupants: occupants
  });
});

app.post('/sdk/channel/update-state', (req, res) => {
  const { state } = req.body;
  
  res.json({
    success: true,
    state: state,
    timestamp: new Date().toISOString()
  });
});

app.post('/sdk/pubnub/create', (req, res) => {
  const { publishKey, subscribeKey, userId, managerUrl } = req.body;
  
  res.json({
    success: true,
    clientType: 'PubNubCompat',
    migration: {
      from: 'PubNub',
      to: 'OddSockets',
      benefits: [
        '50% lower latency',
        'No message limits',
        'No per-message pricing',
        'Richer metadata',
        'Built-in analytics',
        'Self-hosted option'
      ]
    },
    config: {
      publishKey: publishKey?.substring(0, 12) + '...',
      subscribeKey: subscribeKey?.substring(0, 12) + '...',
      userId: userId,
      managerUrl: managerUrl || 'https://manager1.oddsockets.tyga.network'
    }
  });
});

// Example endpoints
app.get('/sdk/examples/chat-app', (req, res) => {
  res.json({
    example: 'chat-app',
    description: 'Complete real-time chat application example',
    features: [
      'User authentication',
      'Channel subscription',
      'Message publishing',
      'Presence tracking',
      'Typing indicators',
      'Message history',
      'Error handling'
    ],
    code: `
const OddSockets = require('@oddsockets/javascript-sdk');

class ChatApp {
  constructor(apiKey, userId) {
    this.client = new OddSockets({ apiKey, userId });
    this.currentChannel = null;
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.client.on('connected', () => {
      console.log('Connected to OddSockets!');
    });
    
    this.client.on('error', (error) => {
      console.error('Connection error:', error);
    });
  }
  
  async joinChannel(channelName) {
    this.currentChannel = this.client.channel(channelName);
    
    await this.currentChannel.subscribe((message) => {
      this.displayMessage(message);
    }, {
      enablePresence: true,
      retainHistory: true
    });
    
    // Load message history
    const history = await this.currentChannel.getHistory({ count: 50 });
    history.forEach(msg => this.displayMessage(msg));
    
    // Handle presence events
    this.currentChannel.on('presence_change', (data) => {
      this.updateUserList(data);
    });
  }
  
  async sendMessage(text) {
    if (!this.currentChannel) return;
    
    await this.currentChannel.publish({
      type: 'message',
      text: text,
      timestamp: Date.now()
    });
  }
  
  async setTyping(isTyping) {
    if (!this.currentChannel) return;
    
    await this.currentChannel.updateState({
      typing: isTyping,
      lastActive: new Date().toISOString()
    });
  }
  
  displayMessage(message) {
    console.log(\`[\${message.publisher.userId}]: \${message.message.text}\`);
  }
  
  updateUserList(presenceData) {
    console.log(\`User \${presenceData.user.userId} \${presenceData.action}ed\`);
  }
}

// Usage
const chat = new ChatApp('ak_live_1234567890abcdef', 'user123');
await chat.joinChannel('general');
await chat.sendMessage('Hello, everyone!');
    `,
    runnable: true
  });
});

app.get('/sdk/examples/pubnub-migration', (req, res) => {
  res.json({
    migration: {
      before: `
// PubNub (BEFORE)
const pubnub = new PubNub({
  publishKey: 'pub-c-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  subscribeKey: 'sub-c-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  userId: 'user123'
});

pubnub.addListener({
  message: function(messageEvent) {
    console.log('Message:', messageEvent.message);
  }
});

pubnub.subscribe({
  channels: ['my-channel']
});

pubnub.publish({
  channel: 'my-channel',
  message: 'Hello, World!'
});
      `,
      after: `
// OddSockets (AFTER) - Same API!
const { PubNubCompat } = require('@oddsockets/javascript-sdk');
const pubnub = new PubNubCompat({
  publishKey: 'ak_live_1234567890abcdef',    // Your OddSockets API key
  subscribeKey: 'ak_live_1234567890abcdef',  // Same as publishKey
  userId: 'user123'
});

pubnub.addListener({
  message: function(messageEvent) {
    console.log('Message:', messageEvent.message);
  }
});

pubnub.subscribe({
  channels: ['my-channel']
});

pubnub.publish({
  channel: 'my-channel',
  message: 'Hello, World!'
});
      `,
      changes: [
        'Replace PubNub import with OddSockets PubNubCompat',
        'Update publishKey to your OddSockets API key',
        'Set subscribeKey to same value as publishKey',
        'Add optional managerUrl if needed'
      ],
      benefits: [
        '50% lower latency than PubNub',
        'No message size limits',
        'No per-message pricing',
        'Richer message metadata',
        'Built-in analytics and monitoring',
        'Self-hosted deployment option',
        'Better error handling and reconnection'
      ]
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'oddsockets-javascript-sdk-docs',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OddSockets JavaScript SDK Documentation Server running on port ${PORT}`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`🔍 API Info: http://localhost:${PORT}/api/sdk/info`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
