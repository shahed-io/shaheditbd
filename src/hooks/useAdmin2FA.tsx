import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Admin2FAAction =
  | 'status'
  | 'setup'
  | 'enable'
  | 'verify-login'
  | 'validate-session'
  | 'disable'
  | 'logout'
  | 'send-email-otp'
  | 'reset'
  | 'regenerate-backup-codes'
  | 'get-config'
  | 'update-config';

export const TOKEN_KEY = 'admin_2fa_token';

/** Read token: prefer remembered (localStorage) → fall back to session-only. */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Store the 2FA token.
 *  - persistent=true → survives browser restarts (Remember this device)
 *  - persistent=false (default) → cleared on tab close
 * Always clears the *other* store so we never keep two stale copies.
 */
export function setStoredToken(t: string | null, persistent = false) {
  try {
    if (!t) {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    if (persistent) {
      localStorage.setItem(TOKEN_KEY, t);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, t);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch { /* ignore */ }
}

export async function call2FA(action: Admin2FAAction, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-2fa', {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message ?? 'Network error');
  if (data?.error) throw new Error(data.error);
  return data;
}

export interface Admin2FAConfig {
  session_ttl_hours: number;
  remember_device_ttl_days: number;
  allow_remember_device: boolean;
  system_enabled: boolean;
}

export function useAdmin2FA() {
  const status        = useCallback(() => call2FA('status'), []);
  const setup         = useCallback(() => call2FA('setup'), []);
  const enable        = useCallback((code: string, remember = false) =>
    call2FA('enable', { code, remember }), []);
  const verifyLogin   = useCallback((code: string, remember = false) =>
    call2FA('verify-login', { code, remember }), []);
  const validateSess  = useCallback((token: string) => call2FA('validate-session', { token }), []);
  const disable       = useCallback((code: string) => call2FA('disable', { code }), []);
  const logout        = useCallback((token: string) => call2FA('logout', { token }), []);
  const sendEmailOtp  = useCallback(() => call2FA('send-email-otp'), []);
  const reset         = useCallback((opts: { token?: string; code?: string }) =>
    call2FA('reset', opts), []);
  const regenerateBackupCodes = useCallback((opts: { token?: string; code?: string }) =>
    call2FA('regenerate-backup-codes', opts), []);
  const getConfig     = useCallback(() =>
    call2FA('get-config') as Promise<Admin2FAConfig>, []);
  const updateConfig  = useCallback((config: Partial<Admin2FAConfig>) =>
    call2FA('update-config', { config }), []);

  return {
    status, setup, enable, verifyLogin, validateSession: validateSess,
    disable, logout, sendEmailOtp, reset, regenerateBackupCodes,
    getConfig, updateConfig,
  };
}
