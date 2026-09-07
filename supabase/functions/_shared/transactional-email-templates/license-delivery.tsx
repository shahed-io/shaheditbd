/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  featureBox, featureTitle, buttonStyle, footerStyle, footerSection,
  copyrightStyle, LOGO_URL,
} from '../email-templates/_styles.ts'

interface LicenseItem {
  productName: string
  quantity?: number
  licenseKey: string
}

interface LicenseDeliveryProps {
  customerName?: string
  orderNumber?: string
  items?: LicenseItem[]
  note?: string
}

const label = {
  fontSize: '12px',
  color: '#6b7280',
  fontWeight: '600' as const,
  margin: '0 0 6px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
} as const

const productNameStyle = {
  fontSize: '15px',
  color: '#111827',
  fontWeight: '700' as const,
  margin: '0 0 8px',
} as const

const keyValueStyle = {
  fontSize: '14px',
  color: '#111827',
  fontWeight: '600' as const,
  margin: '0 0 0',
  fontFamily: 'monospace, monospace',
  wordBreak: 'break-all' as const,
  whiteSpace: 'pre-wrap' as const,
  backgroundColor: '#f5f3ff',
  border: '1px solid #ddd6fe',
  borderRadius: '8px',
  padding: '12px 14px',
  lineHeight: '1.6',
} as const

const itemBox = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '14px 16px',
  margin: '0 0 12px',
} as const

const noticeBox = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '16px 0',
} as const

const noticeText = {
  fontSize: '13px',
  color: '#92400e',
  margin: '0',
  lineHeight: '1.5',
} as const

const LicenseDeliveryEmail = ({
  customerName = 'Customer',
  orderNumber = '',
  items = [],
  note = '',
}: LicenseDeliveryProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Body style={main}>
        <Container style={wrapper}>
          <Section style={headerStyle}>
            <div style={logoCardStyle}>
              <Img src={LOGO_URL} width="240" height="65" alt="Shahed IT" style={logoStyle} />
            </div>
          </Section>

          <Section style={contentStyle}>
            <Text style={h1Style}>Your License is Ready 🔑</Text>
            <Text style={subtitleStyle}>
              Hi {customerName}, thank you for your purchase{orderNumber ? ` (Order #${orderNumber})` : ''}.
              Your license details are below. Please keep this email safe for future reference.
            </Text>

            <Section style={featureBox}>
              <Text style={featureTitle}>License Details</Text>

              {items.map((it, idx) => (
                <Section key={idx} style={itemBox}>
                  <Text style={productNameStyle}>
                    {it.productName}{it.quantity && it.quantity > 1 ? ` × ${it.quantity}` : ''}
                  </Text>
                  <Text style={label}>License / Credentials</Text>
                  <Text style={keyValueStyle}>{it.licenseKey}</Text>
                </Section>
              ))}
            </Section>

            {note && (
              <Section style={noticeBox}>
                <Text style={noticeText}><strong>Note:</strong> {note}</Text>
              </Section>
            )}

            <Section style={noticeBox}>
              <Text style={noticeText}>
                <strong>Important:</strong> If your license is in <code>email|password</code> format,
                the part before the <code>|</code> is the login email and the part after is the password.
                Do not share these details with anyone.
              </Text>
            </Section>

            <Button style={buttonStyle} href="https://shahedit.com/dashboard">
              Go to Dashboard
            </Button>

            <Text style={footerStyle}>
              Need help installing or activating? Reply to this email or contact our support team anytime.
            </Text>
          </Section>

          <Section style={footerSection}>
            <Text style={copyrightStyle}>
              &copy; {new Date().getFullYear()} Shahed IT. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: LicenseDeliveryEmail,
  subject: (data: any) =>
    data?.orderNumber
      ? `Your License Key — Order #${data.orderNumber}`
      : 'Your License Key from Shahed IT',
  displayName: 'License Delivery',
  previewData: {
    customerName: 'Rahul Ahmed',
    orderNumber: 'SHS-100245',
    items: [
      { productName: 'Office 365 — 1 Year', quantity: 1, licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX' },
      { productName: 'Canva Pro — Email Login', quantity: 1, licenseKey: 'user@example.com|StrongPass#2026' },
    ],
  },
} satisfies TemplateEntry

export default LicenseDeliveryEmail
