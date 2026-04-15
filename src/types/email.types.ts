export interface SendEmailDto {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}