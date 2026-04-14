/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  main, wrapper, headerStyle, logoStyle, brandName, contentStyle, h1Style, subtitleStyle,
  textStyle, featureBox, featureTitle, featureItem, buttonStyle, dividerStyle,
  footerStyle, footerSection, linkStyle, copyrightStyle, LOGO_URL,
} from './_styles.ts'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{siteName}-এ আপনাকে আমন্ত্রণ জানানো হয়েছে</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <Img src={LOGO_URL} width="48" height="48" alt={siteName} style={{ ...logoStyle, marginBottom: '8px' }} />
          <Heading style={brandName}>{siteName}</Heading>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>আপনাকে আমন্ত্রণ জানানো হয়েছে</Heading>
          <Text style={subtitleStyle}>
            <Link href={siteUrl} style={linkStyle}><strong>{siteName}</strong></Link>-এ যোগ দিতে আপনাকে আমন্ত্রণ জানানো হয়েছে।
            নিচের বাটনে ক্লিক করে আমন্ত্রণ গ্রহণ করুন এবং আপনার অ্যাকাউন্ট তৈরি করুন।
          </Text>

          <Section style={featureBox}>
            <Text style={featureTitle}>আপনার জন্য যা আছে:</Text>
            <Text style={featureItem}>
              &#x2714;&#xFE0E; নিরাপদ ও অথেন্টিক প্রোডাক্টস{'\n'}
              &#x26A1;&#xFE0E; দ্রুত ডেলিভারি (১-২৪ ঘন্টা){'\n'}
              &#x1F4B0;&#xFE0E; সেরা মূল্য গ্যারান্টি{'\n'}
              &#x1F381;&#xFE0E; রেফারেল বোনাস ও পয়েন্ট সিস্টেম
            </Text>
          </Section>

          <Button style={buttonStyle} href={confirmationUrl}>
            আমন্ত্রণ গ্রহণ করুন
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            যদি আপনি এই আমন্ত্রণ আশা না করে থাকেন, এই ইমেইলটি উপেক্ষা করুন।
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={{ ...footerStyle, margin: '0' }}>
            কোনো সাহায্যের প্রয়োজন হলে আমাদের সাপোর্ট টিমে যোগাযোগ করুন।
          </Text>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {siteName}. সর্বস্বত্ব সংরক্ষিত।
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
