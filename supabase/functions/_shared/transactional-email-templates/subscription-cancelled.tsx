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
  productName?: string
  cancellationDate?: string
  accessUntil?: string
  reason?: string
  reactivateUrl?: string
  orderNumber?: string
}

const Email = ({
  customerName = 'Customer',
  productName = 'your subscription',
  cancellationDate,
  accessUntil,
  reason,
  reactivateUrl = 'https://shahedit.com/shop',
  orderNumber,
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
          <Text style={h1Style}>Subscription Cancelled</Text>
          <Text style={subtitleStyle}>Hi {customerName}, your <strong>{productName}</strong> subscription has been cancelled as requested.</Text>
          <Section style={featureBox}>
            <Text style={featureTitle}>Cancellation Details</Text>
            <Text style={featureItem}>• Product: <strong>{productName}</strong></Text>
            {cancellationDate ? <Text style={featureItem}>• Cancelled on: <strong>{cancellationDate}</strong></Text> : null}
            {accessUntil ? <Text style={featureItem}>• Access until: <strong>{accessUntil}</strong></Text> : null}
            {orderNumber ? <Text style={featureItem}>• Reference: <strong>{orderNumber}</strong></Text> : null}
            {reason ? <Text style={featureItem}>• Reason: {reason}</Text> : null}
          </Section>
          <Text style={textStyle}>We're sorry to see you go. If you change your mind, you can reactivate anytime.</Text>
          <div style={{ textAlign: 'center' as const }}>
            <Button style={buttonStyle} href={reactivateUrl}>Reactivate Subscription</Button>
          </div>
          <div style={dividerStyle} />
          <Text style={footerStyle}>Feedback? Reply to this email — we'd love to hear how we can improve.</Text>
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
  subject: (d: Props) => d?.productName ? `Your ${d.productName} subscription has been cancelled` : 'Your subscription has been cancelled',
  displayName: 'Subscription Cancelled',
  previewData: { customerName: 'Rahul Ahmed', productName: 'Microsoft 365 Family', cancellationDate: '12 Jun 2026', accessUntil: '20 Jun 2026', orderNumber: 'SS-1042' },
} satisfies TemplateEntry

export default Email
