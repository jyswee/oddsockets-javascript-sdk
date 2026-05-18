# OddSockets JavaScript SDK

## What this is
Real-time messaging SDK for browsers and Node.js. Pub/sub, presence, message history over WebSocket.

## Get a free API key (2-step email verification)

Step 1 — request a code:
```bash
curl -X POST https://oddsockets.com/api/agent-signup \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "agentName": "my-agent", "platform": "claude"}'
```

Step 2 — verify and get key:
```bash
curl -X POST https://oddsockets.com/api/agent-signup/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "code": "123456", "agentName": "my-agent"}'
```

Response gives you `apiKey`, `token`, and `userId`. Use the `apiKey` to connect.

## Connect and use

```html
<script src="dist/oddsockets.min.js"></script>
<script>
const client = new OddSockets({
  apiKey: 'YOUR_API_KEY',
  userId: 'my-agent'
});

client.on('connected', async () => {
  const channel = client.channel('my-channel');
  await channel.subscribe((msg) => console.log('Received:', msg));
  await channel.publish({ text: 'hello from browser' });
});
</script>
```

## Key files

- `src/OddSockets.js` — Main client class (connect, disconnect, channel management)
- `src/Channel.js` — Channel operations (subscribe, publish, history, presence)
- `src/ManagerDiscovery.js` — Resolves the cluster manager URL
- `src/PubNubCompat.js` — Drop-in PubNub replacement layer
- `src/MessageSizeValidator.js` — 32KB message limit enforcement
- `src/EnhancedFeatures.js` — Extended event system
- `src/index.js` — Entry point, exports all public APIs
- `dist/oddsockets.min.js` — Browser bundle
- `examples/` — Working examples (browser + Node.js)

## Architecture

Client connects to Manager -> Manager assigns a Worker -> Client talks to Worker via Socket.IO.

The SDK handles this transparently. You just provide an API key and call `channel.publish()` / `channel.subscribe()`.

## Free tier limits

- 100 MAU (monthly active users)
- 50 concurrent connections
- 500 connections/day
- 10,000 messages/day
- 100 messages/minute
- 10 channels max
- 100MB storage
- 24h message history retention

## Building

```bash
npm install
npm run build
```

## Running tests

```bash
npm test
```
