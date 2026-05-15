/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailLayout, H1, P, CTA, Small, InfoBox, Brand } from './_layout.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <EmailLayout preview={`Reset your password for ${siteName || Brand.name}`}>
    <H1>Reset your password 🔐</H1>
    <P>
      We received a request to reset the password for your {siteName || Brand.name} account.
      Click the button below to choose a new password.
    </P>
    <CTA href={confirmationUrl}>Reset Password</CTA>
    <InfoBox>
      For your security, this link will expire shortly. If it expires, simply request a new one from the login page.
    </InfoBox>
    <Small>
      If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
    </Small>
  </EmailLayout>
)

export default RecoveryEmail
