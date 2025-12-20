/**
 * CollectorAI - LangGraph Autonomous Collection Agent
 * 
 * This agent uses LangGraph to orchestrate invoice collection workflow
 * with intelligent decision-making powered by Gemini AI
 */

import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { db } from "@/lib/db";
import { getRedisClient } from "@/lib/upstash/redis";
import { sendCollectionEmail } from "./email-service";
import type { AgentState, InvoiceWithRelations, ClientHistory, CollectionDecision } from "./types";
import { EscalationLevel, CollectionActionType, InvoiceStatus } from "@/generated/prisma";

// ============================================
// GEMINI MODEL SETUP
// ============================================

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
  temperature: 0.7,
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateDaysOverdue(dueDate: Date): number {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function mapEscalationToActionType(level: EscalationLevel): CollectionActionType {
  const mapping: Record<EscalationLevel, CollectionActionType> = {
    NONE: "SEND_INVOICE",
    FRIENDLY_REMINDER: "FRIENDLY_REMINDER",
    FIRM_REMINDER: "FIRM_REMINDER",
    URGENT_NOTICE: "URGENT_NOTICE",
    FINAL_NOTICE: "FINAL_NOTICE",
    LEGAL_WARNING: "LEGAL_WARNING",
  };
  return mapping[level] || "FRIENDLY_REMINDER";
}

function determineInvoiceStatus(invoice: any, escalationLevel: EscalationLevel): InvoiceStatus {
  if (escalationLevel === "FINAL_NOTICE" || escalationLevel === "LEGAL_WARNING") {
    return "OVERDUE";
  }
  return invoice.status;
}

// ============================================
// GRAPH NODES
// ============================================

/**
 * NODE 1: Load invoices that need attention
 */
async function loadInvoices(state: AgentState): Promise<Partial<AgentState>> {
  console.log(`[CollectorAI] Loading invoices for business: ${state.businessId}`);
  
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  const invoices = await db.invoice.findMany({
    where: {
      businessId: state.businessId,
      status: {
        in: ["SENT", "OVERDUE", "PARTIAL"],
      },
      OR: [
        // Never followed up and overdue
        {
          lastFollowUpAt: null,
          dueDate: { lte: now },
        },
        // Last follow-up was > 3 days ago
        {
          lastFollowUpAt: { lte: threeDaysAgo },
        },
        // Scheduled for action today
        {
          nextActionDate: { lte: now },
        },
      ],
    },
    include: {
      client: true,
      collectionActions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      paymentPlan: true,
    },
    orderBy: {
      dueDate: "asc",
    },
    take: 50, // Process max 50 invoices per run
  });

  console.log(`[CollectorAI] Found ${invoices.length} invoices to process`);

  return {
    invoicesToProcess: invoices as InvoiceWithRelations[],
    stats: {
      ...state.stats,
      processed: 0,
    },
  };
}

/**
 * NODE 2: Select next invoice to process
 */
async function selectInvoice(state: AgentState): Promise<Partial<AgentState>> {
  if (state.invoicesToProcess.length === 0) {
    console.log("[CollectorAI] No more invoices to process");
    return { currentInvoice: null };
  }

  const invoice = state.invoicesToProcess[0];
  const remaining = state.invoicesToProcess.slice(1);

  console.log(`[CollectorAI] Processing invoice: ${invoice.invoiceNumber}`);

  return {
    currentInvoice: invoice,
    invoicesToProcess: remaining,
  };
}

/**
 * NODE 3: Analyze client payment history
 */
async function analyzeClientHistory(state: AgentState): Promise<Partial<AgentState>> {
  const invoice = state.currentInvoice!;
  const clientEmail = invoice.client?.email || "";
  
  if (!clientEmail) {
    return {
      clientHistory: {
        totalInvoices: 0,
        totalPaid: 0,
        paidOnTime: 0,
        avgDaysToPayment: 0,
        reliabilityScore: 1.0,
        currentOverdueCount: 0,
        currentOverdueAmount: 0,
      },
    };
  }

  // Check cache first
  const redis = getRedisClient();
  const cacheKey = `client_history:${state.businessId}:${clientEmail}`;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return { clientHistory: JSON.parse(cached as string) };
    }
  } catch (err) {
    console.warn("[CollectorAI] Redis cache miss:", err);
  }

  // Fetch from database
  const allClientInvoices = await db.invoice.findMany({
    where: {
      businessId: state.businessId,
      client: {
        email: clientEmail,
      },
    },
    orderBy: { issueDate: "desc" },
  });

  const paidInvoices = allClientInvoices.filter(
    (i) => i.status === "PAID" && i.paidAmount.toNumber() >= i.total.toNumber()
  );

  const totalInvoices = allClientInvoices.length;
  const totalPaid = paidInvoices.length;
  
  // Calculate paid on time
  const paidOnTime = paidInvoices.filter((i) => {
    // Assume payment date is when paidAmount reached total
    return i.updatedAt <= i.dueDate;
  }).length;

  const avgDaysToPayment =
    paidInvoices.length > 0
      ? paidInvoices.reduce((sum, inv) => {
          const days = Math.max(
            0,
            Math.ceil(
              (inv.updatedAt.getTime() - inv.issueDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );
          return sum + days;
        }, 0) / paidInvoices.length
      : 0;

  const currentOverdue = allClientInvoices.filter((i) => i.status === "OVERDUE");
  const currentOverdueAmount = currentOverdue.reduce((sum, i) => sum + i.total.toNumber(), 0);

  const reliabilityScore =
    totalInvoices > 0 ? paidOnTime / totalInvoices : 1.0;

  const history: ClientHistory = {
    totalInvoices,
    totalPaid,
    paidOnTime,
    avgDaysToPayment: Math.round(avgDaysToPayment),
    reliabilityScore: Math.round(reliabilityScore * 100) / 100,
    currentOverdueCount: currentOverdue.length,
    currentOverdueAmount,
  };

  // Cache for 1 hour
  try {
    await redis.set(cacheKey, JSON.stringify(history), { ex: 3600 });
  } catch (err) {
    console.warn("[CollectorAI] Redis cache set failed:", err);
  }

  return { clientHistory: history };
}

/**
 * NODE 4: Make intelligent decision using Gemini AI
 */
async function makeDecision(state: AgentState): Promise<Partial<AgentState>> {
  const invoice = state.currentInvoice!;
  const history = state.clientHistory!;

  const daysOverdue = calculateDaysOverdue(invoice.dueDate);
  const clientName = invoice.client?.name || "Valued Customer";
  const clientEmail = invoice.client?.email || "";
  
  // Build prompt for Gemini
  const prompt = `You are CollectorAI, an expert invoice collection agent. Analyze this situation and decide the best action.

INVOICE DETAILS:
- Invoice Number: ${invoice.invoiceNumber}
- Client: ${clientName} <${clientEmail}>
- Amount: ${invoice.total.toNumber().toFixed(2)} ${invoice.businessId.includes("PKR") ? "PKR" : "USD"}
- Issue Date: ${formatDate(invoice.issueDate)}
- Due Date: ${formatDate(invoice.dueDate)}
- Days Overdue: ${daysOverdue} days
- Current Status: ${invoice.status}
- Follow-ups Sent: ${invoice.followUpCount}
- Current Escalation: ${invoice.escalationLevel || "NONE"}
- Paid Amount: ${invoice.paidAmount.toNumber().toFixed(2)}

CLIENT PAYMENT HISTORY:
- Total Invoices: ${history.totalInvoices}
- Paid Invoices: ${history.totalPaid}
- Paid On Time: ${history.paidOnTime}
- Average Days to Payment: ${history.avgDaysToPayment}
- Reliability Score: ${(history.reliabilityScore * 100).toFixed(0)}%
- Current Overdue Invoices: ${history.currentOverdueCount}
- Current Overdue Amount: ${history.currentOverdueAmount.toFixed(2)}

PREVIOUS ACTIONS:
${invoice.collectionActions && invoice.collectionActions.length > 0
  ? invoice.collectionActions
      .map(
        (a: any) =>
          `- ${a.actionType} on ${formatDate(a.createdAt)} (Status: ${a.status})`
      )
      .join("\n")
  : "- No previous actions"}

ESCALATION RULES:
- Days 1-3 overdue: FRIENDLY_REMINDER (gentle, understanding tone)
- Days 4-7 overdue: FIRM_REMINDER (professional, clear urgency)
- Days 8-14 overdue: URGENT_NOTICE (serious, requires immediate attention)
- Days 15-30 overdue: FINAL_NOTICE (very serious, mention consequences)
- Days 30+ overdue: LEGAL_WARNING (formal, legal action mentioned)

SPECIAL CONSIDERATIONS:
- If client has 80%+ reliability and this is first time late: Be extra gentle
- If client has <50% reliability: Be firmer earlier
- If amount > 5000 and overdue 7+ days: Consider payment plan
- If no response after 3 follow-ups: Escalate or flag for manual review
- If client has active payment plan: Don't send collection emails

AVAILABLE ACTIONS:
1. SEND_REMINDER - Send email reminder
2. OFFER_PAYMENT_PLAN - Propose installment payment (4 monthly installments)
3. ESCALATE - Move to next escalation level
4. WAIT - Hold off (reliable client, not urgent yet)
5. MANUAL_REVIEW - Too complex, needs human attention

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "action": "SEND_REMINDER",
  "reasoning": "Clear explanation in 2-3 sentences",
  "escalationLevel": "FRIENDLY_REMINDER",
  "emailSubject": "Compelling subject line",
  "emailBody": "Professional email body (3-4 paragraphs, use client name ${clientName}, be appropriate for escalation level)",
  "waitDays": 3
}

IMPORTANT: 
- Email body must be personalized with client name
- Tone must match escalation level
- Be professional but empathetic
- Include clear call-to-action
- Mention specific invoice number and amount`;

  try {
    const response = await model.invoke(prompt);
    const content = response.content.toString();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
    }
    
    const decision: CollectionDecision = JSON.parse(jsonStr);
    
    console.log(`[CollectorAI] Decision: ${decision.action}`);
    console.log(`[CollectorAI] Reasoning: ${decision.reasoning}`);

    return { decision };
  } catch (error: any) {
    console.error("[CollectorAI] Decision error:", error);
    
    // Fallback decision
    return {
      decision: {
        action: "MANUAL_REVIEW",
        reasoning: `Error making AI decision: ${error.message}. Flagging for manual review.`,
        escalationLevel: invoice.escalationLevel || "NONE",
      },
    };
  }
}

/**
 * NODE 5: Execute the decision
 */
async function executeAction(state: AgentState): Promise<Partial<AgentState>> {
  const invoice = state.currentInvoice!;
  const decision = state.decision!;

  try {
    switch (decision.action) {
      case "SEND_REMINDER":
      case "ESCALATE":
        return await sendReminderEmail(state);

      case "OFFER_PAYMENT_PLAN":
        return await offerPaymentPlan(state);

      case "WAIT":
        return await scheduleNextAction(state);

      case "MANUAL_REVIEW":
        return await flagForManualReview(state);

      default:
        throw new Error(`Unknown action: ${decision.action}`);
    }
  } catch (error: any) {
    console.error(`[CollectorAI] Action execution error:`, error);
    
    return {
      stats: {
        ...state.stats,
        errors: state.stats.errors + 1,
      },
      errors: [...state.errors, `Invoice ${invoice.invoiceNumber}: ${error.message}`],
    };
  }
}

/**
 * ACTION: Send reminder email
 */
async function sendReminderEmail(state: AgentState): Promise<Partial<AgentState>> {
  const invoice = state.currentInvoice!;
  const decision = state.decision!;
  const clientEmail = invoice.client?.email || "";
  const clientName = invoice.client?.name || "Valued Customer";

  if (!clientEmail) {
    return {
      stats: {
        ...state.stats,
        processed: state.stats.processed + 1,
        errors: state.stats.errors + 1,
      },
      errors: [...state.errors, `Invoice ${invoice.invoiceNumber}: No client email`],
    };
  }

  // Create action record
  const action = await db.collectionAction.create({
    data: {
      invoiceId: invoice.id,
      executionLogId: state.executionLogId,
      actionType: mapEscalationToActionType(decision.escalationLevel!),
      channel: "EMAIL",
      status: "PENDING",
      emailSubject: decision.emailSubject,
      emailBody: decision.emailBody,
      sentToEmail: clientEmail,
      aiReasoning: decision.reasoning,
      scheduledFor: new Date(),
    },
  });

  // Send email
  const emailResult = await sendCollectionEmail({
    to: clientEmail,
    subject: decision.emailSubject!,
    body: decision.emailBody!,
    invoice: {
      number: invoice.invoiceNumber,
      amount: invoice.total.toNumber(),
      currency: "USD",
      dueDate: invoice.dueDate,
      clientName,
    },
    escalationLevel: decision.escalationLevel!,
  });

  // Update action status
  await db.collectionAction.update({
    where: { id: action.id },
    data: {
      status: emailResult.success ? "COMPLETED" : "FAILED",
      sentAt: emailResult.success ? new Date() : null,
      emailSent: emailResult.success,
      executedAt: new Date(),
      result: emailResult.message,
      errorMessage: emailResult.error,
    },
  });

  // Update invoice
  const nextActionDate = new Date();
  nextActionDate.setDate(nextActionDate.getDate() + 3); // Next action in 3 days

  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      lastFollowUpAt: new Date(),
      followUpCount: { increment: 1 },
      escalationLevel: decision.escalationLevel,
      status: determineInvoiceStatus(invoice, decision.escalationLevel!),
      agentNotes: decision.reasoning,
      nextActionDate,
    },
  });

  console.log(`[CollectorAI] ✅ Sent ${decision.escalationLevel} to ${clientEmail}`);

  return {
    stats: {
      ...state.stats,
      processed: state.stats.processed + 1,
      actionsTaken: state.stats.actionsTaken + 1,
      emailsSent: state.stats.emailsSent + (emailResult.success ? 1 : 0),
      errors: state.stats.errors + (emailResult.success ? 0 : 1),
    },
  };
}

/**
 * ACTION: Offer payment plan
 */
async function offerPaymentPlan(state: AgentState): Promise<Partial<AgentState>> {
  const invoice = state.currentInvoice!;
  const decision = state.decision!;
  const clientEmail = invoice.client?.email || "";
  const clientName = invoice.client?.name || "Valued Customer";

  if (!clientEmail) {
    return {
      stats: {
        ...state.stats,
        processed: state.stats.processed + 1,
        errors: state.stats.errors + 1,
      },
      errors: [...state.errors, `Invoice ${invoice.invoiceNumber}: No client email`],
    };
  }

  // Create payment plan
  const installmentAmount = invoice.total.toNumber() / 4;
  const startDate = new Date();
  const nextDueDate = new Date(startDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  const plan = await db.paymentPlan.create({
    data: {
      invoiceId: invoice.id,
      totalAmount: invoice.total.toNumber(),
      installments: 4,
      installmentAmount,
      frequency: "MONTHLY",
      startDate,
      nextDueDate,
      status: "PROPOSED",
    },
  });

  // Enhance email body with payment plan details
  const enhancedEmailBody = `${decision.emailBody}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 FLEXIBLE PAYMENT PLAN AVAILABLE

We understand that circumstances can make it challenging to pay the full amount at once. We're offering you a flexible payment plan:

💰 Total Amount: ${invoice.total.toNumber().toFixed(2)}
📅 Duration: 4 months
💳 Monthly Payment: ${installmentAmount.toFixed(2)}
📆 First Payment Due: ${formatDate(nextDueDate)}

To accept this payment plan, simply reply to this email with "I ACCEPT" and we'll activate it immediately. Your first installment will be due on ${formatDate(nextDueDate)}.

This offer is available for the next 7 days.`;

  // Send email
  const emailResult = await sendCollectionEmail({
    to: clientEmail,
    subject: decision.emailSubject || `Payment Plan Available - Invoice #${invoice.invoiceNumber}`,
    body: enhancedEmailBody,
    invoice: {
      number: invoice.invoiceNumber,
      amount: invoice.total.toNumber(),
      currency: "USD",
      dueDate: invoice.dueDate,
      clientName,
    },
    escalationLevel: "FIRM_REMINDER",
  });

  // Log action
  await db.collectionAction.create({
    data: {
      invoiceId: invoice.id,
      executionLogId: state.executionLogId,
      actionType: "PAYMENT_PLAN_OFFER",
      channel: "EMAIL",
      status: emailResult.success ? "COMPLETED" : "FAILED",
      emailSubject: decision.emailSubject || `Payment Plan Available - Invoice #${invoice.invoiceNumber}`,
      emailBody: enhancedEmailBody,
      sentToEmail: clientEmail,
      sentAt: emailResult.success ? new Date() : null,
      emailSent: emailResult.success,
      executedAt: new Date(),
      result: emailResult.message,
      aiReasoning: decision.reasoning,
      metadata: { paymentPlanId: plan.id },
    },
  });

  // Update invoice
  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      lastFollowUpAt: new Date(),
      followUpCount: { increment: 1 },
      agentNotes: `Payment plan offered: 4 x ${installmentAmount.toFixed(2)}/month. ${decision.reasoning}`,
    },
  });

  console.log(`[CollectorAI] ✅ Payment plan offered for invoice ${invoice.invoiceNumber}`);

  return {
    stats: {
      ...state.stats,
      processed: state.stats.processed + 1,
      actionsTaken: state.stats.actionsTaken + 1,
      emailsSent: state.stats.emailsSent + (emailResult.success ? 1 : 0),
    },
  };
}

/**
 * ACTION: Schedule next action
 */
async function scheduleNextAction(state: AgentState): Promise<Partial<AgentState>> {
  const invoice = state.currentInvoice!;
  const decision = state.decision!;
  const waitDays = decision.waitDays || 3;

  const nextActionDate = new Date();
  nextActionDate.setDate(nextActionDate.getDate() + waitDays);

  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      nextActionDate,
      agentNotes: `Agent decided to wait ${waitDays} days. ${decision.reasoning}`,
    },
  });

  await db.collectionAction.create({
    data: {
      invoiceId: invoice.id,
      executionLogId: state.executionLogId,
      actionType: "FRIENDLY_REMINDER",
      channel: "EMAIL",
      status: "SCHEDULED",
      scheduledFor: nextActionDate,
      aiReasoning: decision.reasoning,
    },
  });

  console.log(`[CollectorAI] ⏰ Scheduled next action for ${invoice.invoiceNumber} on ${formatDate(nextActionDate)}`);

  return {
    stats: {
      ...state.stats,
      processed: state.stats.processed + 1,
    },
  };
}

/**
 * ACTION: Flag for manual review
 */
async function flagForManualReview(state: AgentState): Promise<Partial<AgentState>> {
  const invoice = state.currentInvoice!;
  const decision = state.decision!;

  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      agentNotes: `⚠️ FLAGGED FOR MANUAL REVIEW: ${decision.reasoning}`,
      status: "DISPUTED", // Use DISPUTED status for manual review
    },
  });

  await db.collectionAction.create({
    data: {
      invoiceId: invoice.id,
      executionLogId: state.executionLogId,
      actionType: "MANUAL_REVIEW",
      channel: "EMAIL",
      status: "COMPLETED",
      executedAt: new Date(),
      aiReasoning: decision.reasoning,
      result: "Flagged for manual review",
    },
  });

  console.log(`[CollectorAI] ⚠️ Flagged invoice ${invoice.invoiceNumber} for manual review`);

  return {
    stats: {
      ...state.stats,
      processed: state.stats.processed + 1,
    },
  };
}

// ============================================
// ROUTING FUNCTIONS
// ============================================

function shouldContinueProcessing(state: AgentState): "continue" | "end" {
  return state.invoicesToProcess.length > 0 ? "continue" : "end";
}

function hasInvoiceToProcess(state: AgentState): "process" | "skip" {
  return state.currentInvoice ? "process" : "skip";
}

// ============================================
// BUILD LANGGRAPH
// ============================================

const stateAnnotation = Annotation.Root({
  businessId: Annotation<string>,
  executionLogId: Annotation<string | undefined>,
  currentInvoice: Annotation<InvoiceWithRelations | null>,
  invoicesToProcess: Annotation<InvoiceWithRelations[]>,
  clientHistory: Annotation<ClientHistory | undefined>,
  decision: Annotation<CollectionDecision | undefined>,
  actionResult: Annotation<any>,
  stats: Annotation<{
    processed: number;
    actionsTaken: number;
    emailsSent: number;
    errors: number;
  }>,
  errors: Annotation<string[]>,
});

export function createCollectorGraph() {
  const graph = new StateGraph(stateAnnotation)
    // Add nodes
    .addNode("loadInvoices", loadInvoices)
    .addNode("selectInvoice", selectInvoice)
    .addNode("analyzeHistory", analyzeClientHistory)
    .addNode("makeDecision", makeDecision)
    .addNode("executeAction", executeAction)
    
    // Define edges
    .addEdge(START, "loadInvoices")
    .addEdge("loadInvoices", "selectInvoice")
    .addConditionalEdges(
      "selectInvoice",
      hasInvoiceToProcess,
      {
        process: "analyzeHistory",
        skip: END,
      }
    )
    .addEdge("analyzeHistory", "makeDecision")
    .addEdge("makeDecision", "executeAction")
    .addConditionalEdges(
      "executeAction",
      shouldContinueProcessing,
      {
        continue: "selectInvoice",
        end: END,
      }
    );

  return graph.compile();
}

/**
 * Main entry point: Run CollectorAI for a business
 */
export async function runCollectorAI(businessId: string) {
  console.log(`\n🤖 ========== CollectorAI Starting for Business: ${businessId} ==========\n`);
  
  const startTime = Date.now();
  
  // Create execution log
  const executionLog = await db.agentExecutionLog.create({
    data: {
      businessId,
      executionType: "MANUAL",
      status: "RUNNING",
    },
  });

  try {
    const graph = createCollectorGraph();
    
    const initialState: AgentState = {
      businessId,
      executionLogId: executionLog.id,
      invoicesToProcess: [],
      stats: {
        processed: 0,
        actionsTaken: 0,
        emailsSent: 0,
        errors: 0,
      },
      errors: [],
    };

    const result = await graph.invoke(initialState);

    const duration = Date.now() - startTime;
    
    // Update execution log
    await db.agentExecutionLog.update({
      where: { id: executionLog.id },
      data: {
        status: "COMPLETED",
        invoicesProcessed: result.stats.processed,
        actionsCreated: result.stats.actionsTaken,
        emailsSent: result.stats.emailsSent,
        errors: result.stats.errors,
        completedAt: new Date(),
        durationMs: duration,
        summaryReport: `Processed ${result.stats.processed} invoices, took ${result.stats.actionsTaken} actions, sent ${result.stats.emailsSent} emails. ${result.errors.length} errors.`,
        errorLog: result.errors.length > 0 ? result.errors.join("\n") : null,
      },
    });

    console.log(`\n✅ ========== CollectorAI Completed ==========`);
    console.log(`📊 Invoices Processed: ${result.stats.processed}`);
    console.log(`⚡ Actions Taken: ${result.stats.actionsTaken}`);
    console.log(`📧 Emails Sent: ${result.stats.emailsSent}`);
    console.log(`❌ Errors: ${result.stats.errors}`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s\n`);

    return {
      success: true,
      stats: result.stats,
      errors: result.errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error("[CollectorAI] Fatal error:", error);
    
    await db.agentExecutionLog.update({
      where: { id: executionLog.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        durationMs: duration,
        errorLog: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration,
    };
  }
}
