"use client";

import { Document, Page, Text, View, StyleSheet, pdf, Line, Svg } from "@react-pdf/renderer";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

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
    class: { name: string };
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

  createdBy?: { name: string };
  paymentItems?: PaymentItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (v: number) => new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const terbilang = (n: number): string => {
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  if (n < 12) return satuan[n];
  if (n < 20) return satuan[n - 10] + " belas";
  if (n < 100) return satuan[Math.floor(n / 10)] + " puluh" + (n % 10 ? " " + satuan[n % 10] : "");
  if (n < 200) return "seratus" + (n % 100 ? " " + terbilang(n % 100) : "");
  if (n < 1_000) return satuan[Math.floor(n / 100)] + " ratus" + (n % 100 ? " " + terbilang(n % 100) : "");
  if (n < 2_000) return "seribu" + (n % 1_000 ? " " + terbilang(n % 1_000) : "");
  if (n < 1_000_000) return terbilang(Math.floor(n / 1_000)) + " ribu" + (n % 1_000 ? " " + terbilang(n % 1_000) : "");
  if (n < 1_000_000_000) return terbilang(Math.floor(n / 1_000_000)) + " juta" + (n % 1_000_000 ? " " + terbilang(n % 1_000_000) : "");
  return terbilang(Math.floor(n / 1_000_000_000)) + " miliar" + (n % 1_000_000_000 ? " " + terbilang(n % 1_000_000_000) : "");
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

// A6 landscape: 148mm × 105mm → pt
const PAGE_W = 419;
const PAGE_H = 298;

const PAD_H = 14; // horizontal page padding
const PAD_V = 0; // vertical page padding (header/footer handle their own)

const C = {
  ink: "#111827", // near-black for main text
  sub: "#374151", // secondary text
  muted: "#6B7280", // tertiary / labels
  hairline: "#D1D5DB", // borders
  stripe: "#F9FAFB", // alt row
  accent: "#1E3A5F", // header bg (deep navy)
  accentLt: "#2D5288", // header sub-row
  tag: "#EFF6FF", // status badge bg
  tagText: "#1E40AF", // status badge text
  white: "#FFFFFF",
  paid: "#065F46", // green for LUNAS
  paidBg: "#ECFDF5",
  pending: "#92400E",
  pendingBg: "#FFFBEB",
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // ── Page ──────────────────────────────────────────────────────────────────
  page: {
    fontFamily: "Helvetica",
    fontSize: 6,
    color: C.ink,
    backgroundColor: C.white,
    width: PAGE_W,
    height: PAGE_H,
    flexDirection: "column",
  },

  // ── HEADER (sticky top) ───────────────────────────────────────────────────
  header: {
    backgroundColor: C.accent,
    paddingHorizontal: PAD_H,
    paddingTop: 8,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 6,
  },
  headerLeft: { flex: 1 },
  headerInstitution: {
    color: C.white,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  headerUnit: {
    color: "#93C5FD",
    fontSize: 6,
    marginTop: 1.5,
    letterSpacing: 0.2,
  },
  headerAddress: {
    color: "#CBD5E1",
    fontSize: 5,
    marginTop: 2,
    lineHeight: 1.5,
  },
  headerRight: {
    alignItems: "flex-end",
    minWidth: 110,
  },
  headerDocLabel: {
    color: "#93C5FD",
    fontSize: 5,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  headerDocTitle: {
    color: C.white,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  headerDocNo: {
    color: "#BFDBFE",
    fontSize: 5.5,
    marginTop: 2,
  },

  // sub-row inside header (meta info)
  headerMeta: {
    backgroundColor: C.accentLt,
    flexDirection: "row",
    paddingHorizontal: PAD_H,
    paddingVertical: 4,
    justifyContent: "space-between",
    marginTop: 0,
  },
  headerMetaCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  headerMetaLabel: { color: "#93C5FD", fontSize: 5.5 },
  headerMetaValue: { color: C.white, fontSize: 5.5, fontFamily: "Helvetica-Bold" },

  // status badge
  badge: {
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
  },
  badgePaid: { backgroundColor: C.paid },
  badgePending: { backgroundColor: C.pending },
  badgeText: { fontSize: 5, fontFamily: "Helvetica-Bold", color: C.white },

  // ── BODY ──────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    paddingHorizontal: PAD_H,
    paddingTop: 6,
  },

  // Student info bar
  infoRow: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: C.hairline,
    borderRadius: 2,
    marginBottom: 6,
    overflow: "hidden",
  },
  infoCell: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRightWidth: 0.5,
    borderRightColor: C.hairline,
  },
  infoCellLast: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 5, color: C.muted, marginBottom: 1.5, textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 6, fontFamily: "Helvetica-Bold", color: C.ink },

  // Table
  tableWrap: { flex: 1 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.ink,
    paddingVertical: 3.5,
    paddingHorizontal: 5,
  },
  th: {
    color: C.white,
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
    paddingVertical: 3,
    paddingHorizontal: 5,
    backgroundColor: C.white,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
    paddingVertical: 3,
    paddingHorizontal: 5,
    backgroundColor: C.stripe,
  },
  td: { fontSize: 6, color: C.sub },
  tdBold: { fontSize: 6, color: C.ink, fontFamily: "Helvetica-Bold" },

  // columns
  cNo: { width: "5%" },
  cName: { width: "36%" },
  cPeriod: { width: "19%", textAlign: "center" },
  cType: { width: "16%", textAlign: "center" },
  cQty: { width: "8%", textAlign: "center" },
  cAmt: { width: "16%", textAlign: "right" },

  // Totals block
  totalWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    alignItems: "flex-end",
  },
  terbilangBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: C.hairline,
    borderRadius: 2,
    padding: 4,
    marginRight: 8,
  },
  terbilangLabel: { fontSize: 5, color: C.muted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  terbilangText: { fontSize: 5.5, color: C.ink, fontFamily: "Helvetica-Oblique", lineHeight: 1.5 },

  totalBox: { width: 150 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
  },
  totalLabel: { fontSize: 5.5, color: C.muted },
  totalValue: { fontSize: 5.5, color: C.sub },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.accent,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 2,
    marginTop: 3,
  },
  grandLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.white },
  grandValue: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.white },

  // ── FOOTER (sticky bottom) ────────────────────────────────────────────────
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: C.hairline,
    paddingHorizontal: PAD_H,
    paddingTop: 5,
    paddingBottom: 5,
  },
  footerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerSection: { flex: 1, marginRight: 8 },
  footerSectionLast: { alignItems: "center", width: 75 },
  footerSectionMid: { alignItems: "center", width: 75, marginRight: 8 },
  footerSectionLabel: {
    fontSize: 5,
    color: C.muted,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
    paddingBottom: 1,
  },
  footerText: { fontSize: 5.5, color: C.sub, lineHeight: 1.7 },
  sigSpace: { height: 18 },
  sigLine: { borderBottomWidth: 0.5, borderBottomColor: C.ink, marginBottom: 2, width: "100%" },
  sigName: { fontSize: 5.5, fontFamily: "Helvetica-Bold", color: C.ink, textAlign: "center" },
  sigRole: { fontSize: 5, color: C.muted, textAlign: "center" },

  // operator strip (very bottom)
  operatorStrip: {
    backgroundColor: C.stripe,
    borderTopWidth: 0.5,
    borderTopColor: C.hairline,
    paddingHorizontal: PAD_H,
    paddingVertical: 2.5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  operatorText: { fontSize: 5, color: C.muted },
});

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function MetaField({ label, value, style }: { label: string; value: string; style?: any }) {
  return (
    <View style={[S.headerMetaCol, style]}>
      <Text style={S.headerMetaLabel}>{label}:</Text>
      <Text style={S.headerMetaValue}>{value}</Text>
    </View>
  );
}

function InfoCell({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? S.infoCellLast : S.infoCell}>
      <Text style={S.infoLabel}>{label}</Text>
      <Text style={S.infoValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isPaid = status.toLowerCase() === "paid" || status.toLowerCase() === "lunas";
  return (
    <View style={[S.badge, isPaid ? S.badgePaid : S.badgePending]}>
      <Text style={S.badgeText}>{isPaid ? "LUNAS" : status.toUpperCase()}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT
// ─────────────────────────────────────────────────────────────────────────────

function KwitansiDocument({ data }: { data: KwitansiPDFData }) {
  const items = data.paymentItems ?? [];
  const total = Number(data.amount);
  const subTotal = items.reduce((s, i) => s + i.subtotal, 0);
  const isDiff = subTotal !== total;

  const institution = {
    name: "YAYASAN PENDIDIKAN RAHMANIYAH",
    address: "Jl. Lapangan Member, Blok C No.11 Sukmajaya - Depok 16412",
    phone: "(021) 77833598",
    fax: "(021) 77835420",
  };

  const unitName = data.major?.unitName ?? data.major?.name ?? "";
  const unitPhone = data.major?.phone ?? institution.phone;
  const unitFax = data.major?.fax ?? institution.fax;

  return (
    <Document>
      <Page size={[PAGE_W, PAGE_H]} style={S.page}>
        {/* ═══════════════════════════════════════════════════════════
            HEADER  (sticky top)
        ═══════════════════════════════════════════════════════════ */}
        <View style={S.header} fixed>
          <View style={S.headerTop}>
            {/* Left: institution */}
            <View style={S.headerLeft}>
              <Text style={S.headerInstitution}>{unitName || institution.name}</Text>
              {unitName ?
                <Text style={S.headerUnit}>{institution.name}</Text>
              : null}
              <Text style={S.headerAddress}>
                {data.major?.address ?? institution.address}
                {"\n"}
                Telp. {unitPhone}
                {unitFax ? `  |  Fax. ${unitFax}` : ""}
              </Text>
            </View>

            {/* Right: document title */}
            <View style={S.headerRight}>
              <Text style={S.headerDocLabel}>Bukti Pembayaran</Text>
              <Text style={S.headerDocTitle}>KWITANSI</Text>
              <Text style={S.headerDocNo}>No. {data.receiptNumber}</Text>
            </View>
          </View>
        </View>

        {/* header meta strip */}
        <View style={S.headerMeta} fixed>
          <MetaField label="Tanggal" value={fmtDate(data.paymentDate)} />
          <MetaField label="Bulan Bayar" value={data.month} />
          <MetaField label="Cara Bayar" value={data.bankRef ?? "-"} />
          <View style={S.headerMetaCol}>
            <Text style={S.headerMetaLabel}>Status:</Text>
            <StatusBadge status={data.status} />
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            BODY
        ═══════════════════════════════════════════════════════════ */}
        <View style={S.body}>
          {/* Student info bar */}
          <View style={S.infoRow}>
            <InfoCell label="NIS / NISN" value={data.student?.nisn ?? "-"} />
            <InfoCell label="Nama Siswa" value={data.student?.name ?? "-"} />
            <InfoCell label="Kelas" value={data.student?.class?.name ?? "-"} />
            <InfoCell label="No. HP Wali" value={data.student?.parentPhone ?? "-"} last />
          </View>

          {/* ── Payment Items Table ── */}
          <View style={S.tableWrap}>
            <View style={S.tableHead}>
              <Text style={[S.th, S.cNo]}>#</Text>
              <Text style={[S.th, S.cName]}>Keterangan Pembayaran</Text>
              <Text style={[S.th, S.cPeriod]}>Periode</Text>
              <Text style={[S.th, S.cType]}>Jenis</Text>
              <Text style={[S.th, S.cQty]}>Qty</Text>
              <Text style={[S.th, S.cAmt]}>Jumlah (Rp)</Text>
            </View>

            {items.map((item, i) => (
              <View key={item.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                <Text style={[S.td, S.cNo]}>{i + 1}</Text>
                <Text style={[S.tdBold, S.cName]}>{item.name}</Text>
                <Text style={[S.td, S.cPeriod]}>
                  {item.month} / {item.year}
                </Text>
                <Text style={[S.td, S.cType]}>{item.skuType}</Text>
                <Text style={[S.td, S.cQty]}>{item.quantity}</Text>
                <Text style={[S.td, S.cAmt]}>{fmt(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* ── Totals ── */}
          <View style={S.totalWrap}>
            {/* Terbilang */}
            <View style={S.terbilangBox}>
              <Text style={S.terbilangLabel}>Terbilang</Text>
              <Text style={S.terbilangText}>{capitalize(terbilang(total))} rupiah</Text>
              {data.notes ?
                <>
                  <Text style={[S.terbilangLabel, { marginTop: 4 }]}>Catatan</Text>
                  <Text style={S.terbilangText}>{data.notes}</Text>
                </>
              : null}
            </View>

            {/* Totals */}
            <View style={S.totalBox}>
              {isDiff && (
                <View style={S.totalRow}>
                  <Text style={S.totalLabel}>Subtotal</Text>
                  <Text style={S.totalValue}>Rp {fmt(subTotal)}</Text>
                </View>
              )}
              {data.bankRef && (
                <View style={S.totalRow}>
                  <Text style={S.totalLabel}>Metode</Text>
                  <Text style={S.totalValue}>{data.bankRef}</Text>
                </View>
              )}
              <View style={S.grandRow}>
                <Text style={S.grandLabel}>TOTAL</Text>
                <Text style={S.grandValue}>Rp {fmt(total)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            FOOTER  (sticky bottom)
        ═══════════════════════════════════════════════════════════ */}
        <View style={S.footer} fixed>
          <View style={S.footerInner}>
            {/* Bank info */}
            <View style={S.footerSection}>
              <Text style={S.footerSectionLabel}>Informasi Rekening</Text>
              <Text style={S.footerText}>
                Bank : {data.accountBank?.accountBank ?? "-"}
                {"\n"}
                No. Rekening : {data.accountBank?.accountNumber ?? "-"}
                {"\n"}
                Atas Nama : {data.accountBank?.accountName ?? "-"}
              </Text>
            </View>

            {/* Spacer / legal note */}
            <View style={[S.footerSection, { flex: 2 }]}>
              <Text style={S.footerSectionLabel}>Keterangan</Text>
              <Text style={S.footerText}>
                Bukti pembayaran ini sah tanpa tanda tangan dan stempel basah apabila{"\n"}
                tercatat dalam sistem informasi keuangan sekolah.
              </Text>
            </View>

            {/* Sig: student/payer */}
            <View style={S.footerSectionMid}>
              <Text style={S.footerSectionLabel}>Pemberi</Text>
              <View style={S.sigSpace} />
              <View style={S.sigLine} />
              <Text style={S.sigName}>{data.student?.name?.split(" ").slice(0, 2).join(" ") ?? ""}</Text>
              <Text style={S.sigRole}>Siswa / Wali</Text>
            </View>

            {/* Sig: operator/receiver */}
            <View style={S.footerSectionLast}>
              <Text style={S.footerSectionLabel}>Penerima</Text>
              <View style={S.sigSpace} />
              <View style={S.sigLine} />
              <Text style={S.sigName}>{data.createdBy?.name ?? ""}</Text>
              <Text style={S.sigRole}>Bendahara</Text>
            </View>
          </View>
        </View>

        {/* operator strip */}
        <View style={S.operatorStrip} fixed>
          <Text style={S.operatorText}>
            Dicetak oleh: {data.createdBy?.name ?? "-"}
            {"  ·  "}
            {fmtDateTime(data.paymentDate)}
            {"  ·  "}
            {data.major?.address ?? institution.address}
          </Text>
          <Text style={S.operatorText}>
            {institution.phone}
            {institution.fax ? `  |  Fax. ${institution.fax}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export async function createPDFKwitansi(data: KwitansiPDFData) {
  const blob = await pdf(<KwitansiDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Kwitansi-${data.receiptNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// USAGE EXAMPLE
// ─────────────────────────────────────────────────────────────────────────────
//
// import { createPDFKwitansi, KwitansiPDFData } from "./KwitansiPDF";
//
// const kwitansiData: KwitansiPDFData = {
//   id:            raw.id,
//   receiptNumber: raw.receiptNumber,
//   amount:        Number(raw.amount),
//   status:        raw.status,          // "PAID" / "LUNAS" / "PENDING"
//   paymentDate:   raw.paymentDate,
//   month:         raw.month,
//   bankRef:       raw.bankRef,
//   notes:         raw.notes,
//   student:       raw.student,
//   major:         raw.major,
//   accountBank:   raw.accountBank,
//   createdBy:     raw.createdBy,
//   paymentItems:  raw.paymentItems,
// };
//
// await createPDFKwitansi(kwitansiData);
