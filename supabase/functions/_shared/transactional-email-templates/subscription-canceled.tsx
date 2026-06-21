import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Handy Hans English'

interface Props {
  name?: string
  accessEndDate?: string
  classDay?: string
}

const Email = ({ name, accessEndDate, classDay }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Live Group Classes subscription has been canceled</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your subscription has been canceled</Heading>
        <Text style={text}>Hi {name || 'there'},</Text>
        <Text style={text}>
          We've received your cancellation for <strong>Live Group Classes</strong>
          {classDay ? <> (<strong>{classDay}</strong>)</> : null}.
          {accessEndDate
            ? ` You'll continue to have access to classes until ${accessEndDate}, after which your subscription will end and you won't be billed again.`
            : ' Your subscription has been ended and you won\'t be billed again.'}
        </Text>
        <Text style={text}>
          Thanks for being part of the class — we'd love to see you back any time.
          You can resubscribe from your dashboard whenever you're ready.
        </Text>
        <Text style={text}>
          — Hans
        </Text>
        <Hr style={hr} />
        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Your Live Group Classes subscription has been canceled',
  displayName: 'Subscription canceled — user',
  previewData: { name: 'Jane', accessEndDate: '5 July 2026', classDay: 'Thursdays · 12:00 GMT' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '8px 0' }
