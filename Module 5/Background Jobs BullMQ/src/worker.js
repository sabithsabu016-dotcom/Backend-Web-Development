'use strict';

const { Worker } = require('bullmq');
const { transporter } = require('./email');
const { connection } = require('./queue');

const worker = new Worker(
  'email',
  async (job) => {
    if (job.name === 'otp') {
      const { to, otp } = job.data;

      await transporter.sendMail({
        from: 'No Reply <noreply@example.com>',
        to,
        subject: 'Your verification code',
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      });

      return { sent: true, to, otp };
    }

    return { ok: true };
  },
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Worker completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`Worker failed job ${job?.id}:`, err.message);
});

module.exports = { worker };
