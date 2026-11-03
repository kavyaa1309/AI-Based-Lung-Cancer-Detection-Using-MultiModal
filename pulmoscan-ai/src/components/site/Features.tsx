import { Brain, FileText, Flame, ScanSearch } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Multimodal Imaging",
    body: "Uses both Chest X-rays and CT scans for improved diagnosis.",
    tag: "Medical Scan",
  },
  {
    icon: Brain,
    title: "AI Detection",
    body: "Advanced Deep Learning automatically detects suspicious lung nodules and cancer patterns.",
    tag: "Artificial Intelligence",
  },
  {
    icon: Flame,
    title: "Explainable AI",
    body: "Visualize Grad-CAM heatmaps showing exactly where the AI detected abnormalities.",
    tag: "Heatmap",
  },
  {
    icon: FileText,
    title: "Clinical Report",
    body: "Generate confidence scores, severity prediction, recommendations and downloadable report.",
    tag: "Medical Report",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Core Capabilities"
          title="Built for radiology-grade decision support"
          description="Every module of the pipeline is designed around clinical interpretability — not just a prediction, but the evidence behind it."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} direction="up" delay={i * 0.08}>
              <article className="group relative h-full overflow-hidden rounded-3xl glass glass-hover p-6">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-aurora opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
                />
                <span className="grid size-12 place-items-center rounded-2xl border border-cyan/30 bg-cyan/10 text-cyan">
                  <f.icon className="size-5" />
                </span>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {f.tag}
                </p>
                <h3 className="mt-1.5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
