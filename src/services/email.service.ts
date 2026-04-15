// src/services/email.service.ts

import { mg } from '../config/mailgun';
import { SendEmailDto } from '../types/email.types';

const DOMAIN = process.env.MAILGUN_DOMAIN as string;

export const sendEmailService = async (data: SendEmailDto) => {
  try {
    const messageData: any = {
      from: `Mailgun Sandbox <postmaster@${DOMAIN}>`,
      to: [data.to],
      subject: data.subject,
    };

    if (data.html) {
      messageData.html = data.html;
    } else if (data.text) {
      messageData.text = data.text;
    }

    const response = await mg.messages.create(DOMAIN, messageData);

    return response;
  } catch (error: any) {
    console.error('Mailgun Error:', error);
    throw new Error(error.message || 'Email sending failed');
  }
};