import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { sendEmailService } from '../services/email.service.js';
import Campaign from '../models/campaign.model.js';
import logger from '../utils/logger.js';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email-sending', { connection });

export interface EmailJobData {
  campaignId: string;
  subscriberEmail: string;
  subscriberName?: string;
  subject: string;
  html: string;
  totalRecipients: number;
}

export const addEmailToQueue = async (data: EmailJobData): Promise<void> => {
  await emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
};

const checkCampaignCompletion = async (campaignId: string): Promise<void> => {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return;

    const { sent, bounced } = campaign.stats;
    const totalProcessed = sent + bounced;

    if (totalProcessed >= campaign.stats.sent || totalProcessed >= (campaign.stats.sent + 50)) {
      if (campaign.status === 'sending') {
        campaign.status = 'completed';
        campaign.sentAt = new Date();
        await campaign.save();
        logger.info(`Campaign ${campaignId} marked as completed`);
      }
    }
  } catch (error) {
    logger.error(`Error checking campaign completion:`, error);
  }
};

export const processEmailJob = async (job: Job<EmailJobData>): Promise<void> => {
  const { campaignId, subscriberEmail, subscriberName, subject, html } = job.data;

  try {
    const replacedHtml = subscriberName
      ? html.replace(/{{name}}/gi, subscriberName)
      : html;

    await sendEmailService({
      to: subscriberEmail,
      subject,
      html: replacedHtml,
    });

    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { 'stats.sent': 1 },
    });

    logger.info(`Email sent to ${subscriberEmail} for campaign ${campaignId}`);
  } catch (error) {
    logger.error(`Failed to send email to ${subscriberEmail}:`, error);

    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { 'stats.bounced': 1 },
    });

    throw error;
  }
};

export const startEmailWorker = (): void => {
  const worker = new Worker<EmailJobData>(
    'email-sending',
    async (job) => {
      await processEmailJob(job);
      await checkCampaignCompletion(job.data.campaignId);
    },
    {
      connection,
      concurrency: 10,
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on('failed', async (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err.message);
    if (job?.data?.campaignId) {
      await checkCampaignCompletion(job.data.campaignId);
    }
  });

  logger.info('Email worker started');
};