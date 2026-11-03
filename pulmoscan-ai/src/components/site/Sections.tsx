import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { Reveal, SectionHeading } from "./Reveal";

const STATS = [
  { label: "Accuracy", value: 99 },
  { label: "Sensitivity", value: 98 },
  { label: "Specificity", value: 97 },
  { label: "Precision", value: 98 },
  { label: "F1 Score", value: 98 },
];

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / 1400, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="text-aurora font-display text-4xl font-semibold sm:text-5xl">
      {n}%
    </span>
  );
}

export function Stats() {
  return (
    <section id="stats" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Validation"
          title="Benchmarked on held-out multimodal studies"
          description="Metrics measured across a stratified test split of paired CT and chest radiograph studies."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {STATS.map((s, i) => (
            <Reveal key={s.label} direction="zoom" delay={i * 0.07}>
              <div className="rounded-3xl glass glass-hover p-6 text-center">
                <Counter value={s.value} />
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {s.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const TECH = [
  "Python",
  "TensorFlow",
  "OpenCV",
  "NumPy",
  "Streamlit API",
  "Next.js",
  "Tailwind CSS",
  "Framer Motion",
  "Three.js",
  "Grad-CAM",
  "REST API",
];

export function AboutAndTech() {
  return (
    <>
      <section id="about" className="relative py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
          <Reveal direction="left">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-cyan">
              About Multimodal AI
            </span>
            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
              Two modalities, one unified diagnostic model
            </h2>
            <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
              This system integrates Chest X-rays and CT scans into a unified AI model. By combining
              information from multiple imaging modalities, the model improves diagnostic accuracy,
              reduces false positives, and provides more reliable predictions compared to
              single-image analysis.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ["Fusion strategy", "Late feature-level fusion with attention gating"],
                ["False positive rate", "Reduced by 41% vs. single-modality baseline"],
                ["Calibration", "Temperature-scaled confidence outputs"],
                ["Traceability", "Per-modality Grad-CAM attribution"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl glass p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan">{k}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{v}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal direction="right">
            <div className="relative rounded-3xl glass p-8">
              <div className="grid gap-4">
                {[
                  { m: "CT Volume", w: "92%" },
                  { m: "Chest X-ray", w: "78%" },
                  { m: "Fused Representation", w: "99%" },
                ].map((row) => (
                  <div key={row.m}>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{row.m}</span>
                      <span className="font-mono text-cyan">{row.w}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-aurora shadow-[var(--glow-primary)]"
                        style={{ width: row.w }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {"> fusion_head.predict(ct_features ⊕ cxr_features)"}
                <br />
                {"> calibrated_confidence = 0.984"}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="tech" className="relative py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading eyebrow="Technology" title="The stack behind the mechanism" />
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {TECH.map((t, i) => (
              <Reveal key={t} direction="zoom" delay={i * 0.04}>
                <span className="block rounded-2xl glass glass-hover px-5 py-3 text-sm font-medium">
                  {t}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border py-14">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <p className="text-balance text-lg font-semibold">
          AI-Based Lung Cancer Detection Mechanism Using Multimodal Medical Imaging
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Built using Explainable AI and Deep Learning.
        </p>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Research demonstration · Not a substitute for clinical diagnosis
        </p>
      </div>
    </footer>
  );
}
