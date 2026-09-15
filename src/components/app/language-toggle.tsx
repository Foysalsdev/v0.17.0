"use client";

import { useApp, useT } from "@/store";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bangla / English switch — one tap (Section 5). */
export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useApp();
  const { t } = useT();
  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "flex items-center rounded-full border border-border bg-card p-0.5 select-none",
        compact ? "scale-95" : ""
      )}
    >
      {(["bn", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={cn(
            "flex items-center justify-center rounded-full text-xs font-semibold px-2.5 h-7 min-w-9 transition-colors",
            lang === l ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l === "bn" ? "বাং" : "EN"}
        </button>
      ))}
    </div>
  );
}

export function LanguageToggleIcon() {
  const { lang, setLang } = useT();
  return (
    <button
      type="button"
      aria-label="Toggle language"
      onClick={() => setLang(lang === "bn" ? "en" : "bn")}
      className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
    >
      <Languages className="size-5" />
    </button>
  );
}
