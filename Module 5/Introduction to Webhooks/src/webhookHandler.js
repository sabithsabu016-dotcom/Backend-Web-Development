'use strict';

// ─── YOUR FILE — implement this ───────────────────────────────────────────────
// Export handleWebhook(req, res), used by POST /webhooks in app.js.
// Also export _processedIds (your Set or Map) for test inspection/reset.
//
// Steps (in order):
//  1. Verify HMAC-SHA256 signature
//     - Signature header: req.headers['x-webhook-signature'] → 'sha256=<hex>'
//     - Compute: crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.body).digest('hex')
//     - Compare: crypto.timingSafeEqual(Buffer.from(expected,'hex'), Buffer.from(received,'hex'))
//     - Mismatch or missing → res.status(401).json({ error: 'Invalid signature' })
//
//  2. Parse body: const event = JSON.parse(req.body)
//
//  3. Idempotency: if _processedIds.has(event.id) → res.status(200).json({ status: 'already_processed' })
//
//  4. Mark: _processedIds.add(event.id)
//
//  5. Acknowledge: res.status(200).json({ status: 'received' })
//     Then call handleEvent(event) inside setImmediate(() => { ... })

const crypto = require('node:crypto');
const { handleEvent } = require('./eventHandlers');

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'testsecret';
const _processedIds = new Set();

function handleWebhook(req, res) {
  const signatureHeader = req.headers['x-webhook-signature'];

  if (typeof signatureHeader !== 'string' || !signatureHeader.startsWith('sha256=')) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest();
  const received = Buffer.from(signatureHeader.slice('sha256='.length), 'hex');

  if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (_processedIds.has(event.id)) {
    return res.status(200).json({ status: 'already_processed' });
  }

  _processedIds.add(event.id);
  res.status(200).json({ status: 'received' });

  setImmediate(() => {
    handleEvent(event);
  });
}

module.exports = { handleWebhook, _processedIds };
