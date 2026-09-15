"use client";

import * as React from "react";
import { motion, MotionConfig } from "framer-motion";
import { useApp, useT } from "@/store";
import { AppLogo, BrandMark } from "@/components/app/brand";
import { LanguageToggle } from "@/components/app/language-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, Loader2, ShieldCheck, TriangleAlert, KeyRound, Smartphone, Mail, SendHorizonal } from "lucide-react";
import { APP_VERSION } from "@/lib/version";
import type { TranslationKey } from "@/lib/i18n";
import { toast } from "sonner";

/** Build-time flag — cloud build হলেই Google button দেখায় (local mode-এ লুকানো)। */
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GK_CLOUD === "1" && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

/** Google-এর অফিসিয়াল ৪-রঙা "G" লোগো (inline SVG — কোনো external asset নেই)। */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/** Real login — phone/email + password. Session cookie keeps you logged in. */
export function LoginView({ onSignup }: { onSignup: () => void }) {
  const { t } = useT();
  const login = useApp((s) => s.login);
  const busy = useApp((s) => s.busy);
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorKey, setErrorKey] = React.useState<TranslationKey | null>(null);
  const [googleBusy, setGoogleBusy] = React.useState(false);
  const [forgotOpen, setForgotOpen] = React.useState(false);
  const [forgotIdentifier, setForgotIdentifier] = React.useState("");
  const [forgotBusy, setForgotBusy] = React.useState(false);
  const [forgotSent, setForgotSent] = React.useState(false);

  /* OAuth callback ব্যর্থ হলে /?authError=… দিয়ে ফেরে — message দেখিয়ে URL পরিষ্কার।
     Error key হিসেবে রাখা হয় যেন ভাষা বদলালেও message বদলায়। */
  React.useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("authError");
    if (!e) return;
    setErrorKey(
      e === "policyPatchNeeded" ? "policyPatchNeeded"
      : e === "googleNotConfigured" ? "googleNotConfigured"
      : "googleFailed"
    );
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!identifier.trim() || !password) { setErrorKey("fillAll"); return; }
    setErrorKey(null);
    const err = await login(identifier.trim(), password);
    if (err) setErrorKey(err === "loginFailed" ? "loginFailed" : "serverError");
  };

  const googleLogin = () => {
    setGoogleBusy(true);
    setErrorKey(null);
    // Full-page redirect — server PKCE flow শুরু করে, ফিরে এলে আর এখানে নেই।
    window.location.href = "/api/auth/google/start";
  };

  /* পাসওয়ার্ড রিসেট রিকোয়েস্ট — ইমেইল/ফোন দিলে Supabase রিসেট লিংক
     পাঠায় (anti-enumeration: না পেলেও একই রেসপন্স)। */
  const sendResetLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!forgotIdentifier.trim()) { setErrorKey("fillAll"); return; }
    setForgotBusy(true);
    setErrorKey(null);
    const err = await useApp.getState().requestPasswordReset(forgotIdentifier.trim());
    setForgotBusy(false);
    if (err) {
      setErrorKey(err === "resetPhoneNotFound" || err === "resetLocalUnsupported" || err === "invalidEmail" ? (err as TranslationKey) : "serverError");
      return;
    }
    setForgotSent(true);
    toast.success(t("resetSent"));
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-dvh bg-background overflow-hidden flex flex-col">
      {/* v0.13 aurora backdrop + floating brand blobs */}
      <div aria-hidden className="absolute inset-0 aurora-page" />
      <div aria-hidden className="absolute -top-24 -left-24 size-72 rounded-full bg-primary/12 blur-3xl animate-float" />
      <div aria-hidden className="absolute -bottom-32 -right-20 size-80 rounded-full bg-warning/10 blur-3xl animate-float [animation-delay:-4s]" />

      <div className="relative flex justify-end p-4 pt-safe">
        <LanguageToggle />
      </div>

      <div className="relative flex-1 flex flex-col justify-center max-w-md w-full mx-auto px-6 pb-10">
        <motion.div
          className="flex flex-col items-center text-center gap-3.5 mb-8"
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="flex size-18 items-center justify-center rounded-3xl bg-white ring-1 ring-border/60 shadow-lift shadow-primary/15">
            <BrandMark className="size-13" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gradient-emerald tracking-tight">গাড়িখাতা</h1>
            <p className="text-xs text-muted-foreground mt-1">{t("appTagline")}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="rounded-full bg-muted/60 text-muted-foreground border-border font-semibold tabular">
              v{APP_VERSION}
            </Badge>
            <span>· {t("savedServerNote")}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
        <Card className="border-border/60 shadow-lift backdrop-blur-sm bg-card/95 rounded-2xl">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <form onSubmit={submit} className="space-y-3.5">
              {errorKey && (
                <Alert variant="destructive" className="items-start">
                  <TriangleAlert className="size-4 mt-0.5" />
                  <AlertDescription className="text-[13px]">{t(errorKey)}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  {identifier.includes("@")
                    ? <Mail className="size-3.5" />
                    : <Smartphone className="size-3.5" />}
                  {t("loginId")}
                </Label>
                <Input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t("loginIdPh")}
                  className="h-11 text-[15px] rounded-xl"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="size-3.5" />
                  {t("loginPassword")}
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="h-11 text-[15px] rounded-xl"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" size="lg" className="w-full h-11 text-sm font-semibold gap-2 rounded-xl bg-emerald-gradient text-primary-foreground shadow-glow-emerald hover:opacity-95 active:scale-[0.98] transition-all" disabled={busy}>
                {busy ? <Loader2 className="size-4.5 animate-spin" /> : <LogIn className="size-4.5" />}
                {t("loginBtn")}
              </Button>
            </form>

            {/* পাসওয়ার্ড রিসেট — main form-এর BAHIRE (nested form = invalid
                HTML → browser DOM ভেঙে ফেলে, submit আটকাত)। */}
            <div className="-mt-1 flex justify-end">
              <button
                type="button"
                onClick={() => { setForgotOpen((v) => !v); setForgotSent(false); setErrorKey(null); }}
                className="text-[11.5px] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                {t("forgotPassword")}
              </button>
            </div>
            {forgotOpen && (
              <div className="rounded-xl bg-muted/40 border border-border/60 p-3 space-y-2.5">
                {forgotSent ? (
                  <p className="text-[12px] leading-relaxed text-muted-foreground flex items-start gap-2">
                    <ShieldCheck className="size-3.5 mt-0.5 shrink-0" />
                    {t("resetSent")}
                  </p>
                ) : (
                  <form onSubmit={sendResetLink} className="space-y-2">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      {t("forgotPasswordHint")}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder={t("loginIdPh")}
                        className="h-10 text-[14px] rounded-lg flex-1"
                        autoComplete="username"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="h-10 px-3.5 rounded-lg gap-1.5 text-[13px]"
                        disabled={forgotBusy}
                      >
                        {forgotBusy ? <Loader2 className="size-4 animate-spin" /> : <SendHorizonal className="size-4" />}
                        {t("send")}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {GOOGLE_ENABLED && (
              <>
                <div className="flex items-center gap-3 pt-1" aria-hidden>
                  <span className="h-px flex-1 bg-border/70" />
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{t("orContinueWith")}</span>
                  <span className="h-px flex-1 bg-border/70" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full h-11 text-sm font-semibold gap-2.5 rounded-xl bg-card"
                  onClick={googleLogin}
                  disabled={googleBusy || busy}
                >
                  {googleBusy ? <Loader2 className="size-4.5 animate-spin" /> : <GoogleMark className="size-4.5" />}
                  {t("googleLogin")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.18 }}
        >
        <div className="flex items-start gap-2.5 text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
          <p className="text-[11.5px] leading-relaxed">{t("dataSafety")}</p>
        </div>

        <button
          type="button"
          onClick={onSignup}
          className="mt-4 w-full text-center text-sm text-primary font-semibold underline-offset-4 hover:underline"
        >
          {t("loginNoAccount")}
        </button>
        </motion.div>
      </div>
    </div>
    </MotionConfig>
  );
}
