/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Link } from 'npm:@react-email/components@0.0.22'
import { EmailLayout, H1, P, CTA, Small, InfoBox, Brand } from './_layout.tsx'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

const linkStyle = { color: Brand.primary, textDecoration: 'none', fontWeight: 600 } as const

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <EmailLayout preview={`Confirm your email change for ${siteName || Brand.name}`}>
    <H1>Confirm your email change ✉️</H1>
    <P>
      You requested to change the email address on your {siteName || Brand.name} account
      from <Link href={`mailto:${oldEmail}`} style={linkStyle}>{oldEmail}</Link>{' '}
      to <Link href={`mailto:${newEmail}`} style={linkStyle}>{newEmail}</Link>.
    </P>
    <P>Click the button below to confirm this change:</P>
    <CTA href={confirmationUrl}>Confirm Email Change</CTA>
    <InfoBox>
      ⚠️ If you didn't request this change, please secure your account immediately by resetting your password.
    </InfoBox>
    <Small>This confirmation link will expire shortly for your security.</Small>
  </EmailLayout>
)

export default EmailChangeEmail
