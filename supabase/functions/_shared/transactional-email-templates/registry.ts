/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as contactNotification } from './contact-notification.tsx'
import { template as pdfSignupConfirmation } from './pdf-signup-confirmation.tsx'
import { template as groupClassWelcome } from './group-class-welcome.tsx'
import { template as groupClassSignupNotification } from './group-class-signup-notification.tsx'
import { template as subscriptionCanceled } from './subscription-canceled.tsx'
import { template as subscriptionCanceledNotification } from './subscription-canceled-notification.tsx'
import { template as studentDocumentCreatedNotification } from './student-document-created-notification.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-notification': contactNotification,
  'pdf-signup-confirmation': pdfSignupConfirmation,
  'group-class-welcome': groupClassWelcome,
  'group-class-signup-notification': groupClassSignupNotification,
  'subscription-canceled': subscriptionCanceled,
  'subscription-canceled-notification': subscriptionCanceledNotification,
  'student-document-created-notification': studentDocumentCreatedNotification,
}
