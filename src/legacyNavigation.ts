export function migrateLegacyHash() {
  const hash = window.location.hash;
  if (!hash.startsWith("#/")) return;

  const oldPath = hash.slice(1).split("#")[0];
  let nextPath = oldPath;
  if (["/showcase", "/systems", "/now"].includes(oldPath)) nextPath = "/projects";
  if (oldPath === "/hermes") nextPath = "/projects/hermes-agent";
  if (oldPath === "/contact") nextPath = "/about#contact";
  if (oldPath === "/writeups" || oldPath === "/blog") nextPath = "/journal";
  if (oldPath.startsWith("/writeups/")) nextPath = oldPath.replace("/writeups/", "/journal/");

  window.history.replaceState({}, "", nextPath);
}
