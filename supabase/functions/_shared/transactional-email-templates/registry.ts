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

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-confirmation': orderConfirmation,
  'welcome': welcome,
  'invoice-delivery': invoiceDelivery,
  'cid-account-credentials': cidAccountCredentials,
  'admin-2fa-code': admin2faCode,
};
