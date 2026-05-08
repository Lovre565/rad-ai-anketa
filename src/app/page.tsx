"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Send } from "lucide-react";
import {
  financialAttitudes,
  financialBehavior,
  financialKnowledge,
  tasks,
  yesNoChoices
} from "@/lib/experiment";
import { scoreFinancialLiteracy, scoreTask } from "@/lib/scoring";
import type { FinancialLiteracyAnswer, SubmissionPayload, TaskAnswer } from "@/lib/types";

type Step = "intro" | "literacy" | "task" | "done";

const blankLiteracy: FinancialLiteracyAnswer = {
  knowledge: {},
  behavior: {},
  attitudes: {}
};

export default function HomePage() {
  const [step, setStep] = useState<Step>("intro");
  const [taskIndex, setTaskIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [demographics, setDemographics] = useState({ studyGroup: "", ageGroup: "", gender: "" });
  const [consent, setConsent] = useState(false);
  const [literacy, setLiteracy] = useState<FinancialLiteracyAnswer>(blankLiteracy);
  const [tasksAnswers, setTasksAnswers] = useState<TaskAnswer[]>([]);
  const [currentTaskForm, setCurrentTaskForm] = useState({
    selectedOption: "",
    explanation: "",
    followup: {} as Record<string, string | number>
  });

  const currentTask = tasks[taskIndex];
  const currentPhase = currentTask?.phases[phaseIndex] ?? "single";
  const totalSteps = 1 + tasks.reduce((sum, task) => sum + task.phases.length, 0) + 1;
  const completedTaskPhases = tasksAnswers.length;
  const currentStepNumber = step === "intro" ? 1 : step === "literacy" ? 2 : 3 + completedTaskPhases;
  const progress = Math.min(100, Math.round((currentStepNumber / totalSteps) * 100));
  const elapsedSeconds = startedAt ? Math.max(0, Math.round((tick - startedAt) / 1000)) : 0;

  useEffect(() => {
    if (step !== "task") return;
    setStartedAt(Date.now());
    setCurrentTaskForm({ selectedOption: "", explanation: "", followup: {} });
  }, [step, taskIndex, phaseIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const literacyScore = useMemo(() => scoreFinancialLiteracy(literacy), [literacy]);

  function canContinueIntro() {
    return Boolean(consent && demographics.studyGroup.trim() && demographics.ageGroup && demographics.gender);
  }

  function canContinueLiteracy() {
    return (
      financialKnowledge.every((question) => literacy.knowledge[question.id]) &&
      financialBehavior.every((question) => literacy.behavior[question.id]) &&
      financialAttitudes.every((question) => literacy.attitudes[question.id])
    );
  }

  function canSubmitTask() {
    const followups = getFollowupsForPhase(currentTask, currentPhase);
    return (
      currentTaskForm.selectedOption &&
      isValidTextLength(currentTaskForm.explanation) &&
      followups.every((question) => {
        const value = currentTaskForm.followup[question.id];
        if (question.type === "text") return isValidTextLength(String(value ?? ""));
        return value !== undefined && value !== "";
      })
    );
  }

  async function submitTaskPhase() {
    if (!canSubmitTask()) {
      setError("Odaberite opciju, napišite obrazloženje od 50 do 1500 znakova i odgovorite na sva dodatna pitanja.");
      return;
    }

    const answer: TaskAnswer = {
      taskId: currentTask.id,
      phase: currentPhase,
      selectedOption: currentTaskForm.selectedOption,
      explanation: currentTaskForm.explanation.trim(),
      elapsedSeconds,
      followup: currentTaskForm.followup,
      score: scoreTask(currentTask.id, currentTaskForm.selectedOption, currentTaskForm.explanation)
    };

    const nextAnswers = [...tasksAnswers, answer];
    setTasksAnswers(nextAnswers);
    setError("");

    if (phaseIndex + 1 < currentTask.phases.length) {
      setPhaseIndex(phaseIndex + 1);
      return;
    }

    if (taskIndex + 1 < tasks.length) {
      setTaskIndex(taskIndex + 1);
      setPhaseIndex(0);
      return;
    }

    await submitAll(nextAnswers);
  }

  function continueIntro() {
    if (!canContinueIntro()) {
      setError("Upišite studij, odaberite dobnu skupinu i spol te označite pristanak.");
      return;
    }
    setError("");
    setStep("literacy");
  }

  function continueLiteracy() {
    if (!canContinueLiteracy()) {
      setError("Odgovorite na sva pitanja iz testa financijske pismenosti.");
      return;
    }
    setError("");
    setStep("task");
  }

  async function submitAll(finalTaskAnswers: TaskAnswer[]) {
    setSubmitting(true);
    setError("");

    const payload: SubmissionPayload = {
      demographics,
      consent,
      financialLiteracy: literacy,
      financialLiteracyScore: literacyScore,
      tasks: finalTaskAnswers
    };

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error ?? "Predaja nije uspjela.");
      }

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Predaja nije uspjela.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <div className="container">
        <div className="topbar">
          <div className="brand">
            <span className="eyebrow">Istraživanje</span>
            <h1>Eksperiment financijskog odlučivanja</h1>
          </div>
          <a className="button secondary" href="/admin">Admin</a>
        </div>

        <div className="panel section">
          <div className="progress" aria-label="Napredak">
            <span style={{ width: `${progress}%` }} />
          </div>

          {step === "intro" && (
            <IntroStep
              demographics={demographics}
              setDemographics={setDemographics}
              consent={consent}
              setConsent={setConsent}
              onNext={continueIntro}
            />
          )}

          {step === "literacy" && (
            <LiteracyStep
              literacy={literacy}
              setLiteracy={setLiteracy}
              onNext={continueLiteracy}
            />
          )}

          {step === "task" && currentTask && (
            <TaskStep
              task={currentTask}
              phase={currentPhase}
              form={currentTaskForm}
              setForm={setCurrentTaskForm}
              elapsedSeconds={elapsedSeconds}
              submitting={submitting}
              isLast={taskIndex === tasks.length - 1 && phaseIndex === currentTask.phases.length - 1}
              onSubmit={submitTaskPhase}
            />
          )}

          {step === "done" && (
            <section className="section">
              <h2>Hvala na sudjelovanju.</h2>
              <p className="muted">Vaši odgovori su spremljeni anonimno. Možete zatvoriti ovu stranicu.</p>
            </section>
          )}

          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </main>
  );
}

function IntroStep({
  demographics,
  setDemographics,
  consent,
  setConsent,
  onNext
}: {
  demographics: { studyGroup: string; ageGroup: string; gender: string };
  setDemographics: (value: { studyGroup: string; ageGroup: string; gender: string }) => void;
  consent: boolean;
  setConsent: (value: boolean) => void;
  onNext: () => void;
}) {
  return (
    <section className="section">
      <div>
        <h2>Upute i pristanak</h2>
        <p className="muted">
          Istraživanje se provodi anonimno. Ne prikupljaju se ime, prezime, e-mail ni studentski broj.
          Odgovori će se koristiti za analizu utjecaja AI podrške na financijsko odlučivanje.
        </p>
      </div>
      <div className="grid two">
        <label className="field">
          <span className="label">Studij/skupina</span>
          <input
            className="input"
            value={demographics.studyGroup}
            onChange={(event) => setDemographics({ ...demographics, studyGroup: event.target.value })}
            placeholder="Npr. Poslovna ekonomija, Računarstvo..."
          />
        </label>
        <label className="field">
          <span className="label">Dobna skupina</span>
          <select
            className="select"
            value={demographics.ageGroup}
            onChange={(event) => setDemographics({ ...demographics, ageGroup: event.target.value })}
          >
            <option value="">Odaberite</option>
            <option value="18_21">18-21</option>
            <option value="22_25">22-25</option>
            <option value="26_30">26-30</option>
            <option value="31_plus">31+</option>
          </select>
        </label>
        <label className="field">
          <span className="label">Spol</span>
          <select
            className="select"
            value={demographics.gender}
            onChange={(event) => setDemographics({ ...demographics, gender: event.target.value })}
          >
            <option value="">Odaberite</option>
            <option value="zenski">Ženski</option>
            <option value="muski">Muški</option>
            <option value="ne_zelim_odgovoriti">Ne želim odgovoriti</option>
          </select>
        </label>
      </div>
      <label className="choice">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        <span>Dobrovoljno pristajem sudjelovati u anonimnom istraživanju.</span>
      </label>
      <div className="actions">
        <span className="muted">Za nastavak ispunite sva polja i označite pristanak.</span>
        <button className="button" onClick={onNext}>Nastavi</button>
      </div>
    </section>
  );
}

function LiteracyStep({
  literacy,
  setLiteracy,
  onNext
}: {
  literacy: FinancialLiteracyAnswer;
  setLiteracy: (value: FinancialLiteracyAnswer) => void;
  onNext: () => void;
}) {
  return (
    <section className="section">
      <div>
        <h2>Test financijske pismenosti</h2>
        <p className="muted">Odgovorite na sva pitanja. Bodovanje se računa automatski.</p>
      </div>
      <h3>Financijsko znanje</h3>
      {financialKnowledge.map((question) => (
        <QuestionChoices
          key={question.id}
          title={question.text}
          value={literacy.knowledge[question.id] ?? ""}
          choices={question.choices}
          onChange={(value) =>
            setLiteracy({ ...literacy, knowledge: { ...literacy.knowledge, [question.id]: value } })
          }
        />
      ))}

      <h3>Financijsko ponašanje</h3>
      {financialBehavior.map((question) => (
        <QuestionChoices
          key={question.id}
          title={question.text}
          value={literacy.behavior[question.id] ?? ""}
          choices={yesNoChoices}
          onChange={(value) =>
            setLiteracy({ ...literacy, behavior: { ...literacy.behavior, [question.id]: value } })
          }
        />
      ))}

      <h3>Financijski stavovi</h3>
      {financialAttitudes.map((question) => (
        <ScaleInput
          key={question.id}
          title={question.text}
          minLabel={question.minLabel}
          maxLabel={question.maxLabel}
          value={literacy.attitudes[question.id]}
          onChange={(value) =>
            setLiteracy({ ...literacy, attitudes: { ...literacy.attitudes, [question.id]: value } })
          }
        />
      ))}

      <div className="actions">
        <span className="muted">Sva pitanja su obavezna.</span>
        <button className="button" onClick={onNext}>Nastavi na zadatke</button>
      </div>
    </section>
  );
}

function TaskStep({
  task,
  phase,
  form,
  setForm,
  elapsedSeconds,
  submitting,
  isLast,
  onSubmit
}: {
  task: (typeof tasks)[number];
  phase: "single" | "before_ai" | "after_ai";
  form: { selectedOption: string; explanation: string; followup: Record<string, string | number> };
  setForm: (value: { selectedOption: string; explanation: string; followup: Record<string, string | number> }) => void;
  elapsedSeconds: number;
  submitting: boolean;
  isLast: boolean;
  onSubmit: () => void;
}) {
  const phaseLabel =
    phase === "before_ai" ? "Prvi odgovor bez AI-a" : phase === "after_ai" ? "Drugi odgovor uz AI" : "Odgovor";
  const followups = getFollowupsForPhase(task, phase);

  return (
    <section className="section">
      <div className="topbar">
        <div>
          <span className="eyebrow">{phaseLabel}</span>
          <h2>{task.title}</h2>
        </div>
        <span className="timer"><Clock size={18} /> {elapsedSeconds}s</span>
      </div>
      <div className="callout">{task.instruction}</div>
      <p>{task.scenario}</p>
      <QuestionChoices
        title={task.question}
        value={form.selectedOption}
        choices={task.options}
        onChange={(value) => setForm({ ...form, selectedOption: value })}
      />
      <label className="field">
        <span className="label">Obrazložite svoju odluku</span>
        <textarea
          className="textarea"
          maxLength={1500}
          value={form.explanation}
          onChange={(event) => setForm({ ...form, explanation: event.target.value })}
          placeholder="Napišite zašto ste odabrali tu opciju."
        />
        <CharacterCounter value={form.explanation} />
      </label>
      {followups.length > 0 && <h3>Dodatna pitanja</h3>}
      {followups.map((question) => {
        if (question.type === "scale") {
          return (
            <ScaleInput
              key={question.id}
              title={question.text}
              minLabel={question.minLabel}
              maxLabel={question.maxLabel}
              value={Number(form.followup[question.id] ?? 0) || undefined}
              onChange={(value) => setForm({ ...form, followup: { ...form.followup, [question.id]: value } })}
            />
          );
        }
        if (question.type === "text") {
          return (
            <label className="field" key={question.id}>
              <span className="label">{question.text}</span>
              <textarea
                className="textarea"
                maxLength={1500}
                value={String(form.followup[question.id] ?? "")}
                onChange={(event) => setForm({ ...form, followup: { ...form.followup, [question.id]: event.target.value } })}
              />
              <CharacterCounter value={String(form.followup[question.id] ?? "")} />
            </label>
          );
        }
        return (
          <QuestionChoices
            key={question.id}
            title={question.text}
            value={String(form.followup[question.id] ?? "")}
            choices={question.choices}
            onChange={(value) => setForm({ ...form, followup: { ...form.followup, [question.id]: value } })}
          />
        );
      })}
      <div className="actions">
        <span className="muted">Timer se sprema nakon predaje ovog ekrana.</span>
        <button className="button" disabled={submitting} onClick={onSubmit}>
          <Send size={18} /> {isLast ? "Predaj anketu" : "Spremi i nastavi"}
        </button>
      </div>
    </section>
  );
}

function getFollowupsForPhase(task: (typeof tasks)[number], phase: "single" | "before_ai" | "after_ai") {
  if (task.id !== "task4") return task.followups;
  if (phase === "before_ai") {
    return task.followups.filter((question) => question.id === "missing_before_ai");
  }
  return task.followups.filter((question) => question.id !== "missing_before_ai");
}

function isValidTextLength(value: string) {
  const length = value.trim().length;
  return length >= 50 && length <= 1500;
}

function CharacterCounter({ value }: { value: string }) {
  const length = value.trim().length;
  const remaining = Math.max(0, 1500 - value.length);
  const isTooShort = length > 0 && length < 50;
  return (
    <span className={isTooShort ? "hint error-text" : "hint"}>
      {length}/1500 znakova. Minimalno 50, preostalo {remaining}.
    </span>
  );
}

function QuestionChoices({
  title,
  choices,
  value,
  onChange
}: {
  title: string;
  choices: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const name = title.replace(/\W+/g, "_");
  return (
    <div className="field">
      <span className="label">{title}</span>
      <div className="choice-list">
        {choices.map((choice) => (
          <label className="choice" key={choice.value}>
            <input
              type="radio"
              name={name}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
            />
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ScaleInput({
  title,
  minLabel,
  maxLabel,
  value,
  onChange
}: {
  title: string;
  minLabel: string;
  maxLabel: string;
  value?: number;
  onChange: (value: number) => void;
}) {
  const name = title.replace(/\W+/g, "_");
  return (
    <div className="scale">
      <span className="label">{title}</span>
      <div className="scale-options">
        {[1, 2, 3, 4, 5].map((number) => (
          <label key={number}>
            <input
              type="radio"
              name={name}
              checked={value === number}
              onChange={() => onChange(number)}
            />
            {number}
          </label>
        ))}
      </div>
      <span className="muted">{minLabel} | {maxLabel}</span>
    </div>
  );
}
