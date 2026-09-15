"use client";

/**
 * PWA install prompt (Phase "install UX"):
 * - Captures Chrome/Edge Android+Desktop `beforeinstallprompt` so the app can
 *   show its OWN Bangla install UI (the native mini-infobar is suppressed).
 * - iOS Safari never fires that event → the settings row + banner open the
 *   3-step "Add to Home Screen" guide instead.
 * - Dismissal is remembered in localStorage until the app is actually installed.
 */
import { create } from "zustand";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "gk-install-dismissed";

interface InstallState {
  /** Chrome/Edge fired beforeinstallprompt → we can show our own install UI. */
  canInstall: boolean;
  /** App already runs as an installed PWA. */
  standalone: boolean;
  /** iOS Safari (no native prompt — guide the user through Add to Home Screen). */
  isIOS: boolean;
  /** User dismissed the banner (remembered). */
  dismissed: boolean;
  instructionsOpen: boolean;
  capture: (e: Event) => void;
  promptInstall: () => Promise<void>;
  openInstructions: () => void;
  closeInstructions: () => void;
  dismiss: () => void;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export const useInstallPrompt = create<InstallState>()((set, get) => ({
  canInstall: false,
  standalone: false,
  isIOS: false,
  dismissed: false,
  instructionsOpen: false,

  capture: (e) => {
    e.preventDefault(); // suppress the browser's own mini-infobar
    deferredPrompt = e as BeforeInstallPromptEvent;
    set({ canInstall: true });
  },

  promptInstall: async () => {
    if (!deferredPrompt) {
      get().openInstructions();
      return;
    }
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") set({ canInstall: false, standalone: true });
      else set({ dismissed: true });
    } catch {
      /* browser refused — fall back to the guide */
      get().openInstructions();
    } finally {
      deferredPrompt = null;
    }
  },

  openInstructions: () => set({ instructionsOpen: true }),
  closeInstructions: () => set({ instructionsOpen: false }),

  dismiss: () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch { /* storage blocked — session-only dismissal */ }
    set({ dismissed: true });
  },
}));

/** Runs once on app mount (called from PwaRuntime). */
export function initInstallPrompt(): () => void {
  const store = useInstallPrompt.getState();
  useInstallPrompt.setState({
    standalone: isStandalone(),
    isIOS: /iphone|ipad|ipod/i.test(window.navigator.userAgent),
    dismissed: readDismissed(),
  });

  window.addEventListener("beforeinstallprompt", store.capture);
  window.addEventListener("appinstalled", () => {
    useInstallPrompt.setState({ canInstall: false, standalone: true });
  });
  return () => window.removeEventListener("beforeinstallprompt", store.capture);
}
