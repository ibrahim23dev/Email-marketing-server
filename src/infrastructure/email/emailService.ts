import logger from '../../utils/logger';

// ============================================
// Email Types
// ============================================

export interface IEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// Email Service Interface
// ============================================

export interface IEmailService {
  send(options: IEmailOptions): Promise<IEmailResult>;
  sendVerificationEmail(email: string, otp: string): Promise<IEmailResult>;
  sendPasswordResetEmail(email: string, resetLink: string): Promise<IEmailResult>;
}

// ============================================
// Console Email Service (Development/Testing)
// Time Complexity: O(1)
// ============================================

export class ConsoleEmailService implements IEmailService {
  /**
   * Send email to console
   * Time Complexity: O(1)
   */
  async send(options: IEmailOptions): Promise<IEmailResult> {
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    logger.info('========================================');
    logger.info('📧 EMAIL SENT (Console Mode)');
    logger.info('========================================');
    logger.info(`To: ${recipients}`);
    logger.info(`Subject: ${options.subject}`);
    logger.info(`Body: ${options.html.substring(0, 100)}...`);
    logger.info('========================================');

    return {
      success: true,
      messageId: `console-${Date.now()}`,
    };
  }

  /**
   * Send verification email
   * Time Complexity: O(1)
   */
  async sendVerificationEmail(email: string, otp: string): Promise<IEmailResult> {
    const html = '<h1>Verify Your Email</h1>' +
      '<p>Your verification code is: <strong>' + otp + '</strong></p>' +
      '<p>This code expires in 24 hours.</p>';
    return this.send({
      to: email,
      subject: 'Email Verification Code',
      html,
    });
  }

  /**
   * Send password reset email
   * Time Complexity: O(1)
   */
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<IEmailResult> {
    const html = '<h1>Password Reset</h1>' +
      '<p>Click the link below to reset your password:</p>' +
      '<a href="' + resetLink + '">' + resetLink + '</a>' +
      '<p>This link expires in 1 hour.</p>';
    return this.send({
      to: email,
      subject: 'Password Reset Request',
      html,
    });
  }
}

// ============================================
// Email Factory
// ============================================

let emailService: IEmailService | null = null;

export const getEmailService = (): IEmailService => {
  if (!emailService) {
    emailService = new ConsoleEmailService();
  }
  return emailService;
};

export const setEmailService = (service: IEmailService): void => {
  emailService = service;
};
