import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowRight, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { NeuralBackground } from "./NeuralBackground";
import { Lungs3D } from "./Lungs3D";

export function Hero() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setParallax({
        x: (e.clientX / window.innerWidth - 0.5) * 24,
        y: (e.clientY / window.innerHeight - 0.5) * 24,
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="absolute inset-0 grid-fade" aria-hidden />
      <NeuralBackground />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-aurora opacity-[0.14] blur-[120px]"
      />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-4 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ transform: `translate3d(${parallax.x * -0.4}px, ${parallax.y * -0.4}px, 0)` }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">
            <Sparkles className="size-3.5" /> Multimodal Diagnostic Intelligence
          </span>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.06] sm:text-5xl lg:text-[3.55rem]">
            AI-Based Lung Cancer Detection Mechanism
            <span className="block text-aurora">Using Multimodal Medical Imaging</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            An intelligent deep learning system that combines Chest X-rays and CT scans for accurate
            lung cancer detection with explainable AI (Grad-CAM), confidence analysis, and clinical
            report generation.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#detect"
              className="group inline-flex items-center gap-2 rounded-xl bg-aurora px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--glow-primary)] transition-transform hover:-translate-y-0.5"
            >
              Start Detection
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-cyan/50 hover:text-cyan"
            >
              Learn More
            </a>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4">
            {[
              { icon: ScanLine, k: "Modalities", v: "CT + X-ray" },
              { icon: Sparkles, k: "Accuracy", v: "99.0%" },
              { icon: ShieldCheck, k: "Explainability", v: "Grad-CAM" },
            ].map(({ icon: Icon, k, v }) => (
              <div key={k} className="rounded-2xl glass px-4 py-3">
                <Icon className="size-4 text-cyan" />
                <dt className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {k}
                </dt>
                <dd className="text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` }}
          className="animate-float-slow"
        >
          <Lungs3D />
        </motion.div>
      </div>
    </section>
  );
}
