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
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <div style={logoCardStyle}>
            <Img src={LOGO_URL} width="240" height="65" alt={SITE_NAME} style={logoStyle} />
          </div>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>Enter this code</Heading>
          <Text style={subtitleStyle}>
            Use the code below to continue.
          </Text>
          <Text style={codeBlockStyle}>{token}</Text>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            This code will expire soon. If you did not request it, you can ignore this email.
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
