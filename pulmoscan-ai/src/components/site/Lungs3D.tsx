import { motion } from "motion/react";
import { useState } from "react";

type Hotspot = { id: string; cx: number; cy: number; label: string; note: string };

const HOTSPOTS: Hotspot[] = [
  { id: "rul", cx: 88, cy: 96, label: "Right upper lobe", note: "Nodule density 12.4 HU above baseline" },
  { id: "lll", cx: 168, cy: 168, label: "Left lower lobe", note: "Texture uniform — no lesion signature" },
  { id: "hilum", cx: 128, cy: 138, label: "Hilar region", note: "Vascular pattern within normal range" },
];

/**
 * Interactive, rotating semi-transparent thorax with breathing, glowing lungs.
 * Built with layered SVG + CSS 3D so it stays lightweight and SSR-safe.
 */
export function Lungs3D() {
  const [active, setActive] = useState<Hotspot | null>(null);

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[520px] items-center justify-center">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-6 rounded-full bg-aurora opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 rounded-full border border-primary/20" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-8 rounded-full border border-dashed border-cyan/25"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />

      <div
        className="relative h-full w-full"
        style={{ perspective: "1100px" }}
        onMouseLeave={() => setActive(null)}
      >
        <div className="animate-spin-y h-full w-full" style={{ transformStyle: "preserve-3d" }}>
          <svg viewBox="0 0 256 256" className="h-full w-full drop-shadow-[0_0_40px_rgba(56,160,255,0.35)]">
            <defs>
              <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--violet)" stopOpacity="0.12" />
              </linearGradient>
              <radialGradient id="lungGrad" cx="50%" cy="35%" r="70%">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.95" />
                <stop offset="60%" stopColor="var(--primary)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="var(--violet)" stopOpacity="0.35" />
              </radialGradient>
              <filter id="lungGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* torso silhouette */}
            <path
              d="M128 22c15 0 24 8 26 20l4 20 30 14c14 6 20 16 21 30l6 78c1 16-6 26-20 30l-14 4-6 24c-2 10-10 14-22 14h-50c-12 0-20-4-22-14l-6-24-14-4c-14-4-21-14-20-30l6-78c1-14 7-24 21-30l30-14 4-20c2-12 11-20 26-20z"
              fill="url(#bodyGrad)"
              stroke="var(--cyan)"
              strokeOpacity="0.35"
              strokeWidth="1.2"
            />
            {/* rib scaffold */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path
                key={i}
                d={`M64 ${86 + i * 17} Q128 ${74 + i * 17} 192 ${86 + i * 17}`}
                fill="none"
                stroke="var(--primary)"
                strokeOpacity={0.18}
                strokeWidth="1.4"
              />
            ))}
            {/* spine */}
            <rect x="124" y="70" width="8" height="120" rx="4" fill="var(--primary)" fillOpacity="0.18" />

            {/* lungs */}
            <g filter="url(#lungGlow)" className="animate-breathe" style={{ transformOrigin: "128px 140px" }}>
              <path
                d="M120 74c-4-6-14-6-24 0-16 9-26 28-30 52-4 22-2 42 6 52 7 9 20 8 30 0 12-9 18-24 18-44z"
                fill="url(#lungGrad)"
                fillOpacity="0.75"
                stroke="var(--cyan)"
                strokeOpacity="0.7"
              />
              <path
                d="M136 74c4-6 14-6 24 0 16 9 26 28 30 52 4 22 2 42-6 52-7 9-20 8-30 0-12-9-18-24-18-44z"
                fill="url(#lungGrad)"
                fillOpacity="0.75"
                stroke="var(--cyan)"
                strokeOpacity="0.7"
              />
              {/* bronchi */}
              <path
                d="M128 62v26M128 88c-8 4-14 12-18 22M128 88c8 4 14 12 18 22"
                stroke="var(--cyan)"
                strokeOpacity="0.85"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />
            </g>

            {/* hotspots */}
            {HOTSPOTS.map((h) => (
              <g
                key={h.id}
                onMouseEnter={() => setActive(h)}
                className="cursor-pointer"
                style={{ pointerEvents: "auto" }}
              >
                <circle cx={h.cx} cy={h.cy} r="12" fill="var(--cyan)" fillOpacity="0.08" />
                <circle
                  cx={h.cx}
                  cy={h.cy}
                  r="4.5"
                  fill={h.id === "rul" ? "var(--warning)" : "var(--cyan)"}
                  className="animate-pulse-glow"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* scan sweep */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <div className="animate-scanline h-16 w-full bg-linear-to-b from-transparent via-cyan/25 to-transparent blur-sm" />
        </div>
      </div>

      <div className="absolute bottom-0 left-1/2 w-[86%] -translate-x-1/2 rounded-xl glass px-4 py-3 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
          {active ? active.label : "Hover lung hotspots"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {active ? active.note : "Live volumetric reconstruction · 512 slices"}
        </p>
      </div>
    </div>
  );
}
