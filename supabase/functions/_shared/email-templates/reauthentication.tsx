/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { EmailLayout, H1, P, Code, WarningBox } from './_layout.tsx'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailLayout preview="Your verification code" footerNote="Security Notification">
    <H1>Verification Code</H1>
    <P>
      A verification is required to continue. Use the code below — it expires in 10 minutes.
    </P>
    <Code>{token}</Code>
    <WarningBox>
      If you did not request this code, ignore this email and immediately change your account password. Never share this code with anyone.
    </WarningBox>
  </EmailLayout>
)

export default ReauthenticationEmail
