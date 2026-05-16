/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  featureBox, featureTitle, buttonStyle, footerStyle, footerSection,
  copyrightStyle, LOGO_URL,
} from '../email-templates/_styles.ts'

interface CidDeliveryProps {
  customerName?: string
  installationId?: string
  confirmationId?: string
  remainingCredits?: number
  generatedAt?: string
}

const label = {
  fontSize: '12px',
  color: '#6b7280',
  fontWeight: '600' as const,
  margin: '0 0 6px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
} as const

const valueMono = {
  fontSize: '15px',
  color: '#111827',
  fontWeight: '700' as const,
  margin: '0 0 16px',
  fontFamily: 'monospace, monospace',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '10px 12px',
} as const

const cidValueStyle = {
  ...valueMono,
  fontSize: '17px',
  color: '#7c3aed',
  backgroundColor: '#f5f3ff',
  border: '1px solid #ddd6fe',
  letterSpacing: '1px',
} as const

const noticeBox = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '16px 0',
} as const

const noticeText = {
  fontSize: '13px',
  color: '#065f46',
  margin: '0',
  lineHeight: '1.5',
} as const

const formatCID = (raw: string) => {
  const clean = raw.replace(/[^0-9]/g, '')
  return clean.length === 48 ? clean.match(/.{1,6}/g)!.join('-') : raw
}

const CidDeliveryEmail = ({
  customerName = 'Customer',
  installationId = '',
  confirmationId = '',
  remainingCredits = 0,
  generatedAt = '',
}: CidDeliveryProps) => {
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
            <Text style={h1Style}>Your Confirmation ID is Ready 🎉</Text>
            <Text style={subtitleStyle}>
              Hi {customerName}, your Microsoft Confirmation ID has been generated successfully.
              Use it in the Microsoft phone activation wizard to activate your product.
            </Text>

            <Section style={featureBox}>
              <Text style={featureTitle}>Generation Details</Text>

              <Text style={label}>Installation ID (Order ID)</Text>
              <Text style={valueMono}>{installationId}</Text>

              <Text style={label}>Confirmation ID (CID)</Text>
              <Text style={cidValueStyle}>{formatCID(confirmationId)}</Text>

              {generatedAt && (
                <>
                  <Text style={label}>Generated At</Text>
                  <Text style={{ ...valueMono, fontSize: '13px', backgroundColor: 'transparent', border: 'none', padding: 0 }}>
                    {generatedAt}
                  </Text>
                </>
              )}

              <Text style={label}>Remaining CID Credits</Text>
              <Text style={{ ...valueMono, color: '#7c3aed', backgroundColor: 'transparent', border: 'none', padding: 0 }}>
                {remainingCredits} credits
              </Text>
            </Section>

            <Section style={noticeBox}>
              <Text style={noticeText}>
                <strong>How to use:</strong> Open the Microsoft activation wizard on your computer,
                select "Phone activation", and type the Confirmation ID above when prompted.
              </Text>
            </Section>

            <Button style={buttonStyle} href="https://shahedstore.com.bd/get-cid">
              Generate Another CID
            </Button>

            <Text style={footerStyle}>
              Save this email for your records. Need help? Contact our support team anytime.
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
  component: CidDeliveryEmail,
  subject: (data: any) =>
    `Your Confirmation ID - Order #${String(data?.installationId || '').slice(0, 12)}`,
  displayName: 'CID Delivery',
  previewData: {
    customerName: 'Rahul Ahmed',
    installationId: '123456-789012-345678-901234-567890-123456-789012-345678',
    confirmationId: '123456789012345678901234567890123456789012345678',
    remainingCredits: 12,
    generatedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

export default CidDeliveryEmail
