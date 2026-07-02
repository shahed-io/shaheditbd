import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  offerTitle?: string
  rank?: number
  prize?: string | null
}

const Email = ({ name, offerTitle, rank, prize }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Congratulations! You won our giveaway 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🎉 Congratulations{name ? `, ${name}` : ''}!</Heading>
        </Section>
        <Section style={content}>
          <Text style={p}>
            You have been selected as a <strong>winner</strong> in our giveaway
            {offerTitle ? <> — <strong>{offerTitle}</strong></> : null}.
          </Text>
          {typeof rank === 'number' ? (
            <Text style={p}>Winning position: <strong>#{rank}</strong></Text>
          ) : null}
          {prize ? (
            <Section style={prizeBox}>
              <Text style={prizeLabel}>Your Prize</Text>
              <Text style={prizeText}>{prize}</Text>
            </Section>
          ) : null}
          <Text style={p}>Our team will contact you shortly regarding prize delivery. You can also check your account dashboard for updates.</Text>
          <Button href="https://shahedstore.com.bd/dashboard" style={btn}>Open Dashboard</Button>
          <Hr style={hr} />
          <Text style={muted}>Thank you for participating with Shahed Store.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `🎉 You won${d?.offerTitle ? ` — ${d.offerTitle}` : ''}!`,
  displayName: 'Giveaway Winner',
  previewData: { name: 'Rahim', offerTitle: 'Weekly Giveaway', rank: 1, prize: 'Microsoft 365 (1 Year)' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const header = { textAlign: 'center' as const, paddingBottom: '16px' }
const h1 = { fontSize: '26px', color: '#111827', margin: '0 0 8px' }
const content = { padding: '8px 4px' }
const p = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 12px' }
const prizeBox = { background: 'linear-gradient(135deg,#7c3aed10,#0ea5e910)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 18px', margin: '16px 0' }
const prizeLabel = { fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: 0 }
const prizeText = { fontSize: '18px', color: '#111827', fontWeight: 700, margin: '4px 0 0' }
const btn = { backgroundColor: '#7c3aed', color: '#ffffff', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const muted = { fontSize: '12px', color: '#9ca3af', textAlign: 'center' as const }
