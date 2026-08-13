import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { StatsStrip } from "@/features/home/StatsStrip";

export function HomeScreen() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16 sm:px-8 md:px-12 lg:px-16">
      {/* Quiet editorial atmosphere — decorative, but intentionally unexplained. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[8%] top-[18%] h-44 w-44 rounded-full home-orb-primary blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[8%] right-[10%] h-64 w-64 rounded-full home-orb-secondary blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[11%] h-px w-[min(62vw,760px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-border-strong/45 to-transparent"
      />

      <p
        aria-hidden="true"
        className="absolute right-6 top-7 hidden font-mono text-[9px] uppercase tracking-[0.3em] text-muted md:right-12 md:top-10 md:block lg:right-16"
      >
        Precision / Speed / Flow
      </p>

      <Reveal className="relative z-10 w-full max-w-5xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-secondary">
          StoicType 
        </p>

        <div className="mx-auto mt-5 flex items-center justify-center gap-2">
          <span className="h-px w-8 bg-border-strong" />
          <span className="h-1.5 w-1.5 rounded-full theme-accent-fill shadow-[0_0_14px_var(--color-accent-soft)]" />
          <span className="h-px w-8 bg-border-strong" />
        </div>

        <h1 className="mx-auto mt-8 max-w-5xl text-balance font-display text-[clamp(2.15rem,4.55vw,5.25rem)] leading-[1.18] tracking-[0.015em] text-primary">
          Welcome to StoicType
        </h1>

        <p className="mx-auto mt-8 max-w-xl text-[0.96rem] leading-7 text-secondary">
          Test your typing speed, sharpen your accuracy, and find your rhythm.
          <span className="hidden sm:inline"> A focused space for measurable progress.</span>
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button href="/typing">Start Typing</Button>
          <Button href="/statistics" variant="secondary">
            View Statistics
          </Button>
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <StatsStrip />
        </div>
      </Reveal>
    </section>
  );
}
