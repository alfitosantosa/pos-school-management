"use client";

import { Document, Page, pdf, StyleSheet, Text, View } from "@react-pdf/renderer";
import React from "react";

export type ClassRecapPDFRow = {
  no: number;
  name: string;
  months: number[];
  total: number;
};

export type ClassRecapPDFData = {
  className: string;
  academicYear: string;
  majorName?: string | null;
  monthLabels: string[];
  rows: ClassRecapPDFRow[];
  monthTotals: number[];
  total: number;
};

const INSTITUTION = {
  yayasan: `YAYASAN PENDIDIKAN ${process.env.NEXT_PUBLIC_CLIENT_NAME?.toUpperCase() ?? "RAHMANIYAH"}`,
  school: "Sekolah Menengah Pertama Islam Terpadu (SMPIT)",
  name: "RAHMANIYAH",
  address: "Jl. Koster Ciledug RT.01/01 No.25 Pabuaran Cibinong Bogor",
  phone: "Telp. (021) 879050421",
};

const fmt = (value: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);

const S = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    fontSize: 7,
    fontFamily: "Helvetica",
  },
  header: {
    alignItems: "center",
    marginBottom: 6,
  },
  yayasan: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  school: {
    fontSize: 8,
    marginBottom: 1,
  },
  schoolName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  address: {
    fontSize: 6.5,
    marginBottom: 1,
  },
  phone: {
    fontSize: 6.5,
  },
  rule: {
    borderTopWidth: 1,
    borderTopColor: "#111827",
    marginTop: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 7.5,
    textAlign: "center",
    marginBottom: 1,
  },
  table: {
    marginTop: 6,
    borderTopWidth: 0.7,
    borderLeftWidth: 0.7,
    borderColor: "#374151",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderBottomWidth: 0.7,
    borderColor: "#374151",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#9ca3af",
  },
  rowEven: {
    backgroundColor: "#f9fafb",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderTopWidth: 0.7,
    borderBottomWidth: 0.7,
    borderColor: "#374151",
  },
  cell: {
    borderRightWidth: 0.5,
    borderColor: "#9ca3af",
    paddingVertical: 1.2,
    paddingHorizontal: 2,
    fontSize: 6.2,
    lineHeight: 1.15,
  },
  th: {
    fontSize: 6,
    fontWeight: "bold",
    textAlign: "center",
    borderRightWidth: 0.5,
    borderColor: "#374151",
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
  colNo: { width: 16, textAlign: "center" },
  colName: { width: 122 },
  colMonth: { width: 48, textAlign: "right" },
  colTotal: { width: 62, textAlign: "right", fontWeight: "bold" },
  footer: {
    position: "absolute",
    bottom: 10,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6,
    color: "#6b7280",
  },
});

function ClassRecapDocument({ data }: { data: ClassRecapPDFData }) {
  const { monthLabels, rows, monthTotals, total } = data;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={S.page} wrap>
        <View style={S.header} fixed>
          <Text style={S.yayasan}>{INSTITUTION.yayasan}</Text>
          <Text style={S.school}>{data.majorName || INSTITUTION.school}</Text>
          <Text style={S.schoolName}>{INSTITUTION.name}</Text>
          <Text style={S.address}>{INSTITUTION.address}</Text>
          <Text style={S.phone}>{INSTITUTION.phone}</Text>
        </View>

        <View style={S.rule} fixed />

        <Text style={S.title} fixed>
          Rekapitulasi Pembayaran perkelas
        </Text>
        <Text style={S.subtitle} fixed>
          Kelas {data.className}
        </Text>
        <Text style={S.subtitle} fixed>
          Tahun Ajaran {data.academicYear.replace("/", "-")}
        </Text>

        <View style={S.table}>
          <View style={S.tableHead} fixed>
            <Text style={[S.th, S.colNo]}>No</Text>
            <Text style={[S.th, S.colName]}>Nama Siswa</Text>
            {monthLabels.map((label) => (
              <Text key={label} style={[S.th, S.colMonth]}>
                {label}
              </Text>
            ))}
            <Text style={[S.th, S.colTotal]}>Total</Text>
          </View>

          {rows.map((row, index) => (
            <View key={row.no} style={[S.row, index % 2 === 0 ? S.rowEven : {}]} wrap={false}>
              <Text style={[S.cell, S.colNo]}>{row.no}</Text>
              <Text style={[S.cell, S.colName]}>{row.name}</Text>
              {row.months.map((value, monthIndex) => (
                <Text key={`${row.no}-${monthIndex}`} style={[S.cell, S.colMonth]}>
                  {fmt(value)}
                </Text>
              ))}
              <Text style={[S.cell, S.colTotal]}>{fmt(row.total)}</Text>
            </View>
          ))}

          <View style={S.totalRow} wrap={false}>
            <Text style={[S.cell, S.colNo]} />
            <Text style={[S.cell, S.colName]}>Total</Text>
            {monthTotals.map((value, index) => (
              <Text key={`total-${index}`} style={[S.cell, S.colMonth, { fontWeight: "bold" }]}>
                {fmt(value)}
              </Text>
            ))}
            <Text style={[S.cell, S.colTotal]}>{fmt(total)}</Text>
          </View>
        </View>

        <View style={S.footer} fixed>
          <Text>Rekap Pembayaran {data.className}</Text>
          <Text render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function createPDFClassRecap(data: ClassRecapPDFData) {
  const blob = await pdf(<ClassRecapDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = data.className.replace(/[^\w-]+/g, "-");
  const safeYear = data.academicYear.replace(/[^\w-]+/g, "-");
  link.href = url;
  link.download = `Rekap-Pembayaran-${safeName}-${safeYear}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
