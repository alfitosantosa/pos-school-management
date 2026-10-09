"use client";

import { BulkUploadPaymentItemsRoutines } from "@/app/(hooks)/hooks/Payments/usePaymentItemsRoutine";
import { useGetPaymentTypeByIdMajor } from "@/app/(hooks)/hooks/Payments/usePaymentType";
import { useGetStudentByIdMajorActive } from "@/app/(hooks)/hooks/Users/useGetStudentById";
import { useGetUserByIdBetterAuth } from "@/app/(hooks)/hooks/Users/useUsersByIdBetterAuth";
import type { PaymentItemRoutineBulkPayload, PaymentItemRoutineBulkResult } from "@/app/(types)";
import Loading from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyButton } from "@/components/ui/shadcn-io/copy-button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession } from "@/lib/authClients";
import { AlertCircle, CheckCircle2, CreditCard, Download, FileText, Info, Layers, Upload, Users, X } from "lucide-react";
import Link from "next/link";
import { unauthorized } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import type * as XLSXTypes from "xlsx";

// xlsx pulls Node shims, so it cannot be statically imported into a client
// component — same dynamic-import convention as app/(frontend)/dashboard/upload/*.
let xlsxModule: Promise<typeof XLSXTypes> | undefined;
function loadXLSX() {
  return (xlsxModule ??= import("xlsx"));
}

// ─── Types ────────────────────────────────────────────────────────────────────
type PreviewRow = PaymentItemRoutineBulkPayload & {
  rowNum: number;
  _studentName: string;
  _paymentTypeName: string;
  _errors: string[];
};

const IDR = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

function formatRupiah(value: number) {
  return IDR.format(Number.isNaN(value) ? 0 : value);
}

// ─── Upload Component ─────────────────────────────────────────────────────────
function UploadRoutine({ majorId, majorName }: { majorId: string; majorName?: string }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewRows, setPreviewRows] = React.useState<PreviewRow[]>([]);
  const [uploadResult, setUploadResult] = React.useState<PaymentItemRoutineBulkResult | null>(null);
  const [availableSheets, setAvailableSheets] = React.useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = React.useState("");

  const { data: students = [] } = useGetStudentByIdMajorActive(majorId);
  const { data: paymentTypes = [] } = useGetPaymentTypeByIdMajor(majorId);
  const bulkUploadMutation = BulkUploadPaymentItemsRoutines();

  const studentMap = React.useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [students]);

  const paymentTypeMap = React.useMemo(() => {
    const map = new Map<string, string>();
    paymentTypes.forEach((pt) => map.set(pt.id, pt.name));
    return map;
  }, [paymentTypes]);

  const parseAndPreview = React.useCallback(
    async (target: File, sheetName?: string) => {
      try {
        const XLSX = await loadXLSX();
        const arrayBuffer = await target.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheet = sheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheet];

        const excelRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

        const parsed: PreviewRow[] = [];

        for (let i = 1; i < excelRows.length; i++) {
          const row = excelRows[i];
          if (row[0] === undefined || row[0] === null || row[0] === "") continue;

          const errors: string[] = [];
          const studentId = String(row[0]).trim();
          const paymentTypeId = String(row[1] ?? "").trim();
          const quantity = Number(row[2]) || 0;
          const amount = Number(row[3]) || 0;
          const subtotal = Number(row[4]) || quantity * amount;
          const name = String(row[5] ?? "").trim();

          if (!studentId) errors.push("studentId kosong");
          else if (!studentMap.has(studentId)) errors.push("studentId tidak ditemukan");

          if (!paymentTypeId) errors.push("paymentTypeId kosong");
          else if (!paymentTypeMap.has(paymentTypeId)) errors.push("paymentTypeId tidak ditemukan");

          if (quantity <= 0) errors.push("quantity harus > 0");
          if (amount < 0) errors.push("amount tidak boleh negatif");
          if (!name) errors.push("name kosong");

          parsed.push({
            rowNum: i + 1,
            studentId,
            paymentTypeId,
            quantity,
            amount,
            subtotal,
            name,
            _studentName: studentMap.get(studentId) ?? studentId,
            _paymentTypeName: paymentTypeMap.get(paymentTypeId) ?? paymentTypeId,
            _errors: errors,
          });
        }

        setPreviewRows(parsed);
        setSelectedSheet(sheet);

        const errorCount = parsed.filter((r) => r._errors.length > 0).length;
        if (errorCount > 0) {
          toast.warning(`Sheet "${sheet}": ${parsed.length} baris ditemukan, ${errorCount} baris memiliki error`);
        } else {
          toast.success(`Sheet "${sheet}": ${parsed.length} baris siap diupload`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal membaca file Excel");
      }
    },
    [studentMap, paymentTypeMap],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadResult(null);
    setPreviewRows([]);
    setAvailableSheets([]);
    setSelectedSheet("");

    if (!e.target.files) return;

    const picked = Array.from(e.target.files);
    const excelFiles = picked.filter((f) => f.name.endsWith(".xlsx") || f.name.endsWith(".xls"));

    if (excelFiles.length !== picked.length) {
      toast.error("Hanya file Excel (.xlsx atau .xls) yang diperbolehkan");
    }
    if (excelFiles.length === 0) {
      setFile(null);
      return;
    }

    const first = excelFiles[0];
    setFile(first);

    try {
      const XLSX = await loadXLSX();
      const workbook = XLSX.read(await first.arrayBuffer(), { type: "array" });
      setAvailableSheets(workbook.SheetNames);
      await parseAndPreview(first, workbook.SheetNames[0]);
    } catch (err) {
      console.error(err);
      toast.error("Gagal membaca file Excel");
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!file) return;
    setSelectedSheet(sheetName);
    await parseAndPreview(file, sheetName);
  };

  const handleUpload = async () => {
    const validRows = previewRows.filter((r) => r._errors.length === 0);

    if (validRows.length === 0) {
      toast.error("Tidak ada baris valid untuk diupload");
      return;
    }

    try {
      const payload: PaymentItemRoutineBulkPayload[] = validRows.map((r) => ({
        studentId: r.studentId,
        paymentTypeId: r.paymentTypeId,
        quantity: r.quantity,
        amount: r.amount,
        subtotal: r.subtotal,
        name: r.name,
      }));

      const result = (await bulkUploadMutation.mutateAsync(payload)) as PaymentItemRoutineBulkResult & { error?: string };
      // apiClients resolves on non-2xx too, so surface the API error instead of a false success.
      if (result?.error) throw new Error(result.error);
      setUploadResult(result);
      toast.success(`Berhasil membuat ${result?.count ?? validRows.length} item tagihan rutin!`);
      setFile(null);
      setPreviewRows([]);
      setAvailableSheets([]);
      setSelectedSheet("");
      const fileInput = document.getElementById("routine-file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengupload data");
    }
  };

  const downloadTemplate = async () => {
    try {
      const XLSX = await loadXLSX();
      const firstStudent = students[0];
      const firstType = paymentTypes[0];

      const wsData = [
        ["Student ID*", "Payment Type ID*", "Quantity*", "Amount*", "Subtotal", "Name*"],
        [firstStudent?.id ?? "student-id-disini", firstType?.id ?? "payment-type-id-disini", 1, firstType ? firstType.amount : 100000, firstType ? firstType.amount : 100000, firstType?.name ?? "SPP Bulanan"],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wch: 36 }, { wch: 36 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, "Tagihan Rutin");
      XLSX.writeFile(wb, `template-tagihan-rutin-${majorName ?? majorId}.xlsx`);
      toast.success("Template Excel berhasil didownload");
    } catch {
      toast.error("Gagal membuat template");
    }
  };

  const exportStudentList = async () => {
    try {
      const XLSX = await loadXLSX();
      const wsData = [["ID (gunakan di kolom Student ID)", "Nama Siswa", "NISN", "Kelas"], ...students.map((s) => [s.id, s.name, s.nisn ?? "-", s.class?.name ?? "-"])];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wch: 36 }, { wch: 30 }, { wch: 14 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, "Daftar Siswa");
      XLSX.writeFile(wb, `daftar-siswa-${majorName ?? majorId}.xlsx`);
      toast.success("Daftar siswa berhasil diexport");
    } catch {
      toast.error("Gagal export daftar siswa");
    }
  };

  const exportPaymentTypeList = async () => {
    try {
      const XLSX = await loadXLSX();
      const wsData = [
        ["ID (gunakan di kolom Payment Type ID)", "Nama", "Nominal", "Owner", "Tipe SKU", "Bulanan?"],
        ...paymentTypes.map((pt) => [pt.id, pt.name, pt.amount, pt.owner, pt.skuType, pt.isMonthly ? "Ya" : "Tidak"]),
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wch: 36 }, { wch: 25 }, { wch: 14 }, { wch: 15 }, { wch: 12 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws, "Jenis Tagihan");
      XLSX.writeFile(wb, `jenis-tagihan-${majorName ?? majorId}.xlsx`);
      toast.success("Jenis tagihan berhasil diexport");
    } catch {
      toast.error("Gagal export jenis tagihan");
    }
  };

  const validCount = previewRows.filter((r) => r._errors.length === 0).length;
  const errorCount = previewRows.filter((r) => r._errors.length > 0).length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <div className="font-bold text-3xl mb-1">Upload Tagihan Rutin</div>
        <p className="text-sm text-muted-foreground">Bulk upload item tagihan rutin dari file Excel.</p>
        <div className="flex items-center gap-2 mt-2">
          {majorName && <Badge variant="secondary">Branch: {majorName}</Badge>}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/bendahara/billing/routine">Kembali ke Data Tagihan Rutin</Link>
          </Button>
        </div>
      </div>

      {/* ── Success Result Banner ── */}
      {uploadResult && (
        <div className="flex items-start gap-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">Upload Berhasil!</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
              {uploadResult.count} item tagihan rutin dibuat · {uploadResult.skipped > 0 && `${uploadResult.skipped} dilewati ·`} {uploadResult.total} total baris diproses
            </p>
          </div>
        </div>
      )}

      {/* ── Step 1: Export Reference Data ── */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
          <div className="text-lg font-semibold">Export Data Referensi</div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Download daftar siswa dan jenis tagihan untuk mendapatkan ID yang dibutuhkan saat mengisi template.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportStudentList} disabled={!students.length}>
            <Users className="h-4 w-4 mr-2" />
            Export Daftar Siswa
            <Badge variant="secondary" className="ml-2 text-xs">
              {students.length} siswa
            </Badge>
          </Button>
          <Button variant="outline" onClick={exportPaymentTypeList} disabled={!paymentTypes.length}>
            <CreditCard className="h-4 w-4 mr-2" />
            Export Jenis Tagihan
            <Badge variant="secondary" className="ml-2 text-xs">
              {paymentTypes.length} jenis
            </Badge>
          </Button>
        </div>
      </Card>

      {/* ── Step 2: Download Template ── */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
          <div className="text-lg font-semibold">Download Template Excel</div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
              <p className="font-semibold">Petunjuk Pengisian Template:</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-200">
                <li>
                  <strong>Student ID</strong> — ambil dari export Daftar Siswa di Langkah 1
                </li>
                <li>
                  <strong>Payment Type ID</strong> — ambil dari export Jenis Tagihan di Langkah 1
                </li>
                <li>
                  <strong>Quantity</strong> — jumlah item (angka bulat, minimal 1)
                </li>
                <li>
                  <strong>Amount</strong> — nominal per satuan (angka, tanpa titik/koma)
                </li>
                <li>
                  <strong>Subtotal</strong> — boleh dikosongkan, otomatis = Qty × Amount
                </li>
                <li>
                  <strong>Name</strong> — nama item tagihan (mis. "SPP Bulanan")
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Button onClick={downloadTemplate} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </Card>

      {/* ── Step 3: Upload File ── */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
          <div className="text-lg font-semibold">Upload File Excel</div>
        </div>

        <div className="space-y-4">
          <div>
            <Input id="routine-file-upload" type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="bg-background" />
            <p className="text-sm text-muted-foreground mt-1">Format: .xlsx atau .xls</p>
          </div>

          {file && (
            <div className="flex items-center justify-between rounded-md border p-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={bulkUploadMutation.isPending}
                onClick={() => {
                  setFile(null);
                  setPreviewRows([]);
                  setAvailableSheets([]);
                  setSelectedSheet("");
                  const fileInput = document.getElementById("routine-file-upload") as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {availableSheets.length > 1 && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-blue-600" />
                <div className="font-semibold text-blue-900 dark:text-blue-100">Pilih Sheet Excel</div>
                <Badge variant="secondary" className="text-xs">
                  {availableSheets.length} sheet tersedia
                </Badge>
              </div>
              <Select value={selectedSheet} onValueChange={handleSheetChange}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Pilih sheet..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSheets.map((sheet) => (
                    <SelectItem key={sheet} value={sheet}>
                      <div className="flex items-center gap-2">
                        <Layers className="h-3 w-3" />
                        {sheet}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          )}

          {availableSheets.length === 1 && selectedSheet && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span>
                Sheet: <strong>{selectedSheet}</strong>
              </span>
            </div>
          )}

          {/* ── Preview table ── */}
          {previewRows.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="h-4 w-4" />
                  Preview Data dari Sheet:
                  <Badge variant="secondary" className="ml-1">
                    {selectedSheet}
                  </Badge>
                  <span className="text-muted-foreground">({previewRows.length} baris)</span>
                </div>
                <div className="flex gap-2">
                  {validCount > 0 && <Badge className="bg-green-600 text-white text-xs">{validCount} valid</Badge>}
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {errorCount} error
                    </Badge>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="text-left p-2 font-medium">#</th>
                      <th className="text-left p-2 font-medium">Siswa</th>
                      <th className="text-left p-2 font-medium">Jenis Tagihan</th>
                      <th className="text-left p-2 font-medium">Nama</th>
                      <th className="text-right p-2 font-medium">Qty</th>
                      <th className="text-right p-2 font-medium">Amount</th>
                      <th className="text-right p-2 font-medium">Subtotal</th>
                      <th className="text-left p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.rowNum} className={`border-b ${row._errors.length > 0 ? "bg-red-50 dark:bg-red-950/20" : "hover:bg-muted/30"}`}>
                        <td className="p-2 text-muted-foreground">{row.rowNum}</td>
                        <td className="p-2">
                          <div className="font-medium truncate max-w-[140px]">{row._studentName}</div>
                          <div className="text-muted-foreground font-mono truncate max-w-[140px]">{row.studentId.slice(0, 8)}…</div>
                        </td>
                        <td className="p-2 truncate max-w-[140px]">{row._paymentTypeName}</td>
                        <td className="p-2 truncate max-w-[120px]">{row.name}</td>
                        <td className="p-2 text-right">{row.quantity}</td>
                        <td className="p-2 text-right tabular-nums">{formatRupiah(row.amount)}</td>
                        <td className="p-2 text-right tabular-nums font-medium">{formatRupiah(row.subtotal)}</td>
                        <td className="p-2">
                          {row._errors.length > 0 ?
                            <div className="text-red-600 text-xs space-y-0.5">
                              {row._errors.map((e, i) => (
                                <div key={i}>⚠ {e}</div>
                              ))}
                            </div>
                          : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errorCount > 0 && <div className="px-4 py-2 bg-red-50 dark:bg-red-950/20 border-t text-xs text-red-700 dark:text-red-300">⚠ Baris dengan error akan dilewati saat upload. Perbaiki file Excel lalu upload ulang.</div>}
            </div>
          )}

          <Button onClick={handleUpload} disabled={validCount === 0 || bulkUploadMutation.isPending}>
            <Upload className="h-4 w-4 mr-2" />
            {bulkUploadMutation.isPending ? "Mengupload..." : validCount > 0 ? `Upload ${validCount} Item Tagihan Rutin` : "Pilih file terlebih dahulu"}
          </Button>
        </div>
      </Card>

      {/* ── Reference Table ── */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-500" />
            <div className="text-lg font-bold">Jenis Tagihan</div>
            <Badge variant="secondary">{paymentTypes.length} jenis</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Copy ID → paste ke kolom Payment Type ID di template</p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <Table>
            <TableCaption>Jenis tagihan untuk branch {majorName}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>SKU Type</TableHead>
                <TableHead>Bulanan?</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Copy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentTypes.map((pt) => (
                <TableRow key={pt.id}>
                  <TableCell className="font-medium">{pt.name}</TableCell>
                  <TableCell className="tabular-nums">{IDR.format(pt.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {pt.skuType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {pt.isMonthly ?
                      <Badge className="bg-blue-600 text-white text-xs">Bulanan</Badge>
                    : <Badge variant="secondary" className="text-xs">
                        Sekali
                      </Badge>
                    }
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{pt.id}</TableCell>
                  <TableCell>
                    <CopyButton variant="secondary" content={pt.id} onCopy={() => toast.success(`ID ${pt.name} berhasil dicopy`)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ─── Auth Wrapper ─────────────────────────────────────────────────────────────
export default function UploadRoutinePage() {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;
  const { data: userData, isLoading: isLoadingUserData } = useGetUserByIdBetterAuth(userId as string);
  const userRole = userData?.role?.name;

  if (isPending || isLoadingUserData) return <Loading />;

  if (userRole !== "Admin" && userRole !== "Bendahara") {
    unauthorized();
    return null;
  }

  return <UploadRoutine majorId={userData?.major?.id ?? ""} majorName={userData?.major?.name} />;
}
