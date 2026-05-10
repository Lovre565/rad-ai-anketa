import { financialAttitudes, financialBehavior, financialKnowledge, tasks } from "./experiment";
import type { FinancialLiteracyAnswer, SubmissionPayload, TaskAnswer } from "./types";

const MAX_STUDY_GROUP_LENGTH = 80;
const MIN_TEXT_LENGTH = 10;
const MAX_TEXT_LENGTH = 1500;
const MAX_ELAPSED_SECONDS = 60 * 60 * 3;

export function validateSubmissionPayload(payload: SubmissionPayload): void {
  if (!payload || typeof payload !== "object") throw new Error("Neispravan payload.");
  if (!payload.consent) throw new Error("Pristanak je obavezan.");
  validateDemographics(payload.demographics);
  validateFinancialLiteracy(payload.financialLiteracy);
  validateTasks(payload.tasks);
}

function validateDemographics(demographics: SubmissionPayload["demographics"]) {
  if (!demographics || typeof demographics !== "object") throw new Error("Nedostaju demografski podaci.");
  validateShortText(demographics.studyGroup, "Studij/skupina", MAX_STUDY_GROUP_LENGTH);
  validateAge(demographics.ageGroup);
  if (!["zenski", "muski", "ne_zelim_odgovoriti"].includes(demographics.gender)) {
    throw new Error("Neispravan spol.");
  }
}

function validateFinancialLiteracy(answers: FinancialLiteracyAnswer) {
  if (!answers || typeof answers !== "object") throw new Error("Nedostaju odgovori financijske pismenosti.");

  for (const question of financialKnowledge) {
    if (!question.choices.some((choice) => choice.value === answers.knowledge?.[question.id])) {
      throw new Error("Neispravan odgovor u financijskom znanju.");
    }
  }

  for (const question of financialBehavior) {
    if (!["da", "ne"].includes(answers.behavior?.[question.id])) {
      throw new Error("Neispravan odgovor u financijskom ponašanju.");
    }
  }

  for (const question of financialAttitudes) {
    if (!isScaleValue(answers.attitudes?.[question.id])) {
      throw new Error("Neispravan odgovor u financijskim stavovima.");
    }
  }
}

function validateTasks(taskAnswers: TaskAnswer[]) {
  if (!Array.isArray(taskAnswers)) throw new Error("Nedostaju odgovori na zadatke.");

  const required = tasks.flatMap((task) => task.phases.map((phase) => `${task.id}:${phase}`));
  const seen = new Set<string>();

  for (const answer of taskAnswers) {
    const task = tasks.find((candidate) => candidate.id === answer.taskId);
    if (!task) throw new Error("Neispravan zadatak.");
    if (!(task.phases as readonly string[]).includes(answer.phase)) throw new Error("Neispravna faza zadatka.");
    if (!task.options.some((option) => option.value === answer.selectedOption)) throw new Error("Neispravna opcija zadatka.");
    validateShortText(answer.explanation, "Obrazloženje", MAX_TEXT_LENGTH, MIN_TEXT_LENGTH);
    if (!Number.isInteger(answer.elapsedSeconds) || answer.elapsedSeconds < 0 || answer.elapsedSeconds > MAX_ELAPSED_SECONDS) {
      throw new Error("Neispravno vrijeme rješavanja.");
    }
    validateIsoDate(answer.answeredAt, "Vrijeme odgovora");
    if (answer.followupAnsweredAt !== undefined) validateIsoDate(answer.followupAnsweredAt, "Vrijeme dodatnih pitanja");

    const key = `${answer.taskId}:${answer.phase}`;
    if (seen.has(key)) throw new Error("Duplicirani odgovor zadatka.");
    seen.add(key);
    validateFollowups(task, answer);
  }

  if (required.some((key) => !seen.has(key)) || seen.size !== required.length) {
    throw new Error("Nedostaju odgovori na zadatke.");
  }
}

function validateFollowups(task: (typeof tasks)[number], answer: TaskAnswer) {
  const followups =
    task.id === "task4" && answer.phase === "before_ai"
      ? task.followups.filter((question) => question.id === "missing_before_ai")
      : task.id === "task4"
        ? task.followups.filter((question) => question.id !== "missing_before_ai")
        : task.followups;

  for (const question of followups) {
    const value = answer.followup?.[question.id];
    if (question.type === "scale") {
      if (!isScaleValue(value)) throw new Error("Neispravan odgovor na skali.");
    } else if (question.type === "text") {
      validateShortText(String(value ?? ""), "Otvoreni odgovor", MAX_TEXT_LENGTH, MIN_TEXT_LENGTH);
    } else if (!question.choices.some((choice) => choice.value === value)) {
      throw new Error("Neispravan dodatni odgovor.");
    }
  }
}

function isScaleValue(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}

function validateShortText(value: unknown, label: string, maxLength: number, minLength = 1) {
  if (typeof value !== "string") throw new Error(`${label} nije tekst.`);
  const trimmed = value.trim();
  if (trimmed.length < minLength) throw new Error(`${label} je prekratak.`);
  if (trimmed.length > maxLength) throw new Error(`${label} je predug.`);
}

function validateAge(value: unknown) {
  if (typeof value !== "string") throw new Error("Dob nije tekst.");
  if (!/^\d{1,3}$/.test(value.trim())) throw new Error("Neispravna dob.");
  const age = Number(value);
  if (!Number.isInteger(age) || age < 16 || age > 100) throw new Error("Neispravna dob.");
}

function validateIsoDate(value: unknown, label: string) {
  if (typeof value !== "string") throw new Error(`${label} nije tekst.`);
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new Error(`${label} nije ispravno.`);
}
