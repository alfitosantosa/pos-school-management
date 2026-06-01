"use client";

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

export type PaymentItem = {
  id: string;
  name: string;
  amount: number;
  subtotal: number;
  quantity: number;
  month: string;
  year: string;
  skuType: string;
  isPaid: boolean;
};

export type KwitansiPDFData = {
  id: string;
  receiptNumber: string;
  amount: number;
  status: string;
  paymentDate: string;
  month: string;
  bankRef?: string;
  notes?: string | null;

  student?: {
    name: string;
    nisn?: string;
    address?: string;
    parentPhone?: string;
    email?: string;
    classId?: string;
    class: {
      name: string;
    };
  };

  major?: {
    name: string;
    code?: string;
    phone?: string;
    address?: string;
    unitName?: string;
    fax?: string;
  };

  accountBank?: {
    accountName: string;
    accountBank: string;
    accountNumber: string;
  };

  createdBy?: {
    name: string;
  };

  paymentItems?: PaymentItem[];
};

// ── helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
  }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const terbilang = (n: number): string => {
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  if (n < 12) return satuan[n];
  if (n < 20) return satuan[n - 10] + " belas";
  if (n < 100) return satuan[Math.floor(n / 10)] + " puluh" + (n % 10 !== 0 ? " " + satuan[n % 10] : "");
  if (n < 200) return "seratus" + (n % 100 !== 0 ? " " + terbilang(n % 100) : "");
  if (n < 1000) return satuan[Math.floor(n / 100)] + " ratus" + (n % 100 !== 0 ? " " + terbilang(n % 100) : "");
  if (n < 2000) return "seribu" + (n % 1000 !== 0 ? " " + terbilang(n % 1000) : "");
  if (n < 1_000_000) return terbilang(Math.floor(n / 1000)) + " ribu" + (n % 1000 !== 0 ? " " + terbilang(n % 1000) : "");
  if (n < 1_000_000_000) return terbilang(Math.floor(n / 1_000_000)) + " juta" + (n % 1_000_000 !== 0 ? " " + terbilang(n % 1_000_000) : "");
  return terbilang(Math.floor(n / 1_000_000_000)) + " miliar" + (n % 1_000_000_000 !== 0 ? " " + terbilang(n % 1_000_000_000) : "");
};

// A6 paper: 148mm x 105mm  (landscape)  → 419 x 298 pt
const PAGE_W = 419;
const PAGE_H = 298;

const C = {
  dark: "#1a1a2e",
  mid: "#0f3460",
  light: "#e8eaf6",
  border: "#bec5e0",
  muted: "#666",
  white: "#ffffff",
};

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: "#222",
    backgroundColor: "#fff",
    width: PAGE_W,
    height: PAGE_H,
  },

  // header
  header: {
    backgroundColor: C.dark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  headerInstitution: {
    color: C.white,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  headerUnit: {
    color: "#aab4d4",
    fontSize: 6.5,
    textAlign: "center",
    marginTop: 1,
  },
  headerTitle: {
    color: C.white,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 1.5,
    borderTopWidth: 0.5,
    borderTopColor: "#aab4d4",
    paddingTop: 4,
  },

  // meta strip
  metaRow: {
    flexDirection: "row",
    backgroundColor: C.light,
    paddingHorizontal: 14,
    paddingVertical: 5,
    justifyContent: "space-between",
  },
  metaBlock: { width: "48%" },
  metaLine: { flexDirection: "row", marginBottom: 1.5 },
  metaLabel: { width: 60, color: C.muted, fontSize: 6.5 },
  metaColon: { width: 8, color: C.muted, fontSize: 6.5 },
  metaValue: { flex: 1, color: C.dark, fontFamily: "Helvetica-Bold", fontSize: 6.5 },

  // table
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.mid,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginHorizontal: 10,
    marginTop: 8,
  },
  th: { color: C.white, fontSize: 6, fontFamily: "Helvetica-Bold" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginHorizontal: 10,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginHorizontal: 10,
    backgroundColor: "#f7f8fc",
  },
  td: { fontSize: 6.5, color: "#333" },
  col0: { width: "4%" },
  col1: { width: "38%" },
  col2: { width: "20%", textAlign: "center" },
  col3: { width: "20%", textAlign: "right" },
  col4: { width: "18%", textAlign: "right" },

  // totals
  totalWrap: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    marginTop: 5,
  },
  totalInner: { width: 180 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  totalLbl: { fontSize: 6.5, color: C.muted },
  totalVal: { fontSize: 6.5, color: "#333" },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.dark,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 2,
    marginTop: 3,
  },
  grandLbl: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.white },
  grandVal: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.white },

  // terbilang
  terbilangWrap: {
    marginHorizontal: 14,
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 3,
  },
  terbilangText: {
    fontSize: 6,
    color: C.muted,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
  },

  // footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerLeft: { flex: 1 },
  footerRight: { alignItems: "center", width: 90 },
  footerLabel: { fontSize: 6, color: C.muted, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 2 },
  footerValue: { fontSize: 6.5, color: "#444", lineHeight: 1.6 },
  sigLabel: { fontSize: 6.5, color: C.muted, marginBottom: 24, textAlign: "center" },
  sigLine: { borderBottomWidth: 0.5, borderBottomColor: "#999", width: 80, marginBottom: 3 },
  sigName: { fontSize: 6.5, fontFamily: "Helvetica-Bold", textAlign: "center" },

  // operator
  operatorBar: {
    backgroundColor: C.light,
    paddingHorizontal: 14,
    paddingVertical: 3,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  operatorText: { fontSize: 5.5, color: C.muted },
});

// ── Document Component ────────────────────────────────────────────────────────

function KwitansiDocument({ data }: { data: KwitansiPDFData }) {
  const items = data.paymentItems ?? [];
  const total = Number(data.amount);

  const institution = {
    name: "YAYASAN PENDIDIKAN RAHMANIYAH",
    address: data.major?.address ?? "Jl. Lapangan Member, Blok C No.11 Sukmajaya - Depok 16412",
    phone: data.major?.phone ?? "(021)77833598",
    fax: "(021)77835420",
  };

  const major = {
    name: data.major?.name ?? institution.name,
    unitName: data.major?.unitName ?? data.major?.name ?? "",
    address: data.major?.address ?? institution.address,
    phone: data.major?.phone ?? institution.phone,
    fax: data.major?.fax ?? institution.fax,
  };

  return (
    <Document>
      <Page size={[PAGE_W, PAGE_H]} style={S.page}>
        {/* ── Header ── */}
        <View style={S.header}>
          <Text style={S.headerInstitution}>{major.name}</Text>
          {major.unitName ?
            <Text style={S.headerUnit}>{major.unitName}</Text>
          : null}
          <Text style={S.headerTitle}>KWITANSI PEMBAYARAN</Text>
        </View>

        {/* ── Meta Strip ── */}
        <View style={S.metaRow}>
          <View style={S.metaBlock}>
            <View style={S.metaLine}>
              <Text style={S.metaLabel}>NIS</Text>
              <Text style={S.metaColon}>:</Text>
              <Text style={S.metaValue}>{data.student?.nisn ?? "-"}</Text>
            </View>
            <View style={S.metaLine}>
              <Text style={S.metaLabel}>Nama Siswa</Text>
              <Text style={S.metaColon}>:</Text>
              <Text style={S.metaValue}>{data.student?.name ?? "-"}</Text>
            </View>
            <View style={S.metaLine}>
              <Text style={S.metaLabel}>Kelas</Text>
              <Text style={S.metaColon}>:</Text>
              <Text style={S.metaValue}>{data.student?.class?.name ?? "-"}</Text>
            </View>
          </View>
          <View style={S.metaBlock}>
            <View style={S.metaLine}>
              <Text style={S.metaLabel}>No. Transaksi</Text>
              <Text style={S.metaColon}>:</Text>
              <Text style={S.metaValue}>{data.receiptNumber}</Text>
            </View>
            <View style={S.metaLine}>
              <Text style={S.metaLabel}>Status</Text>
              <Text style={S.metaColon}>:</Text>
              <Text style={S.metaValue}>{data.status.toUpperCase()}</Text>
            </View>
            <View style={S.metaLine}>
              <Text style={S.metaLabel}>Bulan</Text>
              <Text style={S.metaColon}>:</Text>
              <Text style={S.metaValue}>{data.month}</Text>
            </View>
          </View>
        </View>

        {/* ── Table ── */}
        <View style={S.tableHead}>
          <Text style={[S.th, S.col0]}>#</Text>
          <Text style={[S.th, S.col1]}>Account</Text>
          <Text style={[S.th, S.col2]}>Bulan / Tahun</Text>
          <Text style={[S.th, S.col3]}>Nominal</Text>
          <Text style={[S.th, S.col4]}>Keterangan</Text>
        </View>

        {items.map((item, i) => (
          <View key={item.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
            <Text style={[S.td, S.col0]}>{i + 1}</Text>
            <Text style={[S.td, S.col1]}>{item.name}</Text>
            <Text style={[S.td, S.col2]}>{`${item.month} / ${item.year}`}</Text>
            <Text style={[S.td, S.col3]}>{fmt(item.subtotal)}</Text>
            <Text style={[S.td, S.col4]}>{item.skuType}</Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={S.totalWrap}>
          <View style={S.totalInner}>
            {data.bankRef && (
              <View style={S.totalLine}>
                <Text style={S.totalLbl}>Cara Bayar</Text>
                <Text style={S.totalVal}>{data.bankRef}</Text>
              </View>
            )}
            <View style={S.grandRow}>
              <Text style={S.grandLbl}>Rp</Text>
              <Text style={S.grandVal}>{fmt(total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Terbilang ── */}
        <View style={S.terbilangWrap}>
          <Text style={S.terbilangText}># {terbilang(total)} rupiah #</Text>
        </View>

        {/* ── Footer ── */}
        <View style={S.footer}>
          <View style={S.footerLeft}>
            <Text style={S.footerLabel}>Informasi Bank</Text>
            <Text style={S.footerValue}>{`Bank    : ${data.accountBank?.accountBank ?? "-"}\nNo. Rek : ${data.accountBank?.accountNumber ?? "-"}\nA/N     : ${data.accountBank?.accountName ?? "-"}`}</Text>
          </View>

          <View style={{ alignItems: "center", width: 90, marginRight: 12 }}>
            <Text style={S.sigLabel}>Pemberi,</Text>
            <View style={S.sigLine} />
            <Text style={S.sigName}>{data.student?.name?.split(" ")[0] ?? ""}</Text>
          </View>

          <View style={S.footerRight}>
            <Text style={S.sigLabel}>Penerima,</Text>
            <View style={S.sigLine} />
            <Text style={S.sigName}>{data.createdBy?.name ?? ""}</Text>
          </View>
        </View>

        {/* ── Operator bar ── */}
        <View style={S.operatorBar}>
          <Text style={S.operatorText}>
            Operator: {data.createdBy?.name ?? "-"}
            {"  |  "}
            {institution.address ?? ""}
            {"  |  "}
            {institution.phone ? `Telp. ${institution.phone}` : ""}
            {institution.fax ? `  Fax. ${institution.fax}` : ""}
          </Text>
          <Text style={S.operatorText}>{fmtDate(data.paymentDate)}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ── Export function (dipanggil dari UI) ──────────────────────────────────────

export async function createPDFKwitansi(data: KwitansiPDFData) {
  const blob = await pdf(<KwitansiDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Kwitansi-${data.receiptNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Contoh mapping dari raw JSON API ke KwitansiPDFData ──────────────────────
//
// import { createPDFKwitansi } from "./KwitansiPDF";
//
// const raw = { ...data dari API... };
//
// const kwitansiData: KwitansiPDFData = {
//   id:            raw.id,
//   receiptNumber: raw.receiptNumber,
//   amount:        Number(raw.amount),
//   status:        raw.status,
//   paymentDate:   raw.paymentDate,
//   month:         raw.month,
//   bankRef:       raw.bankRef,
//   notes:         raw.notes,
//   student:       raw.student,
//   major:         raw.major,
//   accountBank:   raw.accountBank,
//   createdBy:     raw.createdBy,
//   paymentItems:  raw.paymentItems,
//   institution: {
//     name:     "YAYASAN PENDIDIKAN RAHMANIYAH",
//     unitName: raw.major?.name,
//     address:  "Jl. Lapangan Member, Blok C No.11 Sukmajaya - Depok 16412",
//     phone:    "(021)77833598",
//     fax:      "(021)77835420",
//   },
// };
//
// await createPDFKwitansi(kwitansiData);
