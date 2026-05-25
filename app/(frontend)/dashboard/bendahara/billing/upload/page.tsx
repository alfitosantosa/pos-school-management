"use client";

import { useGetMajors } from "@/app/(hooks)/hooks/Majors/useMajors";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/shadcn-io/copy-button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, X, Upload, Download, AlertCircle } from "lucide-react";
import { useState } from "react";
import { BulkUploadPaymentItems } from "@/app/(hooks)/hooks/Payments/usePaymentItems";
import { useSession } from "@/lib/auth-client";
import { unauthorized } from "next/navigation";
import Loading from "@/components/loading";
import { useGetUserByIdBetterAuth } from "@/app/(hooks)/hooks/Users/useUsersByIdBetterAuth";
import { useGetStudents } from "@/app/(hooks)/hooks/Users/useStudents"; // adjust path as needed
import { useGetAccountBank } from "@/app/(hooks)/hooks/AccountBank/useAccountBank"; // adjust path as needed

export type typeData = {
  id: string;
  year?: string;
  name?: string;
  accountNumber?: string;
  bankName?: string;
};

function UploadBilling({ bendaharaId }: { bendaharaId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const { data: majorsData = [] } = useGetMajors();
  const { data: studentsData = [] } = useGetStudents();
  const { data: accountBanksData = [] } = useGetAccountBank();

  const bulkUploadMutation = BulkUploadPaymentItems();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const excelFiles = newFiles.filter((file) => file.name.endsWith(".xlsx") || file.name.endsWith(".xls"));

      if (excelFiles.length !== newFiles.length) {
        toast.error("Hanya file Excel (.xlsx atau .xls) yang diperbolehkan");
      }

      setFiles(excelFiles);

      if (excelFiles.length > 0) {
        try {
          if (typeof window === "undefined") {
            throw new Error("This function can only be called on the client side");
          }
          const readXlsxFile = (await import("read-excel-file")).default;
          const rows = await readXlsxFile(excelFiles[0]);
          const preview = rows.slice(1, 6).map((row) => ({
            studentId: row[0]?.toString() || "",
            amount: row[1]?.toString() || "",
            dueDate: row[2]?.toString() || "",
            status: row[3]?.toString() || "",
            receiptNumber: row[4]?.toString() || "",
          }));
          setPreviewData(preview);
        } catch (error) {
          console.error("Preview error:", error);
        }
      } else {
        setPreviewData([]);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    if (files.length === 1) {
      setPreviewData([]);
    }
  };

  const parseDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "number") {
      const date = new Date((value - 25569) * 86400 * 1000);
      return isNaN(date.getTime()) ? null : date;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.includes("/")) {
        const parts = trimmed.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const date = new Date(year, month, day);
            return isNaN(date.getTime()) ? null : date;
          }
        }
      }
      if (trimmed.includes("-") && !trimmed.startsWith("20")) {
        const parts = trimmed.split("-");
        if (parts.length === 3 && parts[2].length === 4) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const date = new Date(year, month, day);
            return isNaN(date.getTime()) ? null : date;
          }
        }
      }
      const isoDate = new Date(trimmed);
      if (!isNaN(isoDate.getTime())) return isoDate;
    }
    return null;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    setIsUploading(true);

    try {
      if (typeof window === "undefined") {
        throw new Error("This function can only be called on the client side");
      }
      const readXlsxFile = (await import("read-excel-file")).default;

      let allPayments: any[] = [];

      for (const file of files) {
        const rows = await readXlsxFile(file);

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row[0]) continue;

          const paymentData = {
            studentId: row[0]?.toString() || "",
            amount: row[1] ? parseFloat(row[1].toString()) : 0,
            dueDate: parseDate(row[2]),
            status: row[3]?.toString() || "pending",
            notes: row[4]?.toString() || null,
            paymentDate: parseDate(row[5]) || new Date(),
            receiptNumber: row[6]?.toString() || "",
            accountBankId: row[7]?.toString() || "",
            bankRef: row[8]?.toString() || null,
            majorId: row[9]?.toString() || "",
            month: row[10]?.toString() || "",
            bendaharaId: bendaharaId,
          };

          if (paymentData.studentId && paymentData.receiptNumber) {
            allPayments.push(paymentData);
          }
        }
      }

      if (allPayments.length === 0) {
        toast.error("Tidak ada data valid yang ditemukan dalam file");
        setIsUploading(false);
        return;
      }

      await bulkUploadMutation.mutateAsync(allPayments);

      toast.success(`Berhasil upload ${allPayments.length} data billing`);
      setFiles([]);
      setPreviewData([]);

      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.response?.data?.error || "Gagal upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      if (typeof window === "undefined") {
        throw new Error("This function can only be called on the client side");
      }
      const XLSX = await import("xlsx");

      const wsData = [
        ["Student ID*", "Amount*", "Due Date", "Status", "Notes", "Payment Date*", "Receipt Number*", "Account Bank ID*", "Bank Ref", "Major ID*", "Month*"],
        [
          studentsData[0]?.id || "student-id-here",
          150000,
          "31/07/2024",
          "pending",
          "Catatan opsional",
          "15/07/2024",
          "RCP-001",
          accountBanksData[0]?.id || "account-bank-id-here",
          "REF-12345",
          majorsData[0]?.id || "major-id-here",
          "Juli 2024",
        ],
        [studentsData[1]?.id || "student-id-here", 150000, "31/08/2024", "pending", "", "15/08/2024", "RCP-002", accountBanksData[0]?.id || "account-bank-id-here", "", majorsData[0]?.id || "major-id-here", "Agustus 2024"],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!cols"] = [
        { wch: 30 }, // Student ID
        { wch: 15 }, // Amount
        { wch: 12 }, // Due Date
        { wch: 10 }, // Status
        { wch: 25 }, // Notes
        { wch: 15 }, // Payment Date
        { wch: 15 }, // Receipt Number
        { wch: 30 }, // Account Bank ID
        { wch: 15 }, // Bank Ref
        { wch: 30 }, // Major ID
        { wch: 15 }, // Month
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Billing Template");
      XLSX.writeFile(wb, "billing-upload-template.xlsx");

      toast.success("Template Excel berhasil didownload");
    } catch (error) {
      console.error("Error generating template:", error);
      toast.error("Gagal membuat template");
    }
  };

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto my-8 p-6">
      <div className="font-bold text-3xl mb-3">Upload Billing</div>

      <div className="mb-6">
        <Card className="p-6">
          <div className="text-xl font-semibold mb-4">Upload File Billing</div>

          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Petunjuk Upload Billing:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Download template terlebih dahulu</li>
                    <li>Isi data sesuai kolom yang tersedia</li>
                    <li>Field wajib: Student ID, Amount, Payment Date, Receipt Number, Account Bank ID, Major ID, Month</li>
                    <li>Format tanggal: DD/MM/YYYY (contoh: 31/07/2024)</li>
                    <li>Status: pending, paid, atau cancelled</li>
                    <li>Amount: angka tanpa tanda titik atau koma (contoh: 150000)</li>
                    <li>Receipt Number harus unik untuk setiap baris</li>
                    <li>Bendahara ID akan otomatis diisi dari sesi login</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <Input className="bg-background" id="file-upload" multiple onChange={handleFileChange} type="file" accept=".xlsx,.xls" />
              <p className="text-sm text-muted-foreground mt-2">Format: .xlsx atau .xls</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">File yang dipilih:</p>
                {files.map((file, index) => (
                  <div className="flex items-center justify-between rounded-md border p-2" key={index}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-muted-foreground text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <Button className="h-6 w-6" onClick={() => removeFile(index)} size="icon" type="button" variant="ghost" disabled={isUploading}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {previewData.length > 0 && (
              <div className="border rounded-lg p-4">
                <p className="text-sm font-semibold mb-2">Preview Data (5 baris pertama):</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Student ID</th>
                        <th className="text-left p-2">Amount</th>
                        <th className="text-left p-2">Due Date</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Receipt Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2 font-mono text-xs">{row.studentId}</td>
                          <td className="p-2">{row.amount}</td>
                          <td className="p-2">{row.dueDate}</td>
                          <td className="p-2">{row.status}</td>
                          <td className="p-2">{row.receiptNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>

              <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : `Upload ${files.length > 0 ? `(${files.length} file)` : ""}`}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Reference Tables */}
      <div className="grid gap-6">
        {/* Students */}
        <Card className="p-4">
          <div className="text-xl font-bold mb-2">Data Siswa</div>
          <Table>
            <TableCaption>Semua Data Siswa - Copy ID untuk digunakan di Excel</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsData.map((data: typeData) => (
                <TableRow key={data.id}>
                  <TableCell>{data.name}</TableCell>
                  <TableCell className="font-mono text-xs">{data.id}</TableCell>
                  <TableCell>
                    <CopyButton variant="secondary" onClick={() => toast.success("ID berhasil dicopy")} content={data.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Account Banks */}
        <Card className="p-4">
          <div className="text-xl font-bold mb-2">Data Rekening Bank</div>
          <Table>
            <TableCaption>Semua Data Rekening Bank - Copy ID untuk digunakan di Excel</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Bank</TableHead>
                <TableHead>Nomor Rekening</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountBanksData.map((data: any) => (
                <TableRow key={data.id}>
                  <TableCell>{data.bankName}</TableCell>
                  <TableCell className="font-mono text-xs">{data.accountNumber}</TableCell>
                  <TableCell className="font-mono text-xs">{data.id}</TableCell>
                  <TableCell>
                    <CopyButton variant="secondary" onClick={() => toast.success("ID berhasil dicopy")} content={data.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Majors */}
        <Card className="p-4">
          <div className="text-xl font-bold mb-2">Data Jurusan</div>
          <Table>
            <TableCaption>Semua Data Jurusan - Copy ID untuk digunakan di Excel</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {majorsData.map((data: typeData) => (
                <TableRow key={data.id}>
                  <TableCell>{data.name}</TableCell>
                  <TableCell className="font-mono text-xs">{data.id}</TableCell>
                  <TableCell>
                    <CopyButton variant="secondary" onClick={() => toast.success("ID berhasil dicopy")} content={data.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

export default function UploadBillingPage() {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;

  const { data: userData, isLoading: isLoadingUserData } = useGetUserByIdBetterAuth(userId as string);
  const userRole = userData?.role?.name;
  const bendaharaId = userData?.id as string;

  if (isPending || isLoadingUserData) {
    return <Loading />;
  }

  if (userRole !== "Admin" && userRole !== "Bendahara") {
    unauthorized();
    return null;
  }

  return <UploadBilling bendaharaId={bendaharaId} />;
}
