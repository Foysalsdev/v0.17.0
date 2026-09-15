import type { Metadata } from "next";
import type { ReactNode } from "react";

/* /admin — প্ল্যাটফর্ম মালিকের প্রাইভেট কনসোল: সার্চ ইঞ্জিনে আসবে না। */
export const metadata: Metadata = {
  title: "অ্যাডমিন প্যানেল — গাড়িখাতা",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
