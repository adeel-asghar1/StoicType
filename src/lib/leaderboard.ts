export type GlobalLeaderboardEntry = {
  rank: number;
  name: string;
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number;
  createdAt: string;
};

type LeaderboardResponse = {
  configured: boolean;
  entries?: GlobalLeaderboardEntry[];
  message?: string;
};

export async function getGlobalLeaderboard(): Promise<LeaderboardResponse> {
  try {
    const response = await fetch("/api/leaderboard", { cache: "no-store" });
    const data = (await response.json()) as LeaderboardResponse;

    if (!response.ok) {
      return { configured: Boolean(data.configured), entries: [] };
    }

    return {
      configured: Boolean(data.configured),
      entries: data.entries ?? [],
    };
  } catch {
    return { configured: false, entries: [] };
  }
}

export async function submitGlobalScore(score: {
  name: string;
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number;
}) {
  try {
    const response = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(score),
    });

    return response.ok;
  } catch {
    return false;
  }
}
