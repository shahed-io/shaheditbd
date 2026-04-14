/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  featureBox, featureTitle, buttonStyle, emailBadgeStyle, dividerStyle,
  footerStyle, footerSection, copyrightStyle, LOGO_URL,
} from './_styles.ts'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const featureRow = {
  fontSize: '13px',
  color: '#4b5563',
  lineHeight: '1.4',
  margin: '0 0 8px',
  paddingLeft: '8px',
} as const;

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
} as const;

export const SignupEmail = ({ siteName, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <div style={logoCardStyle}>
            <Img src={LOGO_URL} width="240" height="65" alt={siteName} style={logoStyle} />
          </div>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>Confirm your email</Heading>
          <Text style={subtitleStyle}>
            Thanks for joining <strong>{siteName}</strong>. Click the button below to activate your account.
          </Text>
          <Text style={emailBadgeStyle}>{recipient}</Text>

          <Section style={featureBox}>
            <Text style={featureTitle}>What you get</Text>
            <Text style={featureRow}>
              <span style={bullet}>✓</span> Safe and authentic items
            </Text>
            <Text style={featureRow}>
              <span style={bullet}>✓</span> Fast delivery in 1-24 hours
            </Text>
            <Text style={featureRow}>
              <span style={bullet}>✓</span> Good prices
            </Text>
            <Text style={{ ...featureRow, margin: '0' }}>
              <span style={bullet}>✓</span> Bonus and points
            </Text>
          </Section>

          <Button style={buttonStyle} href={confirmationUrl}>
            Confirm email
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            If you did not create this account, you can ignore this email.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={{ ...footerStyle, margin: '0' }}>
            Need help? Contact our support team.
          </Text>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
