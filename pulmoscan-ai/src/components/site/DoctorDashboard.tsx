import { useState } from "react";
import { motion } from "motion/react";
import { Reveal, SectionHeading } from "./Reveal";

const HISTORY = [
  { date: "12 Mar 2026", study: "CT + CXR", result: "Normal", tone: "text-success" },
  { date: "04 Jul 2026", study: "CT + CXR", result: "Benign nodule", tone: "text-warning" },
  { date: "21 Jul 2026", study: "CT + CXR", result: "Early Stage", tone: "text-destructive" },
];

const QUEUE = [
  { id: "PT-2291", name: "A. Kapoor", conf: "98.4%", cls: "Early Stage" },
  { id: "PT-2288", name: "M. Silva", conf: "96.1%", cls: "Benign" },
  { id: "PT-2284", name: "R. Osei", conf: "99.2%", cls: "Normal" },
  { id: "PT-2280", name: "L. Chen", conf: "94.7%", cls: "Malignant" },
];

export function DoctorDashboard() {
  const [pos, setPos] = useState(52);

  return (
    <section id="dashboard" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Clinician Workspace"
          title="Doctor dashboard preview"
          description="Review queue, longitudinal patient history and a prior-vs-current comparison slider."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          <Reveal direction="left" className="lg:col-span-2">
            <div className="h-full rounded-3xl glass p-7">
              <h3 className="text-lg font-semibold">Review queue</h3>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="pb-3 font-normal">Patient</th>
                      <th className="pb-3 font-normal">ID</th>
                      <th className="pb-3 font-normal">Class</th>
                      <th className="pb-3 text-right font-normal">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUEUE.map((r) => (
                      <tr key={r.id} className="border-t border-border/60">
                        <td className="py-3">{r.name}</td>
                        <td className="py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                        <td className="py-3 text-cyan">{r.cls}</td>
                        <td className="py-3 text-right font-mono">{r.conf}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mt-8 text-lg font-semibold">Image comparison slider</h3>
              <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-2xl border border-border">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 45%, color-mix(in oklab, var(--muted-foreground) 45%, transparent), transparent 60%), var(--secondary)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: `inset(0 ${100 - pos}% 0 0)`,
                    background:
                      "radial-gradient(circle at 30% 45%, rgba(255,70,70,0.65), rgba(255,190,40,0.35) 25%, rgba(40,190,255,0.25) 45%, transparent 65%), var(--secondary)",
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-y-0 w-px bg-cyan shadow-[var(--glow-cyan)]"
                  style={{ left: `${pos}%` }}
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan backdrop-blur">
                  Grad-CAM
                </span>
                <span className="absolute bottom-3 right-3 rounded-full bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
                  Prior study
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={pos}
                  aria-label="Compare studies"
                  onChange={(e) => setPos(Number(e.target.value))}
                  className="absolute inset-0 size-full cursor-ew-resize opacity-0"
                />
              </div>
            </div>
          </Reveal>

          <Reveal direction="right">
            <div className="h-full rounded-3xl glass p-7">
              <h3 className="text-lg font-semibold">Patient history</h3>
              <ol className="relative mt-6 space-y-6 pl-6">
                <span
                  aria-hidden
                  className="absolute left-[5px] top-2 h-[calc(100%-1rem)] w-px bg-linear-to-b from-cyan to-violet opacity-60"
                />
                {HISTORY.map((h, i) => (
                  <motion.li
                    key={h.date}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.5 }}
                    className="relative"
                  >
                    <span className="absolute -left-6 top-1.5 size-2.5 rounded-full bg-cyan shadow-[var(--glow-cyan)]" />
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {h.date}
                    </p>
                    <p className={`text-sm font-semibold ${h.tone}`}>{h.result}</p>
                    <p className="text-xs text-muted-foreground">{h.study}</p>
                  </motion.li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
