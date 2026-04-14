/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  main, wrapper, headerStyle, logoStyle, brandName, contentStyle, h1Style, subtitleStyle,
  textStyle, buttonStyle, dividerStyle, footerStyle, footerSection, linkStyle, copyrightStyle, LOGO_URL,
} from './_styles.ts'

interface RecoveryEmailProps {
  siteName: string
  siteUrl?: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  siteUrl = 'https://shahedstore.com.bd',
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{siteName} — পাসওয়ার্ড রিসেট করুন</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <Img src={LOGO_URL} width="48" height="48" alt={siteName} style={{ ...logoStyle, marginBottom: '8px' }} />
          <Heading style={brandName}>{siteName}</Heading>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>পাসওয়ার্ড রিসেট করুন</Heading>
          <Text style={subtitleStyle}>
            আপনার <strong>{siteName}</strong> অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার অনুরোধ পাওয়া গেছে।
            নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।
          </Text>

          <Button style={buttonStyle} href={confirmationUrl}>
            নতুন পাসওয়ার্ড সেট করুন
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            যদি আপনি এই অনুরোধ না করে থাকেন, এই ইমেইলটি উপেক্ষা করুন। আপনার পাসওয়ার্ড পরিবর্তন হবে না।
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={{ ...footerStyle, margin: '0' }}>
            <Link href={siteUrl} style={linkStyle}>{siteUrl}</Link>
          </Text>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {siteName}. সর্বস্বত্ব সংরক্ষিত।
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
