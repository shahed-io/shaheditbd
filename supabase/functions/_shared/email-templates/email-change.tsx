/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  textStyle, emailBadgeStyle, buttonStyle, dividerStyle, footerStyle, footerSection,
  linkStyle, copyrightStyle, LOGO_URL, brandNameRow, brandNameShahed, brandNameStore, brandTagline, SITE_URL,
} from './_styles.ts'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
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
          <Heading style={h1Style}>Confirm your email change</Heading>
          <Text style={subtitleStyle}>
            We received a request to change the email on your {siteName} account.
          </Text>
          <Text style={textStyle}>
            <strong>Current email:</strong> {email}{'\n'}
            <strong>New email:</strong> {newEmail}
          </Text>

          <Button style={buttonStyle} href={confirmationUrl}>
            Confirm email change
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            If you did not request this change, please secure your account.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={{ ...footerStyle, margin: '0' }}>
            <Link href={SITE_URL} style={linkStyle}>{SITE_URL}</Link>
          </Text>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
