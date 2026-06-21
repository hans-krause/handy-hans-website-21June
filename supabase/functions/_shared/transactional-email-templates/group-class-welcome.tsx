import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Handy Hans English'

interface GroupClassWelcomeProps {
  name?: string
  classDay?: string
}

const GroupClassWelcomeEmail = ({ name, classDay }: GroupClassWelcomeProps) => {
  const dayLabel = classDay || 'Thursday at 12:00 GMT'
  return (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Live Group Classes with Hans</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're in! 🎉</Heading>
        <Text style={text}>Hi {name || 'there'},</Text>
        <Text style={text}>
          Thanks for subscribing to <strong>Live Group Classes</strong> with Hans.
          Your subscription is active and you can now join the weekly class on
          Zoom every <strong>{dayLabel}</strong>.
        </Text>
        <Text style={text}>
          The Zoom link and class notes will be sent to you before each session.
          You can see your upcoming classes any time on your dashboard.
        </Text>
        <Text style={text}>
          See you in class!<br />— Hans
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          You can manage or cancel your subscription any time from your account.
        </Text>
        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
  )
}

export const template = {
  component: GroupClassWelcomeEmail,
  subject: 'Welcome to Live Group Classes with Hans',
  displayName: 'Group class — welcome',
  previewData: { name: 'Jane', classDay: 'Thursdays · 12:00 GMT' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '8px 0' }
