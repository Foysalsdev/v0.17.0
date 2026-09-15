(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Page
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$login$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/login-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$signup$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/signup-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2f$app$2d$shell$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/app/app-shell.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$driver$2d$mode$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/driver-mode-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2f$brand$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/app/brand.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
function Page() {
    _s();
    const booted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"])({
        "Page.useApp[booted]": (s)=>s.booted
    }["Page.useApp[booted]"]);
    const loggedIn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"])({
        "Page.useApp[loggedIn]": (s)=>s.loggedIn
    }["Page.useApp[loggedIn]"]);
    const mode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"])({
        "Page.useApp[mode]": (s)=>s.mode
    }["Page.useApp[mode]"]);
    const boot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"])({
        "Page.useApp[boot]": (s)=>s.boot
    }["Page.useApp[boot]"]);
    const [showSignup, setShowSignup] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](false);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "Page.useEffect": ()=>{
            void boot();
        }
    }["Page.useEffect"], [
        boot
    ]);
    if (!booted) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative min-h-dvh flex flex-col items-center justify-center gap-4 bg-background overflow-hidden",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    "aria-hidden": true,
                    className: "absolute inset-0 aurora-page"
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 31,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    "aria-hidden": true,
                    className: "absolute -top-20 -left-24 size-72 rounded-full bg-primary/12 blur-3xl animate-float"
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "relative flex size-20 items-center justify-center rounded-3xl bg-white ring-1 ring-border/60 shadow-lift shadow-primary/15 animate-scale-in",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2f$brand$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BrandMark"], {
                        className: "size-14"
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 34,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 33,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative flex items-center gap-2 text-sm text-muted-foreground animate-rise [animation-delay:120ms]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "size-2 rounded-full bg-primary animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 37,
                            columnNumber: 11
                        }, this),
                        "গাড়িখাতা…"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 36,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this);
    }
    if (!loggedIn) {
        return showSignup ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$signup$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SignupView"], {
            onBack: ()=>setShowSignup(false)
        }, void 0, false, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 46,
            columnNumber: 9
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$login$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LoginView"], {
            onSignup: ()=>setShowSignup(true)
        }, void 0, false, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 47,
            columnNumber: 9
        }, this);
    }
    if (mode === "driver") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$driver$2d$mode$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DriverModeView"], {}, void 0, false, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 49,
        columnNumber: 33
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2f$app$2d$shell$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AppShell"], {}, void 0, false, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 50,
        columnNumber: 10
    }, this);
}
_s(Page, "cTu7ntzCQVpsGUUxiOpPlx3C2sc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useApp"]
    ];
});
_c = Page;
var _c;
__turbopack_context__.k.register(_c, "Page");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/store.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useApp",
    ()=>useApp,
    "useT",
    ()=>useT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/i18n.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
const emptyData = {
    business: {
        name: "",
        ownerName: "",
        phone: "",
        address: "",
        plan: "free",
        vehicleLimit: 1
    },
    vehicles: [],
    documents: [],
    customers: [],
    drivers: [],
    trips: [],
    quotations: [],
    reminders: [],
    tripExpenses: [],
    fuelEntries: [],
    maintenanceSchedule: [],
    maintenanceLogs: [],
    incomes: [],
    expenses: [],
    monthStats: {
        income: 0,
        expense: 0
    },
    todayIncome: 0,
    incomeHistory: []
};
async function apiPost(path, body, method = "POST") {
    const res = await fetch(path, {
        method,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    try {
        return await res.json();
    } catch  {
        return {
            ok: false,
            error: "serverError"
        };
    }
}
async function apiGet(path) {
    const res = await fetch(path, {
        cache: "no-store"
    });
    try {
        return await res.json();
    } catch  {
        return {
            ok: false,
            error: "serverError"
        };
    }
}
function modeForRole(role) {
    return role === "driver" ? "driver" : "owner";
}
const useApp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        lang: "bn",
        mode: "owner",
        view: "dashboard",
        booted: false,
        loggedIn: false,
        busy: false,
        session: null,
        data: emptyData,
        boot: async ()=>{
            const json = await apiGet("/api/auth/me");
            if (json.ok && json.data && json.user) {
                set({
                    loggedIn: true,
                    session: {
                        ...json.user,
                        driverId: json.user.driverId ?? null
                    },
                    data: json.data,
                    mode: modeForRole(json.user.role),
                    view: json.user.role === "driver" ? "driver-mode" : "dashboard"
                });
            } else {
                set({
                    loggedIn: false,
                    session: null,
                    data: emptyData
                });
            }
            set({
                booted: true
            });
        },
        setLang: (lang)=>set({
                lang
            }),
        t: (key, vars)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["translate"])(get().lang, key, vars),
        navigate: (view)=>set({
                view
            }),
        login: async (identifier, password)=>{
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/auth/login", {
                    identifier,
                    password
                });
                if (json.ok && json.data && json.user) {
                    set({
                        loggedIn: true,
                        session: {
                            ...json.user,
                            driverId: json.user.driverId ?? null
                        },
                        data: json.data,
                        mode: modeForRole(json.user.role),
                        view: json.user.role === "driver" ? "driver-mode" : "dashboard"
                    });
                    return null;
                }
                return json.error ?? "loginFailed";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        logout: async ()=>{
            try {
                await apiPost("/api/auth/logout", {});
            } catch  {}
            set({
                loggedIn: false,
                session: null,
                mode: "owner",
                view: "dashboard",
                data: emptyData
            });
        },
        signup: async (input)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/auth/signup", input);
                if (json.ok && json.data && json.user) {
                    set({
                        loggedIn: true,
                        session: {
                            ...json.user,
                            driverId: json.user.driverId ?? null
                        },
                        data: json.data,
                        mode: modeForRole(json.user.role),
                        view: json.user.role === "driver" ? "driver-mode" : "dashboard"
                    });
                    return null;
                }
                return json.error ?? "signupFailed";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        changePassword: async (currentPassword, newPassword)=>{
            const json = await apiPost("/api/auth/password", {
                currentPassword,
                newPassword
            });
            if (json.ok) return null;
            return json.error ?? "serverError";
        },
        requestPasswordReset: async (identifier)=>{
            const json = await apiPost("/api/auth/password/forgot", {
                identifier
            });
            if (json.ok) return null;
            return json.error ?? "serverError";
        },
        updateBusiness: async (b)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/business", b, "PUT");
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addTeamMember: async (m)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/team", m);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        updateTeamMember: async (m)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/team", m, "PUT");
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        removeTeamMember: async (id)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/team", {
                    id
                }, "DELETE");
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        refresh: async ()=>{
            const json = await apiGet("/api/data");
            if (json.ok && json.data) set({
                data: json.data
            });
        },
        addTrip: async (input)=>{
            if (get().busy) return {
                error: "pleaseWait"
            };
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/trip", input);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return {
                        ref: json.ref,
                        autoReminder: json.autoReminder === true
                    };
                }
                return {
                    error: json.error ?? "serverError"
                };
            } catch  {
                return {
                    error: "offline"
                };
            } finally{
                set({
                    busy: false
                });
            }
        },
        startTrip: async (tripId, startKm)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/trip/start", {
                    tripId,
                    startKm
                });
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        completeTrip: async (tripId, endKm, expenses)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/trip/complete", {
                    tripId,
                    endKm,
                    expenses
                });
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        cancelTrip: async (tripId)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/trip/cancel", {
                    tripId
                });
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addIncome: async (e)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/income", e);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addExpense: async (e)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/expense", e);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addFuel: async (e)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/fuel", e);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addService: async (e)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/service", e);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addCustomer: async (c)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/customer", c);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        updateCustomer: async (c)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/customer", c, "PUT");
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addVehicle: async (v)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/vehicle", v);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        updateVehicle: async (v)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/vehicle", v, "PUT");
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addDocument: async (d)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/document", d);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addReminder: async (r)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/reminder", r);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        setReminderDone: async (id, done)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/reminder", {
                    id,
                    done
                }, "PUT");
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        deleteReminder: async (id)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/reminder", {
                    id
                }, "DELETE");
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addDriver: async (d)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/driver", d);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        updateDriver: async (d)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/driver", d, "PUT");
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addPayment: async (p)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/payment", p);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        },
        addQuotation: async (q)=>{
            if (get().busy) return {
                error: "pleaseWait"
            };
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/quotation", q);
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return {
                        code: json.code
                    };
                }
                return {
                    error: json.error ?? "serverError"
                };
            } catch  {
                return {
                    error: "offline"
                };
            } finally{
                set({
                    busy: false
                });
            }
        },
        setQuotationStatus: async (id, status)=>{
            if (get().busy) return "pleaseWait";
            set({
                busy: true
            });
            try {
                const json = await apiPost("/api/quotation", {
                    id,
                    status
                }, "PUT");
                if (json.ok && json.data) {
                    set({
                        data: json.data
                    });
                    return null;
                }
                return json.error ?? "serverError";
            } catch  {
                return "offline";
            } finally{
                set({
                    busy: false
                });
            }
        }
    }), {
    name: "garirkhata-session",
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage),
    partialize: (s)=>({
            lang: s.lang
        })
}));
function useT() {
    _s();
    const lang = useApp({
        "useT.useApp[lang]": (s)=>s.lang
    }["useT.useApp[lang]"]);
    const setLang = useApp({
        "useT.useApp[setLang]": (s)=>s.setLang
    }["useT.useApp[setLang]"]);
    const t = (key, vars)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$i18n$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["translate"])(lang, key, vars);
    return {
        t,
        lang,
        setLang
    };
}
_s(useT, "VwLpW7QIXdObYJVpCKgHtpINmYY=", false, function() {
    return [
        useApp,
        useApp
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_1iqa0f9._.js.map