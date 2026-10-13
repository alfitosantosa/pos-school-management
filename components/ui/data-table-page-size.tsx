"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Table } from "@tanstack/react-table";

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Dropdown to pick how many rows a data table shows per page.
 * Works with both controlled and uncontrolled pagination state — it only needs
 * the `table` instance, no extra state in the page.
 */
export function DataTablePageSize<TData>({ table }: { table: Table<TData> }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium whitespace-nowrap">
        Baris per halaman
      </span>
      <Select
        value={String(table.getState().pagination.pageSize)}
        onValueChange={(value) =>
          // Reset to page 1: a bigger page can invalidate the current index.
          table.setPagination({ pageIndex: 0, pageSize: Number(value) })
        }
      >
        <SelectTrigger className="h-8 w-[72px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZES.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
