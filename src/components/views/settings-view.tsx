"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { ViewHeader } from "@/components/shared/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { LanguageToggle } from "@/components/app/language-toggle";
import { useTheme } from "next-themes";
import { Store, Languages, Palette, Users, Crown, LogOut, RefreshCcw, ShieldCheck, Download, Info, Edit, Check, X } from "lucide-react";
import { APP_VERSION } from "@/lib/version";
import { InstallButton } from "@/components/app/pwa-runtime";
import { useInstallPrompt } from "@/lib/install-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamManager } from "@/components/app/team-manager";
import { toast } from "sonner";
import type { TranslationKey } from "@/lib/i18n";

export function SettingsView() {
  const { t } = useT();
  const data = useApp((s) => s.data);
  const session = useApp((s) => s.session);
  const logout = useApp((s) => s.logout);
  const refresh = useApp((s) => s.refresh);
  const updateBusiness = useApp((s) => s.updateBusiness);
  const { theme, setTheme } = useTheme();
  const install = useInstallPrompt();
  const canEdit = session?.role === "owner" || session?.role === "manager";
  const [bizEditOpen, setBizEditOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <ViewHeader titleKey="navSettings" />

      {/* Business profile */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Store className="size-4 text-muted-foreground" /> {t("businessProfile")}
            </h2>
            {canEdit && !bizEditOpen && (
              <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-[12px] rounded-lg" onClick={() => setBizEditOpen(true)}>
                <Edit className="size-3.5" /> {t("editProfileBtn")}
              </Button>
            )}
          </div>
          {canEdit && bizEditOpen && (
            <BusinessProfileEditor onClose={() => setBizEditOpen(false)} />
          )}
          <div className="rounded-xl bg-muted/50 divide-y divide-border/60">
            <Row label={t("businessName")} value={data.business.name} />
            <Row label={t("name")} value={data.business.ownerName} />
            <Row label={t("phone")} value={data.business.phone} />
            <Row label={t("address")} value={data.business.address || "—"} />
          </div>
        </CardContent>
      </Card>

      {/* Language & appearance */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-4 space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="size-4 text-primary" /> {t("language")}
          </h2>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Languages className="size-4" /> {t("language")}
            </span>
            <LanguageToggle />
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <span className="text-sm text-muted-foreground">{t("appearance")}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{theme === "dark" ? t("darkMode") : t("lightMode")}</span>
              <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} aria-label={t("appearance")} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
            <div className="min-w-0">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Download className="size-4" /> {t("installApp")}
              </span>
              <span className="block text-[11px] text-muted-foreground/70 mt-0.5">
                {t("installAppDesc")}
                {!install.canInstall && !install.standalone && !install.isIOS ? ` · ${t("androidInstallHint")}` : ""}
              </span>
            </div>
            <InstallButton />
          </div>
        </CardContent>
      </Card>

      {/* Team — owner manages login accounts */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4 text-muted-foreground" /> {t("team")}
          </h2>
          <TeamManager />
        </CardContent>
      </Card>

      {/* Plan */}
      <Card className="border-border/70 shadow-xs bg-gradient-to-br from-primary/8 to-transparent">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Crown className="size-5" />
            </span>
            <div>
              <div className="text-sm font-semibold">{t("plan")}: {t("planFree")}</div>
              <div className="text-[11px] text-muted-foreground">
                {t("totalVehicles")}: {data.vehicles.length} / {data.business.vehicleLimit}+
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-4 space-y-2.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Info className="size-4 text-muted-foreground" /> {t("aboutApp")}
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("version")}</span>
            <span className="font-medium tabular">v{APP_VERSION} · Production</span>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl bg-success/8 border border-success/20 px-3.5 py-2.5">
            <ShieldCheck className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="text-[12px] leading-relaxed text-foreground/85">{t("dataSafety")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button variant="outline" className="h-11 rounded-xl gap-2" onClick={() => void refresh()}>
          <RefreshCcw className="size-4" /> {t("retry")}
        </Button>
        <Button variant="outline" className="h-11 rounded-xl gap-2 text-danger border-danger/30 hover:bg-danger/10 hover:text-danger" onClick={logout}>
          <LogOut className="size-4" /> {t("logout")}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ব্যবসার প্রোফাইল সম্পাদনা — "সম্পাদনা" চাপলে নিচে ছোট-লেখা
 * ফর্ম খোলে (v0.14 informational স্টাইল), সেভ করলে snapshot রিফ্রেশ।
 * ------------------------------------------------------------------ */
function BusinessProfileEditor({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const data = useApp((s) => s.data);
  const busy = useApp((s) => s.busy);
  const updateBusiness = useApp((s) => s.updateBusiness);
  const [name, setName] = React.useState(data.business.name);
  const [ownerName, setOwnerName] = React.useState(data.business.ownerName);
  const [phone, setPhone] = React.useState(data.business.phone);
  const [address, setAddress] = React.useState(data.business.address);
  const [errorKey, setErrorKey] = React.useState<TranslationKey | null>(null);

  const save = async () => {
    if (!name.trim() || !ownerName.trim()) { setErrorKey("fillAll"); return; }
    if (phone && !/^01\d{9}$/.test(phone.replace(/\D/g, ""))) { setErrorKey("invalidPhone"); return; }
    setErrorKey(null);
    const err = await updateBusiness({
      name: name.trim(),
      ownerName: ownerName.trim(),
      phone: phone.replace(/\D/g, ""),
      address: address.trim(),
    });
    if (err) { setErrorKey((err as TranslationKey) ?? "serverError"); return; }
    toast.success(t("businessSaved"));
    onClose();
  };

  return (
    <div className="w-full space-y-2.5 rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold">{t("editBusinessTitle")}</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1 col-span-2">
          <label className="text-[11px] font-medium text-muted-foreground">{t("businessName")}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 text-[14px] rounded-lg" placeholder={t("signupBusinessNamePh")} />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">{t("name")}</label>
          <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="h-10 text-[14px] rounded-lg" placeholder={t("ownerNamePh")} />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">{t("phone")}</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 text-[14px] rounded-lg tabular" placeholder="01XXXXXXXXX" inputMode="numeric" />
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-[11px] font-medium text-muted-foreground">{t("address")}</label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-10 text-[14px] rounded-lg" placeholder={t("addressPh")} />
        </div>
      </div>
      {errorKey && <p className="text-[11.5px] text-danger">{t(errorKey)}</p>}
      <div className="flex justify-end gap-2 pt-0.5">
        <Button variant="outline" size="sm" className="h-9 px-3.5 gap-1.5 text-[12.5px] rounded-lg" onClick={onClose} disabled={busy}>
          <X className="size-3.5" /> {t("cancel")}
        </Button>
        <Button size="sm" className="h-9 px-3.5 gap-1.5 text-[12.5px] rounded-lg bg-emerald-gradient text-primary-foreground" onClick={save} disabled={busy}>
          <Check className="size-3.5" /> {busy ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
