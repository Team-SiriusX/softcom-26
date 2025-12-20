/**
 * CollectorAI Dashboard Page
 * Monitor agent execution history, statistics, and collection actions
 */

"use client";

import { useSelectedBusiness } from "@/components/providers/business-provider";
import {
  useRunCollectorAI,
  useCollectorHistory,
  useCollectorStats,
  useCollectorActions,
} from "@/hooks/use-collector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlayCircle,
  Mail,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Calendar,
  MessageSquare,
  Eye,
  MousePointer,
  MailOpen,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";

export default function CollectorPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useCollectorStats(selectedBusinessId ?? undefined);
  const { data: historyData, isLoading: historyLoading } = useCollectorHistory(selectedBusinessId ?? undefined);
  const runCollector = useRunCollectorAI();

  const history = historyData?.history || [];

  if (!selectedBusinessId) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a business to view CollectorAI dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleRunAgent = () => {
    runCollector.mutate({ businessId: selectedBusinessId });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CollectorAI Dashboard</h1>
          <p className="text-muted-foreground">
            Autonomous invoice collection agent monitoring
          </p>
        </div>
        <Button
          onClick={handleRunAgent}
          disabled={runCollector.isPending}
          size="lg"
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          {runCollector.isPending ? "Running..." : "Run Agent Now"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalInvoices || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.overdueCount || 0} overdue
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.emailsSent || 0}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.successRate ? `${stats.successRate.toFixed(1)}%` : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Completion rate</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.avgExecutionTime ? `${(stats.avgExecutionTime / 1000).toFixed(1)}s` : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Per run</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>Recent CollectorAI runs and their results</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No execution history yet. Click "Run Agent Now" to start.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Emails</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((execution: any) => (
                  <TableRow
                    key={execution.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedExecutionId(execution.id)}
                  >
                    <TableCell>
                      {execution.status === "COMPLETED" ? (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      ) : execution.status === "RUNNING" ? (
                        <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                          <Clock className="mr-1 h-3 w-3 animate-pulse" />
                          Running
                        </Badge>
                      ) : execution.status === "FAILED" ? (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Failed
                        </Badge>
                      ) : (
                        <Badge variant="outline">{execution.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {execution.executionType?.toLowerCase() || "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(execution.startedAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      {execution.completedAt
                        ? `${Math.round(
                            (new Date(execution.completedAt).getTime() -
                              new Date(execution.startedAt).getTime()) /
                              1000
                          )}s`
                        : "N/A"}
                    </TableCell>
                    <TableCell>{execution.invoicesProcessed || 0}</TableCell>
                    <TableCell>{execution.actionsCreated || 0}</TableCell>
                    <TableCell>{execution.emailsSent || 0}</TableCell>
                    <TableCell>
                      {execution.errors > 0 ? (
                        <Badge variant="destructive">{execution.errors}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExecutionId(execution.id);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed Actions View */}
      {selectedExecutionId && (
        <CollectionActionsDetail executionId={selectedExecutionId} />
      )}
    </div>
  );
}

/**
 * Collection Actions Detail Component
 * Shows detailed actions taken in a specific execution
 */
function CollectionActionsDetail({ executionId }: { executionId: string }) {
  const { selectedBusinessId } = useSelectedBusiness();
  const { data, isLoading } = useCollectorActions(selectedBusinessId ?? undefined, executionId);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const actions = data?.actions || [];

  const toggleRow = (actionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId);
    } else {
      newExpanded.add(actionId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; label: string }> = {
      PENDING: { color: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20", icon: Clock, label: "Pending" },
      SCHEDULED: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", icon: Calendar, label: "Scheduled" },
      SENT: { color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20", icon: Send, label: "Sent" },
      DELIVERED: { color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20", icon: Mail, label: "Delivered" },
      OPENED: { color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20", icon: MailOpen, label: "Opened" },
      CLICKED: { color: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20", icon: MousePointer, label: "Clicked" },
      REPLIED: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", icon: MessageSquare, label: "Replied" },
      COMPLETED: { color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", icon: CheckCircle2, label: "Completed" },
      FAILED: { color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", icon: XCircle, label: "Failed" },
      CANCELLED: { color: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20", icon: XCircle, label: "Cancelled" },
    };

    const config = statusMap[status] || statusMap.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getActionTypeBadge = (actionType: string) => {
    const typeMap: Record<string, { color: string; label: string }> = {
      SEND_INVOICE: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-400", label: "Send Invoice" },
      FRIENDLY_REMINDER: { color: "bg-green-500/10 text-green-700 dark:text-green-400", label: "Friendly Reminder" },
      FIRM_REMINDER: { color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400", label: "Firm Reminder" },
      URGENT_NOTICE: { color: "bg-orange-500/10 text-orange-700 dark:text-orange-400", label: "Urgent Notice" },
      FINAL_NOTICE: { color: "bg-red-500/10 text-red-700 dark:text-red-400", label: "Final Notice" },
      LEGAL_WARNING: { color: "bg-red-600/10 text-red-700 dark:text-red-400", label: "Legal Warning" },
      PAYMENT_PLAN_OFFER: { color: "bg-purple-500/10 text-purple-700 dark:text-purple-400", label: "Payment Plan" },
      THANK_YOU: { color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", label: "Thank You" },
      MANUAL_REVIEW: { color: "bg-gray-500/10 text-gray-700 dark:text-gray-400", label: "Manual Review" },
    };

    const config = typeMap[actionType] || { color: "bg-gray-500/10 text-gray-700", label: actionType };

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Actions Detail</CardTitle>
        <CardDescription>
          Individual actions taken during execution #{executionId.slice(-8)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : actions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No actions found for this execution.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {actions.map((action: any) => {
              const isExpanded = expandedRows.has(action.id);
              return (
                <div key={action.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleRow(action.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col gap-2">
                          {getActionTypeBadge(action.actionType)}
                          {getStatusBadge(action.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-medium">
                              {action.invoice?.invoiceNumber || "N/A"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {action.invoice?.client?.name || "Unknown Client"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground">
                              Rs {action.invoice?.total?.toLocaleString() || "0"}
                            </span>
                            {action.emailSent && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                <Mail className="mr-1 h-3 w-3" />
                                Email Sent
                              </Badge>
                            )}
                            {action.sentAt && (
                              <span className="text-xs text-muted-foreground">
                                Sent {formatDistanceToNow(new Date(action.sentAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-2">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4 space-y-4">
                      {/* AI Reasoning */}
                      {action.aiReasoning && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            AI Reasoning
                          </h4>
                          <div className="bg-background rounded-md p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                            {action.aiReasoning}
                          </div>
                        </div>
                      )}

                      {/* Email Details */}
                      {action.emailSubject && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Details
                          </h4>
                          <div className="bg-background rounded-md p-3 space-y-2">
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                              <p className="text-sm font-medium">{action.emailSubject}</p>
                            </div>
                            {action.sentToEmail && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">To:</span>
                                <p className="text-sm">{action.sentToEmail}</p>
                              </div>
                            )}
                            {action.emailBody && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Preview:</span>
                                <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto mt-1 p-2 bg-muted/50 rounded">
                                  {action.emailBody.substring(0, 500)}
                                  {action.emailBody.length > 500 && "..."}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Timeline
                        </h4>
                        <div className="bg-background rounded-md p-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{format(new Date(action.createdAt), "MMM dd, yyyy 'at' HH:mm")}</span>
                          </div>
                          {action.scheduledFor && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Scheduled For:</span>
                              <span>{format(new Date(action.scheduledFor), "MMM dd, yyyy 'at' HH:mm")}</span>
                            </div>
                          )}
                          {action.sentAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sent At:</span>
                              <span>{format(new Date(action.sentAt), "MMM dd, yyyy 'at' HH:mm")}</span>
                            </div>
                          )}
                          {action.executedAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Executed At:</span>
                              <span>{format(new Date(action.executedAt), "MMM dd, yyyy 'at' HH:mm")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Error Message */}
                      {action.errorMessage && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            Error
                          </h4>
                          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm text-red-700 dark:text-red-400">
                            {action.errorMessage}
                          </div>
                        </div>
                      )}

                      {/* Result */}
                      {action.result && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Result
                          </h4>
                          <div className="bg-background rounded-md p-3 text-sm text-muted-foreground">
                            {action.result}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      {action.metadata && Object.keys(action.metadata).length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Additional Information</h4>
                          <div className="bg-background rounded-md p-3">
                            <pre className="text-xs text-muted-foreground overflow-x-auto">
                              {JSON.stringify(action.metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
