import {
  LayoutDashboard,
  Inbox,
  CalendarClock,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Inbox },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarClock },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];
