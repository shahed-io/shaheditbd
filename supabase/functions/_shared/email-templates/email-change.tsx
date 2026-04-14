/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  textStyle, emailBadgeStyle, buttonStyle, dividerStyle, footerStyle, footerSection,
  linkStyle, copyrightStyle, LOGO_URL, SITE_URL,
} from './_styles.ts'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{siteName} - Email বদল confirm করুন</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <div style={logoCardStyle}>
            <Img src={LOGO_URL} width="240" height="65" alt={siteName} style={logoStyle} />
          </div>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>Email বদল confirm করুন</Heading>
          <Text style={subtitleStyle}>
            আপনার {siteName} account-এ email বদল করার অনুরোধ এসেছে.
          </Text>
          <Text style={textStyle}>
            <strong>এখনকার email:</strong> {email}{'\n'}
            <strong>নতুন email:</strong> {newEmail}
          </Text>

          <Button style={buttonStyle} href={confirmationUrl}>
            Email বদল confirm করুন
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            আপনি যদি এই অনুরোধ না করে থাকেন, account safe রাখুন.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={{ ...footerStyle, margin: '0' }}>
            <Link href={SITE_URL} style={linkStyle}>{SITE_URL}</Link>
          </Text>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {siteName}. সব অধিকার রাখা আছে.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
