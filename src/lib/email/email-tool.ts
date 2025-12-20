/**
 * Email Tool for LangGraph Agent
 * 
 * Allows the LangGraph agent to send emails as part of its workflow.
 * Can be used for alerts, reports, notifications, and more.
 */

import { sendEmail, SendEmailOptions, isResendConfigured } from "./resend-client";
import {
  financialAlertTemplate,
  businessReportTemplate,
  welcomeEmailTemplate,
  FinancialAlertTemplateData,
  BusinessReportTemplateData,
  WelcomeEmailTemplateData,
} from "./templates";

export interface EmailToolInput {
  type: "alert" | "report" | "welcome" | "custom";
  to: string | string[];
  subject?: string;
  data?: any;
  customHtml?: string;
  customText?: string;
}

export interface EmailToolOutput {
  success: boolean;
  messageId?: string;
  error?: string;
  message: string;
}

/**
 * Email sending tool for LangGraph agents
 * 
 * This can be registered as a tool in your LangGraph workflow
 * to enable the agent to send emails based on its analysis.
 */
export async function emailTool(input: EmailToolInput): Promise<EmailToolOutput> {
  // Check if Resend is configured
  if (!isResendConfigured()) {
    return {
      success: false,
      error: "Email service not configured. Set RESEND_API_KEY and RESEND_EMAIL.",
      message: "Email service is not configured",
    };
  }

  try {
    let emailOptions: SendEmailOptions;

    // Build email based on type
    switch (input.type) {
      case "alert":
        if (!input.data) {
          throw new Error("Alert data is required for alert emails");
        }
        emailOptions = {
          to: input.to,
          subject: input.subject || `Financial Alert: ${input.data.alertTitle}`,
          html: financialAlertTemplate(input.data as FinancialAlertTemplateData),
          tags: [
            { name: "type", value: "alert" },
            { name: "business", value: input.data.businessName || "unknown" },
          ],
        };
        break;

      case "report":
        if (!input.data) {
          throw new Error("Report data is required for report emails");
        }
        emailOptions = {
          to: input.to,
          subject: input.subject || `Financial Report - ${input.data.businessName}`,
          html: businessReportTemplate(input.data as BusinessReportTemplateData),
          tags: [
            { name: "type", value: "report" },
            { name: "business", value: input.data.businessName || "unknown" },
          ],
        };
        break;

      case "welcome":
        if (!input.data) {
          throw new Error("User data is required for welcome emails");
        }
        emailOptions = {
          to: input.to,
          subject: input.subject || "Welcome to FinanceFlow",
          html: welcomeEmailTemplate(input.data as WelcomeEmailTemplateData),
          tags: [
            { name: "type", value: "welcome" },
          ],
        };
        break;

      case "custom":
        if (!input.customHtml && !input.customText) {
          throw new Error("Custom HTML or text is required for custom emails");
        }
        if (!input.subject) {
          throw new Error("Subject is required for custom emails");
        }
        emailOptions = {
          to: input.to,
          subject: input.subject,
          html: input.customHtml,
          text: input.customText,
          tags: [
            { name: "type", value: "custom" },
          ],
        };
        break;

      default:
        throw new Error(`Unknown email type: ${input.type}`);
    }

    // Send the email
    const result = await sendEmail(emailOptions);

    if (result.success) {
      return {
        success: true,
        messageId: result.messageId,
        message: `Email sent successfully to ${Array.isArray(input.to) ? input.to.join(", ") : input.to}`,
      };
    } else {
      return {
        success: false,
        error: result.error,
        message: `Failed to send email: ${result.error}`,
      };
    }
  } catch (error) {
    console.error("[Email Tool] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: `Email tool error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Helper function to send financial alerts
 */
export async function sendFinancialAlert(
  to: string | string[],
  data: FinancialAlertTemplateData
): Promise<EmailToolOutput> {
  return emailTool({
    type: "alert",
    to,
    data,
  });
}

/**
 * Helper function to send business reports
 */
export async function sendBusinessReport(
  to: string | string[],
  data: BusinessReportTemplateData
): Promise<EmailToolOutput> {
  return emailTool({
    type: "report",
    to,
    data,
  });
}

/**
 * Helper function to send welcome emails
 */
export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailTemplateData
): Promise<EmailToolOutput> {
  return emailTool({
    type: "welcome",
    to,
    data,
  });
}

/**
 * LangGraph Tool Definition
 * 
 * Example of how to register this as a tool in LangGraph:
 * 
 * ```typescript
 * import { emailTool } from "@/lib/email";
 * 
 * const tools = [
 *   {
 *     name: "send_email",
 *     description: "Send an email to notify users about financial insights, alerts, or reports. " +
 *                  "Use this when you need to communicate important information via email. " +
 *                  "Supports alert, report, welcome, and custom email types.",
 *     schema: {
 *       type: "object",
 *       properties: {
 *         type: {
 *           type: "string",
 *           enum: ["alert", "report", "welcome", "custom"],
 *           description: "The type of email to send"
 *         },
 *         to: {
 *           type: ["string", "array"],
 *           description: "Recipient email address(es)"
 *         },
 *         subject: {
 *           type: "string",
 *           description: "Email subject (optional for templated emails)"
 *         },
 *         data: {
 *           type: "object",
 *           description: "Template-specific data object"
 *         },
 *         customHtml: {
 *           type: "string",
 *           description: "Custom HTML content (for custom type)"
 *         },
 *         customText: {
 *           type: "string",
 *           description: "Custom text content (for custom type)"
 *         }
 *       },
 *       required: ["type", "to"]
 *     },
 *     func: emailTool
 *   }
 * ];
 * ```
 */
