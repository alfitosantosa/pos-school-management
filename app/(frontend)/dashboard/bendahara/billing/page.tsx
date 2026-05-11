"use client";

import * as React from "react";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Pencil, Trash2, Search, X, FileText, CreditCard, User, CalendarDays, BadgeCheck, Clock, Package, Layers } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { useGetPaymentsItems, useCreatePaymentItems, useUpdatePaymentItems, useDeletePaymentItems, useCreatePaymentItemsBulk, usePaymentItemsUnpaidStudent } from "@/app/(hooks)/hooks/Payments/usePaymentItems";
import { useGetStudents } from "@/app/(hooks)/hooks/Users/useStudents";
import { useGetPaymentTypes } from "@/app/(hooks)/hooks/Payments/usePaymentType";
import Loading from "@/components/loading";
import { useSession } from "@/lib/auth-client";
import { unauthorized } from "next/navigation";
import { useGetUserByIdBetterAuth } from "@/app/(hooks)/hooks/Users/useUsersByIdBetterAuth";
import { useGetPayments } from "@/app/(hooks)/hooks/Payments/usePayment";

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

// ─── Bulk Item Schema ─────────────────────────────────────────────────────────
const bulkItemRowSchema = z.object({
  paymentTypeId: z.string().optional(),
  name: z.string().optional(),
  skuType: z.string().optional(),
  quantity: z.number().min(1),
  amount: z.number().min(0),
  subtotal: z.number(),
  isFixedAmount: z.boolean().default(false),
  isFixedQuantity: z.boolean().default(false),
  selected: z.boolean().default(true),
});

const bulkSchema = z.object({
  paymentId: z.string().min(1, "Pembayaran wajib dipilih"),
  studentId: z.string().min(1, "Siswa wajib dipilih"),
  month: z.string().min(1, "Bulan wajib dipilih"),
  year: z.string().min(1, "Tahun wajib dipilih"),
  items: z.array(bulkItemRowSchema).min(1, "Minimal satu item"),
});
type BulkFormValues = z.infer<typeof bulkSchema>;

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
  allStudents: { id: string; name: string }[];
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
  const { data: unpaidItems = [] } = usePaymentItemsUnpaidStudent(watchedStudentId, { enabled: !!watchedStudentId });

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
          paymentItems: [
            {
              id: editData.id,
              ...data,
              month: String(MONTH_NUMBER[data.month] ?? data.month),
              year: data.year,
            },
          ],
        });
        toast.success("Item tagihan berhasil diperbarui!");
      } else {
        await createItem.mutateAsync([
          {
            ...data,
            month: String(MONTH_NUMBER[data.month] ?? data.month),
            year: data.year,
          },
        ]);
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
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    setValue("paymentId", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Siswa" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {allStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={isPaid} onCheckedChange={(v) => setValue("isPaid", v)} />
              <Label className="text-sm">Sudah Lunas</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={(v) => setValue("isActive", v)} />
              <Label className="text-sm">Aktif</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isMonthly} onCheckedChange={(v) => setValue("isMonthly", v)} />
              <Label className="text-sm">Tagihan Bulanan</Label>
            </div>
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

// ─── Bulk Create Dialog ───────────────────────────────────────────────────────
function BulkCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  allStudents,
  allPaymentTypes,
  allPayments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  allStudents: { id: string; name: string }[];
  allPaymentTypes: PaymentTypeData[];
  allPayments: { id: string; receiptNumber: string; studentId: string }[];
}) {
  const createBulk = useCreatePaymentItemsBulk();

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BulkFormValues>({
    resolver: zodResolver(bulkSchema as any),
    defaultValues: {
      studentId: "",
      paymentId: "",
      month: MONTHS[new Date().getMonth()],
      year: String(currentYear),
      items: [{ paymentTypeId: "", name: "", skuType: "default", quantity: 1, amount: 0, subtotal: 0, isFixedAmount: false, isFixedQuantity: false, selected: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const watchedStudentId = watch("studentId");
  const watchedMonth = watch("month");
  const watchedYear = watch("year");

  const filteredPayments = React.useMemo(() => (watchedStudentId ? allPayments.filter((p) => p.studentId === watchedStudentId) : allPayments), [allPayments, watchedStudentId]);

  const grandTotal = React.useMemo(() => watchedItems?.filter((item) => item.selected)?.reduce((sum, item) => sum + (item.subtotal || 0), 0) ?? 0, [watchedItems]);

  // ✅ FIX #5: Wrap callbacks with useCallback to prevent recreation on every render
  const handlePaymentTypeChange = React.useCallback(
    (index: number, ptId: string) => {
      const pt = allPaymentTypes.find((p) => p.id === ptId);
      if (pt) {
        const amount = parseFloat(pt.amount) || 0;
        const qty = pt.isFixedQuantity ? parseInt(pt.quantity) || 1 : (watchedItems?.[index]?.quantity ?? 1);
        setValue(`items.${index}.paymentTypeId`, ptId);
        setValue(`items.${index}.name`, pt.name);
        setValue(`items.${index}.skuType`, pt.owner || "default");
        setValue(`items.${index}.amount`, amount);
        setValue(`items.${index}.quantity`, qty);
        setValue(`items.${index}.subtotal`, amount * qty);
        setValue(`items.${index}.isFixedAmount`, pt.isFixedAmount);
        setValue(`items.${index}.isFixedQuantity`, pt.isFixedQuantity);
      }
    },
    [allPaymentTypes, watchedItems, setValue],
  );

  const handleQtyChange = React.useCallback(
    (index: number, qty: number) => {
      const amount = watchedItems?.[index]?.amount ?? 0;
      setValue(`items.${index}.quantity`, qty);
      setValue(`items.${index}.subtotal`, amount * qty);
    },
    [watchedItems, setValue],
  );

  const handleAmountChange = React.useCallback(
    (index: number, amount: number) => {
      const qty = watchedItems?.[index]?.quantity ?? 1;
      setValue(`items.${index}.amount`, amount);
      setValue(`items.${index}.subtotal`, amount * qty);
    },
    [watchedItems, setValue],
  );

  // ✅ NEW: Toggle item selection
  const toggleItemSelection = React.useCallback(
    (index: number) => {
      const currentSelected = watchedItems[index].selected;
      setValue(`items.${index}.selected`, !currentSelected);
    },
    [watchedItems, setValue],
  );

  // Add all active payment types at once
  const handleAddAllTypes = React.useCallback(() => {
    const activeTypes = allPaymentTypes.filter((pt) => pt.isActive);
    const newItems = activeTypes.map((pt) => {
      const amount = parseFloat(pt.amount) || 0;
      const qty = parseInt(pt.quantity) || 1;
      return {
        paymentTypeId: pt.id,
        name: pt.name,
        skuType: pt.owner || "default",
        amount,
        quantity: pt.isFixedQuantity ? qty : 1,
        subtotal: amount * (pt.isFixedQuantity ? qty : 1),
        isFixedAmount: pt.isFixedAmount,
        isFixedQuantity: pt.isFixedQuantity,
        selected: true,
      };
    });
    setValue("items", newItems);
  }, [allPaymentTypes, setValue]);

  const onSubmit = async (data: BulkFormValues) => {
    try {
      // Filter only selected items
      const selectedItems = data.items.filter((item) => item.selected);

      if (selectedItems.length === 0) {
        toast.error("Pilih minimal satu item tagihan!");
        return;
      }

      const monthNumber = MONTH_NUMBER[data.month] ?? data.month;
      const payload = selectedItems.map((item) => ({
        paymentId: data.paymentId,
        studentId: data.studentId,
        paymentTypeId: item.paymentTypeId,
        name: item.name ?? "",
        skuType: item.skuType || "default",
        quantity: item.quantity,
        amount: item.amount,
        subtotal: item.subtotal,
        month: String(monthNumber),
        year: data.year,
        isFixedAmount: item.isFixedAmount,
        isFixedQuantity: item.isFixedQuantity,
      }));

      await createBulk.mutateAsync(payload);
      toast.success(`${selectedItems.length} item tagihan berhasil dibuat!`);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Buat Tagihan Bulk
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Student & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Siswa</Label>
              <Controller
                name="studentId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("paymentId", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Siswa" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {allStudents.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.studentId && <p className="text-sm text-red-500">{errors.studentId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Pembayaran (Kwitansi)</Label>
              <Controller
                name="paymentId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!watchedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kwitansi" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filteredPayments.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.receiptNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentId && <p className="text-sm text-red-500">{errors.paymentId.message}</p>}
            </div>
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

          <Separator />

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Item Tagihan</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleAddAllTypes} title="Tambahkan semua jenis tagihan aktif sekaligus">
                  <Package className="mr-2 h-4 w-4" />
                  Tambah Semua Jenis
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ paymentTypeId: "", name: "", skuType: "default", quantity: 1, amount: 0, subtotal: 0, isFixedAmount: false, isFixedQuantity: false, selected: true })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Item
                </Button>
              </div>
            </div>

            {errors.items && typeof errors.items === "object" && "message" in errors.items && <p className="text-sm text-red-500">{(errors.items as any).message}</p>}

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-1 text-center">Pilih</div>
              <div className="col-span-3">Jenis Tagihan</div>
              <div className="col-span-3">Nominal (Rp)</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Subtotal</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => {
                const pt = allPaymentTypes.find((p) => p.id === watchedItems?.[index]?.paymentTypeId);
                const isFixedAmount = pt?.isFixedAmount ?? watchedItems?.[index]?.isFixedAmount ?? false;
                const isFixedQty = pt?.isFixedQuantity ?? watchedItems?.[index]?.isFixedQuantity ?? false;
                const isSelected = watchedItems?.[index]?.selected ?? true;

                return (
                  <div key={field.id} className={`grid grid-cols-12 gap-2 items-start p-3 rounded-lg border transition-all ${isSelected ? "bg-blue-50 border-blue-200" : "bg-muted/20 opacity-60 border-muted"}`}>
                    {/* Checkbox */}
                    <div className="col-span-1 flex justify-center pt-1">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleItemSelection(index)} />
                    </div>

                    {/* Payment Type */}
                    <div className="col-span-3">
                      <Controller
                        name={`items.${index}.paymentTypeId`}
                        control={control}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={(v) => handlePaymentTypeChange(index, v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Pilih Jenis" />
                            </SelectTrigger>
                            <SelectContent>
                              {allPaymentTypes
                                .filter((pt) => pt.isActive)
                                .map((pt) => (
                                  <SelectItem key={pt.id} value={pt.id}>
                                    <span className="text-xs">{pt.name}</span>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.items?.[index]?.paymentTypeId && <p className="text-xs text-red-500 mt-0.5">{errors.items[index]?.paymentTypeId?.message}</p>}
                    </div>

                    {/* Amount */}
                    <div className="col-span-3">
                      <Input className="h-9 text-xs" type="number" min={0} disabled={isFixedAmount} value={watchedItems?.[index]?.amount ?? 0} onChange={(e) => handleAmountChange(index, Number(e.target.value))} />
                      {isFixedAmount && <p className="text-xs text-muted-foreground mt-0.5">Tetap</p>}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <Input className="h-9 text-xs text-center" type="number" min={1} disabled={isFixedQty} value={watchedItems?.[index]?.quantity ?? 1} onChange={(e) => handleQtyChange(index, Number(e.target.value))} />
                      {isFixedQty && <p className="text-xs text-muted-foreground mt-0.5 text-center">Tetap</p>}
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-2 flex items-center justify-end h-9">
                      <span className="text-xs font-semibold tabular-nums">{formatRupiah(watchedItems?.[index]?.subtotal ?? 0)}</span>
                    </div>

                    {/* Delete Button */}
                    <div className="col-span-1 flex justify-center">
                      <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-500 hover:text-red-700" onClick={() => remove(index)} disabled={fields.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Grand Total */}
          <div className="flex justify-between items-center rounded-lg bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm text-muted-foreground">{fields.length} item tagihan</p>
              <p className="text-xs text-muted-foreground">
                {watchedMonth} {watchedYear}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Tagihan</p>
              <p className="font-bold text-lg tabular-nums text-blue-600">{formatRupiah(grandTotal)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {watchedItems?.filter((item) => item.selected)?.length ?? 0} dari {fields.length} item dipilih
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={createBulk.isPending || (watchedItems?.filter((item) => item.selected)?.length ?? 0) === 0}>
              {createBulk.isPending ? "Membuat..." : `Buat ${watchedItems?.filter((item) => item.selected)?.length ?? 0} Item`}
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
      await deleteItem.mutateAsync([itemData.id]);
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
function BillingDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState<string>("");
  const [paidFilter, setPaidFilter] = React.useState<string>("all");
  const [monthFilter, setMonthFilter] = React.useState<string>("all");
  const [yearFilter, setYearFilter] = React.useState<string>("all");
  const [activeFilter, setActiveFilter] = React.useState<string>("all");

  const [singleDialogOpen, setSingleDialogOpen] = React.useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<PaymentItemData | null>(null);

  const { data: paymentItems = [], isLoading, refetch } = useGetPaymentsItems();
  const { data: allStudents = [] } = useGetStudents();
  const { data: allPaymentTypes = [] } = useGetPaymentTypes();
  const { data: rawPayments = [] } = useGetPayments();

  // Normalize payments for dropdowns
  const allPayments = React.useMemo(() => {
    const list = Array.isArray(rawPayments) ? rawPayments : ((rawPayments as any)?.data ?? []);
    return list.map((p: any) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      studentId: p.studentId,
    }));
  }, [rawPayments]);

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
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => <ActiveBadge isActive={row.getValue("isActive")} />,
      filterFn: (row, _id, value) => {
        if (value === "all") return true;
        if (value === "active") return row.original.isActive === true;
        if (value === "inactive") return row.original.isActive === false;
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
    table.getColumn("month")?.setFilterValue(yearFilter !== "all" ? yearFilter : undefined);
  }, [yearFilter, table]);

  React.useEffect(() => {
    table.getColumn("isActive")?.setFilterValue(activeFilter !== "all" ? activeFilter : undefined);
  }, [activeFilter, table]);

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

  const hasActiveFilter = globalFilter || paidFilter !== "all" || monthFilter !== "all" || yearFilter !== "all" || activeFilter !== "all";

  const resetFilters = () => {
    setGlobalFilter("");
    setPaidFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
    setActiveFilter("all");
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

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
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

          <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
            <Layers className="mr-2 h-4 w-4" />
            Buat Bulk
          </Button>
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
          {activeFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {activeFilter === "active" ? "Aktif" : "Nonaktif"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setActiveFilter("all")} />
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
      <BulkCreateDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen} onSuccess={handleSuccess} allStudents={allStudents} allPaymentTypes={allPaymentTypes} allPayments={allPayments} />
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

  if (isPending || isLoadingUserData) return <Loading />;
  // Check if user is Admin
  if (userRole !== "Admin") {
    if (userRole !== "Bendahara") {
      unauthorized();
      return null;
    }
  }
  return <BillingDataTable />;
}
