/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  textStyle, emailBadgeStyle, buttonStyle, dividerStyle, footerStyle, footerSection,
  linkStyle, copyrightStyle, LOGO_URL, SITE_URL,
} from './_styles.ts'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{siteName} — ইমেইল পরিবর্তন নিশ্চিত করুন</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <div style={logoCardStyle}>
            <Img src={LOGO_URL} width="160" height="44" alt={siteName} style={logoStyle} />
          </div>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>ইমেইল পরিবর্তন নিশ্চিত করুন</Heading>
          <Text style={subtitleStyle}>
            আপনার {siteName} অ্যাকাউন্টের ইমেইল পরিবর্তনের অনুরোধ পাওয়া গেছে:
          </Text>
          <Text style={textStyle}>
            <strong>বর্তমান:</strong> {email}{'\n'}
            <strong>নতুন:</strong> {newEmail}
          </Text>

          <Button style={buttonStyle} href={confirmationUrl}>
            ইমেইল পরিবর্তন নিশ্চিত করুন
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            যদি আপনি এই পরিবর্তন অনুরোধ না করে থাকেন, অনুগ্রহ করে অবিলম্বে আপনার অ্যাকাউন্ট সুরক্ষিত করুন।
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

export default EmailChangeEmail
