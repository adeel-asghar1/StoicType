"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  getDailyStreak,
  getPlayerName,
  getPlayerStats,
  markDailyStreak,
  savePlayerName,
  saveRecord,
} from "@/lib/storage";
import { submitGlobalScore } from "@/lib/leaderboard";
import {
  dailyPassage,
  longPassage,
  passageForWords,
  PASSAGES,
  TEST_PRESETS,
  type TestPreset,
} from "@/lib/typing";

type Phase = "name" | "running" | "finished";

type Result = {
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number;
  personalBest: number;
  newBest: boolean;
  streak: number;
  escapeCaught?: boolean;
};

const VISIBLE_WORDS = 28;
const ESCAPE_INITIAL_GAP = 78;
const ESCAPE_PRESSURE_CPS = 4.2;

type VisibleRange = {
  start: number;
  end: number;
  nextStart: number;
};

function getDefaultPreset(): TestPreset {
  return (
    TEST_PRESETS[2] ??
    TEST_PRESETS[0] ??
    ({
      id: "default",
      label: "Typing Test",
      kind: "words",
      value: 50,
    } as TestPreset)
  );
}

function getDefaultPassage(): string {
  return PASSAGES[0] ?? "";
}

function getWordRanges(
  text: string,
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return ranges;
}

function getVisibleRange(
  text: string,
  start: number,
  wordRanges: Array<{ start: number; end: number }>,
): VisibleRange {
  if (!wordRanges.length) {
    return { start: 0, end: text.length, nextStart: text.length };
  }

  let chunkIndex = 0;

  for (let i = 0; i < wordRanges.length; i += 1) {
    const range = wordRanges[i];

    if (!range) continue;

    if (range.start >= start) {
      chunkIndex = i;
      break;
    }

    chunkIndex = i;
  }

  const endWord = Math.min(
    chunkIndex + VISIBLE_WORDS,
    wordRanges.length,
  );

  const last = wordRanges[endWord - 1];
  const end = last?.end ?? text.length;

  const nextRange =
    endWord < wordRanges.length ? wordRanges[endWord] : undefined;

  const nextStart = nextRange?.start ?? end;

  return {
    start: wordRanges[chunkIndex]?.start ?? 0,
    end,
    nextStart,
  };
}

function countErrors(value: string, passage: string): number {
  let count = 0;
  const length = Math.min(value.length, passage.length);

  for (let i = 0; i < length; i += 1) {
    if (value.charCodeAt(i) !== passage.charCodeAt(i)) {
      count += 1;
    }
  }

  return count;
}

type CharStatus = "typed" | "wrong" | "current" | "remaining";

const TypingChar = memo(function TypingChar({
  char,
  status,
}: {
  char: string;
  status: CharStatus;
}) {
  const className =
    status === "wrong"
      ? "typing-char typing-char-wrong"
      : status === "typed"
        ? "typing-char typing-char-typed"
        : status === "current"
          ? "typing-char typing-char-current"
          : "typing-char typing-char-remaining";

  return <span className={className}>{char}</span>;
});


function getCurrentEscapePenalty(value: string, passage: string): number {
  return countErrors(value, passage) * 0.35;
}

const TypingPassage = memo(function TypingPassage({
  text,
  start,
  typed,
}: {
  text: string;
  start: number;
  typed: string;
}) {
  const chars = useMemo(() => [...text], [text]);

  return (
    <>
      {chars.map((char, localIndex) => {
        const index = start + localIndex;
        const isTyped = index < typed.length;
        const isWrong =
          isTyped &&
          typed.charCodeAt(index) !== char.charCodeAt(0);
        const isCurrent = index === typed.length;

        return (
          <TypingChar
            key={index}
            char={char}
            status={
              isWrong
                ? "wrong"
                : isTyped
                  ? "typed"
                  : isCurrent
                    ? "current"
                    : "remaining"
            }
          />
        );
      })}
    </>
  );
});

export default function TypingPage() {
  const defaultPreset = getDefaultPreset();
  const defaultPassage = getDefaultPassage();

  const [name, setName] = useState("");
  const [phase, setPhase] = useState<Phase>("name");
  const [preset, setPreset] = useState<TestPreset>(defaultPreset);
  const [passage, setPassage] = useState(defaultPassage);
  const [typed, setTyped] = useState("");
  const [viewportStart, setViewportStart] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [streak, setStreak] = useState(0);
  const [escapeGap, setEscapeGap] = useState(ESCAPE_INITIAL_GAP);

  const [finished, setFinished] = useState<Result>({
    wpm: 0,
    accuracy: 100,
    errors: 0,
    duration: 0,
    personalBest: 0,
    newBest: false,
    streak: 0,
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typedRef = useRef("");
  const startedAtRef = useRef<number | null>(null);
  const nameRef = useRef("");
  const passageRef = useRef<string>(defaultPassage);
  const presetRef = useRef<TestPreset>(defaultPreset);
  const viewportStartRef = useRef(0);
  const wordRangesRef = useRef<Array<{ start: number; end: number }>>([]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const finishTest = useCallback(
    (value: string, start: number, escapeCaught = false) => {
      const duration = Math.max((Date.now() - start) / 1000, 0.1);
      const currentPassage = passageRef.current;
      const currentName = nameRef.current;
      const currentPreset = presetRef.current;

      const mistakes = countErrors(value, currentPassage);

      const accuracy = Math.max(
        0,
        Math.round(
          ((value.length - mistakes) /
            Math.max(value.length, 1)) *
            100,
        ),
      );

      const wpm = Math.max(
        0,
        Math.round((value.length / 5) / (duration / 60)),
      );

      const previousBest = getPlayerStats(currentName).bestWpm;
      const newBest = wpm > previousBest;
      const currentStreak = markDailyStreak();

      const result: Result = {
        wpm,
        accuracy,
        errors: mistakes,
        duration: Math.round(duration),
        personalBest: Math.max(previousBest, wpm),
        newBest,
        streak: currentStreak,
        escapeCaught: currentPreset.kind === "escape" ? escapeCaught : undefined,
      };

      setElapsed(duration);
      setErrors(mistakes);
      setStreak(currentStreak);
      setFinished(result);

      saveRecord({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: currentName,
        wpm,
        accuracy,
        errors: mistakes,
        duration: Math.round(duration),
        mode: currentPreset.id,
        createdAt: new Date().toISOString(),
      });

      void submitGlobalScore({
        name: currentName,
        wpm,
        accuracy,
        errors: mistakes,
        duration: Math.round(duration),
      });

      setPhase("finished");
    },
    [],
  );

  const handleChange = useCallback(
    (value: string) => {
      if (phase !== "running") return;

      const currentPassage = passageRef.current;
      const currentPreset = presetRef.current;
      const previous = typedRef.current;

      const limited = value.slice(0, currentPassage.length);

      if (!startedAtRef.current && limited.length > 0) {
        const now = Date.now();

        startedAtRef.current = now;
        setStartedAt(now);
        setElapsed(0);
      }

      const nextErrors = countErrors(limited, currentPassage);

      typedRef.current = limited;
      setTyped(limited);
      setErrors(nextErrors);

      if (
        (currentPreset.kind === "words" ||
          currentPreset.kind === "daily" ||
          currentPreset.kind === "escape") &&
        limited.length >= currentPassage.length
      ) {
        finishTest(
          limited,
          startedAtRef.current ?? Date.now(),
        );
        return;
      }

      const range = getVisibleRange(
        currentPassage,
        viewportStartRef.current,
        wordRangesRef.current,
      );

      const lastVisibleIndex = range.end - 1;

      const addedOneCharacter =
        limited.length === previous.length + 1;

      const reachedChunkEnd =
        addedOneCharacter &&
        limited.length === range.end &&
        lastVisibleIndex >= 0 &&
        limited[lastVisibleIndex] ===
          currentPassage[lastVisibleIndex];

      if (
        reachedChunkEnd &&
        range.nextStart > range.start
      ) {
        const separator = currentPassage.slice(
          range.end,
          range.nextStart,
        );

        const advancedValue = limited + separator;

        typedRef.current = advancedValue;

        if (inputRef.current) {
          inputRef.current.value = advancedValue;
        }

        setTyped(advancedValue);
        setErrors(
          countErrors(
            advancedValue,
            currentPassage,
          ),
        );

        viewportStartRef.current = range.nextStart;
        setViewportStart(range.nextStart);
      }
    },
    [finishTest, phase],
  );

  useEffect(() => {
    const saved = getPlayerName();

    if (!saved) return;

    const nextPreset = getDefaultPreset();
    const nextPassage = longPassage() || getDefaultPassage();

    setName(saved);
    nameRef.current = saved;

    setPreset(nextPreset);
    presetRef.current = nextPreset;

    setPassage(nextPassage);
    passageRef.current = nextPassage;

    wordRangesRef.current = getWordRanges(nextPassage);

    setViewportStart(0);
    viewportStartRef.current = 0;

    setPhase("running");

    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    if (phase !== "running" || !startedAt) return;

    const timer = window.setInterval(() => {
      const nextElapsed =
        (Date.now() - startedAt) / 1000;

      setElapsed(nextElapsed);

      if (presetRef.current.kind === "escape") {
        const nextGap =
          ESCAPE_INITIAL_GAP +
          typedRef.current.length -
          nextElapsed * ESCAPE_PRESSURE_CPS -
          getCurrentEscapePenalty(typedRef.current, passageRef.current);

        setEscapeGap(nextGap);

        if (nextGap <= 0) {
          finishTest(
            typedRef.current,
            startedAt,
            true,
          );
        }
        return;
      }

      if (
        presetRef.current.kind === "time" &&
        nextElapsed >=
          (presetRef.current.value ?? 60)
      ) {
        finishTest(
          typedRef.current,
          startedAt,
        );
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [finishTest, phase, startedAt]);

  useEffect(() => {
    if (phase !== "running") return;

    const keepFocused = () => {
      if (
        document.activeElement !== inputRef.current
      ) {
        focusInput();
      }
    };

    const onPointerDown = (
      event: PointerEvent,
    ) => {
      const target =
        event.target as HTMLElement | null;

      if (
        target?.closest(
          "button, a, input, select",
        )
      ) {
        return;
      }

      focusInput();
    };

    window.addEventListener(
      "pointerdown",
      onPointerDown,
    );

    window.addEventListener(
      "focus",
      keepFocused,
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        onPointerDown,
      );

      window.removeEventListener(
        "focus",
        keepFocused,
      );
    };
  }, [focusInput, phase]);

  const preparePassage = useCallback(
    (nextPreset: TestPreset): string => {
      if (nextPreset.kind === "daily") {
        return dailyPassage() || getDefaultPassage();
      }

      if (nextPreset.kind === "words") {
        return (
          passageForWords(nextPreset.value ?? 50) ||
          getDefaultPassage()
        );
      }

      return longPassage() || getDefaultPassage();
    },
    [],
  );

  const beginTest = useCallback(
    (
      nextPreset: TestPreset,
      playerName = nameRef.current || name,
    ) => {
      const clean = playerName
        .trim()
        .slice(0, 24);

      if (!clean) return;

      savePlayerName(clean);

      const nextPassage = preparePassage(nextPreset);

      nameRef.current = clean;
      presetRef.current = nextPreset;
      passageRef.current = nextPassage;

      wordRangesRef.current =
        getWordRanges(nextPassage);

      typedRef.current = "";
      startedAtRef.current = null;
      viewportStartRef.current = 0;

      setName(clean);
      setPreset(nextPreset);
      setPassage(nextPassage);
      setViewportStart(0);
      setTyped("");
      setElapsed(0);
      setStartedAt(null);
      setErrors(0);
      setEscapeGap(ESCAPE_INITIAL_GAP);

      const currentStreak = getDailyStreak();

      setStreak(currentStreak);

      setFinished({
        wpm: 0,
        accuracy: 100,
        errors: 0,
        duration: 0,
        personalBest:
          getPlayerStats(clean).bestWpm,
        newBest: false,
        streak: currentStreak,
      });

      setPhase("running");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      focusInput();
    },
    [focusInput, name, preparePassage],
  );

  const reset = useCallback(() => {
    beginTest(presetRef.current);
  }, [beginTest]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase === "name") return;

      if (
        event.key === "Tab" ||
        event.key === "Escape"
      ) {
        event.preventDefault();
        reset();
        return;
      }

      const isPrintable =
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey;

      if (
        isPrintable &&
        document.activeElement !==
          inputRef.current
      ) {
        event.preventDefault();

        focusInput();

        const nextValue = `${
          inputRef.current?.value ??
          typedRef.current
        }${event.key}`;

        handleChange(nextValue);

        if (inputRef.current) {
          inputRef.current.value = nextValue;
        }
      }
    };

    window.addEventListener(
      "keydown",
      onKey,
      true,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKey,
        true,
      );
  }, [
    focusInput,
    handleChange,
    phase,
    reset,
  ]);

  if (phase === "name") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            New typist
          </p>

          <h1 className="mt-5 font-display text-3xl leading-relaxed sm:text-4xl">
            What should we call you?
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-7 tracking-[0.015em] text-secondary">
            Your name is saved locally and used as
            your identifier on this device.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              beginTest(getDefaultPreset());
            }}
            className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              autoFocus
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={24}
              placeholder="Enter your name"
              className="theme-focus min-h-13 flex-1 rounded-[3px] border border-border-strong bg-surface-elevated px-4 text-base tracking-[0.02em] text-primary outline-none transition"
            />

            <button
              type="submit"
              className="theme-accent-button min-h-13 border px-6 py-3 text-sm font-semibold tracking-[0.08em] transition hover:-translate-y-1"
            >
              Continue
            </button>
          </form>
        </div>
      </main>
    );
  }

  const liveWpm = startedAt
    ? Math.round(
        (typed.length / 5) /
          Math.max(elapsed / 60, 0.01),
      )
    : 0;

  const liveAccuracy = typed.length
    ? Math.max(
        0,
        Math.round(
          ((typed.length - errors) /
            typed.length) *
            100,
        ),
      )
    : 100;

  const progress =
    preset.kind === "time"
      ? Math.min(
          100,
          (elapsed /
            (preset.value ?? 60)) *
            100,
        )
      : Math.min(
          100,
          (typed.length /
            Math.max(passage.length, 1)) *
            100,
        );

  const escapeDistance = Math.min(
    82,
    Math.max(8, 10 + escapeGap * 0.78),
  );
  const escapeDanger =
    preset.kind === "escape" && escapeGap <= 24;
  const escapeCritical =
    preset.kind === "escape" && escapeGap <= 10;

  const visibleRange = getVisibleRange(
    passage,
    viewportStart,
    wordRangesRef.current,
  );

  const visibleText = passage.slice(
    visibleRange.start,
    visibleRange.end,
  );

  const isWrongAtBoundary =
    typed.length >= visibleRange.end &&
    visibleRange.end > 0 &&
    typed.charCodeAt(visibleRange.end - 1) !==
      passage.charCodeAt(visibleRange.end - 1);

  return (
    <main className="min-h-screen px-5 py-12 sm:px-8 md:px-12 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-line pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              Typing / {name}
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[0.01em]">
              Focus.
            </h1>
          </div>

          <div className="grid grid-cols-4 border border-line">
            <Stat label="WPM" value={liveWpm || "—"} />
            <Stat
              label="Accuracy"
              value={`${liveAccuracy}%`}
            />
            <Stat
              label="Time"
              value={`${Math.floor(elapsed)}s`}
            />
            <Stat
              label="Streak"
              value={streak || "—"}
            />
          </div>
        </div>

        {phase !== "finished" && (
          <div
            className="mt-8 flex flex-wrap items-center gap-2"
            aria-label="Test presets"
          >
            {TEST_PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  beginTest(option)
                }
                className={`rounded-full border px-4 py-2 text-sm tracking-[0.025em] transition-all duration-200 ${
                  preset.id === option.id
                    ? "theme-preset-active"
                    : "theme-preset border-line bg-background/40 text-secondary hover:-translate-y-0.5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {phase === "finished" ? (
          <Result
            name={name}
            result={finished}
            onAgain={reset}
          />
        ) : (
          <>
            <div className={`mt-7 rounded-[4px] border border-border-strong bg-surface-elevated/75 p-6 shadow-[0_18px_45px_rgba(25,24,20,0.06)] sm:p-10 lg:p-14 ${preset.kind === "escape" ? "escape-mode-card" : ""}`}>
              {preset.kind === "escape" && (
                <EscapeChase
                  distance={escapeDistance}
                  danger={escapeDanger}
                  critical={escapeCritical}
                  started={Boolean(startedAt)}
                />
              )}

              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                  {preset.label} ·{" "}
                  {preset.kind === "time"
                    ? `${Math.max(
                        0,
                        Math.ceil(
                          (preset.value ??
                            60) -
                            elapsed,
                        ),
                      )}s left`
                    : preset.kind === "escape"
                      ? `${Math.max(0, Math.round(escapeGap))}m ahead`
                      : `${typed.length} / ${passage.length} characters`}
                </span>

                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                  {Math.round(progress)}% complete
                </span>
              </div>

              <div
                aria-hidden="true"
                className="mb-10 h-[3px] w-full overflow-hidden bg-border/70"
              >
                <div
                  className={preset.kind === "escape" ? "escape-progress-fill h-full" : "theme-accent-fill h-full"}
                  style={{
                    width: `${preset.kind === "escape" ? Math.min(100, Math.max(4, escapeGap)) : progress}%`,
                  }}
                />
              </div>

              <div
                onPointerDown={() =>
                  focusInput()
                }
                aria-hidden="true"
                className="typing-passage typing-passage-viewport cursor-text select-none font-sans text-[clamp(1.45rem,2.8vw,2.45rem)] leading-[1.55] tracking-[0.035em]"
              >
                <TypingPassage
                  text={visibleText}
                  start={visibleRange.start}
                  typed={typed}
                />

                {isWrongAtBoundary && (
                  <span
                    aria-hidden="true"
                    className="typing-caret-after"
                  />
                )}
              </div>

              <textarea
                ref={inputRef}
                defaultValue=""
                onInput={(event) =>
                  handleChange(
                    event.currentTarget
                      .value,
                  )
                }
                onPaste={(event) =>
                  event.preventDefault()
                }
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoFocus
                tabIndex={0}
                aria-label="Typing input"
                className="absolute left-[-9999px] h-px w-px opacity-0"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm tracking-[0.025em] text-muted">
                {preset.kind === "daily"
                  ? "Daily passage · same challenge for everyone today"
                  : preset.kind === "escape"
                    ? "Keep typing · if you slow down, the scorpion gets closer"
                    : "Start typing to begin · Tab or Esc to restart"}
              </p>

              <button
                onClick={reset}
                className="group inline-flex items-center gap-2 text-sm font-semibold tracking-[0.04em] text-secondary transition hover:text-primary"
              >
                <RotateCcw
                  size={15}
                  className="transition-transform duration-300 group-hover:-rotate-90"
                />
                Restart
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function EscapeChase({
  distance,
  danger,
  critical,
  started,
}: {
  distance: number;
  danger: boolean;
  critical: boolean;
  started: boolean;
}) {
  const scorpionLeft = Math.max(4, Math.min(67, 76 - distance * 0.72));

  return (
    <div className={`escape-chase ${danger ? "escape-chase-danger" : ""} ${critical ? "escape-chase-critical" : ""}`}>
      <div className="escape-chase-header">
        <div>
          <p className="escape-chase-kicker">Escape the Scorpion</p>
          <p className="escape-chase-status">
            {!started
              ? "Start running."
              : critical
                ? "IT'S RIGHT BEHIND YOU."
                : danger
                  ? "KEEP MOVING."
                  : "Stay ahead."}
          </p>
        </div>
        <span className="escape-chase-icon" aria-hidden="true">🦂</span>
      </div>

      <div className="escape-track" aria-hidden="true">
        <div className="escape-track-line" />
        <div className="escape-runner" style={{ left: "76%" }}>
          <svg viewBox="0 0 48 64" role="presentation">
            <circle cx="24" cy="9" r="6" fill="currentColor" />
            <path d="M24 16v22M24 21L13 30M24 21l11 9M24 38L15 55M24 38l9 17" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        <div
          className="escape-scorpion"
          style={{ left: `${scorpionLeft}%` }}
        >
          <svg viewBox="0 0 88 58" role="presentation">
            <path d="M18 32c7-11 23-13 34-7 7 4 11 10 17 10 5 0 7-4 9-8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="34" cy="30" rx="17" ry="11" fill="currentColor" />
            <circle cx="19" cy="30" r="8" fill="currentColor" />
            <path d="M12 25L3 18M13 35L3 43M46 25l12-8M46 35l12 8M28 20l-6-10M37 20l5-10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M8 25l-5-5M8 35l-5 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <span className="escape-danger-line" />
      </div>

      <div className="escape-chase-labels">
        <span>SCORPION</span>
        <span>{critical ? "BITING DISTANCE" : danger ? "DANGER" : "SAFE DISTANCE"}</span>
        <span>YOU</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-[72px] border-l border-line px-3 py-2 text-center first:border-l-0">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
        {label}
      </p>

      <p className="mt-1 font-sans text-base text-primary">
        {value}
      </p>
    </div>
  );
}

function Result({
  name,
  result,
  onAgain,
}: {
  name: string;
  result: Result;
  onAgain: () => void;
}) {
  return (
    <div className="mx-auto mt-14 max-w-4xl text-center">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
        Test complete / {name}
      </p>

      <h2 className="mt-5 font-display text-3xl leading-relaxed sm:text-4xl">
        {result.escapeCaught
          ? "The scorpion caught you."
          : result.newBest
            ? "New personal best."
            : result.escapeCaught === false
              ? "You escaped."
              : "Well typed."}
      </h2>

      <div className="mt-10 grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {[
          ["WPM", result.wpm],
          ["Accuracy", `${result.accuracy}%`],
          ["Errors", result.errors],
          ["Time", `${result.duration}s`],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="border-b border-line px-5 py-7 last:border-b-0 sm:border-b-0 sm:border-l first:border-l-0"
          >
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
              {label}
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[0.02em]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm tracking-[0.025em] text-secondary">
        <span>
          Personal best:{" "}
          <strong className="text-primary">
            {result.personalBest} WPM
          </strong>
        </span>

        <span className="text-muted">·</span>

        <span>
          Daily streak:{" "}
          <strong className="text-primary">
            {result.streak}
          </strong>
        </span>
      </div>

      <div className="mt-9 flex justify-center">
        <button
          type="button"
          onClick={onAgain}
          className="theme-accent-button rounded-[3px] border px-7 py-3 text-sm font-semibold tracking-[0.07em] transition hover:-translate-y-1"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}