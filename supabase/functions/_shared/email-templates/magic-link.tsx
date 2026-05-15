/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailLayout, H1, P, CTA, Small, InfoBox, Brand } from './_layout.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <EmailLayout preview={`Your login link for ${siteName || Brand.name}`}>
    <H1>Your secure login link ✨</H1>
    <P>
      Click the button below to log in to {siteName || Brand.name} instantly — no password required.
    </P>
    <CTA href={confirmationUrl}>Log In Securely</CTA>
    <InfoBox>
      This link is single-use and will expire shortly for your security.
    </InfoBox>
    <Small>
      If you didn't request this link, you can safely ignore this email.
    </Small>
  </EmailLayout>
)

export default MagicLinkEmail
