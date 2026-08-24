// frontend/src/components/ECBKineticBrand.tsx
// Reusable navbar POC — Kinetic ECB with premium gradient + per-letter tooltip
// Uses shadcn/ui KineticText style (https://magicui.design/docs/components/kinetic-text)
// Requirements: no v2.2, E→Enterprise, C→Context, B→Brain, smooth transitions, premium feel

import React, { useState } from "react";
import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuroraText } from "@/components/ui/aurora-text";

type LetterMeta = {
  char: "E" | "C" | "B";
  label: string;
  accent: string; // for tooltip accent bar
};

const LETTERS: LetterMeta[] = [
  { char: "E", label: "Enterprise", accent: "#5ca8ff" },
  { char: "C", label: "Context", accent: "#9b7cff" },
  { char: "B", label: "Brain", accent: "#00f0ff" },
];

interface ECBKineticBrandProps {
  className?: string;
  showIcon?: boolean;
  showSublabel?: boolean;
  size?: "sm" | "md" | "lg";
  as?: "h1" | "h2" | "span" | "div";
}

/**
 * ECBKineticBrand — Premium kinetic ECB navbar element
 * - Kinetic font-weight animation on hover (Magic UI KineticText)
 * - Rich linear gradient via bg-clip-text
 * - Per-letter tooltip (Enterprise / Context / Brain)
 * - Smooth cubic-bezier transitions, sophisticated glow
 * - Reusable: drop into Sidebar, Header, or standalone Navbar
 */
export const ECBKineticBrand: React.FC<ECBKineticBrandProps> = ({
  className,
  showIcon = true,
  showSublabel = true,
  size = "md",
  as: Tag = "div",
}) => {
  const [active, setActive] = useState<LetterMeta | null>(null);

  const sizeMap = {
    sm: "text-[1.25rem] tracking-[-0.02em]",
    md: "text-[1.48rem] tracking-[-0.03em]",
    lg: "text-[1.95rem] tracking-[-0.04em]",
  }[size];

  return (
    <div
      className={cn(
        "group/brand relative flex items-center gap-2.5 select-none rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent px-2.5 py-2.5 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/[0.14] hover:from-white/[0.09] hover:via-white/[0.05] hover:shadow-[0_8px_32px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.09)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.28)] overflow-hidden",
        className
      )}
    >
      {/* premium glow backdrop */}
      <div className="pointer-events-none absolute -inset-[1px] -z-10 rounded-2xl bg-gradient-to-br from-[#5ca8ff]/18 via-[#7a6cff]/12 to-[#00f0ff]/16 opacity-0 blur-[12px] transition-opacity duration-700 group-hover/brand:opacity-100" />
      {/* subtle top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-60" />
      {/* shine sweep on hover */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-0 transition-opacity duration-700 group-hover/brand:opacity-100">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/brand:translate-x-full" />
      </div>

      {showIcon && (
        <div
          className="relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5ca8ff] via-[#7a6cff] to-[#00f0ff] shadow-[0_0_22px_rgba(92,168,255,0.45),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.22)] ring-1 ring-white/15 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/brand:scale-[1.04] group-hover/brand:rotate-[3deg] group-hover/brand:shadow-[0_0_28px_rgba(92,168,255,0.55),0_0_42px_rgba(124,58,237,0.22)]"
          style={{ width: size === "sm" ? 38 : size === "lg" ? 46 : 42, height: size === "sm" ? 38 : size === "lg" ? 46 : 42 }}
        >
          <BrainCircuit
            size={size === "sm" ? 18 : size === "lg" ? 24 : 21}
            color="#ffffff"
            strokeWidth={1.95}
            className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/brand:rotate-[-4deg] group-hover/brand:scale-105"
          />
          {/* inner highlight */}
          <div className="pointer-events-none absolute inset-[1px] rounded-[11px] bg-gradient-to-b from-white/22 to-transparent opacity-75" />
          {/* pulsating dot */}
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] ring-2 ring-[#0f172a] animate-pulse" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col items-center leading-none gap-0.5 text-center overflow-hidden">
        {/* Kinetic ECB — inline expand: hover E → Enterprise CB (pure Nostalgia weight + width morph) — centered middle, fit */}
        <Tag
          className={cn(
            "flex max-w-full items-center justify-center gap-[1px] overflow-hidden font-heading select-none text-center",
            sizeMap
          )}
          style={
            {
              "--hover-padding": "calc(1em / 12)",
              "--text-stroke-width": "calc(1em * 125 / 6000)",
            } as React.CSSProperties
          }
          aria-label="ECB — Enterprise Context Brain"
          onMouseLeave={() => setActive(null)}
        >
          <span className="flex max-w-full items-center justify-center gap-0 overflow-hidden font-bold">
            {LETTERS.map((m) => {
              const isActive = active?.char === m.char;
              const isDimmed = active !== null && !isActive;
              return (
                <span
                  key={m.char}
                  className="inline-flex max-w-full items-center overflow-hidden"
                  onMouseEnter={() => setActive(m)}
                  onFocus={() => setActive(m)}
                  onBlur={() => setActive(null)}
                  tabIndex={0}
                  aria-label={`${m.char} — ${m.label}`}
                >
                  {/* ECB — Bold AuroraText (shadcn/ui magicui) + kinetic hover morph */}
                  <AuroraText
                    colors={["#FF0080", "#7928CA", "#0070F3", "#38bdf8"]}
                    speed={1.2}
                    className={cn(
                      "inline-block shrink-0 font-black !text-[inherit] tracking-tighter",
                      "font-[800] [will-change:font-weight,-webkit-text-stroke-width,padding] [-webkit-text-stroke-color:transparent] [-webkit-text-stroke-width:var(--text-stroke-width)]",
                      "[transition:font-weight_1.25s_cubic-bezier(0.22,1,0.36,1),_-webkit-text-stroke-color_1.25s_cubic-bezier(0.22,1,0.36,1),padding_1.1s_cubic-bezier(0.22,1,0.36,1),filter_1.1s_cubic-bezier(0.22,1,0.36,1)]",
                      "hover:[padding-inline:var(--hover-padding)] hover:font-[900] hover:[-webkit-text-stroke-color:currentcolor] hover:[-webkit-text-stroke-width:calc(var(--text-stroke-width)*2)] hover:drop-shadow-[0_0_14px_rgba(92,168,255,0.45)]",
                      "has-[+span+span:hover]:font-[400] has-[+span:hover]:[padding-inline:var(--hover-padding)] has-[+span:hover]:font-[600] [:hover+&]:[padding-inline:var(--hover-padding)] [:hover+&]:font-[600] [:hover+span+&]:font-[400]",
                      "cursor-default outline-none focus-visible:font-[900] focus-visible:[padding-inline:var(--hover-padding)]",
                      isDimmed && "opacity-55"
                    )}
                  >
                    {m.char}
                  </AuroraText>
                  {/* Expandable suffix — slower, fits */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-block overflow-hidden whitespace-nowrap bg-gradient-to-br from-[#2563eb] via-[#7c3aed] to-[#06b6d4] bg-clip-text text-transparent dark:from-[#5ca8ff] dark:via-[#8b7cff] dark:to-[#00f0ff] [background-size:200%_100%]",
                      "text-[0.68em] font-[500] tracking-[-0.01em] will-change-[max-width,opacity,transform] [transition:max-width_1.35s_cubic-bezier(0.22,1,0.36,1),opacity_0.9s_cubic-bezier(0.22,1,0.36,1),margin_1s_cubic-bezier(0.22,1,0.36,1),transform_0.9s_cubic-bezier(0.22,1,0.36,1)]",
                      isActive ? "ml-[1px] max-w-[112px] opacity-100 translate-y-[0.5px]" : "max-w-0 opacity-0 -translate-x-1"
                    )}
                    style={{ fontWeight: isActive ? 600 : 500 }}
                  >
                    {m.label.slice(1)}
                  </span>
                </span>
              );
            })}
          </span>
          <span className="sr-only">ECB — Enterprise Context Brain</span>
        </Tag>

        {showSublabel && (
          <span className="mt-1 block max-w-full overflow-hidden whitespace-nowrap text-center text-[0.50rem] font-bold uppercase tracking-[0.11em] text-[#64748b] dark:text-white/65">
            Powered By{" "}
            <span className="bg-gradient-to-r from-[#5ca8ff] via-[#8b7cff] to-[#00f0ff] bg-clip-text font-extrabold text-transparent [background-size:200%_100%] animate-[ecbGradientShift_3.2s_ease_infinite]">
              Infoservices
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

export default ECBKineticBrand;
