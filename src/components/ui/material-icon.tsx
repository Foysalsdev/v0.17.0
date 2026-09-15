import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Google Material Symbols Outlined — the app-wide icon system (v0.14).
 *
 * Rules (owner directive):
 *  - SINGLE STATIC COLOR: icons inherit the current text color
 *    (currentColor). No emoji, no multi-color or tinted icon chips.
 *  - Sized through the `size` prop (font px), not `size-*` classes —
 *    the glyph is a font, so width/height classes do nothing.
 *
 * Self-hosted variable font: public/fonts/material-symbols-outlined.woff2
 * (see the @font-face + .ms-icon rules in globals.css).
 */
export type MaterialIconName =
  | "add" | "add_box" | "arrow_back" | "arrow_forward" | "assignment"
  | "account_balance_wallet" | "badge" | "bar_chart" | "block" | "build"
  | "calendar_clock" | "calendar_month" | "call" | "chat_bubble" | "check"
  | "check_box" | "check_circle" | "checklist" | "chevron_left" | "chevron_right"
  | "circle" | "close" | "dark_mode" | "database" | "delete" | "description" | "directions_car"
  | "download" | "drag_indicator" | "edit" | "error" | "event" | "expand_less"
  | "expand_more" | "file_download" | "grid_view" | "group" | "home" | "info"
  | "key" | "language" | "light_mode" | "list" | "local_gas_station"
  | "location_on" | "lock" | "login" | "logout" | "mail" | "menu_book" | "menu_open"
  | "more_horiz" | "monitoring" | "notifications" | "notifications_active"
  | "palette" | "payments" | "person" | "person_add" | "play_arrow"
  | "play_circle" | "print" | "progress_activity" | "radio_button_unchecked"
  | "receipt_long" | "refresh" | "remove" | "request_quote" | "route"
  | "schedule" | "search" | "send" | "settings" | "share" | "shield" | "smartphone"
  | "space_dashboard" | "speed" | "storefront" | "table_chart" | "translate"
  | "trending_down" | "trending_up" | "verified_user" | "visibility"
  | "warning" | "water_drop" | "wifi_off" | "work" | "workspace_premium";

export interface MIconProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Material Symbol name — typed, so typos fail the build. */
  name: MaterialIconName;
  /** Icon size in px (default 24). */
  size?: number;
  /** Use the filled glyph variant (default: outlined). */
  filled?: boolean;
}

export function MIcon({ name, size, filled, className, style, ...rest }: MIconProps) {
  /* The ligature name is passed via data-icon and rendered by the
     .ms-icon::before rule — deliberately NOT as DOM text, so buttons
     keep a clean textContent (selectors, copy, find-in-page). */
  return (
    <span
      aria-hidden="true"
      translate="no"
      data-icon={name}
      className={cn("ms-icon", filled && "ms-icon-fill", className)}
      style={{
        ...(size !== undefined ? { fontSize: `${size}px` } : null),
        ...style,
      }}
      {...rest}
    />
  );
}
