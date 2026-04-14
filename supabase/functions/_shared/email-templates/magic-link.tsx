/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  main, wrapper, headerStyle, logoStyle, brandName, contentStyle, h1Style, subtitleStyle,
  buttonStyle, dividerStyle, footerStyle, footerSection, linkStyle, copyrightStyle, LOGO_URL, SITE_URL,
} from './_styles.ts'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{siteName}-এ লগইন লিংক</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <Img src={LOGO_URL} width="180" height="50" alt={siteName} style={logoStyle} />
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>লগইন লিংক</Heading>
          <Text style={subtitleStyle}>
            {siteName}-এ লগইন করতে নিচের বাটনে ক্লিক করুন। এই লিংকটি অল্প সময়ের জন্য কার্যকর থাকবে।
          </Text>

          <Button style={buttonStyle} href={confirmationUrl}>
            লগইন করুন
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            যদি আপনি এই লিংক অনুরোধ না করে থাকেন, এই ইমেইলটি উপেক্ষা করুন।
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={{ ...footerStyle, margin: '0' }}>
            <Link href={SITE_URL} style={linkStyle}>{SITE_URL}</Link>
          </Text>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {siteName}. সর্বস্বত্ব সংরক্ষিত।
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
