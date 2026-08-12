"use client";

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
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
};

/*
 * Performance notes:
 * - The typing timer no longer depends on `typed`, so every keystroke does
 *   NOT tear down/recreate an interval.
 * - The passage is rendered through memoized character cells.
 * - Character CSS transitions are disabled; a typing game should react
 *   immediately to every keystroke.
 * - The hidden textarea is automatically refocused whenever the test is active.
 */
const VISIBLE_WORDS = 28;

type VisibleRange = {
  start: number;
  end: number;
  nextStart: number;
};

function getWordRanges(text: string): Array<{ start: number; end: number }> {
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
    if (wordRanges[i].start >= start) {
      chunkIndex = i;
      break;
    }
    chunkIndex = i;
  }

  const endWord = Math.min(chunkIndex + VISIBLE_WORDS, wordRanges.length);
  const last = wordRanges[endWord - 1];
  const end = last ? last.end : text.length;
  const nextStart = endWord < wordRanges.length ? wordRanges[endWord].start : end;

  return {
    start: wordRanges[chunkIndex]?.start ?? 0,
    end,
    nextStart,
  };
}

function countErrors(value: string, passage: string) {
  let count = 0;
  const length = Math.min(value.length, passage.length);
  for (let i = 0; i < length; i += 1) {
    if (value.charCodeAt(i) !== passage.charCodeAt(i)) count += 1;
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
        const isWrong = isTyped && typed.charCodeAt(index) !== char.charCodeAt(0);
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
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<Phase>("name");
  const [preset, setPreset] = useState<TestPreset>(TEST_PRESETS[2]);
  const [passage, setPassage] = useState(PASSAGES[0]);
  const [typed, setTyped] = useState("");
  const [viewportStart, setViewportStart] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [streak, setStreak] = useState(0);
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
  const passageRef = useRef(passage);
  const presetRef = useRef(preset);
  const viewportStartRef = useRef(0);
  const wordRangesRef = useRef<Array<{ start: number; end: number }>>([]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const finishTest = useCallback(
    (value: string, start: number) => {
      const duration = Math.max((Date.now() - start) / 1000, 0.1);
      const currentPassage = passageRef.current;
      const currentName = nameRef.current;
      const currentPreset = presetRef.current;

      const mistakes = countErrors(value, currentPassage);
      const accuracy = Math.max(
        0,
        Math.round(
          ((value.length - mistakes) / Math.max(value.length, 1)) * 100,
        ),
      );
      const wpm = Math.max(
        0,
        Math.round((value.length / 5) / (duration / 60)),
      );
      const previousBest = getPlayerStats(currentName).bestWpm;
      const newBest = wpm > previousBest;
      const streak = markDailyStreak();

      const result = {
        wpm,
        accuracy,
        errors: mistakes,
        duration: Math.round(duration),
        personalBest: Math.max(previousBest, wpm),
        newBest,
        streak,
      };

      setElapsed(duration);
      setErrors(mistakes);
      setStreak(streak);
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

      // Word-based tests finish when the final required character is typed.
      if (
        (currentPreset.kind === "words" || currentPreset.kind === "daily") &&
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

      // Only advance after a CORRECT final character of the visible window.
      // If the user mistypes that final character, remain on the current
      // window so the mistake is visible and can be corrected with Backspace.
      const lastVisibleIndex = range.end - 1;
      const addedOneCharacter =
        limited.length === previous.length + 1;

      const reachedChunkEnd =
        addedOneCharacter &&
        limited.length === range.end &&
        limited[lastVisibleIndex] === currentPassage[lastVisibleIndex];

      if (reachedChunkEnd && range.nextStart > range.start) {
        // The final visible character is the last LETTER of the chunk.
        // Consume the structural whitespace between chunks internally so the
        // next chunk appears immediately and its first character becomes the
        // true current character. The user never has to guess about pressing
        // an invisible Space key.
        const separator = currentPassage.slice(range.end, range.nextStart);
        const advancedValue = limited + separator;

        typedRef.current = advancedValue;
        if (inputRef.current) {
          inputRef.current.value = advancedValue;
        }
        setTyped(advancedValue);
        setErrors(countErrors(advancedValue, currentPassage));

        viewportStartRef.current = range.nextStart;
        setViewportStart(range.nextStart);
      }
    },
    [finishTest, phase],
  );

  // Load saved identity and immediately focus the typing input.
  useEffect(() => {
    const saved = getPlayerName();
    if (!saved) return;

    const nextPreset = TEST_PRESETS[2];
    const nextPassage = longPassage();

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

    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, []);

  // The timer is deliberately independent of `typed`.
  // Recreating a timer on every keystroke was unnecessary work and contributed
  // to the sluggish feeling on longer tests.
  useEffect(() => {
    if (phase !== "running" || !startedAt) return;

    const timer = window.setInterval(() => {
      const nextElapsed = (Date.now() - startedAt) / 1000;
      setElapsed(nextElapsed);

      if (
        presetRef.current.kind === "time" &&
        nextElapsed >= (presetRef.current.value ?? 60)
      ) {
        finishTest(typedRef.current, startedAt);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [finishTest, phase, startedAt]);

  // Keep the game keyboard-ready. If focus is lost to the page, restore it
  // while the test is running. This also fixes landing on /typing and typing
  // immediately without clicking the passage.
  useEffect(() => {
    if (phase !== "running") return;

    const keepFocused = () => {
      if (document.activeElement !== inputRef.current) {
        focusInput();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, select")) return;
      focusInput();
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("focus", keepFocused);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("focus", keepFocused);
    };
  }, [focusInput, phase]);

  function preparePassage(nextPreset: TestPreset) {
    if (nextPreset.kind === "daily") return dailyPassage();
    if (nextPreset.kind === "words") return passageForWords(nextPreset.value ?? 50);
    return longPassage();
  }

  function beginTest(nextPreset: TestPreset, playerName = nameRef.current || name) {
    const clean = playerName.trim().slice(0, 24);
    if (!clean) return;

    savePlayerName(clean);

    const nextPassage = preparePassage(nextPreset);

    nameRef.current = clean;
    presetRef.current = nextPreset;
    passageRef.current = nextPassage;
    wordRangesRef.current = getWordRanges(nextPassage);
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
    setStreak(getDailyStreak());
    setFinished({
      wpm: 0,
      accuracy: 100,
      errors: 0,
      duration: 0,
      personalBest: getPlayerStats(clean).bestWpm,
      newBest: false,
      streak: getDailyStreak(),
    });
    setPhase("running");

    // The input is intentionally uncontrolled for keystroke performance.
    // Reset its native value directly instead of making React reconcile the
    // textarea on every character.
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    focusInput();
  }

  const reset = useCallback(
    () => beginTest(presetRef.current),
    [],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase === "name") return;

      if (event.key === "Tab" || event.key === "Escape") {
        event.preventDefault();
        reset();
        return;
      }

      // If the browser has not focused the hidden input yet, do not lose the
      // user's first keystroke. This makes /typing behave like a real typing
      // game: arrive, look at the passage, and start typing immediately.
      const isPrintable =
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey;

      if (isPrintable && document.activeElement !== inputRef.current) {
        event.preventDefault();
        focusInput();
        const nextValue = `${inputRef.current?.value ?? typedRef.current}${event.key}`;
        handleChange(nextValue);
        if (inputRef.current) {
          inputRef.current.value = nextValue;
        }
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [focusInput, handleChange, phase, reset]);

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
            Your name is saved locally and used as your identifier on this
            device.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              beginTest(TEST_PRESETS[2]);
            }}
            className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
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
    ? Math.round((typed.length / 5) / Math.max(elapsed / 60, 0.01))
    : 0;

  const liveAccuracy = typed.length
    ? Math.max(0, Math.round(((typed.length - errors) / typed.length) * 100))
    : 100;

  const progress =
    preset.kind === "time"
      ? Math.min(100, (elapsed / (preset.value ?? 60)) * 100)
      : Math.min(100, (typed.length / passage.length) * 100);

  const visibleRange = getVisibleRange(
    passage,
    viewportStart,
    wordRangesRef.current,
  );
  const visibleText = passage.slice(visibleRange.start, visibleRange.end);

  const isWrongAtBoundary =
    typed.length >= visibleRange.end &&
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
            <Stat label="Accuracy" value={`${liveAccuracy}%`} />
            <Stat label="Time" value={`${Math.floor(elapsed)}s`} />
            <Stat label="Streak" value={streak || "—"} />
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
                onClick={() => beginTest(option)}
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
          <Result name={name} result={finished} onAgain={reset} />
        ) : (
          <>
            <div className="mt-7 rounded-[4px] border border-border-strong bg-surface-elevated/75 p-6 shadow-[0_18px_45px_rgba(25,24,20,0.06)] sm:p-10 lg:p-14">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                  {preset.label} ·{" "}
                  {preset.kind === "time"
                    ? `${Math.max(
                        0,
                        Math.ceil((preset.value ?? 60) - elapsed),
                      )}s left`
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
                  className="theme-accent-fill h-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div
                onPointerDown={() => focusInput()}
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
                onInput={(e) => handleChange(e.currentTarget.value)}
                onPaste={(e) => e.preventDefault()}
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
      <p className="mt-1 font-sans text-base text-primary">{value}</p>
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
        {result.newBest ? "New personal best." : "Well typed."}
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
          <strong className="text-primary">{result.personalBest} WPM</strong>
        </span>
        <span className="text-muted">·</span>
        <span>
          Daily streak:{" "}
          <strong className="text-primary">{result.streak}</strong>
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
