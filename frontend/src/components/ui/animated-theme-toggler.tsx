import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";

import { cn } from "../../lib/utils";

export type TransitionVariant =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "rectangle"
  | "star";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
  variant?: TransitionVariant;
  /** When true, the transition expands from the viewport center instead of the button center. */
  fromCenter?: boolean;
  /**
   * Controlled theme value. When provided, the parent owns persistence
   * (e.g. `next-themes`) and this component will not write to localStorage.
   */
  theme?: "light" | "dark";
  /** Called on toggle. Pair with `theme` for controlled usage. */
  onThemeChange?: (theme: "light" | "dark") => void;
}

function polygonCollapsed(point: string, vertexCount: number): string {
  const pairs = Array.from({ length: vertexCount }, () => point).join(", ");
  return `polygon(${pairs})`;
}

function getThemeTransitionClipPaths(
  variant: TransitionVariant,
  cx: number,
  cy: number,
  maxRadius: number,
  viewportWidth: number,
  viewportHeight: number
): [string, string] {
  const toX = (x: number) => `${(x / viewportWidth) * 100}%`;
  const toY = (y: number) => `${(y / viewportHeight) * 100}%`;
  const point = (x: number, y: number) => `${toX(x)} ${toY(y)}`;
  const toRadius = (r: number) =>
    `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;

  switch (variant) {
    case "circle":
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ];
    case "square": {
      const halfW = Math.max(cx, viewportWidth - cx);
      const halfH = Math.max(cy, viewportHeight - cy);
      const halfSide = Math.max(halfW, halfH) * 1.05;
      const end = [
        point(cx - halfSide, cy - halfSide),
        point(cx + halfSide, cy - halfSide),
        point(cx + halfSide, cy + halfSide),
        point(cx - halfSide, cy + halfSide),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case "triangle": {
      const scale = maxRadius * 2.2;
      const dx = (Math.sqrt(3) / 2) * scale;
      const verts = [
        point(cx, cy - scale),
        point(cx + dx, cy + 0.5 * scale),
        point(cx - dx, cy + 0.5 * scale),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 3), `polygon(${verts})`];
    }
    case "diamond": {
      const R = maxRadius * Math.SQRT2;
      const end = [
        point(cx, cy - R),
        point(cx + R, cy),
        point(cx, cy + R),
        point(cx - R, cy),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case "hexagon": {
      const R = maxRadius * Math.SQRT2;
      const verts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        verts.push(point(cx + R * Math.cos(a), cy + R * Math.sin(a)));
      }
      return [polygonCollapsed(point(cx, cy), 6), `polygon(${verts.join(", ")})`];
    }
    case "rectangle": {
      const halfW = Math.max(cx, viewportWidth - cx);
      const halfH = Math.max(cy, viewportHeight - cy);
      const end = [
        point(cx - halfW, cy - halfH),
        point(cx + halfW, cy - halfH),
        point(cx + halfW, cy + halfH),
        point(cx - halfW, cy + halfH),
      ].join(", ");
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case "star": {
      const R = maxRadius * Math.SQRT2 * 1.03;
      const innerRatio = 0.42;
      const starPolygon = (radius: number) => {
        const verts: string[] = [];
        for (let i = 0; i < 5; i++) {
          const outerA = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          verts.push(
            point(cx + radius * Math.cos(outerA), cy + radius * Math.sin(outerA))
          );
          const innerA = outerA + Math.PI / 5;
          verts.push(
            point(
              cx + radius * innerRatio * Math.cos(innerA),
              cy + radius * innerRatio * Math.sin(innerA)
            )
          );
        }
        return `polygon(${verts.join(", ")})`;
      };
      const startR = Math.max(2, R * 0.025);
      return [starPolygon(startR), starPolygon(R)];
    }
    default:
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ];
  }
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  variant,
  fromCenter = false,
  theme,
  onThemeChange,
  ...props
}: AnimatedThemeTogglerProps) => {
  const shape = variant ?? "circle";
  const isControlled = theme !== undefined;
  const [internalIsDark, setInternalIsDark] = useState(false);
  const isDark = isControlled ? theme === "dark" : internalIsDark;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isTransitioningRef = useRef(false);
  const activeAnimRef = useRef<Animation | null>(null);

  const cancelAnim = useCallback(() => {
    activeAnimRef.current?.cancel();
    activeAnimRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cancelAnim();
      const root = document.documentElement;
      if ((root as HTMLElement).dataset.magicuiThemeVt !== "active") return;
      delete (root as HTMLElement).dataset.magicuiThemeVt;
      root.style.removeProperty("--magicui-theme-toggle-vt-duration");
      root.style.removeProperty("--magicui-theme-vt-clip-from");
    };
  }, [cancelAnim]);

  useEffect(() => {
    if (isControlled) return;

    const updateTheme = () => {
      setInternalIsDark(document.documentElement.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [isControlled]);

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current;
    if (
      !button ||
      isTransitioningRef.current ||
      (document.documentElement as HTMLElement).dataset.magicuiThemeVt === "active"
    )
      return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x: number;
    let y: number;
    if (fromCenter) {
      x = viewportWidth / 2;
      y = viewportHeight / 2;
    } else {
      const { top, left, width, height } = button.getBoundingClientRect();
      x = left + width / 2;
      y = top + height / 2;
    }

    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    );

    const applyTheme = () => {
      const newTheme = !isDark;
      try {
        document.documentElement.classList.toggle("dark");
        // Keep legacy light-mode class in sync for ECB glass styles
        if (newTheme) {
          document.documentElement.classList.remove("light-mode");
          document.body.classList.remove("light-mode");
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.add("light-mode");
          document.body.classList.add("light-mode");
          document.documentElement.style.colorScheme = 'light';
        }
      } catch (e) {
        console.error('Theme DOM toggle failed', e);
      }
      if (isControlled) {
        try {
          onThemeChange?.(newTheme ? "dark" : "light");
        } catch (e) { console.error(e); }
      } else {
        setInternalIsDark(newTheme);
        try {
          localStorage.setItem("theme", newTheme ? "dark" : "light");
          localStorage.setItem("ecb_theme", newTheme ? "dark" : "light");
        } catch {}
      }
    };

    const startViewTransition = (document as unknown as { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } }).startViewTransition;
    if (typeof startViewTransition !== "function") {
      applyTheme();
      return;
    }

    const clipPath = getThemeTransitionClipPaths(
      shape,
      x,
      y,
      maxRadius,
      viewportWidth,
      viewportHeight
    );

    const root = document.documentElement as HTMLElement;
    root.dataset.magicuiThemeVt = "active";
    root.style.setProperty(
      "--magicui-theme-toggle-vt-duration",
      `${duration}ms`
    );
    root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0]);
    const cleanup = () => {
      isTransitioningRef.current = false;
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty("--magicui-theme-toggle-vt-duration");
      root.style.removeProperty("--magicui-theme-vt-clip-from");
      cancelAnim();
    };

    isTransitioningRef.current = true;
    const transition = startViewTransition.call(document, () => {
      flushSync(applyTheme);
    });
    if (typeof (transition as unknown as { finished?: Promise<void> })?.finished?.finally === "function") {
      (transition.finished as Promise<void>).finally(cleanup).catch(() => {});
    } else {
      cleanup();
    }

    const ready = (transition as unknown as { ready?: Promise<void> })?.ready;
    if (ready && typeof ready.then === "function") {
      ready
        .then(() => {
          try {
            const anim = (document.documentElement as unknown as { animate: (k: unknown, o: unknown) => Animation }).animate(
              {
                clipPath,
              } as unknown as Record<string, unknown>,
              {
                duration,
                easing: shape === "star" ? "linear" : "ease-in-out",
                fill: "forwards",
                pseudoElement: "::view-transition-new(root)",
              }
            );
            activeAnimRef.current = anim;
          } catch (e) { console.warn('Theme animation failed', e); }
        })
        .catch(() => {});
    }
  }, [shape, fromCenter, duration, isDark, isControlled, onThemeChange, cancelAnim]);

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      aria-pressed={isDark}
      className={cn(
        "theme-toggler-btn inline-flex items-center justify-center rounded-full p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6366f1]",
        className
      )}
      aria-label={props['aria-label'] as string || "Toggle theme"}
      {...props}
      style={{ ...(props.style as React.CSSProperties), minWidth: (props.style as React.CSSProperties)?.minWidth || '42px', minHeight: (props.style as React.CSSProperties)?.minHeight || '42px' } as React.CSSProperties}
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" style={{ width: '20px', height: '20px', display: 'block', opacity: 1, visibility: 'visible' } as React.CSSProperties} strokeWidth={2.1} />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" style={{ width: '20px', height: '20px', display: 'block', opacity: 1, visibility: 'visible' } as React.CSSProperties} strokeWidth={2.1} />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
