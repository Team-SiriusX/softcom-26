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
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryFormDialog } from "./_components/category-form-dialog";

export default function CategoriesPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: categories, isLoading } = useGetCategories(
    selectedBusinessId || undefined
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

  const incomeCategories = categories?.filter((c: any) => c.type === "INCOME") || [];
  const expenseCategories = categories?.filter((c: any) => c.type === "EXPENSE") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your transactions into meaningful categories
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <CategoryFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Income Categories</CardTitle>
            <CardDescription>
              {incomeCategories.length} categor{incomeCategories.length === 1 ? "y" : "ies"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incomeCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No income categories yet
                </p>
                <Button onClick={() => setIsCreateOpen(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Income Category
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {incomeCategories.map((category: any) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-full text-xl"
                        style={{ backgroundColor: category.color + "20" }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {category._count?.transactions || 0} transactions
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(category.id)}
                            className="text-destructive"
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
            )}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>
              {expenseCategories.length} categor{expenseCategories.length === 1 ? "y" : "ies"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No expense categories yet
                </p>
                <Button onClick={() => setIsCreateOpen(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense Category
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {expenseCategories.map((category: any) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-full text-xl"
                        style={{ backgroundColor: category.color + "20" }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {category._count?.transactions || 0} transactions
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(category.id)}
                            className="text-destructive"
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
