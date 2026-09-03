---
title: Sketch·3D
slug: sketch3d
summary: A native iPad concept for turning Apple Pencil sketches into editable 3D forms.
stage: in-progress
status_note: Prototype · awaiting full iOS build
year: 2026
stack: SwiftUI, SceneKit, PencilKit, Apple Pencil, iPadOS
order: 5
---

## Problem

The fastest way to describe a form is often to draw it. Traditional 3D tools make that first gesture feel like a ceremony of cameras, primitives, and menus. Sketch·3D explores a more direct loop: draw a shape with Apple Pencil, choose how it should become volume, then keep iterating without losing the original stroke.

## Approach

The prototype is a native iPad app built around SwiftUI, SceneKit, and PencilKit. It treats the 2D stroke as a normalized data model rather than as a disposable bitmap. From that model, the app can explore extrusion, ribbon, and lathe-style conversions. The generated SceneKit geometry is non-destructive, so changing a parameter can regenerate the form instead of forcing a redraw from scratch.

## Architecture and workflow

PencilKit captures the gesture, a normalized stroke layer stores points and intent, and a geometry layer maps that representation into a SceneKit scene. Exporters are kept separate from editing so a future OBJ or image export cannot compromise the interactive model. The architecture leaves room for Apple Pencil Pro features, but those are capabilities to test on supported hardware rather than a promise that every feature is already available.

## Important decisions

Native frameworks are the point of the experiment. SwiftUI keeps the controls close to the platform, PencilKit preserves the quality of the input, and SceneKit offers a direct path to editable geometry. The project also keeps the app’s state explainable: an extrude is a choice applied to a stroke, not an opaque one-click AI result.

## Current result

The source is syntax-clean across the current Swift files and project configuration checks, but a full Xcode compile and TestFlight build are still pending. The app icon and device validation remain unfinished. This is a real prototype in progress, not a released iPad application.

## Lessons

Preserving the original gesture creates better creative affordances than flattening it early. It also makes debugging possible: when a mesh looks wrong, the input and transformation can be inspected independently.

## Next steps

The next milestone is an actual Xcode build on a supported environment, followed by Pencil input testing, geometry edge cases, and a small export loop. Those checks must pass before the project can be called shipped.

## Working detail

The normalized stroke model is the prototype’s most important seam. It lets the capture layer preserve the gesture while geometry experiments can change independently. An extrusion can use the same points as a ribbon or a lathe, and a future exporter can consume the resulting scene without needing to understand PencilKit’s view state. That makes iteration safer and keeps the app’s behavior explainable to a designer.

The current source also keeps platform capabilities honest. Pencil Pro support is a target for testing, not a feature to assume from an API name. SceneKit is a practical first geometry surface, but its limitations will inform whether a later renderer is necessary. The project’s documentation records those decisions alongside the syntax checks so a future build can start from evidence rather than memory.

Until Xcode compiles the target on a supported environment, the right status remains prototype. A clean parser run is valuable progress, but it is not a TestFlight artifact.

That distinction is especially important for a creative tool. A screenshot of a promising mesh can prove that an idea is visually interesting, but it cannot prove that strokes survive editing, that geometry handles edge cases, or that an export can be reopened. The next validation pass will treat those as separate outcomes and update the project status only when the complete loop is real.

That sequence also leaves room for learning from the platform. If SceneKit or PencilKit imposes a meaningful constraint, the prototype can record it before a renderer or input abstraction is replaced. The article will evolve with those tests.

The public status can then follow the evidence: prototype when the source is only syntax-checked, beta when the interaction loop is exercised, and shipped only when a real build and export path have been verified.

That evidence trail is part of the creative process. It lets the app stay playful at the surface while the underlying transformations remain testable and reversible.

The prototype is valuable precisely because it makes that loop visible.
