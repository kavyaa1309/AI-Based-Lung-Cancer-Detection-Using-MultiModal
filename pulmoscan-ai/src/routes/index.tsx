import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site/SiteNav";
import { Hero } from "@/components/site/Hero";
import { Features } from "@/components/site/Features";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Detection } from "@/components/site/Detection";
import { DoctorDashboard } from "@/components/site/DoctorDashboard";
import { Stats, AboutAndTech, SiteFooter } from "@/components/site/Sections";
import { AiAssistant } from "@/components/site/AiAssistant";
import { PatientLogin, type PatientDetails } from "@/components/site/PatientLogin";

const title = "AI Lung Cancer Detection | Multimodal CT & X-ray Imaging";
const description =
  "Deep learning system fusing chest X-rays and CT scans for lung cancer detection with Grad-CAM explainability, confidence analysis and clinical PDF reports.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [patient, setPatient] = useState<PatientDetails | null>(null);

  if (!patient) {
    return <PatientLogin onContinue={setPatient} />;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <SiteNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Detection />
        <DoctorDashboard />
        <Stats />
        <AboutAndTech />
      </main>
      <SiteFooter />
      <AiAssistant />
    </div>
  );
}
