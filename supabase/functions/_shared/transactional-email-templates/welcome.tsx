/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  featureBox, featureTitle, buttonStyle, dividerStyle, footerStyle, footerSection,
  copyrightStyle, LOGO_URL,
} from '../email-templates/_styles.ts'

interface WelcomeEmailProps {
  customerName?: string
}

const featureRow = {
  fontSize: '13px',
  color: '#4b5563',
  lineHeight: '1.4',
  margin: '0 0 8px',
  paddingLeft: '8px',
} as const

const bullet = {
  display: 'inline-block' as const,
  width: '18px',
  height: '18px',
  borderRadius: '4px',
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '700' as const,
  textAlign: 'center' as const,
  lineHeight: '18px',
  marginRight: '10px',
  verticalAlign: 'middle' as const,
} as const

const WelcomeEmail = ({
  customerName = 'Customer',
}: WelcomeEmailProps) => {
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
            <Text style={h1Style}>Welcome, {customerName}!</Text>
            <Text style={subtitleStyle}>
              Thank you for joining <strong>Shahed Store</strong>. We provide the best digital products in Bangladesh — software licenses, gaming keys, and much more.
            </Text>

            <Section style={featureBox}>
              <Text style={featureTitle}>What you get</Text>
              <Text style={featureRow}>
                <span style={bullet}>&#10003;</span> Safe and authentic products
              </Text>
              <Text style={featureRow}>
                <span style={bullet}>&#10003;</span> Fast delivery in 1-24 hours
              </Text>
              <Text style={featureRow}>
                <span style={bullet}>&#10003;</span> Best price guarantee
              </Text>
              <Text style={{ ...featureRow, margin: '0' }}>
                <span style={bullet}>&#10003;</span> Referral bonus and points system
              </Text>
            </Section>

            <Button style={buttonStyle} href="https://shahedstore.lovable.app/shop">
              Browse Products
            </Button>

            <Text style={footerStyle}>
              Need help? Contact our support team anytime.
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
  component: WelcomeEmail,
  subject: 'Welcome to Shahed Store!',
  displayName: 'Welcome Email',
  previewData: {
    customerName: 'Rahul Ahmed',
  },
} satisfies TemplateEntry

export default WelcomeEmail
