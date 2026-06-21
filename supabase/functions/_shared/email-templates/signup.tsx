/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to get started with Handy Hans English</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome aboard! 🎉</Heading>
        <Text style={text}>
          Thanks for signing up to{' '}
          <Link href={siteUrl} style={link}>
            <strong>Handy Hans English</strong>
          </Link>
          . I'm Hans and I'm really pleased you're here.
        </Text>
        <Text style={text}>
          Please confirm your email address ({recipient}) by clicking the button
          below — then you can book a lesson, join a live group class, or grab
          your free PDF.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm my email
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <Text style={signoff}>— Hans</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: 'hsl(210, 70%, 52%)', textDecoration: 'underline' }
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
