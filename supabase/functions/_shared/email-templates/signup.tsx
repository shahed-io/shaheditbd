/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Link } from 'npm:@react-email/components@0.0.22'
import { EmailLayout, H1, P, CTA, Small, InfoBox, Brand } from './_layout.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, recipient, confirmationUrl }: SignupEmailProps) => (
  <EmailLayout preview={`Confirm your email for ${siteName || Brand.name}`}>
    <H1>Welcome to {siteName || Brand.name} 🎉</H1>
    <P>
      Thanks for signing up! Please confirm your email address{' '}
      (<Link href={`mailto:${recipient}`} style={{ color: Brand.primary, textDecoration: 'none', fontWeight: 600 }}>{recipient}</Link>){' '}
      to activate your account.
    </P>
    <CTA href={confirmationUrl}>Verify Email Address</CTA>
    <InfoBox>
      Once verified, you'll get instant access to premium digital software, exclusive offers, and 24/7 support.
    </InfoBox>
    <Small>
      Didn't sign up? You can safely ignore this email — no account will be created.
    </Small>
  </EmailLayout>
)

export default SignupEmail
