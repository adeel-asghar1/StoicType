"use client";

import { useEffect, useState } from "react";
import { getPlayerName, savePlayerName } from "@/lib/storage";
import { THEME_OPTIONS } from "@/lib/theme";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setName(getPlayerName());
  }, []);

  const save = () => {
    const trimmed = name.trim();

    if (!trimmed) return;

    savePlayerName(trimmed);
    setName(trimmed);
    setSaved(true);

    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <main className="min-h-screen px-5 py-14 sm:px-8 md:px-12 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
          Settings
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Your setup.
        </h1>

        <section className="mt-10 border-y border-line py-8">
          <p className="font-semibold">Player name</p>

          <p className="mt-2 text-sm leading-6 text-secondary">
            This name is your local identifier. No account or password is
            required.
          </p>

          <div className="mt-5 flex max-w-lg gap-3">
            <input
              value={name}
              maxLength={24}
              onChange={(event) => setName(event.target.value)}
              className="min-h-11 flex-1 border border-border-strong bg-surface-elevated px-4 outline-none transition focus:border-primary"
            />

            <button
              type="button"
              onClick={save}
              className="min-h-11 bg-primary px-5 text-xs font-semibold uppercase tracking-wider text-background transition hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </section>

        <section className="border-b border-line py-8">
          <div>
            <p className="font-semibold">Theme</p>

            <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">
              Choose the atmosphere for your typing sessions. Your choice is
              saved on this device.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {THEME_OPTIONS.map((option) => {
              const selected = theme === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  aria-pressed={selected}
                  className={[
                    "group relative overflow-hidden rounded-[4px] border p-4 text-left transition-all duration-300",
                    "hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,0.12)]",
                    selected
                      ? "theme-card border-accent bg-surface-elevated"
                      : "border-line bg-background/50 hover:border-border-strong",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 theme-accent-fill transition-transform duration-500 group-hover:scale-x-100"
                  />

                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-12 overflow-hidden rounded-[3px] border border-black/10 shadow-sm">
                      <span
                        className="w-1/2"
                        style={{ background: option.swatches[0] }}
                      />

                      <span
                        className="w-1/2"
                        style={{ background: option.swatches[1] }}
                      />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {option.name}
                      </span>

                      <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                        {option.description}
                      </span>
                    </span>

                    {selected && (
                      <span
                        className="ml-auto h-2 w-2 rounded-full bg-accent"
                        aria-label="Selected"
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}