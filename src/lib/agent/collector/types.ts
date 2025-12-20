/**
 * CollectorAI Type Definitions
 */

import type { EscalationLevel, Invoice, CollectionAction, Client } from "@/generated/prisma";

export interface AgentState {
  businessId: string;
  executionLogId?: string;
  currentInvoice?: InvoiceWithRelations | null;
  invoicesToProcess: InvoiceWithRelations[];
  clientHistory?: ClientHistory;
  decision?: CollectionDecision;
  actionResult?: ActionResult;
  stats: ExecutionStats;
  errors: string[];
}

export interface InvoiceWithRelations extends Invoice {
  client?: Client;
  collectionActions?: CollectionAction[];
  paymentPlan?: any;
}

export interface ClientHistory {
  totalInvoices: number;
  totalPaid: number;
  paidOnTime: number;
  avgDaysToPayment: number;
  reliabilityScore: number;
  currentOverdueCount: number;
  currentOverdueAmount: number;
}

export interface CollectionDecision {
  action: "SEND_REMINDER" | "OFFER_PAYMENT_PLAN" | "ESCALATE" | "WAIT" | "MANUAL_REVIEW";
  reasoning: string;
  escalationLevel?: EscalationLevel;
  emailSubject?: string;
  emailBody?: string;
  waitDays?: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface ExecutionStats {
  processed: number;
  actionsTaken: number;
  emailsSent: number;
  errors: number;
}

export interface EmailConfig {
  to: string;
  subject: string;
  body: string;
  invoice: {
    number: string;
    amount: number;
    currency: string;
    dueDate: Date;
    clientName: string;
  };
  escalationLevel: EscalationLevel;
}
