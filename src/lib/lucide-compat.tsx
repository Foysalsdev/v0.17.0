import * as React from "react";
import { cn } from "@/lib/utils";
import type { MaterialIconName } from "@/components/ui/material-icon";

/* ==================================================================
 * v0.14 ICON SYSTEM — Google Material Symbols compat layer.
 *
 * Owner directive: icons must be Google Material Symbols, one static
 * color, no emoji / stickers. This module re-implements the exact
 * `lucide-react` import surface the codebase already uses and renders
 * every icon as a self-hosted Material Symbols glyph instead.
 *
 * tsconfig.json maps the module specifier:
 *     "lucide-react" → "./src/lib/lucide-compat.tsx"
 * so all existing `import { X } from "lucide-react"` keep compiling
 * unchanged — but now draw Material Symbols. Any icon name that is
 * imported but not exported here fails the build (no silent gaps).
 *
 * Lucide `size-*` classes (width/height) are translated to font-size,
 * and Lucide `strokeWidth` maps to the variable font's wght axis so
 * "bold" contexts (active nav) stay visually bold.
 * ================================================================== */

export interface CompatIconProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  className?: string;
  /** Lucide stroke width → Material Symbols wght (2 → 400, 2.2+ → 500, 2.6+ → 600). */
  strokeWidth?: number | string;
  /** Lucide pixel size (rarely used here) — wins over `size-*` classes. */
  size?: string | number;
  /** Accepted for API compatibility, ignored. */
  absoluteStrokeWidth?: boolean;
}

export type LucideIcon = React.FC<CompatIconProps>;

/* size-4 → 16px, size-4.5 → 18px, size-[20px] → 20px … (n × 4px) */
function parseSizeClass(className?: string): number | undefined {
  if (!className) return undefined;
  const arb = /size-\[([0-9.]+)px\]/.exec(className);
  if (arb) return Number(arb[1]);
  const m = /(?:^|\s)size-([0-9]+(?:\.[0-9]+)?)(?=\s|$)/.exec(className);
  if (m) return Math.round(Number(m[1]) * 4 * 100) / 100;
  return undefined;
}

function toPx(size: string | number): number | undefined {
  const n = typeof size === "number" ? size : Number.parseFloat(size);
  return Number.isFinite(n) ? n : undefined;
}

function weightFor(strokeWidth?: number | string): 400 | 500 | 600 {
  const sw = typeof strokeWidth === "number" ? strokeWidth : Number.parseFloat(String(strokeWidth ?? ""));
  if (Number.isFinite(sw) && sw >= 2.6) return 600;
  if (Number.isFinite(sw) && sw >= 2.1) return 500;
  return 400;
}

function createIcon(name: MaterialIconName) {
  function CompatIcon({ className, strokeWidth, size, style, ...rest }: CompatIconProps) {
    const px = size != null ? toPx(size) : parseSizeClass(className);
    const wght = weightFor(strokeWidth);
    return (
      <span
        aria-hidden="true"
        translate="no"
        data-icon={name}
        className={cn("ms-icon", className)}
        style={{
          ...(px !== undefined ? { fontSize: `${px}px` } : null),
          fontVariationSettings: `'FILL' 0, 'wght' ${wght}, 'GRAD' 0, 'opsz' 24`,
          ...style,
        }}
        {...rest}
      />
    );
  }
  CompatIcon.displayName = `Material(${name})`;
  return CompatIcon;
}

/* ---------------- the lucide-react surface, remapped ---------------- */

const MAP: Record<string, MaterialIconName> = {
  ArrowLeft: "arrow_back",
  ArrowRight: "arrow_forward",
  Banknote: "payments",
  BarChart3: "bar_chart",
  Bell: "notifications",
  BellRing: "notifications_active",
  BookOpen: "menu_book",
  Briefcase: "work",
  Build: "build",
  CalendarClock: "calendar_clock",
  CalendarDays: "calendar_month",
  Car: "directions_car",
  CarFront: "directions_car",
  Check: "check",
  CheckCircle2: "check_circle",
  CheckSquare: "check_box",
  ChevronDown: "expand_more",
  ChevronLeft: "chevron_left",
  ChevronRight: "chevron_right",
  ChevronUp: "expand_less",
  Circle: "circle",
  CircleAlert: "error",
  CircleCheck: "check_circle",
  ClipboardList: "assignment",
  Clock: "schedule",
  Crown: "workspace_premium",
  Delete: "delete",
  Download: "download",
  Droplets: "water_drop",
  Edit: "edit",
  Eye: "visibility",
  FileDown: "file_download",
  FileSpreadsheet: "table_chart",
  FileText: "description",
  Fuel: "local_gas_station",
  Gauge: "speed",
  GripVertical: "drag_indicator",
  Home: "home",
  IdCard: "badge",
  Info: "info",
  Database: "database",
  KeyRound: "key",
  Lock: "lock",
  Languages: "translate",
  LayoutGrid: "grid_view",
  List: "list",
  ListChecks: "checklist",
  Loader2: "progress_activity",
  LogIn: "login",
  LogOut: "logout",
  Mail: "mail",
  MapPin: "location_on",
  MessageCircle: "chat_bubble",
  Moon: "dark_mode",
  MoreHorizontal: "more_horiz",
  Pencil: "edit",
  Phone: "call",
  Play: "play_arrow",
  PlayCircle: "play_circle",
  Plus: "add",
  PlusSquare: "add_box",
  Printer: "print",
  Receipt: "receipt_long",
  RefreshCcw: "refresh",
  Route: "route",
  Search: "search",
  SendHorizonal: "send",
  Share: "share",
  ShieldCheck: "shield",
  Smartphone: "smartphone",
  Store: "storefront",
  Sun: "light_mode",
  Trash2: "delete",
  TrendingDown: "trending_down",
  TrendingUp: "trending_up",
  TriangleAlert: "warning",
  User: "person",
  UserPlus: "person_add",
  UserRound: "person",
  UserRoundPlus: "person_add",
  Users: "group",
  Wallet: "account_balance_wallet",
  Wrench: "build",
  X: "close",
  Ban: "block",
  WifiOff: "wifi_off",
};

/* Export every icon under both lucide spellings (`X` and `XIcon`). */
export const ArrowLeft = createIcon(MAP.ArrowLeft);
export const ArrowLeftIcon = ArrowLeft;
export const Banknote = createIcon(MAP.Banknote);
export const BanknoteIcon = Banknote;
export const BarChart3 = createIcon(MAP.BarChart3);
export const BarChart3Icon = BarChart3;
export const Bell = createIcon(MAP.Bell);
export const BellIcon = Bell;
export const BellRing = createIcon(MAP.BellRing);
export const BellRingIcon = BellRing;
export const BookOpen = createIcon(MAP.BookOpen);
export const BookOpenIcon = BookOpen;
export const Briefcase = createIcon(MAP.Briefcase);
export const BriefcaseIcon = Briefcase;
export const Build = createIcon(MAP.Build);
export const BuildIcon = Build;
export const CalendarClock = createIcon(MAP.CalendarClock);
export const CalendarClockIcon = CalendarClock;
export const CalendarDays = createIcon(MAP.CalendarDays);
export const CalendarDaysIcon = CalendarDays;
export const Car = createIcon(MAP.Car);
export const CarIcon = Car;
export const CarFront = createIcon(MAP.CarFront);
export const CarFrontIcon = CarFront;
export const Check = createIcon(MAP.Check);
export const CheckIcon = Check;
export const CheckCircle2 = createIcon(MAP.CheckCircle2);
export const CheckCircle2Icon = CheckCircle2;
export const CheckSquare = createIcon(MAP.CheckSquare);
export const CheckSquareIcon = CheckSquare;
export const ChevronDown = createIcon(MAP.ChevronDown);
export const ChevronDownIcon = ChevronDown;
export const ChevronLeft = createIcon(MAP.ChevronLeft);
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRight = createIcon(MAP.ChevronRight);
export const ChevronRightIcon = ChevronRight;
export const ChevronUp = createIcon(MAP.ChevronUp);
export const ChevronUpIcon = ChevronUp;
export const Circle = createIcon(MAP.Circle);
export const CircleIcon = Circle;
export const CircleAlert = createIcon(MAP.CircleAlert);
export const CircleAlertIcon = CircleAlert;
export const CircleCheck = createIcon(MAP.CircleCheck);
export const CircleCheckIcon = CircleCheck;
export const ClipboardList = createIcon(MAP.ClipboardList);
export const ClipboardListIcon = ClipboardList;
export const Clock = createIcon(MAP.Clock);
export const ClockIcon = Clock;
export const Crown = createIcon(MAP.Crown);
export const CrownIcon = Crown;
export const Delete = createIcon(MAP.Delete);
export const DeleteIcon = Delete;
export const Download = createIcon(MAP.Download);
export const DownloadIcon = Download;
export const Droplets = createIcon(MAP.Droplets);
export const DropletsIcon = Droplets;
export const Edit = createIcon(MAP.Edit);
export const EditIcon = Edit;
export const Eye = createIcon(MAP.Eye);
export const EyeIcon = Eye;
export const FileDown = createIcon(MAP.FileDown);
export const FileDownIcon = FileDown;
export const FileSpreadsheet = createIcon(MAP.FileSpreadsheet);
export const FileSpreadsheetIcon = FileSpreadsheet;
export const FileText = createIcon(MAP.FileText);
export const FileTextIcon = FileText;
export const Fuel = createIcon(MAP.Fuel);
export const FuelIcon = Fuel;
export const Gauge = createIcon(MAP.Gauge);
export const GaugeIcon = Gauge;
export const GripVertical = createIcon(MAP.GripVertical);
export const GripVerticalIcon = GripVertical;
export const Home = createIcon(MAP.Home);
export const HomeIcon = Home;
export const IdCard = createIcon(MAP.IdCard);
export const IdCardIcon = IdCard;
export const Info = createIcon(MAP.Info);
export const InfoIcon = Info;
export const Database = createIcon(MAP.Database);
export const DatabaseIcon = Database;
export const KeyRound = createIcon(MAP.KeyRound);
export const KeyRoundIcon = KeyRound;
export const Languages = createIcon(MAP.Languages);
export const LanguagesIcon = Languages;
export const LayoutGrid = createIcon(MAP.LayoutGrid);
export const LayoutGridIcon = LayoutGrid;
export const List = createIcon(MAP.List);
export const ListIcon = List;
export const ListChecks = createIcon(MAP.ListChecks);
export const ListChecksIcon = ListChecks;
export const Loader2 = createIcon(MAP.Loader2);
export const Loader2Icon = Loader2;
export const LogIn = createIcon(MAP.LogIn);
export const LogInIcon = LogIn;
export const LogOut = createIcon(MAP.LogOut);
export const LogOutIcon = LogOut;
export const Mail = createIcon(MAP.Mail);
export const MailIcon = Mail;
export const MapPin = createIcon(MAP.MapPin);
export const MapPinIcon = MapPin;
export const MessageCircle = createIcon(MAP.MessageCircle);
export const MessageCircleIcon = MessageCircle;
export const Moon = createIcon(MAP.Moon);
export const MoonIcon = Moon;
export const MoreHorizontal = createIcon(MAP.MoreHorizontal);
export const MoreHorizontalIcon = MoreHorizontal;
export const Pencil = createIcon(MAP.Pencil);
export const PencilIcon = Pencil;
export const Phone = createIcon(MAP.Phone);
export const PhoneIcon = Phone;
export const Play = createIcon(MAP.Play);
export const PlayIcon = Play;
export const PlayCircle = createIcon(MAP.PlayCircle);
export const PlayCircleIcon = PlayCircle;
export const Plus = createIcon(MAP.Plus);
export const PlusIcon = Plus;
export const PlusSquare = createIcon(MAP.PlusSquare);
export const PlusSquareIcon = PlusSquare;
export const Printer = createIcon(MAP.Printer);
export const PrinterIcon = Printer;
export const Receipt = createIcon(MAP.Receipt);
export const ReceiptIcon = Receipt;
export const RefreshCcw = createIcon(MAP.RefreshCcw);
export const RefreshCcwIcon = RefreshCcw;
export const Lock = createIcon(MAP.Lock);
export const LockIcon = Lock;
export const Route = createIcon(MAP.Route);
export const RouteIcon = Route;
export const Search = createIcon(MAP.Search);
export const SearchIcon = Search;
export const SendHorizonal = createIcon(MAP.SendHorizonal);
export const SendHorizonalIcon = SendHorizonal;
export const Share = createIcon(MAP.Share);
export const ShareIcon = Share;
export const ShieldCheck = createIcon(MAP.ShieldCheck);
export const ShieldCheckIcon = ShieldCheck;
export const Smartphone = createIcon(MAP.Smartphone);
export const SmartphoneIcon = Smartphone;
export const Store = createIcon(MAP.Store);
export const StoreIcon = Store;
export const Sun = createIcon(MAP.Sun);
export const SunIcon = Sun;
export const Trash2 = createIcon(MAP.Trash2);
export const Trash2Icon = Trash2;
export const TrendingDown = createIcon(MAP.TrendingDown);
export const TrendingDownIcon = TrendingDown;
export const TrendingUp = createIcon(MAP.TrendingUp);
export const TrendingUpIcon = TrendingUp;
export const TriangleAlert = createIcon(MAP.TriangleAlert);
export const TriangleAlertIcon = TriangleAlert;
export const User = createIcon(MAP.User);
export const UserIcon = User;
export const UserPlus = createIcon(MAP.UserPlus);
export const UserPlusIcon = UserPlus;
export const UserRound = createIcon(MAP.UserRound);
export const UserRoundIcon = UserRound;
export const UserRoundPlus = createIcon(MAP.UserRoundPlus);
export const UserRoundPlusIcon = UserRoundPlus;
export const Users = createIcon(MAP.Users);
export const UsersIcon = Users;
export const Wallet = createIcon(MAP.Wallet);
export const WalletIcon = Wallet;
export const Wrench = createIcon(MAP.Wrench);
export const WrenchIcon = Wrench;
export const X = createIcon(MAP.X);
export const XIcon = X;
export const Ban = createIcon(MAP.Ban);
export const BanIcon = Ban;
export const WifiOff = createIcon(MAP.WifiOff);
export const WifiOffIcon = WifiOff;
export const ArrowRight = createIcon(MAP.ArrowRight);
export const ArrowRightIcon = ArrowRight;
export const Minus = createIcon("remove");
export const MinusIcon = Minus;
export const Palette = createIcon("palette");
export const PaletteIcon = Palette;
export const PanelLeft = createIcon("menu_open");
export const PanelLeftIcon = PanelLeft;
