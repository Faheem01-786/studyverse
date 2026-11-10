import {
  BookOpen,
  Compass,
  Crown,
  Globe,
  LayoutDashboard,
  Palette,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  /** Route path used by the router. */
  to: string;
  label: string;
  icon: LucideIcon;
  /** Only rendered for authorized administrators. */
  adminOnly?: boolean;
  /** Shown in the mobile bottom bar (limited to five entries). */
  mobile?: boolean;
}

/** Primary student navigation, shared by the sidebar and mobile bar. */
export const STUDENT_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { to: "/study-room", label: "Study Room", icon: Timer, mobile: true },
  { to: "/quests", label: "Quests", icon: Target, mobile: true },
  { to: "/store", label: "XP Store", icon: Sparkles },
  { to: "/library", label: "Study Library", icon: BookOpen, mobile: true },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/achievements", label: "Achievements", icon: Compass },
  { to: "/website-hub", label: "Website Hub", icon: Globe },
  { to: "/membership", label: "Membership", icon: Crown },
  { to: "/themes", label: "Themes", icon: Palette },
  { to: "/profile", label: "Profile", icon: UserRound, mobile: true },
];

/** Administrator-only navigation entry. */
export const ADMIN_NAV: NavItem = {
  to: "/admin",
  label: "Admin",
  icon: ShieldCheck,
  adminOnly: true,
};
