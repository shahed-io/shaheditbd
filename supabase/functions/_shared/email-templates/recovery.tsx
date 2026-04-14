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
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <div style={logoCardStyle}>
              <Img src={LOGO_URL} width="56" height="56" alt="Shahed Store" style={logoStyle} />
            </div>
            <div style={brandNameRow}>
              <span style={brandNameShahed}>Shahed</span>
              <span style={brandNameStore}>Store</span>
            </div>
            <Text style={brandTagline}>shahedstore.com.bd</Text>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>Reset your password</Heading>
          <Text style={subtitleStyle}>
            We received a request to reset the password for your <strong>{siteName}</strong> account.
            Click the button below to set a new password.
          </Text>

          <Button style={buttonStyle} href={confirmationUrl}>
            Set new password
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            If you did not request this, you can ignore this email.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={{ ...footerStyle, margin: '0' }}>
            <Link href={siteUrl} style={linkStyle}>{siteUrl}</Link>
          </Text>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
