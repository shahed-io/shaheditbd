/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  textStyle, buttonStyle, dividerStyle, footerStyle, footerSection, linkStyle, copyrightStyle, LOGO_URL,
} from './_styles.ts'

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
    <Preview>{siteName} - Password reset</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <div style={logoCardStyle}>
            <Img src={LOGO_URL} width="240" height="65" alt={siteName} style={logoStyle} />
          </div>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>Password reset</Heading>
          <Text style={subtitleStyle}>
            আপনার <strong>{siteName}</strong> account-এর Password বদল করার অনুরোধ এসেছে.
            নিচের button-এ চাপ দিয়ে নতুন Password দিন.
          </Text>

          <Button style={buttonStyle} href={confirmationUrl}>
            নতুন Password দিন
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            আপনি যদি এই অনুরোধ না করে থাকেন, email ignore করুন.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={{ ...footerStyle, margin: '0' }}>
            <Link href={siteUrl} style={linkStyle}>{siteUrl}</Link>
          </Text>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {siteName}. সব অধিকার রাখা আছে.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
