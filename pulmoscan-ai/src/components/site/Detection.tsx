import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Download,
  Maximize2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";
import { generateReportPdf } from "@/lib/report";

const STAGES = [
  "Loading Images...",
  "Preprocessing...",
  "Extracting Features...",
  "Combining Multimodal Features...",
  "Running Deep Learning Model...",
  "Generating Heatmap...",
  "Preparing Report...",
  "Complete.",
];

const API_URL: string = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8001";

type ApiRegion = { id: number; location: string; score: number };
type ApiImage = {
  cancer_probability: number;
  flagged: boolean;
  heatmap: string | null;
  regions: ApiRegion[];
};
type ApiResult = {
  label: "cancerous" | "non_cancerous";
  prediction: string;
  cancer_probability: number;
  confidence: number;
  regions: (ApiRegion & { modality: "ct" | "xray" })[];
  images: Partial<Record<"ct" | "xray", ApiImage>>;
  modalities: ("ct" | "xray")[];
  discordant: boolean;
};

const CANCER_RECOMMENDATIONS = [
  "Refer to a pulmonologist for contrast-enhanced CT within 2 weeks.",
  "Consider PET-CT to assess metabolic activity of the flagged nodule.",
  "Schedule follow-up imaging at 3 months if biopsy is deferred.",
  "Correlate findings with smoking history and occupational exposure.",
];

const NORMAL_RECOMMENDATIONS = [
  "No suspicious lesion was detected on this study — no immediate action is required from this scan.",
  "Continue routine screening according to clinical guidelines and individual risk factors (e.g. smoking history).",
  "Seek clinical review if symptoms such as persistent cough, coughing blood or unexplained weight loss develop.",
  "AI screening can miss lesions — a radiologist should confirm the result.",
];

function buildView(r: ApiResult) {
  const cancer = r.label === "cancerous";
  const p = r.cancer_probability;
  const mods = r.modalities.map((m) => (m === "ct" ? "CT scan" : "chest X-ray")).join(" and ");
  const places = Array.from(new Set(r.regions.map((g) => g.location)));
  const regionText = cancer ? (places.length ? places.join(" · ") : "Not localised") : "None";
  const severity = cancer ? (p >= 0.9 ? "High" : p >= 0.75 ? "Medium" : "Low") : "Low";
  const disagree = r.discordant
    ? " Note: the CT and X-ray results disagreed — please have a radiologist review both images."
    : "";
  const explanation = cancer
    ? `The AI flagged suspicious tissue${places.length ? ` in the ${places.join(" and ")}` : ""} on the ${mods}. The highlighted Grad-CAM regions mark the areas that most influenced the prediction and should be reviewed as possible nodules. Further clinical evaluation is recommended.${disagree}`
    : `The AI found no suspicious nodules or masses on the ${mods}. The study was classified as non-cancerous, so no region is highlighted.${disagree}`;
  return {
    cancer,
    prediction: r.prediction,
    confidence: r.confidence,
    cancerProb: p,
    regionText,
    severity,
    explanation,
    recommendations: cancer ? CANCER_RECOMMENDATIONS : NORMAL_RECOMMENDATIONS,
    probabilities: [
      { label: "Cancerous", value: Number((p * 100).toFixed(1)) },
      { label: "Non-Cancerous", value: Number(((1 - p) * 100).toFixed(1)) },
    ],
  };
}

async function requestAnalysis(images: { ct: string | null; xray: string | null }): Promise<ApiResult> {
  const form = new FormData();
  for (const slot of ["ct", "xray"] as const) {
    const dataUrl = images[slot];
    if (dataUrl) form.append(slot, await (await fetch(dataUrl)).blob(), `${slot}.img`);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/analyze`, { method: "POST", body: form });
  } catch {
    throw new Error(
      `Could not reach the analysis server at ${API_URL}. Start it with: cd backend && uvicorn app:app --port 8000`,
    );
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Analysis server error (${res.status}).`);
  }
  return (await res.json()) as ApiResult;
}

type Slot = "ct" | "xray";

function UploadTile({
  slot,
  label,
  hint,
  image,
  onFile,
  onRemove,
}: {
  slot: Slot;
  label: string;
  hint: string;
  image: string | null;
  onFile: (slot: Slot, dataUrl: string) => void;
  onRemove: (slot: Slot) => void;
    onFile: (slot: Slot, dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState(false);

  const read = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onFile(slot, String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        read(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed p-6 text-center transition-all ${
        drag ? "border-cyan bg-cyan/10" : "border-primary/30 bg-card/40 hover:border-cyan/60"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.dcm"
        className="hidden"
        onChange={(e) => read(e.target.files?.[0])}
      />
      {image ? (
        <>
          <img src={image} alt={`${label} preview`} className="absolute inset-0 size-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
          <div className="relative z-10 mt-auto flex w-full items-center justify-between gap-3">
            <div className="text-left">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">{label}</p>
              <p className="text-xs text-muted-foreground">Click to replace</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(slot);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-lg border border-red-400/40 bg-background/90 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="grid size-12 place-items-center rounded-2xl border border-cyan/30 bg-cyan/10 text-cyan transition-transform group-hover:scale-110">
            <Upload className="size-5" />
          </span>
          <p className="mt-4 text-sm font-semibold">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            JPG · PNG · JPEG · DICOM
          </p>
        </>
      )}
    </div>
  );
}

function HeatmapView({
  src,
  heat,
  label,
  overlay,
}: {
  src: string;
  heat: boolean;
  label: string;
  overlay?: string | null;
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl border border-border">
      <img src={src} alt={label} className="size-full object-cover" />
      {heat && overlay ? (
        <img
          src={overlay}
          alt=""
          className="pointer-events-none absolute inset-0 size-full object-cover"
        />
      ) : null}
      <span className="absolute left-3 top-3 rounded-full bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan backdrop-blur">
        {label}
      </span>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 62;
  const c = Math.PI * r;
  return (
    <svg viewBox="0 0 160 96" className="w-full max-w-[240px]">
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--cyan)" />
          <stop offset="55%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <path d="M18 86 A62 62 0 0 1 142 86" fill="none" stroke="var(--secondary)" strokeWidth="12" strokeLinecap="round" />
      <motion.path
        d="M18 86 A62 62 0 0 1 142 86"
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (value / 100) * c }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <text x="80" y="78" textAnchor="middle" className="fill-foreground font-display" fontSize="24" fontWeight="600">
        {value.toFixed(1)}%
      </text>
    </svg>
  );
}

export function Detection() {
  const [images, setImages] = useState<{ ct: string | null; xray: string | null }>({
    ct: null,
    xray: null,
  });
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [heat, setHeat] = useState(true);
  const [zoom, setZoom] = useState<{ src: string; overlay: string } | null>(null);
  const [patient, setPatient] = useState({ patientName: "", patientId: "", age: "", sex: "" });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const ready = Boolean(images.ct || images.xray);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const analyze = async () => {
    if (!ready) return;
    clearTimers();
    const id = ++runId.current;
    setError(null);
    setResult(null);
    setPhase("running");
    setStageIdx(0);
    setProgress(0);
    const last = STAGES.length - 1;
    STAGES.slice(0, last).forEach((_, i) => {
      timers.current.push(
        setTimeout(() => {
          setStageIdx(i);
          setProgress(Math.round(((i + 1) / STAGES.length) * 100));
        }, i * 900),
      );
    });
    const minWait = new Promise<void>((resolve) => {
      timers.current.push(setTimeout(resolve, last * 900));
    });
    try {
      const [res] = await Promise.all([requestAnalysis(images), minWait]);
      if (id !== runId.current) return;
      clearTimers();
      setResult(res);
      setStageIdx(last);
      setProgress(100);
      timers.current.push(setTimeout(() => setPhase("done"), 700));
    } catch (e) {
      if (id !== runId.current) return;
      clearTimers();
      setError(e instanceof Error ? e.message : "Analysis failed.");
      setPhase("error");
    }
  };

  const reset = () => {
    runId.current++;
    clearTimers();
    setImages({ ct: null, xray: null });
    setResult(null);
    setError(null);
    setPhase("idle");
    setProgress(0);
    setStageIdx(0);
  };

  const view = useMemo(() => (result ? buildView(result) : null), [result]);

  const speak = () => {
    if (!view || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(
      `Prediction: ${view.prediction}. Confidence ${view.confidence} percent. ${view.explanation}`,
    );
    u.rate = 0.98;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const severityTone = view
    ? view.severity === "High"
      ? "text-destructive"
      : view.severity === "Medium"
        ? "text-warning"
        : "text-success"
    : "";

  return (
    <section id="detect" className="relative py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 h-[380px] w-[700px] -translate-x-1/2 rounded-full bg-aurora opacity-[0.1] blur-[140px]"
      />
      <div className="relative mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="AI Detection"
          title="Upload a study and run the multimodal model"
          description="Drop a CT scan and a chest radiograph. The model fuses both modalities before producing a calibrated prediction."
        />

        <Reveal className="mt-14">
          <div className="rounded-[2rem] glass p-6 sm:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <UploadTile
                slot="ct"
                label="Upload CT Scan"
                hint="Drag & drop an axial CT slice or series export"
                image={images.ct}
                onFile={(s, d) => setImages((p) => ({ ...p, [s]: d }))}
onRemove={(slot) => {
  setImages((prev) => ({ ...prev, [slot]: null }));
  setResult(null);
  setError(null);
  setPhase("idle");
}}
              />
              <UploadTile
                slot="xray"
                label="Upload Chest X-ray"
                hint="Drag & drop a PA or AP chest radiograph"
                image={images.xray}
                onFile={(s, d) => setImages((p) => ({ ...p, [s]: d }))}
onRemove={(slot) => {
  setImages((prev) => ({ ...prev, [slot]: null }));
  setResult(null);
  setError(null);
  setPhase("idle");
}}
              />
            </div>

            
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={analyze}
                disabled={!ready || phase === "running"}
                className="inline-flex items-center gap-2 rounded-xl bg-aurora px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--glow-primary)] transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-40"
              >
                <Sparkles className="size-4" />
                Analyze Images
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-cyan/50 hover:text-cyan"
              >
                <RotateCcw className="size-4" />
                Reset
              </button>
            </div>

            <AnimatePresence>
              {phase === "running" ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 overflow-hidden"
                >
                  <div className="rounded-2xl border border-cyan/25 bg-cyan/5 p-6">
                    <div className="flex items-center gap-3">
                      <span className="size-2.5 rounded-full bg-cyan animate-pulse-glow" />
                      <p className="font-mono text-sm text-cyan">{STAGES[stageIdx]}</p>
                      <span className="ml-auto font-mono text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full bg-aurora"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                      />
                    </div>
                    <div className="mt-5 grid gap-1.5 sm:grid-cols-2">
                      {STAGES.map((s, i) => (
                        <p
                          key={s}
                          className={`font-mono text-[11px] transition-colors ${
                            i <= stageIdx ? "text-foreground/80" : "text-muted-foreground/40"
                          }`}
                        >
                          {i <= stageIdx ? "✓" : "·"} {s}
                        </p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {phase === "error" && error ? (
              <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-6">
                <p className="font-semibold text-destructive">Analysis failed</p>
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              </div>
            ) : null}
          </div>
        </Reveal>

        <AnimatePresence>
          {phase === "done" && view && result ? (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 space-y-6"
            >
              <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-3xl glass p-7">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Prediction
                  </p>
                  <h3
                    className={`mt-2 flex items-center gap-3 text-3xl font-semibold ${
                      view.cancer ? "text-destructive" : "text-success"
                    }`}
                  >
                    {view.cancer ? null : <ShieldCheck className="size-8" />}
                    {view.prediction}
                  </h3>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Suspected Region
                      </p>
                      <p className="mt-1 text-lg font-semibold text-cyan">{view.regionText}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Risk Level
                      </p>
                      <p className={`mt-1 text-lg font-semibold ${severityTone}`}>{view.severity}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Modalities Fused
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {[images.ct && "CT", images.xray && "X-ray"].filter(Boolean).join(" + ")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 space-y-3">
                    {view.probabilities.map((p, i) => (
                      <div key={p.label}>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{p.label}</span>
                          <span className="font-mono text-cyan">{p.value}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <motion.div
                            className="h-full rounded-full bg-aurora"
                            initial={{ width: 0 }}
                            animate={{ width: `${p.value}%` }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-3xl glass p-7 text-center">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Confidence Score
                  </p>
                  <Gauge value={view.confidence} />
                  <p className="mt-1 text-xs text-muted-foreground">Temperature-calibrated output</p>
                  <div className="mt-6 w-full">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Risk Meter
                    </p>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-linear-to-r from-success via-warning to-destructive">
                      <motion.div
                        className="h-full bg-background/70"
                        initial={{ marginLeft: "100%" }}
                        animate={{ marginLeft: `${Math.round(view.cancerProb * 100)}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl glass p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Grad-CAM Visualization</h3>
                  {view.cancer ? (
                    <button
                      type="button"
                      onClick={() => setHeat((v) => !v)}
                      className="rounded-xl border border-border px-4 py-2 text-xs font-medium transition-colors hover:border-cyan/50 hover:text-cyan"
                    >
                      {heat ? "Hide heatmap overlay" : "Show heatmap overlay"}
                    </button>
                  ) : null}
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { slot: "ct" as const, src: images.ct, o: "Original CT Scan", h: "CT · Grad-CAM", n: "CT · no region flagged" },
                    { slot: "xray" as const, src: images.xray, o: "Original Chest X-ray", h: "X-ray · Grad-CAM", n: "X-ray · no region flagged" },
                  ].flatMap(({ slot, src, o, h, n }) => {
                    if (!src) return [];
                    const overlay = result.images[slot]?.heatmap ?? null;
                    const tiles = [
                      <div key={o} className="group relative">
                        <HeatmapView src={src} heat={false} label={o} />
                      </div>,
                    ];
                    if (view.cancer) {
                      tiles.push(
                        <div key={h} className="group relative">
                          <HeatmapView src={src} heat={heat} overlay={overlay} label={overlay ? h : n} />
                          {overlay ? (
                            <button
                              type="button"
                              onClick={() => setZoom({ src, overlay })}
                              aria-label="Open fullscreen"
                              className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg bg-background/70 text-cyan opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                            >
                              <Maximize2 className="size-4" />
                            </button>
                          ) : null}
                        </div>,
                      );
                    }
                    return tiles;
                  })}
                </div>
                {view.cancer && result.regions.length ? (
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {result.regions.map((g) => (
                      <li key={`${g.modality}-${g.id}`} className="text-sm text-muted-foreground">
                        <span className="font-mono text-cyan">
                          {g.modality === "ct" ? "CT" : "X-ray"} · Region {g.id}
                        </span>{" "}
                        — {g.location} · model attention {(g.score * 100).toFixed(0)}%
                      </li>
                    ))}
                  </ul>
                ) : null}
                {view.cancer ? null : (
                  <p className="mt-4 text-sm text-success">
                    No suspicious region detected. The study appears non-cancerous, so nothing is highlighted.
                  </p>
                )}
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
                <div className="rounded-3xl glass p-7">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">AI Explanation</h3>
                    <button
                      type="button"
                      onClick={speak}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-medium transition-colors hover:border-cyan/50 hover:text-cyan"
                    >
                      <Volume2 className="size-4" /> Read aloud
                    </button>
                  </div>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{view.explanation}</p>
                  <h4 className="mt-6 text-sm font-semibold">Clinical Recommendations</h4>
                  <ul className="mt-3 space-y-2">
                    {view.recommendations.map((r) => (
                      <li key={r} className="flex gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col justify-between rounded-3xl glass p-7">
                  <div>
                    <h3 className="text-lg font-semibold">Clinical Report</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Export a PDF with patient details, uploaded images, prediction, confidence,
                      stage, recommendations and a doctor notes section.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      generateReportPdf({
                        ...patient,
                        prediction: view.prediction,
                        confidence: view.confidence,
                        stage: view.regionText,
                        severity: view.severity,
                        explanation: view.explanation,
                        recommendations: view.recommendations,
                        ctImage: images.ct,
                        xrayImage: images.xray,
                      })
                    }
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-aurora px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--glow-primary)] transition-transform hover:-translate-y-0.5"
                  >
                    <Download className="size-4" /> Download PDF Report
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {zoom ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(null)}
            className="fixed inset-0 z-[60] grid place-items-center bg-background/90 p-6 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              className="relative max-h-[85vh] w-full max-w-2xl"
            >
              <HeatmapView src={zoom.src} overlay={zoom.overlay} heat={heat} label="Grad-CAM · Fullscreen" />
              <button
                type="button"
                aria-label="Close"
                className="absolute -top-4 -right-4 grid size-10 place-items-center rounded-full bg-aurora text-primary-foreground"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
