'use strict';
// routes/payments.js
//
// YOUR TASK: make POST /payments idempotent.
//
// Right now this handler charges the card on EVERY request, so a retried request
// (same purchase, sent twice because of a lost response or a double-tap) creates a
// duplicate charge. Fix it using an Idempotency-Key so a retry is processed exactly once.
//
// The in-memory helpers you need are in ../store:
//   idempotency  — a Map you use as  key -> { status, body }
//   charges      — the array of REAL charges (push once per real charge)
//   nextChargeId — returns a fresh 'ch_N' id
//
// Implement these four rules (checked by the tests):
//   1. MISSING key   -> respond 400 with { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', ... } }
//   2. REPEAT key    -> return the stored response; do NOT create a new charge
//   3. NEW key       -> create exactly ONE charge, store { status, body } under the key, return it
//   4. DIFFERENT key -> a separate operation (falls out of rules 2 and 3 naturally)
//
// Hint: read the key from  req.headers['idempotency-key'].

const router = require('express').Router();
const { charges, idempotency, nextChargeId } = require('../store');

router.post('/', (req, res) => {
  const key = req.headers['idempotency-key'];

  if (!key) {
    return res.status(400).json({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required.'
      }
    });
  }

  if (idempotency.has(key)) {
    const cached = idempotency.get(key);
    return res.status(cached.status).json(cached.body);
  }

  const amount = req.body && req.body.amount;
  const charge = { id: nextChargeId(), amount, status: 'charged' };
  charges.push(charge);

  const responseBody = { id: charge.id, amount: charge.amount, status: charge.status };
  idempotency.set(key, { status: 201, body: responseBody });

  return res.status(201).json(responseBody);
});

module.exports = router;
