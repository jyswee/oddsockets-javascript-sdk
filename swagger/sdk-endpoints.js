/**
 * @swagger
 * /sdk/client/create:
 *   post:
 *     tags:
 *       - Client
 *     summary: Create OddSockets Client
 *     description: |
 *       Create a new OddSockets client instance. This automatically handles the Manager → Worker 
 *       load balancing internally, so you don't need to worry about cluster complexity.
 *       
 *       **Code Example:**
 *       ```javascript
 *       const OddSockets = require('@oddsockets/javascript-sdk');
 *       
 *       const client = new OddSockets({
 *         apiKey: 'ak_live_1234567890abcdef',
 *         userId: 'user123'
 *       });
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OddSocketsConfig'
 *           examples:
 *             basic:
 *               summary: Basic configuration
 *               value:
 *                 apiKey: "ak_live_1234567890abcdef"
 *             advanced:
 *               summary: Advanced configuration
 *               value:
 *                 apiKey: "ak_live_1234567890abcdef"
 *                 managerUrl: "https://connect.oddsockets.tyga.network"
 *                 userId: "user123"
 *                 autoConnect: true
 *                 options:
 *                   timeout: 15000
 *                   transports: ["websocket", "polling"]
 *     responses:
 *       200:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 clientId:
 *                   type: string
 *                   example: "client_abc123"
 *                 state:
 *                   $ref: '#/components/schemas/ConnectionState'
 *                 workerInfo:
 *                   $ref: '#/components/schemas/WorkerInfo'
 *       400:
 *         description: Invalid configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SDKError'
 *             example:
 *               name: "ConfigurationError"
 *               message: "API key is required"
 *               code: "MISSING_API_KEY"

 * /sdk/client/connect:
 *   post:
 *     tags:
 *       - Client
 *     summary: Connect to OddSockets Platform
 *     description: |
 *       Manually connect to the OddSockets platform. This is automatically called if 
 *       `autoConnect` is true (default).
 *       
 *       **Internal Process (Hidden from You):**
 *       1. SDK contacts Manager for worker assignment
 *       2. Manager returns worker URL with session stickiness
 *       3. SDK connects to assigned worker
 *       4. Connection established
 *       
 *       **Code Example:**
 *       ```javascript
 *       await client.connect();
 *       console.log('Connected!', client.getState());
 *       ```
 *     responses:
 *       200:
 *         description: Connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 state:
 *                   $ref: '#/components/schemas/ConnectionState'
 *                 workerInfo:
 *                   $ref: '#/components/schemas/WorkerInfo'
 *                 connectionTime:
 *                   type: integer
 *                   description: Connection time in milliseconds
 *                   example: 1250
 *       500:
 *         description: Connection failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SDKError'

 * /sdk/client/disconnect:
 *   post:
 *     tags:
 *       - Client
 *     summary: Disconnect from Platform
 *     description: |
 *       Disconnect from the OddSockets platform and clean up resources.
 *       
 *       **Code Example:**
 *       ```javascript
 *       client.disconnect();
 *       console.log('Disconnected');
 *       ```
 *     responses:
 *       200:
 *         description: Disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 state:
 *                   $ref: '#/components/schemas/ConnectionState'

 * /sdk/client/state:
 *   get:
 *     tags:
 *       - Client
 *     summary: Get Connection State
 *     description: |
 *       Get the current connection state of the client.
 *       
 *       **Code Example:**
 *       ```javascript
 *       const state = client.getState();
 *       console.log('Current state:', state);
 *       ```
 *     responses:
 *       200:
 *         description: Current connection state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   $ref: '#/components/schemas/ConnectionState'
 *                 workerInfo:
 *                   $ref: '#/components/schemas/WorkerInfo'
 *                 uptime:
 *                   type: integer
 *                   description: Connection uptime in milliseconds
 *                   example: 45000

 * /sdk/channel/subscribe:
 *   post:
 *     tags:
 *       - Channels
 *     summary: Subscribe to Channel
 *     description: |
 *       Subscribe to a channel to receive real-time messages. The SDK handles all the 
 *       complexity of connecting to the right worker.
 *       
 *       **Code Example:**
 *       ```javascript
 *       const channel = client.channel('chat-room');
 *       
 *       await channel.subscribe((message) => {
 *         console.log('Received:', message.message);
 *         console.log('From:', message.publisher.userId);
 *       }, {
 *         enablePresence: true,
 *         retainHistory: true
 *       });
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channel
 *             properties:
 *               channel:
 *                 type: string
 *                 description: Channel name to subscribe to
 *                 example: "chat-room-1"
 *               options:
 *                 $ref: '#/components/schemas/SubscribeOptions'
 *           examples:
 *             basic:
 *               summary: Basic subscription
 *               value:
 *                 channel: "chat-room-1"
 *             with_presence:
 *               summary: Subscription with presence
 *               value:
 *                 channel: "chat-room-1"
 *                 options:
 *                   enablePresence: true
 *                   retainHistory: true
 *                   maxHistory: 50
 *     responses:
 *       200:
 *         description: Subscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 channel:
 *                   type: string
 *                   example: "chat-room-1"
 *                 subscriberCount:
 *                   type: integer
 *                   example: 15
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid channel name or options
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SDKError'

 * /sdk/channel/unsubscribe:
 *   post:
 *     tags:
 *       - Channels
 *     summary: Unsubscribe from Channel
 *     description: |
 *       Unsubscribe from a channel to stop receiving messages.
 *       
 *       **Code Example:**
 *       ```javascript
 *       const channel = client.channel('chat-room');
 *       await channel.unsubscribe();
 *       console.log('Unsubscribed from chat-room');
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channel
 *             properties:
 *               channel:
 *                 type: string
 *                 description: Channel name to unsubscribe from
 *                 example: "chat-room-1"
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 channel:
 *                   type: string
 *                   example: "chat-room-1"
 *                 timestamp:
 *                   type: string
 *                   format: date-time

 * /sdk/channel/publish:
 *   post:
 *     tags:
 *       - Channels
 *     summary: Publish Message to Channel
 *     description: |
 *       Publish a message to a channel. The message can be a string, object, or array.
 *       The SDK automatically routes it to the correct worker.
 *       
 *       **Code Example:**
 *       ```javascript
 *       const channel = client.channel('chat-room');
 *       
 *       // Simple text message
 *       await channel.publish('Hello, World!');
 *       
 *       // Object message with metadata
 *       await channel.publish({
 *         type: 'notification',
 *         title: 'New Message',
 *         body: 'You have a new message'
 *       }, {
 *         ttl: 3600,
 *         metadata: { priority: 'high' }
 *       });
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channel
 *               - message
 *             properties:
 *               channel:
 *                 type: string
 *                 description: Channel name to publish to
 *                 example: "chat-room-1"
 *               message:
 *                 $ref: '#/components/schemas/MessageContent'
 *               options:
 *                 $ref: '#/components/schemas/PublishOptions'
 *           examples:
 *             text_message:
 *               summary: Simple text message
 *               value:
 *                 channel: "chat-room-1"
 *                 message: "Hello, World!"
 *             object_message:
 *               summary: Object message with metadata
 *               value:
 *                 channel: "chat-room-1"
 *                 message:
 *                   type: "notification"
 *                   title: "New Message"
 *                   body: "You have a new message"
 *                   data:
 *                     userId: "user123"
 *                 options:
 *                   ttl: 3600
 *                   metadata:
 *                     priority: "high"
 *                     category: "notification"
 *             array_message:
 *               summary: Array message
 *               value:
 *                 channel: "data-stream"
 *                 message: ["item1", "item2", "item3"]
 *                 options:
 *                   metadata:
 *                     source: "batch_processor"
 *     responses:
 *       200:
 *         description: Message published successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublishResult'
 *       400:
 *         description: Invalid message or channel
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SDKError'

 * /sdk/channel/history:
 *   post:
 *     tags:
 *       - Channels
 *     summary: Get Message History
 *     description: |
 *       Retrieve message history for a channel. You can filter by time range and limit the number of messages.
 *       
 *       **Code Example:**
 *       ```javascript
 *       const channel = client.channel('chat-room');
 *       
 *       // Get last 50 messages
 *       const messages = await channel.getHistory({ count: 50 });
 *       
 *       // Get messages from specific time range
 *       const recentMessages = await channel.getHistory({
 *         count: 100,
 *         start: '2025-01-09T06:00:00.000Z',
 *         end: '2025-01-09T07:00:00.000Z'
 *       });
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channel
 *             properties:
 *               channel:
 *                 type: string
 *                 description: Channel name to get history for
 *                 example: "chat-room-1"
 *               options:
 *                 $ref: '#/components/schemas/HistoryOptions'
 *           examples:
 *             recent_messages:
 *               summary: Get recent messages
 *               value:
 *                 channel: "chat-room-1"
 *                 options:
 *                   count: 50
 *             time_range:
 *               summary: Get messages from time range
 *               value:
 *                 channel: "chat-room-1"
 *                 options:
 *                   count: 100
 *                   start: "2025-01-09T06:00:00.000Z"
 *                   end: "2025-01-09T07:00:00.000Z"
 *     responses:
 *       200:
 *         description: Message history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 channel:
 *                   type: string
 *                   example: "chat-room-1"
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReceivedMessage'
 *                 count:
 *                   type: integer
 *                   example: 25
 *                 hasMore:
 *                   type: boolean
 *                   example: true

 * /sdk/channel/presence:
 *   post:
 *     tags:
 *       - Channels
 *     summary: Get Channel Presence
 *     description: |
 *       Get current presence information for a channel, including occupancy and user list.
 *       
 *       **Code Example:**
 *       ```javascript
 *       const channel = client.channel('chat-room');
 *       
 *       const presence = await channel.getPresence();
 *       console.log(`${presence.occupancy} users in channel`);
 *       
 *       presence.occupants.forEach(user => {
 *         console.log(`- ${user.userId}: ${user.state?.status || 'unknown'}`);
 *       });
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channel
 *             properties:
 *               channel:
 *                 type: string
 *                 description: Channel name to get presence for
 *                 example: "chat-room-1"
 *     responses:
 *       200:
 *         description: Presence information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PresenceInfo'

 * /sdk/channel/update-state:
 *   post:
 *     tags:
 *       - Channels
 *     summary: Update User State
 *     description: |
 *       Update your user state across all subscribed channels. Other users will receive 
 *       presence events with your updated state.
 *       
 *       **Code Example:**
 *       ```javascript
 *       const channel = client.channel('chat-room');
 *       
 *       await channel.updateState({
 *         status: 'online',
 *         typing: true,
 *         mood: 'excited',
 *         lastActive: new Date().toISOString()
 *       });
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - state
 *             properties:
 *               state:
 *                 $ref: '#/components/schemas/UserState'
 *           examples:
 *             online_status:
 *               summary: Set online status
 *               value:
 *                 state:
 *                   status: "online"
 *                   lastActive: "2025-01-09T07:15:35.123Z"
 *             typing_indicator:
 *               summary: Typing indicator
 *               value:
 *                 state:
 *                   status: "online"
 *                   typing: true
 *                   typingIn: "chat-room-1"
 *             rich_presence:
 *               summary: Rich presence data
 *               value:
 *                 state:
 *                   status: "online"
 *                   mood: "happy"
 *                   activity: "coding"
 *                   location: "San Francisco"
 *                   avatar: "https://example.com/avatar.jpg"
 *     responses:
 *       200:
 *         description: User state updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 state:
 *                   $ref: '#/components/schemas/UserState'
 *                 timestamp:
 *                   type: string
 *                   format: date-time

 * /sdk/pubnub/create:
 *   post:
 *     tags:
 *       - PubNub Compatibility
 *     summary: Create PubNub-Compatible Client
 *     description: |
 *       Create a PubNub-compatible client for easy migration from PubNub to OddSockets.
 *       This provides the exact same API as PubNub but with better performance and features.
 *       
 *       **Migration Example:**
 *       ```javascript
 *       // OLD: PubNub
 *       const pubnub = new PubNub({
 *         publishKey: 'pub-c-...',
 *         subscribeKey: 'sub-c-...'
 *       });
 *       
 *       // NEW: OddSockets (same API!)
 *       const { PubNubCompat } = require('@oddsockets/javascript-sdk');
 *       const pubnub = new PubNubCompat({
 *         publishKey: 'ak_live_1234567890abcdef',
 *         subscribeKey: 'ak_live_1234567890abcdef'
 *       });
 *       
 *       // All your existing PubNub code works unchanged!
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PubNubCompatConfig'
 *           examples:
 *             migration:
 *               summary: PubNub migration
 *               value:
 *                 publishKey: "ak_live_1234567890abcdef"
 *                 subscribeKey: "ak_live_1234567890abcdef"
 *                 userId: "user123"
 *                 managerUrl: "https://connect.oddsockets.tyga.network"
 *     responses:
 *       200:
 *         description: PubNub-compatible client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 clientType:
 *                   type: string
 *                   example: "PubNubCompat"
 *                 migration:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       example: "PubNub"
 *                     to:
 *                       type: string
 *                       example: "OddSockets"
 *                     benefits:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - "50% lower latency"
 *                         - "No message limits"
 *                         - "No per-message pricing"
 *                         - "Richer metadata"

 * /sdk/examples/chat-app:
 *   get:
 *     tags:
 *       - Examples
 *     summary: Chat Application Example
 *     description: |
 *       Complete example of building a real-time chat application with the OddSockets SDK.
 *       
 *       **Features Demonstrated:**
 *       - User authentication
 *       - Channel subscription
 *       - Message publishing
 *       - Presence tracking
 *       - Typing indicators
 *       - Message history
 *       - Error handling
 *     responses:
 *       200:
 *         description: Chat application example code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 example:
 *                   type: string
 *                   example: "chat-app"
 *                 code:
 *                   type: string
 *                   description: Complete example code
 *                 features:
 *                   type: array
 *                   items:
 *                     type: string
 *                 runnable:
 *                   type: boolean
 *                   example: true

 * /sdk/examples/pubnub-migration:
 *   get:
 *     tags:
 *       - Examples
 *     summary: PubNub Migration Example
 *     description: |
 *       Step-by-step example showing how to migrate from PubNub to OddSockets with minimal code changes.
 *       
 *       **Migration Steps:**
 *       1. Replace PubNub import with OddSockets PubNubCompat
 *       2. Update publishKey/subscribeKey to OddSockets API key
 *       3. Add optional managerUrl configuration
 *       4. All existing code works unchanged!
 *     responses:
 *       200:
 *         description: PubNub migration example
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 migration:
 *                   type: object
 *                   properties:
 *                     before:
 *                       type: string
 *                       description: Original PubNub code
 *                     after:
 *                       type: string
 *                       description: Migrated OddSockets code
 *                     changes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     benefits:
 *                       type: array
 *                       items:
 *                         type: string
 */

module.exports = {};
