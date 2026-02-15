import nodemailer from 'nodemailer';
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
// SMTP Email Service (Production)
// Time Complexity: O(1)
// ============================================

class SMTPEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Get SMTP configuration from environment variables
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailFrom = process.env.EMAIL_FROM;

    logger.info(`Initializing SMTP Email Service: ${smtpHost}:${smtpPort}`);

    // Create transporter based on port
    if (smtpPort === 465) {
      // Use SSL for port 465
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: true, // true for 465
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      // Use TLS for other ports
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false, // false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    // Verify connection on startup
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
    }
  }

  /**
   * Send email via SMTP
   * Time Complexity: O(1)
   */
  async send(options: IEmailOptions): Promise<IEmailResult> {
    const emailFrom = process.env.EMAIL_FROM || 'MyApp Support <noreply@myapp.com>';
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    try {
      const info = await this.transporter.sendMail({
        from: emailFrom,
        to: recipients,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info(`Email sent successfully to ${recipients}: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      logger.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send verification email with OTP
   * Time Complexity: O(1)
   */
  async sendVerificationEmail(email: string, otp: string): Promise<IEmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; }
          .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for registering with us. Please use the following code to verify your email address:</p>
            <p class="otp-code">${otp}</p>
            <p>This code will expire in 24 hours.</p>
            <p>If you did not create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MyApp. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: 'Email Verification Code - MyApp',
      html,
    });
  }

  /**
   * Send password reset email
   * Time Complexity: O(1)
   */
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<IEmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <p><a href="${resetLink}" class="button">Reset Password</a></p>
            <p>Or copy and paste this link: ${resetLink}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MyApp. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: 'Password Reset Request - MyApp',
      html,
    });
  }
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
    // Check if SMTP credentials are available
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const nodeEnv = process.env.NODE_ENV || 'development';

    if (smtpUser && smtpPass) {
      // Use SMTP service in production or when credentials are available
      emailService = new SMTPEmailService();
      logger.info('Using SMTP Email Service');
    } else {
      // Fall back to console service
      emailService = new ConsoleEmailService();
      logger.info('Using Console Email Service (no SMTP credentials)');
    }
  }
  return emailService;
};

export const setEmailService = (service: IEmailService): void => {
  emailService = service;
};
