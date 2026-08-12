export const THEME_IDS = [
  "stoic",
  "midnight",
  "purple",
  "cyan",
  "emerald",
  "red",
  "pink",
  "yellow",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEME_OPTIONS: Array<{
  id: ThemeId;
  name: string;
  description: string;
  swatches: [string, string];
}> = [
  {
    id: "stoic",
    name: "Stoic",
    description: "Warm editorial",
    swatches: ["#f5f3ee", "#141412"],
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep monochrome",
    swatches: ["#111214", "#f3f1eb"],
  },
  {
    id: "purple",
    name: "Purple",
    description: "Dark violet",
    swatches: ["#111018", "#9b7cff"],
  },
  {
    id: "cyan",
    name: "Cyan",
    description: "Dark aqua",
    swatches: ["#0d1416", "#55d6e8"],
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Dark green",
    swatches: ["#0d1512", "#4fd49a"],
  },
  {
    id: "red",
    name: "Red",
    description: "Dark crimson",
    swatches: ["#160f10", "#f06a72"],
  },
  {
    id: "pink",
    name: "Pink",
    description: "Dark rose",
    swatches: ["#170f14", "#f08ab8"],
  },
  {
    id: "yellow",
    name: "Yellow",
    description: "Dark amber",
    swatches: ["#15130c", "#e7c85a"],
  },
];

const THEME_KEY = "stoictype:theme";

const DEFAULT_THEME: ThemeId = "purple";

export function isThemeId(value: string | null): value is ThemeId {
  return (
    !!value &&
    (THEME_IDS as readonly string[]).includes(value)
  );
}

export function getTheme(): ThemeId {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const stored = localStorage.getItem(THEME_KEY);

  return isThemeId(stored) ? stored : DEFAULT_THEME;
}

export function saveTheme(theme: ThemeId) {
  localStorage.setItem(THEME_KEY, theme);
}