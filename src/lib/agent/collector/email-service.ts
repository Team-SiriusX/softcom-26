/**
 * CollectorAI Email Service
 * Sends collection emails via Resend/Nodemailer
 */

import { sendEmail } from "@/lib/email/resend-client";
import type { EmailConfig, ActionResult } from "./types";
import type { EscalationLevel } from "@/generated/prisma";

export async function sendCollectionEmail(config: EmailConfig): Promise<ActionResult> {
  try {
    const html = generateEmailHTML(config);
    
    const result = await sendEmail({
      to: config.to,
      subject: config.subject,
      html,
    });

    if (result.success) {
      return {
        success: true,
        message: `Email sent successfully to ${config.to}`,
      };
    } else {
      return {
        success: false,
        message: "Email sending failed",
        error: result.error || "Unknown error",
      };
    }
  } catch (error) {
    console.error("[CollectorAI] Email error:", error);
    return {
      success: false,
      message: "Email sending failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function generateEmailHTML(config: EmailConfig): string {
  const { invoice, escalationLevel, body } = config;
  
  const urgencyColor = getUrgencyColor(escalationLevel);
  const urgencyLabel = getUrgencyLabel(escalationLevel);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .urgency-badge {
      display: inline-block;
      padding: 8px 16px;
      background: ${urgencyColor};
      color: white;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 10px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .invoice-details {
      background: white;
      border-left: 4px solid ${urgencyColor};
      padding: 20px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: #6b7280;
    }
    .value {
      font-weight: 700;
      color: #111827;
    }
    .amount {
      font-size: 24px;
      color: ${urgencyColor};
    }
    .body-text {
      white-space: pre-wrap;
      line-height: 1.8;
      margin: 20px 0;
    }
    .cta-button {
      display: inline-block;
      background: ${urgencyColor};
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 28px;">Invoice ${invoice.number}</h1>
    <div class="urgency-badge">${urgencyLabel}</div>
  </div>
  
  <div class="content">
    <div class="invoice-details">
      <div class="detail-row">
        <span class="label">Invoice Number:</span>
        <span class="value">${invoice.number}</span>
      </div>
      <div class="detail-row">
        <span class="label">Due Date:</span>
        <span class="value">${formatDate(invoice.dueDate)}</span>
      </div>
      <div class="detail-row">
        <span class="label">Days Overdue:</span>
        <span class="value">${calculateDaysOverdue(invoice.dueDate)} days</span>
      </div>
      <div class="detail-row" style="margin-top: 10px;">
        <span class="label">Amount Due:</span>
        <span class="value amount">${invoice.currency} ${invoice.amount.toFixed(2)}</span>
      </div>
    </div>
    
    <div class="body-text">${body.replace(/\n/g, '<br>')}</div>
    
    <div style="text-align: center;">
      <a href="mailto:billing@yourcompany.com?subject=Re: Invoice ${invoice.number}" class="cta-button">
        Respond to this Invoice
      </a>
    </div>
    
    <div class="footer">
      <p>This is an automated message from CollectorAI</p>
      <p>If you have any questions, please contact us at billing@yourcompany.com</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function getUrgencyColor(level: EscalationLevel): string {
  switch (level) {
    case "NONE":
    case "FRIENDLY_REMINDER":
      return "#10b981"; // green
    case "FIRM_REMINDER":
      return "#f59e0b"; // amber
    case "URGENT_NOTICE":
      return "#ef4444"; // red
    case "FINAL_NOTICE":
    case "LEGAL_WARNING":
      return "#dc2626"; // dark red
    default:
      return "#6b7280"; // gray
  }
}

function getUrgencyLabel(level: EscalationLevel): string {
  return level.replace(/_/g, " ");
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function calculateDaysOverdue(dueDate: Date): number {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
