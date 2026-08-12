"use client";

import { useCallback, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { getGlobalLeaderboard, type GlobalLeaderboardEntry } from "@/lib/leaderboard";
import { getLeaderboard, getPlayerName, getRecords } from "@/lib/storage";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<GlobalLeaderboardEntry[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localFallback, setLocalFallback] = useState(false);
  const [playerName, setPlayerName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const global = await getGlobalLeaderboard();

    if (global.configured) {
      setConfigured(true);
      setRows(global.entries ?? []);
      setLocalFallback(false);
    } else {
      const localRows = getLeaderboard(getRecords()).map((row) => ({
        rank: row.rank,
        name: row.name,
        wpm: row.wpm,
        accuracy: row.accuracy,
        errors: row.errors,
        duration: row.duration,
        createdAt: row.createdAt,
      }));
      setRows(localRows);
      setLocalFallback(true);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    setPlayerName(getPlayerName());
    void load();
    const interval = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(interval);
  }, [load]);

  return (
    <main className="min-h-screen px-5 py-14 sm:px-8 md:px-12 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
          Leaderboard
        </p>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Top typists.</h1>
            <p className="mt-3 text-base text-secondary">
              {configured
                ? "The fastest players across StoicType."
                : localFallback
                  ? "Local preview — connect the leaderboard backend to make scores global."
                  : "Loading the global leaderboard."}
            </p>
          </div>
          <Trophy className="hidden h-9 w-9 text-muted sm:block" strokeWidth={1.3} />
        </div>

        <div className="mt-10 overflow-hidden border-y border-line bg-background/35">
          {loading ? (
            <div className="px-6 py-16 text-center text-base text-secondary">
              Loading scores...
            </div>
          ) : rows.length ? (
            rows.map((row) => (
              <div
                key={`${row.name}-${row.rank}`}
                className={`group grid grid-cols-[52px_1fr_90px_100px] items-center gap-4 border-b border-line px-5 py-5 last:border-b-0 transition hover:bg-white/45 sm:grid-cols-[70px_1fr_120px_120px] ${playerName && row.name.toLowerCase() === playerName.toLowerCase() ? "bg-primary/[0.06]" : ""}`}
              >
                <span className="font-mono text-xs text-muted">
                  {String(row.rank).padStart(2, "0")}
                </span>
                <span className="font-semibold tracking-[0.02em]">{row.name}{playerName && row.name.toLowerCase() === playerName.toLowerCase() ? <span className="ml-2 text-xs font-medium text-accent">YOU</span> : null}</span>
                <span className="text-right font-mono text-sm">{row.wpm} WPM</span>
                <span className="text-right font-mono text-sm text-secondary">
                  {row.accuracy}% ACC
                </span>
              </div>
            ))
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-display text-lg">No scores yet.</p>
              <p className="mt-3 text-base text-secondary">
                Complete a typing test to claim the first spot.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
            {configured ? `${rows.length} ranked players · updates every 30s` : "Local mode"}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary transition hover:text-primary"
          >
            Refresh
          </button>
        </div>
      </div>
    </main>
  );
}
