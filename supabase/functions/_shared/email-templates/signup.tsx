/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{siteName}-এ আপনার ইমেইল যাচাই করুন</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={`${siteUrl}/logo.png`} width="140" height="44" alt={siteName} style={{ display: 'block', objectFit: 'contain' }} />
        </Section>
        <Section style={content}>
          <Heading style={h1}>স্বাগতম! ইমেইল যাচাই করুন 🎉</Heading>
          <Text style={text}>
            <strong>{siteName}</strong>-এ সাইন আপ করার জন্য ধন্যবাদ! আপনার অ্যাকাউন্ট সক্রিয় করতে নিচের বাটনে ক্লিক করুন।
          </Text>
          <Text style={emailBadge}>{recipient}</Text>
          <Button style={button} href={confirmationUrl}>
            ✉️ ইমেইল যাচাই করুন
          </Button>
          <Text style={footer}>
            যদি আপনি এই অ্যাকাউন্ট তৈরি না করে থাকেন, এই ইমেইলটি উপেক্ষা করুন।
          </Text>
          <Text style={footerLink}>
            <Link href={siteUrl} style={link}>{siteUrl}</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#f5f5f7', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { maxWidth: '560px', margin: '32px auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(100,60,200,0.10)' }
const header = { background: '#ffffff', padding: '20px 28px', borderBottom: '3px solid hsl(258,78%,55%)' }
const content = { padding: '28px 28px 20px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: 'hsl(226,35%,12%)', margin: '0 0 14px' }
const text = { fontSize: '14px', color: 'hsl(220,15%,40%)', lineHeight: '1.6', margin: '0 0 18px' }
const emailBadge = { fontSize: '13px', color: 'hsl(258,78%,50%)', background: 'hsla(258,78%,55%,0.08)', border: '1px solid hsla(258,78%,55%,0.20)', borderRadius: '8px', padding: '8px 14px', margin: '0 0 22px', display: 'inline-block' }
const button = { backgroundColor: 'hsl(258,78%,55%)', color: '#ffffff', fontSize: '15px', fontWeight: '700', borderRadius: '12px', padding: '13px 26px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '26px 0 4px' }
const footerLink = { fontSize: '12px', margin: '0' }
const link = { color: 'hsl(258,78%,55%)', textDecoration: 'none' }
