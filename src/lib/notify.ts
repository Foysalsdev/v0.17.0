"use client";

/**
 * Attention helpers (v0.10) — toast/reminder যেন চোখে পড়ে।
 * Owner: "app a toast notification amr chokhe poreni."
 * Vibration (Android — primary device) + হালকা দুই/তিন-সুরের chime।
 * সব কিছু best-effort: browser সাপোর্ট না থাকলে নীরব, কখনো error নয়।
 */

let audioCtx: AudioContext | null = null;

type Tone = { f: number; d: number; l: number };

const TONES: Record<"success" | "error" | "reminder", Tone[]> = {
  // নরম উঠানো দুই সুর
  success: [
    { f: 659, d: 0, l: 0.1 },
    { f: 880, d: 0.11, l: 0.16 },
  ],
  // নিচু, ভারী — ভুল হলে বোঝা যায়
  error: [
    { f: 392, d: 0, l: 0.14 },
    { f: 262, d: 0.15, l: 0.22 },
  ],
  // ঘণ্টা-ঘণ্টা-ঘণ্টা — রিমাইন্ডারের নিজস্ব সুর
  reminder: [
    { f: 880, d: 0, l: 0.13 },
    { f: 1175, d: 0.14, l: 0.16 },
    { f: 880, d: 0.31, l: 0.14 },
  ],
};

function chime(kind: "success" | "error" | "reminder"): void {
  try {
    const AC: typeof AudioContext | undefined =
      typeof window === "undefined"
        ? undefined
        : window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const t0 = audioCtx.currentTime;
    for (const tn of TONES[kind]) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = tn.f;
      gain.gain.setValueAtTime(0.0001, t0 + tn.d);
      gain.gain.exponentialRampToValueAtTime(0.14, t0 + tn.d + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tn.d + tn.l);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t0 + tn.d);
      osc.stop(t0 + tn.d + tn.l + 0.03);
    }
  } catch {
    /* শব্দ optional — চুপচাপ ফেলে দিই */
  }
}

/** Toast/রিমাইন্ডার দেখানোর সময় ডিভাইস নাড়ায় + ছোট সুর বাজায়।
 * ৩০০ms-এর মধ্যে বারবার ডাকলে একবারই শোনায় (alarm + observer একসাথে ডাকলে double হয় না)। */
let lastAt = 0;
export function attention(kind: "success" | "error" | "reminder"): void {
  try {
    const now = Date.now();
    if (now - lastAt < 300) return;
    lastAt = now;
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(kind === "reminder" ? [130, 70, 130, 70, 200] : [90, 50, 90]);
    }
    chime(kind);
  } catch {
    /* vibration optional */
  }
}
