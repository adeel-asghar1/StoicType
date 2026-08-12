"use client";

import { Menu } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

type MobileTopBarProps = {
  onOpen: () => void;
};

export function MobileTopBar({ onOpen }: MobileTopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
      <Logo />
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open navigation"
        className="group rounded-[2px] border border-border bg-background/60 p-2.5 text-secondary transition-all duration-300 hover:-translate-y-px hover:border-primary hover:bg-primary hover:text-background hover:shadow-[0_10px_25px_rgba(20,20,18,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Menu className="h-5 w-5 transition-transform duration-300 group-hover:rotate-3" strokeWidth={1.65} />
      </button>
    </header>
  );
}
