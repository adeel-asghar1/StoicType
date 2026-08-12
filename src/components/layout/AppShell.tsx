"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="relative min-h-screen bg-background text-primary">
      <div aria-hidden="true" className="app-background pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden="true" className="editorial-grid pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden="true" className="app-texture pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden="true" className="editorial-vignette pointer-events-none fixed inset-0 -z-10" />

      <MobileTopBar onOpen={() => setIsMobileNavOpen(true)} />

      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-[200px] lg:w-[248px]">
        <Sidebar variant="desktop" />
      </div>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsMobileNavOpen(false)}
            className="absolute inset-0 bg-primary/15 backdrop-blur-md"
          />
          <div className="absolute inset-y-0 left-0 w-[248px] max-w-[80vw] shadow-[20px_0_60px_rgba(20,20,18,0.12)]">
            <Sidebar variant="mobile" onNavigate={() => setIsMobileNavOpen(false)} />
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close navigation"
              className="group absolute right-3 top-4 rounded-[2px] border border-border bg-background/70 p-2 text-secondary backdrop-blur-md transition-all duration-300 hover:border-primary hover:bg-primary hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" strokeWidth={1.65} />
            </button>
          </div>
        </div>
      )}

      <main className="min-h-screen md:pl-[200px] lg:pl-[248px]">
        <PageTransition>{children}</PageTransition>
      </main>
      </div>
    </ThemeProvider>
  );
}
