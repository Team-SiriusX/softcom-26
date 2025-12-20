/**
 * Email Templates
 * 
 * Reusable email templates for the application.
 * Used by agents and notification systems.
 */

export interface FinancialAlertTemplateData {
  businessName: string;
  alertType: "low_cash" | "high_expenses" | "overdue_payments" | "profit_margin" | "custom";
  alertTitle: string;
  alertMessage: string;
  actionRequired?: string;
  currentValue?: string;
  threshold?: string;
  dashboardUrl: string;
}

export interface BusinessReportTemplateData {
  businessName: string;
  reportPeriod: string;
  revenue: string;
  expenses: string;
  netIncome: string;
  profitMargin: string;
  cashBalance: string;
  keyInsights: string[];
  dashboardUrl: string;
}

export interface WelcomeEmailTemplateData {
  userName: string;
  dashboardUrl: string;
}

/**
 * Financial Alert Email Template
 */
export function financialAlertTemplate(data: FinancialAlertTemplateData): string {
  const alertEmoji = {
    low_cash: "⚠️",
    high_expenses: "📉",
    overdue_payments: "🔔",
    profit_margin: "📊",
    custom: "💡",
  };

  const emoji = alertEmoji[data.alertType];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Financial Alert - ${data.businessName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                ${emoji} Financial Alert
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px; font-weight: 600;">
                ${data.alertTitle}
              </h2>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                ${data.alertMessage}
              </p>
              
              ${data.currentValue && data.threshold ? `
              <table style="width: 100%; background-color: #f7fafc; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #2d3748;">Current Value:</strong>
                    <span style="color: #4a5568; margin-left: 8px;">${data.currentValue}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <strong style="color: #2d3748;">Threshold:</strong>
                    <span style="color: #4a5568; margin-left: 8px;">${data.threshold}</span>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              ${data.actionRequired ? `
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                <strong style="color: #856404; display: block; margin-bottom: 8px;">Action Required:</strong>
                <p style="margin: 0; color: #856404; font-size: 14px;">${data.actionRequired}</p>
              </div>
              ` : ''}
              
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.dashboardUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f7fafc; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #718096; font-size: 14px;">
                This is an automated alert from your AI CFO Assistant
              </p>
              <p style="margin: 8px 0 0; color: #718096; font-size: 12px;">
                ${data.businessName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Business Report Email Template
 */
export function businessReportTemplate(data: BusinessReportTemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Financial Report - ${data.businessName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                📊 Financial Report
              </h1>
              <p style="margin: 12px 0 0; color: #e2e8f0; font-size: 16px;">
                ${data.reportPeriod}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px; color: #1a1a1a; font-size: 20px; font-weight: 600;">
                ${data.businessName}
              </h2>
              
              <!-- KPIs -->
              <table style="width: 100%; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 16px; background-color: #f7fafc; border-radius: 6px 6px 0 0; border-bottom: 1px solid #e2e8f0;">
                    <div style="color: #718096; font-size: 14px; margin-bottom: 4px;">Revenue</div>
                    <div style="color: #2d3748; font-size: 24px; font-weight: 600;">${data.revenue}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
                    <div style="color: #718096; font-size: 14px; margin-bottom: 4px;">Expenses</div>
                    <div style="color: #2d3748; font-size: 24px; font-weight: 600;">${data.expenses}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
                    <div style="color: #718096; font-size: 14px; margin-bottom: 4px;">Net Income</div>
                    <div style="color: #2d3748; font-size: 24px; font-weight: 600;">${data.netIncome}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
                    <div style="color: #718096; font-size: 14px; margin-bottom: 4px;">Profit Margin</div>
                    <div style="color: #2d3748; font-size: 24px; font-weight: 600;">${data.profitMargin}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; background-color: #f7fafc; border-radius: 0 0 6px 6px;">
                    <div style="color: #718096; font-size: 14px; margin-bottom: 4px;">Cash Balance</div>
                    <div style="color: #2d3748; font-size: 24px; font-weight: 600;">${data.cashBalance}</div>
                  </td>
                </tr>
              </table>
              
              <!-- Key Insights -->
              ${data.keyInsights.length > 0 ? `
              <div style="margin-bottom: 32px;">
                <h3 style="margin: 0 0 16px; color: #2d3748; font-size: 18px; font-weight: 600;">
                  Key Insights
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; line-height: 1.8;">
                  ${data.keyInsights.map(insight => `<li style="margin-bottom: 8px;">${insight}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
              
              <!-- CTA -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.dashboardUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      View Full Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f7fafc; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #718096; font-size: 14px;">
                Generated by your AI CFO Assistant
              </p>
              <p style="margin: 8px 0 0; color: #718096; font-size: 12px;">
                ${data.businessName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Welcome Email Template
 */
export function welcomeEmailTemplate(data: WelcomeEmailTemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FinanceFlow</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;">
                Welcome to FinanceFlow! 🎉
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #2d3748; font-size: 18px;">
                Hi ${data.userName},
              </p>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Welcome to FinanceFlow - your AI-powered financial assistant! We're excited to help you manage your business finances with intelligence and ease.
              </p>
              
              <h3 style="margin: 32px 0 16px; color: #2d3748; font-size: 18px; font-weight: 600;">
                What you can do:
              </h3>
              
              <ul style="margin: 0 0 32px; padding-left: 20px; color: #4a5568; line-height: 1.8;">
                <li style="margin-bottom: 12px;">📊 Track income and expenses in real-time</li>
                <li style="margin-bottom: 12px;">🤖 Chat with your AI CFO for financial insights</li>
                <li style="margin-bottom: 12px;">📈 View automated financial reports and analytics</li>
                <li style="margin-bottom: 12px;">⚠️ Receive proactive alerts about your finances</li>
                <li style="margin-bottom: 12px;">💡 Get personalized recommendations</li>
              </ul>
              
              <!-- CTA -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.dashboardUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f7fafc; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #718096; font-size: 14px;">
                Need help? Reply to this email or visit our help center.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
