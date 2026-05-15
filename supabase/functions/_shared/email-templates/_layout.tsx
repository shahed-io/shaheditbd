/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

export const BRAND = {
  name: 'Shahed Store',
  url: 'https://shahedstore.com.bd',
  logo: 'https://dpvdavjwqyviredzoorj.supabase.co/storage/v1/object/public/email-assets/logo-email.png',
  primary: '#7c3aed',
  primaryDark: '#6d28d9',
  primaryLight: '#ede9fe',
  primaryBorder: '#c4b5fd',
  ink: '#1e1b4b',
  text: '#374151',
  muted: '#6b7280',
  faint: '#9ca3af',
  bg: '#ffffff',
  page: '#f5f3ff',
  card: '#ffffff',
  border: '#ece9f7',
}

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

export const EmailLayout = ({ preview, children }: LayoutProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={s.main}>
      <Container style={s.outer}>
        {/* Header with logo */}
        <Section style={s.header}>
          <Link href={BRAND.url} style={{ textDecoration: 'none' }}>
            <Img
              src={BRAND.logo}
              alt={BRAND.name}
              width="180"
              style={s.logo}
            />
          </Link>
        </Section>

        {/* Gradient accent bar */}
        <div style={s.accentBar} />

        {/* Content card */}
        <Section style={s.content}>{children}</Section>

        {/* Footer */}
        <Hr style={s.hr} />
        <Section style={s.footer}>
          <Text style={s.footerBrand}>
            <Link href={BRAND.url} style={s.footerBrandLink}>{BRAND.name}</Link>
          </Text>
          <Text style={s.footerText}>
            Bangladesh's trusted digital software marketplace
          </Text>
          <Text style={s.footerLinks}>
            <Link href={`${BRAND.url}/help`} style={s.footerLink}>Help Center</Link>
            {' · '}
            <Link href={`${BRAND.url}/contact`} style={s.footerLink}>Contact</Link>
            {' · '}
            <Link href={`${BRAND.url}/privacy`} style={s.footerLink}>Privacy</Link>
          </Text>
          <Text style={s.copyright}>
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// ---- Premium primitives ----
export const H1 = ({ children }: { children: React.ReactNode }) => (
  <Text style={s.h1}>{children}</Text>
)
export const P = ({ children }: { children: React.ReactNode }) => (
  <Text style={s.p}>{children}</Text>
)
export const Small = ({ children }: { children: React.ReactNode }) => (
  <Text style={s.small}>{children}</Text>
)
export const CTA = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <table cellPadding={0} cellSpacing={0} style={{ margin: '8px 0 24px' }}>
    <tbody>
      <tr>
        <td style={s.btnCell}>
          <Link href={href} style={s.btn}>{children}</Link>
        </td>
      </tr>
    </tbody>
  </table>
)
export const Code = ({ children }: { children: React.ReactNode }) => (
  <Text style={s.code}>{children}</Text>
)
export const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <Section style={s.infoBox}><Text style={s.infoText}>{children}</Text></Section>
)
export const Brand = BRAND

const s = {
  main: {
    backgroundColor: BRAND.page,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    margin: 0,
    padding: '32px 16px',
  } as const,
  outer: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: BRAND.card,
    borderRadius: '20px',
    overflow: 'hidden' as const,
    boxShadow: '0 10px 40px -10px rgba(124,58,237,0.18), 0 2px 8px rgba(124,58,237,0.06)',
    border: `1px solid ${BRAND.border}`,
  } as const,
  header: {
    backgroundColor: '#ffffff',
    padding: '32px 32px 24px',
    textAlign: 'center' as const,
  } as const,
  logo: {
    display: 'block',
    margin: '0 auto',
    maxWidth: '180px',
    height: 'auto',
    objectFit: 'contain' as const,
  } as const,
  accentBar: {
    height: '4px',
    background: `linear-gradient(90deg, ${BRAND.primary} 0%, #a78bfa 50%, ${BRAND.primary} 100%)`,
  } as const,
  content: { padding: '36px 36px 8px' } as const,
  h1: {
    fontSize: '24px',
    fontWeight: 700 as const,
    color: BRAND.ink,
    lineHeight: '1.3',
    margin: '0 0 16px',
    letterSpacing: '-0.01em',
  } as const,
  p: {
    fontSize: '15px',
    color: BRAND.text,
    lineHeight: '1.7',
    margin: '0 0 18px',
  } as const,
  small: {
    fontSize: '13px',
    color: BRAND.muted,
    lineHeight: '1.6',
    margin: '24px 0 0',
  } as const,
  btnCell: {
    backgroundColor: BRAND.primary,
    borderRadius: '12px',
    boxShadow: '0 6px 16px -4px rgba(124,58,237,0.45)',
  } as const,
  btn: {
    display: 'inline-block',
    padding: '14px 32px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 700 as const,
    textDecoration: 'none',
    letterSpacing: '0.2px',
  } as const,
  code: {
    fontFamily: "'SF Mono', 'Fira Code', Menlo, Courier, monospace",
    fontSize: '32px',
    fontWeight: 700 as const,
    color: BRAND.primary,
    backgroundColor: BRAND.primaryLight,
    border: `1px solid ${BRAND.primaryBorder}`,
    borderRadius: '12px',
    padding: '18px 24px',
    margin: '8px 0 24px',
    textAlign: 'center' as const,
    letterSpacing: '8px',
  } as const,
  infoBox: {
    backgroundColor: '#faf5ff',
    border: `1px solid ${BRAND.primaryBorder}`,
    borderRadius: '12px',
    padding: '14px 18px',
    margin: '0 0 20px',
  } as const,
  infoText: {
    fontSize: '13px',
    color: BRAND.ink,
    lineHeight: '1.6',
    margin: 0,
  } as const,
  hr: { borderTop: `1px solid ${BRAND.border}`, margin: '8px 0 0' } as const,
  footer: {
    padding: '24px 32px 28px',
    textAlign: 'center' as const,
    backgroundColor: '#fafaff',
  } as const,
  footerBrand: { fontSize: '14px', fontWeight: 700 as const, color: BRAND.ink, margin: '0 0 4px' } as const,
  footerBrandLink: { color: BRAND.ink, textDecoration: 'none' } as const,
  footerText: { fontSize: '12px', color: BRAND.muted, margin: '0 0 12px' } as const,
  footerLinks: { fontSize: '12px', color: BRAND.muted, margin: '0 0 8px' } as const,
  footerLink: { color: BRAND.primary, textDecoration: 'none', fontWeight: 500 as const } as const,
  copyright: { fontSize: '11px', color: BRAND.faint, margin: '8px 0 0' } as const,
}

export const styles = s
