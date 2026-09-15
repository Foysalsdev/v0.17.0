"use client";

import * as React from "react";
import { useT } from "@/store";
import { WifiOff, Download, Share, PlusSquare, CheckSquare } from "lucide-react";
import { initInstallPrompt, useInstallPrompt } from "@/lib/install-prompt";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

/**
 * PWA runtime:
 * 1. Registers the service worker (installable, offline app shell).
 * 2. Shows a friendly offline banner when the network drops (Section 50/51).
 * 3. Wires the install prompt capture (our own Bangla install UX, not the
 *    browser mini-infobar) + the iOS "Add to Home Screen" guide dialog.
 */
export function PwaRuntime() {
  const { t } = useT();
  const [offline, setOffline] = React.useState(false);
  const { instructionsOpen, closeInstructions, isIOS } = useInstallPrompt();

  React.useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    const cleanupInstall = initInstallPrompt();

    // Register service worker after full load (does not block startup)
    const register = () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          /* SW is a progressive enhancement — silently ignore failures */
        });
      }
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      cleanupInstall();
    };
  }, []);

  return (
    <>
      {offline && (
        <div role="status" className="sticky top-14 z-20 bg-warning/25 border-b border-warning/40 px-4 py-2">
          <div className="mx-auto max-w-5xl flex items-center gap-2 text-warning-foreground">
            <WifiOff className="size-4 shrink-0" />
            <span className="text-xs font-medium">{t("offline")} — {t("offlineDesc")}</span>
          </div>
        </div>
      )}

      {/* iOS (and any browser without a native prompt): 3-step home-screen guide */}
      <Dialog open={instructionsOpen} onOpenChange={(v) => { if (!v) closeInstructions(); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left">
              <Share className="size-4.5 text-primary" /> {t("iosInstallTitle")}
            </DialogTitle>
            <DialogDescription className="text-left text-xs">{t("iosInstallHint")}</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 px-1 pb-1">
            <Step icon={<Share className="size-4.5" />} text={t("iosInstallStep1")} />
            <Step icon={<PlusSquare className="size-4.5" />} text={t("iosInstallStep2")} />
            <Step icon={<CheckSquare className="size-4.5" />} text={t("iosInstallStep3")} />
          </ol>
        </DialogContent>
      </Dialog>
      {!isIOS && null /* hint key reserved for non-iOS fallbacks */}
    </>
  );
}

function Step({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="text-[13px] leading-relaxed text-foreground/90 pt-1.5">{text}</span>
    </li>
  );
}

/** Reusable install row button (settings + dashboard banner use this state). */
export function InstallButton({ className }: { className?: string }) {
  const { t } = useT();
  const { canInstall, standalone, isIOS, promptInstall, openInstructions } = useInstallPrompt();

  if (standalone) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
        <Download className="size-3.5" /> {t("appInstalled")}
      </span>
    );
  }
  if (canInstall || isIOS) {
    return (
      <button
        type="button"
        onClick={() => (canInstall ? void promptInstall() : openInstructions())}
        className={className ?? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition"}
      >
        <Download className="size-3.5" /> {t("installNow")}
      </button>
    );
  }
  return null;
}
