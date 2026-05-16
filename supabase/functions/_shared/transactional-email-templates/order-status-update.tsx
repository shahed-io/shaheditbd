/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Hr, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  featureBox, featureTitle, buttonStyle, footerStyle, footerSection, copyrightStyle, LOGO_URL,
} from '../email-templates/_styles.ts'

interface Props {
  customerName?: string
  orderNumber?: string
  newStatus?: string
  orderTotal?: string
  note?: string
}

const STATUS_INFO: Record<string, { label: string; emoji: string; color: string; desc: string }> = {
  pending:    { label: 'Pending',    emoji: '⏳', color: '#f59e0b', desc: 'Your order is awaiting review.' },
  processing: { label: 'Processing', emoji: '🔄', color: '#3b82f6', desc: 'We are processing your order right now.' },
  completed:  { label: 'Completed',  emoji: '✅', color: '#10b981', desc: 'Your order has been completed successfully.' },
  delivered:  { label: 'Delivered',  emoji: '📦', color: '#10b981', desc: 'Your product has been delivered. Enjoy!' },
  cancelled:  { label: 'Cancelled',  emoji: '❌', color: '#ef4444', desc: 'Your order has been cancelled.' },
  refunded:   { label: 'Refunded',   emoji: '💸', color: '#8b5cf6', desc: 'Your refund has been processed.' },
  failed:     { label: 'Failed',     emoji: '⚠️', color: '#ef4444', desc: 'Your order could not be processed.' },
}

const textStyle = { fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 16px' } as const

const OrderStatusUpdate = ({
  customerName = 'Customer',
  orderNumber = 'ORD-XXXXXXXX',
  newStatus = 'processing',
  orderTotal,
  note,
}: Props) => {
  const info = STATUS_INFO[newStatus] || { label: newStatus, emoji: '📋', color: '#6b7280', desc: 'Your order status has been updated.' }
  const pill = {
    display: 'inline-block', padding: '8px 18px', borderRadius: '999px',
    background: info.color, color: '#fff', fontWeight: 700, fontSize: '14px', margin: '6px 0 14px',
  } as const
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Body style={main}>
        <Container style={wrapper}>
          <Section style={headerStyle}>
            <div style={logoCardStyle}>
              <Img src={LOGO_URL} width="240" height="65" alt="Shahed Store" style={logoStyle} />
            </div>
          </Section>
          <Section style={contentStyle}>
            <Text style={h1Style}>Order Status Updated</Text>
            <Text style={subtitleStyle}>
              Hello {customerName}, the status of your order <strong style={{ color: '#7C3AED' }}>{orderNumber}</strong> has been updated.
            </Text>
            <div style={{ textAlign: 'center' as const }}>
              <span style={pill}>{info.emoji} {info.label}</span>
            </div>
            <Section style={featureBox}>
              <Text style={featureTitle}>What does this mean?</Text>
              <Text style={textStyle}>{info.desc}</Text>
              {orderTotal && <Text style={textStyle}><strong>Order Total:</strong> {orderTotal}</Text>}
              {note && <><Hr style={{ borderColor: '#e0d4f5', margin: '12px 0' }} /><Text style={textStyle}><strong>Note:</strong> {note}</Text></>}
            </Section>
            <Button style={buttonStyle} href="https://shahedstore.com.bd/dashboard">
              View Order Details
            </Button>
            <Text style={footerStyle}>
              Have questions? Reply to this email or contact our support team.
            </Text>
          </Section>
          <Section style={footerSection}>
            <Text style={copyrightStyle}>
              &copy; {new Date().getFullYear()} Shahed Store. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderStatusUpdate,
  subject: (d: Props) => `Order ${d.orderNumber || ''} — ${(STATUS_INFO[d.newStatus || ''] || { label: d.newStatus || 'Updated' }).label}`,
  displayName: 'Order Status Update',
  previewData: {
    customerName: 'Rahul Ahmed',
    orderNumber: 'ORD-ABC12345',
    newStatus: 'processing',
    orderTotal: '1,500 BDT',
  },
} satisfies TemplateEntry

export default OrderStatusUpdate
