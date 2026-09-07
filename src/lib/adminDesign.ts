/**
 * Admin Panel Design System — token registry, apply/serialize helpers.
 *
 * The admin panel look is driven by the `--ad-*` CSS custom properties that are
 * declared on `body.admin-page` in src/index.css. This module lets those tokens
 * be overridden at runtime (stored in site_settings), exported to a JSON file
 * and restored later — without touching the stylesheet.
 */

export const ADMIN_DESIGN_KEY = 'admin_design_config';
export const ADMIN_DESIGN_SNAPSHOTS_KEY = 'admin_design_snapshots';

export type TokenKind = 'hsl' | 'raw';

export interface TokenDef {
  /** CSS variable name without the leading `--` */
  name: string;
  label: string;
  group: string;
  kind: TokenKind;
  /** default value exactly as written in index.css */
  value: string;
}

/** Defaults mirror the `body.admin-page` block in src/index.css. */
export const ADMIN_TOKENS: TokenDef[] = [
  { name: 'ad-bg',            label: 'Canvas background', group: 'Surfaces', kind: 'hsl', value: '230 50% 97%' },
  { name: 'ad-surface',       label: 'Card surface',      group: 'Surfaces', kind: 'hsl', value: '0 0% 100%' },
  { name: 'ad-surface-2',     label: 'Alt surface',       group: 'Surfaces', kind: 'hsl', value: '230 40% 97%' },
  { name: 'ad-border',        label: 'Border',            group: 'Surfaces', kind: 'hsl', value: '230 35% 90%' },
  { name: 'ad-border-strong', label: 'Border strong',     group: 'Surfaces', kind: 'hsl', value: '230 35% 82%' },

  { name: 'ad-text',        label: 'Text',        group: 'Typography', kind: 'hsl', value: '226 35% 12%' },
  { name: 'ad-text-muted',  label: 'Text muted',  group: 'Typography', kind: 'hsl', value: '226 15% 42%' },
  { name: 'ad-text-subtle', label: 'Text subtle', group: 'Typography', kind: 'hsl', value: '226 12% 58%' },

  { name: 'ad-accent',       label: 'Accent (violet)', group: 'Accents', kind: 'hsl', value: '258 78% 55%' },
  { name: 'ad-accent-soft',  label: 'Accent soft',     group: 'Accents', kind: 'hsl', value: '258 78% 96%' },
  { name: 'ad-accent-hover', label: 'Accent hover',    group: 'Accents', kind: 'hsl', value: '258 78% 48%' },
  { name: 'ad-accent-deep',  label: 'Accent deep',     group: 'Accents', kind: 'hsl', value: '258 78% 42%' },
  { name: 'ad-accent-2',     label: 'Accent 2 (cyan)', group: 'Accents', kind: 'hsl', value: '200 90% 45%' },
  { name: 'ad-accent-3',     label: 'Accent 3 (pink)', group: 'Accents', kind: 'hsl', value: '330 85% 55%' },
  { name: 'ad-accent-gold',  label: 'Accent gold',     group: 'Accents', kind: 'hsl', value: '42 96% 58%' },
  { name: 'ad-black',        label: 'Ink',             group: 'Accents', kind: 'hsl', value: '226 35% 12%' },

  { name: 'ad-radius',      label: 'Radius',       group: 'Shape', kind: 'raw', value: '20px' },
  { name: 'ad-radius-sm',   label: 'Radius small', group: 'Shape', kind: 'raw', value: '12px' },
  { name: 'ad-radius-lg',   label: 'Radius large', group: 'Shape', kind: 'raw', value: '26px' },
  { name: 'ad-radius-pill', label: 'Radius pill',  group: 'Shape', kind: 'raw', value: '9999px' },

  { name: 'ad-shadow-sm',       label: 'Shadow sm',       group: 'Depth', kind: 'raw', value: '0 1px 2px hsla(226, 35%, 12%, 0.05), 0 1px 1px hsla(226, 35%, 12%, 0.03)' },
  { name: 'ad-shadow-md',       label: 'Shadow md',       group: 'Depth', kind: 'raw', value: '0 4px 18px hsla(258, 78%, 55%, 0.10), 0 1px 3px hsla(226, 35%, 12%, 0.04)' },
  { name: 'ad-shadow-lg',       label: 'Shadow lg',       group: 'Depth', kind: 'raw', value: '0 12px 36px hsla(258, 78%, 55%, 0.14), 0 2px 6px hsla(226, 35%, 12%, 0.05)' },
  { name: 'ad-shadow-xl',       label: 'Shadow xl',       group: 'Depth', kind: 'raw', value: '0 28px 56px hsla(258, 78%, 55%, 0.20), 0 8px 16px hsla(226, 35%, 12%, 0.06)' },
  { name: 'ad-shadow-pill',     label: 'Shadow pill',     group: 'Depth', kind: 'raw', value: '0 6px 18px hsla(258, 78%, 55%, 0.28), 0 1px 3px hsla(258, 78%, 55%, 0.12)' },
  { name: 'ad-shadow-gradient', label: 'Shadow gradient', group: 'Depth', kind: 'raw', value: '0 8px 24px hsla(258, 78%, 55%, 0.18), 0 4px 12px hsla(200, 90%, 45%, 0.10)' },

  { name: 'ad-gradient-brand',  label: 'Brand gradient',  group: 'Gradients', kind: 'raw', value: 'linear-gradient(135deg, hsl(258, 78%, 55%) 0%, hsl(280, 75%, 58%) 50%, hsl(200, 90%, 50%) 100%)' },
  { name: 'ad-gradient-warm',   label: 'Warm gradient',   group: 'Gradients', kind: 'raw', value: 'linear-gradient(135deg, hsl(330, 85%, 58%) 0%, hsl(42, 96%, 58%) 100%)' },
  { name: 'ad-gradient-border', label: 'Border gradient', group: 'Gradients', kind: 'raw', value: 'linear-gradient(135deg, hsla(258, 78%, 55%, 0.35) 0%, hsla(200, 90%, 50%, 0.30) 100%)' },
];

export const TOKEN_GROUPS = Array.from(new Set(ADMIN_TOKENS.map(t => t.group)));

export interface AdminDesignConfig {
  /** Only tokens that differ from the stylesheet default are stored. */
  tokens: Record<string, string>;
  /** Optional extra CSS appended inside the admin panel only. */
  customCss?: string;
  /** UI feature switches for the admin shell. */
  features: {
    animations: boolean;
    glassSidebar: boolean;
    gradientHeader: boolean;
    compactDensity: boolean;
  };
  updated_at?: string;
}

export const DEFAULT_ADMIN_DESIGN: AdminDesignConfig = {
  tokens: {},
  customCss: '',
  features: {
    animations: true,
    glassSidebar: true,
    gradientHeader: true,
    compactDensity: false,
  },
};

export const mergeDesign = (raw: unknown): AdminDesignConfig => {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<AdminDesignConfig>;
  const validNames = new Set(ADMIN_TOKENS.map(t => t.name));
  const tokens: Record<string, string> = {};
  Object.entries(src.tokens ?? {}).forEach(([k, v]) => {
    if (validNames.has(k) && typeof v === 'string' && v.trim()) tokens[k] = v.trim();
  });
  return {
    tokens,
    customCss: typeof src.customCss === 'string' ? src.customCss : '',
    features: { ...DEFAULT_ADMIN_DESIGN.features, ...(src.features ?? {}) },
    updated_at: src.updated_at,
  };
};

const STYLE_ID = 'admin-design-overrides';

/** Injects the overrides as a single <style> tag scoped to body.admin-page. */
export const applyAdminDesign = (cfg: AdminDesignConfig) => {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  const vars = Object.entries(cfg.tokens)
    .map(([k, v]) => `  --${k}: ${v};`)
    .join('\n');

  const flags: string[] = [];
  if (!cfg.features.animations) {
    flags.push(`body.admin-page *, body.admin-page *::before, body.admin-page *::after { animation: none !important; transition: none !important; }`);
  }
  if (!cfg.features.glassSidebar) {
    flags.push(`body.admin-page .admin-glass-sidebar { backdrop-filter: none !important; background: hsl(var(--ad-surface)) !important; }`);
  }
  if (!cfg.features.gradientHeader) {
    flags.push(`body.admin-page .admin-page-header { background: hsl(var(--ad-surface)) !important; }`);
  }
  if (cfg.features.compactDensity) {
    flags.push(`body.admin-page .admin-glass-card { padding: 0.75rem !important; }
body.admin-page table td, body.admin-page table th { padding-top: 0.35rem !important; padding-bottom: 0.35rem !important; }`);
  }

  el.textContent = [
    vars ? `body.admin-page {\n${vars}\n}` : '',
    ...flags,
    cfg.customCss ? `/* custom */\n${cfg.customCss}` : '',
  ].filter(Boolean).join('\n\n');
};

export interface DesignBackupFile {
  type: 'shahed-store-admin-design';
  version: 1;
  exported_at: string;
  design: AdminDesignConfig;
  /** site theme id (from useTheme) so the whole look restores together */
  theme?: string | null;
  /** appearance-related site_settings rows captured with the design */
  settings?: { key: string; value: unknown; category: string | null }[];
}

export const isDesignBackupFile = (v: unknown): v is DesignBackupFile => {
  const f = v as DesignBackupFile;
  return !!f && typeof f === 'object' && f.type === 'shahed-store-admin-design' && !!f.design;
};
