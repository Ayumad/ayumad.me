export function formatCurriculumPage(html, canonical) {
  return html
    .replace(/<link rel="canonical"[^>]*>\s*/i, "")
    .replace("</head>", '<link rel="canonical" href="' + canonical + '">\n</head>')
    .replace(/<table>[\s\S]*?<\/table>/g, (table) =>
      '<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable table">' + table + '</div>',
    );
}

export const curriculumAccessibilityCss = `
:root { --faint: #9d9c93; }
.md a { text-decoration: underline; text-underline-offset: .17em; }
.table-scroll { max-width: 100%; overflow-x: auto; }
.table-scroll table { margin-block: 0; }
:focus-visible { outline: 2px solid var(--phos); outline-offset: 3px; }
#ai-search:focus-visible { outline: 2px solid var(--phos); outline-offset: 2px; }
#ai-panel { right: 0; overflow-y: auto; }
@media (max-width: 640px) {
  .topbar { padding-inline: 10px; gap: 6px; }
  .tb-search { min-width: 0; max-width: none; }
  #ai-search { text-overflow: ellipsis; }
}
@media (prefers-reduced-motion: reduce) {
  .brand-dot { animation: none; }
}
`;
