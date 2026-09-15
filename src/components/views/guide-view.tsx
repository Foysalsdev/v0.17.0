"use client";

import * as React from "react";
import { useT } from "@/store";
import { useApp } from "@/store";
import { StatusBadge } from "@/components/shared/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BookOpen, ChevronDown, CircleAlert, CheckCircle2, Wrench, TriangleAlert, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface Symptom {
  id: string;
  titleKey: Parameters<ReturnType<typeof useT>["t"]>[0];
  severity: "low" | "medium" | "high";
  causes: { bn: string[]; en: string[] };
  checkFirst: { bn: string; en: string };
  canDrive: { bn: string; en: string };
}

/** Educational symptom guide — "সম্ভাব্য কারণ", never a confirmed diagnosis (Section 19). */
const SYMPTOMS: Symptom[] = [
  {
    id: "ac",
    titleKey: "symptomAcNotCooling",
    severity: "low",
    causes: {
      bn: ["এসি ফিল্টার/কনডেনসার নোংরা হয়ে গেছে", "ফ্রিগন গ্যাস কমে গেছে বা লিক হয়েছে", "কম্প্রেসার বা ক্লাচ সমস্যা", "কনডেনসার ফ্যান কাজ করছে না"],
      en: ["Clogged AC filter / dirty condenser", "Low or leaking refrigerant gas", "Compressor or clutch issue", "Condenser fan not working"],
    },
    checkFirst: {
      bn: "প্রথমে কেবিন ফিল্টার দেখুন — নোংরা হলে পরিষ্কার/বদলান। ইঞ্জিন চালু রেখে এসি অন করে কম্প্রেসার চালু হচ্ছে কিনা শুনুন।",
      en: "Check the cabin filter first — clean or replace if dirty. With engine on and AC on, listen for the compressor engaging.",
    },
    canDrive: {
      bn: "সাধারণত চালানো যায়, তবে দীর্ঘ ট্রিপে অস্বস্তি হয়। লম্বা যাত্রার আগে ঠিক করানো ভালো।",
      en: "Usually OK to drive, but uncomfortable on long trips. Fix before a long journey.",
    },
  },
  {
    id: "heat",
    titleKey: "symptomOverheating",
    severity: "high",
    causes: {
      bn: ["রেডিয়েটরে পানি/কুল্যান্ট কম", "রেডিয়েটর ব্লক বা ফ্যান নষ্ট", "থার্মোস্ট্যাট কাজ করছে না", "পানির পাম্প/বেল্ট সমস্যা"],
      en: ["Low coolant / water in radiator", "Blocked radiator or failed fan", "Faulty thermostat", "Water pump / belt problem"],
    },
    checkFirst: {
      bn: "ইঞ্জিন ঠান্ডা হলে রেডিয়েটরের পানি লেভেল দেখুন। ড্রাইভের সময় তাপমাত্রা নির্দেশক যত্রতত্র করলে সঙ্গে সঙ্গে গাড়ি থামান।",
      en: "When the engine is cold, check the radiator coolant level. If the temperature gauge spikes while driving, stop immediately.",
    },
    canDrive: {
      bn: "না — গরম হলে চালানো বন্ধ করুন। ইঞ্জিন নষ্ট হওয়ার ঝুঁকি আছে।",
      en: "No — stop driving when it overheats. Risk of severe engine damage.",
    },
  },
  {
    id: "start",
    titleKey: "symptomHardStart",
    severity: "medium",
    causes: {
      bn: ["ব্যাটারি দুর্বল বা টার্মিনাল নোংরা", "স্টার্টার মোটর/সেলিনয়েড সমস্যা", "গ্লো প্লাগ নষ্ট (ডিজেল)", "ইগনিশন/ফুয়েল সিস্টেম সমস্যা"],
      en: ["Weak battery or corroded terminals", "Starter motor / solenoid issue", "Glow plugs worn out (diesel)", "Ignition or fuel system problem"],
    },
    checkFirst: {
      bn: "হেডলাইট জ্বালিয়ে স্টার্ট দিন — আলো ঝাপসা হলে ব্যাটারি দুর্বল। ব্যাটারি টার্মিনাল পরিষ্কার করে আবার চেষ্টা করুন।",
      en: "Turn on headlights and crank — if lights dim, the battery is weak. Clean battery terminals and retry.",
    },
    canDrive: {
      bn: "স্টার্ট হলে চালানো যায়, কিন্তু কোথাও আটকে গেলে আবার স্টার্ট নাও হতে পারে — শিগগিরই চেক করান।",
      en: "Drivable once started, but it may not restart when you stop — get it checked soon.",
    },
  },
  {
    id: "pickup",
    titleKey: "symptomLowPickup",
    severity: "medium",
    causes: {
      bn: ["এয়ার ফিল্টার ব্লক", "ইঞ্জিন অয়েল পুরনো/কম", "ফুয়েল ফিল্টার ব্লক", "ক্লাচ প্লেট ঘষা লেগে গেছে", "ইঞ্জিন টিউনিং দরকার"],
      en: ["Blocked air filter", "Old or low engine oil", "Clogged fuel filter", "Worn clutch plate", "Engine needs tuning"],
    },
    checkFirst: {
      bn: "শেষ কখন অয়েল-ফিল্টার বদলানো হয়েছে দেখুন — এই অ্যাপের সার্ভিস রেকর্ড থেকেই দেখতে পারবেন।",
      en: "Check when oil/filters were last changed — you can see it right in this app's service records.",
    },
    canDrive: {
      bn: "চালানো যায়, তবে বেশি সময় ফেললে ইঞ্জিনের ক্ষতি ও তেল খরচ বাড়ে।",
      en: "Drivable, but delaying causes engine strain and higher fuel use.",
    },
  },
  {
    id: "brake",
    titleKey: "symptomBrakeNoise",
    severity: "high",
    causes: {
      bn: ["ব্রেক প্যাড শেষ হয়ে গেছে", "ব্রেক ডিস্ক/ড্রাম অসমান", "ব্রেকে পাথর/ধুলা ঢুকেছে", "ব্রেক ফ্লুইড কম"],
      en: ["Worn-out brake pads", "Uneven disc or drum", "Stone or dust trapped in brakes", "Low brake fluid"],
    },
    checkFirst: {
      bn: "ব্রেক চাপলে শব্দ আর গাড়ি একপাশে টানছে কিনা খেয়াল করুন। দুটোই হলে প্যাড শেষ হওয়ার সম্ভাবনা বেশি।",
      en: "Notice noise plus the car pulling to one side when braking — both point to worn pads.",
    },
    canDrive: {
      bn: "জরুরি না হলে দূরে যাওয়া ঠিক না। ব্রেক = নিরাপত্তা — আগে ঠিক করান।",
      en: "Avoid driving if possible. Brakes = safety — fix first.",
    },
  },
  {
    id: "smoke",
    titleKey: "symptomSmoke",
    severity: "high",
    causes: {
      bn: ["নীল ধোঁয়া: ইঞ্জিন অয়েল পুড়ছে", "সাদা ধোঁয়া: কুল্যান্ট লিক / হেড গ্যাসকেট", "কালো ধোঁয়া: বাতাস-তেলের মিশ্রণ ভুল (ডিজেল পাম্প টিউনিং)"],
      en: ["Blue smoke: engine burning oil", "White smoke: coolant leak / head gasket", "Black smoke: wrong fuel-air mixture (diesel pump tuning)"],
    },
    checkFirst: {
      bn: "ধোঁয়ার রং লক্ষ করুন — রং দেখে কারণটা বোঝা যায়। রঙ নোট করে মেকানিককে বলুন।",
      en: "Note the smoke color — it reveals the cause. Tell the mechanic the color.",
    },
    canDrive: {
      bn: "যতটা সম্ভব চালাবেন না — সমস্যা বড় হতে পারে।",
      en: "Avoid driving — the underlying issue can be serious.",
    },
  },
  {
    id: "vib",
    titleKey: "symptomVibration",
    severity: "medium",
    causes: {
      bn: ["ইঞ্জিন মাউন্ট নষ্ট", "টায়ার ব্যালান্স/অ্যালাইনমেন্ট ভুল", "হুইল বেaring নষ্ট", "স্টিয়ারিং যন্ত্রাংশ ঝুলে গেছে"],
      en: ["Worn engine mount", "Tyre balance / alignment off", "Worn wheel bearing", "Loose steering components"],
    },
    checkFirst: {
      bn: "কোন গতিতে কাঁপে দেখুন: স্টিয়ারিং কাঁপলে সামনের টায়ার/ব্যালান্সিং, পুরো গাড়ি কাঁপলে মাউন্ট বা পেছনের টায়ার।",
      en: "Note the speed where vibration happens: steering shakes → front tyres/balancing; whole car shakes → mounts or rear tyres.",
    },
    canDrive: {
      bn: "হালকা হলে চালানো যায়, বেশি ঝাঁকুনি মানেই কোথাও সমস্যা — চেক করান।",
      en: "Mild vibration is drivable; strong shaking means something is wrong — get it checked.",
    },
  },
  {
    id: "battery",
    titleKey: "symptomBattery",
    severity: "medium",
    causes: {
      bn: ["ব্যাটারির বয়স ২-৩ বছর হয়ে গেছে", "টার্মিনাল ক্ষয়/লুজ", "অ্যালটারনেটর চার্জ দিচ্ছে না", "গাড়ি বেশি দিন বন্ধ ছিল"],
      en: ["Battery age over 2–3 years", "Corroded or loose terminals", "Alternator not charging", "Vehicle parked unused for long"],
    },
    checkFirst: {
      bn: "ব্যাটারির গায়ে তারিখ দেখুন এবং টার্মিনাল পরিষ্কার-টাইট করুন। স্টার্টের সময় হর্ন দুর্বল হলে ব্যাটারি সন্দেহ করুন।",
      en: "Check the date printed on the battery and clean/tighten terminals. If the horn is weak during cranking, suspect the battery.",
    },
    canDrive: {
      bn: "স্টার্ট হলে চলবে; জাম্প দিয়ে চালু করে সরাসরি ব্যাটারি-অ্যালটারনেটর চেক করান।",
      en: "Runs once started; jump-start and get battery and alternator checked directly.",
    },
  },
];

export function GuideView() {
  const { t, lang } = useT();
  const [openId, setOpenId] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">{t("navGuide")}</h1>

      <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
        <TriangleAlert className="size-4.5 shrink-0 mt-0.5 text-muted-foreground" />
        <p className="text-[12px] leading-relaxed text-warning-foreground">{t("guideDisclaimer")}</p>
      </div>

      <p className="text-xs text-muted-foreground px-1">{t("guideIntro")}</p>

      <div className="space-y-2.5">
        {SYMPTOMS.map((s) => {
          const open = openId === s.id;
          const sevTone = s.severity === "high" ? "danger" : s.severity === "medium" ? "warning" : "info";
          const sevLabel = s.severity === "high" ? t("severityHigh") : s.severity === "medium" ? t("severityMedium") : t("severityLow");
          return (
            <Collapsible key={s.id} open={open} onOpenChange={(v) => setOpenId(v ? s.id : null)}>
              <Card className="border-border/70 shadow-xs overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button type="button" className="w-full text-left">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Wrench className="size-4.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold truncate">{t(s.titleKey)}</span>
                          <StatusBadge label={sevLabel} tone={sevTone} />
                        </span>
                      </span>
                      <ChevronDown className={cn("size-4.5 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
                    </CardContent>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3.5 border-t border-border/60 px-4 py-4">
                    <div>
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
                        <CircleAlert className="size-3.5 text-muted-foreground" />
                        {t("possibleCauses")}
                      </h4>
                      <ol className="space-y-1.5">
                        {(lang === "bn" ? s.causes.bn : s.causes.en).map((c, i) => (
                          <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-foreground/90">
                            <span className="text-muted-foreground tabular shrink-0">{i + 1}.</span>
                            {c}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="rounded-lg bg-muted/60 px-3.5 py-2.5">
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                        <ListChecks className="size-3.5 text-muted-foreground" />
                        {t("checkFirst")}
                      </h4>
                      <p className="text-[12px] leading-relaxed text-foreground/85">
                        {lang === "bn" ? s.checkFirst.bn : s.checkFirst.en}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-[12px] leading-relaxed">
                        <span className="font-semibold">{t("canDrive")} </span>
                        {lang === "bn" ? s.canDrive.bn : s.canDrive.en}
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      <p className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
        <BookOpen className="size-3.5" />
        {t("moreSymptomsSoon")}
      </p>
    </div>
  );
}
