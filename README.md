# OddSockets JavaScript SDK

Official JavaScript/TypeScript SDK for OddSockets real-time messaging platform.

[![npm version](https://badge.fury.io/js/%40oddsocketsai%2Fjavascript-sdk.svg)](https://badge.fury.io/js/%40oddsocketsai%2Fjavascript-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Quick Start

### Installation

```bash
npm install @oddsocketsai/javascript-sdk
# or
yarn add @oddsocketsai/javascript-sdk
```

### Basic Usage

```javascript
import OddSockets from '@oddsocketsai/javascript-sdk';

// Create client (auto-connects by default)
const client = new OddSockets({
  apiKey: 'your-api-key-here'
});

// Get a channel
const channel = client.channel('my-channel');

// Subscribe to messages
channel.subscribe((message) => {
  console.log('Received:', message);
});

// Publish a message
channel.publish('Hello, World!');
```

> **Need an API Key?** [Sign up for free at https://oddsockets.com/signup](https://oddsockets.com/signup) to get your API key and start building real-time applications.

## 📖 How To Use

### 1. Client Creation & Connection

```javascript
// Basic client (auto-connects)
const client = new OddSockets({
  apiKey: 'your-api-key'
});

// With options
const client = new OddSockets({
  apiKey: 'your-api-key',
  userId: 'user123',           // Optional: custom user ID
  autoConnect: false,          // Optional: disable auto-connect
  options: {                   // Optional: Socket.IO options
    transports: ['websocket'],
    timeout: 10000
  }
});

// Manual connection (if autoConnect: false)
await client.connect();
```

### 2. Connection Events

```javascript
client.on('connecting', () => {
  console.log('Connecting to OddSockets...');
});

client.on('connected', () => {
  console.log('Connected successfully!');
});

client.on('worker_assigned', (info) => {
  console.log('Assigned to worker:', info.workerId);
  console.log('Worker URL:', info.workerUrl);
});

client.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
});

client.on('reconnecting', (info) => {
  console.log(`Reconnecting... attempt ${info.attempt}/${info.maxAttempts}`);
});

client.on('error', (error) => {
  console.error('Connection error:', error);
});
```

### 3. Channel Operations

```javascript
// Get a channel (creates if doesn't exist)
const channel = client.channel('chat-room');

// Subscribe to messages
await channel.subscribe((message) => {
  console.log('Message from', message.userId, ':', message.data);
});

// Subscribe with options
await channel.subscribe((message) => {
  console.log('Received:', message);
}, {
  enablePresence: true,        // Track who's online
  retainHistory: true,         // Keep message history
  maxHistory: 50              // Max messages to retain
});

// Publish messages
await channel.publish('Hello everyone!');

// Publish with options
await channel.publish({
  text: 'Hello!',
  timestamp: Date.now()
}, {
  ttl: 3600,                  // Time to live (seconds)
  metadata: { priority: 'high' },
  storeInHistory: true
});

// Unsubscribe
await channel.unsubscribe();
```

### 4. Message History

```javascript
// Get recent messages
const history = await channel.getHistory();
console.log('Recent messages:', history);

// Get specific range
const messages = await channel.getHistory({
  count: 20,                  // Number of messages
  start: '2023-01-01T00:00:00Z',  // Start time
  end: '2023-01-02T00:00:00Z'     // End time
});

// Get cached history (from memory)
const cached = channel.getCachedHistory();
```

### 5. Presence Tracking

```javascript
// Enable presence on subscription
await channel.subscribe(callback, {
  enablePresence: true
});

// Get current presence
const presence = await channel.getPresence();
console.log('Online users:', presence.occupants);

// Listen for presence changes
channel.on('presence_change', (data) => {
  if (data.action === 'join') {
    console.log('User joined:', data.user.userId);
  } else if (data.action === 'leave') {
    console.log('User left:', data.user.userId);
  }
});

// Update your state
await channel.updateState({
  status: 'online',
  mood: 'happy'
});
```

### 6. Bulk Publishing

```javascript
// Publish to multiple channels at once
const results = await client.publishBulk([
  {
    channel: 'channel1',
    message: 'Hello channel 1!'
  },
  {
    channel: 'channel2',
    message: { text: 'Hello channel 2!' },
    options: { ttl: 3600 }
  }
]);

// Check results
results.forEach((result, index) => {
  if (result.success) {
    console.log(`Message ${index} sent successfully`);
  } else {
    console.error(`Message ${index} failed:`, result.error);
  }
});
```

### 7. Connection Management

```javascript
// Check connection state
console.log('State:', client.getState()); // 'connected', 'connecting', etc.

// Get worker info
const workerInfo = client.getWorkerInfo();
if (workerInfo) {
  console.log('Connected to worker:', workerInfo.workerId);
}

// Manual disconnect
client.disconnect();

// Manual reconnect
await client.connect();
```

### 8. Error Handling

```javascript
try {
  await channel.publish('My message');
} catch (error) {
  if (error.message.includes('32KB')) {
    console.error('Message too large! Max size is 32KB');
  } else if (error.message.includes('Not connected')) {
    console.error('Not connected to OddSockets');
    await client.connect();
  } else {
    console.error('Publish failed:', error.message);
  }
}
```

### 9. TypeScript Usage

```typescript
import OddSockets, { Channel } from '@oddsocketsai/javascript-sdk';

interface MyMessage {
  text: string;
  userId: string;
  timestamp: number;
}

const client: OddSockets = new OddSockets({
  apiKey: 'your-api-key'
});

const channel: Channel = client.channel('typed-channel');

channel.subscribe((message: MyMessage) => {
  console.log(`${message.userId}: ${message.text}`);
});

await channel.publish<MyMessage>({
  text: 'Hello TypeScript!',
  userId: 'user123',
  timestamp: Date.now()
});
```

### 10. Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://prodemedia.tyga.host/npm/@oddsocketsai/javascript-sdk@latest/dist/oddsockets.min.js"></script>
</head>
<body>
  <script>
    const client = new OddSockets({
      apiKey: 'your-api-key'
    });
    
    const channel = client.channel('browser-chat');
    
    channel.subscribe((message) => {
      console.log('Browser received:', message);
    });
    
    // Send message when page loads
    channel.publish('Hello from browser!');
  </script>
</body>
</html>
```

## Enhanced Features

Enhanced (Slack-like) events layer on top of the core pub/sub. The **send** side lives
on `client.enhanced.*`; fire-and-forget actions return `undefined`, while query/request
methods return a `Promise` that resolves with the worker's response. The matching
**broadcast** is forwarded to the client's own event surface, so any subscriber can
react with `client.on('<event>', handler)`.

```javascript
import OddSockets from '@oddsocketsai/javascript-sdk';

const client = new OddSockets({ apiKey: 'your-api-key', userId: 'alice' });
await client.connect();
await client.channel('room-42').subscribe(() => {}); // join the scoped room

// Receive-path: enhanced broadcasts arrive on the client event surface
client.on('user_typing',    (data) => console.log('typing:', data));
client.on('reaction_added', (data) => console.log('reaction:', data));

// Send-path: fire-and-forget actions
client.enhanced.startTyping('alice', 'room-42');
client.enhanced.addReaction({
  messageId: 'msg-1', channel: 'room-42', emoji: ':thumbsup:',
  userId: 'alice', userName: 'Alice'
});

// Request/response methods resolve with the worker's data
const reactions = await client.enhanced.getReactions('msg-1');
const results   = await client.enhanced.searchMessages({ query: 'launch', userId: 'alice', limit: 20 });
```

### Event surface

| Area | Send (`client.enhanced.*`) | Broadcast (`client.on(...)`) |
|---|---|---|
| **Typing** | `startTyping(userId, channel)` · `stopTyping(userId, channel)` | `user_typing` · `user_stopped_typing` |
| **Reactions** | `addReaction({messageId, channel, emoji, userId, userName})` · `removeReaction({messageId, channel, emoji, userId})` · `await getReactions(messageId)` | `reaction_added` · `reaction_removed` |
| **Threads** | `await threadReply({channel, parentMessageId, message, userId, userName})` · `await getThread(threadId)` · `await subscribeThread(threadId, userId)` · `markThreadRead(threadId, userId)` · `followThread(threadId, userId)` · `unfollowThread(threadId, userId)` | `thread_reply` · `thread_subscribed` · `thread_followed` · `thread_unfollowed` · `thread_read_updated` |
| **Read receipts** | `markRead({messageId, channel, userId, userName})` · `await getUnreadCounts(userId, channels)` · `markAllRead(channel, userId)` | `user_read` · `unread_count_updated` · `all_marked_read` |
| **Messages** | `editMessage({messageId, channel, newContent, userId})` · `deleteMessage({messageId, channel, userId})` · `pinMessage({messageId, channel, userId})` · `unpinMessage({messageId, channel, userId})` · `await getPinnedMessages(channel)` | `message_edited` · `message_deleted` · `message_pinned` · `message_unpinned` |
| **Presence & status** | `setStatus(userId, status)` · `setCustomStatus({userId, emoji, text, expiresAt})` · `clearCustomStatus(userId)` · `setDND(userId, until)` · `clearDND(userId)` · `await getUserPresence(userIds)` | `user_status_changed` · `custom_status_updated` · `custom_status_cleared` · `dnd_status_changed` · `status_updated` |
| **Channels** | `await createChannel({name, type, description, topic, createdBy, createdByName})` · `updateChannel({channelId, updates, userId})` · `archiveChannel(channelId, userId)` · `inviteToChannel({channelId, invitedUserId, invitedUserName, invitedBy})` · `removeFromChannel({channelId, removedUserId, removedBy})` · `joinChannel({channelId, userId, userName})` · `leaveChannel(channelId, userId)` · `await getChannelMembers(channelId)` | `channel_created` · `channel_updated` · `user_invited` · `user_joined_channel` · `user_left_channel` · `user_removed` |
| **Direct messages** | `await createDM({userIds, type})` · `sendDM({conversationId, message, userId, userName})` · `await getDMConversations(userId, includeArchived)` | `dm_created` · `dm_received` |
| **Notifications** | `subscribeNotifications(userId)` · `markNotificationRead(notificationId, userId)` · `markAllNotificationsRead(userId)` · `clearNotifications(userId)` · `await getNotifications({userId, limit, status})` | `notification` · `notification_read` · `all_notifications_read` · `notifications_cleared` |
| **Search** | `await searchMessages({query, userId, limit})` · `await filterMessages({...})` · `await searchInChannel({channel, query, limit})` · `await searchByUser({userId, query, limit})` | resolves with the matching result set |

## Advanced Features

### Message Size Limits
- **Maximum message size**: 32KB (industry standard)
- **Automatic validation**: SDK validates message size before sending
- **UTF-8 encoding**: Proper byte counting for international characters

### Transparent Infrastructure
- **Single endpoint**: SDK connects to cluster loadbalanacer for simplicity
- **Automatic routing**: Infrastructure transparently routes to optimal regional worker
- **Global load balancing**: Manager handles regional distribution behind the scenes

### Session Stickiness
- **Optimal worker assignment**: Manager assigns best worker based on load and location
- **Session persistence**: Reconnections use same worker when possible
- **Load balancing**: Intelligent distribution across workers in the cluster

### Automatic Reconnection
- **Exponential backoff**: Smart retry timing
- **Max attempts**: Configurable retry limits
- **State preservation**: Maintains subscriptions across reconnects

## Get a Free API Key

AI agents can sign up with a verified email in two steps — no dashboard, no human required.

**Step 1:** Request a verification code
```bash
curl -X POST https://oddsockets.com/api/agent-signup \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "agentName": "my-agent", "platform": "claude"}'
```

**Step 2:** Verify the 6-digit code from your email and get your API key
```bash
curl -X POST https://oddsockets.com/api/agent-signup/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "code": "123456", "agentName": "my-agent"}'
```

## Plans

| | Free | Starter | Pro |
|---|---|---|---|
| **Price** | $0/mo | $49.99/mo | $299/mo |
| **MAU** | 100 | 1,000 | 50,000 |
| **Concurrent connections** | 50 | 1,000 | Unlimited |
| **Messages/day** | 10,000 | 4,320,000 | Unlimited |
| **Messages/minute** | 100 | 3,000 | Unlimited |
| **Channels** | 10 | Unlimited | Unlimited |
| **Storage** | 100MB (24h) | 50GB (6 months) | Unlimited |
| **Webhooks** | No | Yes | Yes |
| **Analytics** | No | Yes | Yes |
| **Support** | Community | 24/5 email & chat | Dedicated team |

All limits are enforced in real time. When a limit is reached, the SDK receives a `RATE_LIMIT_EXCEEDED` error with a `retryAfter` value.

## Get Accredited

<a href="https://tyga.games/accreditation"><img src="https://prodmedia.tyga.host/public/tyga.cloud/landing/tyga.games/tygagames-black-words.svg" alt="tyga.games accreditation" height="44"></a>

Prove you can build and operate real-time features on OddSockets — channels, presence, pub/sub, delivery guarantees and production liveops — on the stack itself. Three tiers (**TCU / TCA / TCP**), certified through **tyga.games** and delivered on ClassaaS.

[**Get accredited on tyga.games →**](https://tyga.games/accreditation)

## Support

- [Documentation](https://docs.oddsockets.com/sdks/javascript)
- [Issue Tracker](https://github.com/jyswee/oddsockets-javascript-sdk/issues)
- [Email Support](mailto:support@oddsockets.com)

## License

MIT License - Copyright (c) 2026 Joe Wee, Tyga.Cloud Ltd. See [LICENSE](LICENSE) for details.
