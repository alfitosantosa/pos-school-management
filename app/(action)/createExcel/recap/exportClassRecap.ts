import { toast } from "sonner";
import * as XLSX from "xlsx";

export type ClassRecapExcelRow = {
  no: number;
  name: string;
  months: number[];
  total: number;
};

export type ClassRecapExcelData = {
  className: string;
  academicYear: string;
  majorName?: string | null;
  monthLabels: string[];
  rows: ClassRecapExcelRow[];
  monthTotals: number[];
  total: number;
};

const fmt = (value: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value || 0);

export async function exportClassRecapToExcel(data: ClassRecapExcelData) {
  try {
    const now = new Date();
    const exportDate = now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    const fileDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const header = [
      ["Rekap Pembayaran per Kelas"],
      [`Kelas: ${data.className}`],
      [`Tahun Ajaran: ${data.academicYear}`],
      ...(data.majorName ? [[`Branch: ${data.majorName}`]] : []),
      [`Tanggal Export: ${exportDate}`],
      [],
      ["No", "Nama", ...data.monthLabels, "Total"],
    ];

    const body = data.rows.map((row) => [row.no, row.name, ...row.months, row.total]);

    const footer = [["", "Total", ...data.monthTotals, data.total]];

    const ws = XLSX.utils.aoa_to_sheet([...header, ...body, ...footer]);
    ws["!cols"] = [{ wch: 5 }, { wch: 28 }, ...data.monthLabels.map(() => ({ wch: 12 })), { wch: 14 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: data.monthLabels.length + 2 } }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Pembayaran");

    const safeName = data.className.replace(/[^\w-]+/g, "-");
    XLSX.writeFile(wb, `Rekap-Pembayaran-${safeName}-${fileDate}.xlsx`);
    toast.success("Rekap berhasil diexport ke Excel!");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    toast.error("Gagal mengexport rekap: " + errorMessage);
  }
}
