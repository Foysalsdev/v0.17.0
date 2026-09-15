"use client";

import * as React from "react";
import { motion, MotionConfig } from "framer-motion";
import { useApp, useT } from "@/store";
import { BrandMark } from "@/components/app/brand";
import { LanguageToggle } from "@/components/app/language-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, Loader2, TriangleAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { TranslationKey } from "@/lib/i18n";

/* ------------------------------------------------------------------ *
 * /auth/reset — ইমেইল রিসেট লিংক থেকে আসা ইউজারের নতুন পাসওয়ার্ড
 * পেজ। সেশন কুকি (gk_at/gk_rt) /auth/confirm বসিয়ে দিয়ে গেছে —
 * POST /api/auth/password/reset সেই সেশনে পাসওয়ার্ড বদলায়।
 * ------------------------------------------------------------------ */
export default function ResetPasswordPage() {
  const { t } = useT();
  const lang = useApp((s) => s.lang);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [errorKey, setErrorKey] = React.useState<TranslationKey | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password || !confirm) { setErrorKey("fillAll"); return; }
    if (password !== confirm) { setErrorKey("passwordMismatch"); return; }
    if (password.length < 6) { setErrorKey("shortPassword"); return; }
    setErrorKey(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (json.ok) {
        toast.success(t("resetPasswordDone"));
        // পাসওয়ার্ড বদলানো — এখন হোমে গিয়ে নতুন পাসওয়ার্ডে লগইন করুন।
        setTimeout(() => { window.location.href = "/"; }, 900);
        return;
      }
      setErrorKey((json.error as TranslationKey) ?? "serverError");
    } catch {
      setErrorKey("offline");
    } finally {
      setBusy(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-dvh bg-background overflow-hidden flex flex-col">
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
            <h1 className="text-xl font-extrabold text-gradient-emerald tracking-tight">
              {lang === "bn" ? "গাড়িখাতা" : "GariKhata"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">{t("resetPasswordTitle")}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
        <Card className="border-border/60 shadow-lift backdrop-blur-sm bg-card/95 rounded-2xl">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              {t("resetPasswordSubtitle")}
            </p>
            <form onSubmit={submit} className="space-y-3.5">
              {errorKey && (
                <Alert variant="destructive" className="items-start">
                  <TriangleAlert className="size-4 mt-0.5" />
                  <AlertDescription className="text-[13px]">{t(errorKey)}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="size-3.5" />
                  {t("newPassword")}
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="h-11 text-[15px] rounded-xl"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="size-3.5" />
                  {t("confirmPassword")}
                </Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••"
                  className="h-11 text-[15px] rounded-xl"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" size="lg" className="w-full h-11 text-sm font-semibold gap-2 rounded-xl bg-emerald-gradient text-primary-foreground shadow-glow-emerald hover:opacity-95 active:scale-[0.98] transition-all" disabled={busy}>
                {busy ? <Loader2 className="size-4.5 animate-spin" /> : <ShieldCheck className="size-4.5" />}
                {t("resetPasswordBtn")}
              </Button>
            </form>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
    </MotionConfig>
  );
}
