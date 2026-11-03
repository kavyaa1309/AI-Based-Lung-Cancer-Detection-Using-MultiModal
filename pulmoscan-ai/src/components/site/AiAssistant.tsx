import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Send, X } from "lucide-react";

type Msg = { role: "ai" | "user"; text: string };

const CANNED: { match: RegExp; reply: string }[] = [
  {
    match: /grad-?cam|heatmap/i,
    reply:
      "Grad-CAM highlights the pixels that most influenced the classification. Warm regions in the overlay are the areas the network weighted highest — usually nodule margins and density changes.",
  },
  {
    match: /dicom|upload|format/i,
    reply: "You can upload JPG, PNG, JPEG or DICOM files for both the CT scan and the chest X-ray.",
  },
  {
    match: /accuracy|confidence|metric/i,
    reply:
      "On the held-out multimodal split the model reaches 99% accuracy, 98% sensitivity and 97% specificity, with temperature-scaled confidence outputs.",
  },
  {
    match: /report|pdf/i,
    reply:
      "After analysis, click Download PDF Report. It includes patient details, prediction, confidence, stage, recommendations and a doctor notes section.",
  },
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hi — I'm the PulmoScan assistant. Ask me about the pipeline, Grad-CAM, or reports." },
  ]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    const hit = CANNED.find((c) => c.match.test(q));
    setMsgs((m) => [
      ...m,
      { role: "user", text: q },
      {
        role: "ai",
        text:
          hit?.reply ??
          "This demo assistant covers uploads, preprocessing, multimodal fusion, Grad-CAM explainability and report export. Try asking about one of those.",
      },
    ]);
    setInput("");
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI assistant"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-2xl bg-aurora text-primary-foreground shadow-[var(--glow-primary)]"
      >
        {open ? <X className="size-5" /> : <Bot className="size-5" />}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-50 flex h-[420px] w-[min(92vw,360px)] flex-col overflow-hidden rounded-3xl glass"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="size-2 rounded-full bg-success animate-pulse-glow" />
              <p className="text-sm font-semibold">PulmoScan Assistant</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "ai"
                      ? "border border-border bg-secondary/60 text-foreground"
                      : "ml-auto bg-aurora text-primary-foreground"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about the AI pipeline…"
                className="flex-1 rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-cyan/60"
              />
              <button
                type="button"
                onClick={send}
                aria-label="Send message"
                className="grid size-9 place-items-center rounded-xl bg-aurora text-primary-foreground"
              >
                <Send className="size-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
