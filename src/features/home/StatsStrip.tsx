"use client";

import { useEffect, useState } from "react";
import { getPlayerName, getPlayerStats } from "@/lib/storage";

export function StatsStrip() {
  const [stats, setStats] = useState({ bestWpm: 0, averageWpm: 0, tests: 0 });
  useEffect(() => {
    const name = getPlayerName();
    const current = getPlayerStats(name);
    setStats({ bestWpm: current.bestWpm, averageWpm: current.averageWpm, tests: current.tests });
  }, []);

  const items = [
    ["Best WPM", stats.bestWpm ? String(stats.bestWpm) : "—"],
    ["Average WPM", stats.averageWpm ? String(stats.averageWpm) : "—"],
    ["Tests Completed", String(stats.tests || "—")],
  ];

  return (
    <dl className="grid grid-cols-3 border-y border-line bg-background/20 backdrop-blur-[2px]">
      {items.map(([label, value], index) => (
        <div key={label} className={["group relative px-3 py-5 text-center transition-all duration-500 home-stat-hover", index > 0 ? "border-l border-line" : ""].join(" ")}>
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100" />
          <dt className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">{label}</dt>
          <dd className="mt-2 font-mono text-lg text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
