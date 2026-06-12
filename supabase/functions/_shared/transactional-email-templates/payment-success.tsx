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
  amount?: string | number
  currency?: string
  orderNumber?: string
  paymentMethod?: string
  transactionId?: string
  paidAt?: string
  receiptUrl?: string
}

const Email = ({
  customerName = 'Customer',
  amount,
  currency = 'BDT',
  orderNumber,
  paymentMethod,
  transactionId,
  paidAt,
  receiptUrl = 'https://shahedstore.com.bd/dashboard',
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
          <Text style={h1Style}>Payment Successful ✅</Text>
          <Text style={subtitleStyle}>Hi {customerName}, we have received your payment. Thank you!</Text>
          <Section style={featureBox}>
            <Text style={featureTitle}>Payment Details</Text>
            {amount ? <Text style={featureItem}>• Amount: <strong>{currency} {amount}</strong></Text> : null}
            {orderNumber ? <Text style={featureItem}>• Order: <strong>{orderNumber}</strong></Text> : null}
            {paymentMethod ? <Text style={featureItem}>• Method: <strong>{paymentMethod}</strong></Text> : null}
            {transactionId ? <Text style={featureItem}>• Transaction ID: <strong>{transactionId}</strong></Text> : null}
            {paidAt ? <Text style={featureItem}>• Paid at: <strong>{paidAt}</strong></Text> : null}
          </Section>
          <Text style={textStyle}>Your order is being processed. You'll receive your product/license details shortly.</Text>
          <div style={{ textAlign: 'center' as const }}>
            <Button style={buttonStyle} href={receiptUrl}>View Receipt</Button>
          </div>
          <div style={dividerStyle} />
          <Text style={footerStyle}>If you did not authorize this payment, contact our support immediately.</Text>
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
  subject: (d: Props) => d?.orderNumber ? `Payment received for order ${d.orderNumber}` : 'Payment received — thank you!',
  displayName: 'Payment Success',
  previewData: { customerName: 'Rahul Ahmed', amount: '1499', currency: 'BDT', orderNumber: 'SS-1042', paymentMethod: 'bKash', transactionId: 'TXN123ABC', paidAt: '12 Jun 2026 10:25 AM' },
} satisfies TemplateEntry

export default Email
