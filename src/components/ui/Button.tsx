"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { Transition } from "framer-motion";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

const LIFT_VARIANTS = {
  rest: { y: 0, scale: 1 },
  hover: { y: -3, scale: 1.018 },
  press: { y: 0, scale: 0.975 },
};

const ARROW_VARIANTS = {
  rest: { x: 0 },
  hover: { x: 6 },
  press: { x: 1 },
};

const TRANSITION: Transition = {
  duration: 0.34,
  ease: [0.22, 1, 0.36, 1],
};

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const [motionReady, setMotionReady] = useState(false);

  // Framer Motion's reduced-motion preference is resolved on the client.
  // Delay enabling conditional motion until after hydration so the server
  // and first client render produce identical markup/props.
  useEffect(() => {
    setMotionReady(true);
  }, []);

  const enableMotion = motionReady && prefersReducedMotion !== true;
  const isPrimary = variant === "primary";

  return (
    <motion.div
      initial="rest"
      whileHover={enableMotion ? "hover" : undefined}
      whileTap={enableMotion ? "press" : undefined}
      variants={LIFT_VARIANTS}
      transition={TRANSITION}
      className="inline-block"
    >
      <Link
        href={href}
        className={[
          "group relative inline-flex min-h-12 items-center justify-center gap-3 overflow-hidden",
          "rounded-[2px] border px-6 py-3 text-small font-semibold uppercase tracking-[0.13em]",
          "transition-[background-color,border-color,color,box-shadow] duration-300 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isPrimary
            ? "theme-accent-button"
            : "theme-outline-button text-primary shadow-[0_5px_18px_rgba(0,0,0,0.04)] hover:text-primary",
          className,
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-[24deg]",
            "bg-gradient-to-r from-transparent via-white/35 to-transparent",
            "opacity-0 transition-all duration-700 ease-out",
            "group-hover:left-[125%] group-hover:opacity-100",
          ].join(" ")}
        />

        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300",
            isPrimary
              ? "bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16),transparent_55%)] group-hover:opacity-100"
              : "bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.10),transparent_55%)] group-hover:opacity-100",
          ].join(" ")}
        />

        <span className="relative z-10">{children}</span>

        <motion.span
          variants={ARROW_VARIANTS}
          transition={TRANSITION}
          className="relative z-10 inline-flex"
          aria-hidden="true"
        >
          <ArrowRight size={16} strokeWidth={1.8} />
        </motion.span>
      </Link>
    </motion.div>
  );
}
