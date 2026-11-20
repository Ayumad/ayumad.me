/* Public projection of the encrypted dashboard snapshot.
   Counts and health only: no hostnames, IPs, task titles, school items,
   peer names, container names, or timeline text. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readSnapshot } from "./snapshot.js";

const n = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function readPublicSnapshot(env: NodeJS.ProcessEnv = process.env) {
  const raw = await readSnapshot(env);
  if (!raw) return null;

  let v1: any;
  try {
    v1 = JSON.parse(raw);
  } catch {
    return null;
  }

  const h = v1.hermes ?? {};
  const hl = v1.homelab ?? {};
  const now = v1.now ?? {};
  const tasks = v1.tasks ?? {};
  const school = v1.school ?? {};
  const calendar = v1.calendar ?? {};
  const calendarEvents = Array.isArray(calendar.events) ? calendar.events : [];
  const weekEvents = Array.isArray(calendar.week) ? calendar.week : [];
  const brain = v1.brain ?? {};
  const brainNodes = Array.isArray(brain.nodes) ? brain.nodes : [];
  const brainIndex = new Map<string, string>();
  brainNodes.forEach((node: any, i: number) => {
    if (node?.id) brainIndex.set(String(node.id), `n${i}`);
  });
  const publicBrain = {
    notes: n(brain.vault_notes),
    count: brainNodes.length,
    nodes: brainNodes.map((node: any, i: number) => ({
      id: `n${i}`,
      group: node.group ?? null,
      activity: node.activity ?? null,
      degree: n(node.degree),
      size: n(node.size),
    })),
    links: (Array.isArray(brain.links) ? brain.links : [])
      .map((link: any) => [brainIndex.get(String(link?.[0])), brainIndex.get(String(link?.[1]))])
      .filter((link: any[]) => link[0] && link[1]),
  };
  const weekCounts = new Map<string, number>();
  for (const event of weekEvents) {
    const date = String(event?.sort ?? "").slice(0, 10);
    if (date) weekCounts.set(date, (weekCounts.get(date) ?? 0) + 1);
  }

  const guests = Array.isArray(hl.guests)
    ? hl.guests.map((g: any, i: number) => ({
        id: n(g.id),
        name: `${g.type === "lxc" ? "lxc" : "vm"}-${String(i + 1).padStart(2, "0")}`,
        type: g.type ?? null,
        status: g.status ?? null,
        mem_mb: null,
        disk_gb: null,
      }))
    : [];

  const pools = Array.isArray(hl.pools)
    ? hl.pools.map((p: any) => ({
        name: p.name ?? null,
        size_gb: n(p.size_gb),
        alloc_gb: n(p.alloc_gb),
        free_gb: n(p.free_gb),
        used_pct: n(p.used_pct),
        health: p.health ?? null,
      }))
    : [];

  return JSON.stringify({
    schema: "ayumad.dashboard/2",
    public: true,
    generated_at: v1.generated_at ?? null,
    generated_on: "Mac mini",
    hermes: {
      version: h.version ?? null,
      released: h.released ?? null,
      cron_total: n(h.cron_total),
      cron_active: n(h.cron_active),
      cron_no_agent: n(h.cron_no_agent),
      cron_failing_count: n(h.cron_failing_count),
      active_runs: n(h.active_runs),
      host: h.host
        ? {
            cpu_pct: n(h.host.cpu_pct),
            mem_pct: n(h.host.mem_pct),
            mem_used_gb: n(h.host.mem_used_gb),
            mem_total_gb: n(h.host.mem_total_gb),
            load: Array.isArray(h.host.load) ? h.host.load.map(Number).filter(Number.isFinite) : null,
          }
        : null,
      skills: n(h.skills),
      memory: h.memory ?? null,
      disk: h.disk ?? null,
      tokens: h.tokens
        ? {
            month_calls: n(h.tokens.month_calls),
            month_out_m: n(h.tokens.month_out_m),
            cache_share: n(h.tokens.cache_share),
          }
        : null,
    },
    homelab: {
      reachable: hl.reachable ?? null,
      host: hl.host
        ? {
            name: "pve-host",
            uptime_s: n(hl.host.uptime_s),
            load: Array.isArray(hl.host.load)
              ? hl.host.load.map((x: unknown) => Number(x)).filter((x: number) => Number.isFinite(x))
              : null,
            cores: n(hl.host.cores),
            mem_used_gb: n(hl.host.mem_used_gb),
            mem_total_gb: n(hl.host.mem_total_gb),
            failed_units: n(hl.host.failed_units),
          }
        : null,
      guests,
      guests_running: n(now.guests_running),
      pools,
      datasets: [],
      snapshots: n(hl.snapshots),
      scrub_timers: n(hl.scrub_timers),
      backups: hl.backups
        ? {
            count: n(hl.backups.count),
            newest_age_h: n(hl.backups.newest_age_h),
            schedule: hl.backups.schedule ?? null,
            offsite: hl.backups.offsite ?? null,
          }
        : null,
      containers: hl.containers
        ? {
            running: n(hl.containers.running),
            total: n(hl.containers.total),
            unhealthy: [],
            restarting: [],
            names: [],
          }
        : null,
      media: hl.media
        ? {
            torrents: n(hl.media.torrents),
            torrents_active: n(hl.media.torrents_active),
            down_mbps: n(hl.media.down_mbps),
            jellyfin_movies: n(hl.media.jellyfin_movies),
            jellyfin_series: n(hl.media.jellyfin_series),
            jellyfin_episodes: n(hl.media.jellyfin_episodes),
            sonarr_queue: n(hl.media.sonarr_queue),
            radarr_queue: n(hl.media.radarr_queue),
          }
        : null,
      services_up: n(hl.services_up),
      services_total: n(hl.services_total),
      gpu: hl.gpu
        ? { owner_vm: n(hl.gpu.owner_vm), owner_name: null, mode: hl.gpu.mode ?? null }
        : null,
    },
    tasks: { open: n(tasks.open), overdue: n(tasks.overdue), items: [] },
    spotify: v1.spotify
      ? {
          configured: v1.spotify.configured === true,
          state: v1.spotify.state ?? "unavailable",
          isPlaying: v1.spotify.isPlaying === true,
          title: v1.spotify.title ?? null,
          artists: Array.isArray(v1.spotify.artists) ? v1.spotify.artists.map(String).slice(0, 4) : [],
          album: v1.spotify.album ?? null,
          artwork: v1.spotify.artwork ?? null,
          url: v1.spotify.url ?? null,
          progressMs: n(v1.spotify.progressMs),
          durationMs: n(v1.spotify.durationMs),
          playedAt: v1.spotify.playedAt ?? null,
          updatedAt: v1.spotify.updatedAt ?? null,
        }
      : null,
    school: { upcoming: n(school.upcoming), courses: [], next: [] },
    calendar: {
      count: n(calendar.count) ?? calendarEvents.length,
      week_count: n(calendar.week_count) ?? (Array.isArray(calendar.week) ? calendar.week.length : 0),
      week_days: [...weekCounts.entries()].map(([date, count]) => ({ date, count })),
      events: calendarEvents.map((e: any) => ({
        time: e.time ?? null,
        all_day: e.time === "all-day",
      })),
    },
    brain: publicBrain,
    recent: [],
    fleet: [],
    journal: [],
    now: {
      active_projects: n(now.active_projects),
      planned_projects: n(now.planned_projects),
      open_tasks: n(now.open_tasks),
      overdue_tasks: n(now.overdue_tasks),
      assignments_upcoming: n(now.assignments_upcoming),
      devices_online: n(now.devices_online),
      devices_total: n(now.devices_total),
      jobs_failing: n(now.jobs_failing),
      jobs_total: n(now.jobs_total),
      homelab_reachable: now.homelab_reachable ?? null,
      services_up: n(now.services_up),
      services_total: n(now.services_total),
      guests_running: n(now.guests_running),
      containers_running: n(now.containers_running),
      pools_online: n(now.pools_online),
      pools_total: n(now.pools_total),
      homelab_issues_bad: n(now.homelab_issues_bad),
      homelab_issues_warn: n(now.homelab_issues_warn),
    },
    errors: {},
  });
}
