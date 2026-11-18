import { describe, expect, it, vi } from "vitest";



vi.mock("./snapshot", () => {
  const fixture = {
    generated_at: "2026-11-18T10:00:00-08:00",
    hermes: {
      cron_total: 41,
      cron_active: 30,
      cron_no_agent: 31,
      cron_failing_count: 0,
      skills: 220,
      memory: { working: 1876, episodic: 720 },
      disk: { used_pct: 91, free_gb: 18.2, size_gb: 228 },
      tokens: { month_calls: 8912, month_out_m: 6.18, cache_share: 98, model: "secret-model" },
    },
    homelab: {
      reachable: true,
      host: {
        name: "secret-host",
        uptime_s: 79200,
        load: ["0.5", "0.4", "0.4"],
        cores: 12,
        mem_used_gb: 30.3,
        mem_total_gb: 62,
        failed_units: 0,
        pve_ui: "https://10.0.0.9:8006",
      },
      guests: [
        { id: 200, name: "secret-vm", type: "qemu", status: "stopped", mem_mb: 24576 },
        { id: 100, name: "secret-nas", type: "lxc", status: "running", mem_mb: 1024 },
      ],
      pools: [{ name: "tank", size_gb: 18636, alloc_gb: 15462, free_gb: 3174, used_pct: 83, health: "ONLINE", scan: "secret scan" }],
      snapshots: 332,
      scrub_timers: 2,
      backups: { count: 115, newest_age_h: 5.2, schedule: "daily 03:30", offsite: false, destination: "/tank/backups" },
      containers: { running: 49, total: 50, names: ["secret-container"], unhealthy: [], restarting: [] },
      media: { torrents: 109, torrents_active: 0, down_mbps: 0, jellyfin_movies: 220, jellyfin_series: 13, jellyfin_episodes: 401, sonarr_queue: 26, radarr_queue: 0 },
      services_up: 33,
      services_total: 33,
      gpu: { owner_vm: 200, owner_name: "secret-ai-vm", mode: "ai" },
    },
    tasks: { open: 50, overdue: 9, items: [{ title: "secret task", list: "Tech" }] },
    school: { upcoming: 6, courses: ["CMPE-131"], next: [{ title: "secret quiz", course: "CMPE-131" }] },
    calendar: { count: 2, events: [
      { time: "all-day", summary: "secret birthday", cal: "secret-cal", sort: "2026-11-18" },
      { time: "10:30 AM", summary: "secret class", cal: "secret-cal", sort: "2026-11-18T10:30:00-08:00" },
    ] },
    fleet: [{ name: "secret-peer", os: "macOS", online: true }],
    now: {
      active_projects: 21,
      planned_projects: 7,
      open_tasks: 50,
      overdue_tasks: 9,
      assignments_upcoming: 6,
      jobs_failing: 0,
      jobs_total: 30,
      homelab_reachable: true,
      services_up: 33,
      services_total: 33,
      guests_running: 5,
      containers_running: 49,
      pools_online: 2,
      pools_total: 2,
      homelab_issues_bad: 0,
      homelab_issues_warn: 1,
    },
  };
  return { readSnapshot: vi.fn(async () => JSON.stringify(fixture)) };
});

import { readPublicSnapshot } from "./public";

describe("public dashboard projection", () => {
  it("keeps counts and health, strips names, addresses, tasks and school detail", async () => {
    const text = await readPublicSnapshot({});
    expect(text).toBeTruthy();
    const out = JSON.parse(text!);
    expect(out.public).toBe(true);
    expect(out.hermes.cron_total).toBe(41);
    expect(out.homelab.pools[0].used_pct).toBe(83);
    expect(out.homelab.guests).toHaveLength(2);
    expect(out.homelab.guests[0].name).toBe("vm-01");
    expect(out.homelab.guests[1].name).toBe("lxc-02");
    expect(out.homelab.containers.names).toEqual([]);
    expect(out.tasks.items).toEqual([]);
    expect(out.school.next).toEqual([]);
    expect(out.calendar.count).toBe(2);
    expect(out.calendar.events[1]).toEqual({ time: "10:30 AM", all_day: false });
    expect(out.fleet).toEqual([]);
    for (const secret of ["secret-host", "secret-vm", "secret-nas", "secret-container", "secret task", "secret quiz", "secret-peer", "secret birthday", "secret class", "secret-cal", "10.0.0.9", "secret-model"]) {
      expect(text).not.toContain(secret);
    }
  });

});
