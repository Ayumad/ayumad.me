import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { renderModes, type RenderMode } from "./renderMode";

export function RendererMenu({
  renderMode,
  setRenderMode,
}: {
  renderMode: RenderMode;
  setRenderMode: (mode: RenderMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, renderModes.findIndex((mode) => mode.value === renderMode)),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(
    0,
    renderModes.findIndex((mode) => mode.value === renderMode),
  );

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  useEffect(() => {
    const closeFromOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnResize = () => setOpen(false);
    document.addEventListener("pointerdown", closeFromOutside);
    window.addEventListener("resize", closeOnResize);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      window.removeEventListener("resize", closeOnResize);
    };
  }, []);

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const choose = (mode: RenderMode) => {
    setRenderMode(mode);
    setOpen(false);
    window.requestAnimationFrame(() => buttonRef.current?.focus());
  };

  const handleButtonKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openAt(Math.min(renderModes.length - 1, selectedIndex + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openAt(Math.max(0, selectedIndex - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      openAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      openAt(renderModes.length - 1);
    }
  };

  const handleOptionKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index + 1) % renderModes.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index - 1 + renderModes.length) % renderModes.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(renderModes.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(renderModes[index].value);
    }
  };

  return (
    <div className="render-control" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="render-trigger"
        aria-label="Renderer"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="renderer-options"
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            openAt(selectedIndex);
          }
        }}
        onKeyDown={handleButtonKeyDown}
      >
        <span>{renderModes[selectedIndex].label}</span>
        <i aria-hidden="true">⌄</i>
      </button>
      {open ? (
        <div
          className="render-menu"
          id="renderer-options"
          role="listbox"
          aria-label="Visual renderer"
        >
          {renderModes.map((mode, index) => (
            <button
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              key={mode.value}
              type="button"
              role="option"
              aria-selected={mode.value === renderMode}
              className={mode.value === renderMode ? "is-selected" : ""}
              onClick={() => choose(mode.value)}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              <span>{String(index).padStart(2, "0")}</span>
              <strong>{mode.label}</strong>
              <i aria-hidden="true">{mode.value === renderMode ? "●" : "○"}</i>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
