import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Handy Hans English'
const OWNER_EMAIL = 'hello@handyhansenglish.com'

interface Props {
  studentName?: string
  studentEmail?: string
  productKind?: string
  docUrl?: string
  bookingTime?: string
}

const Email = ({ studentName, studentEmail, productKind, docUrl, bookingTime }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New 1:1 student – Google Doc created{studentName ? ` for ${studentName}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New 1:1 student – progress doc ready</Heading>
        <Text style={text}>
          A new student just booked a 1:1 lesson at {SITE_NAME}. A personal Google Doc has been created for them.
        </Text>
        <Section style={card}>
          <Text style={label}>Student name</Text>
          <Text style={value}>{studentName || '—'}</Text>
          <Hr style={hr} />
          <Text style={label}>Email</Text>
          <Text style={value}>{studentEmail || '—'}</Text>
          <Hr style={hr} />
          <Text style={label}>Product</Text>
          <Text style={value}>{productKind === 'ten-pack' ? '10-Session Pack' : '1:1 Single Class'}</Text>
          {bookingTime && (
            <>
              <Hr style={hr} />
              <Text style={label}>First lesson</Text>
              <Text style={value}>{bookingTime}</Text>
            </>
          )}
        </Section>
        {docUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={docUrl} style={button}>Open Google Doc</Button>
            <Text style={{ ...text, fontSize: '12px', marginTop: '12px' }}>{docUrl}</Text>
          </Section>
        )}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `[New 1:1 student] ${data?.studentName || data?.studentEmail || 'progress doc created'}`,
  to: OWNER_EMAIL,
  displayName: 'Student progress doc created',
  previewData: {
    studentName: 'Jane Doe',
    studentEmail: 'jane@example.com',
    productKind: 'single-1on1',
    docUrl: 'https://docs.google.com/document/d/abc123/edit',
    bookingTime: 'Mon 16 Jun 2026, 14:00 GMT',
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
const button = { backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }
