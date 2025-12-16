/**
 * Email Service
 * Main entry point for sending emails
 */

import { getSMTPProvider } from "./smtp";
import type { EmailMessage, SendEmailResult, EmailProvider } from "./provider";

export type { EmailMessage, EmailRecipient, SendEmailResult } from "./provider";

// Get the configured email provider
function getEmailProvider(): EmailProvider {
  const smtp = getSMTPProvider();
  if (smtp.isConfigured()) {
    return smtp;
  }

  throw new Error("No email provider configured. Please set SMTP credentials.");
}

// Send an email using the configured provider
export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  const provider = getEmailProvider();
  return provider.sendEmail(message);
}

// Check if email sending is available
export function isEmailConfigured(): boolean {
  try {
    const provider = getEmailProvider();
    return provider.isConfigured();
  } catch {
    return false;
  }
}

// Get provider name
export function getEmailProviderName(): string {
  try {
    const provider = getEmailProvider();
    return provider.name;
  } catch {
    return "none";
  }
}
