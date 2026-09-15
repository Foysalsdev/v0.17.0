import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Lang, TranslationKey } from "./lib/i18n";
import { translate } from "./lib/i18n";
import type {
  AppData, Trip, IncomeEntry, ExpenseEntry, FuelEntry, Customer, VehicleDocument,
} from "./lib/types";

export type ViewId =
  | "dashboard" | "trips" | "quotations" | "vehicles" | "customers" | "drivers" | "fuel"
  | "maintenance" | "finance" | "documents" | "reminders" | "reports"
  | "guide" | "settings" | "driver-mode" | "more";

export type AppMode = "owner" | "driver";

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  driverId?: string | null;
}

export interface TripInput {
  customerId?: string;
  newCustomer?: { name: string; phone?: string };
  vehicleId: string;
  driverId?: string;
  from: string;
  to: string;
  startAt: string;
  endAt: string;
  rentalType: Trip["rentalType"];
  fare: number;
  advance: number;
  notes?: string;
}

export interface QuotationInput {
  customerId?: string;
  newCustomer?: { name: string; phone?: string };
  vehicleId?: string;
  summary: string;
  rate: number;
  terms?: string;
  validUntil?: string;
}

const emptyData: AppData = {
  business: { name: "", ownerName: "", phone: "", address: "", plan: "free", vehicleLimit: 1 },
  vehicles: [], documents: [], customers: [], drivers: [], trips: [], quotations: [], reminders: [],
  tripExpenses: [], fuelEntries: [], maintenanceSchedule: [], maintenanceLogs: [],
  incomes: [], expenses: [],
  monthStats: { income: 0, expense: 0 }, todayIncome: 0, incomeHistory: [],
};

interface ApiJson {
  ok: boolean;
  data?: AppData;
  user?: { id: string; name: string; phone: string; role: string; driverId?: string | null };
  ref?: string;
  code?: string;
  error?: string;
  autoReminder?: boolean;
}

async function apiPost(path: string, body: unknown, method: "POST" | "PUT" | "DELETE" = "POST"): Promise<ApiJson> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  try {
    return (await res.json()) as ApiJson;
  } catch {
    return { ok: false, error: "serverError" };
  }
}

async function apiGet(path: string): Promise<ApiJson> {
  const res = await fetch(path, { cache: "no-store" });
  try {
    return (await res.json()) as ApiJson;
  } catch {
    return { ok: false, error: "serverError" };
  }
}

interface AppState {
  lang: Lang;
  mode: AppMode;
  view: ViewId;
  booted: boolean;   // session check finished (page refresh → stay logged in)
  loggedIn: boolean;
  busy: boolean;     // a mutation is in flight (double-submit guard)
  session: SessionUser | null;
  data: AppData;

  boot: () => Promise<void>;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  navigate: (view: ViewId) => void;
  login: (identifier: string, password: string) => Promise<string | null>;
  signup: (input: { businessName: string; ownerName: string; phone: string; email: string; password: string }) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;

  changePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
  requestPasswordReset: (identifier: string) => Promise<string | null>;
  updateBusiness: (b: { name: string; ownerName: string; phone: string; address: string }) => Promise<string | null>;
  addTeamMember: (m: { name: string; phone: string; role: string; password: string }) => Promise<string | null>;
  updateTeamMember: (m: { id: string; name?: string; role?: string; active?: boolean }) => Promise<string | null>;
  removeTeamMember: (id: string) => Promise<string | null>;

  addTrip: (input: TripInput) => Promise<{ error?: string; ref?: string; autoReminder?: boolean }>;
  startTrip: (tripId: string, startKm: number) => Promise<string | null>;
  completeTrip: (tripId: string, endKm?: number, expenses?: { category: string; amount: number }[]) => Promise<string | null>;
  cancelTrip: (tripId: string) => Promise<string | null>;
  addIncome: (e: Omit<IncomeEntry, "id">) => Promise<string | null>;
  addExpense: (e: Omit<ExpenseEntry, "id">) => Promise<string | null>;
  addFuel: (e: Omit<FuelEntry, "id" | "totalCost">) => Promise<string | null>;
  addService: (e: { vehicleId: string; item: string; date: string; km: number; cost: number; workshop?: string }) => Promise<string | null>;
  addCustomer: (c: Omit<Customer, "id" | "totalTrips" | "totalPaid" | "due" | "since">) => Promise<string | null>;
  updateCustomer: (c: { id: string; name: string; phone: string; company?: string; address?: string }) => Promise<string | null>;
  addVehicle: (v: { name: string; regNumber: string; brand: string; model: string; year: number; fuelTypes: string[]; transmission: string; engineCc: number; seats: number; color: string; currentKm: number; purchasePrice: number }) => Promise<string | null>;
  updateVehicle: (v: { id: string; name: string; regNumber: string; brand: string; model: string; year: number; fuelTypes: string[]; transmission: string; engineCc: number; seats: number; color: string; currentKm: number; purchasePrice: number }) => Promise<string | null>;
  addDocument: (d: Omit<VehicleDocument, "id" | "issueDate">) => Promise<string | null>;
  addDriver: (d: { name: string; phone: string; licenseNo: string; licenseExpiry?: string; salary: number }) => Promise<string | null>;
  updateDriver: (d: { id: string; name: string; phone: string; licenseNo: string; licenseExpiry?: string; salary: number; active: boolean }) => Promise<string | null>;
  addPayment: (p: { tripId?: string; customerId?: string; amount: number; method: string; date?: string }) => Promise<string | null>;
  addQuotation: (q: QuotationInput) => Promise<{ error?: string; code?: string }>;
  setQuotationStatus: (id: string, status: "accepted" | "rejected") => Promise<string | null>;
  addReminder: (r: { title: string; notes?: string; dueAt: string; tripId?: string }) => Promise<string | null>;
  setReminderDone: (id: string, done: boolean) => Promise<string | null>;
  deleteReminder: (id: string) => Promise<string | null>;
}

function modeForRole(role: string): AppMode {
  return role === "driver" ? "driver" : "owner";
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      lang: "bn",
      mode: "owner",
      view: "dashboard",
      booted: false,
      loggedIn: false,
      busy: false,
      session: null,
      data: emptyData,

      boot: async () => {
        const json = await apiGet("/api/auth/me");
        if (json.ok && json.data && json.user) {
          set({
            loggedIn: true,
            session: { ...json.user, driverId: json.user.driverId ?? null },
            data: json.data,
            mode: modeForRole(json.user.role),
            view: json.user.role === "driver" ? "driver-mode" : "dashboard",
          });
        } else {
          set({ loggedIn: false, session: null, data: emptyData });
        }
        set({ booted: true });
      },

      setLang: (lang) => set({ lang }),
      t: (key, vars) => translate(get().lang, key, vars),
      navigate: (view) => set({ view }),

      login: async (identifier, password) => {
        set({ busy: true });
        try {
          const json = await apiPost("/api/auth/login", { identifier, password });
          if (json.ok && json.data && json.user) {
            set({
              loggedIn: true,
              session: { ...json.user, driverId: json.user.driverId ?? null },
              data: json.data,
              mode: modeForRole(json.user.role),
              view: json.user.role === "driver" ? "driver-mode" : "dashboard",
            });
            return null;
          }
          return json.error ?? "loginFailed";
        } catch {
          return "offline";
        } finally {
          set({ busy: false });
        }
      },

      logout: async () => {
        try { await apiPost("/api/auth/logout", {}); } catch { /* offline logout ok */ }
        set({ loggedIn: false, session: null, mode: "owner", view: "dashboard", data: emptyData });
      },

      signup: async (input) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/auth/signup", input);
          if (json.ok && json.data && json.user) {
            set({
              loggedIn: true,
              session: { ...json.user, driverId: json.user.driverId ?? null },
              data: json.data,
              mode: modeForRole(json.user.role),
              view: json.user.role === "driver" ? "driver-mode" : "dashboard",
            });
            return null;
          }
          return json.error ?? "signupFailed";
        } catch {
          return "offline";
        } finally {
          set({ busy: false });
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        const json = await apiPost("/api/auth/password", { currentPassword, newPassword });
        if (json.ok) return null;
        return json.error ?? "serverError";
      },

      requestPasswordReset: async (identifier) => {
        const json = await apiPost("/api/auth/password/forgot", { identifier });
        if (json.ok) return null;
        return json.error ?? "serverError";
      },

      updateBusiness: async (b) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/business", b, "PUT");
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch {
          return "offline";
        } finally {
          set({ busy: false });
        }
      },

      addTeamMember: async (m) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/team", m);
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch {
          return "offline";
        } finally {
          set({ busy: false });
        }
      },

      updateTeamMember: async (m) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/team", m, "PUT");
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch {
          return "offline";
        } finally {
          set({ busy: false });
        }
      },

      removeTeamMember: async (id) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/team", { id }, "DELETE");
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch {
          return "offline";
        } finally {
          set({ busy: false });
        }
      },

      refresh: async () => {
        const json = await apiGet("/api/data");
        if (json.ok && json.data) set({ data: json.data });
      },

      addTrip: async (input) => {
        if (get().busy) return { error: "pleaseWait" };
        set({ busy: true });
        try {
          const json = await apiPost("/api/trip", input);
          if (json.ok && json.data) {
            set({ data: json.data });
            return { ref: json.ref, autoReminder: json.autoReminder === true };
          }
          return { error: json.error ?? "serverError" };
        } catch {
          return { error: "offline" };
        } finally {
          set({ busy: false });
        }
      },

      startTrip: async (tripId, startKm) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/trip/start", { tripId, startKm });
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      completeTrip: async (tripId, endKm, expenses) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/trip/complete", { tripId, endKm, expenses });
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      cancelTrip: async (tripId) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/trip/cancel", { tripId });
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      addIncome: async (e) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/income", e);
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      addExpense: async (e) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/expense", e);
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      addFuel: async (e) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/fuel", e);
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      addService: async (e) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/service", e);
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      addCustomer: async (c) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/customer", c);
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      updateCustomer: async (c) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/customer", c, "PUT");
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      addVehicle: async (v) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/vehicle", v);
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      updateVehicle: async (v) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/vehicle", v, "PUT");
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      addDocument: async (d) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/document", d);
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      addReminder: async (r) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/reminder", r);
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      setReminderDone: async (id, done) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/reminder", { id, done }, "PUT");
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      deleteReminder: async (id) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/reminder", { id }, "DELETE");
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      addDriver: async (d) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/driver", d);
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      updateDriver: async (d) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/driver", d, "PUT");
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      addPayment: async (p) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/payment", p);
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },

      addQuotation: async (q) => {
        if (get().busy) return { error: "pleaseWait" };
        set({ busy: true });
        try {
          const json = await apiPost("/api/quotation", q);
          if (json.ok && json.data) { set({ data: json.data }); return { code: json.code as string | undefined }; }
          return { error: json.error ?? "serverError" };
        } catch { return { error: "offline" }; } finally { set({ busy: false }); }
      },

      setQuotationStatus: async (id, status) => {
        if (get().busy) return "pleaseWait";
        set({ busy: true });
        try {
          const json = await apiPost("/api/quotation", { id, status }, "PUT");
          if (json.ok && json.data) { set({ data: json.data }); return null; }
          return json.error ?? "serverError";
        } catch { return "offline"; } finally { set({ busy: false }); }
      },
    }),
    {
      name: "garirkhata-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lang: s.lang }),
    }
  )
);

/** Convenience selector hook for translations in components. */
export function useT() {
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  const t = (key: TranslationKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  return { t, lang, setLang };
}
