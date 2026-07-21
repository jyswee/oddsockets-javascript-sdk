'use strict';

/**
 * OddSockets JavaScript SDK - runnable two-client demo (Node.js).
 *
 * This is a genuine end-to-end regression test, not a mock. It spins up TWO
 * independent clients on the same channel:
 *
 *   - a SUBSCRIBER (user "alice") that listens for messages
 *   - a PUBLISHER  (user "bob")   that sends one message
 *
 * Because the two clients are separate connections, a message reaching the
 * subscriber can ONLY have travelled through the OddSockets worker - it cannot
 * be a local echo. That makes a matched nonce here proof of a real round-trip.
 *
 * Exercised surface: connect -> subscribe (+presence) -> publish -> receive
 * -> presence -> unsubscribe -> disconnect.
 *
 * The dist bundle is a UMD module, so require()-ing it under Node returns the
 * OddSockets constructor and runs on socket.io-client just like the browser.
 *
 * Usage:
 *   export ODDSOCKETS_API_KEY="ak_live_..."   # get a free key: see README
 *   node demo/demo-node.js
 *
 * Exits 0 on a verified cross-client round-trip, non-zero on failure/timeout.
 */

const OddSockets = require('../dist/oddsockets.min.js');

const MANAGER_URL = 'https://connect.oddsockets.tyga.network';
const TIMEOUT_MS = 15000;

function log(line) {
  process.stdout.write(line + '\n');
}

// Resolve once the client reaches the 'connected' state.
function waitConnected(client, label) {
  return new Promise((resolve) => {
    if (client.getState() === 'connected') return resolve();
    client.once('connected', resolve);
  });
}

async function main() {
  const apiKey = process.env.ODDSOCKETS_API_KEY;
  if (!apiKey) {
    log('FAILED - set ODDSOCKETS_API_KEY in the environment first (see README)');
    process.exit(1);
    return;
  }

  const channelName = 'demo-' + Math.random().toString(36).slice(2, 10);
  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);

  let settled = false;
  let timer = null;
  let subscriber = null;
  let publisher = null;

  function cleanup() {
    try { if (subscriber) subscriber.disconnect(); } catch (e) {}
    try { if (publisher) publisher.disconnect(); } catch (e) {}
  }

  function finish(ok, message) {
    if (settled) return;
    settled = true;
    if (timer) clearTimeout(timer);
    log(message);
    cleanup();
    process.exit(ok ? 0 : 1);
  }

  timer = setTimeout(function () {
    finish(false, 'FAILED - timed out after 15s waiting for cross-client delivery');
  }, TIMEOUT_MS);

  try {
    // 1. Two independent clients (autoConnect is on by default).
    subscriber = new OddSockets({ apiKey: apiKey, userId: 'alice', managerUrl: MANAGER_URL });
    publisher  = new OddSockets({ apiKey: apiKey, userId: 'bob',   managerUrl: MANAGER_URL });

    subscriber.on('worker_assigned', function (d) { log('[alice] worker: ' + d.workerId); });
    publisher.on('worker_assigned',  function (d) { log('[bob]   worker: ' + d.workerId); });
    subscriber.on('error', function (e) { log('[alice] error: ' + (e && e.message ? e.message : e)); });
    publisher.on('error',  function (e) { log('[bob]   error: ' + (e && e.message ? e.message : e)); });

    log('Connecting both clients...');
    await Promise.all([waitConnected(subscriber), waitConnected(publisher)]);
    log('Both connected.');

    // 2. Subscriber joins the channel with presence enabled.
    const inbox = subscriber.channel(channelName);
    await inbox.subscribe(function (message) {
      const payload = message && message.message;
      if (payload && payload.nonce === nonce) {
        log('[alice] received bob\u2019s message (nonce matched) - real round-trip.');
        // 4. Show presence, then tear down cleanly.
        finishSuccess(inbox);
      }
    }, { enablePresence: true });
    log('[alice] subscribed to "' + channelName + '" (presence on).');

    // 3. Publisher sends one message to the same channel.
    const outbox = publisher.channel(channelName);
    log('[bob] publishing (nonce ' + nonce + ')...');
    const result = await outbox.publish({ text: 'hello from bob', nonce: nonce, from: 'bob' });
    log('[bob] published, messageId=' + (result && result.messageId ? result.messageId : '(n/a)'));
  } catch (error) {
    finish(false, 'FAILED - ' + (error && error.message ? error.message : error));
  }

  async function finishSuccess(inbox) {
    try {
      const presence = await inbox.getPresence();
      const count = presence && (presence.count != null ? presence.count
        : (presence.occupants ? presence.occupants.length : undefined));
      if (count !== undefined) log('[alice] presence on channel: ' + count + ' user(s).');
      await inbox.unsubscribe();
      log('[alice] unsubscribed.');
    } catch (e) {
      // Presence/unsubscribe are best-effort; the round-trip is already proven.
      log('[alice] teardown note: ' + (e && e.message ? e.message : e));
    }
    finish(true, 'OK - cross-client round-trip verified on ' + inbox.name);
  }
}

process.on('unhandledRejection', function (error) {
  log('FAILED - unhandled rejection: ' + (error && error.message ? error.message : error));
  process.exit(1);
});

main();
