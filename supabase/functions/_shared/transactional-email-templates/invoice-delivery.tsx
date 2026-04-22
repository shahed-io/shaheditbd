/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
  Section, Row, Column, Hr, Button, Link, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Shahed Store'
const SITE_URL = 'https://www.shahedstore.com.bd'
const LOGO_URL = 'https://dpvdavjwqyviredzoorj.supabase.co/storage/v1/object/public/email-assets/logo.png'

interface InvoiceItemData {
  name: string
  quantity: number
  price: number
  total?: number
  license_key?: string | null
}

interface InvoiceDeliveryProps {
  customerName?: string
  invoiceNumber?: string
  invoiceDate?: string
  items?: InvoiceItemData[]
  subtotal?: number
  discount?: number
  total?: number
  paymentMethod?: string
  transactionId?: string
  status?: string
  notes?: string
  pdfUrl?: string
}

const fmt = (n?: number) => '৳' + Number(n || 0).toLocaleString('en-US')

const InvoiceDeliveryEmail = ({
  customerName = 'Customer',
  invoiceNumber = '-',
  invoiceDate = '',
  items = [],
  subtotal = 0,
  discount = 0,
  total = 0,
  paymentMethod = '',
  transactionId = '',
  status = '',
  notes = '',
  pdfUrl = '',
}: InvoiceDeliveryProps) => {
  const sub = subtotal || items.reduce((s, i) => s + i.quantity * i.price, 0)

  return (
    <Html lang="bn" dir="ltr">
      <Head />
      <Preview>আপনার ইনভয়েস #{invoiceNumber} — {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Row>
              <Column>
                <Img src={LOGO_URL} alt={SITE_NAME} width="120" style={{ height: 'auto' }} />
              </Column>
              <Column align="right">
                <Heading style={invoiceTitle}>INVOICE</Heading>
                <Text style={invoiceMeta}>#{invoiceNumber}</Text>
                {invoiceDate && <Text style={invoiceMetaSmall}>{invoiceDate}</Text>}
              </Column>
            </Row>
          </Section>

          {/* Greeting */}
          <Section style={{ marginBottom: '20px' }}>
            <Heading style={h2}>Hello {customerName}, 👋</Heading>
            <Text style={paragraph}>
              আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে। আপনার ইনভয়েসের বিস্তারিত নিচে দেওয়া হলো এবং সম্পূর্ণ PDF সংযুক্ত আছে।
            </Text>
          </Section>

          {/* Customer + Payment cards */}
          <Section style={{ marginBottom: '24px' }}>
            <Row>
              <Column style={infoCard}>
                <Text style={cardLabel}>📋 বিলিং</Text>
                <Text style={cardName}>{customerName}</Text>
              </Column>
              <Column style={{ width: '12px' }}>&nbsp;</Column>
              <Column style={infoCard}>
                <Text style={cardLabel}>💳 পেমেন্ট</Text>
                <Text style={cardLine}>Method: <b>{paymentMethod || 'N/A'}</b></Text>
                {transactionId && <Text style={cardLine}>TrxID: <b>{transactionId}</b></Text>}
                {status && <Text style={cardLine}>Status: <b>{status}</b></Text>}
              </Column>
            </Row>
          </Section>

          {/* Items table */}
          <Section style={{ marginBottom: '20px' }}>
            <table style={tableStyle as any} cellPadding={0} cellSpacing={0}>
              <thead>
                <tr style={{ backgroundColor: '#7c3aed' }}>
                  <th style={thStyle as any}>#</th>
                  <th style={{ ...thStyle, textAlign: 'left' } as any}>পণ্য</th>
                  <th style={thStyle as any}>Qty</th>
                  <th style={{ ...thStyle, textAlign: 'right' } as any}>দাম</th>
                  <th style={{ ...thStyle, textAlign: 'right' } as any}>মোট</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#faf9ff' }}>
                    <td style={tdStyle as any}>{idx + 1}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 } as any}>
                      {item.name}
                      {item.license_key && (
                        <div style={keyChip}>{item.license_key}</div>
                      )}
                    </td>
                    <td style={tdStyle as any}>×{item.quantity}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' } as any}>{fmt(item.price)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 } as any}>
                      {fmt(item.total ?? item.quantity * item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Totals */}
          <Section style={totalsSection}>
            <Row>
              <Column>&nbsp;</Column>
              <Column style={{ width: '260px' }}>
                <table style={{ width: '100%' } as any} cellPadding={0} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={totalLabelStyle as any}>সাবটোটাল:</td>
                      <td style={totalValueStyle as any}>{fmt(sub)}</td>
                    </tr>
                    {discount > 0 && (
                      <tr>
                        <td style={{ ...totalLabelStyle, color: '#059669' } as any}>ডিসকাউন্ট:</td>
                        <td style={{ ...totalValueStyle, color: '#059669' } as any}>-{fmt(discount)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={2}><div style={dividerStyle} /></td>
                    </tr>
                    <tr>
                      <td style={grandLabelStyle as any}>সর্বমোট:</td>
                      <td style={grandValueStyle as any}>{fmt(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </Column>
            </Row>
          </Section>

          {notes && (
            <Section style={notesBox}>
              <Text style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', margin: '0 0 4px' }}>📝 নোট</Text>
              <Text style={{ fontSize: '13px', color: '#78350f', margin: 0 }}>{notes}</Text>
            </Section>
          )}

          {/* PDF download CTA */}
          {pdfUrl && (
            <Section style={{ textAlign: 'center', margin: '28px 0' }}>
              <Button href={pdfUrl} style={buttonStyle}>
                📄 PDF ইনভয়েস ডাউনলোড করুন
              </Button>
              <Text style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
                লিঙ্কে ক্লিক করে সম্পূর্ণ ইনভয়েসটি PDF আকারে সংরক্ষণ করুন
              </Text>
            </Section>
          )}

          <Hr style={{ borderColor: '#e5e7eb', margin: '28px 0 16px' }} />

          {/* Footer */}
          <Section style={{ textAlign: 'center' }}>
            <Text style={footerText}>ধন্যবাদ আমাদের সাথে কেনাকাটা করার জন্য! 💜</Text>
            <Text style={footerSmall}>
              <Link href={SITE_URL} style={{ color: '#7c3aed', textDecoration: 'none' }}>
                {SITE_URL.replace('https://', '')}
              </Link>
              {' • '}
              <Link href="mailto:info@shahedstore.com.bd" style={{ color: '#7c3aed', textDecoration: 'none' }}>
                info@shahedstore.com.bd
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: InvoiceDeliveryEmail,
  subject: (data: InvoiceDeliveryProps) =>
    `🧾 ইনভয়েস #${data?.invoiceNumber || ''} — ${SITE_NAME}`,
  displayName: 'Invoice Delivery',
  previewData: {
    customerName: 'মোহাম্মদ আলী',
    invoiceNumber: 'INV-251201-A4F2',
    invoiceDate: '01 Dec 2025',
    items: [
      { name: 'Adobe Photoshop License — 1 Year', quantity: 1, price: 1500, total: 1500, license_key: 'XXXX-YYYY-ZZZZ' },
      { name: 'Canva Pro — 6 Months', quantity: 2, price: 800, total: 1600 },
    ],
    subtotal: 3100,
    discount: 100,
    total: 3000,
    paymentMethod: 'bKash',
    transactionId: 'BX9K2L7M',
    status: 'Paid',
    pdfUrl: 'https://example.com/invoice.pdf',
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', 'Noto Sans Bengali', Arial, sans-serif", margin: 0, padding: 0 }
const container = { maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }
const headerSection = { borderBottom: '3px solid #7c3aed', paddingBottom: '20px', marginBottom: '24px' }
const invoiceTitle = { fontSize: '28px', fontWeight: 800, color: '#7c3aed', letterSpacing: '2px', margin: 0, lineHeight: 1 }
const invoiceMeta = { fontSize: '13px', color: '#666', margin: '6px 0 0', fontFamily: 'monospace' }
const invoiceMetaSmall = { fontSize: '12px', color: '#888', margin: '2px 0 0' }
const h2 = { fontSize: '20px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }
const paragraph = { fontSize: '14px', color: '#555', lineHeight: 1.6, margin: 0 }
const infoCard = { backgroundColor: '#f3f0ff', borderRadius: '10px', padding: '16px', borderLeft: '4px solid #7c3aed', verticalAlign: 'top' as const }
const cardLabel = { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#7c3aed', letterSpacing: '1.5px', margin: '0 0 8px' }
const cardName = { fontSize: '15px', fontWeight: 700, color: '#1a1a2e', margin: 0 }
const cardLine = { fontSize: '12px', color: '#555', margin: '3px 0' }
const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, borderRadius: '8px', overflow: 'hidden' }
const thStyle = { color: '#ffffff', fontSize: '11px', textTransform: 'uppercase' as const, padding: '12px 10px', textAlign: 'center' as const, letterSpacing: '0.5px', fontWeight: 700 }
const tdStyle = { padding: '12px 10px', fontSize: '12px', color: '#444', textAlign: 'center' as const, borderBottom: '1px solid #eee' }
const keyChip = { fontSize: '10px', color: '#7c3aed', fontFamily: 'monospace', marginTop: '4px', backgroundColor: '#f3f0ff', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }
const totalsSection = { marginBottom: '20px' }
const totalLabelStyle = { fontSize: '13px', color: '#555', padding: '4px 0', textAlign: 'left' as const }
const totalValueStyle = { fontSize: '13px', color: '#1a1a2e', padding: '4px 0', textAlign: 'right' as const, fontWeight: 600 }
const dividerStyle = { height: '1px', backgroundColor: '#7c3aed', opacity: 0.3, margin: '8px 0' }
const grandLabelStyle = { fontSize: '17px', color: '#7c3aed', padding: '6px 0', textAlign: 'left' as const, fontWeight: 800 }
const grandValueStyle = { fontSize: '17px', color: '#7c3aed', padding: '6px 0', textAlign: 'right' as const, fontWeight: 800 }
const notesBox = { backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }
const buttonStyle = { backgroundColor: '#7c3aed', color: '#ffffff', padding: '14px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }
const footerText = { fontSize: '13px', color: '#666', margin: '0 0 6px' }
const footerSmall = { fontSize: '11px', color: '#888', margin: 0 }
