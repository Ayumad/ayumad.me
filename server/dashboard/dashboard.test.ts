import { scryptSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "../../api/dashboard";
import { createSession, dashboardAccount, readSession } from "./auth";

const origin = "https://example.test";
const salt = Buffer.alloc(16, 1);
const password = "test password for this fixture";
const hash = scryptSync(password, salt, 32, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
const config = {
  DASHBOARD_USERNAME: "owner",
  DASHBOARD_PASSWORD_HASH: salt.toString("hex") + ":" + hash.toString("hex"),
  DASHBOARD_SESSION_SECRET: "02".repeat(32),
};

function request(view: string, cookie?: string) {
  return new Request(origin + "/api/dashboard?view=" + encodeURIComponent(view), {
    headers: cookie ? { Cookie: cookie } : {},
  });
}

function form(view: string, values: Record<string, string>, requestOrigin = origin, fetchSite?: string) {
  return new Request(origin + "/api/dashboard?view=" + view, {
    method: "POST",
    headers: { Origin: requestOrigin, ...(fetchSite ? { "Sec-Fetch-Site": fetchSite } : {}) },
    body: new URLSearchParams(values),
  });
}

describe("dashboard access", () => {
  beforeEach(() => {
    for (const [key, value] of Object.entries(config)) vi.stubEnv(key, value);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("protects dashboard views and snapshot data before authentication", async () => {
    for (const page of ["/dashboard", "/dashboard/hermes", "/dashboard/homelab"]) {
      const response = await GET(request(page));
      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe("/dashboard/login?next=" + encodeURIComponent(page));
    }
    const data = await GET(request("data"));
    expect(data.status).toBe(401);
    expect(data.headers.get("cache-control")).toContain("no-store");
  });

  it("accepts only the configured owner, rejects other origins, and limits redirect targets", async () => {
    expect((await POST(form("login", { username: "guest", password }))).status).toBe(401);
    expect((await POST(form("login", { username: "owner", password }, "https://other.test"))).status).toBe(403);
    const response = await POST(form("login", { username: "owner", password, next: "//other.test" }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/dashboard");
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect((await GET(request("/dashboard", cookie.split(";")[0]))).status).toBe(200);
  });

  it("accepts opaque form origins only when the browser confirms same-origin navigation", async () => {
    const credentials = { username: "owner", password };
    expect((await POST(form("login", credentials, "null"))).status).toBe(403);
    expect((await POST(form("login", credentials, "null", "same-site"))).status).toBe(403);
    expect((await POST(form("login", credentials, "null", "cross-site"))).status).toBe(403);
    expect((await POST(form("login", credentials, "https://other.test", "same-origin"))).status).toBe(403);
    expect((await POST(form("login", credentials, "null", "same-origin"))).status).toBe(303);
    expect((await GET(request("login"))).headers.get("referrer-policy")).toBe("same-origin");
  });

  it("rejects expired and modified sessions and clears the cookie on sign-out", async () => {
    const account = dashboardAccount(config)!;
    const now = Date.now();
    const cookie = createSession(account, now).split(";")[0];
    expect(readSession(request("data", cookie), account, now)).toBe(true);
    const altered = cookie.slice(0, -1) + (cookie.endsWith("A") ? "B" : "A");
    expect(readSession(request("data", altered), account, now)).toBe(false);
    expect(readSession(request("data", cookie), account, now + 8 * 60 * 60 * 1000)).toBe(false);
    const logout = await POST(form("logout", {}));
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
