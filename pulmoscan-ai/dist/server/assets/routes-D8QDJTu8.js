import { useEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Activity, ArrowRight, Bot, Brain, CalendarDays, Download, FileText, Flame, IdCard, Maximize2, Moon, RotateCcw, ScanLine, ScanSearch, Send, ShieldCheck, Sparkles, Sun, Upload, UserRound, Volume2, X } from "lucide-react";
import { jsPDF } from "jspdf";
//#region src/components/site/SiteNav.tsx
var LINKS = [
	{
		href: "#features",
		label: "Features"
	},
	{
		href: "#how",
		label: "How it works"
	},
	{
		href: "#detect",
		label: "Detection"
	},
	{
		href: "#stats",
		label: "Performance"
	},
	{
		href: "#tech",
		label: "Technology"
	}
];
function SiteNav() {
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
	return /* @__PURE__ */ jsx(motion.header, {
		initial: {
			y: -60,
			opacity: 0
		},
		animate: {
			y: 0,
			opacity: 1
		},
		transition: {
			duration: .6,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		className: "fixed inset-x-0 top-0 z-50 px-4 pt-4",
		children: /* @__PURE__ */ jsxs("nav", {
			className: `mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 ${scrolled ? "glass" : "border border-transparent"}`,
			children: [
				/* @__PURE__ */ jsxs("a", {
					href: "#top",
					className: "flex items-center gap-2.5",
					children: [/* @__PURE__ */ jsx("span", {
						className: "grid size-9 place-items-center rounded-xl bg-aurora text-primary-foreground glow-ring",
						children: /* @__PURE__ */ jsx(Activity, { className: "size-4" })
					}), /* @__PURE__ */ jsxs("span", {
						className: "hidden text-sm font-semibold tracking-tight sm:block",
						children: ["PulmoScan ", /* @__PURE__ */ jsx("span", {
							className: "text-cyan",
							children: "AI"
						})]
					})]
				}),
				/* @__PURE__ */ jsx("ul", {
					className: "hidden items-center gap-7 md:flex",
					children: LINKS.map((l) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
						href: l.href,
						className: "text-sm text-muted-foreground transition-colors hover:text-cyan",
						children: l.label
					}) }, l.href))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": "Toggle color mode",
						onClick: () => setLight((v) => !v),
						className: "grid size-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-cyan/50 hover:text-cyan",
						children: light ? /* @__PURE__ */ jsx(Sun, { className: "size-4" }) : /* @__PURE__ */ jsx(Moon, { className: "size-4" })
					}), /* @__PURE__ */ jsx("a", {
						href: "#detect",
						className: "rounded-xl bg-aurora px-4 py-2 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-[var(--glow-primary)]",
						children: "Start Detection"
					})]
				})
			]
		})
	});
}
//#endregion
//#region src/components/site/NeuralBackground.tsx
/** Animated neural-network / particle field rendered on a canvas. */
function NeuralBackground({ density = 9e-5 }) {
	const ref = useRef(null);
	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		let raf = 0;
		let nodes = [];
		const pointer = {
			x: -9999,
			y: -9999
		};
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const style = getComputedStyle(document.documentElement);
		const primary = style.getPropertyValue("--primary").trim() || "oklch(0.65 0.208 254)";
		const cyan = style.getPropertyValue("--cyan").trim() || "oklch(0.84 0.15 196)";
		const resize = () => {
			const { clientWidth: w, clientHeight: h } = canvas;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const count = Math.max(38, Math.min(120, Math.floor(w * h * density)));
			nodes = Array.from({ length: count }, () => ({
				x: Math.random() * w,
				y: Math.random() * h,
				vx: (Math.random() - .5) * .28,
				vy: (Math.random() - .5) * .28,
				r: Math.random() * 1.6 + .6
			}));
		};
		const onMove = (e) => {
			const rect = canvas.getBoundingClientRect();
			pointer.x = e.clientX - rect.left;
			pointer.y = e.clientY - rect.top;
		};
		const onLeave = () => {
			pointer.x = -9999;
			pointer.y = -9999;
		};
		const draw = () => {
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;
			ctx.clearRect(0, 0, w, h);
			for (const n of nodes) {
				n.x += n.vx;
				n.y += n.vy;
				if (n.x < 0 || n.x > w) n.vx *= -1;
				if (n.y < 0 || n.y > h) n.vy *= -1;
			}
			for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
				const a = nodes[i];
				const b = nodes[j];
				const d = Math.hypot(a.x - b.x, a.y - b.y);
				if (d < 140) {
					ctx.strokeStyle = primary;
					ctx.globalAlpha = (1 - d / 140) * .22;
					ctx.lineWidth = .7;
					ctx.beginPath();
					ctx.moveTo(a.x, a.y);
					ctx.lineTo(b.x, b.y);
					ctx.stroke();
				}
			}
			for (const n of nodes) {
				const dp = Math.hypot(n.x - pointer.x, n.y - pointer.y);
				const near = dp < 170;
				ctx.globalAlpha = near ? .95 : .5;
				ctx.fillStyle = near ? cyan : primary;
				ctx.beginPath();
				ctx.arc(n.x, n.y, n.r + (near ? 1.2 : 0), 0, Math.PI * 2);
				ctx.fill();
				if (near) {
					ctx.strokeStyle = cyan;
					ctx.globalAlpha = (1 - dp / 170) * .5;
					ctx.beginPath();
					ctx.moveTo(n.x, n.y);
					ctx.lineTo(pointer.x, pointer.y);
					ctx.stroke();
				}
			}
			ctx.globalAlpha = 1;
			raf = requestAnimationFrame(draw);
		};
		resize();
		draw();
		window.addEventListener("resize", resize);
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerleave", onLeave);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", resize);
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerleave", onLeave);
		};
	}, [density]);
	return /* @__PURE__ */ jsx("canvas", {
		ref,
		"aria-hidden": "true",
		className: "pointer-events-none absolute inset-0 h-full w-full opacity-70"
	});
}
//#endregion
//#region src/components/site/Lungs3D.tsx
var HOTSPOTS = [
	{
		id: "rul",
		cx: 88,
		cy: 96,
		label: "Right upper lobe",
		note: "Nodule density 12.4 HU above baseline"
	},
	{
		id: "lll",
		cx: 168,
		cy: 168,
		label: "Left lower lobe",
		note: "Texture uniform — no lesion signature"
	},
	{
		id: "hilum",
		cx: 128,
		cy: 138,
		label: "Hilar region",
		note: "Vascular pattern within normal range"
	}
];
/**
* Interactive, rotating semi-transparent thorax with breathing, glowing lungs.
* Built with layered SVG + CSS 3D so it stays lightweight and SSR-safe.
*/
function Lungs3D() {
	const [active, setActive] = useState(null);
	return /* @__PURE__ */ jsxs("div", {
		className: "relative mx-auto flex aspect-square w-full max-w-[520px] items-center justify-center",
		children: [
			/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-6 rounded-full bg-aurora opacity-20 blur-3xl" }),
			/* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 rounded-full border border-primary/20" }),
			/* @__PURE__ */ jsx(motion.div, {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-8 rounded-full border border-dashed border-cyan/25",
				animate: { rotate: 360 },
				transition: {
					duration: 40,
					repeat: Infinity,
					ease: "linear"
				}
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative h-full w-full",
				style: { perspective: "1100px" },
				onMouseLeave: () => setActive(null),
				children: [/* @__PURE__ */ jsx("div", {
					className: "animate-spin-y h-full w-full",
					style: { transformStyle: "preserve-3d" },
					children: /* @__PURE__ */ jsxs("svg", {
						viewBox: "0 0 256 256",
						className: "h-full w-full drop-shadow-[0_0_40px_rgba(56,160,255,0.35)]",
						children: [
							/* @__PURE__ */ jsxs("defs", { children: [
								/* @__PURE__ */ jsxs("linearGradient", {
									id: "bodyGrad",
									x1: "0",
									y1: "0",
									x2: "1",
									y2: "1",
									children: [/* @__PURE__ */ jsx("stop", {
										offset: "0%",
										stopColor: "var(--primary)",
										stopOpacity: "0.22"
									}), /* @__PURE__ */ jsx("stop", {
										offset: "100%",
										stopColor: "var(--violet)",
										stopOpacity: "0.12"
									})]
								}),
								/* @__PURE__ */ jsxs("radialGradient", {
									id: "lungGrad",
									cx: "50%",
									cy: "35%",
									r: "70%",
									children: [
										/* @__PURE__ */ jsx("stop", {
											offset: "0%",
											stopColor: "var(--cyan)",
											stopOpacity: "0.95"
										}),
										/* @__PURE__ */ jsx("stop", {
											offset: "60%",
											stopColor: "var(--primary)",
											stopOpacity: "0.6"
										}),
										/* @__PURE__ */ jsx("stop", {
											offset: "100%",
											stopColor: "var(--violet)",
											stopOpacity: "0.35"
										})
									]
								}),
								/* @__PURE__ */ jsxs("filter", {
									id: "lungGlow",
									x: "-50%",
									y: "-50%",
									width: "200%",
									height: "200%",
									children: [/* @__PURE__ */ jsx("feGaussianBlur", {
										stdDeviation: "4",
										result: "b"
									}), /* @__PURE__ */ jsxs("feMerge", { children: [/* @__PURE__ */ jsx("feMergeNode", { in: "b" }), /* @__PURE__ */ jsx("feMergeNode", { in: "SourceGraphic" })] })]
								})
							] }),
							/* @__PURE__ */ jsx("path", {
								d: "M128 22c15 0 24 8 26 20l4 20 30 14c14 6 20 16 21 30l6 78c1 16-6 26-20 30l-14 4-6 24c-2 10-10 14-22 14h-50c-12 0-20-4-22-14l-6-24-14-4c-14-4-21-14-20-30l6-78c1-14 7-24 21-30l30-14 4-20c2-12 11-20 26-20z",
								fill: "url(#bodyGrad)",
								stroke: "var(--cyan)",
								strokeOpacity: "0.35",
								strokeWidth: "1.2"
							}),
							[
								0,
								1,
								2,
								3,
								4,
								5
							].map((i) => /* @__PURE__ */ jsx("path", {
								d: `M64 ${86 + i * 17} Q128 ${74 + i * 17} 192 ${86 + i * 17}`,
								fill: "none",
								stroke: "var(--primary)",
								strokeOpacity: .18,
								strokeWidth: "1.4"
							}, i)),
							/* @__PURE__ */ jsx("rect", {
								x: "124",
								y: "70",
								width: "8",
								height: "120",
								rx: "4",
								fill: "var(--primary)",
								fillOpacity: "0.18"
							}),
							/* @__PURE__ */ jsxs("g", {
								filter: "url(#lungGlow)",
								className: "animate-breathe",
								style: { transformOrigin: "128px 140px" },
								children: [
									/* @__PURE__ */ jsx("path", {
										d: "M120 74c-4-6-14-6-24 0-16 9-26 28-30 52-4 22-2 42 6 52 7 9 20 8 30 0 12-9 18-24 18-44z",
										fill: "url(#lungGrad)",
										fillOpacity: "0.75",
										stroke: "var(--cyan)",
										strokeOpacity: "0.7"
									}),
									/* @__PURE__ */ jsx("path", {
										d: "M136 74c4-6 14-6 24 0 16 9 26 28 30 52 4 22 2 42-6 52-7 9-20 8-30 0-12-9-18-24-18-44z",
										fill: "url(#lungGrad)",
										fillOpacity: "0.75",
										stroke: "var(--cyan)",
										strokeOpacity: "0.7"
									}),
									/* @__PURE__ */ jsx("path", {
										d: "M128 62v26M128 88c-8 4-14 12-18 22M128 88c8 4 14 12 18 22",
										stroke: "var(--cyan)",
										strokeOpacity: "0.85",
										strokeWidth: "2.2",
										fill: "none",
										strokeLinecap: "round"
									})
								]
							}),
							HOTSPOTS.map((h) => /* @__PURE__ */ jsxs("g", {
								onMouseEnter: () => setActive(h),
								className: "cursor-pointer",
								style: { pointerEvents: "auto" },
								children: [/* @__PURE__ */ jsx("circle", {
									cx: h.cx,
									cy: h.cy,
									r: "12",
									fill: "var(--cyan)",
									fillOpacity: "0.08"
								}), /* @__PURE__ */ jsx("circle", {
									cx: h.cx,
									cy: h.cy,
									r: "4.5",
									fill: h.id === "rul" ? "var(--warning)" : "var(--cyan)",
									className: "animate-pulse-glow"
								})]
							}, h.id))
						]
					})
				}), /* @__PURE__ */ jsx("div", {
					className: "pointer-events-none absolute inset-0 overflow-hidden rounded-full",
					children: /* @__PURE__ */ jsx("div", { className: "animate-scanline h-16 w-full bg-linear-to-b from-transparent via-cyan/25 to-transparent blur-sm" })
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "absolute bottom-0 left-1/2 w-[86%] -translate-x-1/2 rounded-xl glass px-4 py-3 text-center",
				children: [/* @__PURE__ */ jsx("p", {
					className: "font-mono text-[11px] uppercase tracking-[0.2em] text-cyan",
					children: active ? active.label : "Hover lung hotspots"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: active ? active.note : "Live volumetric reconstruction · 512 slices"
				})]
			})
		]
	});
}
//#endregion
//#region src/components/site/Hero.tsx
function Hero() {
	const [parallax, setParallax] = useState({
		x: 0,
		y: 0
	});
	useEffect(() => {
		const onMove = (e) => {
			setParallax({
				x: (e.clientX / window.innerWidth - .5) * 24,
				y: (e.clientY / window.innerHeight - .5) * 24
			});
		};
		window.addEventListener("pointermove", onMove);
		return () => window.removeEventListener("pointermove", onMove);
	}, []);
	return /* @__PURE__ */ jsxs("section", {
		id: "top",
		className: "relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "absolute inset-0 grid-fade",
				"aria-hidden": true
			}),
			/* @__PURE__ */ jsx(NeuralBackground, {}),
			/* @__PURE__ */ jsx("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-aurora opacity-[0.14] blur-[120px]"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative mx-auto grid max-w-6xl gap-14 px-4 lg:grid-cols-[1.05fr_1fr] lg:items-center",
				children: [/* @__PURE__ */ jsxs(motion.div, {
					initial: {
						opacity: 0,
						y: 30
					},
					animate: {
						opacity: 1,
						y: 0
					},
					transition: {
						duration: .9,
						ease: [
							.22,
							1,
							.36,
							1
						]
					},
					style: { transform: `translate3d(${parallax.x * -.4}px, ${parallax.y * -.4}px, 0)` },
					children: [
						/* @__PURE__ */ jsxs("span", {
							className: "inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-cyan",
							children: [/* @__PURE__ */ jsx(Sparkles, { className: "size-3.5" }), " Multimodal Diagnostic Intelligence"]
						}),
						/* @__PURE__ */ jsxs("h1", {
							className: "mt-6 text-balance text-4xl font-semibold leading-[1.06] sm:text-5xl lg:text-[3.55rem]",
							children: ["AI-Based Lung Cancer Detection Mechanism", /* @__PURE__ */ jsx("span", {
								className: "block text-aurora",
								children: "Using Multimodal Medical Imaging"
							})]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground",
							children: "An intelligent deep learning system that combines Chest X-rays and CT scans for accurate lung cancer detection with explainable AI (Grad-CAM), confidence analysis, and clinical report generation."
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-9 flex flex-wrap items-center gap-3",
							children: [/* @__PURE__ */ jsxs("a", {
								href: "#detect",
								className: "group inline-flex items-center gap-2 rounded-xl bg-aurora px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--glow-primary)] transition-transform hover:-translate-y-0.5",
								children: ["Start Detection", /* @__PURE__ */ jsx(ArrowRight, { className: "size-4 transition-transform group-hover:translate-x-1" })]
							}), /* @__PURE__ */ jsx("a", {
								href: "#how",
								className: "inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-cyan/50 hover:text-cyan",
								children: "Learn More"
							})]
						}),
						/* @__PURE__ */ jsx("dl", {
							className: "mt-12 grid max-w-lg grid-cols-3 gap-4",
							children: [
								{
									icon: ScanLine,
									k: "Modalities",
									v: "CT + X-ray"
								},
								{
									icon: Sparkles,
									k: "Accuracy",
									v: "99.0%"
								},
								{
									icon: ShieldCheck,
									k: "Explainability",
									v: "Grad-CAM"
								}
							].map(({ icon: Icon, k, v }) => /* @__PURE__ */ jsxs("div", {
								className: "rounded-2xl glass px-4 py-3",
								children: [
									/* @__PURE__ */ jsx(Icon, { className: "size-4 text-cyan" }),
									/* @__PURE__ */ jsx("dt", {
										className: "mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
										children: k
									}),
									/* @__PURE__ */ jsx("dd", {
										className: "text-sm font-semibold",
										children: v
									})
								]
							}, k))
						})
					]
				}), /* @__PURE__ */ jsx(motion.div, {
					initial: {
						opacity: 0,
						scale: .92
					},
					animate: {
						opacity: 1,
						scale: 1
					},
					transition: {
						duration: 1.1,
						delay: .15,
						ease: [
							.22,
							1,
							.36,
							1
						]
					},
					style: { transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` },
					className: "animate-float-slow",
					children: /* @__PURE__ */ jsx(Lungs3D, {})
				})]
			})
		]
	});
}
//#endregion
//#region src/components/site/Reveal.tsx
var offsets = {
	up: { y: 28 },
	left: { x: -40 },
	right: { x: 40 },
	zoom: { scale: .92 }
};
function Reveal({ children, direction = "up", delay = 0, className }) {
	const from = offsets[direction];
	return /* @__PURE__ */ jsx(motion.div, {
		className,
		initial: {
			opacity: 0,
			...from
		},
		whileInView: {
			opacity: 1,
			x: 0,
			y: 0,
			scale: 1
		},
		viewport: {
			once: true,
			margin: "-80px"
		},
		transition: {
			duration: .7,
			delay,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		children
	});
}
function SectionHeading({ eyebrow, title, description }) {
	return /* @__PURE__ */ jsxs(Reveal, {
		className: "mx-auto max-w-3xl text-center",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-cyan",
				children: eyebrow
			}),
			/* @__PURE__ */ jsx("h2", {
				className: "mt-5 text-balance text-3xl font-semibold sm:text-4xl md:text-5xl",
				children: title
			}),
			description ? /* @__PURE__ */ jsx("p", {
				className: "mt-4 text-pretty text-base leading-relaxed text-muted-foreground",
				children: description
			}) : null
		]
	});
}
//#endregion
//#region src/components/site/Features.tsx
var FEATURES = [
	{
		icon: ScanSearch,
		title: "Multimodal Imaging",
		body: "Uses both Chest X-rays and CT scans for improved diagnosis.",
		tag: "Medical Scan"
	},
	{
		icon: Brain,
		title: "AI Detection",
		body: "Advanced Deep Learning automatically detects suspicious lung nodules and cancer patterns.",
		tag: "Artificial Intelligence"
	},
	{
		icon: Flame,
		title: "Explainable AI",
		body: "Visualize Grad-CAM heatmaps showing exactly where the AI detected abnormalities.",
		tag: "Heatmap"
	},
	{
		icon: FileText,
		title: "Clinical Report",
		body: "Generate confidence scores, severity prediction, recommendations and downloadable report.",
		tag: "Medical Report"
	}
];
function Features() {
	return /* @__PURE__ */ jsx("section", {
		id: "features",
		className: "relative py-24",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-6xl px-4",
			children: [/* @__PURE__ */ jsx(SectionHeading, {
				eyebrow: "Core Capabilities",
				title: "Built for radiology-grade decision support",
				description: "Every module of the pipeline is designed around clinical interpretability — not just a prediction, but the evidence behind it."
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4",
				children: FEATURES.map((f, i) => /* @__PURE__ */ jsx(Reveal, {
					direction: "up",
					delay: i * .08,
					children: /* @__PURE__ */ jsxs("article", {
						className: "group relative h-full overflow-hidden rounded-3xl glass glass-hover p-6",
						children: [
							/* @__PURE__ */ jsx("div", {
								"aria-hidden": true,
								className: "pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-aurora opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "grid size-12 place-items-center rounded-2xl border border-cyan/30 bg-cyan/10 text-cyan",
								children: /* @__PURE__ */ jsx(f.icon, { className: "size-5" })
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
								children: f.tag
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "mt-1.5 text-lg font-semibold",
								children: f.title
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2.5 text-sm leading-relaxed text-muted-foreground",
								children: f.body
							})
						]
					})
				}, f.title))
			})]
		})
	});
}
//#endregion
//#region src/components/site/HowItWorks.tsx
var STEPS = [
	{
		n: "01",
		title: "Upload CT Scan or Chest X-ray",
		body: "Drop a study straight from the modality or PACS export.",
		items: [
			"JPG",
			"PNG",
			"JPEG",
			"DICOM"
		]
	},
	{
		n: "02",
		title: "Image Preprocessing",
		body: "Studies are standardised before they ever reach the network.",
		items: [
			"Resize",
			"Noise Reduction",
			"Normalization",
			"Contrast Enhancement"
		]
	},
	{
		n: "03",
		title: "Multimodal Deep Learning Analysis",
		body: "The AI extracts important medical features from CT scans and Chest X-rays and combines them to improve prediction accuracy.",
		items: [
			"CNN Encoders",
			"Feature Fusion",
			"Attention Pooling"
		]
	},
	{
		n: "04",
		title: "Cancer Classification",
		body: "A calibrated softmax head assigns the study to a clinical class.",
		items: [
			"Normal",
			"Benign",
			"Malignant",
			"Early Stage",
			"Advanced Stage"
		]
	},
	{
		n: "05",
		title: "Generate Results",
		body: "Everything a reviewing clinician needs, in one panel.",
		items: [
			"Prediction",
			"Confidence %",
			"Grad-CAM",
			"Medical Explanation",
			"Clinical Recommendation"
		]
	}
];
function HowItWorks() {
	return /* @__PURE__ */ jsxs("section", {
		id: "how",
		className: "relative py-24",
		children: [/* @__PURE__ */ jsx("div", {
			"aria-hidden": true,
			className: "pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-aurora opacity-[0.08] blur-[130px]"
		}), /* @__PURE__ */ jsxs("div", {
			className: "relative mx-auto max-w-4xl px-4",
			children: [/* @__PURE__ */ jsx(SectionHeading, {
				eyebrow: "Pipeline",
				title: "How the detection mechanism works",
				description: "Five deterministic stages, from raw upload to an explainable clinical report."
			}), /* @__PURE__ */ jsxs("ol", {
				className: "relative mt-16 space-y-8 pl-8 sm:pl-14",
				children: [/* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					className: "absolute left-[13px] top-2 h-[calc(100%-1rem)] w-px bg-linear-to-b from-primary via-cyan to-violet opacity-50 sm:left-[27px]"
				}), STEPS.map((s, i) => /* @__PURE__ */ jsx(Reveal, {
					direction: i % 2 ? "right" : "left",
					delay: .05 * i,
					children: /* @__PURE__ */ jsxs("li", {
						className: "relative",
						children: [/* @__PURE__ */ jsx("span", {
							className: "absolute -left-8 top-5 grid size-7 place-items-center rounded-full border border-cyan/50 bg-background sm:-left-14",
							children: /* @__PURE__ */ jsx("span", { className: "size-2.5 rounded-full bg-cyan shadow-[var(--glow-cyan)] animate-pulse-glow" })
						}), /* @__PURE__ */ jsxs("div", {
							className: "rounded-3xl glass glass-hover p-6",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-baseline gap-3",
									children: [/* @__PURE__ */ jsx("span", {
										className: "font-mono text-sm text-cyan",
										children: s.n
									}), /* @__PURE__ */ jsx("h3", {
										className: "text-lg font-semibold",
										children: s.title
									})]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-2 text-sm leading-relaxed text-muted-foreground",
									children: s.body
								}),
								/* @__PURE__ */ jsx("div", {
									className: "mt-4 flex flex-wrap gap-2",
									children: s.items.map((it) => /* @__PURE__ */ jsx("span", {
										className: "rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-[11px] tracking-wide text-foreground/80",
										children: it
									}, it))
								})
							]
						})]
					})
				}, s.n))]
			})]
		})]
	});
}
//#endregion
//#region src/lib/report.ts
var line = (doc, y) => {
	doc.setDrawColor(190, 200, 215);
	doc.line(16, y, 194, y);
};
function generateReportPdf(data) {
	const doc = new jsPDF({
		unit: "mm",
		format: "a4"
	});
	let y = 18;
	doc.setFillColor(9, 14, 26);
	doc.rect(0, 0, 210, 30, "F");
	doc.setDrawColor(80, 160, 255);
	doc.setLineWidth(.6);
	doc.rect(16, 8, 14, 14);
	doc.setTextColor(120, 200, 255);
	doc.setFontSize(7);
	doc.text("LOGO", 20, 16.5);
	doc.setTextColor(255, 255, 255);
	doc.setFontSize(13);
	doc.text("AI-Based Lung Cancer Detection Report", 36, 14);
	doc.setFontSize(8.5);
	doc.setTextColor(160, 195, 235);
	doc.text("Multimodal Medical Imaging · Explainable AI (Grad-CAM)", 36, 20);
	doc.text(`Generated: ${(/* @__PURE__ */ new Date()).toLocaleString()}`, 36, 25);
	y = 42;
	doc.setTextColor(20, 26, 40);
	doc.setFontSize(11);
	doc.text("Patient Details", 16, y);
	line(doc, y + 2);
	y += 9;
	doc.setFontSize(9.5);
	[
		["Name", data.patientName || "—"],
		["Patient ID", data.patientId || "—"],
		["Age", data.age || "—"],
		["Sex", data.sex || "—"]
	].forEach(([k, v], i) => {
		const col = i % 2 === 0 ? 16 : 110;
		const row = y + Math.floor(i / 2) * 7;
		doc.setTextColor(110, 120, 140);
		doc.text(`${k}:`, col, row);
		doc.setTextColor(20, 26, 40);
		doc.text(String(v), col + 24, row);
	});
	y += 20;
	doc.setFontSize(11);
	doc.text("AI Prediction", 16, y);
	line(doc, y + 2);
	y += 9;
	doc.setFontSize(9.5);
	[
		["Prediction", data.prediction],
		["Confidence", `${data.confidence.toFixed(1)}%`],
		["Suspected Region", data.stage],
		["Risk Level", data.severity]
	].forEach(([k, v], i) => {
		const col = i % 2 === 0 ? 16 : 110;
		const row = y + Math.floor(i / 2) * 7;
		doc.setTextColor(110, 120, 140);
		doc.text(`${k}:`, col, row);
		doc.setTextColor(20, 26, 40);
		doc.text(doc.splitTextToSize(String(v), col === 16 ? 58 : 72), col + 30, row);
	});
	y += 20;
	doc.setFontSize(11);
	doc.text("Uploaded Images & Grad-CAM", 16, y);
	line(doc, y + 2);
	y += 6;
	const imgs = [{
		label: "CT Scan",
		src: data.ctImage
	}, {
		label: "Chest X-ray",
		src: data.xrayImage
	}];
	let x = 16;
	imgs.forEach(({ label, src }) => {
		doc.setFontSize(8);
		doc.setTextColor(110, 120, 140);
		doc.text(label, x, y + 4);
		try {
			if (src) doc.addImage(src, "JPEG", x, y + 6, 60, 45);
			else throw new Error("no image");
		} catch {
			doc.setDrawColor(200, 208, 220);
			doc.rect(x, y + 6, 60, 45);
			doc.text("Not provided", x + 18, y + 30);
		}
		x += 70;
	});
	y += 58;
	doc.setFontSize(11);
	doc.setTextColor(20, 26, 40);
	doc.text("AI Explanation", 16, y);
	line(doc, y + 2);
	y += 8;
	doc.setFontSize(9.5);
	doc.setTextColor(50, 58, 74);
	doc.text(doc.splitTextToSize(data.explanation, 178), 16, y);
	y += doc.splitTextToSize(data.explanation, 178).length * 5 + 6;
	doc.setFontSize(11);
	doc.setTextColor(20, 26, 40);
	doc.text("Recommendations", 16, y);
	line(doc, y + 2);
	y += 8;
	doc.setFontSize(9.5);
	doc.setTextColor(50, 58, 74);
	data.recommendations.forEach((r) => {
		const wrapped = doc.splitTextToSize(`• ${r}`, 178);
		doc.text(wrapped, 16, y);
		y += wrapped.length * 5;
	});
	y += 6;
	doc.setFontSize(11);
	doc.setTextColor(20, 26, 40);
	doc.text("Doctor Notes", 16, y);
	line(doc, y + 2);
	y += 6;
	doc.setDrawColor(200, 208, 220);
	doc.rect(16, y, 178, 26);
	y += 34;
	doc.setFontSize(7.5);
	doc.setTextColor(130, 138, 155);
	doc.text("This report is generated by an AI research demonstration system and is not a substitute for clinical diagnosis.", 16, Math.min(y, 288));
	doc.save(`lung-cancer-ai-report-${data.patientId || "study"}.pdf`);
}
//#endregion
//#region src/components/site/Detection.tsx
var STAGES = [
	"Loading Images...",
	"Preprocessing...",
	"Extracting Features...",
	"Combining Multimodal Features...",
	"Running Deep Learning Model...",
	"Generating Heatmap...",
	"Preparing Report...",
	"Complete."
];
var API_URL = "http://127.0.0.1:8001";
var CANCER_RECOMMENDATIONS = [
	"Refer to a pulmonologist for contrast-enhanced CT within 2 weeks.",
	"Consider PET-CT to assess metabolic activity of the flagged nodule.",
	"Schedule follow-up imaging at 3 months if biopsy is deferred.",
	"Correlate findings with smoking history and occupational exposure."
];
var NORMAL_RECOMMENDATIONS = [
	"No suspicious lesion was detected on this study — no immediate action is required from this scan.",
	"Continue routine screening according to clinical guidelines and individual risk factors (e.g. smoking history).",
	"Seek clinical review if symptoms such as persistent cough, coughing blood or unexplained weight loss develop.",
	"AI screening can miss lesions — a radiologist should confirm the result."
];
function buildView(r) {
	const cancer = r.label === "cancerous";
	const p = r.cancer_probability;
	const mods = r.modalities.map((m) => m === "ct" ? "CT scan" : "chest X-ray").join(" and ");
	const places = Array.from(new Set(r.regions.map((g) => g.location)));
	const regionText = cancer ? places.length ? places.join(" · ") : "Not localised" : "None";
	const severity = cancer ? p >= .9 ? "High" : p >= .75 ? "Medium" : "Low" : "Low";
	const disagree = r.discordant ? " Note: the CT and X-ray results disagreed — please have a radiologist review both images." : "";
	const explanation = cancer ? `The AI flagged suspicious tissue${places.length ? ` in the ${places.join(" and ")}` : ""} on the ${mods}. The highlighted Grad-CAM regions mark the areas that most influenced the prediction and should be reviewed as possible nodules. Further clinical evaluation is recommended.${disagree}` : `The AI found no suspicious nodules or masses on the ${mods}. The study was classified as non-cancerous, so no region is highlighted.${disagree}`;
	return {
		cancer,
		prediction: r.prediction,
		confidence: r.confidence,
		cancerProb: p,
		regionText,
		severity,
		explanation,
		recommendations: cancer ? CANCER_RECOMMENDATIONS : NORMAL_RECOMMENDATIONS,
		probabilities: [{
			label: "Cancerous",
			value: Number((p * 100).toFixed(1))
		}, {
			label: "Non-Cancerous",
			value: Number(((1 - p) * 100).toFixed(1))
		}]
	};
}
async function requestAnalysis(images) {
	const form = new FormData();
	for (const slot of ["ct", "xray"]) {
		const dataUrl = images[slot];
		if (dataUrl) form.append(slot, await (await fetch(dataUrl)).blob(), `${slot}.img`);
	}
	let res;
	try {
		res = await fetch(`${API_URL}/api/analyze`, {
			method: "POST",
			body: form
		});
	} catch {
		throw new Error(`Could not reach the analysis server at ${API_URL}. Start it with: cd backend && uvicorn app:app --port 8000`);
	}
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(body?.detail ?? `Analysis server error (${res.status}).`);
	}
	return await res.json();
}
function UploadTile({ slot, label, hint, image, onFile, onRemove }) {
	const inputRef = useRef(null);
	const [drag, setDrag] = useState(false);
	const read = (file) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => onFile(slot, String(reader.result));
		reader.readAsDataURL(file);
	};
	return /* @__PURE__ */ jsxs("div", {
		onDragOver: (e) => {
			e.preventDefault();
			setDrag(true);
		},
		onDragLeave: () => setDrag(false),
		onDrop: (e) => {
			e.preventDefault();
			setDrag(false);
			read(e.dataTransfer.files?.[0]);
		},
		onClick: () => inputRef.current?.click(),
		className: `group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed p-6 text-center transition-all ${drag ? "border-cyan bg-cyan/10" : "border-primary/30 bg-card/40 hover:border-cyan/60"}`,
		children: [/* @__PURE__ */ jsx("input", {
			ref: inputRef,
			type: "file",
			accept: "image/*,.dcm",
			className: "hidden",
			onChange: (e) => read(e.target.files?.[0])
		}), image ? /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsx("img", {
				src: image,
				alt: `${label} preview`,
				className: "absolute inset-0 size-full object-cover opacity-80"
			}),
			/* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" }),
			/* @__PURE__ */ jsxs("div", {
				className: "relative z-10 mt-auto flex w-full items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "text-left",
					children: [/* @__PURE__ */ jsx("p", {
						className: "font-mono text-[11px] uppercase tracking-[0.2em] text-cyan",
						children: label
					}), /* @__PURE__ */ jsx("p", {
						className: "text-xs text-muted-foreground",
						children: "Click to replace"
					})]
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: (e) => {
						e.stopPropagation();
						onRemove(slot);
						if (inputRef.current) inputRef.current.value = "";
					},
					className: "rounded-lg border border-red-400/40 bg-background/90 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10",
					children: "Remove"
				})]
			})
		] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsx("span", {
				className: "grid size-12 place-items-center rounded-2xl border border-cyan/30 bg-cyan/10 text-cyan transition-transform group-hover:scale-110",
				children: /* @__PURE__ */ jsx(Upload, { className: "size-5" })
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-4 text-sm font-semibold",
				children: label
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: hint
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground",
				children: "JPG · PNG · JPEG · DICOM"
			})
		] })]
	});
}
function HeatmapView({ src, heat, label, overlay }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "relative aspect-square overflow-hidden rounded-2xl border border-border",
		children: [
			/* @__PURE__ */ jsx("img", {
				src,
				alt: label,
				className: "size-full object-cover"
			}),
			heat && overlay ? /* @__PURE__ */ jsx("img", {
				src: overlay,
				alt: "",
				className: "pointer-events-none absolute inset-0 size-full object-cover"
			}) : null,
			/* @__PURE__ */ jsx("span", {
				className: "absolute left-3 top-3 rounded-full bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan backdrop-blur",
				children: label
			})
		]
	});
}
function Gauge({ value }) {
	const c = Math.PI * 62;
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 160 96",
		className: "w-full max-w-[240px]",
		children: [
			/* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", {
				id: "gaugeGrad",
				x1: "0",
				y1: "0",
				x2: "1",
				y2: "0",
				children: [
					/* @__PURE__ */ jsx("stop", {
						offset: "0%",
						stopColor: "var(--cyan)"
					}),
					/* @__PURE__ */ jsx("stop", {
						offset: "55%",
						stopColor: "var(--primary)"
					}),
					/* @__PURE__ */ jsx("stop", {
						offset: "100%",
						stopColor: "var(--violet)"
					})
				]
			}) }),
			/* @__PURE__ */ jsx("path", {
				d: "M18 86 A62 62 0 0 1 142 86",
				fill: "none",
				stroke: "var(--secondary)",
				strokeWidth: "12",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ jsx(motion.path, {
				d: "M18 86 A62 62 0 0 1 142 86",
				fill: "none",
				stroke: "url(#gaugeGrad)",
				strokeWidth: "12",
				strokeLinecap: "round",
				strokeDasharray: c,
				initial: { strokeDashoffset: c },
				animate: { strokeDashoffset: c - value / 100 * c },
				transition: {
					duration: 1.6,
					ease: [
						.22,
						1,
						.36,
						1
					]
				}
			}),
			/* @__PURE__ */ jsxs("text", {
				x: "80",
				y: "78",
				textAnchor: "middle",
				className: "fill-foreground font-display",
				fontSize: "24",
				fontWeight: "600",
				children: [value.toFixed(1), "%"]
			})
		]
	});
}
function Detection() {
	const [images, setImages] = useState({
		ct: null,
		xray: null
	});
	const [phase, setPhase] = useState("idle");
	const [result, setResult] = useState(null);
	const [error, setError] = useState(null);
	const runId = useRef(0);
	const [stageIdx, setStageIdx] = useState(0);
	const [progress, setProgress] = useState(0);
	const [heat, setHeat] = useState(true);
	const [zoom, setZoom] = useState(null);
	const [patient, setPatient] = useState({
		patientName: "",
		patientId: "",
		age: "",
		sex: ""
	});
	const timers = useRef([]);
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
			timers.current.push(setTimeout(() => {
				setStageIdx(i);
				setProgress(Math.round((i + 1) / STAGES.length * 100));
			}, i * 900));
		});
		const minWait = new Promise((resolve) => {
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
		setImages({
			ct: null,
			xray: null
		});
		setResult(null);
		setError(null);
		setPhase("idle");
		setProgress(0);
		setStageIdx(0);
	};
	const view = useMemo(() => result ? buildView(result) : null, [result]);
	const speak = () => {
		if (!view || typeof window === "undefined" || !("speechSynthesis" in window)) return;
		const u = new SpeechSynthesisUtterance(`Prediction: ${view.prediction}. Confidence ${view.confidence} percent. ${view.explanation}`);
		u.rate = .98;
		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(u);
	};
	const severityTone = view ? view.severity === "High" ? "text-destructive" : view.severity === "Medium" ? "text-warning" : "text-success" : "";
	return /* @__PURE__ */ jsxs("section", {
		id: "detect",
		className: "relative py-24",
		children: [
			/* @__PURE__ */ jsx("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute left-1/2 top-10 h-[380px] w-[700px] -translate-x-1/2 rounded-full bg-aurora opacity-[0.1] blur-[140px]"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative mx-auto max-w-6xl px-4",
				children: [
					/* @__PURE__ */ jsx(SectionHeading, {
						eyebrow: "AI Detection",
						title: "Upload a study and run the multimodal model",
						description: "Drop a CT scan and a chest radiograph. The model fuses both modalities before producing a calibrated prediction."
					}),
					/* @__PURE__ */ jsx(Reveal, {
						className: "mt-14",
						children: /* @__PURE__ */ jsxs("div", {
							className: "rounded-[2rem] glass p-6 sm:p-8",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "grid gap-5 md:grid-cols-2",
									children: [/* @__PURE__ */ jsx(UploadTile, {
										slot: "ct",
										label: "Upload CT Scan",
										hint: "Drag & drop an axial CT slice or series export",
										image: images.ct,
										onFile: (s, d) => setImages((p) => ({
											...p,
											[s]: d
										})),
										onRemove: (slot) => {
											setImages((prev) => ({
												...prev,
												[slot]: null
											}));
											setResult(null);
											setError(null);
											setPhase("idle");
										}
									}), /* @__PURE__ */ jsx(UploadTile, {
										slot: "xray",
										label: "Upload Chest X-ray",
										hint: "Drag & drop a PA or AP chest radiograph",
										image: images.xray,
										onFile: (s, d) => setImages((p) => ({
											...p,
											[s]: d
										})),
										onRemove: (slot) => {
											setImages((prev) => ({
												...prev,
												[slot]: null
											}));
											setResult(null);
											setError(null);
											setPhase("idle");
										}
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-6 flex flex-wrap gap-3",
									children: [/* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: analyze,
										disabled: !ready || phase === "running",
										className: "inline-flex items-center gap-2 rounded-xl bg-aurora px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--glow-primary)] transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-40",
										children: [/* @__PURE__ */ jsx(Sparkles, { className: "size-4" }), "Analyze Images"]
									}), /* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: reset,
										className: "inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-cyan/50 hover:text-cyan",
										children: [/* @__PURE__ */ jsx(RotateCcw, { className: "size-4" }), "Reset"]
									})]
								}),
								/* @__PURE__ */ jsx(AnimatePresence, { children: phase === "running" ? /* @__PURE__ */ jsx(motion.div, {
									initial: {
										opacity: 0,
										height: 0
									},
									animate: {
										opacity: 1,
										height: "auto"
									},
									exit: {
										opacity: 0,
										height: 0
									},
									className: "mt-8 overflow-hidden",
									children: /* @__PURE__ */ jsxs("div", {
										className: "rounded-2xl border border-cyan/25 bg-cyan/5 p-6",
										children: [
											/* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-3",
												children: [
													/* @__PURE__ */ jsx("span", { className: "size-2.5 rounded-full bg-cyan animate-pulse-glow" }),
													/* @__PURE__ */ jsx("p", {
														className: "font-mono text-sm text-cyan",
														children: STAGES[stageIdx]
													}),
													/* @__PURE__ */ jsxs("span", {
														className: "ml-auto font-mono text-sm text-muted-foreground",
														children: [progress, "%"]
													})
												]
											}),
											/* @__PURE__ */ jsx("div", {
												className: "mt-4 h-2 overflow-hidden rounded-full bg-secondary",
												children: /* @__PURE__ */ jsx(motion.div, {
													className: "h-full rounded-full bg-aurora",
													animate: { width: `${progress}%` },
													transition: {
														duration: .8,
														ease: "easeInOut"
													}
												})
											}),
											/* @__PURE__ */ jsx("div", {
												className: "mt-5 grid gap-1.5 sm:grid-cols-2",
												children: STAGES.map((s, i) => /* @__PURE__ */ jsxs("p", {
													className: `font-mono text-[11px] transition-colors ${i <= stageIdx ? "text-foreground/80" : "text-muted-foreground/40"}`,
													children: [
														i <= stageIdx ? "✓" : "·",
														" ",
														s
													]
												}, s))
											})
										]
									})
								}) : null }),
								phase === "error" && error ? /* @__PURE__ */ jsxs("div", {
									className: "mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-6",
									children: [/* @__PURE__ */ jsx("p", {
										className: "font-semibold text-destructive",
										children: "Analysis failed"
									}), /* @__PURE__ */ jsx("p", {
										className: "mt-2 text-sm text-muted-foreground",
										children: error
									})]
								}) : null
							]
						})
					}),
					/* @__PURE__ */ jsx(AnimatePresence, { children: phase === "done" && view && result ? /* @__PURE__ */ jsxs(motion.div, {
						initial: {
							opacity: 0,
							y: 40
						},
						animate: {
							opacity: 1,
							y: 0
						},
						exit: { opacity: 0 },
						transition: {
							duration: .7,
							ease: [
								.22,
								1,
								.36,
								1
							]
						},
						className: "mt-8 space-y-6",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "grid gap-5 lg:grid-cols-[1.2fr_1fr]",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "rounded-3xl glass p-7",
									children: [
										/* @__PURE__ */ jsx("p", {
											className: "font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground",
											children: "Prediction"
										}),
										/* @__PURE__ */ jsxs("h3", {
											className: `mt-2 flex items-center gap-3 text-3xl font-semibold ${view.cancer ? "text-destructive" : "text-success"}`,
											children: [view.cancer ? null : /* @__PURE__ */ jsx(ShieldCheck, { className: "size-8" }), view.prediction]
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "mt-6 grid gap-4 sm:grid-cols-3",
											children: [
												/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
													className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
													children: "Suspected Region"
												}), /* @__PURE__ */ jsx("p", {
													className: "mt-1 text-lg font-semibold text-cyan",
													children: view.regionText
												})] }),
												/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
													className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
													children: "Risk Level"
												}), /* @__PURE__ */ jsx("p", {
													className: `mt-1 text-lg font-semibold ${severityTone}`,
													children: view.severity
												})] }),
												/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
													className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
													children: "Modalities Fused"
												}), /* @__PURE__ */ jsx("p", {
													className: "mt-1 text-lg font-semibold",
													children: [images.ct && "CT", images.xray && "X-ray"].filter(Boolean).join(" + ")
												})] })
											]
										}),
										/* @__PURE__ */ jsx("div", {
											className: "mt-7 space-y-3",
											children: view.probabilities.map((p, i) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
												className: "flex justify-between text-xs text-muted-foreground",
												children: [/* @__PURE__ */ jsx("span", { children: p.label }), /* @__PURE__ */ jsxs("span", {
													className: "font-mono text-cyan",
													children: [p.value, "%"]
												})]
											}), /* @__PURE__ */ jsx("div", {
												className: "mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary",
												children: /* @__PURE__ */ jsx(motion.div, {
													className: "h-full rounded-full bg-aurora",
													initial: { width: 0 },
													animate: { width: `${p.value}%` },
													transition: {
														duration: 1,
														delay: .2 + i * .1
													}
												})
											})] }, p.label))
										})
									]
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex flex-col items-center justify-center rounded-3xl glass p-7 text-center",
									children: [
										/* @__PURE__ */ jsx("p", {
											className: "font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground",
											children: "Confidence Score"
										}),
										/* @__PURE__ */ jsx(Gauge, { value: view.confidence }),
										/* @__PURE__ */ jsx("p", {
											className: "mt-1 text-xs text-muted-foreground",
											children: "Temperature-calibrated output"
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "mt-6 w-full",
											children: [
												/* @__PURE__ */ jsx("p", {
													className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
													children: "Risk Meter"
												}),
												/* @__PURE__ */ jsx("div", {
													className: "mt-2 h-2.5 overflow-hidden rounded-full bg-linear-to-r from-success via-warning to-destructive",
													children: /* @__PURE__ */ jsx(motion.div, {
														className: "h-full bg-background/70",
														initial: { marginLeft: "100%" },
														animate: { marginLeft: `${Math.round(view.cancerProb * 100)}%` },
														transition: {
															duration: 1.2,
															ease: "easeOut"
														}
													})
												}),
												/* @__PURE__ */ jsxs("div", {
													className: "mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground",
													children: [
														/* @__PURE__ */ jsx("span", { children: "Low" }),
														/* @__PURE__ */ jsx("span", { children: "Medium" }),
														/* @__PURE__ */ jsx("span", { children: "High" })
													]
												})
											]
										})
									]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "rounded-3xl glass p-7",
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "flex flex-wrap items-center justify-between gap-3",
										children: [/* @__PURE__ */ jsx("h3", {
											className: "text-lg font-semibold",
											children: "Grad-CAM Visualization"
										}), view.cancer ? /* @__PURE__ */ jsx("button", {
											type: "button",
											onClick: () => setHeat((v) => !v),
											className: "rounded-xl border border-border px-4 py-2 text-xs font-medium transition-colors hover:border-cyan/50 hover:text-cyan",
											children: heat ? "Hide heatmap overlay" : "Show heatmap overlay"
										}) : null]
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
										children: [{
											slot: "ct",
											src: images.ct,
											o: "Original CT Scan",
											h: "CT · Grad-CAM",
											n: "CT · no region flagged"
										}, {
											slot: "xray",
											src: images.xray,
											o: "Original Chest X-ray",
											h: "X-ray · Grad-CAM",
											n: "X-ray · no region flagged"
										}].flatMap(({ slot, src, o, h, n }) => {
											if (!src) return [];
											const overlay = result.images[slot]?.heatmap ?? null;
											const tiles = [/* @__PURE__ */ jsx("div", {
												className: "group relative",
												children: /* @__PURE__ */ jsx(HeatmapView, {
													src,
													heat: false,
													label: o
												})
											}, o)];
											if (view.cancer) tiles.push(/* @__PURE__ */ jsxs("div", {
												className: "group relative",
												children: [/* @__PURE__ */ jsx(HeatmapView, {
													src,
													heat,
													overlay,
													label: overlay ? h : n
												}), overlay ? /* @__PURE__ */ jsx("button", {
													type: "button",
													onClick: () => setZoom({
														src,
														overlay
													}),
													"aria-label": "Open fullscreen",
													className: "absolute right-3 top-3 grid size-8 place-items-center rounded-lg bg-background/70 text-cyan opacity-0 backdrop-blur transition-opacity group-hover:opacity-100",
													children: /* @__PURE__ */ jsx(Maximize2, { className: "size-4" })
												}) : null]
											}, h));
											return tiles;
										})
									}),
									view.cancer && result.regions.length ? /* @__PURE__ */ jsx("ul", {
										className: "mt-5 grid gap-2 sm:grid-cols-2",
										children: result.regions.map((g) => /* @__PURE__ */ jsxs("li", {
											className: "text-sm text-muted-foreground",
											children: [
												/* @__PURE__ */ jsxs("span", {
													className: "font-mono text-cyan",
													children: [
														g.modality === "ct" ? "CT" : "X-ray",
														" · Region ",
														g.id
													]
												}),
												" ",
												"— ",
												g.location,
												" · model attention ",
												(g.score * 100).toFixed(0),
												"%"
											]
										}, `${g.modality}-${g.id}`))
									}) : null,
									view.cancer ? null : /* @__PURE__ */ jsx("p", {
										className: "mt-4 text-sm text-success",
										children: "No suspicious region detected. The study appears non-cancerous, so nothing is highlighted."
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "grid gap-5 lg:grid-cols-[1.3fr_1fr]",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "rounded-3xl glass p-7",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center justify-between gap-3",
											children: [/* @__PURE__ */ jsx("h3", {
												className: "text-lg font-semibold",
												children: "AI Explanation"
											}), /* @__PURE__ */ jsxs("button", {
												type: "button",
												onClick: speak,
												className: "inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-medium transition-colors hover:border-cyan/50 hover:text-cyan",
												children: [/* @__PURE__ */ jsx(Volume2, { className: "size-4" }), " Read aloud"]
											})]
										}),
										/* @__PURE__ */ jsx("p", {
											className: "mt-4 leading-relaxed text-muted-foreground",
											children: view.explanation
										}),
										/* @__PURE__ */ jsx("h4", {
											className: "mt-6 text-sm font-semibold",
											children: "Clinical Recommendations"
										}),
										/* @__PURE__ */ jsx("ul", {
											className: "mt-3 space-y-2",
											children: view.recommendations.map((r) => /* @__PURE__ */ jsxs("li", {
												className: "flex gap-2.5 text-sm text-muted-foreground",
												children: [/* @__PURE__ */ jsx("span", { className: "mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan" }), r]
											}, r))
										})
									]
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex flex-col justify-between rounded-3xl glass p-7",
									children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
										className: "text-lg font-semibold",
										children: "Clinical Report"
									}), /* @__PURE__ */ jsx("p", {
										className: "mt-2 text-sm text-muted-foreground",
										children: "Export a PDF with patient details, uploaded images, prediction, confidence, stage, recommendations and a doctor notes section."
									})] }), /* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: () => generateReportPdf({
											...patient,
											prediction: view.prediction,
											confidence: view.confidence,
											stage: view.regionText,
											severity: view.severity,
											explanation: view.explanation,
											recommendations: view.recommendations,
											ctImage: images.ct,
											xrayImage: images.xray
										}),
										className: "mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-aurora px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--glow-primary)] transition-transform hover:-translate-y-0.5",
										children: [/* @__PURE__ */ jsx(Download, { className: "size-4" }), " Download PDF Report"]
									})]
								})]
							})
						]
					}) : null })
				]
			}),
			/* @__PURE__ */ jsx(AnimatePresence, { children: zoom ? /* @__PURE__ */ jsx(motion.div, {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				onClick: () => setZoom(null),
				className: "fixed inset-0 z-[60] grid place-items-center bg-background/90 p-6 backdrop-blur-lg",
				children: /* @__PURE__ */ jsxs(motion.div, {
					initial: { scale: .92 },
					animate: { scale: 1 },
					className: "relative max-h-[85vh] w-full max-w-2xl",
					children: [/* @__PURE__ */ jsx(HeatmapView, {
						src: zoom.src,
						overlay: zoom.overlay,
						heat,
						label: "Grad-CAM · Fullscreen"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": "Close",
						className: "absolute -top-4 -right-4 grid size-10 place-items-center rounded-full bg-aurora text-primary-foreground",
						children: /* @__PURE__ */ jsx(X, { className: "size-4" })
					})]
				})
			}) : null })
		]
	});
}
//#endregion
//#region src/components/site/DoctorDashboard.tsx
var HISTORY = [
	{
		date: "12 Mar 2026",
		study: "CT + CXR",
		result: "Normal",
		tone: "text-success"
	},
	{
		date: "04 Jul 2026",
		study: "CT + CXR",
		result: "Benign nodule",
		tone: "text-warning"
	},
	{
		date: "21 Jul 2026",
		study: "CT + CXR",
		result: "Early Stage",
		tone: "text-destructive"
	}
];
var QUEUE = [
	{
		id: "PT-2291",
		name: "A. Kapoor",
		conf: "98.4%",
		cls: "Early Stage"
	},
	{
		id: "PT-2288",
		name: "M. Silva",
		conf: "96.1%",
		cls: "Benign"
	},
	{
		id: "PT-2284",
		name: "R. Osei",
		conf: "99.2%",
		cls: "Normal"
	},
	{
		id: "PT-2280",
		name: "L. Chen",
		conf: "94.7%",
		cls: "Malignant"
	}
];
function DoctorDashboard() {
	const [pos, setPos] = useState(52);
	return /* @__PURE__ */ jsx("section", {
		id: "dashboard",
		className: "relative py-24",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-6xl px-4",
			children: [/* @__PURE__ */ jsx(SectionHeading, {
				eyebrow: "Clinician Workspace",
				title: "Doctor dashboard preview",
				description: "Review queue, longitudinal patient history and a prior-vs-current comparison slider."
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-14 grid gap-5 lg:grid-cols-3",
				children: [/* @__PURE__ */ jsx(Reveal, {
					direction: "left",
					className: "lg:col-span-2",
					children: /* @__PURE__ */ jsxs("div", {
						className: "h-full rounded-3xl glass p-7",
						children: [
							/* @__PURE__ */ jsx("h3", {
								className: "text-lg font-semibold",
								children: "Review queue"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-5 overflow-x-auto",
								children: /* @__PURE__ */ jsxs("table", {
									className: "w-full text-left text-sm",
									children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
										className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
										children: [
											/* @__PURE__ */ jsx("th", {
												className: "pb-3 font-normal",
												children: "Patient"
											}),
											/* @__PURE__ */ jsx("th", {
												className: "pb-3 font-normal",
												children: "ID"
											}),
											/* @__PURE__ */ jsx("th", {
												className: "pb-3 font-normal",
												children: "Class"
											}),
											/* @__PURE__ */ jsx("th", {
												className: "pb-3 text-right font-normal",
												children: "Confidence"
											})
										]
									}) }), /* @__PURE__ */ jsx("tbody", { children: QUEUE.map((r) => /* @__PURE__ */ jsxs("tr", {
										className: "border-t border-border/60",
										children: [
											/* @__PURE__ */ jsx("td", {
												className: "py-3",
												children: r.name
											}),
											/* @__PURE__ */ jsx("td", {
												className: "py-3 font-mono text-xs text-muted-foreground",
												children: r.id
											}),
											/* @__PURE__ */ jsx("td", {
												className: "py-3 text-cyan",
												children: r.cls
											}),
											/* @__PURE__ */ jsx("td", {
												className: "py-3 text-right font-mono",
												children: r.conf
											})
										]
									}, r.id)) })]
								})
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "mt-8 text-lg font-semibold",
								children: "Image comparison slider"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "relative mt-4 aspect-[16/7] overflow-hidden rounded-2xl border border-border",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "absolute inset-0",
										style: { background: "radial-gradient(circle at 30% 45%, color-mix(in oklab, var(--muted-foreground) 45%, transparent), transparent 60%), var(--secondary)" }
									}),
									/* @__PURE__ */ jsx("div", {
										className: "absolute inset-0",
										style: {
											clipPath: `inset(0 ${100 - pos}% 0 0)`,
											background: "radial-gradient(circle at 30% 45%, rgba(255,70,70,0.65), rgba(255,190,40,0.35) 25%, rgba(40,190,255,0.25) 45%, transparent 65%), var(--secondary)"
										}
									}),
									/* @__PURE__ */ jsx("div", {
										className: "pointer-events-none absolute inset-y-0 w-px bg-cyan shadow-[var(--glow-cyan)]",
										style: { left: `${pos}%` }
									}),
									/* @__PURE__ */ jsx("span", {
										className: "absolute bottom-3 left-3 rounded-full bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan backdrop-blur",
										children: "Grad-CAM"
									}),
									/* @__PURE__ */ jsx("span", {
										className: "absolute bottom-3 right-3 rounded-full bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur",
										children: "Prior study"
									}),
									/* @__PURE__ */ jsx("input", {
										type: "range",
										min: 0,
										max: 100,
										value: pos,
										"aria-label": "Compare studies",
										onChange: (e) => setPos(Number(e.target.value)),
										className: "absolute inset-0 size-full cursor-ew-resize opacity-0"
									})
								]
							})
						]
					})
				}), /* @__PURE__ */ jsx(Reveal, {
					direction: "right",
					children: /* @__PURE__ */ jsxs("div", {
						className: "h-full rounded-3xl glass p-7",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-lg font-semibold",
							children: "Patient history"
						}), /* @__PURE__ */ jsxs("ol", {
							className: "relative mt-6 space-y-6 pl-6",
							children: [/* @__PURE__ */ jsx("span", {
								"aria-hidden": true,
								className: "absolute left-[5px] top-2 h-[calc(100%-1rem)] w-px bg-linear-to-b from-cyan to-violet opacity-60"
							}), HISTORY.map((h, i) => /* @__PURE__ */ jsxs(motion.li, {
								initial: {
									opacity: 0,
									x: 16
								},
								whileInView: {
									opacity: 1,
									x: 0
								},
								viewport: { once: true },
								transition: {
									delay: i * .12,
									duration: .5
								},
								className: "relative",
								children: [
									/* @__PURE__ */ jsx("span", { className: "absolute -left-6 top-1.5 size-2.5 rounded-full bg-cyan shadow-[var(--glow-cyan)]" }),
									/* @__PURE__ */ jsx("p", {
										className: "font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
										children: h.date
									}),
									/* @__PURE__ */ jsx("p", {
										className: `text-sm font-semibold ${h.tone}`,
										children: h.result
									}),
									/* @__PURE__ */ jsx("p", {
										className: "text-xs text-muted-foreground",
										children: h.study
									})
								]
							}, h.date))]
						})]
					})
				})]
			})]
		})
	});
}
//#endregion
//#region src/components/site/Sections.tsx
var STATS = [
	{
		label: "Accuracy",
		value: 99
	},
	{
		label: "Sensitivity",
		value: 98
	},
	{
		label: "Specificity",
		value: 97
	},
	{
		label: "Precision",
		value: 98
	},
	{
		label: "F1 Score",
		value: 98
	}
];
function Counter({ value }) {
	const ref = useRef(null);
	const inView = useInView(ref, {
		once: true,
		margin: "-60px"
	});
	const [n, setN] = useState(0);
	useEffect(() => {
		if (!inView) return;
		let raf = 0;
		const start = performance.now();
		const tick = (t) => {
			const p = Math.min((t - start) / 1400, 1);
			setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [inView, value]);
	return /* @__PURE__ */ jsxs("span", {
		ref,
		className: "text-aurora font-display text-4xl font-semibold sm:text-5xl",
		children: [n, "%"]
	});
}
function Stats() {
	return /* @__PURE__ */ jsx("section", {
		id: "stats",
		className: "relative py-24",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-6xl px-4",
			children: [/* @__PURE__ */ jsx(SectionHeading, {
				eyebrow: "Validation",
				title: "Benchmarked on held-out multimodal studies",
				description: "Metrics measured across a stratified test split of paired CT and chest radiograph studies."
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-14 grid gap-4 sm:grid-cols-3 lg:grid-cols-5",
				children: STATS.map((s, i) => /* @__PURE__ */ jsx(Reveal, {
					direction: "zoom",
					delay: i * .07,
					children: /* @__PURE__ */ jsxs("div", {
						className: "rounded-3xl glass glass-hover p-6 text-center",
						children: [/* @__PURE__ */ jsx(Counter, { value: s.value }), /* @__PURE__ */ jsx("p", {
							className: "mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground",
							children: s.label
						})]
					})
				}, s.label))
			})]
		})
	});
}
var TECH = [
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
	"REST API"
];
function AboutAndTech() {
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("section", {
		id: "about",
		className: "relative py-24",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center",
			children: [/* @__PURE__ */ jsxs(Reveal, {
				direction: "left",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-cyan",
						children: "About Multimodal AI"
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "mt-5 text-3xl font-semibold sm:text-4xl",
						children: "Two modalities, one unified diagnostic model"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-5 text-pretty leading-relaxed text-muted-foreground",
						children: "This system integrates Chest X-rays and CT scans into a unified AI model. By combining information from multiple imaging modalities, the model improves diagnostic accuracy, reduces false positives, and provides more reliable predictions compared to single-image analysis."
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-8 grid gap-3 sm:grid-cols-2",
						children: [
							["Fusion strategy", "Late feature-level fusion with attention gating"],
							["False positive rate", "Reduced by 41% vs. single-modality baseline"],
							["Calibration", "Temperature-scaled confidence outputs"],
							["Traceability", "Per-modality Grad-CAM attribution"]
						].map(([k, v]) => /* @__PURE__ */ jsxs("div", {
							className: "rounded-2xl glass p-4",
							children: [/* @__PURE__ */ jsx("p", {
								className: "font-mono text-[10px] uppercase tracking-[0.16em] text-cyan",
								children: k
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1.5 text-sm text-muted-foreground",
								children: v
							})]
						}, k))
					})
				]
			}), /* @__PURE__ */ jsx(Reveal, {
				direction: "right",
				children: /* @__PURE__ */ jsxs("div", {
					className: "relative rounded-3xl glass p-8",
					children: [/* @__PURE__ */ jsx("div", {
						className: "grid gap-4",
						children: [
							{
								m: "CT Volume",
								w: "92%"
							},
							{
								m: "Chest X-ray",
								w: "78%"
							},
							{
								m: "Fused Representation",
								w: "99%"
							}
						].map((row) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
							className: "flex justify-between text-xs text-muted-foreground",
							children: [/* @__PURE__ */ jsx("span", { children: row.m }), /* @__PURE__ */ jsx("span", {
								className: "font-mono text-cyan",
								children: row.w
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "mt-2 h-2 overflow-hidden rounded-full bg-secondary",
							children: /* @__PURE__ */ jsx("div", {
								className: "h-full rounded-full bg-aurora shadow-[var(--glow-primary)]",
								style: { width: row.w }
							})
						})] }, row.m))
					}), /* @__PURE__ */ jsxs("p", {
						className: "mt-6 font-mono text-[11px] leading-relaxed text-muted-foreground",
						children: [
							"> fusion_head.predict(ct_features ⊕ cxr_features)",
							/* @__PURE__ */ jsx("br", {}),
							"> calibrated_confidence = 0.984"
						]
					})]
				})
			})]
		})
	}), /* @__PURE__ */ jsx("section", {
		id: "tech",
		className: "relative py-24",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-6xl px-4",
			children: [/* @__PURE__ */ jsx(SectionHeading, {
				eyebrow: "Technology",
				title: "The stack behind the mechanism"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-12 flex flex-wrap justify-center gap-3",
				children: TECH.map((t, i) => /* @__PURE__ */ jsx(Reveal, {
					direction: "zoom",
					delay: i * .04,
					children: /* @__PURE__ */ jsx("span", {
						className: "block rounded-2xl glass glass-hover px-5 py-3 text-sm font-medium",
						children: t
					})
				}, t))
			})]
		})
	})] });
}
function SiteFooter() {
	return /* @__PURE__ */ jsx("footer", {
		className: "relative border-t border-border py-14",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-4xl px-4 text-center",
			children: [
				/* @__PURE__ */ jsx("p", {
					className: "text-balance text-lg font-semibold",
					children: "AI-Based Lung Cancer Detection Mechanism Using Multimodal Medical Imaging"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm text-muted-foreground",
					children: "Built using Explainable AI and Deep Learning."
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground",
					children: "Research demonstration · Not a substitute for clinical diagnosis"
				})
			]
		})
	});
}
//#endregion
//#region src/components/site/AiAssistant.tsx
var CANNED = [
	{
		match: /grad-?cam|heatmap/i,
		reply: "Grad-CAM highlights the pixels that most influenced the classification. Warm regions in the overlay are the areas the network weighted highest — usually nodule margins and density changes."
	},
	{
		match: /dicom|upload|format/i,
		reply: "You can upload JPG, PNG, JPEG or DICOM files for both the CT scan and the chest X-ray."
	},
	{
		match: /accuracy|confidence|metric/i,
		reply: "On the held-out multimodal split the model reaches 99% accuracy, 98% sensitivity and 97% specificity, with temperature-scaled confidence outputs."
	},
	{
		match: /report|pdf/i,
		reply: "After analysis, click Download PDF Report. It includes patient details, prediction, confidence, stage, recommendations and a doctor notes section."
	}
];
function AiAssistant() {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState("");
	const [msgs, setMsgs] = useState([{
		role: "ai",
		text: "Hi — I'm the PulmoScan assistant. Ask me about the pipeline, Grad-CAM, or reports."
	}]);
	const send = () => {
		const q = input.trim();
		if (!q) return;
		const hit = CANNED.find((c) => c.match.test(q));
		setMsgs((m) => [
			...m,
			{
				role: "user",
				text: q
			},
			{
				role: "ai",
				text: hit?.reply ?? "This demo assistant covers uploads, preprocessing, multimodal fusion, Grad-CAM explainability and report export. Try asking about one of those."
			}
		]);
		setInput("");
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(motion.button, {
		type: "button",
		onClick: () => setOpen((v) => !v),
		"aria-label": "Open AI assistant",
		whileHover: { scale: 1.06 },
		whileTap: { scale: .95 },
		className: "fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-2xl bg-aurora text-primary-foreground shadow-[var(--glow-primary)]",
		children: open ? /* @__PURE__ */ jsx(X, { className: "size-5" }) : /* @__PURE__ */ jsx(Bot, { className: "size-5" })
	}), /* @__PURE__ */ jsx(AnimatePresence, { children: open ? /* @__PURE__ */ jsxs(motion.div, {
		initial: {
			opacity: 0,
			y: 20,
			scale: .96
		},
		animate: {
			opacity: 1,
			y: 0,
			scale: 1
		},
		exit: {
			opacity: 0,
			y: 20,
			scale: .96
		},
		transition: {
			duration: .3,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		className: "fixed bottom-24 right-6 z-50 flex h-[420px] w-[min(92vw,360px)] flex-col overflow-hidden rounded-3xl glass",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 border-b border-border px-4 py-3",
				children: [/* @__PURE__ */ jsx("span", { className: "size-2 rounded-full bg-success animate-pulse-glow" }), /* @__PURE__ */ jsx("p", {
					className: "text-sm font-semibold",
					children: "PulmoScan Assistant"
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex-1 space-y-3 overflow-y-auto px-4 py-4",
				children: msgs.map((m, i) => /* @__PURE__ */ jsx("div", {
					className: `max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "ai" ? "border border-border bg-secondary/60 text-foreground" : "ml-auto bg-aurora text-primary-foreground"}`,
					children: m.text
				}, i))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 border-t border-border p-3",
				children: [/* @__PURE__ */ jsx("input", {
					value: input,
					onChange: (e) => setInput(e.target.value),
					onKeyDown: (e) => e.key === "Enter" && send(),
					placeholder: "Ask about the AI pipeline…",
					className: "flex-1 rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-cyan/60"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: send,
					"aria-label": "Send message",
					className: "grid size-9 place-items-center rounded-xl bg-aurora text-primary-foreground",
					children: /* @__PURE__ */ jsx(Send, { className: "size-4" })
				})]
			})
		]
	}) : null })] });
}
//#endregion
//#region src/components/site/PatientLogin.tsx
function PatientLogin({ onContinue }) {
	const [name, setName] = useState("");
	const [patientId, setPatientId] = useState("");
	const [age, setAge] = useState("");
	const [sex, setSex] = useState("");
	const [error, setError] = useState("");
	function handleSubmit(event) {
		event.preventDefault();
		setError("");
		const numericAge = Number(age);
		if (!name.trim() || !patientId.trim() || !age || !sex) {
			setError("Please enter all patient details before continuing.");
			return;
		}
		if (!Number.isInteger(numericAge) || numericAge < 1 || numericAge > 120) {
			setError("Please enter a valid age between 1 and 120.");
			return;
		}
		onContinue({
			name: name.trim(),
			patientId: patientId.trim(),
			age: String(numericAge),
			sex
		});
	}
	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		const numericAge = Number(age);
		const normalizedId = patientId.trim().toUpperCase();
		if (!name.trim() || !normalizedId || !age || !sex) {
			setError("Please enter all patient details.");
			return;
		}
		if (!/^PUM\d{3}$/.test(normalizedId)) {
			setError("Invalid Patient ID. Use the format PUM001.");
			return;
		}
		if (!Number.isInteger(numericAge) || numericAge < 1 || numericAge > 120) {
			setError("Please enter a valid age between 1 and 120.");
			return;
		}
		try {
			const response = await fetch("http://127.0.0.1:8001/api/patient/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					patient_id: normalizedId,
					name: name.trim(),
					age: numericAge,
					sex
				})
			});
			const result = await response.json();
			if (!response.ok) {
				setError(result.detail || "Patient verification failed.");
				return;
			}
			onContinue({
				name: result.patient.name,
				patientId: result.patient.patient_id,
				age: String(result.patient.age),
				sex: result.patient.sex
			});
		} catch {
			setError("Cannot connect to the backend. Please ensure the server is running on port 8001.");
		}
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "relative min-h-screen overflow-hidden bg-background text-foreground",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "pointer-events-none absolute inset-0 overflow-hidden",
				children: [
					/* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" }),
					/* @__PURE__ */ jsx("div", { className: "absolute bottom-[-18rem] right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-violet/10 blur-3xl" }),
					/* @__PURE__ */ jsx("div", { className: "absolute left-[-14rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-cyan/5 blur-3xl" }),
					/* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(80,180,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(80,180,255,0.12)_1px,transparent_1px)] [background-size:64px_64px]" })
				]
			}),
			/* @__PURE__ */ jsxs("header", {
				className: "relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-7 lg:px-10",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ jsx("div", {
						className: "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-violet shadow-[0_0_30px_color-mix(in_oklab,var(--cyan)_35%,transparent)]",
						children: /* @__PURE__ */ jsx(Activity, { className: "h-6 w-6 text-slate-950" })
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
						className: "font-display text-lg font-bold tracking-tight",
						children: ["PulmoScan ", /* @__PURE__ */ jsx("span", {
							className: "text-cyan",
							children: "AI"
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground",
						children: "Multimodal Lung Intelligence"
					})] })]
				}), /* @__PURE__ */ jsx("div", {
					className: "hidden rounded-full border border-primary/20 bg-card/30 px-4 py-2 text-xs text-muted-foreground backdrop-blur md:block",
					children: "Secure Patient Access"
				})]
			}),
			/* @__PURE__ */ jsx("main", {
				className: "relative z-10 flex min-h-[calc(100vh-96px)] items-center justify-center px-5 pb-12 pt-2",
				children: /* @__PURE__ */ jsxs("div", {
					className: "grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20",
					children: [/* @__PURE__ */ jsxs("section", {
						className: "hidden lg:block",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-cyan",
								children: [/* @__PURE__ */ jsx("span", { className: "h-2 w-2 animate-pulse rounded-full bg-cyan" }), "Patient Screening Portal"]
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "max-w-2xl font-display text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl",
								children: [
									"Begin your",
									/* @__PURE__ */ jsx("br", {}),
									/* @__PURE__ */ jsx("span", {
										className: "bg-gradient-to-r from-cyan via-primary to-violet bg-clip-text text-transparent",
										children: "PulmoScan AI"
									}),
									/* @__PURE__ */ jsx("br", {}),
									"screening session."
								]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-7 max-w-xl text-base leading-7 text-muted-foreground",
								children: "Enter the patient details to securely begin the multimodal lung imaging assessment using chest X-ray and CT scan analysis."
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-10 grid max-w-xl grid-cols-3 gap-3",
								children: [
									["01", "Patient details"],
									["02", "Medical imaging"],
									["03", "AI assessment"]
								].map(([number, label]) => /* @__PURE__ */ jsxs("div", {
									className: "rounded-2xl border border-border/60 bg-card/30 p-4 backdrop-blur",
									children: [/* @__PURE__ */ jsx("div", {
										className: "font-mono text-xs text-cyan",
										children: number
									}), /* @__PURE__ */ jsx("div", {
										className: "mt-2 text-sm font-medium text-foreground",
										children: label
									})]
								}, number))
							})
						]
					}), /* @__PURE__ */ jsx("section", {
						className: "w-full max-w-xl justify-self-center",
						children: /* @__PURE__ */ jsxs("div", {
							className: "glass relative overflow-hidden rounded-3xl p-7 sm:p-9",
							children: [
								/* @__PURE__ */ jsx("div", { className: "absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan to-transparent" }),
								/* @__PURE__ */ jsxs("div", {
									className: "mb-8",
									children: [
										/* @__PURE__ */ jsx("div", {
											className: "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-cyan ring-1 ring-primary/20",
											children: /* @__PURE__ */ jsx(UserRound, { className: "h-6 w-6" })
										}),
										/* @__PURE__ */ jsx("h2", {
											className: "font-display text-2xl font-bold",
											children: "Patient Details"
										}),
										/* @__PURE__ */ jsx("p", {
											className: "mt-2 text-sm leading-6 text-muted-foreground",
											children: "Please enter the patient's details to continue to PulmoScan AI."
										})
									]
								}),
								/* @__PURE__ */ jsxs("form", {
									onSubmit: handleSubmit,
									className: "space-y-5",
									children: [
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
											htmlFor: "patient-name",
											className: "mb-2 block text-sm font-medium",
											children: "Patient Name"
										}), /* @__PURE__ */ jsxs("div", {
											className: "relative",
											children: [/* @__PURE__ */ jsx(UserRound, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ jsx("input", {
												id: "patient-name",
												value: name,
												onChange: (event) => setName(event.target.value),
												placeholder: "Enter patient name",
												autoComplete: "name",
												className: "h-12 w-full rounded-xl border border-border/70 bg-background/50 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-cyan/70 focus:ring-2 focus:ring-cyan/10"
											})]
										})] }),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
											htmlFor: "patient-id",
											className: "mb-2 block text-sm font-medium",
											children: "Patient ID"
										}), /* @__PURE__ */ jsxs("div", {
											className: "relative",
											children: [/* @__PURE__ */ jsx(IdCard, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ jsx("input", {
												id: "patient-id",
												value: patientId,
												onChange: (event) => setPatientId(event.target.value),
												placeholder: "Enter patient ID",
												autoComplete: "off",
												className: "h-12 w-full rounded-xl border border-border/70 bg-background/50 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-cyan/70 focus:ring-2 focus:ring-cyan/10"
											})]
										})] }),
										/* @__PURE__ */ jsxs("div", {
											className: "grid gap-5 sm:grid-cols-2",
											children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
												htmlFor: "patient-age",
												className: "mb-2 block text-sm font-medium",
												children: "Age"
											}), /* @__PURE__ */ jsxs("div", {
												className: "relative",
												children: [/* @__PURE__ */ jsx(CalendarDays, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ jsx("input", {
													id: "patient-age",
													type: "number",
													min: "1",
													max: "120",
													value: age,
													onChange: (event) => setAge(event.target.value),
													placeholder: "Age",
													className: "h-12 w-full rounded-xl border border-border/70 bg-background/50 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-cyan/70 focus:ring-2 focus:ring-cyan/10"
												})]
											})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
												htmlFor: "patient-sex",
												className: "mb-2 block text-sm font-medium",
												children: "Sex"
											}), /* @__PURE__ */ jsxs("select", {
												id: "patient-sex",
												value: sex,
												onChange: (event) => setSex(event.target.value),
												className: "h-12 w-full rounded-xl border border-border/70 bg-background/50 px-4 text-sm outline-none transition focus:border-cyan/70 focus:ring-2 focus:ring-cyan/10",
												children: [
													/* @__PURE__ */ jsx("option", {
														value: "",
														disabled: true,
														children: "Select sex"
													}),
													/* @__PURE__ */ jsx("option", {
														value: "Female",
														children: "Female"
													}),
													/* @__PURE__ */ jsx("option", {
														value: "Male",
														children: "Male"
													}),
													/* @__PURE__ */ jsx("option", {
														value: "Other",
														children: "Other"
													}),
													/* @__PURE__ */ jsx("option", {
														value: "Prefer not to say",
														children: "Prefer not to say"
													})
												]
											})] })]
										}),
										error && /* @__PURE__ */ jsx("div", {
											className: "rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-300",
											children: error
										}),
										/* @__PURE__ */ jsxs("button", {
											type: "submit",
											className: "group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-primary to-violet px-5 font-semibold text-slate-950 shadow-[0_0_35px_color-mix(in_oklab,var(--primary)_30%,transparent)] transition hover:-translate-y-0.5 hover:shadow-[0_0_45px_color-mix(in_oklab,var(--cyan)_35%,transparent)]",
											children: ["Continue to PulmoScan AI", /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5 transition-transform group-hover:translate-x-1" })]
										})
									]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-6 text-center text-xs leading-5 text-muted-foreground",
									children: "This page collects basic patient information for the current screening session."
								})
							]
						})
					})]
				})
			})
		]
	});
}
//#endregion
//#region src/routes/index.tsx?tsr-split=component
function Index() {
	const [patient, setPatient] = useState(null);
	if (!patient) return /* @__PURE__ */ jsx(PatientLogin, { onContinue: setPatient });
	return /* @__PURE__ */ jsxs("div", {
		className: "relative min-h-screen overflow-x-hidden",
		children: [
			/* @__PURE__ */ jsx(SiteNav, {}),
			/* @__PURE__ */ jsxs("main", { children: [
				/* @__PURE__ */ jsx(Hero, {}),
				/* @__PURE__ */ jsx(Features, {}),
				/* @__PURE__ */ jsx(HowItWorks, {}),
				/* @__PURE__ */ jsx(Detection, {}),
				/* @__PURE__ */ jsx(DoctorDashboard, {}),
				/* @__PURE__ */ jsx(Stats, {}),
				/* @__PURE__ */ jsx(AboutAndTech, {})
			] }),
			/* @__PURE__ */ jsx(SiteFooter, {}),
			/* @__PURE__ */ jsx(AiAssistant, {})
		]
	});
}
//#endregion
export { Index as component };
