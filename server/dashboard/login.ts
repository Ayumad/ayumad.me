export function loginPage(error = "", next = "/dashboard") {
  return '<!doctype html>' + `
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="color-scheme" content="dark">
  <link rel="icon" href="/favicon.svg">
  <title>Dashboard sign-in — Ayumad.me</title>
  <style>
    :root { color-scheme: dark; background: #080f10; color: #eef8f7; font-family: ui-monospace, monospace; }
    body { margin: 0; min-height: 100svh; display: grid; place-items: center; padding: 1rem; box-sizing: border-box; }
    main { width: min(100%, 27rem); box-sizing: border-box; border: 1px solid #47746e; background: #101c1d; padding: clamp(1rem, 5vw, 2rem); }
    h1 { font-size: clamp(1.5rem, 7vw, 2rem); }
    a { color: #8bf1e3; }
    form { display: grid; gap: .7rem; margin: 1.5rem 0; }
    input, button { font: inherit; min-height: 2.75rem; box-sizing: border-box; padding: .5rem; }
    input { width: 100%; border: 1px solid #799d97; background: #080f10; color: inherit; }
    button { background: #8bf1e3; color: #061312; border: 0; cursor: pointer; margin-top: .5rem; font-weight: bold; }
    :focus-visible { outline: 3px solid #f0d28b; outline-offset: 3px; }
    .error { color: #ffb6ab; }
  </style>
</head>
<body>
  <main>
    <a href="/">← Ayumad.me</a>
    <h1>Dashboard sign-in</h1>
    ${error ? '<p class="error" role="alert">' + error + '</p>' : ""}
    <form action="/dashboard/login" method="post">
      <input type="hidden" name="next" value="${next}">
      <label for="username">Username</label>
      <input id="username" name="username" autocomplete="username" autocapitalize="none" required maxlength="100">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256">
      <button type="submit">Sign in</button>
    </form>
  </main>
</body>
</html>`;
}
