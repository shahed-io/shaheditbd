/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style,
  subtitleStyle, textStyle, featureBox, featureTitle, featureItem,
  buttonStyle, dividerStyle, footerStyle, footerSection, copyrightStyle, LOGO_URL, BRAND_PURPLE,
} from '../email-templates/_styles.ts'

interface Props {
  customerName?: string
  productName?: string
  startDate?: string
  expiryDate?: string
  orderNumber?: string
  dashboardUrl?: string
}

const Email = ({
  customerName = 'Customer',
  productName = 'your subscription',
  startDate,
  expiryDate,
  orderNumber,
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
          <Text style={h1Style}>Hello {customerName},</Text>
          <Text style={subtitleStyle}>
            🎉 Your <strong>{productName}</strong> subscription has been activated successfully.
          </Text>
          <Section style={featureBox}>
            <Text style={featureTitle}>Subscription Details</Text>
            <Text style={featureItem}>• Product: <strong>{productName}</strong></Text>
            {startDate ? <Text style={featureItem}>• Start date: <strong>{startDate}</strong></Text> : null}
            {expiryDate ? <Text style={featureItem}>• Expiry date: <strong>{expiryDate}</strong></Text> : null}
            {orderNumber ? <Text style={featureItem}>• Order: <strong>{orderNumber}</strong></Text> : null}
          </Section>
          <Text style={textStyle}>You can now enjoy uninterrupted premium access. Visit your dashboard for license details and downloads.</Text>
          <div style={{ textAlign: 'center' as const }}>
            <Button style={buttonStyle} href={dashboardUrl}>Open Dashboard</Button>
          </div>
          <div style={dividerStyle} />
          <Text style={footerStyle}>Need help? Reply to this email — we're here to support you.</Text>
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
  subject: (d: Props) => d?.productName ? `Your ${d.productName} subscription is now active` : 'Your subscription is now active',
  displayName: 'Subscription Activated',
  previewData: { customerName: 'Rahul Ahmed', productName: 'Microsoft 365 Family', startDate: '12 Jun 2026', expiryDate: '12 Jun 2027', orderNumber: 'SS-1042' },
} satisfies TemplateEntry

export default Email
