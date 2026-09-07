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
  failureReason?: string
  retryUrl?: string
}

const failBox = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '12px',
  padding: '16px 18px',
  margin: '0 0 20px',
} as const

const Email = ({
  customerName = 'Customer',
  amount,
  currency = 'BDT',
  orderNumber,
  paymentMethod,
  failureReason = 'The payment could not be completed.',
  retryUrl = 'https://shahedit.com/dashboard',
}: Props) => (
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
          <Text style={h1Style}>Payment Failed ⚠️</Text>
          <Text style={subtitleStyle}>Hi {customerName}, unfortunately your payment could not be processed.</Text>
          <Section style={failBox}>
            <Text style={{ ...featureItem, color: '#991b1b', margin: 0 }}>
              <strong>Reason:</strong> {failureReason}
            </Text>
          </Section>
          <Section style={featureBox}>
            <Text style={featureTitle}>Attempted Payment</Text>
            {amount ? <Text style={featureItem}>• Amount: <strong>{currency} {amount}</strong></Text> : null}
            {orderNumber ? <Text style={featureItem}>• Order: <strong>{orderNumber}</strong></Text> : null}
            {paymentMethod ? <Text style={featureItem}>• Method: <strong>{paymentMethod}</strong></Text> : null}
          </Section>
          <Text style={textStyle}>You can retry your payment from the link below. No amount was charged.</Text>
          <div style={{ textAlign: 'center' as const }}>
            <Button style={buttonStyle} href={retryUrl}>Retry Payment</Button>
          </div>
          <div style={dividerStyle} />
          <Text style={footerStyle}>Need help? Reply to this email and our support team will assist you.</Text>
        </Section>
        <Section style={footerSection}>
          <Text style={copyrightStyle}>&copy; {new Date().getFullYear()} Shahed IT. All rights reserved.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => d?.orderNumber ? `Payment failed for order ${d.orderNumber}` : 'Your payment could not be processed',
  displayName: 'Payment Failed',
  previewData: { customerName: 'Rahul Ahmed', amount: '1499', currency: 'BDT', orderNumber: 'SS-1042', paymentMethod: 'bKash', failureReason: 'Insufficient balance' },
} satisfies TemplateEntry

export default Email
