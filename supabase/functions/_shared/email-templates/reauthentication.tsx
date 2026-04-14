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
    <Preview>আপনার ভেরিফিকেশন কোড</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={headerStyle}>
          <div style={logoCardStyle}>
            <Img src={LOGO_URL} width="160" height="44" alt={SITE_NAME} style={logoStyle} />
          </div>
        </Section>

        <Section style={contentStyle}>
          <Heading style={h1Style}>পরিচয় নিশ্চিত করুন</Heading>
          <Text style={subtitleStyle}>
            আপনার পরিচয় নিশ্চিত করতে নিচের কোডটি ব্যবহার করুন:
          </Text>
          <Text style={codeBlockStyle}>{token}</Text>

          <Hr style={dividerStyle} />
          <Text style={footerStyle}>
            এই কোডটি অল্প সময়ের জন্য কার্যকর থাকবে। যদি আপনি এই অনুরোধ না করে থাকেন, এই ইমেইলটি উপেক্ষা করুন।
          </Text>
        </Section>

        <Section style={footerSection}>
          <Text style={copyrightStyle}>
            &copy; {new Date().getFullYear()} {SITE_NAME}. সর্বস্বত্ব সংরক্ষিত।
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
