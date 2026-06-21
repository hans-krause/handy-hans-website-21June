/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Handy Hans English verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm it's you</Heading>
        <Text style={text}>
          Use the code below to confirm your identity on Handy Hans English:
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request it, you can
          safely ignore this email.
        </Text>
        <Text style={signoff}>— Hans</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', Arial, sans-serif",
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontSize: '26px',
  fontWeight: 600 as const,
  color: 'hsl(215, 35%, 18%)',
  letterSpacing: '-0.02em',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(215, 16%, 40%)',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 700 as const,
  color: 'hsl(210, 70%, 52%)',
  letterSpacing: '0.15em',
  margin: '0 0 30px',
}
const footer = {
  fontSize: '13px',
  color: 'hsl(215, 16%, 55%)',
  margin: '30px 0 10px',
}
const signoff = {
  fontSize: '14px',
  color: 'hsl(215, 35%, 18%)',
  margin: '6px 0 0',
}
