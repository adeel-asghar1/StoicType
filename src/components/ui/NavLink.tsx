"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { NavItem } from "@/types/navigation";

type NavLinkProps = {
  item: NavItem;
  indicatorId: string;
  onNavigate?: () => void;
};

export function NavLink({ item, indicatorId, onNavigate }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={[
        "group relative flex items-center gap-3 overflow-hidden rounded-[3px] px-3 py-3",
        "text-body transition-[color,background-color,transform] duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        isActive
          ? "font-semibold text-primary"
          : "font-medium text-secondary hover:-translate-y-px hover:bg-background/65 hover:text-primary",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-y-0 left-0 w-[2px] origin-bottom nav-accent-line",
          "transition-transform duration-300 ease-out",
          isActive ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100",
        ].join(" ")}
      />

      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 nav-accent-wash",
          "transition-opacity duration-300",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        ].join(" ")}
      />

      {isActive && (
        <motion.span
          layoutId={indicatorId}
          className="pointer-events-none absolute right-3 h-1.5 w-1.5 rounded-full nav-accent-dot"
          transition={{ type: "spring", stiffness: 500, damping: 42 }}
        />
      )}

      <Icon
        className={[
          "relative z-10 h-[18px] w-[18px] shrink-0 transition-all duration-300",
          isActive
            ? "text-primary"
            : "text-secondary group-hover:translate-x-0.5 group-hover:text-primary",
        ].join(" ")}
        strokeWidth={1.65}
      />
      <span className="relative z-10">{item.label}</span>
    </Link>
  );
}
