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
      <Container style={container}>
        <Section style={header}>
          <Img src={`${siteUrl}/logo.png`} width="140" height="44" alt={siteName} style={{ display: 'block', objectFit: 'contain' }} />
        </Section>
        <Section style={content}>
          <Heading style={h1}>পাসওয়ার্ড রিসেট 🔑</Heading>
          <Text style={text}>
            আপনার {siteName} অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার অনুরোধ পাওয়া গেছে।
          </Text>
          <Button style={button} href={confirmationUrl}>
            🔐 নতুন পাসওয়ার্ড সেট করুন
          </Button>
          <Text style={footer}>
            যদি আপনি এই অনুরোধ না করে থাকেন, এই ইমেইলটি উপেক্ষা করুন। আপনার পাসওয়ার্ড পরিবর্তন হবে না।
          </Text>
          <Text style={footerLink}>
            <Link href={siteUrl} style={link}>{siteUrl}</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#f5f5f7', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { maxWidth: '560px', margin: '32px auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(100,60,200,0.10)' }
const header = { background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '10px' }
const brandName = { color: '#ffffff', fontSize: '20px', fontWeight: '800', margin: '0 0 0 8px', display: 'inline-block', verticalAlign: 'middle' }
const content = { padding: '28px 28px 20px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: 'hsl(226,35%,12%)', margin: '0 0 14px' }
const text = { fontSize: '14px', color: 'hsl(220,15%,40%)', lineHeight: '1.6', margin: '0 0 22px' }
const button = { backgroundColor: 'hsl(258,78%,55%)', color: '#ffffff', fontSize: '15px', fontWeight: '700', borderRadius: '12px', padding: '13px 26px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '26px 0 4px' }
const footerLink = { fontSize: '12px', margin: '0' }
const link = { color: 'hsl(258,78%,55%)', textDecoration: 'none' }
