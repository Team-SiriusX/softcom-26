"use client";

import { useState, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSelectedBusiness } from "@/components/providers/business-provider";
import { useBulkImportTransactions } from "@/hooks/use-transactions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CSVRow {
  date: string;
  description: string;
  amount: string;
  type: string;
  category?: string;
  account?: string;
  contraAccount?: string;
  reference?: string;
  notes?: string;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  ledgerAccountId?: string;
  contraAccountId?: string;
  categoryId?: string;
  referenceNumber?: string;
  notes?: string;
}

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: any[];
  categories: any[];
}

export function CSVImportDialog({
  open,
  onOpenChange,
  accounts,
  categories,
}: CSVImportDialogProps) {
  const { selectedBusinessId } = useSelectedBusiness();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<
    "upload" | "mapping" | "preview" | "importing"
  >("upload");
  const [columnMapping, setColumnMapping] = useState({
    date: "",
    description: "",
    amount: "",
    type: "",
    category: "",
    account: "",
    contraAccount: "",
    reference: "",
    notes: "",
  });

  const bulkImportMutation = useBulkImportTransactions();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        if (!selectedFile.name.endsWith(".csv")) {
          setErrors(["Please upload a CSV file"]);
          return;
        }
        setFile(selectedFile);
        parseCSV(selectedFile);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith(".csv")) {
        setErrors(["Please upload a CSV file"]);
        return;
      }
      setFile(droppedFile);
      parseCSV(droppedFile);
    }
  }, []);

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        setErrors([
          "CSV file must contain a header row and at least one data row",
        ]);
        return;
      }

      // Helper function to parse CSV line with quoted values
      const parseCSVLine = (line: string): string[] => {
        const values: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"' && inQuotes && nextChar === '"') {
            // Handle escaped quotes ("")
            current += '"';
            i++; // Skip next quote
          } else if (char === '"') {
            // Toggle quote state
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            // End of field
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        // Add last field
        values.push(current.trim());
        return values;
      };

      const headers = parseCSVLine(lines[0]);
      const rows: CSVRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        rows.push(row);
      }

      setParsedData(rows);

      // Auto-detect columns
      const autoMapping: any = {};
      headers.forEach((header) => {
        const lower = header.toLowerCase();
        if (lower.includes("date")) autoMapping.date = header;
        if (lower.includes("description") || lower.includes("desc"))
          autoMapping.description = header;
        if (lower.includes("amount")) autoMapping.amount = header;
        if (lower.includes("type")) autoMapping.type = header;
        if (lower.includes("category")) autoMapping.category = header;
        if (lower.includes("account") && !lower.includes("contra"))
          autoMapping.account = header;
        if (lower.includes("contra")) autoMapping.contraAccount = header;
        if (lower.includes("reference") || lower.includes("ref"))
          autoMapping.reference = header;
        if (lower.includes("note")) autoMapping.notes = header;
      });

      setColumnMapping(autoMapping);
      setStep("mapping");
      setErrors([]);
    };
    reader.onerror = () => {
      setErrors(["Error reading file"]);
    };
    reader.readAsText(file);
  };

  const validateAndPrepareData = (): ParsedTransaction[] | null => {
    const transactions: ParsedTransaction[] = [];
    const validationErrors: string[] = [];

    if (
      !columnMapping.date ||
      !columnMapping.description ||
      !columnMapping.amount ||
      !columnMapping.type
    ) {
      validationErrors.push(
        "Required fields: Date, Description, Amount, and Type must be mapped"
      );
      setErrors(validationErrors);
      return null;
    }

    parsedData.forEach((row, index) => {
      const rowNum = index + 2; // +2 for header and 0-index

      const dateStr = row[columnMapping.date as keyof CSVRow]?.trim();
      const description = row[columnMapping.description as keyof CSVRow]?.trim();
      const amountStr = row[columnMapping.amount as keyof CSVRow]?.trim();
      const typeStr = row[columnMapping.type as keyof CSVRow]?.trim().toUpperCase();

      if (!dateStr || !description || !amountStr || !typeStr) {
        validationErrors.push(`Row ${rowNum}: Missing required fields (Date: ${!!dateStr}, Desc: ${!!description}, Amount: ${!!amountStr}, Type: ${!!typeStr})`);
        return;
      }

      const amount = parseFloat(amountStr.replace(/[,$\s]/g, ""));
      if (isNaN(amount) || amount <= 0) {
        validationErrors.push(`Row ${rowNum}: Invalid amount '${amountStr}'`);
        return;
      }

      if (!["INCOME", "EXPENSE", "TRANSFER"].includes(typeStr)) {
        validationErrors.push(
          `Row ${rowNum}: Type must be INCOME, EXPENSE, or TRANSFER`
        );
        return;
      }

      // Find account by name
      const accountName = row[columnMapping.account as keyof CSVRow];
      const account = accountName
        ? accounts.find(
            (a) => a.name.toLowerCase() === accountName.toLowerCase()
          )
        : null;

      const contraAccountName =
        row[columnMapping.contraAccount as keyof CSVRow];
      const contraAccount = contraAccountName
        ? accounts.find(
            (a) => a.name.toLowerCase() === contraAccountName.toLowerCase()
          )
        : null;

      const categoryName = row[columnMapping.category as keyof CSVRow];
      const category = categoryName
        ? categories.find(
            (c) => c.name.toLowerCase() === categoryName.toLowerCase()
          )
        : null;

      transactions.push({
        date: dateStr,
        description,
        amount,
        type: typeStr as "INCOME" | "EXPENSE" | "TRANSFER",
        ledgerAccountId: account?.id,
        contraAccountId: contraAccount?.id,
        categoryId: category?.id,
        referenceNumber:
          row[columnMapping.reference as keyof CSVRow] || undefined,
        notes: row[columnMapping.notes as keyof CSVRow] || undefined,
      });
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return null;
    }

    return transactions;
  };

  const handleImport = async () => {
    const transactions = validateAndPrepareData();
    if (!transactions) return;

    setStep("importing");

    try {
      await bulkImportMutation.mutateAsync({
        businessId: selectedBusinessId!,
        transactions,
      });

      onOpenChange(false);
      resetDialog();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Import failed"]);
      setStep("preview");
    }
  };

  const resetDialog = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setStep("upload");
    setColumnMapping({
      date: "",
      description: "",
      amount: "",
      type: "",
      category: "",
      account: "",
      contraAccount: "",
      reference: "",
      notes: "",
    });
  };

  const availableColumns =
    parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetDialog();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import transactions. Make sure your CSV
            includes date, description, amount, and type columns.
          </DialogDescription>
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-sm font-medium mb-2">
                  Click to upload or drag and drop
                </div>
                <div className="text-xs text-muted-foreground">
                  CSV files only
                </div>
              </Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <FileText className="h-4 w-4" />
              <span>{parsedData.length} rows detected from CSV</span>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="text-sm font-medium">Column Mapping</div>
              <p className="text-xs text-muted-foreground">
                Select what each CSV column represents. Required fields: Date,
                Description, Amount, and Type.
              </p>
            </div>

            {/* CSV Table with Mapping Dropdowns Above */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      {availableColumns.map((col, idx) => (
                        <th
                          key={idx}
                          className="px-4 py-3 text-left border-r last:border-r-0 min-w-[200px]"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="text-xs text-muted-foreground font-normal">
                              CSV Column {idx + 1}:{" "}
                              <span className="font-semibold text-foreground">
                                {col}
                              </span>
                            </div>
                            <Select
                              value={
                                Object.entries(columnMapping).find(
                                  ([_, value]) => value === col
                                )?.[0] || "__unmapped__"
                              }
                              onValueChange={(field) => {
                                if (field === "__unmapped__") {
                                  // Remove this column from all mappings
                                  const newMapping = { ...columnMapping };
                                  Object.keys(newMapping).forEach((key) => {
                                    if (
                                      newMapping[
                                        key as keyof typeof newMapping
                                      ] === col
                                    ) {
                                      newMapping[
                                        key as keyof typeof newMapping
                                      ] = "";
                                    }
                                  });
                                  setColumnMapping(newMapping);
                                } else {
                                  // Clear this field from any other column first
                                  const newMapping = { ...columnMapping };
                                  Object.keys(newMapping).forEach((key) => {
                                    if (
                                      key !== field &&
                                      newMapping[
                                        key as keyof typeof newMapping
                                      ] === col
                                    ) {
                                      newMapping[
                                        key as keyof typeof newMapping
                                      ] = "";
                                    }
                                  });
                                  // Set the new mapping
                                  newMapping[field as keyof typeof newMapping] =
                                    col;
                                  setColumnMapping(newMapping);
                                }
                              }}
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-9 text-xs",
                                  Object.entries(columnMapping).find(
                                    ([_, value]) => value === col
                                  )?.[0]
                                    ? "bg-primary/10 border-primary/50"
                                    : "bg-background"
                                )}
                              >
                                <SelectValue placeholder="Not mapped" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__unmapped__">
                                  <span className="text-muted-foreground italic">
                                    Not mapped
                                  </span>
                                </SelectItem>
                                <SelectItem value="date">
                                  Date <span className="text-red-500">*</span>
                                </SelectItem>
                                <SelectItem value="description">
                                  Description{" "}
                                  <span className="text-red-500">*</span>
                                </SelectItem>
                                <SelectItem value="amount">
                                  Amount <span className="text-red-500">*</span>
                                </SelectItem>
                                <SelectItem value="type">
                                  Type <span className="text-red-500">*</span>
                                </SelectItem>
                                <SelectItem value="account">Account</SelectItem>
                                <SelectItem value="contraAccount">
                                  Contra Account
                                </SelectItem>
                                <SelectItem value="category">
                                  Category
                                </SelectItem>
                                <SelectItem value="reference">
                                  Reference
                                </SelectItem>
                                <SelectItem value="notes">Notes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-background">
                    <tr className="border-t bg-muted/10">
                      {availableColumns.map((col, idx) => (
                        <td
                          key={idx}
                          className="px-4 py-2 border-r last:border-r-0 text-xs font-medium text-muted-foreground"
                        >
                          {Object.entries(columnMapping).find(
                            ([_, value]) => value === col
                          )?.[0] ? (
                            Object.entries(columnMapping)
                              .find(([_, value]) => value === col)?.[0]
                              .replace(/([A-Z])/g, " $1")
                              .trim()
                              .split(" ")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")
                          ) : (
                            <span className="italic text-muted-foreground/50">
                              Unmapped
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    {parsedData.slice(0, 5).map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-t hover:bg-muted/20">
                        {availableColumns.map((col, colIdx) => (
                          <td
                            key={colIdx}
                            className="px-4 py-2 border-r last:border-r-0 text-xs"
                          >
                            {row[col as keyof CSVRow] || (
                              <span className="text-muted-foreground/50 italic">
                                empty
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {parsedData.length > 5 && (
                      <tr className="border-t bg-muted/5">
                        {availableColumns.map((col, idx) => (
                          <td
                            key={idx}
                            className="px-4 py-2 border-r last:border-r-0 text-xs text-center text-muted-foreground italic"
                          >
                            ... {parsedData.length - 5} more rows
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mapping Summary */}
            <div className="flex flex-wrap gap-2 p-4 bg-muted/20 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground mr-2">
                Mapped Fields:
              </div>
              {Object.entries(columnMapping).map(([field, csvCol]) =>
                csvCol ? (
                  <Badge key={field} variant="secondary" className="text-xs">
                    {field.replace(/([A-Z])/g, " $1").trim()} → {csvCol}
                    {["date", "description", "amount", "type"].includes(
                      field
                    ) && <span className="ml-1 text-red-500">*</span>}
                  </Badge>
                ) : null
              )}
              {Object.values(columnMapping).every((v) => !v) && (
                <span className="text-xs text-muted-foreground italic">
                  No columns mapped yet
                </span>
              )}
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Upload className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="font-medium">Importing transactions...</div>
              <div className="text-sm text-muted-foreground mt-2">
                Please wait while we process your data
              </div>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                onClick={() => {
                  const validated = validateAndPrepareData();
                  if (validated) setStep("preview");
                }}
              >
                Preview ({parsedData.length} rows)
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={bulkImportMutation.isPending}
              >
                {bulkImportMutation.isPending
                  ? "Importing..."
                  : `Import ${parsedData.length} Transactions`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
