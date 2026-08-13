"use client";

import { motion } from "framer-motion";
import { Github, Instagram, Linkedin } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { NavLink } from "@/components/ui/NavLink";
import { NAV_ITEMS } from "@/constants/navigation";
import { APP_VERSION } from "@/constants/app";

type SidebarProps = {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function Sidebar({ variant, onNavigate }: SidebarProps) {
  const indicatorId = `sidebar-active-${variant}`;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-full w-full flex-col overflow-hidden border-r border-line bg-sidebar px-5 py-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-48 w-48 translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-sidebar-glow)] blur-3xl"
      />

      <div className="relative px-2">
        <Logo />
        <div className="relative mt-5 h-px w-full bg-border/70"><span aria-hidden="true" className="sidebar-accent-rule absolute inset-y-0 left-0 w-2/5" /></div>
      </div>

      <nav aria-label="Primary" className="relative mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} indicatorId={indicatorId} onNavigate={onNavigate} />
        ))}
      </nav>


     

      <div className="relative mt-8 space-y-3 border-t border-line pt-5 px-2 text-small text-secondary">
        <a
          href="https://github.com/adeelasghar12123-lang"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 rounded-md py-1 transition-all duration-300 hover:translate-x-1 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <Github className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-8deg]" strokeWidth={1.65} />
          <span>GitHub</span>
        </a>

         <a
          href="https://www.linkedin.com/in/adeel-stoic-asghar?utm_source=share_via&utm_content=profile&utm_medium=member_android"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 rounded-md py-1 transition-all duration-300 hover:translate-x-1 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <Linkedin className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-8deg]" strokeWidth={1.65} />
          <span>LinkedIn</span>
        </a>

        <a
    href="https://www.instagram.com/prime.adeel/?utm_source=ig_web_button_share_sheet"
    target="_blank"
    rel="noreferrer"
    className="group flex items-center gap-2 rounded-md py-1 transition-all duration-300 hover:translate-x-1 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
  >
    <Instagram className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-8deg]" strokeWidth={1.65} />
    <span>Instagram</span>
  </a>
       
      </div>

      

        <div className="relative mt-8 space-y-3 border-t border-line pt-5 px-2 text-small flex justify-center flex-col text-secondary">

           <span className="font-bold">Developed by :</span>
        <span> Adeel Asghar</span>

          <span className="font-bold">With the assistance of :</span>
          
        <span>Faizan Kareem</span>
         <span>Umme Hani</span>
     
        <span> <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">{APP_VERSION}</p></span>
       
      </div>


    
    </motion.aside>
  );
}
