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
  primaryLight: '#f5f1ff',
  primaryBorder: '#c4b5fd',
  ink: '#0f172a',
  text: '#374151',
  muted: '#6b7280',
  faint: '#9ca3af',
  page: '#f4f1fb',
  card: '#ffffff',
  border: '#ece9f7',
  warnBg: '#fff8f1',
  warnBorder: '#fcd9b6',
  warnInk: '#7c3a18',
}

interface LayoutProps {
  preview: string
  footerNote?: string
  children: React.ReactNode
}

export const EmailLayout = ({ preview, footerNote, children }: LayoutProps) => (
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

        <Hr style={s.divider} />

        {/* Content */}
        <Section style={s.content}>{children}</Section>

        {/* Footer */}
        <Hr style={s.divider} />
        <Section style={s.footer}>
          <Text style={s.copyright}>
            © {new Date().getFullYear()} {BRAND.name}
            {footerNote ? ` — ${footerNote}` : ''}
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
  <table cellPadding={0} cellSpacing={0} style={{ margin: '12px 0 28px' }}>
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
  <Section style={s.codeWrap}>
    <Text style={s.code}>{children}</Text>
  </Section>
)
export const Meta = ({ items }: { items: Array<[string, React.ReactNode]> }) => (
  <Section style={{ margin: '4px 0 20px' }}>
    {items.map(([k, v], i) => (
      <Text key={i} style={s.metaRow}>
        <span style={s.metaKey}>{k}:</span> <span style={s.metaVal}>{v}</span>
      </Text>
    ))}
  </Section>
)
export const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <Section style={s.infoBox}><Text style={s.infoText}>{children}</Text></Section>
)
export const WarningBox = ({ children }: { children: React.ReactNode }) => (
  <Section style={s.warnBox}>
    <Text style={s.warnText}>
      <span style={{ marginRight: 6 }}>⚠️</span>{children}
    </Text>
  </Section>
)
export const Brand = BRAND

const s = {
  main: {
    backgroundColor: BRAND.page,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    margin: 0,
    padding: '40px 16px',
  } as const,
  outer: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: BRAND.card,
    borderRadius: '14px',
    overflow: 'hidden' as const,
    boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 30px -12px rgba(124,58,237,0.18)',
    border: `1px solid ${BRAND.border}`,
  } as const,
  header: {
    backgroundColor: '#ffffff',
    padding: '32px 32px 28px',
    textAlign: 'center' as const,
  } as const,
  logo: {
    display: 'block',
    margin: '0 auto',
    maxWidth: '200px',
    height: 'auto',
    objectFit: 'contain' as const,
  } as const,
  divider: { borderTop: `1px solid ${BRAND.border}`, margin: 0 } as const,
  content: { padding: '32px 36px 28px' } as const,
  h1: {
    fontSize: '22px',
    fontWeight: 700 as const,
    color: BRAND.ink,
    lineHeight: '1.3',
    margin: '0 0 14px',
    letterSpacing: '-0.01em',
  } as const,
  p: {
    fontSize: '15px',
    color: BRAND.text,
    lineHeight: '1.65',
    margin: '0 0 16px',
  } as const,
  small: {
    fontSize: '13px',
    color: BRAND.muted,
    lineHeight: '1.6',
    margin: '20px 0 0',
  } as const,
  btnCell: {
    backgroundColor: BRAND.primary,
    borderRadius: '10px',
    boxShadow: '0 6px 16px -6px rgba(124,58,237,0.5)',
  } as const,
  btn: {
    display: 'inline-block',
    padding: '13px 30px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600 as const,
    textDecoration: 'none',
    letterSpacing: '0.2px',
  } as const,
  codeWrap: { margin: '8px 0 24px' } as const,
  code: {
    fontFamily: "'SF Mono', 'Fira Code', Menlo, Courier, monospace",
    fontSize: '34px',
    fontWeight: 700 as const,
    color: BRAND.primaryDark,
    backgroundColor: BRAND.primaryLight,
    border: `2px dashed ${BRAND.primaryBorder}`,
    borderRadius: '14px',
    padding: '22px 24px',
    margin: 0,
    textAlign: 'center' as const,
    letterSpacing: '10px',
  } as const,
  metaRow: { fontSize: '13px', color: BRAND.text, lineHeight: '1.7', margin: '0 0 2px' } as const,
  metaKey: { fontWeight: 700 as const, color: BRAND.ink } as const,
  metaVal: { color: BRAND.muted } as const,
  infoBox: {
    backgroundColor: BRAND.primaryLight,
    border: `1px solid ${BRAND.primaryBorder}`,
    borderRadius: '12px',
    padding: '14px 18px',
    margin: '0 0 8px',
  } as const,
  infoText: {
    fontSize: '13px',
    color: BRAND.ink,
    lineHeight: '1.6',
    margin: 0,
  } as const,
  warnBox: {
    backgroundColor: BRAND.warnBg,
    border: `1px solid ${BRAND.warnBorder}`,
    borderRadius: '12px',
    padding: '14px 18px',
    margin: '4px 0 8px',
  } as const,
  warnText: {
    fontSize: '13px',
    color: BRAND.warnInk,
    lineHeight: '1.6',
    margin: 0,
  } as const,
  footer: {
    padding: '18px 32px 22px',
    textAlign: 'center' as const,
    backgroundColor: '#ffffff',
  } as const,
  copyright: { fontSize: '12px', color: BRAND.faint, margin: 0, letterSpacing: '0.2px' } as const,
}

export const styles = s
