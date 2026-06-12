/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style,
  subtitleStyle, textStyle, featureBox, featureTitle, featureItem,
  buttonStyle, dividerStyle, footerStyle, footerSection, copyrightStyle, LOGO_URL,
} from '../email-templates/_styles.ts'

interface Props {
  customerName?: string
  refundAmount?: string | number
  currency?: string
  orderNumber?: string
  refundMethod?: string
  refundedAt?: string
  expectedArrival?: string
  note?: string
  dashboardUrl?: string
}

const Email = ({
  customerName = 'Customer',
  refundAmount,
  currency = 'BDT',
  orderNumber,
  refundMethod,
  refundedAt,
  expectedArrival = '3-7 business days',
  note,
  dashboardUrl = 'https://shahedstore.com.bd/dashboard',
}: Props) => (
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
          <Text style={h1Style}>Refund Processed ✅</Text>
          <Text style={subtitleStyle}>Hi {customerName}, your refund has been processed successfully.</Text>
          <Section style={featureBox}>
            <Text style={featureTitle}>Refund Details</Text>
            {refundAmount ? <Text style={featureItem}>• Amount: <strong>{currency} {refundAmount}</strong></Text> : null}
            {orderNumber ? <Text style={featureItem}>• Order: <strong>{orderNumber}</strong></Text> : null}
            {refundMethod ? <Text style={featureItem}>• Refund method: <strong>{refundMethod}</strong></Text> : null}
            {refundedAt ? <Text style={featureItem}>• Processed at: <strong>{refundedAt}</strong></Text> : null}
            <Text style={featureItem}>• Expected arrival: <strong>{expectedArrival}</strong></Text>
            {note ? <Text style={featureItem}>• Note: {note}</Text> : null}
          </Section>
          <Text style={textStyle}>The amount should appear in your account within the expected timeframe. Please check with your payment provider if it takes longer.</Text>
          <div style={{ textAlign: 'center' as const }}>
            <Button style={buttonStyle} href={dashboardUrl}>Open Dashboard</Button>
          </div>
          <div style={dividerStyle} />
          <Text style={footerStyle}>Questions about your refund? Reply to this email and we'll help right away.</Text>
        </Section>
        <Section style={footerSection}>
          <Text style={copyrightStyle}>&copy; {new Date().getFullYear()} Shahed Store. All rights reserved.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => d?.orderNumber ? `Refund processed for order ${d.orderNumber}` : 'Your refund has been processed',
  displayName: 'Refund Processed',
  previewData: { customerName: 'Rahul Ahmed', refundAmount: '1499', currency: 'BDT', orderNumber: 'SS-1042', refundMethod: 'bKash', refundedAt: '12 Jun 2026', expectedArrival: '3-7 business days' },
} satisfies TemplateEntry

export default Email
