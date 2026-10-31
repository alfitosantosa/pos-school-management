"use client";

import { exportClassRecapToExcel } from "@/app/(action)/createExcel/recap/exportClassRecap";
import { createPDFClassRecap } from "@/app/(action)/createPDF/recap/classRecap";
import { useGetAcademicYears } from "@/app/(hooks)/hooks/AcademicYears/useAcademicYear";
import { useGetClasses } from "@/app/(hooks)/hooks/Classes/useClass";
import { useGetMajors } from "@/app/(hooks)/hooks/Majors/useMajors";
import { PaymentRecapRow, usePaymentRecap } from "@/app/(hooks)/hooks/Payments/usePaymentItems";
import { useGetUserByIdBetterAuth } from "@/app/(hooks)/hooks/Users/useUsersByIdBetterAuth";
import Loading from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTablePageSize } from "@/components/ui/data-table-page-size";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession } from "@/lib/authClients";
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { Building2, CheckCircle2, CreditCard, Download, FileText, GraduationCap, Search, Users, Wallet, X } from "lucide-react";
import { unauthorized } from "next/navigation";
import * as React from "react";

const MONTHS = [
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
];

const numberFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function PaymentStatusBadge({ row }: { row: PaymentRecapRow }) {
  if (row.itemCount === 0) {
    return <Badge variant="outline">Belum ada tagihan</Badge>;
  }
  if (row.unpaid === 0) {
    return <Badge className="bg-green-600 text-white">Lunas</Badge>;
  }
  if (row.paid > 0) {
    return <Badge className="bg-yellow-500 text-white">Sebagian</Badge>;
  }
  return <Badge variant="destructive">Belum bayar</Badge>;
}

const EMPTY_ROWS: PaymentRecapRow[] = [];

function PaymentRecapContent({ lockedMajorId }: { lockedMajorId?: string }) {
  const { data: majors = [], isLoading: isLoadingMajors } = useGetMajors();
  const { data: classes = [], isLoading: isLoadingClasses } = useGetClasses();
  const { data: academicYears = [] } = useGetAcademicYears();

  const [majorId, setMajorId] = React.useState(lockedMajorId ?? "");
  const [classId, setClassId] = React.useState("");
  const [year, setYear] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [isExporting, setIsExporting] = React.useState(false);

  React.useEffect(() => {
    if (lockedMajorId) setMajorId(lockedMajorId);
  }, [lockedMajorId]);

  const isBranchLocked = Boolean(lockedMajorId);

  const { data: rows = EMPTY_ROWS, isLoading } = usePaymentRecap(classId, year);

  const selectedMajor = majors.find((item) => item.id === majorId);
  const selectedClass = classes.find((item) => item.id === classId);
  const filteredClasses = React.useMemo(() => classes.filter((item) => item.majorId === majorId), [classes, majorId]);

  const yearOptions = React.useMemo(() => {
    const values = academicYears.map((item) => item.year);
    if (year && !values.includes(year)) values.unshift(year);
    return values;
  }, [academicYears, year]);

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(keyword) || (row.nisn ?? "").toLowerCase().includes(keyword));
  }, [rows, search]);

  const columns = React.useMemo<ColumnDef<PaymentRecapRow>[]>(
    () => [
      {
        id: "no",
        header: "No",
        cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.index + 1}</span>,
      },
      {
        accessorKey: "name",
        header: "Nama Siswa",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.nisn || "-"}</div>
          </div>
        ),
      },
      {
        accessorKey: "itemCount",
        header: "Item",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="font-medium tabular-nums">{row.original.itemCount}</span>
            <span className="text-xs text-muted-foreground">({row.original.paidCount} lunas)</span>
          </div>
        ),
      },
      ...MONTHS.map((month) => ({
        id: `month-${month.value}`,
        header: month.label,
        accessorFn: (row: PaymentRecapRow) => row.paidMonths[String(month.value)] ?? 0,
        cell: ({ getValue }: { getValue: () => unknown }) => <span className="tabular-nums text-xs">{formatNumber(Number(getValue()) || 0)}</span>,
      })),
      {
        accessorKey: "paid",
        header: "Total Bayar",
        cell: ({ row }) => <span className="tabular-nums font-medium text-green-600">{formatRupiah(row.original.paid)}</span>,
      },
      {
        accessorKey: "total",
        header: "Tagihan",
        cell: ({ row }) => <span className="tabular-nums">{formatRupiah(row.original.total)}</span>,
      },
      {
        accessorKey: "unpaid",
        header: "Belum Bayar",
        cell: ({ row }) => <span className="tabular-nums font-medium text-red-600">{formatRupiah(row.original.unpaid)}</span>,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <PaymentStatusBadge row={row.original} />,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const totals = React.useMemo(() => {
    const months = Object.fromEntries(MONTHS.map((month) => [month.value, 0])) as Record<number, number>;

    const result = filteredRows.reduce(
      (acc, row) => {
        acc.students += 1;
        acc.items += row.itemCount;
        acc.total += row.total;
        acc.paid += row.paid;
        acc.unpaid += row.unpaid;
        for (const month of MONTHS) {
          months[month.value] += row.paidMonths[String(month.value)] ?? 0;
        }
        return acc;
      },
      { students: 0, items: 0, total: 0, paid: 0, unpaid: 0 },
    );

    return { ...result, months };
  }, [filteredRows]);

  const handleMajorChange = (value: string) => {
    setMajorId(value);
    setClassId("");
    setYear("");
    setSearch("");
  };

  const handleClassChange = (value: string) => {
    const nextClass = classes.find((item) => item.id === value);
    setClassId(value);
    setYear(nextClass?.academicYear?.year ?? "");
    setSearch("");
  };

  const handleYearChange = (value: string) => {
    setYear(value);
  };

  const buildRecapPayload = () => {
    if (!selectedClass || !year || filteredRows.length === 0) return null;
    return {
      className: selectedClass.name,
      academicYear: year,
      majorName: selectedClass.major?.name,
      monthLabels: MONTHS.map((month) => month.label),
      rows: filteredRows.map((row, index) => ({
        no: index + 1,
        name: row.name,
        months: MONTHS.map((month) => row.paidMonths[String(month.value)] ?? 0),
        total: row.paid,
      })),
      monthTotals: MONTHS.map((month) => totals.months[month.value] ?? 0),
      total: totals.paid,
    };
  };

  const handleExportExcel = async () => {
    const payload = buildRecapPayload();
    if (!payload) return;

    setIsExporting(true);
    try {
      await exportClassRecapToExcel(payload);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    const payload = buildRecapPayload();
    if (!payload) return;

    setIsExporting(true);
    try {
      await createPDFClassRecap(payload);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="font-bold text-3xl mb-3">Rekap Pembayaran</div>
      <Badge variant="secondary">Rekap per Kelas</Badge>

      <div className="flex items-center justify-between py-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {!isBranchLocked && (
            <Select value={majorId} onValueChange={handleMajorChange} disabled={isLoadingMajors}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={isLoadingMajors ? "Memuat branch..." : "Pilih branch / sekolah"} />
              </SelectTrigger>
              <SelectContent>
                {majors.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={classId} onValueChange={handleClassChange} disabled={!majorId || isLoadingClasses}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={!majorId ? "Pilih branch dulu" : isLoadingClasses ? "Memuat kelas..." : "Pilih kelas"} />
            </SelectTrigger>
            <SelectContent>
              {filteredClasses.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={handleYearChange} disabled={!classId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={!classId ? "Pilih kelas dulu" : "Tahun ajaran"} />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {classId && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari nama atau NISN siswa..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-64 pl-8" />
            </div>
          )}

          {search && (
            <Button variant="outline" size="sm" onClick={() => setSearch("")}>
              <X className="mr-2 h-4 w-4" />
              Reset Pencarian
            </Button>
          )}
        </div>

        {classId && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              {selectedClass?.name} • {year || "-"} • {filteredRows.length} siswa
            </div>
            <Button onClick={handleExportPdf} disabled={isExporting || filteredRows.length === 0} className="bg-red-600 hover:bg-red-700 text-white">
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Menyiapkan..." : "Export PDF"}
            </Button>
            <Button onClick={handleExportExcel} disabled={isExporting || filteredRows.length === 0} className="bg-green-600 hover:bg-green-700 text-white">
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Menyiapkan..." : "Export Excel"}
            </Button>
          </div>
        )}
      </div>

      {!majorId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Pilih branch / sekolah terlebih dahulu</p>
            <p className="mt-1 text-sm text-muted-foreground">Filter kelas dan rekap pembayaran aktif setelah branch dipilih.</p>
          </CardContent>
        </Card>
      ) : !classId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Pilih kelas terlebih dahulu</p>
            <p className="mt-1 text-sm text-muted-foreground">Rekap pembayaran dan sisa tagihan ditampilkan setelah kelas dipilih.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Rekap {selectedClass?.name}
              </CardTitle>
              <CardDescription>
                {selectedMajor?.name} • Tahun Ajaran {year || "-"} • Nominal bulan adalah pembayaran yang sudah dibayar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Siswa
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{totals.students}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Item Tagihan
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{totals.items}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Total Tagihan
                  </div>
                  <p className="mt-2 text-lg font-bold tabular-nums">{formatRupiah(totals.total)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Sudah Bayar
                  </div>
                  <p className="mt-2 text-lg font-bold text-green-600 tabular-nums">{formatRupiah(totals.paid)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="h-4 w-4 text-red-600" />
                    Belum Bayar
                  </div>
                  <p className="mt-2 text-lg font-bold text-red-600 tabular-nums">{formatRupiah(totals.unpaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-md border w-full overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      Memuat rekap pembayaran...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">{search ? "Tidak ada siswa yang sesuai pencarian." : "Belum ada siswa di kelas ini."}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="font-bold tabular-nums">{totals.items}</TableCell>
                  {MONTHS.map((month) => (
                    <TableCell key={month.value} className="text-right font-bold tabular-nums">
                      {formatNumber(totals.months[month.value] ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell className="font-bold text-green-600 tabular-nums">{formatRupiah(totals.paid)}</TableCell>
                  <TableCell className="font-bold tabular-nums">{formatRupiah(totals.total)}</TableCell>
                  <TableCell className="font-bold text-red-600 tabular-nums">{formatRupiah(totals.unpaid)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex flex-1 items-center gap-3 text-sm text-muted-foreground">
              <span>
                {table.getFilteredRowModel().rows.length} siswa
                {search ? " (terfilter)" : ""}
              </span>
              <DataTablePageSize table={table} />
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">
                Halaman {table.getState().pagination.pageIndex + 1} dari {Math.max(table.getPageCount(), 1)}
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
        </div>
      )}
    </div>
  );
}

export default function PaymentRecapPage() {
  const { data: session, isPending } = useSession();
  const { data: userData, isLoading: isLoadingUserData } = useGetUserByIdBetterAuth(session?.user?.id ?? "");

  if (isPending || isLoadingUserData) return <Loading />;

  const role = userData?.role?.name?.toLowerCase() ?? "";
  if (!role.includes("admin") && !role.includes("bendahara")) {
    unauthorized();
    return null;
  }

  return <PaymentRecapContent lockedMajorId={role.includes("bendahara") ? userData?.major?.id : undefined} />;
}
