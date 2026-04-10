/// <reference types="npm:@types/react@18.3.1" />

export interface TemplateEntry {
  component: React.ComponentType<any>;
  subject: string | ((data: any) => string);
  displayName?: string;
  previewData?: Record<string, any>;
  to?: string | ((data: any) => string);
}

export const TEMPLATES: Record<string, TemplateEntry> = {};
