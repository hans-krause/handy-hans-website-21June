import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Handy Hans English'

interface PdfSignupConfirmationProps {
  name?: string
  confirmUrl?: string
}

const PdfSignupConfirmationEmail = ({
  name,
  confirmUrl,
}: PdfSignupConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to get Hans's Top 20 Evil English Errors PDF</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>One quick click to get your PDF</Heading>
        <Text style={text}>Hi {name || 'there'},</Text>
        <Text style={text}>
          Thanks for requesting <strong>Hans's Top 20 Evil English Errors</strong>!
          Please confirm your email address so I know it's really you — then I'll
          send your PDF straight over.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button style={button} href={confirmUrl}>Confirm my email</Button>
        </Section>
        <Text style={small}>
          Or copy and paste this link into your browser:<br />
          <Link href={confirmUrl} style={{ color: '#2563eb' }}>{confirmUrl}</Link>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request this, you can safely ignore this email — no list
          will be joined and no PDF will be sent.
        </Text>
        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PdfSignupConfirmationEmail,
  subject: 'Confirm your email to get your free PDF',
  displayName: 'Free PDF — email confirmation',
  previewData: {
    name: 'Jane',
    confirmUrl: 'https://www.handyhansenglish.com/confirm-signup?token=preview-token',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const small = { fontSize: '12px', color: '#64748b', lineHeight: '1.6', margin: '0 0 14px' }
const button = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '999px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '8px 0' }
