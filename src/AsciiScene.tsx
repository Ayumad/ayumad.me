import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { type RenderMode, useRenderMode } from "./renderMode";

export type AsciiSceneName =
  | "work"
  | "projects"
  | "systems"
  | "hermes"
  | "gear"
  | "writeups"
  | "now"
  | "about"
  | "contact";

interface Point {
  x: number;
  y: number;
}

const columns = 48;
const rows = 22;
const spinner = ["|", "/", "-", "\\"];

function createBuffer() {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => " "),
  );
}

type Buffer = ReturnType<typeof createBuffer>;

function put(buffer: Buffer, x: number, y: number, character: string) {
  if (x < 0 || x >= columns || y < 0 || y >= rows) return;
  buffer[y][x] = character;
}

function write(buffer: Buffer, x: number, y: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    put(buffer, x + index, y, value[index]);
  }
}

function line(
  buffer: Buffer,
  start: Point,
  end: Point,
  character = "·",
) {
  const deltaX = Math.abs(end.x - start.x);
  const deltaY = Math.abs(end.y - start.y);
  const stepX = start.x < end.x ? 1 : -1;
  const stepY = start.y < end.y ? 1 : -1;
  let error = deltaX - deltaY;
  let x = start.x;
  let y = start.y;

  while (true) {
    put(buffer, x, y, character);
    if (x === end.x && y === end.y) break;
    const doubledError = error * 2;
    if (doubledError > -deltaY) {
      error -= deltaY;
      x += stepX;
    }
    if (doubledError < deltaX) {
      error += deltaX;
      y += stepY;
    }
  }
}

function box(
  buffer: Buffer,
  left: number,
  top: number,
  right: number,
  bottom: number,
  label: string,
) {
  put(buffer, left, top, "┌");
  put(buffer, right, top, "┐");
  put(buffer, left, bottom, "└");
  put(buffer, right, bottom, "┘");

  for (let x = left + 1; x < right; x += 1) {
    put(buffer, x, top, "─");
    put(buffer, x, bottom, "─");
  }
  for (let y = top + 1; y < bottom; y += 1) {
    put(buffer, left, y, "│");
    put(buffer, right, y, "│");
  }

  write(
    buffer,
    left + Math.max(1, Math.floor((right - left - label.length) / 2)),
    Math.floor((top + bottom) / 2),
    label,
  );
}

function movingPoint(
  buffer: Buffer,
  start: Point,
  end: Point,
  progress: number,
  character = "●",
) {
  put(
    buffer,
    Math.round(start.x + (end.x - start.x) * progress),
    Math.round(start.y + (end.y - start.y) * progress),
    character,
  );
}

function addDither(buffer: Buffer, frame: number) {
  const offset = Math.floor(frame / 12);
  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < columns - 1; x += 1) {
      if (
        buffer[y][x] === " " &&
        (x * 7 + y * 11 + offset) % 53 === 0
      ) {
        put(buffer, x, y, ".");
      }
    }
  }
}

function renderWork(frame: number) {
  const buffer = createBuffer();
  const phase = frame * 0.18;
  const packet = (frame % 42) / 41;
  const load = Math.round(8 + (Math.sin(phase * 0.38) + 1) * 5);

  write(buffer, 2, 2, "NOTES");
  line(buffer, { x: 9, y: 2 }, { x: 24, y: 2 }, "─");
  put(buffer, 16, 2, ">");
  movingPoint(buffer, { x: 9, y: 2 }, { x: 24, y: 2 }, packet, "◆");
  write(buffer, 26, 2, "HERMES");
  write(buffer, 39, 2, "CLIENT");

  write(buffer, 2, 8, "HARDWARE");
  write(buffer, 10, 8, "[");
  for (let index = 0; index < 22; index += 1) {
    put(buffer, 11 + index, 8, index < load ? "█" : "░");
  }
  write(buffer, 33, 8, "]");
  write(buffer, 37, 8, `${Math.round((load / 22) * 100)}%`);

  write(buffer, 2, 14, "HEADPHONES");
  for (let x = 10; x < 45; x += 1) {
    const sample = Math.sin(x * 0.62 + phase);
    const y = 16 + Math.round(sample * 2.2);
    const previous = Math.sin((x - 1) * 0.62 + phase);
    put(buffer, x, y, sample > previous ? "/" : "\\");
  }
  line(buffer, { x: 10, y: 16 }, { x: 44, y: 16 }, "·");

  write(buffer, 2, 20, "AI · LAB · AUDIO · LINUX");
  write(buffer, 39, 20, "WORK");
  addDither(buffer, frame);
  return buffer;
}

function renderProjects(frame: number) {
  const buffer = createBuffer();
  const active = spinner[Math.floor(frame / 4) % spinner.length];
  const scanRow = 4 + (Math.floor(frame / 5) % 8) * 2;
  const entries = [
    ["NOW", "HERMES", active],
    ["NOW", "AYUMAD.ME", active],
    ["NOW", "RAG", active],
    ["PLAN", "VOICE", "○"],
    ["NOW", "HOMELAB", active],
    ["2024", "AUDIO VIS", "●"],
    ["2023", "OWLBOT", "●"],
    ["2023", "DELULUBOT", "●"],
  ];

  write(buffer, 2, 1, "YEAR");
  write(buffer, 10, 1, "PROJECT");
  write(buffer, 39, 1, "STATE");
  line(buffer, { x: 6, y: 3 }, { x: 6, y: 18 }, "│");

  entries.forEach(([year, project, state], index) => {
    const y = 4 + index * 2;
    put(buffer, 6, y, "├");
    line(buffer, { x: 7, y }, { x: 9, y }, "─");
    write(buffer, 1, y, year);
    write(buffer, 10, y, project);
    write(buffer, 41, y, state);
  });

  for (let x = 9; x < 39; x += 1) {
    if ((x + frame) % 3 === 0 && buffer[scanRow][x] === " ") {
      put(buffer, x, scanRow, "·");
    }
  }
  write(buffer, 2, 20, `ACTIVE 5 ${active}`);
  write(buffer, 34, 20, "ARCHIVE 3");
  addDither(buffer, frame);
  return buffer;
}

function renderSystems(frame: number) {
  const buffer = createBuffer();
  const forward = (frame % 60) / 59;
  const returnPath = 1 - forward;

  box(buffer, 1, 2, 15, 6, "KNOWLEDGE");
  box(buffer, 32, 2, 46, 6, "AI");
  box(buffer, 17, 16, 31, 20, "HARDWARE");
  box(buffer, 1, 16, 13, 20, "AUDIO");

  line(buffer, { x: 15, y: 4 }, { x: 32, y: 4 }, "─");
  line(buffer, { x: 39, y: 6 }, { x: 25, y: 16 }, "·");
  line(buffer, { x: 8, y: 6 }, { x: 21, y: 16 }, "·");
  line(buffer, { x: 13, y: 18 }, { x: 17, y: 18 }, "─");

  movingPoint(buffer, { x: 15, y: 4 }, { x: 32, y: 4 }, forward, "◆");
  movingPoint(buffer, { x: 39, y: 6 }, { x: 25, y: 16 }, forward, "●");
  movingPoint(buffer, { x: 8, y: 6 }, { x: 21, y: 16 }, returnPath, "○");

  write(buffer, 18, 3, "CONTEXT");
  write(buffer, 16, 10, "CONNECTED SYSTEMS");
  write(buffer, 2, 12, "VAULT");
  write(buffer, 38, 12, "TOOLS");
  addDither(buffer, frame);
  return buffer;
}

function renderHermes(frame: number) {
  const buffer = createBuffer();
  const packet = (frame % 60) / 59;
  const model = Math.floor(frame / 18) % 3;

  write(buffer, 2, 1, "HERMES / CONTROL PLANE");
  write(buffer, 39, 1, "LIVE");
  box(buffer, 1, 4, 14, 8, "MAC MINI");
  box(buffer, 18, 3, 31, 9, "HERMES");
  box(buffer, 35, 4, 46, 8, "MEMORY");

  line(buffer, { x: 14, y: 6 }, { x: 18, y: 6 }, "─");
  line(buffer, { x: 31, y: 6 }, { x: 35, y: 6 }, "─");
  movingPoint(buffer, { x: 14, y: 6 }, { x: 35, y: 6 }, packet, "◆");

  const jobs = [
    ["WORKFLOW", "REPEAT"],
    ["RETRIEVE", "GROUND"],
    ["CLIENT", "CONNECT"],
  ];
  jobs.forEach(([job, state], index) => {
    const x = 1 + index * 16;
    line(buffer, { x: 24, y: 9 }, { x: x + 5, y: 13 }, "·");
    write(buffer, x, 14, job);
    write(buffer, x, 15, state);
  });

  write(buffer, 2, 18, "ROUTE");
  const models = ["FAST", "DEEP", "LOCAL"];
  models.forEach((name, index) => {
    const x = 10 + index * 12;
    write(buffer, x, 18, name);
    if (index === model) {
      line(buffer, { x, y: 20 }, { x: Math.min(46, x + name.length - 1), y: 20 }, "━");
    }
  });
  write(buffer, 2, 20, "ONE BACKEND / MANY SURFACES");
  addDither(buffer, frame);
  return buffer;
}

function renderGear(frame: number) {
  const buffer = createBuffer();
  const categories = [
    ["COMPUTE", 10],
    ["AUDIO", 10],
    ["CAMERA", 5],
    ["GAMING", 5],
    ["MOBILE", 5],
  ] as const;
  const cursor = Math.floor(frame / 5) % categories.length;

  write(buffer, 2, 1, "LOADOUT / CURATED INVENTORY");
  write(buffer, 37, 1, "ACTIVE");
  write(buffer, 2, 3, "CATEGORY");
  write(buffer, 16, 3, "QTY");
  write(buffer, 21, 3, "DENSITY");

  categories.forEach(([category, count], index) => {
    const y = 6 + index * 3;
    const fill = Math.round((count / 11) * 21);
    write(buffer, 2, y, category);
    write(buffer, 16, y, String(count).padStart(2, "0"));
    put(buffer, 20, y, "[");
    for (let unit = 0; unit < 21; unit += 1) {
      put(buffer, 21 + unit, y, unit < fill ? "█" : "░");
    }
    put(buffer, 42, y, "]");
    put(buffer, 45, y, index === cursor ? "◆" : "·");
  });

  write(buffer, 2, 21, "35 SHOWN");
  write(buffer, 29, 21, "JUL 2026 SNAPSHOT");
  addDither(buffer, frame);
  return buffer;
}

function renderWriteups(frame: number) {
  const buffer = createBuffer();
  const cursor = spinner[Math.floor(frame / 5) % spinner.length];
  const entries = [
    ["01", "HERMES / MAC MINI", "2026"],
    ["02", "PUBLIC / PRIVATE VAULT", "2026"],
    ["03", "DESKTOP HEADPHONES", "2026"],
    ["04", "TWO BAZZITE PCS", "2026"],
  ];

  write(buffer, 2, 1, "PUBLIC BLOG");
  write(buffer, 35, 1, "04 ENTRIES");
  line(buffer, { x: 2, y: 3 }, { x: 45, y: 3 }, "─");

  entries.forEach(([index, title, year], row) => {
    const y = 6 + row * 4;
    write(buffer, 2, y, index);
    put(buffer, 6, y, "├");
    line(buffer, { x: 7, y }, { x: 10, y }, "─");
    write(buffer, 12, y, title);
    write(buffer, 42, y, year);
    line(buffer, { x: 12, y: y + 1 }, { x: 38, y: y + 1 }, "·");
    if (row === Math.floor(frame / 18) % entries.length) {
      put(buffer, 39, y + 1, cursor);
    }
  });

  write(buffer, 2, 21, "VAULT → EDIT → PUBLISH → LINK");
  addDither(buffer, frame);
  return buffer;
}

function renderNow(frame: number) {
  const buffer = createBuffer();
  const active = spinner[Math.floor(frame / 4) % spinner.length];
  const cursor = Math.floor(frame / 3) % 20;
  const tasks = [
    ["01", "HERMES", "BUILD"],
    ["02", "RAG", "CONNECT"],
    ["03", "BAZZITE", "CONFIG"],
    ["04", "HEADPHONES", "TUNE"],
    ["05", "AYUMAD.ME", "DESIGN"],
    ["06", "VOICE", "RESEARCH"],
  ];

  write(buffer, 2, 2, "PID");
  write(buffer, 8, 2, "TASK");
  write(buffer, 25, 2, "MODE");
  write(buffer, 42, 2, "RUN");
  line(buffer, { x: 1, y: 4 }, { x: 46, y: 4 }, "─");

  tasks.forEach(([pid, task, mode], index) => {
    const y = 6 + index * 2;
    write(buffer, 2, y, pid);
    write(buffer, 8, y, task);
    write(buffer, 25, y, mode);
    write(buffer, 43, y, active);
  });

  for (let index = 0; index < 20; index += 1) {
    put(buffer, 18 + index, 20, index === cursor ? "█" : "░");
  }
  write(buffer, 2, 20, "QUEUE");
  addDither(buffer, frame);
  return buffer;
}

function renderAbout(frame: number) {
  const buffer = createBuffer();
  const progress = (frame % 80) / 79;

  box(buffer, 1, 2, 14, 6, "EMULATORS");
  box(buffer, 18, 2, 31, 6, "FOOTHILL");
  box(buffer, 34, 2, 46, 6, "SJSU");
  line(buffer, { x: 14, y: 4 }, { x: 18, y: 4 }, "─");
  line(buffer, { x: 31, y: 4 }, { x: 34, y: 4 }, "─");
  movingPoint(buffer, { x: 14, y: 4 }, { x: 34, y: 4 }, progress, "◆");

  line(buffer, { x: 40, y: 6 }, { x: 24, y: 13 }, "·");
  line(buffer, { x: 7, y: 6 }, { x: 24, y: 13 }, "·");
  write(buffer, 19, 13, "[ BAY AREA ]");

  const interests = ["AI", "LINUX", "AUDIO", "HARDWARE"];
  interests.forEach((interest, index) => {
    const x = 1 + index * 12;
    line(buffer, { x: 24, y: 14 }, { x: x + 3, y: 18 }, "·");
    write(buffer, x, 19, interest);
    if ((Math.floor(frame / 8) + index) % interests.length === 0) {
      put(buffer, x + 3, 18, "●");
    }
  });

  addDither(buffer, frame);
  return buffer;
}

function renderContact(frame: number) {
  const buffer = createBuffer();
  const progress = (frame % 54) / 53;
  const pulse = Math.floor(frame / 6) % 4;

  box(buffer, 1, 8, 9, 14, "YOU");
  box(buffer, 31, 6, 46, 16, "AYUMAD");
  line(buffer, { x: 10, y: 11 }, { x: 30, y: 11 }, "─");
  put(buffer, 29, 11, ">");
  movingPoint(buffer, { x: 10, y: 11 }, { x: 30, y: 11 }, progress, "▣");

  write(buffer, 2, 2, "TX");
  write(buffer, 8, 2, `${String(Math.floor(frame / 4) % 10000).padStart(4, "0")}`);
  write(buffer, 31, 19, "hello@ayumad.me");

  for (let ring = 0; ring < pulse; ring += 1) {
    put(buffer, 29 - ring, 8 - ring, "/");
    put(buffer, 29 - ring, 14 + ring, "\\");
  }

  write(buffer, 2, 20, "MAIL · GITHUB · RESUME");
  write(buffer, 41, 20, progress > 0.88 ? "ACK" : "...");
  addDither(buffer, frame);
  return buffer;
}

const renderers: Record<AsciiSceneName, (frame: number) => Buffer> = {
  work: renderWork,
  projects: renderProjects,
  systems: renderSystems,
  hermes: renderHermes,
  gear: renderGear,
  writeups: renderWriteups,
  now: renderNow,
  about: renderAbout,
  contact: renderContact,
};

const labelCharacter = /[A-Za-z0-9@.%[\]]/;
const heavyCharacter = /[█▓◆●▣#@]/;
const mediumCharacter = /[▒+*=<>/\\|─│┌┐└┘├○]/;

function applyRenderMode(
  source: Buffer,
  frame: number,
  renderMode: RenderMode,
) {
  if (renderMode === "ascii") return source;

  if (renderMode === "glitch") {
    return source.map((row, y) => {
      const shifted = Array.from({ length: columns }, () => " ");
      const tick = Math.floor(frame / 2);
      const burst = frame % 79 >= 69;
      const isBand =
        (y * 17 + tick) % 47 < (burst ? 6 : 3) ||
        (burst && (y + tick) % 13 < 2);
      const offset = isBand
        ? (y + tick) % 2 === 0
          ? burst ? 5 : 3
          : burst ? -5 : -3
        : 0;

      row.forEach((character, x) => {
        const target = x + offset;
        if (target < 0 || target >= columns) return;
        const dropout =
          character !== " " &&
          (x * 23 + y * 37 + frame) % (burst ? 43 : 89) === 0;
        const corrupt =
          character !== " " &&
          !labelCharacter.test(character) &&
          (x * 17 + y * 31 + frame) % (burst ? 17 : 31) === 0;
        shifted[target] = dropout
          ? " "
          : corrupt
            ? ["<", ">", "#", "/", "\\", "░", "▓", "_"][
                (x + y + frame) % 8
              ]
            : character;
      });
      return shifted;
    });
  }

  return source.map((row, y) =>
    row.map((character, x) => {
      if (labelCharacter.test(character)) return character;

      if (renderMode === "dither") {
        if (heavyCharacter.test(character)) return "█";
        if (mediumCharacter.test(character)) {
          return (x * 5 + y * 3 + frame) % 4 < 2 ? "▓" : "▒";
        }
        if (character !== " ") return "░";
        return (x * 7 + y * 11 + Math.floor(frame / 3)) % 67 === 0
          ? "░"
          : " ";
      }

      if (renderMode === "particles") {
        if (heavyCharacter.test(character)) return "●";
        if (mediumCharacter.test(character)) return "•";
        if (character !== " ") return "·";
        return (x * 19 + y * 23 + Math.floor(frame / 2)) % 89 === 0
          ? "·"
          : " ";
      }

      if (renderMode === "crt") {
        if (heavyCharacter.test(character)) return "▓";
        if (character !== " ") return character;
        const previous = x > 0 ? row[x - 1] : " ";
        return previous !== " " &&
          !labelCharacter.test(previous) &&
          (x + y + frame) % 3 === 0
          ? "·"
          : " ";
      }

      return character;
    }),
  );
}

function renderScene(
  scene: AsciiSceneName,
  frame: number,
  renderMode: RenderMode,
) {
  return applyRenderMode(renderers[scene](frame), frame, renderMode)
    .map((row) => row.join(""))
    .join("\n");
}

export default function AsciiScene({
  scene,
  className = "",
}: {
  scene: AsciiSceneName;
  className?: string;
}) {
  const outputRef = useRef<HTMLPreElement>(null);
  const reducedMotion = useReducedMotion();
  const renderMode = useRenderMode();

  useEffect(() => {
    const output = outputRef.current;
    if (!output) return;

    let animationFrame = 0;
    let previousFrame = 0;
    let visible = !document.hidden;

    const render = (time: number) => {
      output.textContent = renderScene(
        scene,
        reducedMotion ? 0 : Math.floor(time / 80),
        renderMode,
      );
    };

    const draw = (time: number) => {
      if (time - previousFrame >= 80) {
        previousFrame = time;
        render(time);
      }
      if (visible) animationFrame = window.requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && !reducedMotion) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    render(reducedMotion ? 0 : performance.now());
    document.addEventListener("visibilitychange", onVisibility);

    if (!reducedMotion && visible) {
      animationFrame = window.requestAnimationFrame(draw);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion, renderMode, scene]);

  return (
    <pre
      ref={outputRef}
      className={className}
      data-ascii-scene={scene}
      data-render-mode={renderMode}
      aria-hidden="true"
    />
  );
}
