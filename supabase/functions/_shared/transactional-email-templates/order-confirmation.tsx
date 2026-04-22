/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Html, Head, Body, Container, Section, Text, Button, Hr, Img } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  featureBox, featureTitle, buttonStyle, dividerStyle, footerStyle, footerSection,
  copyrightStyle, LOGO_URL,
} from '../email-templates/_styles.ts'

interface OrderConfirmationProps {
  customerName?: string
  orderNumber?: string
  orderTotal?: string
  orderItems?: Array<{ name: string; quantity: number; price: string }>
  paymentMethod?: string
}

const textStyle = {
  fontSize: '14px',
  color: '#555',
  lineHeight: '1.6',
  margin: '0 0 16px',
} as const

const itemStyle = {
  fontSize: '13px',
  color: '#444',
  margin: '0 0 6px',
} as const

const totalStyle = {
  fontSize: '16px',
  fontWeight: '700' as const,
  color: '#1a1a2e',
  margin: '0 0 4px',
} as const

const paymentStyle = {
  fontSize: '13px',
  color: '#777',
  margin: '0',
} as const

const orderDivider = {
  borderColor: '#e0d4f5',
  margin: '12px 0',
} as const

const OrderConfirmation = ({
  customerName = 'Customer',
  orderNumber = 'ORD-XXXXXXXX',
  orderTotal = '0 BDT',
  orderItems = [{ name: 'Sample Product', quantity: 1, price: '500 BDT' }],
  paymentMethod = 'BKash',
}: OrderConfirmationProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Body style={main}>
        <Container style={wrapper}>
          <Section style={headerStyle}>
            <div style={logoCardStyle}>
              <Img src={LOGO_URL} width="240" height="65" alt="Shahed Store" style={logoStyle} />
            </div>
          </Section>

          <Section style={contentStyle}>
            <Text style={h1Style}>Order Confirmed!</Text>
            <Text style={subtitleStyle}>
              Hello {customerName}, your order has been received successfully. Order number: <strong style={{ color: '#7C3AED' }}>{orderNumber}</strong>
            </Text>

            <Section style={featureBox}>
              <Text style={featureTitle}>Order Summary</Text>
              {orderItems.map((item, i) => (
                <Text key={i} style={itemStyle}>
                  {item.name} x {item.quantity} - {item.price}
                </Text>
              ))}
              <Hr style={orderDivider} />
              <Text style={totalStyle}>Total: {orderTotal}</Text>
              <Text style={paymentStyle}>Payment: {paymentMethod}</Text>
            </Section>

            <Text style={textStyle}>
              Your product will be delivered after payment verification. Delivery is usually completed within 1-24 hours.
            </Text>

            <Button style={buttonStyle} href="https://shahedstore.lovable.app/dashboard">
              View My Orders
            </Button>

            <Text style={footerStyle}>
              Have questions? Contact our support team.
            </Text>
          </Section>

          <Section style={footerSection}>
            <Text style={copyrightStyle}>
              &copy; {new Date().getFullYear()} Shahed Store. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderConfirmation,
  subject: (data: OrderConfirmationProps) => `Order Confirmed - ${data.orderNumber || 'Shahed Store'}`,
  displayName: 'Order Confirmation',
  previewData: {
    customerName: 'Rahul Ahmed',
    orderNumber: 'ORD-ABC12345',
    orderTotal: '1,500 BDT',
    orderItems: [
      { name: 'Windows 11 Pro Key', quantity: 1, price: '800 BDT' },
      { name: 'Office 365 License', quantity: 1, price: '700 BDT' },
    ],
    paymentMethod: 'BKash',
  },
} satisfies TemplateEntry

export default OrderConfirmation
