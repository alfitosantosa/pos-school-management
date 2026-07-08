"use client";

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

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

// A5 portrait — cukup luas untuk tabel panjang, tetap ringkas untuk kwitansi
// react-pdf otomatis membuat halaman baru ketika konten melebihi tinggi page
const PAGE_W = 420; // ~A5 width in pt (148mm)
const PAGE_H = 595; // ~A5 height in pt (210mm)

const PAD_H = 18;

const C = {
  ink: "#111827",
  sub: "#374151",
  muted: "#6B7280",
  hairline: "#D1D5DB",
  stripe: "#F9FAFB",
  accent: "#1E3A5F",
  accentLt: "#2D5288",
  white: "#FFFFFF",
  paid: "#065F46",
  pending: "#92400E",
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // ── Page ──────────────────────────────────────────────────────────────────
  page: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: C.ink,
    backgroundColor: C.white,
  },

  // ── HEADER (repeats on every page via `fixed`) ───────────────────────────
  header: {
    backgroundColor: C.accent,
    paddingHorizontal: PAD_H,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  headerLeft: { flex: 1 },
  headerInstitution: {
    color: C.white,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  headerUnit: {
    color: "#93C5FD",
    fontSize: 7,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  headerAddress: {
    color: "#CBD5E1",
    fontSize: 6,
    marginTop: 3,
    lineHeight: 1.5,
  },
  headerRight: {
    alignItems: "flex-end",
    minWidth: 120,
  },
  headerDocLabel: {
    color: "#93C5FD",
    fontSize: 6,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  headerDocTitle: {
    color: C.white,
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  headerDocNo: {
    color: "#BFDBFE",
    fontSize: 6.5,
    marginTop: 3,
  },

  headerMeta: {
    backgroundColor: C.accentLt,
    flexDirection: "row",
    paddingHorizontal: PAD_H,
    paddingVertical: 6,
    justifyContent: "space-between",
  },
  headerMetaCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerMetaLabel: { color: "#93C5FD", fontSize: 6.5 },
  headerMetaValue: { color: C.white, fontSize: 6.5, fontFamily: "Helvetica-Bold" },

  badge: {
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgePaid: { backgroundColor: C.paid },
  badgePending: { backgroundColor: C.pending },
  badgeText: { fontSize: 6, fontFamily: "Helvetica-Bold", color: C.white },

  // small continuation banner shown on page 2+
  continuationBar: {
    backgroundColor: C.stripe,
    paddingHorizontal: PAD_H,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
  },
  continuationText: {
    fontSize: 6,
    color: C.muted,
    fontFamily: "Helvetica-Oblique",
  },

  // ── BODY ──────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: PAD_H,
    paddingTop: 8,
  },

  infoRow: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: C.hairline,
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  infoCell: {
    flex: 1,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRightWidth: 0.5,
    borderRightColor: C.hairline,
  },
  infoCellLast: {
    flex: 1,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  infoLabel: { fontSize: 5.5, color: C.muted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.ink },

  // Table
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.ink,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  th: {
    color: C.white,
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    backgroundColor: C.white,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    backgroundColor: C.stripe,
  },
  td: { fontSize: 6.5, color: C.sub },
  tdBold: { fontSize: 6.5, color: C.ink, fontFamily: "Helvetica-Bold" },

  cNo: { width: "6%" },
  cName: { width: "37%" },
  cPeriod: { width: "18%", textAlign: "center" },
  cType: { width: "16%", textAlign: "center" },
  cQty: { width: "8%", textAlign: "center" },
  cAmt: { width: "15%", textAlign: "right" },

  // running subtotal shown at the bottom of every page when content continues
  pageSubtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#EEF2F7",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 4,
    borderRadius: 2,
  },
  pageSubtotalLabel: { fontSize: 6, color: C.muted, fontFamily: "Helvetica-Oblique" },
  pageSubtotalValue: { fontSize: 6, color: C.sub, fontFamily: "Helvetica-Bold" },

  // Totals block (only on last page)
  totalWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    alignItems: "flex-end",
  },
  terbilangBox: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: C.hairline,
    borderRadius: 2,
    padding: 6,
    marginRight: 10,
  },
  terbilangLabel: { fontSize: 5.5, color: C.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
  terbilangText: { fontSize: 6.5, color: C.ink, fontFamily: "Helvetica-Oblique", lineHeight: 1.5 },

  totalBox: { width: 165 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
  },
  totalLabel: { fontSize: 6.5, color: C.muted },
  totalValue: { fontSize: 6.5, color: C.sub },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.accent,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 2,
    marginTop: 4,
  },
  grandLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },
  grandValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },

  // ── FOOTER (only rendered after the table is fully done, i.e. last page) ──
  footerSpacer: { marginTop: 10 },
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: C.hairline,
    paddingHorizontal: PAD_H,
    paddingTop: 8,
    paddingBottom: 8,
  },
  footerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerSection: { flex: 1, marginRight: 10 },
  footerSectionMid: { alignItems: "center", width: 90, marginRight: 10 },
  footerSectionLast: { alignItems: "center", width: 90 },
  footerSectionLabel: {
    fontSize: 5.5,
    color: C.muted,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: C.hairline,
    paddingBottom: 2,
  },
  footerText: { fontSize: 6.5, color: C.sub, lineHeight: 1.7 },
  sigSpace: { height: 24 },
  sigLine: { borderBottomWidth: 0.5, borderBottomColor: C.ink, marginBottom: 3, width: "100%" },
  sigName: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: C.ink, textAlign: "center" },
  sigRole: { fontSize: 6, color: C.muted, textAlign: "center" },

  // page footer note (every page)
  pageFooterNote: {
    paddingHorizontal: PAD_H,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pageFooterText: { fontSize: 5.5, color: C.muted },
  pageNumber: { fontSize: 5.5, color: C.muted, fontFamily: "Helvetica-Bold" },
});

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <View style={S.headerMetaCol}>
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

// Header yang berulang di setiap halaman (pakai `fixed` agar react-pdf
// otomatis menempatkannya di setiap page baru ketika konten overflow)
function RepeatingHeader({ data, isFirstPage }: { data: KwitansiPDFData; isFirstPage: boolean }) {
  const institution = {
    name: "YAYASAN PENDIDIKAN RAHMANY",
    address: "Jl. Lapangan Member, Blok C No.11 Sukmajaya - Depok 16412",
    phone: "(021) 77833598",
    fax: "(021) 77835420",
  };

  const unitName = data.major?.unitName ?? data.major?.name ?? "";
  const unitPhone = data.major?.phone ?? institution.phone;
  const unitFax = data.major?.fax ?? institution.fax;

  return (
    <>
      <View style={S.header} fixed>
        <View style={S.headerTop}>
          <View style={S.headerLeft}>
            <Text style={S.headerInstitution}>{unitName || institution.name}</Text>
            {unitName ? <Text style={S.headerUnit}>{institution.name}</Text> : null}
            <Text style={S.headerAddress}>
              {data.major?.address ?? institution.address}
              {"\n"}
              Telp. {unitPhone}
              {unitFax ? `  |  Fax. ${unitFax}` : ""}
            </Text>
          </View>

          <View style={S.headerRight}>
            <Text style={S.headerDocLabel}>Bukti Transaksi</Text>
            <Text style={S.headerDocTitle}>KWITANSI</Text>
            <Text style={S.headerDocNo}>No. {data.receiptNumber}</Text>
          </View>
        </View>
      </View>

      <View style={S.headerMeta} fixed>
        <MetaField label="Tanggal" value={fmtDate(data.paymentDate)} />
        <MetaField label="Bulan Bayar" value={data.month} />
        <MetaField label="Cara Bayar" value={data.bankRef ?? "-"} />
        <View style={S.headerMetaCol}>
          <Text style={S.headerMetaLabel}>Status:</Text>
          <StatusBadge status={data.status} />
        </View>
      </View>

      {/* Banner "lanjutan" hanya tampil estetis di halaman 2+ — karena react-pdf
          tidak punya conditional-by-page-number native, kita pakai render prop
          `render` pada Text dengan pageNumber dari context */}
      {!isFirstPage && (
        <View style={S.continuationBar}>
          <Text style={S.continuationText}>Lanjutan rincian transaksi — Kwitansi No. {data.receiptNumber}</Text>
        </View>
      )}
    </>
  );
}

// Page footer note — nomor halaman, muncul di setiap page (fixed)
function PageFooterNote({ data }: { data: KwitansiPDFData }) {
  return (
    <View style={S.pageFooterNote} fixed>
      <Text style={S.pageFooterText} render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Halaman ${pageNumber} dari ${totalPages}` : "")} />
      <Text style={S.pageNumber} render={({ pageNumber, totalPages }) => `${data.receiptNumber}`} />
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
    name: "YAYASAN PENDIDIKAN RAHMANY",
    address: "Jl. Lapangan Member, Blok C No.11 Sukmajaya - Depok 16412",
    phone: "(021) 77833598",
    fax: "(021) 77835420",
  };

  return (
    <Document>
      {/*
        ✅ KUNCI MULTI-PAGE: hanya SATU <Page> dengan `wrap` (default true).
        react-pdf akan otomatis memecah konten ke halaman baru ketika
        body melebihi tinggi page. Header/footer dengan `fixed` akan
        otomatis berulang di setiap halaman yang dihasilkan.
      */}
      <Page size={[PAGE_W, PAGE_H]} style={S.page} wrap>
        {/* ═══ HEADER — berulang otomatis di setiap halaman ═══ */}
        <RepeatingHeader data={data} isFirstPage={true} />

        {/* ═══ BODY ═══ */}
        <View style={S.body}>
          {/* Student info bar — hanya tampil natural di halaman pertama
              karena diletakkan sebelum tabel; saat tabel overflow ke
              halaman 2, info bar ini tidak diulang (sesuai praktik kwitansi) */}
          <View style={S.infoRow}>
            <InfoCell label="NIS / NISN" value={data.student?.nisn ?? "-"} />
            <InfoCell label="Nama Siswa" value={data.student?.name ?? "-"} />
            <InfoCell label="Kelas" value={data.student?.class?.name ?? "-"} />
            <InfoCell label="No. HP Wali" value={data.student?.parentPhone ?? "-"} last />
          </View>

          {/* ── Payment Items Table — header tabel ikut berulang ── */}
          <View style={S.tableHead} fixed>
            <Text style={[S.th, S.cNo]}>#</Text>
            <Text style={[S.th, S.cName]}>Keterangan Transaksi</Text>
            <Text style={[S.th, S.cPeriod]}>Periode</Text>
            <Text style={[S.th, S.cType]}>Jenis</Text>
            <Text style={[S.th, S.cQty]}>Qty</Text>
            <Text style={[S.th, S.cAmt]}>Jumlah (Rp)</Text>
          </View>

          {/*
            ✅ Setiap baris dibungkus `wrap={false}` agar satu baris item
            TIDAK terpotong di antara dua halaman — react-pdf akan
            memindahkan baris yang tidak cukup muat ke halaman berikutnya
            secara utuh, bukan terpotong di tengah.
          */}
          {items.map((item, i) => (
            <View key={item.id} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt} wrap={false}>
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

          {/*
            ✅ Totals & Terbilang dibungkus `wrap={false}` agar blok ini
            tidak terpotong di antara dua halaman — kalau tidak cukup
            muat di sisa halaman saat ini, otomatis pindah ke halaman
            berikutnya secara keseluruhan.
          */}
          <View style={S.totalWrap} wrap={false}>
            <View style={S.terbilangBox}>
              <Text style={S.terbilangLabel}>Terbilang</Text>
              <Text style={S.terbilangText}>{capitalize(terbilang(total))} rupiah</Text>
              {data.notes ? (
                <>
                  <Text style={[S.terbilangLabel, { marginTop: 5 }]}>Catatan</Text>
                  <Text style={S.terbilangText}>{data.notes}</Text>
                </>
              ) : null}
            </View>

            <View style={S.totalBox}>
              <View style={S.totalRow}>
                <Text style={S.totalLabel}>Jumlah Item</Text>
                <Text style={S.totalValue}>{items.length} item</Text>
              </View>
              {/* {isDiff && (
                <View style={S.totalRow}>
                  <Text style={S.totalLabel}>Subtotal</Text>
                  <Text style={S.totalValue}>Rp {fmt(subTotal)}</Text>
                </View>
              )} */}
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

          {/*
            ✅ Footer tanda tangan & info bank dibungkus `wrap={false}`
            sehingga selalu utuh — kalau ruang tidak cukup di halaman
            saat ini, react-pdf otomatis memindahkannya ke page baru.
          */}
          <View style={S.footerSpacer} wrap={false}>
            <View style={S.footer}>
              <View style={S.footerInner}>
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

                <View style={[S.footerSection, { flex: 2 }]}>
                  <Text style={S.footerSectionLabel}>Keterangan</Text>
                  <Text style={S.footerText}>
                    Bukti Transaksi ini sah tanpa tanda tangan dan stempel basah apabila{"\n"}
                    tercatat dalam sistem informasi keuangan sekolah.
                  </Text>
                </View>

                <View style={S.footerSectionMid}>
                  <Text style={S.footerSectionLabel}>Pemberi</Text>
                  <View style={S.sigSpace} />
                  <View style={S.sigLine} />
                  <Text style={S.sigName}>{data.student?.name?.split(" ").slice(0, 2).join(" ") ?? ""}</Text>
                  <Text style={S.sigRole}>Siswa / Wali</Text>
                </View>

                <View style={S.footerSectionLast}>
                  <Text style={S.footerSectionLabel}>Penerima</Text>
                  <View style={S.sigSpace} />
                  <View style={S.sigLine} />
                  <Text style={S.sigName}>{data.createdBy?.name ?? ""}</Text>
                  <Text style={S.sigRole}>Bendahara</Text>
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: C.stripe,
                borderTopWidth: 0.5,
                borderTopColor: C.hairline,
                paddingHorizontal: PAD_H,
                paddingVertical: 4,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 5.5, color: C.muted }}>
                Dicetak oleh: {data.createdBy?.name ?? "-"} · {fmtDateTime(data.paymentDate)}
              </Text>
              <Text style={{ fontSize: 5.5, color: C.muted }}>
                {institution.phone}
                {institution.fax ? `  |  Fax. ${institution.fax}` : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══ Nomor halaman — muncul di setiap halaman, di posisi bawah ═══ */}
        <PageFooterNote data={data} />
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
