// Shared email styles for all auth templates
const BRAND_PURPLE = '#7c3aed';
const BRAND_PURPLE_LIGHT = '#ede9fe';
const BRAND_PURPLE_BORDER = '#c4b5fd';
const SITE_URL = 'https://shahedstore.com.bd';
const LOGO_URL = `${SITE_URL}/logo.png`;

export { BRAND_PURPLE, BRAND_PURPLE_LIGHT, BRAND_PURPLE_BORDER, SITE_URL, LOGO_URL };

export const main = {
  backgroundColor: '#f3f0ff',
  fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  padding: '24px 0',
} as const;

export const wrapper = {
  maxWidth: '580px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden' as const,
  boxShadow: '0 4px 32px rgba(124,58,237,0.08)',
} as const;

export const headerStyle = {
  background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%)',
  padding: '32px 32px',
  textAlign: 'center' as const,
  borderRadius: '16px 16px 0 0',
} as const;

export const logoCardStyle = {
  display: 'inline-block' as const,
} as const;

export const logoStyle = {
  display: 'block' as const,
  margin: '0 auto',
  objectFit: 'contain' as const,
} as const;

export const brandName = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#ffffff',
  margin: '0',
  letterSpacing: '0.5px',
} as const;

export const contentStyle = {
  padding: '32px 32px 24px',
} as const;

export const h1Style = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#1e1b4b',
  margin: '0 0 8px',
  lineHeight: '1.3',
} as const;

export const subtitleStyle = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: '0 0 24px',
} as const;

export const textStyle = {
  fontSize: '14px',
  color: '#374151',
  lineHeight: '1.7',
  margin: '0 0 20px',
} as const;

export const featureBox = {
  backgroundColor: '#faf5ff',
  border: '1px solid #e9d5ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px',
} as const;

export const featureTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#1e1b4b',
  margin: '0 0 12px',
} as const;

export const featureItem = {
  fontSize: '13px',
  color: '#4b5563',
  lineHeight: '1.8',
  margin: '0',
} as const;

export const buttonStyle = {
  backgroundColor: BRAND_PURPLE,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700' as const,
  borderRadius: '10px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block' as const,
  textAlign: 'center' as const,
} as const;

export const emailBadgeStyle = {
  fontSize: '13px',
  color: BRAND_PURPLE,
  background: BRAND_PURPLE_LIGHT,
  border: `1px solid ${BRAND_PURPLE_BORDER}`,
  borderRadius: '8px',
  padding: '8px 16px',
  margin: '0 0 24px',
  display: 'inline-block' as const,
  fontWeight: '500' as const,
} as const;

export const codeBlockStyle = {
  fontFamily: "'SF Mono', 'Fira Code', Courier, monospace",
  fontSize: '28px',
  fontWeight: '700' as const,
  color: BRAND_PURPLE,
  backgroundColor: BRAND_PURPLE_LIGHT,
  border: `1px solid ${BRAND_PURPLE_BORDER}`,
  borderRadius: '10px',
  padding: '14px 24px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
  letterSpacing: '4px',
  display: 'inline-block' as const,
} as const;

export const dividerStyle = {
  borderTop: '1px solid #e5e7eb',
  margin: '24px 0',
} as const;

export const footerStyle = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0 0 4px',
  lineHeight: '1.5',
} as const;

export const footerSection = {
  padding: '20px 32px',
  borderTop: '1px solid #f3f0ff',
  textAlign: 'center' as const,
} as const;

export const linkStyle = {
  color: BRAND_PURPLE,
  textDecoration: 'none',
  fontWeight: '500' as const,
} as const;

export const copyrightStyle = {
  fontSize: '11px',
  color: '#d1d5db',
  margin: '8px 0 0',
} as const;
