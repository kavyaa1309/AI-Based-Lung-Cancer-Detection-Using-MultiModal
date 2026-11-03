import { FormEvent, useState } from "react";
import { Activity, ArrowRight, CalendarDays, IdCard, UserRound } from "lucide-react";

export type PatientDetails = {
  name: string;
  patientId: string;
  age: string;
  sex: string;
};

type PatientLoginProps = {
  onContinue: (details: PatientDetails) => void;
};

export function PatientLogin({ onContinue }: PatientLoginProps) {
  const [name, setName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      sex,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
          sex,
        }),
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
        sex: result.patient.sex,
      });
    } catch {
      setError("Cannot connect to the backend. Please ensure the server is running on port 8001.");
    }
  }


  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Same Neural Med background language as the main PulmoScan site */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-18rem] right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-violet/10 blur-3xl" />
        <div className="absolute left-[-14rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-cyan/5 blur-3xl" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(80,180,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(80,180,255,0.12)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-violet shadow-[0_0_30px_color-mix(in_oklab,var(--cyan)_35%,transparent)]">
            <Activity className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight">
              PulmoScan <span className="text-cyan">AI</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Multimodal Lung Intelligence
            </div>
          </div>
        </div>

        <div className="hidden rounded-full border border-primary/20 bg-card/30 px-4 py-2 text-xs text-muted-foreground backdrop-blur md:block">
          Secure Patient Access
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-96px)] items-center justify-center px-5 pb-12 pt-2">
        <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <section className="hidden lg:block">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-cyan">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan" />
              Patient Screening Portal
            </div>
            <h1 className="max-w-2xl font-display text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl">
              Begin your
              <br />
              <span className="bg-gradient-to-r from-cyan via-primary to-violet bg-clip-text text-transparent">
                PulmoScan AI
              </span>
              <br />
              screening session.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground">
              Enter the patient details to securely begin the multimodal lung
              imaging assessment using chest X-ray and CT scan analysis.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["01", "Patient details"],
                ["02", "Medical imaging"],
                ["03", "AI assessment"],
              ].map(([number, label]) => (
                <div key={number} className="rounded-2xl border border-border/60 bg-card/30 p-4 backdrop-blur">
                  <div className="font-mono text-xs text-cyan">{number}</div>
                  <div className="mt-2 text-sm font-medium text-foreground">{label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="w-full max-w-xl justify-self-center">
            <div className="glass relative overflow-hidden rounded-3xl p-7 sm:p-9">
              <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan to-transparent" />

              <div className="mb-8">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-cyan ring-1 ring-primary/20">
                  <UserRound className="h-6 w-6" />
                </div>
                <h2 className="font-display text-2xl font-bold">Patient Details</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Please enter the patient's details to continue to PulmoScan AI.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="patient-name" className="mb-2 block text-sm font-medium">
                    Patient Name
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="patient-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Enter patient name"
                      autoComplete="name"
                      className="h-12 w-full rounded-xl border border-border/70 bg-background/50 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-cyan/70 focus:ring-2 focus:ring-cyan/10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="patient-id" className="mb-2 block text-sm font-medium">
                    Patient ID
                  </label>
                  <div className="relative">
                    <IdCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="patient-id"
                      value={patientId}
                      onChange={(event) => setPatientId(event.target.value)}
                      placeholder="Enter patient ID"
                      autoComplete="off"
                      className="h-12 w-full rounded-xl border border-border/70 bg-background/50 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-cyan/70 focus:ring-2 focus:ring-cyan/10"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="patient-age" className="mb-2 block text-sm font-medium">
                      Age
                    </label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="patient-age"
                        type="number"
                        min="1"
                        max="120"
                        value={age}
                        onChange={(event) => setAge(event.target.value)}
                        placeholder="Age"
                        className="h-12 w-full rounded-xl border border-border/70 bg-background/50 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-cyan/70 focus:ring-2 focus:ring-cyan/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="patient-sex" className="mb-2 block text-sm font-medium">
                      Sex
                    </label>
                    <select
                      id="patient-sex"
                      value={sex}
                      onChange={(event) => setSex(event.target.value)}
                      className="h-12 w-full rounded-xl border border-border/70 bg-background/50 px-4 text-sm outline-none transition focus:border-cyan/70 focus:ring-2 focus:ring-cyan/10"
                    >
                      <option value="" disabled>
                        Select sex
                      </option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-primary to-violet px-5 font-semibold text-slate-950 shadow-[0_0_35px_color-mix(in_oklab,var(--primary)_30%,transparent)] transition hover:-translate-y-0.5 hover:shadow-[0_0_45px_color-mix(in_oklab,var(--cyan)_35%,transparent)]"
                >
                  Continue to PulmoScan AI
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </form>

              <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
                This page collects basic patient information for the current screening session.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
