"use client";

import * as React from "react";
import { toast } from "sonner";
import { useApp } from "@/store";
import { fmtTime, toBnDigits } from "@/lib/format";
import { attention } from "@/lib/notify";

/**
 * v0.10 — LIVE reminder alarm. App খোলা থাকলে প্রতি ৩০ সেকেন্ডে দেখে:
 * কোনো রিমাইন্ডারের সময় হয়েছে কি না। হলে বড় toast + vibration + ঘণ্টা-সুর।
 * প্রতিটা reminder একবারই বাজে (sessionStorage-এ মনে রাখে — refresh-এ আবার না)।
 * আর app খুলতেই বাকি (overdue) রিমাইন্ডার থাকলে একটা summary toast।
 */

const FIRED_KEY = "gk_fired_reminders";

function loadFired(): Set<string> {
  try {
    const raw = sessionStorage.getItem(FIRED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

function persistFired(ids: Set<string>): void {
  try {
    const arr = [...ids].slice(-200);
    sessionStorage.setItem(FIRED_KEY, JSON.stringify(arr));
  } catch {
    /* private mode — শুধু এই লোডে মনে থাকবে */
  }
}

export function ReminderAlarms() {
  const reminders = useApp((s) => s.data.reminders);
  const view = useApp((s) => s.view);
  const navigate = useApp((s) => s.navigate);
  const refresh = useApp((s) => s.refresh);
  const { t, lang } = useApp();
  const firedRef = React.useRef<Set<string>>(loadFired());
  const bootedRef = React.useRef(false);
  /* app খোলার সময় থেকে হিসাব — boot-এর আগেই overdue রিমাইন্ডার summary-তে
   * যায় (toast spam এড়াতে), খোলা অবস্থায় সময় হলে আলাদা alarm বাজে। */
  const bootAtRef = React.useRef(Date.now());

  const check = React.useCallback(() => {
    if (!Array.isArray(reminders) || document.visibilityState === "hidden") return;
    const now = Date.now();
    let changed = false;

    for (const r of reminders) {
      if (r.done || firedRef.current.has(r.id)) continue;
      const due = +new Date(r.dueAt);
      if (Number.isNaN(due) || due > now) continue;

      firedRef.current.add(r.id);
      changed = true;
      if (due < bootAtRef.current) continue; // boot-এর আগের overdue — summary দেখাবে

      // এই reminder এর সময় এখন হয়েছে — একবার বাজাও
      const when = `${fmtTime(r.dueAt, lang)} — ${t("reminderAlarmTitle")}`;
      const desc = `${r.title}${r.notes ? ` · ${r.notes}` : ""} · ${when}`;
      attention("reminder");
      toast.warning(desc, {
        description: t("reminderTimeHint"),
        duration: 10000,
        action: {
          label: t("viewNow"),
          onClick: () => navigate("reminders"),
        },
      });
    }

    if (changed) persistFired(firedRef.current);
  }, [reminders, t, lang, navigate]);

  /* বুট summary: বাকি থাকা রিমাইন্ডার থাকলে একটাই toast */
  React.useEffect(() => {
    if (bootedRef.current || !Array.isArray(reminders)) return;
    bootedRef.current = true;
    const pending = reminders.filter((r) => !r.done && +new Date(r.dueAt) <= Date.now());
    if (pending.length === 0) return;
    const timer = setTimeout(() => {
      attention("reminder");
      toast.warning(`${toBnDigits(pending.length)} ${t("pendingRemindersSummary")}`, {
        duration: 8000,
        action: {
          label: t("viewNow"),
          onClick: () => navigate("reminders"),
        },
      });
    }, 1600);
    return () => clearTimeout(timer);
  }, [reminders, t, lang, navigate]);

  /* ৩০ সেকেন্ড + tab-এ ফিরে এলে + data বদলালে চেক।
   * ২ মিনিট পর পর সার্ভার থেকেও fresh data আনে — অন্য device-এ/ঘণ্টা
   * পর তৈরি হওয়া রিমাইন্ডারও (trip বানালে auto) অ্যালার্ম দেয়। */
  React.useEffect(() => {
    check();
    const iv = setInterval(check, 30_000);
    const ivData = setInterval(() => { void refresh(); }, 120_000);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void refresh();
        check();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      clearInterval(ivData);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [check, refresh]);

  // view switch করলেও দ্রুত একবার চেক (নতুন trip থেকে auto reminder এসেছে কি না)
  React.useEffect(() => {
    if (view) check();
  }, [view, check]);

  return null;
}
