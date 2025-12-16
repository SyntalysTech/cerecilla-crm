/**
 * Amazon SES Email Provider
 *
 * This is a stub implementation for Amazon SES.
 * Configure the following environment variables to enable SES:
 *
 * - AWS_REGION: AWS region (e.g., eu-west-1)
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 * - SES_FROM_ADDRESS: Default from email address
 * - SES_CONFIGURATION_SET: (optional) SES configuration set name
 */

import type { EmailProvider, EmailMessage, SendEmailResult } from "./provider";

export class SESProvider implements EmailProvider {
  name = "ses";

  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private fromAddress: string;
  private configurationSet: string | undefined;

  constructor() {
    this.region = process.env.AWS_REGION || "eu-west-1";
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
    this.fromAddress = process.env.SES_FROM_ADDRESS || "";
    this.configurationSet = process.env.SES_CONFIGURATION_SET;
  }

  isConfigured(): boolean {
    return Boolean(
      this.accessKeyId &&
        this.secretAccessKey &&
        this.fromAddress &&
        this.region
    );
  }

  async sendEmail(message: EmailMessage): Promise<SendEmailResult> {
    // TODO: Implement actual SES sending
    // This requires the @aws-sdk/client-ses package
    //
    // Example implementation:
    //
    // import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
    //
    // const client = new SESClient({
    //   region: this.region,
    //   credentials: {
    //     accessKeyId: this.accessKeyId,
    //     secretAccessKey: this.secretAccessKey,
    //   },
    // });
    //
    // const command = new SendEmailCommand({
    //   Source: message.from.email,
    //   Destination: {
    //     ToAddresses: message.to.map(r => r.email),
    //     CcAddresses: message.cc?.map(r => r.email),
    //     BccAddresses: message.bcc?.map(r => r.email),
    //   },
    //   Message: {
    //     Subject: { Data: message.subject },
    //     Body: {
    //       Html: { Data: message.html },
    //       Text: message.text ? { Data: message.text } : undefined,
    //     },
    //   },
    //   ConfigurationSetName: this.configurationSet,
    // });
    //
    // const result = await client.send(command);
    // return { success: true, messageId: result.MessageId };

    if (!this.isConfigured()) {
      return {
        success: false,
        error: "SES provider is not configured. Please set AWS credentials.",
      };
    }

    // Stub: Log the message details for debugging
    console.log("[SES Stub] Would send email:", {
      to: message.to.map((r) => r.email),
      subject: message.subject,
      from: message.from.email,
    });

    return {
      success: false,
      error: "SES sending not yet implemented. Install @aws-sdk/client-ses and uncomment the implementation.",
    };
  }
}

// Singleton instance
let sesProvider: SESProvider | null = null;

export function getSESProvider(): SESProvider {
  if (!sesProvider) {
    sesProvider = new SESProvider();
  }
  return sesProvider;
}
