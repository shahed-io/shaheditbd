/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  buttonStyle, dividerStyle, footerStyle, footerSection, linkStyle, copyrightStyle, LOGO_URL, SITE_URL,
} from './_styles.ts'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>{siteName}-এ Login link</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <div style={logoCardStyle}>
            <Img src={LOGO_URL} width="240" height="65" alt={siteName} style={logoStyle} />
          </div>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>Login link</Heading>
          <Text style={subtitleStyle}>
            {siteName}-এ login করতে নিচের button-এ চাপ দিন. এই link কম time কাজ করবে.
          </Text>

          <Button style={buttonStyle} href={confirmationUrl}>
            Login করুন
          </Button>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            আপনি যদি এই link না চান, email ignore করুন.
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

export default MagicLinkEmail
