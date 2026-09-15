"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Route, Phone, MapPin, Clock, PlayCircle, CheckCircle2, ShieldCheck, LogOut, Loader2 } from "lucide-react";
import { fmtTime, fmtNum } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Driver Mode (Section 6) — deliberately minimal:
 * today's trip → start → end KM → complete. No money, no other vehicles, no settings.
 * The state machine reads the live trip status (confirmed → running → completed).
 */
export function DriverModeView() {
  const { t, lang } = useT();
  const data = useApp((s) => s.data);
  const session = useApp((s) => s.session);
  const busy = useApp((s) => s.busy);
  const startTrip = useApp((s) => s.startTrip);
  const completeTrip = useApp((s) => s.completeTrip);
  const logout = useApp((s) => s.logout);

  const myDriverId = session?.driverId ?? "";
  const myName = session?.name ?? "";

  // my assigned trip: running first, then today's, then the next upcoming
  const trip =
    data.trips.find((tr) => tr.driverId === myDriverId && tr.status === "running") ??
    data.trips.find(
      (tr) => tr.driverId === myDriverId &&
        (tr.status === "confirmed" && new Date(tr.startAt).toDateString() === new Date().toDateString())
    ) ??
    data.trips.find((tr) => tr.driverId === myDriverId && tr.status === "confirmed");

  const vehicle = data.vehicles.find((v) => v.id === trip?.vehicleId);
  const customer = data.customers.find((c) => c.id === trip?.customerId);

  const [startKm, setStartKm] = React.useState("");
  const [endKm, setEndKm] = React.useState("");

  // keep the visible start KM in sync with the trip record
  React.useEffect(() => {
    setStartKm(trip?.startKm != null ? String(trip.startKm) : "");
  }, [trip?.id, trip?.startKm]);

  const handleStart = async () => {
    if (!trip) return;
    setStartKm(String(vehicle?.currentKm ?? ""));
    const err = await startTrip(trip.id, vehicle?.currentKm ?? 0);
    if (err) toast.error(t("serverError" as never));
  };

  const handleComplete = async () => {
    if (!trip) return;
    const err = await completeTrip(trip.id, Number(endKm));
    if (err) { toast.error(t(err as never)); return; }
    toast.success(t("dmTripDone"), {
      description: `${fmtNum(Number(endKm) - Number(startKm || 0), lang)} ${t("km")} · ${trip.to}`,
    });
  };

  const state = trip?.status ?? "none"; // confirmed → running → completed

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="max-w-md w-full mx-auto px-5 py-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Route className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t("dmTodayTrip")}</h1>
              <p className="text-[11px] text-muted-foreground">{myName} · {t("driverMode")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label={t("logout")}
          >
            <LogOut className="size-4.5" />
          </button>
        </div>

        {!trip ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border py-16">
            <p className="text-sm text-muted-foreground text-center px-6">{t("dmNoTrip")}</p>
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {/* Trip card — big, readable, minimal (Section 6 example) */}
            <Card className={cn(
              "border-border/70 shadow-md overflow-hidden",
              state === "running" && "border-warning/50"
            )}>
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary/12 via-primary/5 to-transparent px-5 py-5">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-extrabold text-foreground">{vehicle?.name}</div>
                    <span className="rounded-full bg-card border border-border px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground tabular">
                      {trip.ref}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-base font-semibold text-foreground">
                    {trip.from} <span className="text-muted-foreground">→</span> {trip.to}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted-foreground">
                    <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{customer?.name}</span>
                    <span className="flex items-center gap-1.5 tabular"><Clock className="size-3.5" />{fmtTime(trip.startAt, lang)}</span>
                    {customer && (
                      <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-primary font-medium">
                        <Phone className="size-3.5" />{customer.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* State machine: confirmed → running → completed */}
                <div className="p-5 space-y-4">
                  {state === "confirmed" && (
                    <Button
                      size="lg"
                      className="w-full h-14 text-base font-bold gap-2 rounded-2xl"
                      disabled={busy}
                      onClick={handleStart}
                    >
                      {busy ? <Loader2 className="size-6 animate-spin" /> : <PlayCircle className="size-6" />}
                      {t("dmStartTrip")}
                    </Button>
                  )}

                  {state === "running" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-xl bg-warning/15 border border-warning/40 px-4 py-2.5">
                        <span className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
                          <span className="relative flex size-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-60" />
                            <span className="relative inline-flex size-2.5 rounded-full bg-warning" />
                          </span>
                          {t("dmTripRunning")}
                        </span>
                        <span className="text-sm font-bold tabular">{fmtNum(Number(startKm) || 0, lang)} {t("km")}</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">{t("dmEndKm")}</label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={endKm}
                          onChange={(e) => setEndKm(e.target.value)}
                          placeholder={String((vehicle?.currentKm ?? 0) + 350)}
                          className="h-14 text-lg font-bold tabular rounded-2xl"
                        />
                      </div>
                      <Button
                        size="lg"
                        className="w-full h-14 text-base font-bold gap-2 rounded-2xl"
                        disabled={busy || !endKm || Number(endKm) <= Number(startKm)}
                        onClick={handleComplete}
                      >
                        {busy ? <Loader2 className="size-6 animate-spin" /> : <CheckCircle2 className="size-6" />}
                        {t("dmCompleteTrip")}
                      </Button>
                    </div>
                  )}

                  {state === "completed" && (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <CheckCircle2 className="size-8" />
                      </span>
                      <p className="text-base font-semibold">{t("dmTripDone")}</p>
                      {trip.endKm != null && trip.startKm != null && (
                        <p className="text-sm text-muted-foreground tabular">
                          {fmtNum(trip.endKm - trip.startKm, lang)} {t("km")} · {trip.from} → {trip.to}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency contact — always visible */}
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <div className="text-[13px] font-semibold">{t("dmEmergency")}</div>
                  <div className="text-[11px] text-muted-foreground">{data.business.ownerName} · {data.business.phone}</div>
                </div>
              </div>
              <a href={`tel:${data.business.phone}`} className="flex size-11 items-center justify-center rounded-full bg-danger text-white shadow-md active:scale-95 transition-transform" aria-label={t("dmEmergency")}>
                <Phone className="size-5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
