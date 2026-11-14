'use strict';

// ─── GIVEN FILE — modify only to add caching (do not remove existing code) ───
// This file sets up the Express app and two routes.
// Your job: import cacheGet/cacheSet/cacheDel from ./cache and wire up:
//   GET /feed  → cache-aside with 60s TTL and X-Cache header
//   POST /posts → cacheDel after db.createPost()

require('dotenv').config();

const express = require('express');
const db      = require('./db');
const { cacheGet, cacheSet, cacheDel } = require('./cache');

const app = express();
app.use(express.json());

const FEED_KEY = 'feed:trending';
const FEED_TTL = 60;   // seconds

app.get('/health', (req, res) => res.json({ ok: true }));

// GET /feed — currently queries the database on EVERY request (no caching).
// TODO: wrap with cache-aside:
//   1. cacheGet(FEED_KEY) → if hit, set X-Cache: HIT, log, return
//   2. on miss: query db, cacheSet(FEED_KEY, posts, FEED_TTL), set X-Cache: MISS, log, return
app.get('/feed', async (req, res) => {
  try {
    const cachedPosts = await cacheGet(FEED_KEY);
    if (cachedPosts !== null) {
      console.log('[feed] HIT');
      return res.set('X-Cache', 'HIT').json(cachedPosts);
    }

    res.set('X-Cache', 'MISS');
    const posts = await db.getTrendingPosts();
    await cacheSet(FEED_KEY, posts, FEED_TTL);
    console.log('[feed] MISS');
    res.json(posts);
  } catch (err) {
    console.error('[feed] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /posts — creates a new post.
// TODO: call cacheDel(FEED_KEY) after db.createPost() to invalidate the stale cache.
app.post('/posts', async (req, res) => {
  try {
    const post = await db.createPost(req.body);
    await cacheDel(FEED_KEY);
    res.status(201).json(post);
  } catch (err) {
    console.error('[posts] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = { app };
