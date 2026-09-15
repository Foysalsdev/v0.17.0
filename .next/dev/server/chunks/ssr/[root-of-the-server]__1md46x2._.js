module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[project]/src/components/ui/sonner.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toaster",
    ()=>Toaster
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notify$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/notify.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
/**
 * v0.10 — বড়, দৃশ্যমান toast (owner: "toast notification amr chokhe poreni").
 * - বড় কার্ড + বোল্ড টাইটেল + বড় আইকন, ৬ সেকেন্ড, উপরে-মাঝখানে (notch-safe)
 * - নতুন toast উঠলে vibration + ছোট chime (sonner-এ global on-mount hook
 *   নেই বলে MutationObserver দিয়ে ধরা হয়েছে — সব toast-এ কাজ করে)
 */ const Toaster = ({ ...props })=>{
    const { theme = "system" } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTheme"])();
    const hostRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](null);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        const host = hostRef.current;
        if (!host || typeof MutationObserver === "undefined") return;
        const seen = new WeakSet();
        const mo = new MutationObserver((records)=>{
            for (const rec of records){
                for (const node of rec.addedNodes){
                    if (!(node instanceof HTMLElement)) continue;
                    const el = node.matches("[data-sonner-toast]") ? node : node.querySelector("[data-sonner-toast]");
                    if (!el || seen.has(el)) continue;
                    seen.add(el);
                    const type = el.getAttribute("data-type") ?? "default";
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notify$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["attention"])(type === "error" ? "error" : "success");
                }
            }
        });
        mo.observe(host, {
            childList: true,
            subtree: true
        });
        return ()=>mo.disconnect();
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: hostRef,
        className: "gk-toaster-host",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Toaster"], {
            theme: theme,
            position: "top-center",
            duration: 6000,
            offset: "calc(env(safe-area-inset-top, 0px) + 14px)",
            gap: 10,
            className: "toaster group",
            style: {
                "--normal-bg": "var(--popover)",
                "--normal-text": "var(--popover-foreground)",
                "--normal-border": "var(--border)",
                "--width": "min(420px, calc(100vw - 1.5rem))"
            },
            toastOptions: {
                classNames: {
                    toast: "!rounded-2xl !px-4 !py-4 !shadow-2xl !gap-3.5 !items-center !font-sans",
                    title: "!text-[15px] !font-bold !leading-snug !tracking-tight",
                    description: "!text-[13.5px] !opacity-95 !leading-relaxed !mt-0.5",
                    icon: "!size-7 !stroke-[2.2]",
                    actionButton: "!h-10 !px-4 !rounded-xl !text-sm !font-semibold",
                    closeButton: "!size-9 !rounded-full !border-transparent"
                }
            },
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/ui/sonner.tsx",
            lineNumber: 42,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sonner.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
;
}),
"[project]/src/lib/notify.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "attention",
    ()=>attention
]);
"use client";
/**
 * Attention helpers (v0.10) — toast/reminder যেন চোখে পড়ে।
 * Owner: "app a toast notification amr chokhe poreni."
 * Vibration (Android — primary device) + হালকা দুই/তিন-সুরের chime।
 * সব কিছু best-effort: browser সাপোর্ট না থাকলে নীরব, কখনো error নয়।
 */ let audioCtx = null;
const TONES = {
    // নরম উঠানো দুই সুর
    success: [
        {
            f: 659,
            d: 0,
            l: 0.1
        },
        {
            f: 880,
            d: 0.11,
            l: 0.16
        }
    ],
    // নিচু, ভারী — ভুল হলে বোঝা যায়
    error: [
        {
            f: 392,
            d: 0,
            l: 0.14
        },
        {
            f: 262,
            d: 0.15,
            l: 0.22
        }
    ],
    // ঘণ্টা-ঘণ্টা-ঘণ্টা — রিমাইন্ডারের নিজস্ব সুর
    reminder: [
        {
            f: 880,
            d: 0,
            l: 0.13
        },
        {
            f: 1175,
            d: 0.14,
            l: 0.16
        },
        {
            f: 880,
            d: 0.31,
            l: 0.14
        }
    ]
};
function chime(kind) {
    try {
        const AC = ("TURBOPACK compile-time truthy", 1) ? undefined : "TURBOPACK unreachable";
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const t0 = undefined;
        const tn = undefined;
    } catch  {
    /* শব্দ optional — চুপচাপ ফেলে দিই */ }
}
/** Toast/রিমাইন্ডার দেখানোর সময় ডিভাইস নাড়ায় + ছোট সুর বাজায়।
 * ৩০০ms-এর মধ্যে বারবার ডাকলে একবারই শোনায় (alarm + observer একসাথে ডাকলে double হয় না)। */ let lastAt = 0;
function attention(kind) {
    try {
        const now = Date.now();
        if (now - lastAt < 300) return;
        lastAt = now;
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
            navigator.vibrate(kind === "reminder" ? [
                130,
                70,
                130,
                70,
                200
            ] : [
                90,
                50,
                90
            ]);
        }
        chime(kind);
    } catch  {
    /* vibration optional */ }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1md46x2._.js.map