"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { AppLogo, BrandMark } from "@/components/app/brand";
import { LanguageToggle } from "@/components/app/language-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UserRoundPlus, Loader2, TriangleAlert, Store, User, KeyRound, Smartphone, Mail, ArrowLeft } from "lucide-react";
import { APP_VERSION } from "@/lib/version";
import type { TranslationKey } from "@/lib/i18n";

/** Self-service signup — creates the business + the owner account, then logs straight in. */
export function SignupView({ onBack }: { onBack: () => void }) {
  const { t } = useT();
  const signup = useApp((s) => s.signup);
  const busy = useApp((s) => s.busy);
  const [businessName, setBusinessName] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!businessName.trim() || !ownerName.trim() || !phone.trim() || !email.trim() || !password) { setError(t("fillAll")); return; }
    if (!validEmail(email.trim())) { setError(t("invalidEmail")); return; }
    if (password !== confirm) { setError(t("passwordMismatch")); return; }
    setError(null);
    const err = await signup({
      businessName: businessName.trim(), ownerName: ownerName.trim(),
      phone: phone.trim(), email: email.trim().toLowerCase(), password,
    });
    if (err) setError(t(err as TranslationKey));
  };

  return (
    <div className="relative min-h-dvh bg-background overflow-hidden flex flex-col">
      {/* v0.13 aurora backdrop + floating brand blobs */}
      <div aria-hidden className="absolute inset-0 aurora-page" />
      <div aria-hidden className="absolute -top-24 -left-24 size-72 rounded-full bg-primary/12 blur-3xl animate-float" />
      <div aria-hidden className="absolute -bottom-32 -right-20 size-80 rounded-full bg-warning/10 blur-3xl animate-float [animation-delay:-4s]" />

      <div className="relative flex items-center justify-between p-4 pt-safe">
        <Button variant="ghost" size="sm" className="gap-1.5 h-9 rounded-lg text-muted-foreground" onClick={onBack}>
          <ArrowLeft className="size-4" /> {t("loginBtn")}
        </Button>
        <LanguageToggle />
      </div>

      <div className="relative flex-1 flex flex-col justify-center max-w-md w-full mx-auto px-6 pb-10">
        <div className="flex flex-col items-center text-center gap-3.5 mb-8 animate-rise">
          <span className="flex size-18 items-center justify-center rounded-3xl bg-white ring-1 ring-border/60 shadow-lift shadow-primary/15">
            <BrandMark className="size-13" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gradient-emerald tracking-tight">গাড়িখাতা</h1>
            <p className="text-xs text-muted-foreground mt-1">{t("signupSubtitle")}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="rounded-full bg-muted/60 text-muted-foreground border-border font-semibold tabular">
              v{APP_VERSION}
            </Badge>
            <span>· {t("savedServerNote")}</span>
          </div>
        </div>

        <Card className="border-border/60 shadow-lift backdrop-blur-sm bg-card/95 rounded-2xl animate-rise [animation-delay:80ms]">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <form onSubmit={submit} className="space-y-3.5">
              {error && (
                <Alert variant="destructive" className="items-start">
                  <TriangleAlert className="size-4 mt-0.5" />
                  <AlertDescription className="text-[13px]">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Store className="size-3.5" />
                  {t("signupBusinessName")}
                </Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={t("signupBusinessNamePh")}
                  className="h-11 text-[15px] rounded-xl"
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <User className="size-3.5" />
                  {t("signupOwnerName")}
                </Label>
                <Input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder={t("name")}
                  className="h-11 text-[15px] rounded-xl"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Smartphone className="size-3.5" />
                  {t("loginPhone")}
                </Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="h-11 text-[15px] tabular rounded-xl"
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {t("signupEmail")} <span className="text-danger">*</span>
                </Label>
                <Input
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("signupEmailPh")}
                  className="h-11 text-[15px] rounded-xl"
                  autoComplete="email"
                />
                <p className="text-[11px] text-muted-foreground">{t("signupEmailHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="size-3.5" />
                  {t("signupPassword")}
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
                  {t("newPassword")}
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
                {busy ? <Loader2 className="size-4.5 animate-spin" /> : <UserRoundPlus className="size-4.5" />}
                {t("signupBtn")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 w-full text-center text-sm text-primary font-medium underline-offset-4 hover:underline"
        >
          {t("signupHaveAccount")}
        </button>
      </div>
    </div>
  );
}
