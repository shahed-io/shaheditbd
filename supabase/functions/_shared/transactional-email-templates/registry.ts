/// <reference types="npm:@types/react@18.3.1" />

export interface TemplateEntry {
  component: React.ComponentType<any>;
  subject: string | ((data: any) => string);
  displayName?: string;
  previewData?: Record<string, any>;
  to?: string | ((data: any) => string);
}

import { template as orderConfirmation } from './order-confirmation.tsx'
import { template as welcome } from './welcome.tsx'
import { template as invoiceDelivery } from './invoice-delivery.tsx'
import { template as cidAccountCredentials } from './cid-account-credentials.tsx'
import { template as admin2faCode } from './admin-2fa-code.tsx'
import { template as subscriptionRenewalReminder } from './subscription-renewal-reminder.tsx'
import { template as cidDelivery } from './cid-delivery.tsx'
import { template as loginNotification } from './login-notification.tsx'
import { template as orderStatusUpdate } from './order-status-update.tsx'
import { template as licenseDelivery } from './license-delivery.tsx'
import { template as subscriptionActivated } from './subscription-activated.tsx'
import { template as paymentSuccess } from './payment-success.tsx'
import { template as paymentFailed } from './payment-failed.tsx'
import { template as subscriptionCancelled } from './subscription-cancelled.tsx'
import { template as refundProcessed } from './refund-processed.tsx'
import { template as giveawayWinner } from './giveaway-winner.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-confirmation': orderConfirmation,
  'order-status-update': orderStatusUpdate,
  'welcome': welcome,
  'invoice-delivery': invoiceDelivery,
  'cid-account-credentials': cidAccountCredentials,
  'admin-2fa-code': admin2faCode,
  'subscription-renewal-reminder': subscriptionRenewalReminder,
  'cid-delivery': cidDelivery,
  'login-notification': loginNotification,
  'license-delivery': licenseDelivery,
  'subscription-activated': subscriptionActivated,
  'payment-success': paymentSuccess,
  'payment-failed': paymentFailed,
  'subscription-cancelled': subscriptionCancelled,
  'refund-processed': refundProcessed,
  'giveaway-winner': giveawayWinner,
};
