import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Activity, Moon, Sun } from "lucide-react";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#detect", label: "Detection" },
  { href: "#stats", label: "Performance" },
  { href: "#tech", label: "Technology" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [light, setLight] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
  }, [light]);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 ${
          scrolled ? "glass" : "border border-transparent"
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-aurora text-primary-foreground glow-ring">
            <Activity className="size-4" />
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:block">
            PulmoScan <span className="text-cyan">AI</span>
          </span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-cyan"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Toggle color mode"
            onClick={() => setLight((v) => !v)}
            className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-cyan/50 hover:text-cyan"
          >
            {light ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <a
            href="#detect"
            className="rounded-xl bg-aurora px-4 py-2 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-[var(--glow-primary)]"
          >
            Start Detection
          </a>
        </div>
      </nav>
    </motion.header>
  );
}
