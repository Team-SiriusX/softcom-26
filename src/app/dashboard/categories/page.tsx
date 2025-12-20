"use client";

import { useState } from "react";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import {
  useGetCategories,
  useDeleteCategory,
} from "@/hooks/use-categories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  MoreHorizontal,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CategoryFormDialog } from "./_components/category-form-dialog";
import { toast } from "sonner";

export default function CategoriesPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "ALL">("ACTIVE");
  const [query, setQuery] = useState("");

  const { data: categories, isLoading } = useGetCategories(
    selectedBusinessId || undefined,
    statusFilter === "ACTIVE" ? { isActive: true } : undefined
  );
  const deleteMutation = useDeleteCategory();

  if (!selectedBusinessId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Business Selected</AlertTitle>
        <AlertDescription>
          Please select a business from the header or{" "}
          <Link href="/business" className="font-medium underline">
            create a new one
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const allCategories = categories ?? [];
  const q = query.trim().toLowerCase();
  const filteredCategories = q
    ? allCategories.filter((c: any) => {
        const name = (c.name ?? "").toLowerCase();
        const desc = (c.description ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
    : allCategories;

  const incomeCategories = filteredCategories.filter((c: any) => c.type === "INCOME");
  const expenseCategories = filteredCategories.filter((c: any) => c.type === "EXPENSE");
  const transferCategories = filteredCategories.filter((c: any) => c.type === "TRANSFER");

  const activeCount = allCategories.filter((c: any) => c.isActive !== false).length;
  const inactiveCount = allCategories.length - activeCount;

  const openEdit = (category: any) => {
    setEditingCategory(category);
    setIsEditOpen(true);
  };

  const openDelete = (category: any) => {
    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingCategory?.id) return;

    deleteMutation.mutate(deletingCategory.id, {
      onSuccess: () => {
        toast.success("Category deleted");
        setIsDeleteOpen(false);
        setDeletingCategory(null);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const CategoryList = ({
    items,
    emptyLabel,
  }: {
    items: any[];
    emptyLabel: string;
  }) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No {emptyLabel} yet</p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="rounded-full bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {emptyLabel}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((category: any) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-background hover:bg-[#22D3EE]/10 transition-colors"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full text-xl shrink-0"
                style={{ backgroundColor: (category.color ?? "#22D3EE") + "20" }}
              >
                {category.icon ?? "🏷️"}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{category.name}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {category.description || category.parent?.name
                    ? category.description || `Parent: ${category.parent?.name}`
                    : "—"}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline" className="hidden sm:inline-flex">
                {category._count?.transactions || 0} tx
              </Badge>
              <Badge
                variant={category.isActive === false ? "secondary" : "outline"}
                className={category.isActive === false ? "text-muted-foreground" : ""}
              >
                {category.isActive === false ? "Inactive" : "Active"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    aria-label="Category actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      openEdit(category);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      openDelete(category);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Organize your transactions into meaningful categories
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="h-10 rounded-full pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "ACTIVE" | "ALL")}
          >
            <SelectTrigger className="h-10 w-full rounded-full sm:w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active only</SelectItem>
              <SelectItem value="ALL">All (incl. inactive)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-10 rounded-full bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <CategoryFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <CategoryFormDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditingCategory(null);
        }}
        category={editingCategory}
      />

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setDeletingCategory(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-medium">{deletingCategory?.name}</span>.
              {" "}
              If the category has transactions or subcategories, deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="mt-1 text-2xl font-semibold">{allCategories.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="mt-1 text-2xl font-semibold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Inactive</div>
            <div className="mt-1 text-2xl font-semibold">{inactiveCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Showing</div>
            <div className="mt-1 text-2xl font-semibold">{filteredCategories.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Income Categories */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Income Categories</CardTitle>
            <CardDescription>
              {incomeCategories.length} categor{incomeCategories.length === 1 ? "y" : "ies"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryList items={incomeCategories} emptyLabel="income categories" />
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>
              {expenseCategories.length} categor{expenseCategories.length === 1 ? "y" : "ies"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryList items={expenseCategories} emptyLabel="expense categories" />
          </CardContent>
        </Card>

        {/* Transfer Categories */}
        <Card className="bg-card border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Transfer Categories</CardTitle>
            <CardDescription>
              {transferCategories.length} categor{transferCategories.length === 1 ? "y" : "ies"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryList
              items={transferCategories}
              emptyLabel="transfer categories"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
