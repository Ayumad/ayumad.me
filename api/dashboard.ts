import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSession, dashboardAccount, expiredSession, readSession, verifyPassword } from "../server/dashboard/auth.js";
import { loginPage } from "../server/dashboard/login.js";
import { dashboardDirectory, readSnapshot } from "../server/dashboard/snapshot.js";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

const routes = {
  "/dashboard": "overview.html",
  "/dashboard/hermes": "hermes.html",
  "/dashboard/homelab": "homelab.html",
} as const;

function pagePath(value: unknown) {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(routes, value)
    ? value as keyof typeof routes
    : "/dashboard";
}

function html(content: string, status = 200) {
  return new Response(content, { status, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
}

function redirect(location: string, session?: string) {
  return new Response(null, {
    status: 303,
    headers: { ...headers, Location: location, ...(session ? { "Set-Cookie": session } : {}) },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("view");
  const account = dashboardAccount();
  const signedIn = account && readSession(request, account);

  if (action === "data") {
    if (!signedIn) return Response.json({ error: "Sign in required." }, { status: 401, headers });
    const snapshot = await readSnapshot();
    if (!snapshot) return Response.json({ error: "Snapshot unavailable." }, { status: 503, headers });
    return new Response(snapshot, { headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
  }

  if (action === "login") {
    if (signedIn) return redirect(pagePath(url.searchParams.get("next")));
    return html(loginPage(account ? "" : "Sign-in is temporarily unavailable.", pagePath(url.searchParams.get("next"))), account ? 200 : 503);
  }

  const path = pagePath(action);
  if (!signedIn) return redirect("/dashboard/login?next=" + encodeURIComponent(path));
  return html(await readFile(join(dashboardDirectory, routes[path]), "utf8"));
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin !== url.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return new Response(null, { status: 403, headers });
  }

  const action = url.searchParams.get("view");
  if (action === "logout") return redirect("/dashboard/login", expiredSession);
  if (action !== "login") return new Response(null, { status: 405, headers });

  const account = dashboardAccount();
  if (!account) return html(loginPage("Sign-in is temporarily unavailable."), 503);
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded") ||
      Number(request.headers.get("content-length")) > 4096) {
    return new Response(null, { status: 400, headers });
  }

  const body = await request.text();
  if (body.length > 4096) return new Response(null, { status: 400, headers });
  const form = new URLSearchParams(body);
  const next = pagePath(form.get("next"));
  if (!await verifyPassword(account, form.get("username") ?? "", form.get("password") ?? "")) {
    return html(loginPage("The username or password is incorrect.", next), 401);
  }
  return redirect(next, createSession(account));
}
