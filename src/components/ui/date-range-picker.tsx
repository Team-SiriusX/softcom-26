"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
  placeholder = "Pick a date range",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date);

  // Sync internal state with prop when it changes externally (e.g., clear)
  React.useEffect(() => {
    setInternalDate(date);
  }, [date]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalDate(undefined);
    onDateChange?.(undefined);
  };

  const handleApply = () => {
    if (internalDate?.from && internalDate?.to) {
      onDateChange?.(internalDate);
      setOpen(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && internalDate?.from && internalDate?.to) {
      // Apply when closing if valid range is selected
      onDateChange?.(internalDate);
    } else if (!isOpen && !internalDate) {
      // Clear when closing with no selection
      onDateChange?.(undefined);
    }
    setOpen(isOpen);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal rounded-full h-10 bg-background",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
            {date?.from && (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={internalDate?.from}
            selected={internalDate}
            onSelect={(newDate) => {
              setInternalDate(newDate);
            }}
            numberOfMonths={2}
            initialFocus
          />
          <div className="p-3 border-t flex justify-between items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setInternalDate(undefined);
                onDateChange?.(undefined);
                setOpen(false);
              }}
              className="text-muted-foreground"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!internalDate?.from || !internalDate?.to}
              className="bg-primary text-primary-foreground"
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
