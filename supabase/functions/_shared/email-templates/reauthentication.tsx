/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  main, wrapper, headerStyle, logoCardStyle, logoStyle, contentStyle, h1Style, subtitleStyle,
  codeBlockStyle, dividerStyle, footerStyle, footerSection, copyrightStyle, LOGO_URL,
} from './_styles.ts'

interface ReauthenticationEmailProps {
  token: string
}

const SITE_NAME = 'Shahed Store'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="bn" dir="ltr">
    <Head />
    <Preview>আপনার code</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <div style={logoCardStyle}>
            <Img src={LOGO_URL} width="240" height="65" alt={SITE_NAME} style={logoStyle} />
          </div>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>Code দিন</Heading>
          <Text style={subtitleStyle}>
            আপনার code নিচে দেওয়া আছে:
          </Text>
          <Text style={codeBlockStyle}>{token}</Text>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            এই code কম time কাজ করবে. আপনি না চাইলে email ignore করুন.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {SITE_NAME}. সব অধিকার রাখা আছে.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
