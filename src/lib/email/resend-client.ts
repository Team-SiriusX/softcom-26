/**
 * Resend Email Client
 * 
 * Centralized email sending utility using Resend API.
 * Used by LangGraph agents and other parts of the application.
 */

import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    // Validate required fields
    if (!options.to || !options.subject || (!options.html && !options.text)) {
      throw new Error("Missing required email fields: to, subject, and html/text");
    }

    // Use configured from address or default
    const from = options.from || process.env.RESEND_EMAIL || "noreply@nexcodes.me";

    // Build email payload, filtering out undefined values
    const emailPayload: Record<string, any> = {
      from,
      to: options.to,
      subject: options.subject,
    };

    if (options.html) emailPayload.html = options.html;
    if (options.text) emailPayload.text = options.text;
    if (options.replyTo) emailPayload.replyTo = options.replyTo;
    if (options.cc) emailPayload.cc = options.cc;
    if (options.bcc) emailPayload.bcc = options.bcc;
    if (options.attachments) emailPayload.attachments = options.attachments;
    if (options.tags) emailPayload.tags = options.tags;

    // Send email
    const { data, error } = await resend.emails.send(emailPayload as any);

    if (error) {
      console.error("[Email] Send failed:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a batch of emails (max 100 per request)
 */
export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<SendEmailResult[]> {
  const results: SendEmailResult[] = [];

  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);
  }

  return results;
}

/**
 * Check if Resend is configured
 */
export function isResendConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_EMAIL);
}

export { resend };
