"use client";

import { useState } from "react";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useGetInvoices, useGetInvoiceStats, useDeleteInvoice } from "@/hooks/use-invoices";
import { useGetClients } from "@/hooks/use-clients";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileText, Plus, Filter, Download, Eye, Trash2, Edit, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { InvoiceFormDialog } from "@/app/dashboard/invoices/_components/invoice-form-dialog";
import { ClientFormDialog } from "@/app/dashboard/clients/_components/client-form-dialog";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
  SENT: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  VIEWED: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  PARTIAL: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  PAID: "bg-green-500/10 text-green-700 dark:text-green-300",
  OVERDUE: "bg-red-500/10 text-red-700 dark:text-red-300",
  CANCELLED: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
};

export default function InvoicesPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: invoicesData, isLoading } = useGetInvoices(
    selectedBusinessId || undefined,
    statusFilter === "all" ? undefined : statusFilter
  );
  const { data: statsData } = useGetInvoiceStats(selectedBusinessId || undefined);
  const { data: clientsData } = useGetClients(selectedBusinessId || undefined);
  const deleteMutation = useDeleteInvoice();

  const invoices = invoicesData && "data" in invoicesData ? invoicesData.data : [];
  const stats = statsData && "data" in statsData ? statsData.data : null;
  const clients = clientsData && "data" in clientsData ? clientsData.data : [];

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (!selectedBusinessId) {
    return (
      <Alert variant="default" className="bg-card border-none shadow-md">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription>
          Please select a business to view invoices.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, and track your client invoices
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsClientDialogOpen(true)}
            variant="outline"
            className="rounded-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-full gap-2 bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rs {Number(stats.totalAmount).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rs {Number(stats.paidAmount).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.paidInvoices} invoices
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rs {Number(stats.overdueAmount).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.overdueInvoices} invoices
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-card border-none shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>Manage and track your invoices</CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="VIEWED">Viewed</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No invoices found. Create your first invoice to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.client.name}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.issueDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        Rs {Number(invoice.total).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[invoice.status]}
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        clients={clients}
      />

      <ClientFormDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
