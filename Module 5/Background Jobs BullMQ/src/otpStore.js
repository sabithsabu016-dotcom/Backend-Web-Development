'use strict';

const _store = new Map();

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function storeOTP(email, otp) {
  _store.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });
}

function verifyOTP(email, code) {
  const record = _store.get(email);

  if (!record) {
    return { ok: false, reason: 'not_found' };
  }

  if (Date.now() > record.expiresAt) {
    _store.delete(email);
    return { ok: false, reason: 'expired' };
  }

  if (record.attempts >= 3) {
    return { ok: false, reason: 'too_many_attempts' };
  }

  if (record.otp !== String(code)) {
    record.attempts += 1;
    return { ok: false, reason: 'wrong_code' };
  }

  _store.delete(email);
  return { ok: true };
}

function markVerified(email) {
  console.log(`Email verified for ${email}`);
}

module.exports = { generateOTP, storeOTP, verifyOTP, markVerified, _store };
