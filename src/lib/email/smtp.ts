/**
 * SMTP Email Provider using Nodemailer
 * Configured for Amazon SES SMTP
 */

import nodemailer from "nodemailer";
import type { EmailProvider, EmailMessage, SendEmailResult } from "./provider";

export class SMTPProvider implements EmailProvider {
  name = "smtp";

  private host: string;
  private port: number;
  private user: string;
  private pass: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.host = process.env.SMTP_HOST || "";
    this.port = parseInt(process.env.SMTP_PORT || "587", 10);
    this.user = process.env.SMTP_USER || "";
    this.pass = process.env.SMTP_PASS || "";
    this.fromEmail = process.env.SMTP_FROM || "";
    this.fromName = process.env.SMTP_FROM_NAME || "Cerecilla";
  }

  isConfigured(): boolean {
    return Boolean(
      this.host &&
      this.port &&
      this.user &&
      this.pass &&
      this.fromEmail
    );
  }

  private createTransporter() {
    return nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: this.port === 465,
      auth: {
        user: this.user,
        pass: this.pass,
      },
    });
  }

  async sendEmail(message: EmailMessage): Promise<SendEmailResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "SMTP provider is not configured. Please set SMTP credentials in environment variables.",
      };
    }

    try {
      const transporter = this.createTransporter();

      const from = message.from?.email
        ? `"${message.from.name || this.fromName}" <${message.from.email}>`
        : `"${this.fromName}" <${this.fromEmail}>`;

      const to = message.to.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email);
      const cc = message.cc?.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email);
      const bcc = message.bcc?.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email);

      const mailOptions: nodemailer.SendMailOptions = {
        from,
        to,
        cc,
        bcc,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo?.email,
      };

      const result = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("[SMTP] Error sending email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error sending email",
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const transporter = this.createTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error("[SMTP] Connection verification failed:", error);
      return false;
    }
  }
}

// Singleton instance
let smtpProvider: SMTPProvider | null = null;

export function getSMTPProvider(): SMTPProvider {
  if (!smtpProvider) {
    smtpProvider = new SMTPProvider();
  }
  return smtpProvider;
}
