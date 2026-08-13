import eloJson from "../data/elo.json";
import { type EloEntry } from "../server/elo.js";

const eloEntries = eloJson as EloEntry[];

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export function GET() {
  const leaderboard = [...eloEntries].sort((a, b) => b.rating - a.rating);
  const median =
    leaderboard.length > 0
      ? leaderboard[Math.floor(leaderboard.length / 2)].rating
      : null;

  return Response.json(
    {
      configured: true,
      updatedAt: leaderboard.length > 0 ? leaderboard[0].lastRatedAt : null,
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
