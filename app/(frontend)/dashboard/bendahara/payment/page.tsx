"use client";

import * as React from "react";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Pencil, Trash2, Search, X, FileText, CreditCard, User, CalendarDays, Receipt, Building2, BadgeCheck, Clock, XCircle, Minus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { useGetPayments, useCreatePayment, useUpdatePayment, useDeletePayment } from "@/app/hooks/Payments/usePayment";
import { useCreatePaymentItems, useUpdatePaymentItems, useDeletePaymentItems } from "@/app/hooks/Payments/usePaymentItems";
import { useGetStudents } from "@/app/hooks/Users/useStudents";
import { useGetMajors } from "@/app/hooks/Majors/useMajors";
import { useGetAccountBank } from "@/app/hooks/AccountBank/useAccountBank";
import { useGetPaymentTypes } from "@/app/hooks/Payments/usePaymentType";
import Loading from "@/components/loading";
import { useSession } from "@/lib/auth-client";
import { unauthorized } from "next/navigation";
import { useGetUserByIdBetterAuth } from "@/app/hooks/Users/useUsersByIdBetterAuth";
import { v4 as uuidv4 } from "uuid";
// ─── Types ────────────────────────────────────────────────────────────────────
export type PaymentTypeData = {
  id: string;
  name: string;
  description: string;
  amount: string;
  isMonthly: boolean;
  isActive: boolean;
  isFixedAmount: boolean;
  isFixedQuantity: boolean;
  quantity: string;
  subtotal: string;
  owner: string;
  majorId: string;
  major: {
    id: string;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
  };
};

export type PaymentItemData = {
  id: string;
  paymentId: string;
  paymentTypeId: string;
  skuName: string;
  amount: number | string;
  quantity: number;
  subtotal: number | string;
  paymentType?: PaymentTypeData;
};

export type PaymentData = {
  id: string;
  studentId: string;
  bendaharaId: string;
  amount: number | string;
  dueDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
  paymentDate: string;
  receiptNumber: string;
  accountBankId: string;
  majorId: string;
  month: string;
  student?: { id: string; name: string };
  major?: { id: string; name: string };
  accountBank?: { id: string; accountName: string; accountBank?: string; accountNumber: string };
  paymentItems?: PaymentItemData[];
};

// ─── Status Config ────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  paid: { label: "Lunas", className: "bg-green-600 text-white", icon: <BadgeCheck className="h-3 w-3" /> },
  pending: { label: "Menunggu", className: "bg-yellow-500 text-white", icon: <Clock className="h-3 w-3" /> },
  overdue: { label: "Terlambat", className: "bg-red-600 text-white", icon: <XCircle className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, className: "bg-gray-500 text-white", icon: null };
  return (
    <Badge className={`${cfg.className} flex items-center gap-1 w-fit`}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function formatRupiah(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// ─── Form Schema ──────────────────────────────────────────────────────────────
const paymentItemSchema = z.object({
  paymentTypeId: z.string().min(1, "Jenis pembayaran wajib dipilih"),
  name: z.string().optional(),
  amount: z.number().min(0, "Nominal tidak boleh negatif"),
  quantity: z.number().min(1, "Jumlah minimal 1"),
  subtotal: z.number(),
});

const paymentSchema = z.object({
  studentId: z.string().min(1, "Siswa wajib dipilih"),
  bendaharaId: z.string().min(1, "Bendahara ID wajib diisi"),
  majorId: z.string().min(1, "Branch wajib dipilih"),
  accountBankId: z.string().min(1, "Rekening bank wajib dipilih"),
  month: z.string().min(1, "Bulan wajib dipilih"),
  status: z.string().min(1, "Status wajib dipilih"),
  paymentDate: z.string().min(1, "Tanggal bayar wajib diisi"),
  dueDate: z.string().optional(),
  receiptNumber: z.string().min(1, "Nomor kwitansi wajib diisi"),
  notes: z.string().optional(),
  items: z.array(paymentItemSchema).min(1, "Minimal satu item pembayaran"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

// ─── Expanded Items Row ───────────────────────────────────────────────────────
function ExpandedItemsRow({ items }: { items: PaymentItemData[] }) {
  if (!items?.length) {
    return <div className="px-8 py-3 text-sm text-muted-foreground">Tidak ada item pembayaran.</div>;
  }
  return (
    <div className="px-8 py-3 bg-muted/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground border-b">
            <th className="text-left pb-2 font-medium">Jenis Pembayaran</th>
            <th className="text-right pb-2 font-medium">Nominal</th>
            <th className="text-center pb-2 font-medium">Qty</th>
            <th className="text-right pb-2 font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id ?? i} className="border-b last:border-0">
              <td className="py-2 font-medium">{item.paymentType?.name ?? item.skuName ?? "-"}</td>
              <td className="py-2 text-right">{formatRupiah(item.amount)}</td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right font-medium">{formatRupiah(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Form Dialog ──────────────────────────────────────────────────────────────
function PaymentFormDialog({
  open,
  onOpenChange,
  editData,
  onSuccess,
  allStudents,
  allMajors,
  allAccountBanks,
  allPaymentTypes,
  userDataId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: PaymentData | null;
  onSuccess: () => void;
  allStudents: { id: string; name: string }[];
  allMajors: { id: string; name: string }[];
  allAccountBanks: {
    id: string;
    accountName: string;
    accountBank?: string;
    accountNumber: string;
    major: { name: string };
  }[];
  allPaymentTypes: PaymentTypeData[];
  userDataId?: string;
}) {
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const createItems = useCreatePaymentItems();
  const deleteItems = useDeletePaymentItems();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      status: "pending",
      paymentDate: new Date().toISOString().split("T")[0],
      bendaharaId: userDataId || "",
      items: [{ paymentTypeId: "", name: "", amount: 0, quantity: 1, subtotal: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const selectedStudentId = watch("studentId");
  const selectedMajorId = watch("majorId");
  const selectedAccountBankId = watch("accountBankId");
  const selectedMonth = watch("month");
  const selectedStatus = watch("status");

  // Compute grand total from items - recalculate on every render
  const grandTotal = watchedItems?.reduce((sum, item) => sum + (item.subtotal || 0), 0) ?? 0;

  // Auto-populate amount when payment type selected
  const handlePaymentTypeChange = (index: number, paymentTypeId: string) => {
    const pt = allPaymentTypes.find((p) => p.id === paymentTypeId);
    if (pt) {
      const amount = parseFloat(pt.amount) || 0;
      const qty = pt.isFixedQuantity ? parseFloat(pt.quantity) || 1 : (watchedItems?.[index]?.quantity ?? 1);
      setValue(`items.${index}.paymentTypeId`, paymentTypeId);
      setValue(`items.${index}.name`, pt.name);
      setValue(`items.${index}.amount`, amount);
      setValue(`items.${index}.quantity`, qty);
      setValue(`items.${index}.subtotal`, amount * qty);
    }
  };

  const handleQtyChange = (index: number, qty: number) => {
    const amount = watchedItems?.[index]?.amount ?? 0;
    setValue(`items.${index}.quantity`, qty);
    setValue(`items.${index}.subtotal`, amount * qty);
  };

  const handleAmountChange = (index: number, amount: number) => {
    const qty = watchedItems?.[index]?.quantity ?? 1;
    setValue(`items.${index}.amount`, amount);
    setValue(`items.${index}.subtotal`, amount * qty);
  };

  React.useEffect(() => {
    if (editData) {
      setValue("studentId", editData.studentId || "");
      setValue("majorId", editData.majorId || "");
      setValue("accountBankId", editData.accountBankId || "");
      setValue("month", editData.month || "");
      setValue("status", editData.status || "pending");
      setValue("paymentDate", editData.paymentDate ? new Date(editData.paymentDate).toISOString().split("T")[0] : "");
      setValue("dueDate", editData.dueDate ? new Date(editData.dueDate).toISOString().split("T")[0] : "");
      setValue("receiptNumber", editData.receiptNumber || "");
      setValue("notes", editData.notes || "");
      if (userDataId) setValue("bendaharaId", userDataId);

      // Populate items from existing payment items
      if (editData.paymentItems?.length) {
        setValue(
          "items",
          editData.paymentItems.map((item) => ({
            paymentTypeId: item.paymentTypeId || "",
            studentId: editData.student?.id,
            name: item.paymentType?.name ?? item.skuName ?? "",
            amount: parseFloat(String(item.amount)) || 0,
            quantity: item.quantity || 1,
            subtotal: parseFloat(String(item.subtotal)) || 0,
          })),
        );
      } else {
        setValue("items", [{ paymentTypeId: "", name: "", amount: 0, quantity: 1, subtotal: 0 }]);
      }
    } else {
      reset({
        status: "pending",
        paymentDate: new Date().toISOString().split("T")[0],
        bendaharaId: userDataId || "",
        items: [{ paymentTypeId: "", name: "", amount: 0, quantity: 1, subtotal: 0 }],
      });
    }
  }, [editData, setValue, reset, userDataId]);

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      const paymentPayload = {
        studentId: data.studentId,
        bendaharaId: data.bendaharaId,
        majorId: data.majorId,
        accountBankId: data.accountBankId,
        month: data.month,
        amount: grandTotal,
        status: data.status,
        paymentDate: new Date(data.paymentDate).toISOString(),
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        receiptNumber: data.receiptNumber,
        notes: data.notes || null,
      };

      if (editData) {
        await updatePayment.mutateAsync({ id: editData.id, ...paymentPayload });

        // Delete old items then recreate
        if (editData.paymentItems?.length) {
          await deleteItems.mutateAsync(editData.paymentItems.map((items) => items.id));
          console.log(editData.paymentItems);
        }

        const selectedStudent = allStudents.find((s) => s.id === data.studentId);
        await createItems.mutateAsync(
          data.items.map((item) => ({
            paymentId: editData.id,
            studentId: data.studentId,
            studentName: selectedStudent?.name || "",
            paymentTypeId: item.paymentTypeId,
            name: item.name,
            amount: item.amount,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
        );
        toast.success("Pembayaran berhasil diperbarui!");
        console.log("items yang dikirim", data.items);
      } else {
        const created = await createPayment.mutateAsync(paymentPayload);
        const newPaymentId = created?.id;
        if (newPaymentId) {
          const selectedStudent = allStudents.find((s) => s.id === data.studentId);
          await createItems.mutateAsync(
            data.items.map((item) => ({
              paymentId: newPaymentId,
              studentId: data.studentId,
              studentName: selectedStudent?.name || "",
              paymentTypeId: item.paymentTypeId,
              name: item.name ?? "",
              amount: item.amount,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          );
        }
        console.log("items yang dikirim", data.items);
        toast.success("Pembayaran berhasil dibuat!");
      }

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const isPending = createPayment.isPending || updatePayment.isPending || createItems.isPending || deleteItems.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Pembayaran" : "Tambah Pembayaran Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...register("bendaharaId")} />

          {/* Student & Branch */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Siswa</Label>
              <Controller
                name="studentId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Siswa" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {allStudents?.map((s) => (
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
              <Label>Branch</Label>
              <Controller
                name="majorId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {allMajors?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.majorId && <p className="text-sm text-red-500">{errors.majorId.message}</p>}
            </div>
          </div>

          {/* Account Bank & Month */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Rekening Bank</Label>
              <Controller
                name="accountBankId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Rekening Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {allAccountBanks?.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {`${b.accountBank} - ${b.accountName} - ${b.accountNumber}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.accountBankId && <p className="text-sm text-red-500">{errors.accountBankId.message}</p>}
            </div>
          </div>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Menunggu</SelectItem>
                        <SelectItem value="paid">Lunas</SelectItem>
                        <SelectItem value="overdue">Terlambat</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
              </div>
            </div>
            {/* Status, Payment Date, Due Date */}

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Tanggal Bayar</Label>
              <Input id="paymentDate" type="date" {...register("paymentDate")} />
              {errors.paymentDate && <p className="text-sm text-red-500">{errors.paymentDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Jatuh Tempo <span className="text-xs text-muted-foreground">(opsional)</span>
              </Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
          </div>

          {/* Receipt Number */}
          <div className="space-y-2">
            <Label htmlFor="receiptNumber">Nomor Kwitansi</Label>
            <Input disabled={true} value={`KWT-${uuidv4()}`} id="receiptNumber" placeholder="Contoh: RCP-2024-001" {...register("receiptNumber")} />
            {errors.receiptNumber && <p className="text-sm text-red-500">{errors.receiptNumber.message}</p>}
          </div>

          <Separator />

          {/* Payment Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Item Pembayaran</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ paymentTypeId: "", name: "", amount: 0, quantity: 1, subtotal: 0 })}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Item
              </Button>
            </div>

            {errors.items && typeof errors.items === "object" && "message" in errors.items && <p className="text-sm text-red-500">{(errors.items as any).message}</p>}

            {/* Items header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-4">Jenis Pembayaran</div>
              <div className="col-span-3">Nominal (Rp)</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Subtotal</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => {
                const currentItem = watchedItems?.[index];
                const pt = currentItem?.paymentTypeId ? allPaymentTypes.find((p) => p.id === currentItem.paymentTypeId) : undefined;
                const isFixedAmount = pt?.isFixedAmount ?? false;
                const isFixedQty = pt?.isFixedQuantity ?? false;

                return (
                  <div key={field.id} className="grid border p-2 rounded-xl grid-cols-12 gap-2 items-start">
                    {/* Payment Type Select */}
                    <div className="col-span-4">
                      <Controller
                        name={`items.${index}.paymentTypeId`}
                        control={control}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={(val) => handlePaymentTypeChange(index, val)}>
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
                      {errors.items?.[index]?.paymentTypeId && <p className="text-xs text-red-500 mt-1">{errors.items[index]?.paymentTypeId?.message}</p>}
                      {pt?.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{pt.description}</p>}
                    </div>

                    {/* Amount */}
                    <div className="col-span-3">
                      <Input className="h-9 text-xs" type="number" min={0} placeholder="Nominal" disabled={isFixedAmount} value={watchedItems?.[index]?.amount ?? 0} onChange={(e) => handleAmountChange(index, Number(e.target.value))} />
                      {isFixedAmount && <p className="text-xs text-muted-foreground mt-0.5">Nominal tetap</p>}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <Input className="h-9 text-xs text-center" type="number" disabled={isFixedQty} value={watchedItems?.[index]?.quantity ?? 1} onChange={(e) => handleQtyChange(index, Number(e.target.value))} />
                      {isFixedQty && <p className="text-xs text-muted-foreground mt-0.5 text-center">Tetap</p>}
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-3 flex items-center justify-end h-9">
                      <span className="text-l font-semibold tabular-nums">{formatRupiah(watchedItems?.[index]?.subtotal ?? 0)}</span>
                    </div>

                    {/* Remove */}
                    <div className="col-span-2">
                      <Button variant="secondary" size="sm" onClick={() => remove(index)} disabled={fields.length === 1}>
                        Delete <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Grand Total */}
          <div className="flex justify-end">
            <div className="space-y-1 text-right min-w-[200px]">
              <div className="flex justify-between text-sm gap-8">
                <span className="text-muted-foreground">Total Pembayaran</span>
                <span className="font-bold text-base tabular-nums">{formatRupiah(grandTotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{fields.length} item · otomatis dihitung dari item</p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Catatan <span className="text-xs text-muted-foreground">(opsional)</span>
            </Label>
            <Textarea id="notes" placeholder="Catatan tambahan..." rows={2} {...register("notes")} />
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
function DeletePaymentDialog({ open, onOpenChange, paymentData, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; paymentData: PaymentData | null; onSuccess: () => void }) {
  const deletePayment = useDeletePayment();

  const handleDelete = async () => {
    if (!paymentData) return;
    try {
      await deletePayment.mutateAsync(paymentData.id);
      toast.success("Pembayaran berhasil dihapus!");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus pembayaran");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Pembayaran</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus pembayaran dengan nomor kwitansi <span className="font-semibold">"{paymentData?.receiptNumber}"</span> milik {paymentData?.student?.name ?? "siswa ini"}? Semua item pembayaran akan ikut
            terhapus. Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deletePayment.isPending} className="bg-red-600 hover:bg-red-700">
            {deletePayment.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main DataTable ───────────────────────────────────────────────────────────
function PaymentDataTable({
  userDataId,
  userDataMajor,
}: {
  userDataId?: string;
  userDataMajor: {
    id?: string;
    name?: string;
  };
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [monthFilter, setMonthFilter] = React.useState<string>("all");
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentData | null>(null);

  const { data: payments = [], isLoading, refetch } = useGetPayments();
  const { data: allStudents = [] } = useGetStudents();
  const { data: allMajors = [] } = useGetMajors();
  const { data: allAccountBanks = [] } = useGetAccountBank();
  const { data: allPaymentTypes = [] } = useGetPaymentTypes();

  const handleSuccess = () => refetch();

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const globalFilterFn = React.useCallback((row: any, _: string, filterValue: string) => {
    if (!filterValue) return true;
    const p = row.original as PaymentData;
    const text = [p.student?.name, p.major?.name, p.accountBank?.accountName, p.accountBank?.accountBank, p.receiptNumber, p.month, p.status, p.notes].filter(Boolean).join(" ").toLowerCase();
    return text.includes(filterValue.toLowerCase());
  }, []);

  const columns: ColumnDef<PaymentData>[] = [
    {
      id: "select",
      header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} aria-label="Select all" />,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "expand",
      header: () => <span className="text-xs text-muted-foreground">Item</span>,
      cell: ({ row }) => {
        const p = row.original;
        const isExpanded = expandedRows.has(p.id);
        const itemCount = p.paymentItems?.length ?? 0;
        return (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2" onClick={() => toggleExpand(p.id)}>
            <Package className="h-3.5 w-3.5" />
            {itemCount}
            {isExpanded ?
              <ChevronDown className="h-3.5 w-3.5 rotate-180 transition-transform" />
            : <ChevronDown className="h-3.5 w-3.5 transition-transform" />}
          </Button>
        );
      },
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
      accessorKey: "receiptNumber",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <Receipt className="mr-2 h-4 w-4" />
          No. Kwitansi
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-mono text-sm font-medium">{row.getValue("receiptNumber")}</div>,
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
      cell: ({ row }) => <Badge variant="outline">{row.getValue("month")}</Badge>,
      filterFn: (row, _id, value) => {
        if (value === "all") return true;
        return row.original.month === value;
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <CreditCard className="mr-2 h-4 w-4" />
          Jumlah
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-semibold tabular-nums">{formatRupiah(row.getValue("amount"))}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      filterFn: (row, _id, value) => {
        if (value === "all") return true;
        return row.original.status === value;
      },
    },
    {
      id: "major",
      accessorFn: (row) => row.major?.name ?? "-",
      header: "Branch",
      cell: ({ row }) => <Badge variant="secondary">{row.original.major?.name ?? "-"}</Badge>,
    },
    {
      id: "accountBank",
      accessorFn: (row) => row.accountBank?.accountName ?? "-",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <Building2 className="mr-2 h-4 w-4" />
          Bank
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const bank = row.original.accountBank;
        return (
          <div>
            <div className="text-sm font-medium">{bank?.accountBank ?? "-"}</div>
            {bank?.accountName && <div className="text-xs text-muted-foreground">{bank.accountName}</div>}
          </div>
        );
      },
    },
    {
      accessorKey: "paymentDate",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Tgl Bayar
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const d = row.getValue("paymentDate") as string;
        if (!d) return <span className="text-muted-foreground">-</span>;
        return <span>{format(new Date(d), "dd MMM yyyy", { locale: localeId })}</span>;
      },
    },
    {
      accessorKey: "dueDate",
      header: "Jatuh Tempo",
      cell: ({ row }) => {
        const d = row.getValue("dueDate") as string;
        if (!d) return <span className="text-muted-foreground">-</span>;
        return <span>{format(new Date(d), "dd MMM yyyy", { locale: localeId })}</span>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const p = row.original;
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(p.id)}>Copy ID Pembayaran</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(p.receiptNumber)}>Copy No. Kwitansi</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPayment(p);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPayment(p);
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
    data: payments as PaymentData[],
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
    table.getColumn("status")?.setFilterValue(statusFilter !== "all" ? statusFilter : undefined);
  }, [statusFilter, table]);

  React.useEffect(() => {
    table.getColumn("month")?.setFilterValue(monthFilter !== "all" ? monthFilter : undefined);
  }, [monthFilter, table]);

  if (isLoading) return <Loading />;

  const filteredRows = table.getFilteredRowModel().rows;
  const totalPayments = (payments as any[]).length;
  const totalPaid = filteredRows.filter((r) => r.original.status === "paid").reduce((sum, r) => sum + parseFloat(String(r.original.amount)), 0);

  const columnLabels: Record<string, string> = {
    student: "Siswa",
    receiptNumber: "No. Kwitansi",
    month: "Bulan",
    amount: "Jumlah",
    status: "Status",
    major: "Branch",
    accountBank: "Bank",
    paymentDate: "Tgl Bayar",
    dueDate: "Jatuh Tempo",
  };

  const hasActiveFilter = globalFilter || statusFilter !== "all" || monthFilter !== "all";

  return (
    <div className="mx-auto my-8 p-6 max-w-7xl min-h-screen">
      <div className="font-bold text-3xl mb-6">Data Pembayaran</div>

      {/* Toolbar */}
      <div className="flex items-center justify-between py-4 flex-wrap gap-y-3">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari siswa, kwitansi, bulan..." value={globalFilter ?? ""} onChange={(e) => setGlobalFilter(e.target.value)} className="max-w-sm pl-8" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="overdue">Terlambat</SelectItem>
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
          {hasActiveFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGlobalFilter("");
                setStatusFilter("all");
                setMonthFilter("all");
                table.resetColumnFilters();
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Reset Filter
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
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pembayaran
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
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusConfig[statusFilter]?.label ?? statusFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
            </Badge>
          )}
          {monthFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Bulan: {monthFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setMonthFilter("all")} />
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
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                  {/* Expanded items row */}
                  {expandedRows.has(row.original.id) && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={columns.length} className="p-0">
                        <ExpandedItemsRow items={row.original.paymentItems ?? []} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            : <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">{hasActiveFilter ? "Tidak ada data yang sesuai dengan filter." : "Tidak ada data pembayaran yang ditemukan."}</p>
                    {hasActiveFilter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGlobalFilter("");
                          setStatusFilter("all");
                          setMonthFilter("all");
                          table.resetColumnFilters();
                        }}
                      >
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
          {filteredRows.length !== totalPayments && <span className="ml-2">(difilter dari {totalPayments} total)</span>}
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
            <CreditCard className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Total Transaksi</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{totalPayments}</p>
          {filteredRows.length !== totalPayments && <p className="text-sm text-muted-foreground">({filteredRows.length} terfilter)</p>}
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <BadgeCheck className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Lunas</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{filteredRows.filter((r) => r.original.status === "paid").length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Menunggu</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{filteredRows.filter((r) => r.original.status === "pending").length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Total Terbayar</h3>
          </div>
          <p className="text-xl font-bold mt-2 tabular-nums">{formatRupiah(totalPaid)}</p>
          <p className="text-xs text-muted-foreground">dari transaksi lunas</p>
        </div>
      </div>

      {/* Dialogs */}
      <PaymentFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
        allStudents={allStudents}
        allMajors={allMajors}
        allAccountBanks={allAccountBanks}
        allPaymentTypes={allPaymentTypes}
        userDataId={userDataId}
      />
      <PaymentFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editData={selectedPayment}
        onSuccess={handleSuccess}
        allStudents={allStudents}
        allMajors={allMajors}
        allAccountBanks={allAccountBanks}
        allPaymentTypes={allPaymentTypes}
        userDataId={userDataId}
      />
      <DeletePaymentDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} paymentData={selectedPayment} onSuccess={handleSuccess} />
    </div>
  );
}

// ─── Auth Wrapper ─────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;
  const { data: userData, isLoading: isLoadingUserData } = useGetUserByIdBetterAuth(userId as string);
  const userRole = userData?.role?.name;
  const userDataId = userData?.id;
  const userDataMajor = userData?.major;
  if (isPending || isLoadingUserData) {
    return <Loading />;
  }

  // Check if user is Admin
  if (userRole !== "Admin") {
    if (userRole !== "Bendahara") {
      unauthorized();
      return null;
    }
  }
  return <PaymentDataTable userDataId={userDataId} userDataMajor={userDataMajor} />;
}
