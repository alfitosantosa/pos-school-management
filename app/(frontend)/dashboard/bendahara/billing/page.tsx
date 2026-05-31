"use client";

import * as React from "react";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Pencil, Trash2, Search, X, FileText, CreditCard, User, CalendarDays, BadgeCheck, Clock, Package, Layers, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { useCreatePaymentItems, useUpdatePaymentItems, useDeletePaymentItems, usePaymentItemsUnpaidStudent, usePaymentItemsByMajorId } from "@/app/(hooks)/hooks/Payments/usePaymentItems";

import { useGetPaymentTypeByIdMajor } from "@/app/(hooks)/hooks/Payments/usePaymentType";
import Loading from "@/components/loading";
import { StudentCombobox } from "@/components/ui/student-combobox";
import { useSession } from "@/lib/auth-client";
import { unauthorized } from "next/navigation";
import { useGetUserByIdBetterAuth } from "@/app/(hooks)/hooks/Users/useUsersByIdBetterAuth";
import { useGetPaymentByIdMajor } from "@/app/(hooks)/hooks/Payments/usePayment";
import { useGetStudentByIdMajor } from "@/app/(hooks)/hooks/Users/useGetStudentById";

// ─── Types ────────────────────────────────────────────────────────────────────
export type PaymentTypeData = {
  id: string;
  name: string;
  description?: string;
  amount: string;
  isMonthly: boolean;
  isActive: boolean;
  isFixedAmount: boolean;
  isFixedQuantity: boolean;
  quantity: string;
  subtotal: string;
  owner: string;
  skuType: string;
  majorId: string;
  major?: { id: string; name: string };
};

export type PaymentItemData = {
  id: string;
  name: string;
  skuType: string;
  paymentTypeId: string;
  month: string;
  year: string;
  isPaid: boolean;
  isMonthly: boolean;
  isActive: boolean;
  isFixedAmount: boolean;
  isFixedQuantity: boolean;
  quantity: number;
  amount: number;
  subtotal: number;
  paymentId: string;
  studentId: string;
  PaymentType?: PaymentTypeData;
  student?: { id: string; name: string };
  payment?: { id: string; receiptNumber: string; status: string };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRupiah(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const MONTH_NUMBER: Record<string, number> = {
  Januari: 1,
  Februari: 2,
  Maret: 3,
  April: 4,
  Mei: 5,
  Juni: 6,
  Juli: 7,
  Agustus: 8,
  September: 9,
  Oktober: 10,
  November: 11,
  Desember: 12,
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

// ─── Status Badge ─────────────────────────────────────────────────────────────
function PaidBadge({ isPaid }: { isPaid: boolean }) {
  return isPaid ?
      <Badge className="bg-green-600 text-white flex items-center gap-1 w-fit">
        <BadgeCheck className="h-3 w-3" />
        Lunas
      </Badge>
    : <Badge className="bg-yellow-500 text-white flex items-center gap-1 w-fit">
        <Clock className="h-3 w-3" />
        Belum Lunas
      </Badge>;
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ?
      <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
        Aktif
      </Badge>
    : <Badge variant="outline" className="text-gray-400 text-xs">
        Nonaktif
      </Badge>;
}

// ─── Single Item Form Schema ──────────────────────────────────────────────────
const singleItemSchema = z.object({
  paymentId: z.string().optional(),
  studentId: z.string().min(1, "Siswa wajib dipilih"),
  paymentTypeId: z.string().min(1, "Jenis pembayaran wajib dipilih"),
  name: z.string().min(1, "Nama wajib diisi"),
  skuType: z.string().optional(),
  month: z.string().min(1, "Bulan wajib dipilih"),
  year: z.string().min(1, "Tahun wajib dipilih"),
  quantity: z.number().min(1, "Jumlah minimal 1"),
  amount: z.number().min(0, "Nominal tidak boleh negatif"),
  subtotal: z.number(),
  isFixedAmount: z.boolean().default(false),
  isFixedQuantity: z.boolean().default(false),
  isMonthly: z.boolean().default(false),
  isPaid: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
type SingleItemFormValues = z.infer<typeof singleItemSchema>;

// ─── Single Item Edit Dialog ──────────────────────────────────────────────────
function SingleItemDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
  allStudents,
  allPaymentTypes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: PaymentItemData | null;
  onSuccess: () => void;
  allStudents: any[];
  allPaymentTypes: PaymentTypeData[];
}) {
  const createItem = useCreatePaymentItems();
  const updateItem = useUpdatePaymentItems();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<SingleItemFormValues>({
    resolver: zodResolver(singleItemSchema as any),
    defaultValues: {
      quantity: 1,
      amount: 0,
      subtotal: 0,
      isFixedAmount: false,
      isFixedQuantity: false,
      isMonthly: false,
      isPaid: false,
      isActive: true,
      skuType: "default",
      month: MONTHS[new Date().getMonth()],
      year: String(currentYear),
    },
  });

  const watchedPaymentTypeId = watch("paymentTypeId");
  const watchedStudentId = watch("studentId");
  const isPaid = watch("isPaid");
  const isActive = watch("isActive");
  const isMonthly = watch("isMonthly");

  // Fetch unpaid items for selected student
  const { data: unpaidItems = [] } = usePaymentItemsUnpaidStudent(watchedStudentId);

  // ✅ FIX #2: Memoize selectedPT to prevent unnecessary recalculations
  const selectedPT = React.useMemo(() => allPaymentTypes.find((p) => p.id === watchedPaymentTypeId), [allPaymentTypes, watchedPaymentTypeId]);

  // ✅ FIX #5: Wrap callbacks with useCallback to prevent recreation on every render
  const handlePaymentTypeChange = React.useCallback(
    (ptId: string) => {
      const pt = allPaymentTypes.find((p) => p.id === ptId);
      if (pt) {
        const amount = parseFloat(pt.amount) || 0;
        const qty = pt.isFixedQuantity ? parseInt(pt.quantity) || 1 : (watch("quantity") ?? 1);
        setValue("paymentTypeId", ptId);
        setValue("name", pt.name);
        setValue("skuType", pt.owner || "default");
        setValue("amount", amount);
        setValue("quantity", qty);
        setValue("subtotal", amount * qty);
        setValue("isFixedAmount", pt.isFixedAmount);
        setValue("isFixedQuantity", pt.isFixedQuantity);
        setValue("isMonthly", pt.isMonthly);
      }
    },
    [allPaymentTypes, watch, setValue],
  );

  const handleQtyChange = React.useCallback(
    (qty: number) => {
      const amount = watch("amount") ?? 0;
      setValue("quantity", qty);
      setValue("subtotal", amount * qty);
    },
    [watch, setValue],
  );

  const handleAmountChange = React.useCallback(
    (amount: number) => {
      const qty = watch("quantity") ?? 1;
      setValue("amount", amount);
      setValue("subtotal", amount * qty);
    },
    [watch, setValue],
  );

  // ✅ FIX #3: Use editData.id instead of entire editData object to prevent unnecessary resets
  React.useEffect(() => {
    if (editData) {
      reset({
        studentId: editData.studentId,
        paymentTypeId: editData.paymentTypeId,
        name: editData.name,
        skuType: editData.skuType || "default",
        month: editData.month,
        year: editData.year,
        quantity: editData.quantity,
        amount: editData.amount,
        subtotal: editData.subtotal,
        isFixedAmount: editData.isFixedAmount,
        isFixedQuantity: editData.isFixedQuantity,
        isMonthly: editData.isMonthly,
        isPaid: editData.isPaid,
        isActive: editData.isActive,
      });
    } else {
      reset({
        quantity: 1,
        amount: 0,
        subtotal: 0,
        isFixedAmount: false,
        isFixedQuantity: false,
        isMonthly: false,
        isPaid: false,
        isActive: true,
        skuType: "default",
        month: MONTHS[new Date().getMonth()],
        year: String(currentYear),
      });
    }
  }, [editData?.id, open]);

  const onSubmit = async (data: SingleItemFormValues) => {
    try {
      if (editData) {
        await updateItem.mutateAsync({
          id: editData.id,
          ...data,
          month: String(MONTH_NUMBER[data.month] ?? data.month),
          year: data.year,
        });
        toast.success("Item tagihan berhasil diperbarui!");
      } else {
        await createItem.mutateAsync({
          ...data,
          month: String(MONTH_NUMBER[data.month] ?? data.month),
          year: data.year,
        });
        console.log(data);
        toast.success("Item tagihan berhasil dibuat!");
      }
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Item Tagihan" : "Tambah Item Tagihan"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Student */}
          <div className="space-y-2">
            <Label>Siswa</Label>
            <Controller
              name="studentId"
              control={control}
              render={({ field }) => (
                <StudentCombobox
                  students={allStudents}
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    setValue("paymentId", "");
                  }}
                  placeholder="Pilih Siswa"
                />
              )}
            />
            {errors.studentId && <p className="text-sm text-red-500">{errors.studentId.message}</p>}
          </div>

          {/* Payment */}
          {unpaidItems.length > 0 && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="text-sm font-semibold text-blue-900">Tagihan Belum Lunas</Label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {unpaidItems.map((item: any) => (
                  <div key={item.id} className="text-xs p-2 bg-white rounded border border-blue-100 flex justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-blue-600 font-semibold">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Type */}
          <div className="space-y-2">
            <Label>Jenis Tagihan</Label>
            <Controller
              name="paymentTypeId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={handlePaymentTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jenis Tagihan" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {allPaymentTypes
                      .filter((pt) => pt.isActive)
                      .map((pt) => (
                        <SelectItem key={pt.id} value={pt.id}>
                          {pt.name}
                          {pt.major && <span className="text-muted-foreground ml-1 text-xs">· {pt.major.name}</span>}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedPT && (
              <p className="text-xs text-muted-foreground">
                {selectedPT.description} · {formatRupiah(parseFloat(selectedPT.amount))}
              </p>
            )}
            {errors.paymentTypeId && <p className="text-sm text-red-500">{errors.paymentTypeId.message}</p>}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Item</Label>
            <Input id="name" placeholder="Nama item tagihan" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bulan</Label>
              <Controller
                name="month"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.month && <p className="text-sm text-red-500">{errors.month.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.year && <p className="text-sm text-red-500">{errors.year.message}</p>}
            </div>
          </div>

          {/* Amount & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Nominal (Rp)</Label>
              <Input id="amount" type="number" min={0} disabled={watch("isFixedAmount")} value={watch("amount") ?? 0} onChange={(e) => handleAmountChange(Number(e.target.value))} />
              {watch("isFixedAmount") && <p className="text-xs text-muted-foreground">Nominal tetap</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Jumlah</Label>
              <Input id="quantity" type="number" min={1} disabled={watch("isFixedQuantity")} value={watch("quantity") ?? 1} onChange={(e) => handleQtyChange(Number(e.target.value))} />
              {watch("isFixedQuantity") && <p className="text-xs text-muted-foreground">Jumlah tetap</p>}
            </div>
          </div>

          {/* Subtotal */}
          <div className="flex justify-between items-center rounded-lg bg-muted/40 px-4 py-2">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="font-bold tabular-nums">{formatRupiah(watch("subtotal") ?? 0)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ?
                "Menyimpan..."
              : editData ?
                "Perbarui"
              : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────
function DeleteItemDialog({ open, onOpenChange, itemData, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; itemData: PaymentItemData | null; onSuccess: () => void }) {
  const deleteItem = useDeletePaymentItems();

  const handleDelete = async () => {
    if (!itemData) return;
    try {
      await deleteItem.mutateAsync(itemData.id);
      toast.success("Item tagihan berhasil dihapus!");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus item tagihan");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Item Tagihan</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus item tagihan <span className="font-semibold">"{itemData?.name}"</span> milik {itemData?.student?.name ?? "siswa ini"}? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleteItem.isPending} className="bg-red-600 hover:bg-red-700">
            {deleteItem.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main DataTable ───────────────────────────────────────────────────────────
function BillingDataTable({ majorId }: { majorId: string }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState<string>("");
  const [paidFilter, setPaidFilter] = React.useState<string>("all");
  const [monthFilter, setMonthFilter] = React.useState<string>("all");
  const [yearFilter, setYearFilter] = React.useState<string>("all");

  const [singleDialogOpen, setSingleDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<PaymentItemData | null>(null);

  const { data: paymentItems = [], isLoading, refetch } = usePaymentItemsByMajorId(majorId);
  const { data: allStudents = [] } = useGetStudentByIdMajor(majorId);
  const { data: allPaymentTypes = [] } = useGetPaymentTypeByIdMajor(majorId);
  const handleSuccess = () => refetch();

  const globalFilterFn = React.useCallback((row: any, _: string, filterValue: string) => {
    if (!filterValue) return true;
    const item = row.original as PaymentItemData;
    const text = [item.name, item.skuType, item.student?.name, item.PaymentType?.name, item.payment?.receiptNumber, item.month, item.year].filter(Boolean).join(" ").toLowerCase();
    return text.includes(filterValue.toLowerCase());
  }, []);

  const columns: ColumnDef<PaymentItemData>[] = [
    {
      id: "select",
      header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} aria-label="Select all" />,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "student",
      accessorFn: (row) => row.student?.name ?? "-",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <User className="mr-2 h-4 w-4" />
          Siswa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.student?.name ?? "-"}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <Package className="mr-2 h-4 w-4" />
          Nama Item
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          {row.original.PaymentType?.name && row.original.PaymentType.name !== row.getValue("name") && <div className="text-xs text-muted-foreground">{row.original.PaymentType.name}</div>}
        </div>
      ),
    },
    {
      id: "skuType",
      accessorFn: (row) => row.PaymentType?.skuType ?? "default",
      header: "Tipe SKU",
      cell: ({ row }) => {
        return <Badge variant="outline">{row.getValue("skuType")}</Badge>;
      },
    },
    {
      id: "owner",
      accessorFn: (row) => row.PaymentType?.owner,
      header: "Owner",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("owner")}</Badge>,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <CreditCard className="mr-2 h-4 w-4" />
          Nominal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="tabular-nums">{formatRupiah(row.getValue("amount"))}</div>,
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => <div className="text-center">{row.getValue("quantity")}</div>,
    },
    {
      accessorKey: "subtotal",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Subtotal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-semibold tabular-nums">{formatRupiah(row.getValue("subtotal"))}</div>,
    },
    {
      accessorKey: "month",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Bulan
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline">
          {MONTHS[parseInt(row.getValue("month")) - 1] ?? row.getValue("month")} {row.original.year}
        </Badge>
      ),
      filterFn: (row, _id, value) => {
        if (value === "all") return true;
        const monthNum = MONTH_NUMBER[value];
        return String(row.original.month) === String(monthNum);
      },
    },
    {
      accessorKey: "year",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <Calendar className="mr-2 h-4 w-4" />
          Tahun
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("year")}</div>,
      filterFn: (row, _id, value) => {
        if (value === "all") return true;
        return String(row.original.year) === String(value);
      },
    },
    {
      accessorKey: "isPaid",
      header: "Status Bayar",
      cell: ({ row }) => <PaidBadge isPaid={row.getValue("isPaid")} />,
      filterFn: (row, _id, value) => {
        if (value === "all") return true;
        if (value === "paid") return row.original.isPaid === true;
        if (value === "unpaid") return row.original.isPaid === false;
        return true;
      },
    },
    {
      id: "receipt",
      accessorFn: (row) => row.payment?.receiptNumber ?? "-",
      header: "Kwitansi",
      cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{row.original.payment?.receiptNumber ?? "-"}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>Copy ID</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedItem(item);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedItem(item);
                  setDeleteDialogOpen(true);
                }}
                className="text-red-600"
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
    data: paymentItems as PaymentItemData[],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
  });

  React.useEffect(() => {
    table.getColumn("isPaid")?.setFilterValue(paidFilter !== "all" ? paidFilter : undefined);
  }, [paidFilter, table]);

  React.useEffect(() => {
    table.getColumn("month")?.setFilterValue(monthFilter !== "all" ? monthFilter : undefined);
  }, [monthFilter, table]);

  React.useEffect(() => {
    table.getColumn("year")?.setFilterValue(yearFilter !== "all" ? yearFilter : undefined);
  }, [yearFilter, table]);

  if (isLoading) return <Loading />;

  const filteredRows = table.getFilteredRowModel().rows;
  const totalItems = (paymentItems as any[]).length;
  const totalSubtotal = filteredRows.reduce((sum, r) => sum + (r.original.subtotal ?? 0), 0);
  const paidCount = filteredRows.filter((r) => r.original.isPaid).length;
  const unpaidCount = filteredRows.filter((r) => !r.original.isPaid).length;

  const columnLabels: Record<string, string> = {
    student: "Siswa",
    name: "Nama Item",
    amount: "Nominal",
    quantity: "Qty",
    subtotal: "Subtotal",
    month: "Bulan",
    isPaid: "Status Bayar",
    isActive: "Status",
    receipt: "Kwitansi",
  };

  const hasActiveFilter = globalFilter || paidFilter !== "all" || monthFilter !== "all" || yearFilter !== "all";

  const resetFilters = () => {
    setGlobalFilter("");
    setPaidFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
    table.resetColumnFilters();
  };

  return (
    <div className="mx-auto my-8 p-6 max-w-7xl min-h-screen">
      <div className="font-bold text-3xl mb-6">Data Tagihan (Billing)</div>

      {/* Toolbar */}
      <div className="flex items-center justify-between py-4 flex-wrap gap-y-3">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari siswa, item, kwitansi..." value={globalFilter ?? ""} onChange={(e) => setGlobalFilter(e.target.value)} className="max-w-xs pl-8" />
          </div>

          <Select value={paidFilter} onValueChange={setPaidFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status Bayar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="unpaid">Belum Lunas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter Bulan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Bulan</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* filter tahun  */}
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter Tahun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilter && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Kolom <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((c) => c.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(v) => column.toggleVisibility(!!v)}>
                    {columnLabels[column.id] ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setSingleDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Item
          </Button>
        </div>
      </div>

      {/* Active filter badges */}
      {hasActiveFilter && (
        <div className="flex items-center space-x-2 py-2 flex-wrap gap-y-1">
          <span className="text-sm text-muted-foreground">Filter aktif:</span>
          {globalFilter && (
            <Badge variant="secondary" className="gap-1">
              Pencarian: {globalFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setGlobalFilter("")} />
            </Badge>
          )}
          {paidFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {paidFilter === "paid" ? "Lunas" : "Belum Lunas"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setPaidFilter("all")} />
            </Badge>
          )}
          {monthFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Bulan: {monthFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setMonthFilter("all")} />
            </Badge>
          )}
          {yearFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Tahun: {yearFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setYearFilter("all")} />
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border w-full overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ?
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            : <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">{hasActiveFilter ? "Tidak ada data yang sesuai filter." : "Tidak ada data tagihan."}</p>
                    {hasActiveFilter && (
                      <Button variant="outline" size="sm" onClick={resetFilters}>
                        Reset Filter
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            }
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} dari {filteredRows.length} baris dipilih.
          {filteredRows.length !== totalItems && <span className="ml-2">(difilter dari {totalItems} total)</span>}
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
          </p>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Selanjutnya
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Total Item</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{totalItems}</p>
          {filteredRows.length !== totalItems && <p className="text-sm text-muted-foreground">({filteredRows.length} terfilter)</p>}
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <BadgeCheck className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Sudah Lunas</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{paidCount}</p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Belum Lunas</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{unpaidCount}</p>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Total Subtotal</h3>
          </div>
          <p className="text-lg font-bold mt-2 tabular-nums">{formatRupiah(totalSubtotal)}</p>
          <p className="text-xs text-muted-foreground">dari item terfilter</p>
        </div>
      </div>
      {/* dialog find studnet */}

      {/* Dialogs */}
      <SingleItemDialog open={singleDialogOpen} onOpenChange={setSingleDialogOpen} onSuccess={handleSuccess} allStudents={allStudents} allPaymentTypes={allPaymentTypes} />
      <SingleItemDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} editData={selectedItem} onSuccess={handleSuccess} allStudents={allStudents} allPaymentTypes={allPaymentTypes} />
      <DeleteItemDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} itemData={selectedItem} onSuccess={handleSuccess} />
    </div>
  );
}

// ─── Auth Wrapper ─────────────────────────────────────────────────────────────
export default function BillingPage() {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;
  const { data: userData, isLoading: isLoadingUserData } = useGetUserByIdBetterAuth(userId as string);
  const userRole = userData?.role?.name;
  const majorId = userData?.major?.id;

  if (isPending || isLoadingUserData) return <Loading />;
  // Check if user is Admin
  if (userRole !== "Admin") {
    if (userRole !== "Bendahara") {
      unauthorized();
      return null;
    }
  }
  return <BillingDataTable majorId={majorId} />;
}
