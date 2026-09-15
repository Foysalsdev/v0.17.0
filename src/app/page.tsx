"use client";

import * as React from "react";
import { useApp } from "@/store";
import { LoginView } from "@/components/views/login-view";
import { SignupView } from "@/components/views/signup-view";
import { AppShell } from "@/components/app/app-shell";
import { DriverModeView } from "@/components/views/driver-mode-view";
import { BrandMark } from "@/components/app/brand";

/**
 * গাড়িখাতা (GarirKhata) — Vehicle Rental, Fleet & Business Management SaaS for Bangladesh.
 * v0.2 — production build: real login, server database (Prisma/SQLite in this sandbox,
 * Supabase blueprint in supabase/), server-computed stats, trip references.
 */
export default function Page() {
  const booted = useApp((s) => s.booted);
  const loggedIn = useApp((s) => s.loggedIn);
  const mode = useApp((s) => s.mode);
  const boot = useApp((s) => s.boot);
  const [showSignup, setShowSignup] = React.useState(false);

  React.useEffect(() => {
    void boot();
  }, [boot]);

  if (!booted) {
    return (
      <div className="relative min-h-dvh flex flex-col items-center justify-center gap-4 bg-background overflow-hidden">
        {/* v0.13 aurora splash */}
        <div aria-hidden className="absolute inset-0 aurora-page" />
        <div aria-hidden className="absolute -top-20 -left-24 size-72 rounded-full bg-primary/12 blur-3xl animate-float" />
        <span className="relative flex size-20 items-center justify-center rounded-3xl bg-white ring-1 ring-border/60 shadow-lift shadow-primary/15 animate-scale-in">
          <BrandMark className="size-14" />
        </span>
        <div className="relative flex items-center gap-2 text-sm text-muted-foreground animate-rise [animation-delay:120ms]">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          গাড়িখাতা…
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return showSignup
      ? <SignupView onBack={() => setShowSignup(false)} />
      : <LoginView onSignup={() => setShowSignup(true)} />;
  }
  if (mode === "driver") return <DriverModeView />;
  return <AppShell />;
}
