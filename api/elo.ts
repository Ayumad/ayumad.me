import eloJson from "../data/elo.json" with { type: "json" };
import { summarizeElo, type EloEntry } from "../server/elo.js";

const eloEntries = eloJson as EloEntry[];

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export function GET() {
  const { leaderboard, median, updatedAt } = summarizeElo(eloEntries);

  return Response.json(
    {
      configured: true,
      updatedAt,
      count: leaderboard.length,
      median,
      leaderboard,
    },
    {
      headers: {
        ...jsonHeaders,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
      },
    },
  );
}
