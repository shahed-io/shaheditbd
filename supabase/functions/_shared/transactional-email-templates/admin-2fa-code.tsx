/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  footerSection, copyrightStyle, LOGO_URL,
} from '../email-templates/_styles.ts'

interface Admin2FACodeProps {
  code?: string
  requestedByEmail?: string
  ip?: string
  expiresInMinutes?: number
}

const codeBox = {
  margin: '24px auto',
  padding: '20px 28px',
  borderRadius: '14px',
  background: '#f3f0ff',
  border: '2px dashed #7c3aed',
  textAlign: 'center' as const,
  fontSize: '32px',
  letterSpacing: '12px',
  fontWeight: 700 as const,
  color: '#4c1d95',
  fontFamily: 'monospace',
} as const

const warnBox = {
  marginTop: '20px',
  padding: '12px 16px',
  borderRadius: '10px',
  background: '#fff7ed',
  border: '1px solid #fdba74',
  color: '#9a3412',
  fontSize: '12px',
  lineHeight: '1.5',
} as const

const Admin2FACodeEmail = ({
  code = '000000',
  requestedByEmail = 'admin@shahedstore.com.bd',
  ip = '',
  expiresInMinutes = 10,
}: Admin2FACodeProps) => (
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
          <Text style={h1Style}>Admin Login Verification Code</Text>
          <Text style={subtitleStyle}>
            A login attempt to the <strong>Shahed Store Admin Panel</strong> requires verification.
            Use the code below to continue. This code expires in {expiresInMinutes} minutes.
          </Text>
          <div style={codeBox}>{code}</div>
          <Text style={{ ...subtitleStyle, fontSize: '13px' }}>
            <strong>Requested by:</strong> {requestedByEmail}<br />
            {ip ? <><strong>IP:</strong> {ip}<br /></> : null}
            <strong>Time:</strong> {new Date().toUTCString()}
          </Text>
          <div style={warnBox}>
            ⚠ If you did not request this code, ignore this email and immediately change the admin
            account password. Never share this code with anyone.
          </div>
        </Section>
        <Section style={footerSection}>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} Shahed Store — Admin Security Notification
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Admin2FACodeEmail,
  subject: (data: Admin2FACodeProps) => `🔐 Admin Login Code: ${data?.code ?? ''}`,
  displayName: 'Admin 2FA Code',
  previewData: {
    code: '482915',
    requestedByEmail: 'admin@shahedstore.com.bd',
    ip: '203.0.113.42',
    expiresInMinutes: 10,
  },
} satisfies TemplateEntry

export default Admin2FACodeEmail
