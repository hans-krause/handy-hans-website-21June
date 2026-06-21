import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Handy Hans English'
const OWNER_EMAIL = 'hello@handyhansenglish.com'

interface ContactNotificationProps {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const ContactNotificationEmail = ({
  name,
  email,
  subject,
  message,
}: ContactNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form message{name ? ` from ${name}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New contact form message</Heading>
        <Text style={text}>You've received a new message via the {SITE_NAME} contact form.</Text>
        <Section style={card}>
          <Text style={label}>From</Text>
          <Text style={value}>{name || 'Unknown'} {email ? `<${email}>` : ''}</Text>
          <Hr style={hr} />
          <Text style={label}>Subject</Text>
          <Text style={value}>{subject || '(no subject)'}</Text>
          <Hr style={hr} />
          <Text style={label}>Message</Text>
          <Text style={{ ...value, whiteSpace: 'pre-wrap' }}>{message || ''}</Text>
        </Section>
        <Text style={footer}>Reply directly to this person at {email || 'their email address'}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) => {
    const userSubject = data?.subject && String(data.subject).trim()
      ? String(data.subject).trim()
      : `New message${data?.name ? ` from ${data.name}` : ''}`
    return `[Contact form] ${userSubject}`
  },
  to: OWNER_EMAIL,
  displayName: 'Contact form notification',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    subject: 'Question about group classes',
    message: 'Hi Hans, I would love to know more about your group classes!',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 20px' }
const card = { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }
const label = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#64748b', margin: '0 0 4px', fontWeight: 600 }
const value = { fontSize: '14px', color: '#0f172a', margin: '0 0 12px', lineHeight: '1.5' }
const hr = { borderColor: '#e2e8f0', margin: '12px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '24px 0 0' }
