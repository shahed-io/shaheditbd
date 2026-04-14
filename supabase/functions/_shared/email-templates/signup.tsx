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
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{siteName}-এ email confirm করুন</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <div style={logoCardStyle}>
            <Img src={LOGO_URL} width="240" height="65" alt={siteName} style={logoStyle} />
          </div>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>Email confirm করুন</Heading>
          <Text style={subtitleStyle}>
            <strong>{siteName}</strong>-এ join করার জন্য ধন্যবাদ. আপনার account চালু করতে নিচের button-এ চাপ দিন.
          </Text>
          <Text style={emailBadgeStyle}>{recipient}</Text>

          <Section style={featureBox}>
            <Text style={featureTitle}>কি কি পাবেন:</Text>
            <Text style={featureRow}>
              <span style={bullet}>✓</span> নিরাপদ ও আসল item
            </Text>
            <Text style={featureRow}>
              <span style={bullet}>✓</span> 1-24 ঘন্টায় ডেলিভারি
            </Text>
            <Text style={featureRow}>
              <span style={bullet}>✓</span> ভাল দাম
            </Text>
            <Text style={{ ...featureRow, margin: '0' }}>
              <span style={bullet}>✓</span> বোনাস ও point
            </Text>
          </Section>

          <Button style={buttonStyle} href={confirmationUrl}>
            Email confirm করুন
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            আপনি যদি account না খুলে থাকেন, এই email ignore করুন.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={{ ...footerStyle, margin: '0' }}>
            সাহায্য লাগলে support team-এ জানাবেন.
          </Text>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {siteName}. সব অধিকার রাখা আছে.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
