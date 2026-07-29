# XY / Vector — Standalone Renderer Blueprint

Version: 1.0  
Source renderer: Ayumad.me, July 29, 2026

## How to use this document

This file is a self-contained implementation specification for extracting the
interactive renderer from Ayumad.me and rebuilding it as a dedicated browser
instrument. It includes the current renderer's controls, 2D formulas, authored
3D scenes, character rasterizer, five rendering modes, audio engine, visual
system, architecture, tests, and a roadmap for expanding it into a more complete
tool.

To one-shot the new project:

1. Create an empty repository.
2. Copy this entire file into the repository.
3. Give a coding agent the prompt in the final section.
4. Keep this file in the new repository as the product and engineering source
   of truth.

The implementation agent may improve internal organization, but it must not
silently change the visible behavior, geometry, defaults, safety limits, or
design direction defined here.

---

## 1. Product

Build a focused audiovisual browser instrument called `XY / VECTOR`.

The product turns authored parametric curves and wireframe scenes into a live
character display. A user chooses a shape, switches between 2D and 3D, selects a
musical note, adjusts scale, motion, copy multiplication, and character
resolution, changes the rendering grammar, and can optionally hear the 2D X/Y
signal as stereo audio.

It should feel like:

- an oscilloscope;
- a TouchDesigner operator made into an instrument;
- a carefully configured Arch Linux desktop;
- a piece of signal-processing software from an alternate old internet;
- an artwork whose interface is part of the output.

It should not feel like:

- a startup landing page;
- a generic creative-coding playground;
- a rounded-card SaaS dashboard;
- a fake terminal full of hacker jokes;
- a collection of unrelated visual effects;
- an AI-generated cyberpunk image with controls placed over it.

The renderer itself is the hero. Keep prose outside the studio brief and
functional.

## 2. Scope

### Release 1: exact standalone parity

The first release must reproduce and isolate everything already working on the
Ayumad.me homepage:

- nine curated shapes;
- authored 2D geometry;
- authored 3D wireframes;
- A0 through A3 note selection;
- scale, motion, multiplier, and unit controls;
- pause, randomize, 2D/3D, and optional audio controls;
- ASCII, Dither, Glitch, Particles, and CRT+ modes;
- responsive character-grid rasterization;
- stereo Web Audio output, muted by default;
- visibility pausing and reduced-motion behavior;
- curated random variants that cannot produce illegible scenes.

### Release 2: dedicated-tool features

After parity is stable, add:

- named local presets;
- shareable URL state;
- text-frame, PNG, SVG, and preset JSON export;
- keyboard shortcuts;
- an optional advanced inspector with safe parameter ranges;
- animation recording;
- MIDI mapping;
- external audio visualization;
- performance work needed for higher resolutions and recording.

Release 2 must build on the same geometry and rendering core. Do not replace the
character renderer with an unrelated canvas effect.

### Explicit non-goals for Release 1

- no accounts;
- no database;
- no serverless functions;
- no analytics requirement;
- no cloud preset library;
- no OBJ, SVG, G-code, or laser output;
- no timeline editor;
- no live coding editor;
- no AI image generation;
- no WebGL dependency unless profiling proves the existing CPU renderer cannot
  meet its target;
- no exposed raw ratio, phase, form, or free rotation controls in the default
  interface.

## 3. Technical baseline

Use:

- React 19;
- Vite;
- TypeScript with strict checking;
- custom CSS variables and plain CSS;
- the Web Audio API;
- Vitest and React Testing Library;
- Playwright for high-value browser and visual-state tests.

Motion may use `motion/react` for interface transitions, but the signal clock,
character rasterizer, and 3D projection should use a single
`requestAnimationFrame` loop.

Keep the computational renderer independent from React:

```text
React controls
    ↓ RendererState
geometry-core
    ├── 2D curve sampler
    └── 3D scene sampler + projection
           ↓ line segments
raster-core
    ↓ intensity + direction fields
mode-converter
    ↓ character frame
<pre> display

RendererState
    ↓
audio-core
    ↓ X/Y periodic waves
Web Audio stereo output
```

Recommended source structure:

```text
src/
  app/
    App.tsx
    Studio.tsx
    ErrorBoundary.tsx
  renderer/
    types.ts
    constants.ts
    notes.ts
    presets.ts
    randomVariants.ts
    geometry2d.ts
    geometry3d.ts
    projection.ts
    raster.ts
    modes.ts
    renderLoop.ts
  audio/
    fourier.ts
    audioEngine.ts
  state/
    rendererStore.ts
    persistence.ts
    shareState.ts
  components/
    Scope.tsx
    ShapeStrip.tsx
    ControlRack.tsx
    ActionButtons.tsx
    ModeSelector.tsx
    PresetDrawer.tsx
  styles/
    tokens.css
    studio.css
    modes.css
    responsive.css
  test/
    geometry.test.ts
    raster.test.ts
    random.test.ts
    audio.test.ts
    Studio.test.tsx
e2e/
  studio.spec.ts
```

Do not put all rendering, audio, and UI logic into one React component in the
standalone version.

## 4. State model

Use these core types:

```ts
export type PresetId =
  | "wave"
  | "circle"
  | "triangle"
  | "square"
  | "star"
  | "hex"
  | "spiral"
  | "knot"
  | "orbit";

export type GeneratorId =
  | "wave"
  | "lissajous"
  | "spiral"
  | "star"
  | "polygon"
  | "orbit";

export type DimensionMode = "2d" | "3d";
export type RenderMode =
  | "ascii"
  | "dither"
  | "glitch"
  | "particles"
  | "crt";

export type RenderUnits = 48 | 72 | 96 | 120;
export type OctaveMultiplier = 0 | 1 | 2 | 3;

export interface RendererState {
  preset: PresetId;
  generator: GeneratorId;
  dimension: DimensionMode;
  renderMode: RenderMode;
  frequency: number;
  midi: number;
  xRatio: number;
  yRatio: number;
  phase: number;
  form: number;
  rotation: number;
  scale: number;
  motion: number;
  octave: OctaveMultiplier;
  copies: 1 | 2 | 4 | 8;
  units: RenderUnits;
  running: boolean;
  audioEnabled: boolean;
}

export interface Preset {
  id: PresetId;
  label: string;
  generator: GeneratorId;
  xRatio: number;
  yRatio: number;
  phaseDegrees: number;
  form: number;
  rotationDegrees: number;
  scale: number;
  motion: number;
}

export interface RandomVariant {
  preset: PresetId;
  scale: number;
  motion: number;
  octave: 0 | 1 | 2;
  units: 72 | 96 | 120;
}

export interface Point {
  x: number;
  y: number;
}

export interface Point3D extends Point {
  z: number;
}

export interface ProjectedPoint extends Point {
  depth: number;
}

export interface Curve3D {
  points: Point3D[];
}

export interface SpatialView {
  yaw: number;
  pitch: number;
  yawRate: number;
  pitchRate: number;
}
```

Derived values:

```ts
const copies = 2 ** octave as 1 | 2 | 4 | 8;
const phase = (phaseDegrees / 180) * Math.PI;
const rotation = (rotationDegrees / 180) * Math.PI;
```

### Persistence

Persist:

- render mode;
- theme;
- most recent safe studio state;
- locally named presets in Release 2.

Never restore audio as enabled. Every page load starts muted even if the rest of
the state is restored.

Use versioned storage keys so state can be migrated:

```text
xy-vector-theme-v1
xy-vector-renderer-v1
xy-vector-studio-v1
xy-vector-presets-v1
```

Validate parsed local state against the allowed union values and numeric ranges.
Invalid or outdated values fall back to the Star default.

## 5. Authored shape system

### Design rule

Every shape must first read as its standard, straight-on form. Motion should
move light around a 2D trace or rotate an authored 3D object; it must not warp a
circle, tilt a square, or randomize a star into noise.

Selecting a shape:

- resets its rotation clock;
- applies that shape's default scale and motion;
- restores its locked ratios, phase, form, and base rotation;
- keeps the current note;
- keeps the current multiplier;
- keeps the current unit count;
- keeps the current 2D/3D mode;
- keeps audio state.

### Preset definitions

```ts
export const presets: Preset[] = [
  {
    id: "wave",
    label: "WAVE",
    generator: "wave",
    xRatio: 2,
    yRatio: 1,
    phaseDegrees: 0,
    form: 0,
    rotationDegrees: 0,
    scale: 0.96,
    motion: 0.16,
  },
  {
    id: "circle",
    label: "CIRCLE",
    generator: "lissajous",
    xRatio: 1,
    yRatio: 1,
    phaseDegrees: 90,
    form: 0,
    rotationDegrees: 0,
    scale: 0.98,
    motion: 0.14,
  },
  {
    id: "triangle",
    label: "TRIANGLE",
    generator: "polygon",
    xRatio: 3,
    yRatio: 1,
    phaseDegrees: 0,
    form: 1,
    rotationDegrees: 0,
    scale: 0.98,
    motion: 0.12,
  },
  {
    id: "square",
    label: "SQUARE",
    generator: "polygon",
    xRatio: 4,
    yRatio: 1,
    phaseDegrees: 0,
    form: 1,
    rotationDegrees: 45,
    scale: 0.98,
    motion: 0.12,
  },
  {
    id: "star",
    label: "STAR",
    generator: "star",
    xRatio: 5,
    yRatio: 1,
    phaseDegrees: 0,
    form: 0.86,
    rotationDegrees: 0,
    scale: 0.96,
    motion: 0.16,
  },
  {
    id: "hex",
    label: "HEX",
    generator: "polygon",
    xRatio: 6,
    yRatio: 1,
    phaseDegrees: 0,
    form: 1,
    rotationDegrees: 0,
    scale: 0.96,
    motion: 0.12,
  },
  {
    id: "spiral",
    label: "SPIRAL",
    generator: "spiral",
    xRatio: 3,
    yRatio: 1,
    phaseDegrees: 0,
    form: 0,
    rotationDegrees: 0,
    scale: 0.96,
    motion: 0.18,
  },
  {
    id: "knot",
    label: "KNOT",
    generator: "lissajous",
    xRatio: 3,
    yRatio: 2,
    phaseDegrees: 90,
    form: 0,
    rotationDegrees: 0,
    scale: 0.94,
    motion: 0.2,
  },
  {
    id: "orbit",
    label: "ORBIT",
    generator: "orbit",
    xRatio: 5,
    yRatio: 3,
    phaseDegrees: 0,
    form: 0.93,
    rotationDegrees: 0,
    scale: 0.94,
    motion: 0.18,
  },
];
```

Default preset: `star`.

Do not restore the removed `Eight` or `Rose` presets. At character resolution,
especially with multiplication, their overlapping lobes collapse into dense
blocks. `Wave` replaces the misleading old `Line` name. `Hex` replaces the
overly broad old `Polygon` name.

## 6. 2D geometry

All 2D generators accept a local angle from `0` through `2π` and return
normalized coordinates near `[-1, 1]`.

### Utility functions

```ts
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

function harmonicSignal(angle: number, phase: number, form: number) {
  const harmonic = form * 0.38;
  return (
    Math.sin(angle + phase) +
    harmonic * Math.sin(angle * 2 - phase * 0.5)
  ) / (1 + harmonic);
}
```

Current Circle and Knot presets use `form = 0`, so they remain mathematically
clean Lissajous curves. The harmonic path exists for a future advanced
inspector; it is not part of the default controls.

### Wave

Use an open, two-cycle horizontal sine wave:

```ts
const progress = localTheta / (Math.PI * 2);
const x = progress * 2 - 1;
const y = Math.sin(progress * Math.PI * 2 * xRatio + phase) * 0.46;
```

The Wave preset uses `xRatio = 2`.

### Circle and Knot

Use Lissajous signals:

```ts
const x = harmonicSignal(localTheta * xRatio, 0, form);
const y = harmonicSignal(localTheta * yRatio, phase, form);
```

- Circle: ratio `1:1`, phase `90°`.
- Knot: ratio `3:2`, phase `90°`.

### Regular polygons

Do not generate polygons with independent sine waves. Interpolate exact
vertices:

```ts
function polygonPoint(theta: number, sides: number, form: number): Point {
  const count = Math.round(clamp(sides, 3, 9));
  const position = (theta / (Math.PI * 2)) * count;
  const vertex = Math.floor(position) % count;
  const amount = position - Math.floor(position);

  const getVertex = (index: number) => {
    const angle = index * Math.PI * 2 / count - Math.PI / 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  };

  const from = getVertex(vertex);
  const to = getVertex((vertex + 1) % count);
  const polygon = {
    x: mix(from.x, to.x, amount),
    y: mix(from.y, to.y, amount),
  };
  const circle = {
    x: Math.cos(theta - Math.PI / 2),
    y: Math.sin(theta - Math.PI / 2),
  };

  return {
    x: mix(circle.x, polygon.x, form),
    y: mix(circle.y, polygon.y, form),
  };
}
```

Use `form = 1` for exact Triangle, Square, and Hex shapes. Apply the Square
preset's locked `45°` base rotation after sampling so it is square to the
viewport rather than appearing as a diamond.

### Star

Build ten alternating radial vertices and interpolate the edges:

```ts
function starPoint(theta: number, points: number, form: number): Point {
  const count = Math.round(clamp(points, 3, 9));
  const vertexCount = count * 2;
  const position = theta / (Math.PI * 2) * vertexCount;
  const vertex = Math.floor(position) % vertexCount;
  const amount = position - Math.floor(position);

  const getVertex = (index: number) => {
    const angle = index * Math.PI / count - Math.PI / 2;
    const radius = index % 2 === 0 ? 1 : 1 - form * 0.72;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const from = getVertex(vertex);
  const to = getVertex((vertex + 1) % vertexCount);
  return {
    x: mix(from.x, to.x, amount),
    y: mix(from.y, to.y, amount),
  };
}
```

The Star preset uses five points and `form = 0.86`.

### Spiral

Use a three-turn Archimedean spiral:

```ts
const progress = localTheta / (Math.PI * 2);
const radius = 0.08 + progress * 0.84;
const angle =
  progress * Math.PI * 2 * xRatio - Math.PI / 2 + phase;
const x = Math.cos(angle) * radius;
const y = Math.sin(angle) * radius;
```

The Spiral preset uses `xRatio = 3`.

### Orbit

Use a normalized 5:3 hypotrochoid:

```ts
const outer = xRatio;
const inner = Math.min(yRatio, outer - 1);
const difference = outer - inner;
const distance = 0.2 + form * inner;
const denominator = difference + distance;

const x =
  (difference * Math.cos(inner * localTheta) +
    distance * Math.cos(difference * localTheta + phase)) /
  denominator;

const y =
  (difference * Math.sin(inner * localTheta) -
    distance * Math.sin(difference * localTheta + phase)) /
  denominator;
```

The Orbit preset uses `xRatio = 5`, `yRatio = 3`, and `form = 0.93`.

### Final 2D transform

After generating the authored point:

1. apply the preset's locked rotation;
2. apply the copy layout;
3. apply user scale.

```ts
const rotatedX = x * Math.cos(rotation) - y * Math.sin(rotation);
const rotatedY = x * Math.sin(rotation) + y * Math.cos(rotation);

return {
  x: (layout.center.x + rotatedX * layout.scale) * scale,
  y: (layout.center.y + rotatedY * layout.scale) * scale,
};
```

## 7. Multiplication

The multiplier is octave-based:

| Slider | Copies | Musical meaning |
| --- | ---: | --- |
| 0 | 1× | base path |
| 1 | 2× | +1 octave emphasis |
| 2 | 4× | +2 octave emphasis |
| 3 | 8× | +3 octave emphasis |

One signal period traverses every visible copy:

```ts
const normalizedTheta =
  ((theta / (Math.PI * 2)) % 1 + 1) % 1;
const copyPosition = normalizedTheta * copies;
const copyIndex = Math.min(copies - 1, Math.floor(copyPosition));
const localTheta =
  (copyPosition - Math.floor(copyPosition)) * Math.PI * 2;
```

Use fixed layouts:

```ts
function copyLayout(index: number, copies: number) {
  if (copies === 1) {
    return { center: { x: 0, y: 0 }, scale: 1 };
  }

  if (copies === 2) {
    return {
      center: { x: index === 0 ? -0.5 : 0.5, y: 0 },
      scale: 0.43,
    };
  }

  if (copies === 4) {
    return {
      center: {
        x: index % 2 === 0 ? -0.5 : 0.5,
        y: index < 2 ? -0.5 : 0.5,
      },
      scale: 0.4,
    };
  }

  const xPositions = [-0.72, -0.24, 0.24, 0.72];
  return {
    center: {
      x: xPositions[index % 4],
      y: index < 4 ? -0.5 : 0.5,
    },
    scale: 0.2,
  };
}
```

The trace must not draw a connector while jumping between copies. Treat a
sample-to-sample 2D distance greater than `0.55` as blanked flyback and skip
that segment.

Manual 8× remains available. Random never chooses it.

## 8. Musical frequency control

The selector spans three complete chromatic octaves from A0 through A3:

- A0: MIDI 21, `27.50 Hz`;
- A3: MIDI 57, `220.00 Hz`;
- 37 notes inclusive;
- one semitone per input step;
- default A1: `55.00 Hz`.

Generate values rather than hard-coding the table:

```ts
const noteNames = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
];

const notes = Array.from({ length: 37 }, (_, index) => {
  const midi = 21 + index;
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  return {
    midi,
    name: `${noteNames[midi % 12]}${Math.floor(midi / 12) - 1}`,
    frequency: Number(frequency.toFixed(2)),
  };
});
```

Use MIDI as the range input's value so pointer and keyboard changes always snap
to a real note. Show note and frequency together, for example
`E2 82.41`.

## 9. 3D scene system

### Principle

The 3D button does not apply a visual filter to the 2D shape. It switches to an
authored scene made of real 3D polylines, projects those lines with perspective,
and rasterizes the projected segments through the same character engine.

Every 3D counterpart should preserve the idea of its 2D preset:

| 2D shape | 3D counterpart |
| --- | --- |
| Wave | seven-rail wave surface |
| Circle | wide-section torus |
| Triangle | triangular pyramid |
| Square | cube |
| Star | extruded five-point star prism |
| Hex | extruded hexagonal prism |
| Spiral | three-rail vertical helix |
| Knot | three-strand 2:3 torus knot |
| Orbit | intersecting orbital cage and spiral |

### Scene helpers

```ts
function sampledCurve3D(
  samples: number,
  pointAt: (amount: number) => Point3D,
  closed = true,
): Curve3D {
  const pointCount = closed ? samples + 1 : samples;
  const divisor = closed ? samples : samples - 1;
  return {
    points: Array.from(
      { length: pointCount },
      (_, index) => pointAt(index / divisor),
    ),
  };
}
```

For prisms, generate a front face, back face, and one depth edge per vertex:

```ts
function prismScene(
  sides: number,
  radius: number,
  depth: number,
  innerRadius?: number,
): Curve3D[] {
  const vertexCount = innerRadius === undefined ? sides : sides * 2;
  const start = sides === 4 ? -Math.PI / 4 : -Math.PI / 2;
  const vertices = Array.from({ length: vertexCount }, (_, index) => {
    const angle = start + index * Math.PI * 2 / vertexCount;
    const vertexRadius =
      innerRadius !== undefined && index % 2 === 1
        ? innerRadius
        : radius;
    return {
      x: Math.cos(angle) * vertexRadius,
      y: Math.sin(angle) * vertexRadius,
    };
  });

  const face = (z: number): Curve3D => ({
    points: [
      ...vertices.map((point) => ({ ...point, z })),
      { ...vertices[0], z },
    ],
  });

  return [
    face(-depth),
    face(depth),
    ...vertices.map((point) => ({
      points: [
        { ...point, z: -depth },
        { ...point, z: depth },
      ],
    })),
  ];
}
```

### Wave scene

Create seven longitudinal rails and seventeen crossbars:

```ts
const wavePoint = (amount: number, strand: number): Point3D => {
  const phase = amount * Math.PI * 4;
  return {
    x: mix(-0.78, 0.78, amount),
    y: Math.sin(phase + strand * 0.16) * 0.25,
    z: strand * 0.105,
  };
};

const wave = [
  ...[-3, -2, -1, 0, 1, 2, 3].map((strand) =>
    sampledCurve3D(84, (amount) => wavePoint(amount, strand), false),
  ),
  ...Array.from({ length: 17 }, (_, index) => {
    const amount = index / 16;
    return {
      points: [wavePoint(amount, -3), wavePoint(amount, 3)],
    };
  }),
];
```

### Torus scene

Use a generous minor radius so the Circle's 3D counterpart visibly reads as a
donut instead of an edge-on ring:

```ts
const majorRadius = 0.48;
const minorRadius = 0.25;

const torusPoint = (u: number, v: number): Point3D => ({
  x: (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u),
  y: minorRadius * Math.sin(v),
  z: (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u),
});

const torus = [
  ...Array.from({ length: 6 }, (_, index) => {
    const v = index / 6 * Math.PI * 2;
    return sampledCurve3D(64, (amount) =>
      torusPoint(amount * Math.PI * 2, v),
    );
  }),
  ...Array.from({ length: 12 }, (_, index) => {
    const u = index / 12 * Math.PI * 2;
    return sampledCurve3D(28, (amount) =>
      torusPoint(u, amount * Math.PI * 2),
    );
  }),
];
```

### Pyramid scene

Use an equilateral base and one apex:

```ts
const base = Array.from({ length: 3 }, (_, index) => {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / 3;
  return {
    x: Math.cos(angle) * 0.62,
    y: -0.42,
    z: Math.sin(angle) * 0.62,
  };
});
const apex = { x: 0, y: 0.68, z: 0 };
const pyramid = [
  { points: [...base, base[0]] },
  ...base.map((point) => ({ points: [point, apex] })),
];
```

### Cube, star prism, and hex prism

```ts
const cube = prismScene(4, 0.68, 0.34);
const starPrism = prismScene(5, 0.7, 0.25, 0.31);
const hexPrism = prismScene(6, 0.7, 0.3);
```

### Helix scene

Build three rails and nineteen rungs:

```ts
const helixPoint = (amount: number, rail: number): Point3D => {
  const theta = amount * Math.PI * 6;
  const radius = 0.46 + rail * 0.035;
  return {
    x: Math.cos(theta) * radius,
    y: mix(-0.7, 0.7, amount),
    z: Math.sin(theta) * radius,
  };
};

const helix = [
  ...[-1, 0, 1].map((rail) =>
    sampledCurve3D(120, (amount) => helixPoint(amount, rail), false),
  ),
  ...Array.from({ length: 19 }, (_, index) => {
    const amount = index / 18;
    return {
      points: [helixPoint(amount, -1), helixPoint(amount, 1)],
    };
  }),
];
```

### Torus knot scene

Use three close strands so depth and rotation remain visible in a character
grid:

```ts
const knot = [-0.035, 0, 0.035].map((offset) =>
  sampledCurve3D(108, (amount) => {
    const theta = amount * Math.PI * 2;
    const minorRadius = 0.19 + offset;
    const ring = 0.49 + minorRadius * Math.cos(theta * 3);
    return {
      x: ring * Math.cos(theta * 2),
      y: minorRadius * Math.sin(theta * 3),
      z: ring * Math.sin(theta * 2),
    };
  }),
);
```

### Orbit scene

Use three tilted great-circle paths and one spatial spiral:

```ts
const orbitalCircle = (amount: number, tilt: number): Point3D => {
  const theta = amount * Math.PI * 2;
  return {
    x: Math.cos(theta) * 0.68,
    y: Math.sin(theta) * Math.cos(tilt) * 0.68,
    z: Math.sin(theta) * Math.sin(tilt) * 0.68,
  };
};

const orbit = [
  ...[0, Math.PI / 3, -Math.PI / 3].map((tilt) =>
    sampledCurve3D(72, (amount) => orbitalCircle(amount, tilt)),
  ),
  sampledCurve3D(108, (amount) => {
    const theta = amount * Math.PI * 2;
    return {
      x: Math.cos(theta * 3) * 0.58,
      y: Math.sin(theta) * 0.5,
      z: Math.sin(theta * 3) * 0.58,
    };
  }),
];
```

### Authored camera views

Each shape needs its own starting camera and two rotation rates. A generic
single-axis spin makes symmetrical objects look stationary.

```ts
export const spatialViews: Record<PresetId, SpatialView> = {
  wave:     { yaw: 0.68, pitch: -0.48, yawRate: 0.75, pitchRate: 0.22 },
  circle:   { yaw: 0.35, pitch: -0.68, yawRate: 0.55, pitchRate: 0.72 },
  triangle: { yaw: 0.72, pitch: -0.46, yawRate: 0.82, pitchRate: 0.34 },
  square:   { yaw: 0.70, pitch: -0.50, yawRate: 0.78, pitchRate: 0.31 },
  star:     { yaw: 0.58, pitch: -0.54, yawRate: 0.72, pitchRate: 0.28 },
  hex:      { yaw: 0.68, pitch: -0.48, yawRate: 0.76, pitchRate: 0.30 },
  spiral:   { yaw: 0.46, pitch: -0.26, yawRate: 0.88, pitchRate: 0.24 },
  knot:     { yaw: 0.52, pitch: -0.34, yawRate: 0.84, pitchRate: 0.27 },
  orbit:    { yaw: 0.44, pitch: -0.28, yawRate: 0.70, pitchRate: 0.40 },
};
```

Rotation:

```ts
const spin = elapsedSeconds * motion * 2.4;
const yaw = view.yaw + spin * view.yawRate;
const pitch = view.pitch + spin * view.pitchRate;
```

Reduced-motion mode sets elapsed time to zero and renders the fixed authored
view. Pause freezes elapsed time at the current rotation.

### Projection

Rotate around Y, then X, then use restrained perspective:

```ts
function projectPoint3D(
  point: Point3D,
  yaw: number,
  pitch: number,
): ProjectedPoint {
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);

  const rotatedX = point.x * cosYaw + point.z * sinYaw;
  const yawDepth = -point.x * sinYaw + point.z * cosYaw;
  const rotatedY = point.y * cosPitch - yawDepth * sinPitch;
  const depth = point.y * sinPitch + yawDepth * cosPitch;
  const perspective = 3.4 / (4 - depth);

  return {
    x: rotatedX * perspective * 1.08,
    y: rotatedY * perspective * 1.08,
    depth,
  };
}
```

Apply copy layout and user scale after projection. Use average segment depth to
brighten nearer lines:

```ts
const depthStrength = clamp((averageDepth + 0.8) / 1.6, 0, 1);
const strength =
  0.32 +
  depthStrength * 0.38 +
  traceTail * 0.32 +
  traceHead * 0.58;
```

Do not implement hidden-surface removal in Release 1. The visible back lines
are part of the wireframe language.

## 10. Character-grid rasterizer

### Display

Use one semantic `<pre>` for the generated frame. It is decorative output with
an adjacent accessible description. Keep the controls fully semantic and do
not attempt to make screen readers announce every changing character frame.

The stage has:

- a horizontal center axis;
- a vertical center axis;
- a small origin marker;
- a header with `XY / VECTOR`, dimension, shape, note, Hz, and multiplier;
- a footer with shape, dimension, units, scale, and octave.

### Grid sizing

Horizontal units are exact user choices:

```ts
const unitOptions = [48, 72, 96, 120] as const;
```

Given live stage width and height:

```ts
const columns = selectedUnits;
const fontSize = clamp((width / columns) * 1.58, 4.8, 22);
const rows = Math.round(
  clamp(height / (fontSize * 0.94), 16, 72),
);
```

Measure or model the actual character cell. A useful initial approximation is:

- cell width: `0.6em`;
- line height: `0.91`;
- horizontal correction:
  `min(1, physicalGridHeight / physicalGridWidth)`.

This correction is important: character cells are taller than they are wide.
Without it, a mathematical circle appears horizontally stretched.

Reserve one complete raster cell around the plot:

```ts
const plotHalfHeight = 0.5 - 1 / (rows - 1);
```

Use that safe half-axis for X and Y mapping. At `scale = 1`, extrema must remain
visible rather than being rounded outside the array. Track clipped samples in a
development-only counter or `data-clipped-samples` attribute.

### Fields

Maintain typed arrays sized `rows * columns`:

- current intensity;
- previous intensity for persistence;
- segment direction angle.

For each plotted sample:

- cap center intensity at `1.6`;
- cap the four direct neighbors at `0.7`;
- add roughly `strength * 0.22` to neighbors;
- retain the strongest direction for structural glyph selection.

Rasterize about `1,900` samples for 2D curves. For each source segment,
interpolate enough substeps to cover its distance in character cells so steep
or fast edges do not have gaps.

For 3D, rasterize every projected polyline segment. Copy multiplication applies
to the whole projected scene.

### Persistence

Before adding the new trace, multiply the previous intensity by:

| Mode | Decay |
| --- | ---: |
| ASCII | 0.72 |
| Dither | 0.64 |
| Glitch | 0.66 |
| Particles | 0.54 |
| CRT+ | 0.84 |

Clear persistence when:

- shape changes;
- 2D/3D changes;
- scale changes substantially;
- units change;
- random applies a new variant;
- stage dimensions change.

### Structural glyphs

Map segment angle to:

```ts
function structuralGlyph(angle: number, crossing: boolean) {
  if (crossing) return "+";
  const normalized = ((angle % Math.PI) + Math.PI) % Math.PI;
  if (normalized < Math.PI * 0.125 ||
      normalized >= Math.PI * 0.875) return "-";
  if (normalized < Math.PI * 0.375) return "\\";
  if (normalized < Math.PI * 0.625) return "|";
  return "/";
}
```

Use `+` when intensity is greater than `1.14`.

Density ramps:

```ts
const toneRamp = " .,:;+*#@";
const crtRamp = "  .:-=+*#@";
const ditherRamp = "  ░▒▓█";
const glitchRamp = "  .:;+=x#";
```

Ordered threshold matrix:

```ts
const bayer4 = [
   0,  8,  2, 10,
  12,  4, 14,  6,
   3, 11,  1,  9,
  15,  7, 13,  5,
];
```

### Frame clock

- render at approximately 20 FPS;
- keep the animation clock in `requestAnimationFrame`;
- produce a new character frame only when at least `50ms` has elapsed;
- cap a clock delta at `100ms` to avoid a large jump after stalls;
- only advance elapsed time while running;
- stop scheduling frames while the document is hidden;
- resume without adding the hidden interval;
- use `ResizeObserver` plus a window resize fallback.

## 11. Visible motion

Motion must be easy to see without changing the shape.

```ts
const motionHead =
  (elapsedSeconds * motion * 3.6) % (Math.PI * 2);

const headDistance = Math.abs(
  Math.atan2(
    Math.sin(progress - motionHead),
    Math.cos(progress - motionHead),
  ),
);

const trailDistance =
  ((motionHead - progress) % (Math.PI * 2) + Math.PI * 2) %
  (Math.PI * 2);

const traceHead = motion > 0
  ? Math.exp(-(headDistance * headDistance) / 0.035)
  : 0;

const traceTail = motion > 0
  ? Math.exp(-trailDistance * 1.25)
  : 0;
```

For 2D:

```ts
const strength = motion > 0
  ? 0.42 + traceTail * 0.46 + traceHead * 0.70
  : 0.62;
```

For 3D, combine the head and tail with depth as defined in the projection
section.

The outline stays fixed in 2D. Motion changes brightness only. In 3D, motion
changes both trace brightness and authored yaw/pitch rotation.

## 12. Rendering modes

Every mode shares one restrained CRT chassis across the entire interface: fine
scanlines, an edge vignette, a slow phosphor sweep, mild contrast/saturation,
and subtle cyan glyph bloom. The mode selector changes the character conversion
and adds a mode-specific surface treatment on top of that common display. It
must not hide controls or turn five modes into five unrelated color themes.

Expose the active mode on the document root:

```html
<html data-renderer="ascii">
```

### ASCII

Purpose: clearest vector structure.

- strong cells use direction glyphs;
- crossings use `+`;
- low intensity uses ` .,:;+*#@`;
- standard persistence is `0.72`;
- background uses a 104px technical grid;
- the shared CRT chassis supplies scanlines, vignette, sweep, and restrained
  cyan glow.

### Dither

Purpose: block-density rendering inspired by ASCII Magic and Pixtube.

For each cell:

```ts
const orderedThreshold =
  bayer4[(row % 4) * 4 + (column % 4)] / 15;
const level = clamp(
  intensity * 0.94 - orderedThreshold * 0.32,
  0,
  0.99,
);
const glyph =
  ditherRamp[Math.floor(level * ditherRamp.length)] ?? " ";
```

- use `░▒▓█`;
- reduce persistence to `0.64`;
- add a subtle four-pixel halftone field to the surrounding interface;
- use harder contrast;
- keep the shared scanlines and vignette while reducing broad text bloom.

### Glitch

Purpose: a distinct deterministic signal-failure system, not random
unreadability.

```ts
const tick = Math.floor(frameNumber / 2);
const burst = frameNumber % 79 >= 69;
const glitchBand =
  (row * 17 + tick) % 47 < (burst ? 7 : 3) ||
  (burst && (row + tick) % 13 < 2);

const offset = glitchBand
  ? (row + tick) % 2 === 0
    ? burst ? 6 : 3
    : burst ? -6 : -3
  : 0;

const sourceColumn = clamp(
  column + offset,
  0,
  columns - 1,
);
```

Use deterministic dropouts and corruption:

```ts
const dropout =
  intensity > 0.18 &&
  (row * 29 + column * 43 + frameNumber) %
    (burst ? 41 : 97) === 0;

const corrupt =
  intensity > 0.22 &&
  (row * 31 + column * 17 + frameNumber) %
    (burst ? 23 : 53) === 0;

const symbols = ["<", ">", "#", "/", "\\", "░", "▓", "_"];
```

- sharpen persistence to `0.66`;
- use the dedicated `  .:;+=x#` low-intensity ramp;
- split ambient and rendered glyphs into cyan/violet channels;
- use wider intermittent signal tears and thin deterministic dropout lines;
- fracture surface borders with hard cyan/violet inset offsets;
- add sparse vertical data columns to the background;
- increase the whole-route contrast and saturation while Glitch is active;
- never apply continuous transforms to control labels or body text;
- deterministic arithmetic replaces unconstrained randomness.

### Particles

Purpose: reduce the trace to moving point topology.

```ts
const gate = (row * 19 + column * 31 + frameNumber) % 7;

const glyph =
  intensity > 1.08
    ? "●"
    : intensity > 0.72
      ? gate < 5 ? "•" : " "
      : intensity > 0.34 && gate < 3
        ? "·"
        : " ";
```

- use `·`, `•`, and `●`;
- persistence is `0.54`;
- lighten surface fill around the stage;
- reduce background grid prominence;
- retain the shared scanlines, vignette, and phosphor sweep;
- do not add an unrelated canvas particle system over the trace.

### CRT+

Purpose: an overdriven version of the shared phosphor display.

- use the `  .:-=+*#@` ramp;
- persistence is `0.84`;
- strengthen the shared fine scanlines and vignette;
- add a subtle six-pixel cyan/violet aperture mask;
- increase bloom, contrast, saturation, and brightness modestly;
- run the phosphor sweep faster and brighter;
- preserve sharp controls outside the display;
- describe this honestly as a CSS post-process, not a physically accurate
  WebGL CRT shader.

### Mode accessibility

- the current mode has both a text label and selected state;
- all controls retain visible focus in every mode;
- filled active buttons use near-black foreground on cyan;
- unfilled active icons use cyan on the dark surface;
- text contrast must not depend on glow;
- reduced-motion disables animated glitch bands, particle gating, and the
  phosphor sweep but keeps a static mode-specific frame.

## 13. Curated random system

Random selects a complete authored variant. It never rolls every parameter
independently.

```ts
export const randomVariants: RandomVariant[] = [
  { preset: "wave",     scale: 0.96, motion: 0.14, octave: 0, units: 72 },
  { preset: "wave",     scale: 0.88, motion: 0.18, octave: 2, units: 120 },
  { preset: "circle",   scale: 0.96, motion: 0.14, octave: 0, units: 96 },
  { preset: "circle",   scale: 0.86, motion: 0.18, octave: 1, units: 120 },
  { preset: "triangle", scale: 0.98, motion: 0.12, octave: 0, units: 72 },
  { preset: "triangle", scale: 0.86, motion: 0.18, octave: 2, units: 120 },
  { preset: "square",   scale: 0.98, motion: 0.12, octave: 0, units: 72 },
  { preset: "square",   scale: 0.86, motion: 0.18, octave: 2, units: 120 },
  { preset: "star",     scale: 0.96, motion: 0.14, octave: 0, units: 96 },
  { preset: "star",     scale: 0.84, motion: 0.18, octave: 1, units: 96 },
  { preset: "hex",      scale: 0.96, motion: 0.12, octave: 0, units: 72 },
  { preset: "hex",      scale: 0.86, motion: 0.16, octave: 2, units: 120 },
  { preset: "spiral",   scale: 0.96, motion: 0.16, octave: 0, units: 96 },
  { preset: "spiral",   scale: 0.84, motion: 0.20, octave: 1, units: 120 },
  { preset: "knot",     scale: 0.94, motion: 0.18, octave: 0, units: 96 },
  { preset: "knot",     scale: 0.82, motion: 0.20, octave: 1, units: 120 },
  { preset: "orbit",    scale: 0.94, motion: 0.18, octave: 0, units: 96 },
  { preset: "orbit",    scale: 0.82, motion: 0.20, octave: 1, units: 120 },
];
```

Random:

- preserves the current note;
- preserves 2D/3D;
- preserves render mode;
- starts motion if paused;
- resets elapsed rotation;
- clears persistence;
- never selects 8×;
- limits Circle, Star, Spiral, Knot, and Orbit to 1× or 2×;
- permits Wave, Triangle, Square, and Hex at 4×;
- uses 120 units for every 4× result;
- uses at least 96 units for complex shapes.

If new shapes are added, they must ship with authored random variants and pass
the density tests before being eligible for Random.

## 14. Audio engine

### Behavior

- muted by default on every load;
- create no `AudioContext` before an explicit user gesture;
- enabling audio creates or resumes the graph;
- disabling audio fades out, then suspends the context;
- use a low master gain of `0.018`;
- fade in over about `80ms`;
- fade out over about `60ms`;
- if audio is unavailable, disable the button and expose an accessible status.

The 3D mode changes the display only. Audio always uses the selected shape's
authored 2D X/Y curve. This keeps the output periodic and meaningful instead of
trying to flatten an arbitrary camera projection into sound.

### Curve-to-audio conversion

Sample the complete current 2D signal path, including copy multiplication:

```ts
const audioSamples = 512;
const fourierHarmonics = 48;
```

For each of the X and Y arrays, calculate discrete Fourier coefficients:

```ts
for (let harmonic = 1; harmonic <= 48; harmonic += 1) {
  let realSum = 0;
  let imagSum = 0;

  for (let sample = 0; sample < 512; sample += 1) {
    const theta = sample / 512 * Math.PI * 2;
    const value = channelSamples[sample];
    realSum += value * Math.cos(harmonic * theta);
    imagSum += value * Math.sin(harmonic * theta);
  }

  real[harmonic] = realSum * 2 / 512;
  imag[harmonic] = imagSum * 2 / 512;
}
```

Create one `PeriodicWave` for X and one for Y. Use two oscillators at the same
selected base frequency:

```text
X Oscillator ───────────────→ ChannelMerger input 0 / left
Y Oscillator ───────────────→ ChannelMerger input 1 / right
ChannelMerger → GainNode → destination
```

Copy multiplication is already part of the sampled path. Traversing two, four,
or eight copies inside one period naturally adds octave-rich harmonic content;
do not fake it with a separate pitch-shift effect.

Rebuild periodic waves when:

- shape changes;
- scale changes;
- multiplier changes;
- safe advanced geometry changes in a later release.

Change oscillator frequency without rebuilding the waves when only the note
changes. Motion, units, render mode, and camera rotation must not affect audio.

Add a persistent warning in help text: start with system volume low. Do not play
audio on hover, page load, Random, or 2D/3D changes.

## 15. Interface

### Desktop layout

Use a single studio route and make the stage dominant:

```text
┌────────────────────────────────────────────────────────────────────┐
│ XY / VECTOR       MODE  THEME  PRESETS  EXPORT  HELP              │
├────────────────────────────────────────────────────────────────────┤
│ XY / VECTOR 3D                         STAR / A1 55 HZ / 1X         │
│                                                                    │
│                                                                    │
│                       CHARACTER STAGE                              │
│                                                                    │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ WAVE CIRCLE TRIANGLE SQUARE STAR HEX SPIRAL KNOT ORBIT            │
├──────────────┬──────────────┬──────────────┬──────────────┬────────┤
│ HZ           │ SCALE        │ MOTION       │ MULTIPLY     │ UNITS  │
├──────────┬──────────┬──────────┬──────────┬────────────────────────┤
│ 2D / 3D  │ RUN      │ RANDOM   │ AUDIO     │ STATUS                 │
└──────────┴──────────┴──────────┴──────────┴────────────────────────┘
```

The default viewport should show the full stage and the primary controls
without requiring a long marketing-page scroll.

### Mobile layout

- keep stage first;
- allow the shape strip to scroll horizontally;
- use two control columns, then one on narrow phones;
- keep action buttons at least 44px square;
- keep outputs visible beside sliders;
- never shrink stage text below `4.8px`;
- avoid horizontal document overflow;
- let the studio controls scroll while the page header stays compact;
- provide an optional full-screen stage button in Release 2.

### Primary controls

Use:

- one button for each of the nine shapes;
- 2D/3D toggle;
- Hz range;
- Scale range, `70–100%`, step `1%`;
- Motion range, `0–100%`, step `1%`;
- Multiply range, `1×/2×/4×/8×`;
- Units range, `48/72/96/120`;
- run/pause icon;
- randomize icon;
- audio on/off icon.

Buttons use icons where their meaning is standard, but keep accessible names and
native title tooltips. Do not replace shape names or control labels with
ambiguous symbols.

### Icon state rule

```css
.action {
  color: var(--cyan);
}

.action[aria-pressed="true"],
.action.is-filled {
  color: var(--ink);
  background: var(--cyan);
}
```

The filled-state rule must come after the shared action rule. Icons must never
be cyan on a cyan background.

### Labels

Use plain one- or two-word labels:

```text
Mode
Shape
Hz
Scale
Motion
Multiply
Units
2D
3D
Run
Pause
Random
Audio
Presets
Export
Help
```

Do not add fake diagnostics, edgy status copy, lore, command prompts, or an AI
persona.

## 16. Visual system

### Dark theme

```css
:root {
  --bg: #040707;
  --surface: #091011;
  --surface-2: #0e191a;
  --text: #e5f4f2;
  --soft: #9bb7b3;
  --muted: #627d79;
  --line: #294441;
  --fine: #142624;
  --cyan: #48efd0;
  --violet: #777fc4;
  --ink: #020606;
}
```

### Light theme

```css
[data-theme="light"] {
  --bg: #e6efed;
  --surface: #f3f8f7;
  --surface-2: #d4e2df;
  --text: #071311;
  --soft: #314b47;
  --muted: #5d7470;
  --line: #758e89;
  --fine: #c0d1ce;
  --cyan: #006f68;
  --violet: #50568d;
  --ink: #f4fffd;
}
```

### Style rules

- black and cyan define the product;
- violet is an occasional signal accent;
- use square corners and one-pixel rules;
- build the rack from visible grid cells;
- no glass panels;
- no rounded cards;
- no gradients that imitate generic AI artwork;
- no generated background image;
- no third-party artwork;
- use a system monospace stack for the instrument;
- use a readable sans-serif only for help and documentation;
- use scanlines, dither, density characters, and glow as functional render
  treatments;
- keep glow subtle enough that individual glyphs remain readable;
- let active cyan controls use a hard offset shadow rather than a soft card
  shadow;
- make focus outlines more visible than the surrounding one-pixel grid.

Suggested fonts:

```css
--mono:
  "SFMono-Regular", "Cascadia Code", "Roboto Mono", Consolas, monospace;
--sans:
  Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
```

The favicon and social preview should be deterministic, code-authored artwork
using a cyan character trace or `XY` monogram on near-black. Do not generate a
photographic or illustrated hero.

## 17. Accessibility

- include a skip link;
- use real `button`, `label`, `input`, `output`, and `select` elements;
- expose `aria-pressed` on toggles;
- provide `aria-valuetext` for the Hz and Units inputs;
- provide accessible names for every icon-only button;
- group shape buttons with `role="group"` and label `Shape`;
- describe the stage once instead of exposing its rapidly changing text;
- preserve keyboard operation for every slider;
- use a visible `:focus-visible` treatment;
- keep touch targets at least 44×44px;
- maintain sufficient text contrast without relying on cyan glow;
- announce export completion and audio-unavailable errors in a polite live
  region;
- honor `prefers-reduced-motion`;
- never autoplay audio;
- never flash large fields rapidly;
- keep Glitch displacement away from interface text.

## 18. Release 2 product expansion

### Preset system

Add a drawer containing:

- built-in authored presets;
- user presets stored locally;
- duplicate;
- rename;
- delete with confirmation;
- reset to authored default;
- import/export preset JSON.

Use a versioned schema:

```ts
interface SavedPresetV1 {
  version: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: Pick<
    RendererState,
    | "preset"
    | "dimension"
    | "renderMode"
    | "midi"
    | "scale"
    | "motion"
    | "octave"
    | "units"
  >;
}
```

Do not save `audioEnabled`.

### Shareable state

Serialize the same safe preset fields into compact URL query parameters. Parsing
the URL must pass through the same validation as local storage. Provide a
`Copy link` action.

Do not include hidden raw geometry parameters in shared URLs until the advanced
inspector has a stable, versioned schema.

### Export

Add:

1. `Frame.txt` — exact visible character frame.
2. `Frame.png` — stage with the selected post-process at a user-selected scale.
3. `Trace.svg` — clean vector paths without the character raster.
4. `Preset.json` — versioned safe state.
5. `Recording.webm` — later, after performance testing.

For SVG:

- export 2D sampled paths directly;
- export current projected 3D polylines from the current camera;
- preserve line separation;
- do not convert the screen's `<pre>` text to fake vector outlines.

For PNG, render the frame to an off-screen canvas using the same monospace font
metrics and CSS palette. Include an option for transparent background.

### Safe advanced inspector

Keep it collapsed by default. Its job is controlled experimentation, not
unbounded randomness.

Candidate controls:

- authored camera yaw and pitch within safe ranges;
- 3D rotation direction and speed;
- trace persistence;
- trace head width;
- trace tail length;
- audio gain with a conservative maximum;
- mode-specific threshold;
- background grid visibility;
- advanced ratio and phase only for shapes explicitly designed to accept them.

Every advanced control needs:

- a per-shape safe range;
- a visible value;
- a reset action;
- validation;
- compatibility with saved preset schema;
- a density/clipping test.

Do not put free `form`, `phase`, `ratio`, and `rotation` sliders back into the
primary rack.

### MIDI

Add Web MIDI as an optional enhancement:

- note-on changes the Hz selector;
- CC mappings can target Scale, Motion, Multiply, Units, and a safe advanced
  setting;
- learn mode requires explicit user action;
- show mappings clearly;
- save mappings locally;
- remain fully usable without MIDI permission.

### External audio visualization

Treat this as a separate input mode:

- request microphone or audio-file input explicitly;
- use `AnalyserNode` for waveform or spectrum data;
- never send audio to a server;
- show permission and input state;
- do not automatically feed microphone input to speakers;
- preserve the authored geometry studio as the default mode.

Possible visual mappings:

- amplitude to trace intensity;
- spectrum bands to 3D depth or rail displacement;
- beat envelope to scale pulse;
- stereo channels to X/Y displacement.

Avoid mapping every frequency bin directly to the character field without
smoothing; it recreates the noise problem the curated shape system solved.

### Recording and performance

For recording:

- render a synchronized canvas output rather than screen-capturing the DOM;
- choose a fixed output resolution and frame rate;
- use `MediaRecorder` for WebM where supported;
- keep audio inclusion opt-in;
- show duration and estimated memory;
- stop cleanly when the tab hides.

If profiling shows the main thread cannot sustain recording:

- move sampling and raster conversion into a Web Worker;
- use `OffscreenCanvas` for PNG/video preparation;
- transfer typed-array buffers;
- keep React state updates outside the frame loop;
- preserve the `<pre>` display for the interactive character view.

Do not introduce a WebGL engine merely because the product has a 3D button.

## 19. Validation

### Unit tests

Test:

- A0 is 27.50 Hz;
- A3 is 220.00 Hz;
- there are 37 notes;
- every note follows equal temperament;
- each preset resolves to the correct generator and locked parameters;
- Star is the default;
- Eight and Rose do not exist;
- every 2D shape remains inside normalized bounds;
- Circle is circular after cell-aspect correction;
- Triangle, Square, Star, and Hex close precisely;
- copy layouts return 1, 2, 4, and 8 non-overlapping positions;
- flyback segments are skipped;
- every 3D scene contains finite points and at least one valid curve;
- projection returns finite values at every authored camera;
- every random variant uses an allowed scale, motion, multiplier, and units;
- complex random variants never exceed 2×;
- random never selects 8×;
- all 4× random variants use 120 units;
- mode converters only emit glyphs from their allowed sets;
- persistence values match the mode table;
- saved-state parsing rejects invalid values;
- audio Fourier arrays contain 49 entries including the zero coefficient.

### Automated geometry matrix

For all nine shapes, render:

- 2D and 3D;
- 1×, 2×, 4×, and 8×;
- scale 70% and 100%;
- 48, 72, 96, and 120 units.

That is `9 × 2 × 4 × 2 × 4 = 576` deterministic states.

Assert:

- no exception;
- no `NaN` or infinite point;
- no horizontal document overflow;
- clipped-sample count remains zero at authored camera views;
- the frame contains a minimum amount of foreground;
- the frame does not exceed a maximum density threshold;
- multiplied copies remain separated;
- the stage output dimensions match the selected units.

Use snapshot tests selectively. Prefer numeric geometry, density, and clipping
assertions over 576 fragile full-text snapshots.

### Component tests

Test:

- shape selection restores that preset's scale and motion;
- note and multiplier survive a shape change;
- dimension survives Random;
- note survives Random;
- Random resumes motion;
- 3D resets the rotation clock;
- Pause freezes a frame;
- Run resumes it;
- reduced motion renders a static frame;
- changing Units recalculates rows;
- all icon buttons have names and pressed states;
- active icons remain visible on cyan;
- audio is off initially;
- no `AudioContext` exists before enabling audio;
- muting fades and suspends;
- 3D does not change audio geometry;
- render mode and theme persist;
- invalid persisted state falls back to Star.

### Browser tests

Test current Chromium, Firefox, and WebKit:

- phone, tablet, laptop, and wide desktop;
- keyboard-only control;
- shape strip scrolling;
- no document overflow;
- no clipping at scale 100%;
- visibility pause/resume;
- theme switching;
- all five modes;
- audio permission/error fallback;
- URL preset sharing once implemented;
- exports once implemented.

Target:

- Lighthouse Performance ≥ 90;
- Lighthouse Accessibility ≥ 95;
- no severe axe violations;
- stable 20 FPS character updates on a typical laptop;
- minimal idle work while paused or hidden.

## 20. Acceptance criteria

Release 1 is done when:

- the dedicated site opens directly into the studio;
- Star appears by default as a clear straight-on five-point character trace;
- all nine 2D shapes are standard and recognizable;
- all nine 3D counterparts are real authored geometry and visibly rotate;
- the Hz selector covers every semitone from A0 through A3;
- multiplication supports 1×, 2×, 4×, and 8×;
- Units supports 48, 72, 96, and 120;
- 100% scale does not clip any authored shape;
- Random produces only curated readable results;
- all five render modes change the trace itself while sharing the CRT chassis;
- optional stereo audio matches the 2D parametric path and starts muted;
- Pause and reduced-motion behavior are correct;
- every control works with mouse, touch, and keyboard;
- icons remain visible in selected states;
- the interface uses the defined black/cyan visual language;
- automated validation passes;
- the production build contains no secrets, external artwork, or unnecessary
  runtime services.

## 21. Implementation order

1. Scaffold React, Vite, TypeScript, linting, tests, and CSS tokens.
2. Implement typed notes, presets, derived state, and state validation.
3. Implement pure 2D geometry functions and their tests.
4. Implement copy layout, scale, flyback, and boundary tests.
5. Implement pure 3D scene builders, authored views, projection, and tests.
6. Implement the intensity/direction raster core.
7. Implement all five character conversion modes.
8. Build the frame clock, visibility behavior, resize handling, and reduced
   motion.
9. Build the stage and semantic controls.
10. Implement curated Random.
11. Implement lazy Web Audio, Fourier conversion, stereo routing, and mute
    behavior.
12. Apply responsive styling and mode-specific post-processing.
13. Add local persistence with audio excluded.
14. Run the full geometry matrix and browser tests.
15. Add metadata, deterministic favicon/social image, README, and deployment
    configuration.
16. Only after parity is stable, begin the Release 2 preset, share, and export
    work.

## 22. Copy-paste one-shot prompt

Copy this entire `renderer-plan.md` file into a new coding workspace, then send
the following:

```text
Build the complete standalone XY / VECTOR website specified in
renderer-plan.md. Treat that file as the authoritative product, visual,
interaction, geometry, audio, accessibility, testing, and architecture
specification.

Implement Release 1 completely. Use React 19, Vite, strict TypeScript, custom
CSS, the Web Audio API, Vitest/React Testing Library, and Playwright where
useful. Preserve every authored 2D formula, every 3D scene, the A0–A3 note
range, the curated Random bank, all four unit resolutions, all multiplier
layouts, and the ASCII, Dither, Glitch, Particles, and CRT+ conversion paths.

Do not substitute canned animation, images, a generic canvas effect, a 3D
library primitive showcase, Tailwind, a backend, or rounded SaaS styling. Do
not expose raw controls that can destroy shape legibility. The renderer must
start muted, honor reduced motion, pause while hidden, remain keyboard
accessible, and prevent clipping and noisy random results.

Build the real working application, not a mockup. Add tests for the geometry,
rasterizer, state, random guardrails, audio lifecycle, and primary
interactions. Run type checking, linting, tests, and the production build.
Document setup, architecture, controls, and the Release 2 roadmap in the new
repository README.

Make reasonable implementation decisions without asking for routine
clarification. Continue until the project is validated and ready to deploy.
```
