/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  featureBox, featureTitle, buttonStyle, dividerStyle,
  footerStyle, footerSection, linkStyle, copyrightStyle, LOGO_URL,
} from './_styles.ts'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
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

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{siteName}-এ আপনাকে আমন্ত্রণ জানানো হয়েছে</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <div style={logoCardStyle}>
            <Img src={LOGO_URL} width="240" height="65" alt={siteName} style={logoStyle} />
          </div>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>আপনাকে আমন্ত্রণ জানানো হয়েছে</Heading>
          <Text style={subtitleStyle}>
            <Link href={siteUrl} style={linkStyle}><strong>{siteName}</strong></Link>-এ যোগ দিতে আপনাকে আমন্ত্রণ জানানো হয়েছে।
            নিচের বাটনে ক্লিক করে আমন্ত্রণ গ্রহণ করুন এবং আপনার অ্যাকাউন্ট তৈরি করুন।
          </Text>

          <Section style={featureBox}>
            <Text style={featureTitle}>আপনার জন্য যা আছে:</Text>
            <Text style={featureRow}>
              <span style={bullet}>✓</span> নিরাপদ ও অথেন্টিক প্রোডাক্টস
            </Text>
            <Text style={featureRow}>
              <span style={bullet}>✓</span> দ্রুত ডেলিভারি (১-২৪ ঘন্টা)
            </Text>
            <Text style={featureRow}>
              <span style={bullet}>✓</span> সেরা মূল্য গ্যারান্টি
            </Text>
            <Text style={{ ...featureRow, margin: '0' }}>
              <span style={bullet}>✓</span> রেফারেল বোনাস ও পয়েন্ট সিস্টেম
            </Text>
          </Section>

          <Button style={buttonStyle} href={confirmationUrl}>
            আমন্ত্রণ গ্রহণ করুন
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            যদি আপনি এই আমন্ত্রণ আশা না করে থাকেন, এই ইমেইলটি উপেক্ষা করুন।
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={{ ...footerStyle, margin: '0' }}>
            কোনো সাহায্যের প্রয়োজন হলে আমাদের সাপোর্ট টিমে যোগাযোগ করুন।
          </Text>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {siteName}. সর্বস্বত্ব সংরক্ষিত।
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
