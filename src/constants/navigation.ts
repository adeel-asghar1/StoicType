import { Home, Keyboard, Trophy, History, BarChart3, Settings } from "lucide-react";
import type { NavItem } from "@/types/navigation";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Typing", href: "/typing", icon: Keyboard },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "History", href: "/history", icon: History },
  { label: "Statistics", href: "/statistics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];
