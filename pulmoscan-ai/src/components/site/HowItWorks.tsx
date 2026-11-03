import { Reveal, SectionHeading } from "./Reveal";

const STEPS = [
  {
    n: "01",
    title: "Upload CT Scan or Chest X-ray",
    body: "Drop a study straight from the modality or PACS export.",
    items: ["JPG", "PNG", "JPEG", "DICOM"],
  },
  {
    n: "02",
    title: "Image Preprocessing",
    body: "Studies are standardised before they ever reach the network.",
    items: ["Resize", "Noise Reduction", "Normalization", "Contrast Enhancement"],
  },
  {
    n: "03",
    title: "Multimodal Deep Learning Analysis",
    body: "The AI extracts important medical features from CT scans and Chest X-rays and combines them to improve prediction accuracy.",
    items: ["CNN Encoders", "Feature Fusion", "Attention Pooling"],
  },
  {
    n: "04",
    title: "Cancer Classification",
    body: "A calibrated softmax head assigns the study to a clinical class.",
    items: ["Normal", "Benign", "Malignant", "Early Stage", "Advanced Stage"],
  },
  {
    n: "05",
    title: "Generate Results",
    body: "Everything a reviewing clinician needs, in one panel.",
    items: ["Prediction", "Confidence %", "Grad-CAM", "Medical Explanation", "Clinical Recommendation"],
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-aurora opacity-[0.08] blur-[130px]"
      />
      <div className="relative mx-auto max-w-4xl px-4">
        <SectionHeading
          eyebrow="Pipeline"
          title="How the detection mechanism works"
          description="Five deterministic stages, from raw upload to an explainable clinical report."
        />

        <ol className="relative mt-16 space-y-8 pl-8 sm:pl-14">
          <span
            aria-hidden
            className="absolute left-[13px] top-2 h-[calc(100%-1rem)] w-px bg-linear-to-b from-primary via-cyan to-violet opacity-50 sm:left-[27px]"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} direction={i % 2 ? "right" : "left"} delay={0.05 * i}>
              <li className="relative">
                <span className="absolute -left-8 top-5 grid size-7 place-items-center rounded-full border border-cyan/50 bg-background sm:-left-14">
                  <span className="size-2.5 rounded-full bg-cyan shadow-[var(--glow-cyan)] animate-pulse-glow" />
                </span>
                <div className="rounded-3xl glass glass-hover p-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-sm text-cyan">{s.n}</span>
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {s.items.map((it) => (
                      <span
                        key={it}
                        className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-[11px] tracking-wide text-foreground/80"
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
