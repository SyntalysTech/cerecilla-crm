/**
 * Email Provider Interface
 *
 * This interface defines the contract for email providers.
 * Implement this interface to add support for different email services.
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  from: EmailRecipient;
  replyTo?: EmailRecipient;
  subject: string;
  html: string;
  text?: string;
  tags?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  /**
   * Provider name identifier
   */
  name: string;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Send an email
   */
  sendEmail(message: EmailMessage): Promise<SendEmailResult>;
}
