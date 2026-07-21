# OddSockets JavaScript SDK — Demo

A tiny, runnable program that proves a real real-time round-trip against OddSockets
using **two independent clients**: **connect → subscribe → publish → receive**.

Because the subscriber and the publisher are separate connections, a message that
reaches the subscriber can only have travelled through the OddSockets worker — so
this doubles as an honest end-to-end regression test (no mocks, no local echo).

> Runs on Node 18+ (uses the shipped UMD bundle + `socket.io-client`). A no-build
> browser version is in [`index.html`](./index.html).

## 1. Get a free API key

Two-step email verification (no card required):

```bash
# Step 1 — request a code
curl -X POST https://oddsockets.com/api/agent-signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","agentName":"demo","platform":"claude"}'

# Step 2 — verify and receive your apiKey
curl -X POST https://oddsockets.com/api/agent-signup/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","code":"123456","agentName":"demo"}'
```

The verify response contains your `apiKey` (starts with `ak_`).

## 2. Run it

```bash
export ODDSOCKETS_API_KEY="ak_your_key_here"
node demo/demo-node.js
```

Expected output:

```
Connecting both clients...
[alice] worker: w002-oddsockets-1
[bob]   worker: w002-oddsockets-1
Both connected.
[alice] subscribed to "demo-yh4nc2nz" (presence on).
[bob] publishing (nonce 4wlzemk5eblmruwl4a2)...
[bob] published, messageId=d3bb5905-eaa2-48b2-8500-b02a12a02391
[alice] received bob’s message (nonce matched) - real round-trip.
[alice] presence on channel: 1 user(s).
[alice] unsubscribed.
OK - cross-client round-trip verified on demo-yh4nc2nz
```

Prefer a browser? Serve the repo and open `demo/index.html`:

```bash
npx http-server . -p 8080   # then visit http://localhost:8080/demo/index.html
```

## The code, step by step

Create two clients — a subscriber and a publisher — each on its own connection:

```js
const OddSockets = require('oddsockets-js'); // resolves to the UMD bundle

const subscriber = new OddSockets({ apiKey, userId: 'alice' });
const publisher  = new OddSockets({ apiKey, userId: 'bob' });
```

Clients auto-connect. Wait until each reaches the `connected` state:

```js
function waitConnected(client) {
  return new Promise((resolve) => {
    if (client.getState() === 'connected') return resolve();
    client.once('connected', resolve);
  });
}
await Promise.all([waitConnected(subscriber), waitConnected(publisher)]);
```

Subscribe on the subscriber, with presence enabled:

```js
const inbox = subscriber.channel('my-channel');
await inbox.subscribe((message) => {
  console.log('received:', message.message);
}, { enablePresence: true });
```

Publish from the *other* client — this is what makes the test honest:

```js
const outbox = publisher.channel('my-channel');
const result = await outbox.publish({ text: 'hello from bob' });
console.log('messageId:', result.messageId);
```

Inspect presence, then tear down cleanly:

```js
const presence = await inbox.getPresence(); // { channel, count, occupants }
await inbox.unsubscribe();
subscriber.disconnect();
publisher.disconnect();
```

The key is read from `ODDSOCKETS_API_KEY` and is never hardcoded or stored.

## What it demonstrates

- Manager discovery + automatic worker assignment (targets `connect.oddsockets.tyga.network`)
- `new OddSockets({ apiKey, userId })` → `client.channel(name)` → `channel.subscribe(cb, opts)` / `channel.publish(msg)`
- **Cross-client delivery**: a message published by `bob` is delivered to `alice`’s
  subscription in real time — provably through the worker, not a local echo
- Presence tracking, unsubscribe, and graceful disconnect
- A 15-second timeout so a stalled round-trip is reported as a failure (non-zero exit)
