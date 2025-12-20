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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>Emails Sent</TableHead>
                  <TableHead>Actions</TableHead>
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
                      {execution.status === "SUCCESS" ? (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Success
                        </Badge>
                      ) : execution.status === "PARTIAL" ? (
                        <Badge variant="secondary">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Partial
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Failed
                        </Badge>
                      )}
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
                    <TableCell>{execution.invoicesProcessed}</TableCell>
                    <TableCell>{execution.emailsSent}</TableCell>
                    <TableCell>{execution.actionsTaken}</TableCell>
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

  const actions = data?.actions || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Actions Detail</CardTitle>
        <CardDescription>
          Individual actions taken during this execution
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action Type</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email Sent</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action: any) => (
                <TableRow key={action.id}>
                  <TableCell>
                    <Badge variant="outline">{action.actionType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {action.invoice?.invoiceNumber || "N/A"}
                  </TableCell>
                  <TableCell>{action.invoice?.client?.name || "Unknown"}</TableCell>
                  <TableCell>
                    ${action.invoice?.totalAmount?.toLocaleString() || "0"}
                  </TableCell>
                  <TableCell>
                    {action.status === "COMPLETED" ? (
                      <Badge className="bg-green-500">Completed</Badge>
                    ) : action.status === "FAILED" ? (
                      <Badge variant="destructive">Failed</Badge>
                    ) : (
                      <Badge variant="secondary">{action.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {action.emailSent ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(action.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
