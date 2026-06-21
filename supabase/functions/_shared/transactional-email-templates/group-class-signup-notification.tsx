import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Handy Hans English'
const OWNER_EMAIL = 'hello@handyhansenglish.com'

interface Props {
  name?: string
  email?: string
  courseName?: string
  amount?: string
  environment?: string
  classDay?: string
}

const Email = ({ name, email, courseName, amount, environment, classDay }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New group class signup{name ? ` from ${name}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New group class signup</Heading>
        <Text style={text}>Someone just subscribed to {SITE_NAME} group classes.</Text>
        <Section style={card}>
          <Text style={label}>Name</Text>
          <Text style={value}>{name || '—'}</Text>
          <Hr style={hr} />
          <Text style={label}>Email</Text>
          <Text style={value}>{email || '—'}</Text>
          <Hr style={hr} />
          <Text style={label}>Course</Text>
          <Text style={value}>{courseName || 'Group English Classes — Monthly'}</Text>
          <Hr style={hr} />
          <Text style={label}>Class day</Text>
          <Text style={value}>{classDay || '—'}</Text>
          <Hr style={hr} />
          <Text style={label}>Amount</Text>
          <Text style={value}>{amount || '—'}</Text>
          {environment && (
            <>
              <Hr style={hr} />
              <Text style={label}>Environment</Text>
              <Text style={value}>{environment}</Text>
            </>
          )}
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `[New signup] ${data?.name || data?.email || 'Group class subscription'}${data?.classDay ? ` – ${data.classDay}` : ''}`,
  to: OWNER_EMAIL,
  displayName: 'Group class signup notification',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    courseName: 'Group English Classes — Monthly',
    classDay: 'Thursdays · 12:00 GMT',
    amount: '$30.00',
    environment: 'live',
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
