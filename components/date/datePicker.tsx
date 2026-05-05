"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

export function DatePickerWithRange({ date: controlledDate, setDate: setControlledDate }: { date?: DateRange; setDate?: (date: DateRange | undefined) => void }) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const date = controlledDate !== undefined ? controlledDate : internalDate;
  const setDate = setControlledDate || setInternalDate;

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button id="date" variant={"outline"} className={cn("w-75 justify-start text-left font-normal", !date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ?
              date.to ?
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              : format(date.from, "LLL dd, y")
            : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
