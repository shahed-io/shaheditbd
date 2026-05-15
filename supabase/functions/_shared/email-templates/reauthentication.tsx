/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailLayout, H1, P, Code, Small, InfoBox } from './_layout.tsx'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailLayout preview="Your verification code">
    <H1>Confirm reauthentication 🔒</H1>
    <P>Use the verification code below to confirm your identity:</P>
    <Code>{token}</Code>
    <InfoBox>
      This code will expire shortly. Never share it with anyone — our team will never ask for this code.
    </InfoBox>
    <Small>
      If you didn't request this, you can safely ignore this email and consider changing your password.
    </Small>
  </EmailLayout>
)

export default ReauthenticationEmail
