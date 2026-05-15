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
  | 'send-email-otp';

export const TOKEN_KEY = 'admin_2fa_token';

export function getStoredToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setStoredToken(t: string | null) {
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, t);
    else sessionStorage.removeItem(TOKEN_KEY);
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

export function useAdmin2FA() {
  const status        = useCallback(() => call2FA('status'), []);
  const setup         = useCallback(() => call2FA('setup'), []);
  const enable        = useCallback((code: string) => call2FA('enable', { code }), []);
  const verifyLogin   = useCallback((code: string) => call2FA('verify-login', { code }), []);
  const validateSess  = useCallback((token: string) => call2FA('validate-session', { token }), []);
  const disable       = useCallback((code: string) => call2FA('disable', { code }), []);
  const logout        = useCallback((token: string) => call2FA('logout', { token }), []);
  const sendEmailOtp  = useCallback(() => call2FA('send-email-otp'), []);
  return { status, setup, enable, verifyLogin, validateSession: validateSess, disable, logout, sendEmailOtp };
}
