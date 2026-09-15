"use client";

import * as React from "react";
import { useApp, useT } from "@/store";
import { useSearchUi } from "./form-store";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Car, Users, User, Route, Search } from "lucide-react";
import { sameDay, fmtDayLabel } from "@/lib/format";

/** Global search across vehicles, customers, trips, drivers (Section 54). */
export function SearchDialog() {
  const { t, lang } = useT();
  const open = useSearchUi((s) => s.open);
  const setOpen = useSearchUi((s) => s.setOpen);
  const navigate = useApp((s) => s.navigate);
  const { data } = useApp();

  const go = (view: Parameters<typeof navigate>[0]) => {
    setOpen(false);
    navigate(view);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[15%] translate-y-0 p-0 max-w-lg gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("search")}</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={true} className="rounded-2xl">
          <div className="flex items-center gap-2.5 border-b border-border px-4">
            <Search className="size-4.5 text-muted-foreground shrink-0" />
            <CommandInput
              placeholder={t("searchPlaceholder")}
              className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <CommandList className="max-h-80 nice-scrollbar">
            <CommandEmpty className="py-8 text-sm text-muted-foreground">{t("searchPlaceholder")}</CommandEmpty>

            <CommandGroup heading={t("navVehicles")}>
              {data.vehicles.map((v) => (
                <CommandItem
                  key={v.id}
                  value={`${v.name} ${v.regNumber} ${v.brand} ${v.model}`}
                  onSelect={() => go("vehicles")}
                  className="py-2.5"
                >
                  <Car className="size-4 text-primary" />
                  <span className="font-medium">{v.name}</span>
                  <span className="text-xs text-muted-foreground">{v.regNumber}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading={t("navCustomers")}>
              {data.customers.map((c) => (
                <CommandItem key={c.id} value={`${c.name} ${c.phone} ${c.company ?? ""}`} onSelect={() => go("customers")} className="py-2.5">
                  <Users className="size-4 text-primary" />
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.phone}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading={t("navTrips")}>
              {data.trips.slice(0, 6).map((tr) => (
                <CommandItem
                  key={tr.id}
                  value={`${tr.from} ${tr.to}`}
                  onSelect={() => go("trips")}
                  className="py-2.5"
                >
                  <Route className="size-4 text-primary" />
                  <span className="font-medium truncate">{tr.from} → {tr.to}</span>
                  <span className="text-xs text-muted-foreground">{fmtDayLabel(tr.startAt, lang, (k) => t(k))}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading={t("navDrivers")}>
              {data.drivers.map((d) => (
                <CommandItem key={d.id} value={`${d.name} ${d.phone}`} onSelect={() => go("drivers")} className="py-2.5">
                  <User className="size-4 text-primary" />
                  <span className="font-medium">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{d.phone}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
