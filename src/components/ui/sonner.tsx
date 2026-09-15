"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";
import { attention } from "@/lib/notify";

/**
 * v0.10 — বড়, দৃশ্যমান toast (owner: "toast notification amr chokhe poreni").
 * - বড় কার্ড + বোল্ড টাইটেল + বড় আইকন, ৬ সেকেন্ড, উপরে-মাঝখানে (notch-safe)
 * - নতুন toast উঠলে vibration + ছোট chime (sonner-এ global on-mount hook
 *   নেই বলে MutationObserver দিয়ে ধরা হয়েছে — সব toast-এ কাজ করে)
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const hostRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof MutationObserver === "undefined") return;
    const seen = new WeakSet<Element>();
    const mo = new MutationObserver((records) => {
      for (const rec of records) {
        for (const node of rec.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          const el = node.matches("[data-sonner-toast]")
            ? node
            : (node.querySelector("[data-sonner-toast]") as HTMLElement | null);
          if (!el || seen.has(el)) continue;
          seen.add(el);
          const type = el.getAttribute("data-type") ?? "default";
          attention(type === "error" ? "error" : "success");
        }
      }
    });
    mo.observe(host, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="gk-toaster-host">
      <Sonner
        theme={theme as ToasterProps["theme"]}
        position="top-center"
        duration={6000}
        offset="calc(env(safe-area-inset-top, 0px) + 14px)"
        gap={10}
        className="toaster group"
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--width": "min(420px, calc(100vw - 1.5rem))",
          } as React.CSSProperties
        }
        toastOptions={{
          classNames: {
            toast:
              "!rounded-2xl !px-4 !py-4 !shadow-2xl !gap-3.5 !items-center !font-sans",
            title: "!text-[15px] !font-bold !leading-snug !tracking-tight",
            description: "!text-[13.5px] !opacity-95 !leading-relaxed !mt-0.5",
            icon: "!size-7 !stroke-[2.2]",
            actionButton:
              "!h-10 !px-4 !rounded-xl !text-sm !font-semibold",
            closeButton: "!size-9 !rounded-full !border-transparent",
          },
        }}
        {...props}
      />
    </div>
  );
};

export { Toaster };
