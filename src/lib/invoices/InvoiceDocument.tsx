import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

/**
 * Register Cairo (Arabic-capable) and Inter (Latin) fonts from Google Fonts.
 * These are TTFs hosted by gstatic so they work in serverless without bundling.
 *
 * NOTE: react-pdf does not natively reshape Arabic glyphs (no shaping engine).
 * For correct RTL display we render Arabic as right-aligned text in a font
 * that supports presentational Arabic forms — Cairo handles this well in
 * most invoice scenarios because the Arabic strings here are short labels
 * (customer name, status). For complex paragraph-shaped Arabic, the PDF
 * would benefit from an external shaping pre-pass — out of scope here.
 */
Font.register({
  family: 'Cairo',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-W1ToLQ-HmkA.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA-W1HoLg-HmkA.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.ttf', fontWeight: 700 },
  ],
});

// NASIJ palette
const C = {
  primary: '#2F5D4A',
  primaryDark: '#1F3F32',
  accent: '#D8B37A',
  accentDark: '#B8935A',
  cream: '#FAF5EA',
  secondary: '#EAD9B6',
  ink: '#1C1917',
  muted: '#6B6660',
  divider: '#E5DCC4',
};

const STATUS_LABELS_EN: Record<string, string> = {
  pending_review: 'Pending Review',
  pricing_added: 'Price Set',
  waiting_customer_confirmation: 'Awaiting Confirmation',
  confirmed: 'Confirmed',
  paid: 'Paid',
  in_production: 'In Production',
  delivered: 'Delivered',
  rejected: 'Rejected',
  completed: 'Completed',
};

const STATUS_LABELS_AR: Record<string, string> = {
  pending_review: 'قيد المراجعة',
  pricing_added: 'تم تحديد السعر',
  waiting_customer_confirmation: 'بانتظار تأكيد العميل',
  confirmed: 'مؤكد',
  paid: 'تم الدفع',
  in_production: 'قيد التنفيذ',
  delivered: 'تم التسليم',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 50,
    fontFamily: 'Inter',
    fontSize: 10,
    color: C.ink,
    backgroundColor: '#FFFFFF',
  },
  // Header band
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
    borderBottomStyle: 'solid',
    marginBottom: 28,
  },
  brandBlock: {
    flexDirection: 'column',
  },
  brandWord: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: 6,
    color: C.primary,
  },
  brandTagline: {
    fontSize: 9,
    color: C.accentDark,
    marginTop: 2,
    letterSpacing: 2,
  },
  brandArabic: {
    fontFamily: 'Cairo',
    fontSize: 14,
    color: C.primary,
    marginTop: 4,
  },
  invoiceMeta: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: C.primary,
    letterSpacing: 1,
  },
  invoiceTitleAr: {
    fontFamily: 'Cairo',
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 10,
    fontSize: 9,
  },
  metaLabel: { color: C.muted, marginRight: 6 },
  metaValue: { color: C.ink, fontWeight: 700 },

  // Order code highlight strip
  codeStrip: {
    backgroundColor: C.cream,
    borderLeftWidth: 4,
    borderLeftColor: C.accent,
    borderLeftStyle: 'solid',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 2,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: 700,
    color: C.primary,
    letterSpacing: 4,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: C.primary,
    color: C.cream,
    paddingHorizontal: 14,
    paddingVertical: 6,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1,
    borderRadius: 99,
  },

  // Two-column layout
  twoCol: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  col: {
    flex: 1,
  },
  colDivider: {
    width: 1,
    backgroundColor: C.divider,
    marginHorizontal: 18,
  },

  sectionTitle: {
    fontSize: 9,
    color: C.accentDark,
    letterSpacing: 2,
    marginBottom: 8,
    fontWeight: 700,
  },
  sectionTitleAr: {
    fontFamily: 'Cairo',
    fontSize: 9,
    color: C.muted,
    marginBottom: 12,
    textAlign: 'right',
  },

  fieldRow: {
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 8,
    color: C.muted,
  },
  fieldValue: {
    fontSize: 11,
    color: C.ink,
    marginTop: 1,
  },
  fieldValueAr: {
    fontFamily: 'Cairo',
    fontSize: 11,
    color: C.ink,
    marginTop: 1,
    textAlign: 'right',
  },

  // Details table
  detailsTable: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    borderTopStyle: 'solid',
    marginBottom: 24,
  },
  tHeader: {
    flexDirection: 'row',
    backgroundColor: C.cream,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    borderBottomStyle: 'solid',
  },
  tRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    borderBottomStyle: 'solid',
  },
  tCellDesc: { flex: 3, fontSize: 10 },
  tCellAmount: { flex: 1, fontSize: 10, textAlign: 'right' },
  tHeadCell: { fontSize: 8, fontWeight: 700, letterSpacing: 1, color: C.muted },

  // Totals
  totalsBlock: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '50%',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: C.muted,
    marginRight: 16,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 700,
    color: C.ink,
    minWidth: 100,
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '50%',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.primary,
    borderTopStyle: 'solid',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: C.primary,
    marginRight: 16,
    letterSpacing: 1,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 700,
    color: C.primary,
    minWidth: 100,
    textAlign: 'right',
  },
  currencyTag: {
    fontSize: 9,
    color: C.accentDark,
    marginLeft: 4,
  },

  // Notes block
  notesBlock: {
    marginTop: 24,
    backgroundColor: C.cream,
    padding: 14,
    borderRadius: 6,
  },
  notesTitle: {
    fontSize: 8,
    color: C.accentDark,
    letterSpacing: 2,
    marginBottom: 6,
    fontWeight: 700,
  },
  notesText: {
    fontSize: 10,
    color: C.ink,
    lineHeight: 1.6,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    borderTopStyle: 'solid',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: C.muted,
  },
  footerArabic: {
    fontFamily: 'Cairo',
    fontSize: 8,
    color: C.muted,
  },
  pageNumber: {
    color: C.muted,
  },

  watermark: {
    position: 'absolute',
    bottom: 80,
    right: 50,
    fontSize: 90,
    color: C.cream,
    opacity: 0.4,
    fontWeight: 700,
    letterSpacing: 12,
  },
});

export type InvoiceData = {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  size?: string | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  colors?: string | null;
  notes?: string | null;
  adminNotes?: string | null;
  price: number;
  status: string;
  paymentStatus?: string | null;
  createdAt: string; // ISO
  paidAt?: string | null;
};

const fmtDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const fmtMoney = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const sizeDescription = (d: InvoiceData) => {
  if (d.lengthCm && d.widthCm) return `${d.lengthCm} × ${d.widthCm} cm (custom)`;
  if (d.size) {
    if (/^\d+x\d+$/i.test(d.size)) return d.size.replace('x', ' × ') + ' cm';
    return d.size;
  }
  return '—';
};

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const statusEn = STATUS_LABELS_EN[data.status] || data.status;
  const statusAr = STATUS_LABELS_AR[data.status] || data.status;
  const paid = data.paymentStatus === 'paid';
  const subtotal = data.price; // single line item

  return (
    <Document
      title={`NASIJ Invoice ${data.orderCode}`}
      author="NASIJ"
      subject={`Invoice for order ${data.orderCode}`}
      creator="NASIJ Studio"
    >
      <Page size="A4" style={styles.page}>
        {/* Header: brand left / invoice meta right */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandWord}>NASIJ</Text>
            <Text style={styles.brandTagline}>HANDMADE · MADE IN EGYPT</Text>
            <Text style={styles.brandArabic}>نسيج — صناعة يدوية</Text>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceTitleAr}>فاتورة</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>{fmtDate(data.createdAt)}</Text>
            </View>
            {paid && data.paidAt && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Paid on:</Text>
                <Text style={styles.metaValue}>{fmtDate(data.paidAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Order code + status strip */}
        <View style={styles.codeStrip}>
          <View>
            <Text style={styles.codeLabel}>ORDER CODE · كود الطلب</Text>
            <Text style={styles.codeValue}>{data.orderCode}</Text>
          </View>
          <Text style={styles.statusPill}>{statusEn.toUpperCase()}</Text>
        </View>

        {/* Two-column: Bill-to (EN) | العميل (AR) */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>BILL TO</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValue}>{data.customerName}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Text style={styles.fieldValue}>{data.customerPhone}</Text>
            </View>
            {data.customerEmail && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.fieldValue}>{data.customerEmail}</Text>
              </View>
            )}
            {data.customerAddress && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Address</Text>
                <Text style={styles.fieldValue}>{data.customerAddress}</Text>
              </View>
            )}
          </View>

          <View style={styles.colDivider} />

          <View style={styles.col}>
            <Text style={styles.sectionTitleAr}>العميل</Text>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { textAlign: 'right' }]}>الاسم</Text>
              <Text style={styles.fieldValueAr}>{data.customerName}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { textAlign: 'right' }]}>الحالة</Text>
              <Text style={styles.fieldValueAr}>{statusAr}</Text>
            </View>
            {data.customerAddress && (
              <View style={styles.fieldRow}>
                <Text style={[styles.fieldLabel, { textAlign: 'right' }]}>العنوان</Text>
                <Text style={styles.fieldValueAr}>{data.customerAddress}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Details table */}
        <View style={styles.detailsTable}>
          <View style={styles.tHeader}>
            <Text style={[styles.tCellDesc, styles.tHeadCell]}>DESCRIPTION · الوصف</Text>
            <Text style={[styles.tCellAmount, styles.tHeadCell]}>AMOUNT</Text>
          </View>
          <View style={styles.tRow}>
            <View style={styles.tCellDesc}>
              <Text style={{ fontWeight: 700, marginBottom: 3 }}>
                Custom Hand-Tufted Rug
              </Text>
              <Text style={{ fontSize: 9, color: C.muted, lineHeight: 1.5 }}>
                Size: {sizeDescription(data)}
              </Text>
              {data.colors && (
                <Text style={{ fontSize: 9, color: C.muted, lineHeight: 1.5 }}>
                  Colors: {data.colors.replace(/,/g, ', ')}
                </Text>
              )}
              {data.notes && (
                <Text style={{ fontSize: 9, color: C.muted, lineHeight: 1.5, marginTop: 2 }}>
                  Notes: {data.notes}
                </Text>
              )}
            </View>
            <View style={styles.tCellAmount}>
              <Text style={{ fontSize: 11, fontWeight: 700 }}>
                {fmtMoney(subtotal)} <Text style={styles.currencyTag}>EGP</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmtMoney(subtotal)} EGP</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>
              {fmtMoney(subtotal)} <Text style={styles.currencyTag}>EGP</Text>
            </Text>
          </View>
          {paid && (
            <View style={[styles.totalRow, { marginTop: 6 }]}>
              <Text style={[styles.totalLabel, { color: '#16A34A' }]}>Status</Text>
              <Text style={[styles.totalValue, { color: '#16A34A' }]}>PAID ✓</Text>
            </View>
          )}
        </View>

        {/* Studio notes */}
        {data.adminNotes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesTitle}>NOTES FROM THE STUDIO</Text>
            <Text style={styles.notesText}>{data.adminNotes}</Text>
          </View>
        )}

        {/* Watermark */}
        <Text style={styles.watermark} fixed>NASIJ</Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View>
            <Text>NASIJ Studio · Egypt · @nasij_eg</Text>
            <Text style={[styles.footerArabic, { marginTop: 2 }]}>
              نسيج — صناعة يدوية مصرية · شكراً لاختيارك
            </Text>
          </View>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
