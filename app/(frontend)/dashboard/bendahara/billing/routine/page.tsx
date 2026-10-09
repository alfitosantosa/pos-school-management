"use client";

import { useGetClassByIdMajor } from "@/app/(hooks)/hooks/Classes/useGetClassById";
import { BulkUploadPaymentItems } from "@/app/(hooks)/hooks/Payments/usePaymentItems";
import {
  BulkUploadPaymentItemsRoutines,
  useCreatePaymentItemsRoutines,
  useDeletePaymentItemsRoutines,
  useGetPaymentsItemsRoutineByMajorId,
  useUpdatePaymentItemsRoutines,
} from "@/app/(hooks)/hooks/Payments/usePaymentItemsRoutine";
import { useGetPaymentTypeByIdMajor } from "@/app/(hooks)/hooks/Payments/usePaymentType";
import { useGetStudentByIdMajorActive } from "@/app/(hooks)/hooks/Users/useGetStudentById";
import { useGetUserByIdBetterAuth } from "@/app/(hooks)/hooks/Users/useUsersByIdBetterAuth";
import type {
  PaymentItemRoutineBulkPayload,
  PaymentItemRoutineBulkResult,
  PaymentItemRoutineData,
  PaymentItemsInput,
} from "@/app/(types)";
import Loading from "@/components/loading";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentCombobox } from "@/components/ui/student-combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/lib/authClients";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Building,
  CalendarDays,
  CreditCard,
  FileText,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { unauthorized } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

function formatRupiah(value: number | string | null | undefined) {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return IDR.format(Number.isNaN(num) ? 0 : num);
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - 1 + i));

// ─── Table ────────────────────────────────────────────────────────────────────
function RoutineDataTable({
  majorData,
}: {
  majorData: { id: string; name: string } | null | undefined;
}) {
  const majorId = majorData?.id ?? "";
  const { data: routineItems = [], isLoading } =
    useGetPaymentsItemsRoutineByMajorId(majorId);
  const { data: allClass = [] } = useGetClassByIdMajor(majorId);
  const deleteMutation = useDeletePaymentItemsRoutines();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = React.useState("all");
  const [deleteTarget, setDeleteTarget] =
    React.useState<PaymentItemRoutineData | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editTargetId, setEditTargetId] = React.useState<string | null>(null);

  const rows = routineItems as PaymentItemRoutineData[];
  // Resolve from the live list so the dialog never edits a stale copy of the row.
  const editTarget = rows.find((item) => item.id === editTargetId) ?? null;

  const paymentTypeNames = React.useMemo(() => {
    const names = new Set<string>();
    rows.forEach((item) => {
      if (item.PaymentType?.name) names.add(item.PaymentType.name);
    });
    return Array.from(names).sort();
  }, [rows]);

  const globalFilterFn = React.useCallback(
    (row: Row<PaymentItemRoutineData>, _: string, filterValue: string) => {
      if (!filterValue) return true;
      const item = row.original;
      const text = [
        item.name,
        item.PaymentType?.name,
        item.student?.name,
        item.student?.nisn,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(filterValue.toLowerCase());
    },
    [],
  );

  const columns: ColumnDef<PaymentItemRoutineData>[] = [
    {
      id: "class",
      accessorFn: (row) => row.student?.class?.name ?? "-",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <Building className="mr-2 h-4 w-4" />
          Kelas
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      filterFn: (row, _id, value) =>
        value === "all" ||
        !value ||
        (row.original.student?.class?.name ?? "-") === value,
    },
    {
      id: "student",
      accessorFn: (row) => row.student?.name ?? "-",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <User className="mr-2 h-4 w-4" />
          Siswa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.student?.name ?? "-"}</div>
          {row.original.student?.nisn && (
            <div className="text-xs text-muted-foreground">
              {row.original.student.nisn}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <Package className="mr-2 h-4 w-4" />
          Nama Item
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      id: "paymentType",
      accessorFn: (row) => row.PaymentType?.name ?? "-",
      header: "Jenis Tagihan",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.PaymentType?.name ?? "-"}</Badge>
      ),
      filterFn: (row, _id, value) =>
        value === "all" ||
        !value ||
        (row.original.PaymentType?.name ?? "-") === value,
    },
    {
      id: "quantity",
      accessorFn: (row) => Number(row.quantity),
      header: "Qty",
      cell: ({ row }) => (
        <div className="text-center">{row.original.quantity}</div>
      ),
    },
    {
      id: "amount",
      accessorFn: (row) => Number(row.amount),
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Nominal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="tabular-nums">{formatRupiah(row.original.amount)}</div>
      ),
    },
    {
      id: "subtotal",
      accessorFn: (row) => Number(row.subtotal),
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Subtotal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-semibold tabular-nums">
          {formatRupiah(row.original.subtotal)}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Dibuat",
      cell: ({ row }) => (
        <div className="text-xs">
          {row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleString("id-ID")
            : "-"}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setEditTargetId(item.id);
                  setEditOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(item.id);
                  toast.success("ID berhasil dicopy");
                }}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setDeleteTarget(item)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: rows,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
  });

  React.useEffect(() => {
    table
      .getColumn("class")
      ?.setFilterValue(classFilter !== "all" ? classFilter : undefined);
  }, [classFilter, table]);

  React.useEffect(() => {
    table
      .getColumn("paymentType")
      ?.setFilterValue(
        paymentTypeFilter !== "all" ? paymentTypeFilter : undefined,
      );
  }, [paymentTypeFilter, table]);

  const hasActiveFilter =
    Boolean(globalFilter) ||
    classFilter !== "all" ||
    paymentTypeFilter !== "all";

  const resetFilters = () => {
    setGlobalFilter("");
    setClassFilter("all");
    setPaymentTypeFilter("all");
    table.resetColumnFilters();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Item "${deleteTarget.name}" dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus item",
      );
    }
  };

  if (isLoading) return <Loading />;

  const filteredRows = table.getFilteredRowModel().rows;
  const totalSubtotal = filteredRows.reduce(
    (sum, r) => sum + Number(r.original.subtotal ?? 0),
    0,
  );
  const studentCount = new Set(rows.map((item) => item.studentId)).size;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div>
        <div className="font-bold text-3xl mb-1">Data Tagihan Rutin</div>
        <p className="text-sm text-muted-foreground">
          Item tagihan yang disiapkan lebih dulu, untuk ditagihkan nanti.
        </p>
        <Badge className="mt-2">{majorData?.name}</Badge>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between py-2 flex-wrap gap-y-3">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari siswa, item, jenis tagihan..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-xs pl-8"
            />
          </div>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {(allClass ?? []).map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={paymentTypeFilter}
            onValueChange={setPaymentTypeFilter}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter Jenis Tagihan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis Tagihan</SelectItem>
              {paymentTypeNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilter && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <X className="mr-2 h-4 w-4" />
              Reset Filter
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Bulanan
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/bendahara/billing/routine/upload">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Link>
          </Button>
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setSendOpen(true)}
          >
            <Send className="mr-2 h-4 w-4" />
            Kirim ke Tagihan
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Item
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-md border w-full overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {hasActiveFilter
                        ? "Tidak ada data yang sesuai filter."
                        : "Belum ada data tagihan rutin."}
                    </p>
                    {hasActiveFilter ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                      >
                        Reset Filter
                      </Button>
                    ) : (
                      <Button asChild size="sm">
                        <Link href="/dashboard/bendahara/billing/routine/upload">
                          <Upload className="mr-2 h-4 w-4" />
                          Bulk Upload
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {filteredRows.length} dari {rows.length} baris ditampilkan.
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
            {Math.max(table.getPageCount(), 1)}
          </p>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Total Item</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{rows.length}</p>
          {filteredRows.length !== rows.length && (
            <p className="text-sm text-muted-foreground">
              ({filteredRows.length} terfilter)
            </p>
          )}
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Total Siswa</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{studentCount}</p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Total Subtotal</h3>
          </div>
          <p className="text-lg font-bold mt-2 tabular-nums">
            {formatRupiah(totalSubtotal)}
          </p>
          <p className="text-xs text-muted-foreground">dari item terfilter</p>
        </div>
      </div>

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item tagihan rutin?</AlertDialogTitle>
            <AlertDialogDescription>
              Item <strong>{deleteTarget?.name}</strong> untuk{" "}
              {deleteTarget?.student?.name ?? "siswa"} akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Create Dialogs ── */}
      <RoutineItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        majorId={majorId}
        majorName={majorData?.name}
      />
      <RoutineItemDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        majorId={majorId}
        majorName={majorData?.name}
        editData={editTarget}
      />
      <BulkGenerateDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        majorId={majorId}
        majorName={majorData?.name}
        existing={rows}
      />
      <SendToPaymentItemsDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        items={rows}
        majorName={majorData?.name}
      />
    </div>
  );
}

// ─── Dialog: Tambah / Edit Item per Siswa ─────────────────────────────────────
function RoutineItemDialog({
  open,
  onOpenChange,
  majorId,
  majorName,
  editData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  majorId: string;
  majorName?: string;
  editData?: PaymentItemRoutineData | null;
}) {
  const { data: students = [] } = useGetStudentByIdMajorActive(majorId);
  const { data: paymentTypes = [] } = useGetPaymentTypeByIdMajor(majorId);
  const createMutation = useCreatePaymentItemsRoutines();
  const updateMutation = useUpdatePaymentItemsRoutines();

  const isEdit = Boolean(editData?.id);

  const [studentId, setStudentId] = React.useState("");
  const [paymentTypeId, setPaymentTypeId] = React.useState("");
  const [name, setName] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [amount, setAmount] = React.useState(0);

  const subtotal = quantity * amount;

  // Prefill when editing, reset when adding. Keyed on the row id so mid-typing
  // refetches of the list cannot wipe the form.
  React.useEffect(() => {
    if (!open) return;
    if (editData) {
      setStudentId(editData.studentId);
      setPaymentTypeId(editData.paymentTypeId);
      setName(editData.name);
      setQuantity(Number(editData.quantity) || 0);
      setAmount(Number(editData.amount) || 0);
    } else {
      setStudentId("");
      setPaymentTypeId("");
      setName("");
      setQuantity(1);
      setAmount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData?.id]);

  const handlePaymentTypeChange = (ptId: string) => {
    setPaymentTypeId(ptId);
    const pt = paymentTypes.find((p) => p.id === ptId);
    if (!pt) return;
    setName(pt.name);
    setQuantity(pt.isFixedQuantity ? Number(pt.quantity) || 1 : 1);
    setAmount(Number(pt.amount) || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !paymentTypeId || !name.trim()) {
      toast.error("Siswa, jenis tagihan, dan nama item wajib diisi");
      return;
    }
    if (quantity <= 0) {
      toast.error("Quantity harus lebih dari 0");
      return;
    }
    try {
      if (isEdit && editData) {
        await updateMutation.mutateAsync({
          id: editData.id,
          studentId,
          paymentTypeId,
          quantity,
          amount,
          subtotal,
          name: name.trim(),
        });
        toast.success("Item tagihan rutin berhasil diperbarui");
      } else {
        await createMutation.mutateAsync({
          PaymentItemsRoutines: [
            {
              studentId,
              paymentTypeId,
              quantity,
              amount,
              subtotal,
              name: name.trim(),
            },
          ],
        });
        toast.success("Item tagihan rutin berhasil dibuat");
        setStudentId("");
        setPaymentTypeId("");
        setName("");
        setQuantity(1);
        setAmount(0);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan item tagihan rutin",
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Item Tagihan Rutin" : "Tambah Item Tagihan Rutin"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui item tagihan rutin milik siswa ini."
              : `Buat satu item tagihan rutin untuk siswa di branch ${majorName ?? "-"}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Siswa</Label>
            <StudentCombobox
              students={students}
              value={studentId}
              onValueChange={setStudentId}
              placeholder="Pilih siswa di branch ini..."
            />
          </div>

          <div className="space-y-2">
            <Label>Jenis Tagihan</Label>
            <Select
              value={paymentTypeId}
              onValueChange={handlePaymentTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih jenis tagihan..." />
              </SelectTrigger>
              <SelectContent>
                {paymentTypes.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>
                    {pt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="routine-name">Nama Item</Label>
            <Input
              id="routine-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`mis. ${paymentTypes[0]?.name ?? "SPP"} ${MONTHS[new Date().getMonth()]} ${currentYear}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="routine-qty">Quantity</Label>
              <Input
                id="routine-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routine-amount">Nominal</Label>
              <Input
                id="routine-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold tabular-nums">
              {formatRupiah(subtotal)}
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : isEdit ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: Bulk Generate per Bulan & Tahun ──────────────────────────────────
function BulkGenerateDialog({
  open,
  onOpenChange,
  majorId,
  majorName,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  majorId: string;
  majorName?: string;
  existing: PaymentItemRoutineData[];
}) {
  const { data: students = [] } = useGetStudentByIdMajorActive(majorId);
  const { data: paymentTypes = [] } = useGetPaymentTypeByIdMajor(majorId);
  const { data: classes = [] } = useGetClassByIdMajor(majorId);
  const bulkMutation = BulkUploadPaymentItemsRoutines();

  const [month, setMonth] = React.useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = React.useState(String(currentYear));
  const [classScope, setClassScope] = React.useState("all");
  const [typeIds, setTypeIds] = React.useState<string[]>([]);

  const toggleType = (id: string) =>
    setTypeIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const { rows, skipped, studentCount } = React.useMemo(() => {
    const scoped =
      classScope === "all"
        ? students
        : students.filter((s) => s.class?.name === classScope);
    const types = paymentTypes.filter((pt) => typeIds.includes(pt.id));
    // Skip items that already exist for the same student + name so re-running a
    // month doesn't duplicate the whole branch.
    const taken = new Set(
      existing.map((item) => `${item.studentId}::${item.name}`),
    );
    const generated: PaymentItemRoutineBulkPayload[] = [];
    let skippedCount = 0;
    scoped.forEach((student) => {
      types.forEach((pt) => {
        const name = `${pt.name} ${month} ${year}`;
        if (taken.has(`${student.id}::${name}`)) {
          skippedCount++;
          return;
        }
        const quantity = pt.isFixedQuantity ? Number(pt.quantity) || 1 : 1;
        const amount = Number(pt.amount) || 0;
        generated.push({
          studentId: student.id,
          paymentTypeId: pt.id,
          quantity,
          amount,
          subtotal: quantity * amount,
          name,
        });
      });
    });
    return {
      rows: generated,
      skipped: skippedCount,
      studentCount: scoped.length,
    };
  }, [students, paymentTypes, classScope, typeIds, month, year, existing]);

  const studentNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [students]);

  const typeNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    paymentTypes.forEach((pt) => map.set(pt.id, pt.name));
    return map;
  }, [paymentTypes]);

  const handleSubmit = async () => {
    if (rows.length === 0) {
      toast.error("Tidak ada item baru untuk dibuat");
      return;
    }
    try {
      // Endpoint contract: POST /api/payment/items/routine/bulk/upload
      const result = (await bulkMutation.mutateAsync(
        rows,
      )) as PaymentItemRoutineBulkResult;
      toast.success(`${result.count ?? rows.length} item tagihan rutin dibuat`);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal membuat item tagihan rutin",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Tagihan Rutin per Bulan</DialogTitle>
          <DialogDescription>
            Buat item tagihan rutin sekaligus untuk semua siswa di branch{" "}
            {majorName ?? "-"} berdasarkan bulan dan tahun.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bulan</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih bulan..." />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tahun..." />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Batas Kelas</Label>
            <Select value={classScope} onValueChange={setClassScope}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih kelas..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Semua Kelas ({students.length} siswa)
                </SelectItem>
                {(classes ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Jenis Tagihan</Label>
            <div className="max-h-44 overflow-y-auto rounded-md border p-2 space-y-1">
              {paymentTypes.length === 0 && (
                <p className="text-sm text-muted-foreground p-1">
                  Belum ada jenis tagihan di branch ini.
                </p>
              )}
              {paymentTypes.map((pt) => (
                <div
                  key={pt.id}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  <Checkbox
                    id={`bulk-type-${pt.id}`}
                    checked={typeIds.includes(pt.id)}
                    onCheckedChange={() => toggleType(pt.id)}
                  />
                  <label
                    htmlFor={`bulk-type-${pt.id}`}
                    className="flex-1 truncate cursor-pointer"
                  >
                    {pt.name}
                  </label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatRupiah(pt.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>
                Nama item:{" "}
                <strong className="font-mono">
                  {"<Jenis Tagihan>"} {month} {year}
                </strong>
              </span>
            </div>
            <p className="text-muted-foreground">
              {studentCount} siswa × {typeIds.length} jenis ={" "}
              <strong>{rows.length}</strong> item baru
              {skipped > 0 && (
                <span className="text-yellow-600 dark:text-yellow-500">
                  {" "}
                  · {skipped} dilewati (sudah ada)
                </span>
              )}
            </p>
          </div>

          {rows.length > 0 && (
            <div className="rounded-md border overflow-hidden">
              <div className="px-3 py-2 bg-muted/40 border-b text-sm font-medium">
                Preview {Math.min(rows.length, 20)} baris pertama
              </div>
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="text-left p-2 font-medium">Siswa</th>
                      <th className="text-left p-2 font-medium">Jenis</th>
                      <th className="text-left p-2 font-medium">Nama Item</th>
                      <th className="text-right p-2 font-medium">Qty</th>
                      <th className="text-right p-2 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row) => (
                      <tr
                        key={`${row.studentId}-${row.paymentTypeId}`}
                        className="border-b"
                      >
                        <td className="p-2 truncate max-w-[140px]">
                          {studentNameById.get(row.studentId) ?? row.studentId}
                        </td>
                        <td className="p-2 truncate max-w-[120px]">
                          {typeNameById.get(row.paymentTypeId) ?? "-"}
                        </td>
                        <td className="p-2 truncate max-w-[160px]">
                          {row.name}
                        </td>
                        <td className="p-2 text-right">{row.quantity}</td>
                        <td className="p-2 text-right tabular-nums">
                          {formatRupiah(row.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={bulkMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={bulkMutation.isPending || rows.length === 0}
            >
              {bulkMutation.isPending
                ? "Membuat..."
                : `Buat ${rows.length} Item`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: Kirim ke Data Tagihan ────────────────────────────────────────────
function SendToPaymentItemsDialog({
  open,
  onOpenChange,
  items,
  majorName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PaymentItemRoutineData[];
  majorName?: string;
}) {
  const bulkPaymentItems = BulkUploadPaymentItems();
  const deleteRoutine = useDeletePaymentItemsRoutines();

  const [month, setMonth] = React.useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = React.useState(String(currentYear));
  const [nameFilter, setNameFilter] = React.useState("all");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [removeAfter, setRemoveAfter] = React.useState(true);

  const names = React.useMemo(
    () => Array.from(new Set(items.map((i) => i.name))).sort(),
    [items],
  );
  const scoped = React.useMemo(
    () =>
      nameFilter === "all" ? items : items.filter((i) => i.name === nameFilter),
    [items, nameFilter],
  );

  // Default: everything in scope is selected, so "Kirim semua" is one click.
  React.useEffect(() => {
    if (!open) return;
    setSelectedIds(
      (nameFilter === "all"
        ? items
        : items.filter((i) => i.name === nameFilter)
      ).map((i) => i.id),
    );
  }, [open, nameFilter, items]);

  const selected = items.filter((i) => selectedIds.includes(i.id));
  const totalSubtotal = selected.reduce(
    (sum, i) => sum + Number(i.subtotal ?? 0),
    0,
  );
  const allScopedSelected =
    scoped.length > 0 && scoped.every((i) => selectedIds.includes(i.id));

  const toggleAllScoped = () =>
    setSelectedIds(
      allScopedSelected
        ? selectedIds.filter((id) => !scoped.some((s) => s.id === id))
        : Array.from(new Set([...selectedIds, ...scoped.map((i) => i.id)])),
    );

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error("Pilih minimal satu item untuk dikirim");
      return;
    }

    // The endpoint validates fields with `!item[field]`, so amount 0 reads as missing.
    const zeroAmount = selected.filter(
      (item) => Number(item.amount) <= 0,
    ).length;
    if (zeroAmount > 0) {
      toast.error(
        `${zeroAmount} item bernominal 0 — isi nominalnya dulu sebelum dikirim`,
      );
      return;
    }

    const monthNumber = String(MONTHS.indexOf(month) + 1).padStart(2, "0");
    const payload: PaymentItemsInput[] = selected.map((item) => ({
      studentId: item.studentId,
      paymentTypeId: item.paymentTypeId,
      quantity: Number(item.quantity),
      amount: Number(item.amount),
      subtotal: Number(item.subtotal),
      isPaid: false,
      month: monthNumber,
      year,
      name: item.name,
      skuType: item.PaymentType?.skuType || "default",
    }));

    try {
      // apiClients resolves on non-2xx, so inspect the payload before claiming success.
      const result = (await bulkPaymentItems.mutateAsync(payload)) as {
        error?: string;
        count?: number;
      };
      if (result?.error) throw new Error(result.error);

      toast.success(
        `${result?.count ?? payload.length} item tagihan dibuat untuk ${month} ${year}`,
      );

      if (removeAfter) {
        try {
          await deleteRoutine.mutateAsync(selected.map((i) => i.id));
          toast.success(
            `${selected.length} item dihapus dari Data Tagihan Rutin`,
          );
        } catch {
          toast.warning(
            "Item tagihan sudah dibuat, tapi gagal menghapus dari Data Tagihan Rutin. Hapus manual ya.",
          );
        }
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengirim ke Data Tagihan",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kirim ke Data Tagihan</DialogTitle>
          <DialogDescription>
            Buat item tagihan asli dari item rutin branch {majorName ?? "-"}{" "}
            berdasarkan bulan dan tahun.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Nama Tagihan</Label>
              <Select value={nameFilter} onValueChange={setNameFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih nama tagihan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Semua Nama ({items.length} item)
                  </SelectItem>
                  {names.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bulan</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih bulan..." />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tahun..." />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Item yang dikirim</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleAllScoped}
                disabled={scoped.length === 0}
              >
                {allScopedSelected ? "Kosongkan" : "Pilih semua"}
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
              {scoped.length === 0 && (
                <p className="text-sm text-muted-foreground p-3">
                  Belum ada item tagihan rutin untuk dikirim.
                </p>
              )}
              {scoped.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-sm p-2 hover:bg-muted/30"
                >
                  <Checkbox
                    id={`send-item-${item.id}`}
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={() =>
                      setSelectedIds((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((id) => id !== item.id)
                          : [...prev, item.id],
                      )
                    }
                  />
                  <label
                    htmlFor={`send-item-${item.id}`}
                    className="flex-1 truncate cursor-pointer"
                  >
                    <span className="font-medium">
                      {item.student?.name ?? item.studentId}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {item.name}
                    </span>
                  </label>
                  <span className="text-xs tabular-nums">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">
              {selected.length} item dipilih
            </span>
            <span className="font-semibold tabular-nums">
              {formatRupiah(totalSubtotal)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              id="routine-remove-after"
              checked={removeAfter}
              onCheckedChange={() => setRemoveAfter((prev) => !prev)}
            />
            <label htmlFor="routine-remove-after" className="cursor-pointer">
              Hapus item yang sudah dikirim dari Data Tagihan Rutin
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={bulkPaymentItems.isPending || deleteRoutine.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                bulkPaymentItems.isPending ||
                deleteRoutine.isPending ||
                selected.length === 0
              }
            >
              {bulkPaymentItems.isPending || deleteRoutine.isPending
                ? "Mengirim..."
                : `Kirim ${selected.length} Item`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Auth Wrapper ─────────────────────────────────────────────────────────────
export default function BillingRotinePage() {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;
  const { data: userData, isLoading: isLoadingUserData } =
    useGetUserByIdBetterAuth(userId as string);
  const userRole = userData?.role?.name;
  const majorData = userData?.major;

  if (isPending || isLoadingUserData) return <Loading />;
  if (userRole !== "Admin" && userRole !== "Bendahara") {
    unauthorized();
    return null;
  }
  return <RoutineDataTable majorData={majorData} />;
}
