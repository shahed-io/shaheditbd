/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailLayout, H1, P, CTA, Small, InfoBox, Brand } from './_layout.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, confirmationUrl }: InviteEmailProps) => (
  <EmailLayout preview={`You've been invited to join ${siteName || Brand.name}`}>
    <H1>You're invited 🎁</H1>
    <P>
      You've been invited to join <strong>{siteName || Brand.name}</strong>.
      Click below to accept the invitation and set up your account.
    </P>
    <CTA href={confirmationUrl}>Accept Invitation</CTA>
    <InfoBox>
      Get instant access to premium digital products, software, and exclusive member benefits.
    </InfoBox>
    <Small>
      If you weren't expecting this invitation, you can safely ignore this email.
    </Small>
  </EmailLayout>
)

export default InviteEmail
