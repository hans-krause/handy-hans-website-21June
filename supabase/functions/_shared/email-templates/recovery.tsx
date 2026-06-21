/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your Handy Hans English password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset the password for your Handy Hans
          English account. Click the button below to choose a new one.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reset my password
        </Button>
        <Text style={footer}>
          If you didn't request this, you can safely ignore this email — your
          password will not be changed.
        </Text>
        <Text style={signoff}>— Hans</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
const button = {
  background: '#2563eb',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '14px',
  padding: '14px 24px',
  textDecoration: 'none',
  display: 'inline-block',
  lineHeight: '1.2',
  textAlign: 'center' as const,
  border: '1px solid #2563eb',
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
