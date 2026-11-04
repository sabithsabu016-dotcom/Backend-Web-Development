'use strict';
// routes/auth.js — OAuth entry points
//
// Route 1 — GET /auth/google
//   Triggers the OAuth flow. Passport builds the redirect URL and sends 302.
//   Given — do not modify.
//
// Route 2 — GET /auth/google/callback
//   Google redirects here with the authorization code.
//   Passport catches the code, exchanges it, fetches the profile, and runs
//   verifyCallback. If verifyCallback calls done(null, user), Passport sets
//   req.user and calls next() — landing in the handler below.
//
// YOUR TASK: complete the callback handler.
//   After Passport sets req.user, issue an app JWT using signToken and return it.
//   Use signToken({ sub: req.user.id, role: req.user.role }) — not Google's token.
//   Respond with: res.json({ token })

const router  = require('express').Router();
const { passport } = require('../auth/passport');
const { signToken } = require('../utils/jwt');   // hint: use this

// ── Given: triggers the OAuth flow ──────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', {
    scope:   ['openid', 'email', 'profile'],
    session: false,
  }),
);

// ── TODO: complete the callback handler ─────────────────────────────────────
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session:         false,
    failureRedirect: '/auth/failure',
  }),
  (req, res) => {
    // req.user is the user returned by verifyCallback
    // Issue YOUR app JWT here and return it as JSON.
    const token = signToken({ sub: req.user.id, role: req.user.role });
    res.json({ token });
  },
);

// ── Given: shown when OAuth fails ───────────────────────────────────────────
router.get('/failure', (_req, res) => {
  res.status(401).json({ error: { code: 'OAUTH_FAILED', message: 'Google login failed or was denied' } });
});

module.exports = router;
