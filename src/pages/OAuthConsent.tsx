import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, LogIn } from "lucide-react";
import { toast } from "sonner";

// Minimal typed wrapper — the auth.oauth namespace is beta and may not be in the SDK types.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauth = (supabase.auth as any).oauth as OAuthApi;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Sign-in form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        setCheckingSession(false);
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!active) return;
      if (!sess.session) {
        setHasSession(false);
        setCheckingSession(false);
        return;
      }
      setHasSession(true);
      setCheckingSession(false);
      await loadDetails();
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function loadDetails() {
    if (!oauth) {
      setError("OAuth is not available in this build of the auth SDK.");
      return;
    }
    const { data, error: e } = await oauth.getAuthorizationDetails(authorizationId);
    if (e) return setError(e.message || String(e));
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) {
      window.location.href = immediate;
      return;
    }
    setDetails(data);
  }

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error: e } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (e) {
      setBusy(false);
      return setError(e.message || String(e));
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("No redirect returned by the authorization server.");
    }
    window.location.href = target;
  }

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault();
    setSigningIn(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setSigningIn(false);
    if (err) return toast.error(err.message || "Sign-in failed");
    setHasSession(true);
    await loadDetails();
  }

  async function signInGoogle() {
    // After Google round-trip the browser must land back on THIS consent URL.
    const returnTo = window.location.pathname + window.location.search;
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + returnTo,
    });
    if (result.error) toast.error(result.error.message || "Google sign-in failed");
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (checkingSession) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authorization error</CardTitle>
            <CardDescription>We could not process this connection request.</CardDescription>
          </CardHeader>
          <CardContent><p className="text-sm text-destructive">{error}</p></CardContent>
        </Card>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2">
              <LogIn className="w-6 h-6 text-cyan-600" />
            </div>
            <CardTitle>Sign in to continue</CardTitle>
            <CardDescription>An external app wants to connect to your Shahed IT account. Sign in to review the request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" variant="outline" className="w-full" onClick={signInGoogle}>
              Continue with Google
            </Button>
            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
            </div>
            <form onSubmit={signInEmail} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <Button type="submit" className="w-full" disabled={signingIn}>
                {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading authorization…
        </div>
      </main>
    );
  }

  const clientName = details.client?.name ?? "an external app";
  const redirectUri = details.client?.redirect_uri ?? details.redirect_uri;
  const scopes: string[] = Array.isArray(details.scopes) ? details.scopes : (typeof details.scope === "string" ? details.scope.split(/\s+/).filter(Boolean) : []);

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6 text-cyan-600" />
          </div>
          <CardTitle>Connect {clientName} to Shahed IT</CardTitle>
          <CardDescription>This lets {clientName} use Shahed IT as you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-3 text-sm space-y-1.5 bg-muted/40">
            <div><span className="text-muted-foreground">Signed in as:</span> <span className="font-medium">{details.user?.email ?? "you"}</span></div>
            {redirectUri && (
              <div className="break-all"><span className="text-muted-foreground">Redirects to:</span> <span className="font-mono text-xs">{redirectUri}</span></div>
            )}
            {scopes.length > 0 && (
              <div><span className="text-muted-foreground">Requested access:</span> <span className="font-mono text-xs">{scopes.join(" ")}</span></div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {clientName} will be able to call this app's enabled tools while you are signed in. This does not bypass this app's permissions or backend policies.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>Deny</Button>
            <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
