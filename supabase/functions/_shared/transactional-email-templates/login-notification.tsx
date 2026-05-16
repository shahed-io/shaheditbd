/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Img, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  featureBox, buttonStyle, footerStyle, footerSection, copyrightStyle, LOGO_URL,
} from '../email-templates/_styles.ts'

interface LoginNotificationProps {
  customerName?: string
  email?: string
  ipAddress?: string
  device?: string
  browser?: string
  os?: string
  location?: string
  loginTime?: string
  isAdmin?: boolean
}

const detailRow = {
  fontSize: '13px',
  color: '#1f2937',
  lineHeight: '1.5',
  margin: '0 0 10px',
  padding: '0',
} as const

const labelStyle = {
  display: 'inline-block' as const,
  width: '110px',
  color: '#6b7280',
  fontWeight: '600' as const,
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.4px',
} as const

const valueStyle = {
  color: '#111827',
  fontWeight: '600' as const,
  fontSize: '13px',
} as const

const alertBox = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  borderRadius: '8px',
  padding: '12px 14px',
  margin: '20px 0 0',
} as const

const LoginNotificationEmail = ({
  customerName = 'Customer',
  email = '',
  ipAddress = 'Unknown',
  device = 'Unknown device',
  browser = 'Unknown browser',
  os = 'Unknown OS',
  location = 'Unknown location',
  loginTime = new Date().toUTCString(),
  isAdmin = false,
}: LoginNotificationProps) => {
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
            <Text style={h1Style}>
              {isAdmin ? '🛡️ Admin Sign-in Alert' : '🔐 New Sign-in to Your Account'}
            </Text>
            <Text style={subtitleStyle}>
              Hi {customerName}, we noticed a sign-in to your <strong>Shahed Store</strong> account.
              If this was you, no action is needed. If you don't recognize this activity, please reset your password immediately.
            </Text>

            <Section style={featureBox}>
              <Text style={{ ...detailRow, marginBottom: '14px', fontWeight: '700', fontSize: '14px', color: '#7c3aed' }}>
                Sign-in details
              </Text>
              {email && (
                <Text style={detailRow}>
                  <span style={labelStyle}>Account</span>
                  <span style={valueStyle}>{email}</span>
                </Text>
              )}
              <Text style={detailRow}>
                <span style={labelStyle}>Time</span>
                <span style={valueStyle}>{loginTime}</span>
              </Text>
              <Text style={detailRow}>
                <span style={labelStyle}>IP address</span>
                <span style={valueStyle}>{ipAddress}</span>
              </Text>
              <Text style={detailRow}>
                <span style={labelStyle}>Location</span>
                <span style={valueStyle}>{location}</span>
              </Text>
              <Text style={detailRow}>
                <span style={labelStyle}>Device</span>
                <span style={valueStyle}>{device}</span>
              </Text>
              <Text style={detailRow}>
                <span style={labelStyle}>Operating system</span>
                <span style={valueStyle}>{os}</span>
              </Text>
              <Text style={{ ...detailRow, margin: '0' }}>
                <span style={labelStyle}>Browser</span>
                <span style={valueStyle}>{browser}</span>
              </Text>
            </Section>

            <Section style={alertBox}>
              <Text style={{ fontSize: '13px', color: '#92400e', margin: '0', lineHeight: '1.5' }}>
                <strong>⚠️ Wasn't you?</strong> Secure your account immediately — change your password and review your account activity.
              </Text>
            </Section>

            <Button style={{ ...buttonStyle, marginTop: '22px' }} href="https://shahedstore.com.bd/dashboard">
              Review Account Activity
            </Button>

            <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />

            <Text style={footerStyle}>
              This is an automated security notification. For your safety, we send a sign-in alert every time someone accesses your account.
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
  component: LoginNotificationEmail,
  subject: (data: LoginNotificationProps) =>
    data?.isAdmin
      ? '🛡️ Admin sign-in alert — Shahed Store'
      : '🔐 New sign-in to your Shahed Store account',
  displayName: 'Login Notification',
  previewData: {
    customerName: 'Rahul Ahmed',
    email: 'rahul@example.com',
    ipAddress: '103.73.47.48',
    device: 'iPhone 14',
    browser: 'Safari 17',
    os: 'iOS 17.2',
    location: 'Dhaka, Bangladesh',
    loginTime: new Date().toUTCString(),
    isAdmin: false,
  },
} satisfies TemplateEntry

export default LoginNotificationEmail
