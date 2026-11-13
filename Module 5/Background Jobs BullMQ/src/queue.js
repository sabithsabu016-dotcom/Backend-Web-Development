'use strict';

require('dotenv').config();

const { Queue } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
};

const emailQueue = new Queue('email', { connection });

module.exports = { emailQueue, connection };
