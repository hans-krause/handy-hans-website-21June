import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CAL_WEBHOOK_SECRET = Deno.env.get('CAL_WEBHOOK_SECRET') ?? ''
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!
const GOOGLE_DOCS_API_KEY = Deno.env.get('GOOGLE_DOCS_API_KEY')!
const GATEWAY_DOCS = 'https://connector-gateway.lovable.dev/google_docs/v1'

// Map Cal.com event type slugs to our internal product kinds
function detectProductKind(eventSlug?: string, title?: string): 'single-1on1' | 'ten-pack' {
  const s = (eventSlug || '').toLowerCase()
  const t = (title || '').toLowerCase()
  if (s.includes('10') || s.includes('pack') || t.includes('10-session') || t.includes('10 session') || t.includes('pack')) {
    return 'ten-pack'
  }
  return 'single-1on1'
}

async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!CAL_WEBHOOK_SECRET || !signature) return false
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(CAL_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody))
  const hex = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
  // Constant time compare
  if (hex.length !== signature.length) return false
  let ok = 0
  for (let i = 0; i < hex.length; i++) ok |= hex.charCodeAt(i) ^ signature.charCodeAt(i)
  return ok === 0
}

async function createGoogleDoc(title: string): Promise<{ documentId: string; url: string } | null> {
  const res = await fetch(`${GATEWAY_DOCS}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': GOOGLE_DOCS_API_KEY,
    },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) {
    console.error('Google Docs create failed', res.status, await res.text())
    return null
  }
  const data = await res.json()
  const documentId = data?.documentId
  if (!documentId) return null
  return { documentId, url: `https://docs.google.com/document/d/${documentId}/edit` }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const rawBody = await req.text()
  const sig = req.headers.get('x-cal-signature-256')

  if (!CAL_WEBHOOK_SECRET) {
    console.error('CAL_WEBHOOK_SECRET is not configured; rejecting webhook request')
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const ok = await verifySignature(rawBody, sig)
  if (!ok) {
    console.warn('Cal.com webhook signature verification failed')
    return new Response(JSON.stringify({ error: 'invalid signature' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: any
  try { payload = JSON.parse(rawBody) } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const triggerEvent: string = payload?.triggerEvent ?? ''
  const data = payload?.payload ?? {}

  const uid: string = data?.uid || data?.bookingId?.toString() || ''
  const attendee = Array.isArray(data?.attendees) ? data.attendees[0] : data?.attendees
  const studentEmail: string = (attendee?.email || data?.responses?.email?.value || '').toLowerCase()
  const studentName: string = attendee?.name || data?.responses?.name?.value || ''
  const startTime: string = data?.startTime || data?.start_time
  const endTime: string = data?.endTime || data?.end_time
  const eventSlug: string = data?.eventType?.slug || data?.type || ''
  const title: string = data?.title || ''
  const paid = data?.paid === true || data?.payment?.[0]?.success === true ? 'paid' : null
  const meetingUrl: string = data?.metadata?.videoCallUrl || data?.location || ''

  if (!uid || !studentEmail || !startTime || !endTime) {
    console.warn('Cal.com webhook missing fields', { triggerEvent, uid, studentEmail, startTime })
    return new Response(JSON.stringify({ ok: true, skipped: 'missing fields' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const productKind = detectProductKind(eventSlug, title)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  // Try to find a matching auth user by email
  let userId: string | null = null
  try {
    const { data: profile } = await supabase
      .from('profiles').select('user_id').eq('email', studentEmail).maybeSingle()
    if (profile?.user_id) userId = profile.user_id
  } catch (e) { console.warn('profile lookup failed', e) }

  // Map event → status
  let status: 'confirmed' | 'cancelled' | 'rescheduled' = 'confirmed'
  if (triggerEvent === 'BOOKING_CANCELLED') status = 'cancelled'
  else if (triggerEvent === 'BOOKING_RESCHEDULED') status = 'rescheduled'

  // Upsert booking
  const { error: upsertErr } = await supabase
    .from('one_on_one_bookings')
    .upsert({
      cal_booking_uid: uid,
      user_id: userId,
      cal_event_type_slug: eventSlug,
      product_kind: productKind,
      title: title || (productKind === 'ten-pack' ? '10-Session Pack lesson' : '1:1 Single Class'),
      student_email: studentEmail,
      student_name: studentName,
      starts_at: startTime,
      ends_at: endTime,
      status,
      meeting_url: meetingUrl,
      payment_status: paid,
      raw_payload: payload,
    }, { onConflict: 'cal_booking_uid' })

  if (upsertErr) {
    console.error('Upsert booking error', upsertErr)
    return new Response(JSON.stringify({ error: upsertErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Only on a newly-created, paid booking → ensure a Google Doc exists
  const shouldCreateDoc = triggerEvent === 'BOOKING_CREATED' && paid === 'paid'

  if (shouldCreateDoc) {
    const { data: existing } = await supabase
      .from('student_documents').select('id, google_doc_url').eq('student_email', studentEmail).maybeSingle()

    if (!existing) {
      const docTitle = `Student - ${studentName || studentEmail}`
      const doc = await createGoogleDoc(docTitle)
      if (doc) {
        const { error: insErr } = await supabase.from('student_documents').insert({
          user_id: userId,
          student_email: studentEmail,
          student_name: studentName,
          google_doc_id: doc.documentId,
          google_doc_url: doc.url,
        })
        if (insErr) console.error('Insert student_documents failed', insErr)

        // Email Hans the link
        try {
          const bookingTime = new Date(startTime).toUTCString()
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'student-document-created-notification',
              recipientEmail: 'hello@handyhansenglish.com',
              idempotencyKey: `student-doc-${doc.documentId}`,
              templateData: {
                studentName,
                studentEmail,
                productKind,
                docUrl: doc.url,
                bookingTime,
              },
            },
          })
        } catch (e) { console.error('Failed to send notification email', e) }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
