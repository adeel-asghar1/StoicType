import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ScorePayload = {
  name?: unknown;
  wpm?: unknown;
  accuracy?: unknown;
  errors?: unknown;
  duration?: unknown;
};

type LeaderboardRow = {
  name: string;
  name_normalized: string;
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number;
  created_at: string;
};

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return {
    url: url.replace(/\/$/, ""),
    key,
  };
}

function headers(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function validNumber(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}
export async function GET() {
  const config = getConfig();

  if (!config) {
    return NextResponse.json(
      { configured: false, entries: [] },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/leaderboard?select=name,wpm,accuracy,errors,duration,created_at&order=wpm.desc,accuracy.desc,created_at.asc&limit=100`,
      {
        headers: headers(config.key),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Leaderboard GET failed:", await response.text());
      return NextResponse.json({ configured: true, entries: [] }, { status: 502 });
    }

    const rows = (await response.json()) as LeaderboardRow[];

    return NextResponse.json(
      {
        configured: true,
        entries: rows.map((row, index) => ({
          rank: index + 1,
          name: row.name,
          wpm: row.wpm,
          accuracy: row.accuracy,
          errors: row.errors,
          duration: row.duration,
          createdAt: row.created_at,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Leaderboard GET error:", error);
    return NextResponse.json({ configured: true, entries: [] }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const config = getConfig();

  if (!config) {
    return NextResponse.json(
      { configured: false, message: "Global leaderboard is not configured yet." },
      { status: 503 },
    );
  }

  let payload: ScorePayload;

  try {
    payload = (await request.json()) as ScorePayload;
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 24) : "";
  const nameNormalized = normalizeName(name);
  const wpm = payload.wpm;
  const accuracy = payload.accuracy;
  const errors = payload.errors;
  const duration = payload.duration;

  if (
    !name ||
    !nameNormalized ||
    !validNumber(wpm, 0, 300) ||
    !validNumber(accuracy, 0, 100) ||
    !validNumber(errors, 0, 1000) ||
    !validNumber(duration, 1, 3600)
  ) {
    return NextResponse.json({ message: "Invalid score." }, { status: 400 });
  }

  try {
    const lookup = await fetch(
      `${config.url}/rest/v1/leaderboard?select=name,wpm,accuracy&name_normalized=eq.${encodeURIComponent(nameNormalized)}&limit=1`,
      {
        headers: headers(config.key),
        cache: "no-store",
      },
    );

    if (!lookup.ok) {
      console.error("Leaderboard lookup failed:", await lookup.text());
      return NextResponse.json({ message: "Could not save score." }, { status: 502 });
    }

    const existingRows = (await lookup.json()) as Array<Pick<LeaderboardRow, "name" | "wpm" | "accuracy">>;
    const existing = existingRows[0];

    if (
      existing &&
      (existing.wpm > wpm || (existing.wpm === wpm && existing.accuracy >= accuracy))
    ) {
      return NextResponse.json({ saved: false, best: existing });
    }

    const score = {
      name,
      name_normalized: nameNormalized,
      wpm,
      accuracy,
      errors,
      duration,
      created_at: new Date().toISOString(),
    };

    const targetUrl = existing
      ? `${config.url}/rest/v1/leaderboard?name_normalized=eq.${encodeURIComponent(nameNormalized)}`
      : `${config.url}/rest/v1/leaderboard`;

    const response = await fetch(targetUrl, {
      method: existing ? "PATCH" : "POST",
      headers: {
        ...headers(config.key),
        Prefer: existing ? "return=representation" : "return=minimal",
      },
      body: JSON.stringify(score),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Leaderboard save failed:", body);
      return NextResponse.json({ message: "Could not save score." }, { status: 502 });
    }

    return NextResponse.json({ saved: true, best: score });
  } catch (error) {
    console.error("Leaderboard POST error:", error);
    return NextResponse.json({ message: "Could not save score." }, { status: 502 });
  }
}
