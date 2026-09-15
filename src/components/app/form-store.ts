"use client";

import { create } from "zustand";

export type FormKind =
  | "trip" | "income" | "expense" | "fuel" | "service" | "customer"
  | "document" | "vehicle" | "driver" | "payment" | "quotation" | "reminder" | null;

interface FormUiState {
  openForm: FormKind;
  quickOpen: boolean;
  presetVehicleId?: string;
  presetCustomerId?: string;
  /** trip to collect payment for (payment form) */
  presetTripId?: string;
  /** driver being edited (driver form — edit mode) */
  presetDriverId?: string;
  /** quotation → trip conversion: prefills the trip form + accepts the quote on save */
  convertQuoteId?: string;
  presetFare?: number;
  presetNotes?: string;
  open: (form: FormKind, preset?: {
    vehicleId?: string; customerId?: string; tripId?: string; driverId?: string;
    convertQuoteId?: string; fare?: number; notes?: string;
  }) => void;
  openQuick: () => void;
  close: () => void;
}

export const useFormUi = create<FormUiState>()((set) => ({
  openForm: null,
  quickOpen: false,
  open: (form, preset) =>
    set({
      openForm: form,
      quickOpen: false,
      presetVehicleId: preset?.vehicleId,
      presetCustomerId: preset?.customerId,
      presetTripId: preset?.tripId,
      presetDriverId: preset?.driverId,
      convertQuoteId: preset?.convertQuoteId,
      presetFare: preset?.fare,
      presetNotes: preset?.notes,
    }),
  openQuick: () => set({ quickOpen: true }),
  close: () =>
    set({
      openForm: null, quickOpen: false,
      presetVehicleId: undefined, presetCustomerId: undefined,
      presetTripId: undefined, presetDriverId: undefined,
      convertQuoteId: undefined, presetFare: undefined, presetNotes: undefined,
    }),
}));

interface SearchUiState {
  open: boolean;
  setOpen: (v: boolean) => void;
}

export const useSearchUi = create<SearchUiState>()((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
}));
