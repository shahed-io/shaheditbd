/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Hr, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface OrderConfirmationProps {
  customerName?: string
  orderNumber?: string
  orderTotal?: string
  orderItems?: Array<{ name: string; quantity: number; price: string }>
  paymentMethod?: string
}

const OrderConfirmation = ({
  customerName = 'কাস্টমার',
  orderNumber = 'ORD-XXXXXXXX',
  orderTotal = '৳0',
  orderItems = [{ name: 'Sample Product', quantity: 1, price: '৳500' }],
  paymentMethod = 'bKash',
}: OrderConfirmationProps) => {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={logoText}>Shahed Store</Text>
          </Section>

          <Section style={contentStyle}>
            <Text style={greetingStyle}>আসসালামু আলাইকুম, {customerName}! 👋</Text>
            <Text style={headingStyle}>আপনার অর্ডার সফলভাবে গৃহীত হয়েছে! 🎉</Text>
            <Text style={textStyle}>
              আপনার অর্ডার নম্বর: <strong style={{ color: '#7C3AED' }}>{orderNumber}</strong>
            </Text>

            <Section style={orderBoxStyle}>
              <Text style={orderBoxTitle}>অর্ডার সারাংশ</Text>
              {orderItems.map((item, i) => (
                <Text key={i} style={itemStyle}>
                  {item.name} × {item.quantity} — {item.price}
                </Text>
              ))}
              <Hr style={dividerStyle} />
              <Text style={totalStyle}>মোট: {orderTotal}</Text>
              <Text style={paymentStyle}>পেমেন্ট: {paymentMethod}</Text>
            </Section>

            <Text style={textStyle}>
              পেমেন্ট যাচাইয়ের পর আপনার প্রোডাক্ট ডেলিভারি করা হবে।
              সাধারণত ১–২৪ ঘন্টার মধ্যে ডেলিভারি সম্পন্ন হয়।
            </Text>

            <Button style={buttonStyle} href="https://shahedstore.lovable.app/dashboard">
              আমার অর্ডার দেখুন
            </Button>

            <Text style={footerNote}>
              কোনো প্রশ্ন থাকলে আমাদের সাপোর্টে যোগাযোগ করুন।
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
const greetingStyle: React.CSSProperties = { fontSize: '15px', color: '#555', margin: '0 0 8px' }
const headingStyle: React.CSSProperties = { fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 16px' }
const textStyle: React.CSSProperties = { fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 16px' }
const orderBoxStyle: React.CSSProperties = { backgroundColor: '#f8f5ff', borderRadius: '10px', padding: '20px', margin: '16px 0' }
const orderBoxTitle: React.CSSProperties = { fontSize: '14px', fontWeight: '700', color: '#7C3AED', margin: '0 0 12px' }
const itemStyle: React.CSSProperties = { fontSize: '13px', color: '#444', margin: '0 0 6px' }
const dividerStyle: React.CSSProperties = { borderColor: '#e0d4f5', margin: '12px 0' }
const totalStyle: React.CSSProperties = { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 4px' }
const paymentStyle: React.CSSProperties = { fontSize: '13px', color: '#777', margin: '0' }
const buttonStyle: React.CSSProperties = { backgroundColor: '#7C3AED', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', margin: '8px 0 16px' }
const footerNote: React.CSSProperties = { fontSize: '12px', color: '#999', margin: '0' }
const footerStyle: React.CSSProperties = { backgroundColor: '#f8f8fa', padding: '16px', textAlign: 'center' as const }
const footerText: React.CSSProperties = { fontSize: '11px', color: '#aaa', margin: '0' }

export const template = {
  component: OrderConfirmation,
  subject: (data: OrderConfirmationProps) => `অর্ডার নিশ্চিত — ${data.orderNumber || 'Shahed Store'}`,
  displayName: 'অর্ডার কনফার্মেশন',
  previewData: {
    customerName: 'রাহুল আহমেদ',
    orderNumber: 'ORD-ABC12345',
    orderTotal: '৳1,500',
    orderItems: [
      { name: 'Windows 11 Pro Key', quantity: 1, price: '৳800' },
      { name: 'Office 365 License', quantity: 1, price: '৳700' },
    ],
    paymentMethod: 'bKash',
  },
} satisfies TemplateEntry

export default OrderConfirmation
