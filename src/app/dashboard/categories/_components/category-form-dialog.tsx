"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-categories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: {
    id: string;
    name: string;
    description?: string | null;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    icon?: string | null;
    color?: string | null;
  } | null;
}

const categoryIcons = ["💰", "🏠", "🚗", "🍔", "⚡", "📱", "🎮", "🎬", "🛒", "✈️", "🏥", "📚", "🎵", "🏋️"];
const categoryColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const { selectedBusinessId } = useSelectedBusiness();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(category?.id ?? "__NO_CATEGORY_ID__");

  const isEdit = !!category;

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      type: "",
      icon: "💰",
      color: "#3b82f6",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (!category) {
      form.reset({
        name: "",
        description: "",
        type: "",
        icon: "💰",
        color: "#3b82f6",
      });
      return;
    }

    form.reset({
      name: category.name ?? "",
      description: category.description ?? "",
      type: category.type ?? "",
      icon: category.icon ?? "💰",
      color: category.color ?? "#3b82f6",
    });
  }, [open, category, form]);

  const onSubmit = (data: any) => {
    if (isEdit) {
      updateMutation.mutate(
        {
          name: data.name,
          description: data.description || undefined,
          type: data.type,
          icon: data.icon,
          color: data.color,
        },
        {
          onSuccess: () => {
            toast.success("Category updated successfully");
            onOpenChange(false);
          },
          onError: (error) => {
            toast.error(error.message);
          },
        }
      );
      return;
    }

    if (!selectedBusinessId) {
      toast.error("Please select a business first");
      return;
    }

    createMutation.mutate(
      {
        businessId: selectedBusinessId,
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        icon: data.icon,
        color: data.color,
      },
      {
        onSuccess: () => {
          toast.success("Category created successfully");
          onOpenChange(false);
          form.reset();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Create Category"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the category details"
              : "Add a new category to organize your transactions"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Category Type *</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              {...form.register("name", { required: true })}
              placeholder="e.g. Office Supplies"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon *</Label>
            <div className="grid grid-cols-7 gap-2">
              {categoryIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => form.setValue("icon", icon)}
                  className={`p-2 text-2xl rounded-lg border-2 hover:border-primary transition-colors ${
                    form.watch("icon") === icon
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color *</Label>
            <div className="grid grid-cols-8 gap-2">
              {categoryColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue("color", color)}
                  className={`w-10 h-10 rounded-lg border-2 hover:scale-110 transition-transform ${
                    form.watch("color") === color
                      ? "border-foreground scale-110"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Optional description"
              rows={3}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEdit
                ? updateMutation.isPending
                  ? "Saving..."
                  : "Save Changes"
                : createMutation.isPending
                  ? "Creating..."
                  : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
