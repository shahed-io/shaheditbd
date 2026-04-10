/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface WelcomeEmailProps {
  customerName?: string
}

const WelcomeEmail = ({
  customerName = 'কাস্টমার',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={logoText}>Shahed Store</Text>
          </Section>

          <Section style={contentStyle}>
            <Text style={headingStyle}>স্বাগতম, {customerName}! 🎉</Text>
            <Text style={textStyle}>
              Shahed Store-এ যোগ দেওয়ার জন্য ধন্যবাদ! আমরা বাংলাদেশের সেরা ডিজিটাল প্রোডাক্ট সরবরাহ করি — সফটওয়্যার লাইসেন্স, গেমিং কী এবং আরও অনেক কিছু।
            </Text>

            <Section style={featureBoxStyle}>
              <Text style={featureTitle}>আপনার জন্য যা আছে:</Text>
              <Text style={featureItem}>✅ নিরাপদ ও অথেন্টিক প্রোডাক্ট</Text>
              <Text style={featureItem}>⚡ দ্রুত ডেলিভারি (১–২৪ ঘন্টা)</Text>
              <Text style={featureItem}>💰 সেরা মূল্য গ্যারান্টি</Text>
              <Text style={featureItem}>🎁 রেফারেল বোনাস ও পয়েন্ট সিস্টেম</Text>
            </Section>

            <Button style={buttonStyle} href="https://shahedstore.lovable.app/shop">
              প্রোডাক্ট দেখুন
            </Button>

            <Text style={footerNote}>
              কোনো সাহায্যের প্রয়োজন হলে আমাদের সাপোর্ট টিমে যোগাযোগ করুন।
            </Text>
          </Section>

          <Section style={footerStyle}>
            <Text style={footerText}>© {new Date().getFullYear()} Shahed Store. সর্বস্বত্ব সংরক্ষিত।</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle: React.CSSProperties = { backgroundColor: '#f4f4f7', fontFamily: "'Segoe UI', Arial, sans-serif", margin: '0', padding: '20px 0' }
const containerStyle: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
const headerStyle: React.CSSProperties = { backgroundColor: '#7C3AED', padding: '24px', textAlign: 'center' as const }
const logoText: React.CSSProperties = { fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0' }
const contentStyle: React.CSSProperties = { padding: '32px 28px' }
const headingStyle: React.CSSProperties = { fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 16px' }
const textStyle: React.CSSProperties = { fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 16px' }
const featureBoxStyle: React.CSSProperties = { backgroundColor: '#f8f5ff', borderRadius: '10px', padding: '20px', margin: '16px 0' }
const featureTitle: React.CSSProperties = { fontSize: '14px', fontWeight: '700', color: '#7C3AED', margin: '0 0 12px' }
const featureItem: React.CSSProperties = { fontSize: '13px', color: '#444', margin: '0 0 8px' }
const buttonStyle: React.CSSProperties = { backgroundColor: '#7C3AED', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', margin: '8px 0 16px' }
const footerNote: React.CSSProperties = { fontSize: '12px', color: '#999', margin: '0' }
const footerStyle: React.CSSProperties = { backgroundColor: '#f8f8fa', padding: '16px', textAlign: 'center' as const }
const footerText: React.CSSProperties = { fontSize: '11px', color: '#aaa', margin: '0' }

export const template = {
  component: WelcomeEmail,
  subject: 'স্বাগতম Shahed Store-এ! 🎉',
  displayName: 'ওয়েলকাম ইমেইল',
  previewData: {
    customerName: 'রাহুল আহমেদ',
  },
} satisfies TemplateEntry

export default WelcomeEmail
