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
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/ui-bits";
import { APP_VERSION } from "@/lib/version";
import { fmtDate, fmtNum } from "@/lib/format";
import type { TranslationKey } from "@/lib/i18n";
import { toast } from "sonner";
import {
  KeyRound,
  ShieldCheck,
  Loader2,
  TriangleAlert,
  Store,
  Users,
  Car,
  Route,
  UserPlus,
  Search,
  RefreshCcw,
  LogOut,
  ArrowLeft,
  UserRound,
  Lock,
  Database,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * /admin — প্ল্যাটফর্ম মালিকের (আপনার) কনসোল।
 * অ্যাপের ভেতরের কোনো মেনুতে নেই — সরাসরি /admin URL।
 *
 * লগইন (v1.0): প্রধান পথ = নিজের অ্যাকাউন্ট (ফোন+পাসওয়ার্ড) —
 * profiles.is_platform_admin = true হলে আসল ক্লাউড ডেটা দেখায়।
 * বিকল্প পথ = GK_ADMIN_KEY (server env / Cloudflare secret)।
 * ------------------------------------------------------------------ */

interface AdminBusinessRow {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  plan: string;
  members: number;
  vehicles: number;
  trips30d: number;
  createdAt: string;
}

interface AdminMemberRow {
  name: string;
  phone: string;
  role: string;
  businessName: string;
  joinedAt: string;
}

interface AdminData {
  source: "cloud" | "local";
  stats: { businesses: number; users: number; vehicles: number; trips30d: number; newUsers7d: number };
  businesses: AdminBusinessRow[];
  members: AdminMemberRow[];
}

type Phase = "loading" | "locked" | "ready";
type LoginMode = "account" | "key";

export default function AdminPage() {
  const { t } = useT();
  const lang = useApp((s) => s.lang);

  const [phase, setPhase] = React.useState<Phase>("loading");
  const [data, setData] = React.useState<AdminData | null>(null);
  const [warning, setWarning] = React.useState<TranslationKey | null>(null);
  const [loginMode, setLoginMode] = React.useState<LoginMode>("account");
  const [phoneInput, setPhoneInput] = React.useState("");
  const [passwordInput, setPasswordInput] = React.useState("");
  const [keyInput, setKeyInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [errorKey, setErrorKey] = React.useState<TranslationKey | null>(null);
  const [errorHint, setErrorHint] = React.useState<string>("");
  const [query, setQuery] = React.useState("");

  const loadOverview = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/overview");
      const json = (await res.json()) as {
        ok?: boolean;
        data?: AdminData;
        warning?: string | null;
        error?: string;
        hint?: string;
      };
      if (json.ok && json.data) {
        setData(json.data);
        setWarning((json.warning as TranslationKey | null) ?? null);
        setPhase("ready");
        return;
      }
      if (res.status === 401) {
        setPhase("locked");
        setErrorKey("adminSessionExpired");
        return;
      }
      setPhase("locked");
      setErrorKey((json.error as TranslationKey) ?? "serverError");
      setErrorHint(json.hint ?? "");
    } catch {
      setPhase("locked");
      setErrorKey("offline");
    }
  }, []);

  React.useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const submitAccount = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!phoneInput.trim() || !passwordInput) { setErrorKey("fillAll"); setErrorHint(""); return; }
    setBusy(true);
    setErrorKey(null);
    setErrorHint("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "account", phone: phoneInput.trim(), password: passwordInput }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; hint?: string };
      if (json.ok) {
        setPhoneInput("");
        setPasswordInput("");
        await loadOverview();
        return;
      }
      setErrorKey((json.error as TranslationKey) ?? "serverError");
      setErrorHint(json.hint ?? "");
    } catch {
      setErrorKey("offline");
    } finally {
      setBusy(false);
    }
  };

  const submitKey = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!keyInput.trim()) { setErrorKey("fillAll"); setErrorHint(""); return; }
    setBusy(true);
    setErrorKey(null);
    setErrorHint("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyInput }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; hint?: string };
      if (json.ok) {
        setKeyInput("");
        await loadOverview();
        return;
      }
      setErrorKey((json.error as TranslationKey) ?? "serverError");
      setErrorHint(json.hint ?? "");
    } catch {
      setErrorKey("offline");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch { /* ignore */ }
    setData(null);
    setWarning(null);
    setPhase("locked");
    setErrorKey(null);
    setErrorHint("");
  };

  const roleLabel = (r: string): string =>
    r === "owner" ? t("roleOwner")
    : r === "manager" ? t("roleManager")
    : r === "driver" ? t("roleDriver")
    : r === "accountant" ? t("roleAccountant")
    : lang === "bn" ? "স্টাফ" : "Staff";

  /* ---------------- locked / loading ---------------- */
  if (phase !== "ready") {
    return (
      <MotionConfig reducedMotion="user">
        <div className="relative min-h-dvh bg-background overflow-hidden flex flex-col">
          <div aria-hidden className="absolute inset-0 aurora-page" />
          <div aria-hidden className="absolute -top-24 -left-24 size-72 rounded-full bg-primary/12 blur-3xl animate-float" />
          <div aria-hidden className="absolute -bottom-32 -right-20 size-80 rounded-full bg-warning/10 blur-3xl animate-float [animation-delay:-4s]" />

          <div className="relative flex justify-between items-center p-4 pt-safe">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              {t("adminBackToApp")}
            </a>
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
                <p className="text-xs text-muted-foreground mt-1">{t("adminPanelSubtitle")}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            >
              <Card className="border-border/60 shadow-lift backdrop-blur-sm bg-card/95 rounded-2xl">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* mode tabs */}
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={loginMode === "account"}
                      onClick={() => { setLoginMode("account"); setErrorKey(null); setErrorHint(""); }}
                      className={`flex items-center justify-center gap-1.5 rounded-lg h-9 text-xs font-semibold transition-all ${
                        loginMode === "account" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <UserRound className="size-3.5" />
                      {t("adminTabAccount")}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={loginMode === "key"}
                      onClick={() => { setLoginMode("key"); setErrorKey(null); setErrorHint(""); }}
                      className={`flex items-center justify-center gap-1.5 rounded-lg h-9 text-xs font-semibold transition-all ${
                        loginMode === "key" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <KeyRound className="size-3.5" />
                      {t("adminTabKey")}
                    </button>
                  </div>

                  {errorKey && (
                    <Alert variant="destructive" className="items-start">
                      <TriangleAlert className="size-4 mt-0.5" />
                      <AlertDescription className="text-[13px] break-words">
                        {t(errorKey)}
                        {errorHint && (
                          <code className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono">{errorHint}</code>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {loginMode === "account" ? (
                    <form onSubmit={submitAccount} className="space-y-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <UserRound className="size-3.5" />
                          {t("adminPhoneLabel")}
                        </Label>
                        <Input
                          type="text"
                          inputMode="email"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder={lang === "bn" ? "০১৭xxxxxxxx বা you@mail.com" : "01xxxxxxxxx or you@mail.com"}
                          className="h-11 text-[15px] rounded-xl"
                          autoComplete="username"
                          autoFocus
                          disabled={phase === "loading"}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Lock className="size-3.5" />
                          {t("adminPasswordLabel")}
                        </Label>
                        <Input
                          type="password"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="h-11 text-[15px] rounded-xl"
                          autoComplete="current-password"
                          disabled={phase === "loading"}
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-11 text-sm font-semibold gap-2 rounded-xl bg-emerald-gradient text-primary-foreground shadow-glow-emerald hover:opacity-95 active:scale-[0.98] transition-all"
                        disabled={busy || phase === "loading"}
                      >
                        {busy || phase === "loading" ? (
                          <Loader2 className="size-4.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="size-4.5" />
                        )}
                        {phase === "loading" ? t("adminLoading") : t("adminLoginBtn")}
                      </Button>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {t("adminAccountHint")}
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={submitKey} className="space-y-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <KeyRound className="size-3.5" />
                          {t("adminKeyLabel")}
                        </Label>
                        <Input
                          type="password"
                          value={keyInput}
                          onChange={(e) => setKeyInput(e.target.value)}
                          placeholder={t("adminKeyPlaceholder")}
                          className="h-11 text-[15px] rounded-xl"
                          autoComplete="off"
                          autoFocus
                          disabled={phase === "loading"}
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-11 text-sm font-semibold gap-2 rounded-xl bg-emerald-gradient text-primary-foreground shadow-glow-emerald hover:opacity-95 active:scale-[0.98] transition-all"
                        disabled={busy || phase === "loading"}
                      >
                        {busy || phase === "loading" ? (
                          <Loader2 className="size-4.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="size-4.5" />
                        )}
                        {phase === "loading" ? t("adminLoading") : t("adminLoginBtn")}
                      </Button>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {t("adminKeyHint")}
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </MotionConfig>
    );
  }

  /* ---------------- ready ---------------- */
  const stats = data?.stats;
  const q = query.trim().toLowerCase();
  const businesses = data?.businesses ?? [];
  const members = data?.members ?? [];
  const filteredBiz = q
    ? businesses.filter((b) => [b.name, b.ownerName, b.phone, b.email, b.address].join(" ").toLowerCase().includes(q))
    : businesses;
  const filteredMembers = q
    ? members.filter((m) => [m.name, m.phone, m.businessName, m.role].join(" ").toLowerCase().includes(q))
    : members;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-dvh bg-background overflow-x-hidden">
        <div aria-hidden className="fixed inset-0 aurora-page" />

        <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 pb-16 pt-safe">
          {/* header */}
          <div className="flex flex-wrap items-center gap-3 py-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white ring-1 ring-border/60 shadow-lift shadow-primary/10">
              <BrandMark className="size-8" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-extrabold text-foreground tracking-tight leading-tight">
                {t("adminPanelTitle")}
                <span className="ml-2 align-middle text-[10px] font-semibold tabular text-muted-foreground">v{APP_VERSION}</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${data?.source === "cloud" ? "bg-primary/10 text-primary" : "bg-warning/15 text-warning-foreground"}`}>
                  <span className={`size-1.5 rounded-full ${data?.source === "cloud" ? "bg-primary" : "bg-warning"}`} />
                  {data?.source === "cloud" ? t("adminSourceCloud") : t("adminSourceLocal")}
                </span>
                <a href="/" className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <ArrowLeft className="size-3" />
                  {t("adminBackToApp")}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-xl text-xs"
                onClick={() => { void loadOverview(); toast(t("adminRefresh")); }}
              >
                <RefreshCcw className="size-3.5" />
                <span className="hidden sm:inline">{t("adminRefresh")}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-xl text-xs text-danger border-danger/30 hover:bg-danger/10"
                onClick={() => void logout()}
              >
                <LogOut className="size-3.5" />
                {t("adminLogout")}
              </Button>
              <LanguageToggle />
            </div>
          </div>

          {/* warning: local / setup-needed */}
          {warning && (
            <Alert className="mb-4 border-warning/40 bg-warning/10 rounded-2xl items-start">
              <Database className="size-4 mt-0.5 text-warning-foreground" />
              <AlertDescription className="text-[13px] text-warning-foreground leading-relaxed">
                {t(warning)}
              </AlertDescription>
            </Alert>
          )}

          {/* KPI */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <StatCard labelKey="adminStatBusinesses" value={fmtNum(stats.businesses, lang)} icon={Store} />
              <StatCard labelKey="adminStatUsers" value={fmtNum(stats.users, lang)} icon={Users} />
              <StatCard labelKey="adminStatVehicles" value={fmtNum(stats.vehicles, lang)} icon={Car} />
              <StatCard labelKey="adminStatTrips30" value={fmtNum(stats.trips30d, lang)} icon={Route} />
              <StatCard labelKey="adminStatNew7" value={fmtNum(stats.newUsers7d, lang)} icon={UserPlus} tone="success" />
            </div>
          )}

          {/* search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("adminSearchPlaceholder")}
              className="h-11 pl-10 text-[15px] rounded-xl bg-card/90 backdrop-blur-sm"
            />
          </div>

          {/* businesses */}
          <Card className="border-border/60 shadow-soft bg-card/95 backdrop-blur-sm rounded-2xl mb-5">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-border/60">
                <Store className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground">{t("adminBusinessesSection")}</h2>
                <span className="ml-auto text-[11px] tabular text-muted-foreground">{fmtNum(filteredBiz.length, lang)}</span>
              </div>
              {filteredBiz.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <Search className="size-5" />
                  <p className="text-xs">{t("adminNoResults")}</p>
                </div>
              ) : (
                <ul>
                  {filteredBiz.map((b) => (
                    <li key={b.id} className="px-4 sm:px-5 py-3.5 border-b border-border/50 last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-foreground truncate">{b.name}</p>
                            <Badge variant={b.plan && b.plan !== "free" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-4.5 rounded-full">
                              {b.plan || "free"}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground truncate">
                            {t("adminOwner")}: {b.ownerName} · {b.phone}
                          </p>
                          {b.address && b.address !== "—" && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground/80 truncate">{b.address}</p>
                          )}
                        </div>
                        <p className="shrink-0 text-[11px] tabular text-muted-foreground pt-0.5">
                          {fmtDate(b.createdAt, lang, true)}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 tabular"><Users className="size-3" />{fmtNum(b.members, lang)}</span>
                        <span className="inline-flex items-center gap-1 tabular"><Car className="size-3" />{fmtNum(b.vehicles, lang)}</span>
                        <span className="inline-flex items-center gap-1 tabular"><Route className="size-3" />{fmtNum(b.trips30d, lang)}</span>
                        {b.email !== "—" && <span className="truncate max-w-[200px]">{b.email}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* recent members */}
          <Card className="border-border/60 shadow-soft bg-card/95 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-border/60">
                <Users className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground">{t("adminMembersSection")}</h2>
                <span className="ml-auto text-[11px] tabular text-muted-foreground">{fmtNum(filteredMembers.length, lang)}</span>
              </div>
              {filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <Search className="size-5" />
                  <p className="text-xs">{t("adminNoResults")}</p>
                </div>
              ) : (
                <ul>
                  {filteredMembers.map((m, i) => (
                    <li key={`${m.phone}-${i}`} className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border/50 last:border-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 rounded-full shrink-0">
                            {roleLabel(m.role)}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {m.phone} · {m.businessName}
                        </p>
                      </div>
                      <p className="shrink-0 text-[11px] tabular text-muted-foreground pt-0.5">
                        {t("adminJoined")} {fmtDate(m.joinedAt, lang)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MotionConfig>
  );
}
