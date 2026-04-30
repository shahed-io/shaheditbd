/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  featureBox, featureTitle, buttonStyle, footerStyle, footerSection,
  copyrightStyle, LOGO_URL,
} from '../email-templates/_styles.ts'

interface CidAccountCredentialsProps {
  customerName?: string
  email?: string
  password?: string
  initialCredit?: number
  loginUrl?: string
}

const credLabel = {
  fontSize: '12px',
  color: '#6b7280',
  fontWeight: '600' as const,
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
} as const

const credValue = {
  fontSize: '15px',
  color: '#111827',
  fontWeight: '700' as const,
  margin: '0 0 14px',
  fontFamily: 'monospace, monospace',
  wordBreak: 'break-all' as const,
} as const

const noticeBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fcd34d',
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

const CidAccountCredentialsEmail = ({
  customerName = 'Customer',
  email = '',
  password = '',
  initialCredit = 0,
  loginUrl = 'https://shahedstore.com.bd/get-cid',
}: CidAccountCredentialsProps) => {
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
              Your <strong>CID (Confirmation ID)</strong> account has been created by our admin team.
              Below are your login credentials — please keep them safe.
            </Text>

            <Section style={featureBox}>
              <Text style={featureTitle}>Your Account Credentials</Text>

              <Text style={credLabel}>Email</Text>
              <Text style={credValue}>{email}</Text>

              <Text style={credLabel}>Password</Text>
              <Text style={credValue}>{password}</Text>

              {initialCredit > 0 && (
                <>
                  <Text style={credLabel}>Initial CID Credits</Text>
                  <Text style={{ ...credValue, color: '#7c3aed' }}>{initialCredit} credits</Text>
                </>
              )}
            </Section>

            <Section style={noticeBox}>
              <Text style={noticeText}>
                <strong>Security tip:</strong> Please change your password after your first login.
                Never share these credentials with anyone.
              </Text>
            </Section>

            <Button style={buttonStyle} href={loginUrl}>
              Login & Get CID
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
  component: CidAccountCredentialsEmail,
  subject: 'Your CID Account Credentials - Shahed Store',
  displayName: 'CID Account Credentials',
  previewData: {
    customerName: 'Rahul Ahmed',
    email: 'rahul@example.com',
    password: 'TempPass123!',
    initialCredit: 50,
    loginUrl: 'https://shahedstore.com.bd/get-cid',
  },
} satisfies TemplateEntry

export default CidAccountCredentialsEmail
