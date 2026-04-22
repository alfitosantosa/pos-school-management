"use client";

import * as React from "react";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Pencil, Trash2, DollarSign, CheckCircle, Clock, XCircle, TrendingUp, Users, Calendar } from "lucide-react";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import base64id from "base64id";

// Import hooks
import { useGetPayments, useCreatePayment, useUpdatePayment, useDeletePayment, useCreatePaymentBulk } from "@/app/hooks/Payments/usePayment";
import { useGetPaymentTypes } from "@/app/hooks/Payments/usePaymentType";
import { useGetUsers } from "@/app/hooks/Users/useUsers";
import Loading from "@/components/loading";
import { useSession } from "@/lib/auth-client";
import { unauthorized } from "next/navigation";
import { useGetUserByIdBetterAuth } from "@/app/hooks/Users/useUsersByIdBetterAuth";
import { useGetStudents } from "@/app/hooks/Users/useStudents";
import { useGetClasses } from "@/app/hooks/Classes/useClass";

// Type definitions
export type PaymentData = {
  id: string;
  studentId: string;
  classId?: string;
  paymentTypeId: string;
  amount: number;
  dueDate?: Date | string;
  status: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  paymentDate: Date | string;
  receiptNumber?: string;
  student?: {
    id: string;
    name: string;
    email?: string;
  };
  paymentType?: {
    id: string;
    name: string;
    amount: number;
  };
};

// Form schema
const paymentSchema = z.object({
  studentId: z.string().optional(),
  classId: z.string().optional(),
  paymentTypeId: z.string().min(1, "Jenis pembayaran wajib dipilih"),
  amount: z.number().min(0, "Jumlah minimal 0"),
  dueDate: z.string().optional(),
  status: z.string().min(1, "Status wajib dipilih"),
  notes: z.string().optional(),
  paymentDate: z.string().min(1, "Tanggal pembayaran wajib diisi"),
  receiptNumber: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

// Payment status options
const paymentStatuses = [
  { value: "pending", label: "Belum Lunas" },
  { value: "paid", label: "Lunas" },
  { value: "overdue", label: "Terlambat" },
  { value: "cancelled", label: "Dibatalkan" },
];

// Statistics Card Component
function StatisticsCards({ payments }: { payments: PaymentData[] }) {
  const totalPayments = payments.length;
  const paidPayments = payments.filter((p) => p.status === "paid").length;
  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const overduePayments = payments.filter((p) => p.status === "overdue").length;

  const totalRevenue = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pembayaran</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPayments}</div>
          <p className="text-xs text-muted-foreground">Total transaksi pembayaran</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lunas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{paidPayments}</div>
          <p className="text-xs text-muted-foreground">{formatCurrency(totalRevenue)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tertunda</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{pendingPayments}</div>
          <p className="text-xs text-muted-foreground">Menunggu pembayaran</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{overduePayments}</div>
          <p className="text-xs text-muted-foreground">Melewati jatuh tempo</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Create/Edit Dialog Component
function PaymentFormDialog({ open, onOpenChange, editData, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; editData?: PaymentData | null; onSuccess: () => void }) {
  const createPayment = useCreatePayment();
  const createPaymentBulk = useCreatePaymentBulk();
  const updatePayment = useUpdatePayment();
  const { data: paymentTypes = [] } = useGetPaymentTypes();
  const { data: students = [] } = useGetStudents();
  const { data: classes = [] } = useGetClasses();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      status: "pending",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedStudentId = watch("studentId");
  const selectedClassId = watch("classId");
  const selectedPaymentTypeId = watch("paymentTypeId");
  const selectedStatus = watch("status");

  React.useEffect(() => {
    if (editData) {
      setValue("studentId", editData.studentId || "");
      setValue("classId", editData.classId || "");
      setValue("paymentTypeId", editData.paymentTypeId);
      setValue("amount", editData.amount);
      setValue("dueDate", editData.dueDate ? new Date(editData.dueDate).toISOString().split("T")[0] : "");
      setValue("status", editData.status);
      setValue("notes", editData.notes || "");
      setValue("paymentDate", new Date(editData.paymentDate).toISOString().split("T")[0]);
      setValue("receiptNumber", editData.receiptNumber || "");
    } else {
      reset({
        amount: 0,
        status: "pending",
        paymentDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [editData, setValue, reset]);

  // Auto-fill amount when payment type is selected
  React.useEffect(() => {
    if (selectedPaymentTypeId && !editData) {
      const selectedType = paymentTypes.find((type: any) => type.id === selectedPaymentTypeId);
      if (selectedType) {
        setValue("amount", Number(selectedType.amount));
      }
    }
  }, [selectedPaymentTypeId, paymentTypes, editData, setValue]);

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      const payload = {
        ...data,
        dueDate: data.dueDate || undefined,
        notes: data.notes || undefined,
        receiptNumber: data.receiptNumber || undefined,
      };

      if (editData) {
        await updatePayment.mutateAsync({ id: editData.id, ...payload } as any);
        toast.success("Pembayaran berhasil diperbarui!");
      } else {
        if (payload.classId && !payload.studentId) {
          await createPaymentBulk.mutateAsync(payload as any);
        } else {
          await createPayment.mutateAsync(payload as any);
        }
        toast.success("Pembayaran berhasil dibuat!");
      }
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Pembayaran" : "Tambah Pembayaran Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Siswa</Label>
              <Select value={selectedStudentId} onValueChange={(value) => setValue("studentId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Siswa" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.studentId && <p className="text-sm text-red-500">{errors.studentId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select value={selectedClassId} onValueChange={(value) => setValue("classId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map((classItem: any) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classId && <p className="text-sm text-red-500">{errors.classId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Jenis Pembayaran</Label>
              <Select value={selectedPaymentTypeId} onValueChange={(value) => setValue("paymentTypeId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis Pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentTypeId && <p className="text-sm text-red-500">{errors.paymentTypeId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Pembayaran (Rp)</Label>
              <Input id="amount" type="number" placeholder="0" {...register("amount", { valueAsNumber: true })} />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Nomor Kwitansi</Label>
              <Input id="receiptNumber" disabled={true} value={``} {...register("receiptNumber")} />
              {errors.receiptNumber && <p className="text-sm text-red-500">{errors.receiptNumber.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Tanggal Pembayaran</Label>
              <Input id="paymentDate" type="date" {...register("paymentDate")} />
              {errors.paymentDate && <p className="text-sm text-red-500">{errors.paymentDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Jatuh Tempo (Opsional)</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status Pembayaran</Label>
            <Select value={selectedStatus} onValueChange={(value) => setValue("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                {paymentStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea id="notes" placeholder="Tambahkan catatan..." rows={3} {...register("notes")} />
            {errors.notes && <p className="text-sm text-red-500">{errors.notes.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={createPayment.isPending || updatePayment.isPending}>
              {createPayment.isPending || updatePayment.isPending ?
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

// Delete Confirmation Dialog
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
            Apakah Anda yakin ingin menghapus pembayaran untuk <strong>{paymentData?.student?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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

// Main DataTable Component
function PaymentDashboard() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentData | null>(null);

  const { data: payments = [], isLoading, refetch } = useGetPayments();

  const handleSuccess = () => {
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-600";
      case "pending":
        return "bg-yellow-600";
      case "overdue":
        return "bg-red-600";
      case "cancelled":
        return "bg-gray-600";
      default:
        return "bg-blue-600";
    }
  };

  const getStatusLabel = (status: string) => {
    const found = paymentStatuses.find((s) => s.value === status);
    return found ? found.label : status;
  };

  const columns: ColumnDef<PaymentData>[] = [
    {
      id: "select",
      header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "receiptNumber",
      header: "No. Kwitansi",
      cell: ({ row }) => <div className="font-medium">{row.getValue("receiptNumber") || "-"}</div>,
    },
    {
      accessorKey: "student",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nama Siswa
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const student = row.getValue("student") as PaymentData["student"];
        return <div className="font-medium">{student?.name || "-"}</div>;
      },
      filterFn: (row, columnId, filterValue) => {
        const student = row.getValue(columnId) as PaymentData["student"];
        if (!student?.name) return false;
        return student.name.toLowerCase().includes(filterValue.toLowerCase());
      },
    },
    {
      accessorKey: "paymentType",
      header: "Jenis Pembayaran",
      cell: ({ row }) => {
        const paymentType = row.getValue("paymentType") as PaymentData["paymentType"];
        return <div>{paymentType?.name || "-"}</div>;
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Jumlah
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        return <div className="font-medium">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: "paymentDate",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tgl Bayar
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("paymentDate") as string;
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      accessorKey: "dueDate",
      header: "Jatuh Tempo",
      cell: ({ row }) => {
        const date = row.getValue("dueDate") as string;
        return <div>{date ? formatDate(date) : "-"}</div>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge className={`text-white ${getStatusBadgeColor(status)}`}>{getStatusLabel(status)}</Badge>;
      },
    },
    {
      accessorKey: "notes",
      header: "Catatan",
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.getValue("notes")}>
          {row.getValue("notes") || "-"}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const paymentData = row.original;

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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(paymentData.id)}>Copy ID Pembayaran</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPayment(paymentData);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPayment(paymentData);
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
    data: payments,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="mx-auto my-8 p-6 max-w-7xl min-h-screen">
        <div className="mb-6">
          <h1 className="font-bold text-3xl mb-2">Dashboard Pembayaran</h1>
          <p className="text-muted-foreground">Kelola pembayaran SPP dan pembayaran sekolah lainnya</p>
        </div>

        {/* Statistics Cards */}
        <StatisticsCards payments={payments} />

        <div className="mx-auto">
          <div className="flex  items-center justify-between py-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* <Input
                placeholder="Cari nama siswa atau no. kwitansi..."
                value={(table.getColumn("receiptNumber")?.getFilterValue() as string) || ""}
                onChange={(event) => {
                  const value = event.target.value;
                  table.getColumn("receiptNumber")?.setFilterValue(value);
                }}
                className="max-w-sm"
              /> */}
              <Input placeholder="Cari nama murid..." value={(table.getColumn("student")?.getFilterValue() as string) ?? ""} onChange={(event) => table.getColumn("student")?.setFilterValue(event.target.value)} className="max-w-sm" />
              <Select
                value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
                onValueChange={(value) => {
                  table.getColumn("status")?.setFilterValue(value === "all" ? "" : value);
                }}
              >
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {paymentStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Kolom <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pembayaran
              </Button>
            </div>
          </div>

          <div className="rounded-md border w-max-7xl">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>;
                    })}
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
                      Tidak ada data pembayaran.
                    </TableCell>
                  </TableRow>
                }
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} dari {table.getFilteredRowModel().rows.length} baris dipilih.
            </div>
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

        {/* Dialogs */}
        <PaymentFormDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onSuccess={handleSuccess} />

        <PaymentFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} editData={selectedPayment} onSuccess={handleSuccess} />

        <DeletePaymentDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} paymentData={selectedPayment} onSuccess={handleSuccess} />
      </div>
    </>
  );
}

export default function PaymentDashboardPage() {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;

  const { data: userData, isLoading: isLoadingUserData } = useGetUserByIdBetterAuth(userId as string);
  const userRole = userData?.role?.name;

  // Show loading while checking authorization
  if (isPending || isLoadingUserData) {
    return <Loading />;
  }

  // Check if user is Admin
  if (userRole !== "Admin") {
    unauthorized()
    return null;
  }

  // Render dashboard only after authorization is confirmed
  return <PaymentDashboard />;
}
