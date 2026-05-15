/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style,
  subtitleStyle, textStyle, featureBox, featureTitle, featureItem,
  buttonStyle, dividerStyle, footerStyle, footerSection, copyrightStyle,
  LOGO_URL, BRAND_PURPLE, BRAND_PURPLE_LIGHT, BRAND_PURPLE_BORDER,
} from '../email-templates/_styles.ts'

interface Props {
  customerName?: string
  productName?: string
  expiryDate?: string
  daysLeft?: number
  renewUrl?: string
  customMessage?: string
  orderNumber?: string
  couponCode?: string
  discountPercent?: number
  couponValidUntil?: string
  specialOffer?: string
}

const badge = {
  display: 'inline-block' as const,
  padding: '6px 14px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '700' as const,
  background: BRAND_PURPLE_LIGHT,
  color: BRAND_PURPLE,
  border: `1px solid ${BRAND_PURPLE_BORDER}`,
  marginBottom: '12px',
} as const

const expiryBox = {
  background: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
} as const

const SubscriptionRenewalReminder = ({
  customerName = 'Customer',
  productName = 'your subscription',
  expiryDate = '',
  daysLeft,
  renewUrl = 'https://shahedstore.com.bd/shop',
  customMessage,
  orderNumber,
  couponCode,
  discountPercent,
  couponValidUntil,
  specialOffer,
}: Props) => {
  const expired = typeof daysLeft === 'number' && daysLeft < 0
  const status = expired
    ? `Expired ${Math.abs(daysLeft!)} day${Math.abs(daysLeft!) === 1 ? '' : 's'} ago`
    : typeof daysLeft === 'number'
      ? daysLeft === 0
        ? 'Expires today'
        : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
      : 'Renewal reminder'

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
            <Text style={badge}>{expired ? 'Subscription Expired' : 'Renewal Reminder'}</Text>
            <Text style={h1Style}>Hello {customerName},</Text>
            <Text style={subtitleStyle}>
              This is a friendly reminder about your <strong>{productName}</strong> subscription with Shahed Store.
            </Text>

            <Section style={expiryBox}>
              <Text style={{ ...featureTitle, color: '#9a3412', margin: '0 0 6px' }}>{status}</Text>
              {expiryDate ? (
                <Text style={{ ...featureItem, color: '#7c2d12', margin: 0 }}>
                  Expiry date: <strong>{expiryDate}</strong>
                </Text>
              ) : null}
            </Section>

            {customMessage ? (
              <Text style={{ ...textStyle, whiteSpace: 'pre-wrap' as const }}>{customMessage}</Text>
            ) : (
              <Text style={textStyle}>
                {expired
                  ? '⏰ Your subscription has already ended. To continue enjoying uninterrupted access, please renew it as soon as possible.'
                  : '🔔 To avoid any interruption in your service, please renew your subscription before the expiry date.'}
              </Text>
            )}

            {couponCode ? (
              <Section style={{
                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                border: `2px dashed ${BRAND_PURPLE}`,
                borderRadius: '14px',
                padding: '20px',
                margin: '0 0 24px',
                textAlign: 'center' as const,
              }}>
                <Text style={{ ...featureTitle, color: BRAND_PURPLE, margin: '0 0 8px', fontSize: '14px' }}>
                  🎁 Your Personal Discount Coupon
                </Text>
                <Text style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 12px' }}>
                  {discountPercent ? `${discountPercent}% OFF` : 'Special discount'} on <strong>{productName}</strong> — just for you.
                </Text>
                <div style={{
                  display: 'inline-block',
                  background: '#ffffff',
                  border: `1.5px solid ${BRAND_PURPLE}`,
                  borderRadius: '10px',
                  padding: '10px 22px',
                  fontFamily: 'monospace, monospace',
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  color: BRAND_PURPLE,
                }}>{couponCode}</div>
                <Text style={{ fontSize: '11px', color: '#6b7280', margin: '12px 0 0' }}>
                  ✨ One-time use • Only for this product{couponValidUntil ? ` • Valid until ${couponValidUntil}` : ''}
                </Text>
              </Section>
            ) : null}

            {specialOffer ? (
              <Section style={{
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '12px',
                padding: '14px 18px',
                margin: '0 0 24px',
              }}>
                <Text style={{ fontSize: '13px', color: '#78350f', margin: 0 }}>
                  🌟 <strong>Special offer:</strong> {specialOffer}
                </Text>
              </Section>
            ) : null}

            <Section style={featureBox}>
              <Text style={featureTitle}>What you get on renewal</Text>
              <Text style={featureItem}>• Uninterrupted premium access</Text>
              <Text style={featureItem}>• Same trusted support &amp; warranty</Text>
              <Text style={featureItem}>• Best price guarantee in Bangladesh</Text>
            </Section>

            <div style={{ textAlign: 'center' as const }}>
              <Button style={buttonStyle} href={renewUrl}>Renew Now</Button>
            </div>

            {orderNumber ? (
              <Text style={{ ...footerStyle, marginTop: '20px' }}>
                Reference order: <strong>{orderNumber}</strong>
              </Text>
            ) : null}

            <div style={dividerStyle} />
            <Text style={footerStyle}>
              Need help renewing? Reply to this email or contact our support team — we&apos;re happy to help.
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
  component: SubscriptionRenewalReminder,
  subject: (d: Props) =>
    d?.productName
      ? `Reminder: Your ${d.productName} subscription ${typeof d.daysLeft === 'number' && d.daysLeft < 0 ? 'has expired' : 'is expiring soon'}`
      : 'Your subscription is expiring soon',
  displayName: 'Subscription Renewal Reminder',
  previewData: {
    customerName: 'Rahul Ahmed',
    productName: 'Microsoft 365 Family (1 Year)',
    expiryDate: '20 May 2026',
    daysLeft: 5,
    renewUrl: 'https://shahedstore.com.bd/shop',
    orderNumber: 'SS-1042',
  },
} satisfies TemplateEntry

export default SubscriptionRenewalReminder
