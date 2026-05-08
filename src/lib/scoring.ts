import { financialAttitudes, financialBehavior, financialKnowledge } from "./experiment";
import type { FinancialLiteracyAnswer } from "./types";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const hasAny = (text: string, words: string[]) => words.some((word) => text.includes(word));

export function scoreFinancialLiteracy(answers: FinancialLiteracyAnswer): number {
  const knowledgeScore = financialKnowledge.reduce((sum, question) => {
    return sum + (answers.knowledge[question.id] === question.correct ? 1 : 0);
  }, 0);

  const behaviorScore = financialBehavior.reduce((sum, question) => {
    return sum + (answers.behavior[question.id] === "da" ? 1 : 0);
  }, 0);

  const attitudeValues = financialAttitudes
    .map((question) => Number(answers.attitudes[question.id] ?? 0))
    .filter((value) => value > 0);
  const attitudeAverage =
    attitudeValues.length > 0
      ? attitudeValues.reduce((sum, value) => sum + value, 0) / attitudeValues.length
      : 0;
  const attitudeScore = Math.max(0, Math.min(5, Math.round(6 - attitudeAverage)));

  return knowledgeScore + behaviorScore + attitudeScore;
}

export function scoreTask(taskId: string, selectedOption: string, explanation: string): number {
  const text = normalize(explanation);

  if (taskId === "task1") {
    let score = 0;
    if (hasAny(text, ["inflacij", "realn", "vrijednost novca"])) score += 1;
    if (hasAny(text, ["likvid", "dostup", "ranij", "povlacen", "auto", "automobil"])) score += 1;
    if (hasAny(text, ["rizik", "pad vrijednosti", "gubitak"])) score += 1;
    if (hasAny(text, ["cilj", "umjeren", "uskla", "4 godine", "cetiri godine"])) score += 1;
    if (selectedOption === "C") score += 1;
    return clampScore(score);
  }

  if (taskId === "task2") {
    let score = 0;
    if (hasAny(text, ["prinos", "kamat", "3,6", "3.6", "3,3", "3.3"])) score += 1;
    if (hasAny(text, ["nizak rizik", "sigurn", "ne pada", "drzavn", "banka"])) score += 1;
    if (hasAny(text, ["porez", "neto", "oporez", "nakon poreza"])) score += 1;
    if (hasAny(text, ["izvor", "internet", "provjer", "hanfa", "ministar", "banka", "trezorsk"])) score += 1;
    if (selectedOption === "B") score += 1;
    return clampScore(score);
  }

  if (taskId === "task3") {
    let score = 0;
    if (hasAny(text, ["dugoroc", "30 godina", "mirovin", "horizont"])) score += 1;
    if (hasAny(text, ["rizik", "prinos", "oscilacij", "pad vrijednosti"])) score += 1;
    if (hasAny(text, ["poticaj", "porez", "porezn", "drzavn"])) score += 1;
    if (hasAny(text, ["isplat", "ogranicen", "pravila", "dostupnost"])) score += 1;
    if (selectedOption === "B") score += 1;
    return clampScore(score);
  }

  if (taskId === "task4") {
    let score = 0;
    if (hasAny(text, ["rast cijena", "cijene stan", "nekretnin", "3%"])) score += 1;
    if (hasAny(text, ["porez", "trosk", "kupnje", "notar", "agencij"])) score += 1;
    if (hasAny(text, ["45", "dob", "mirovin", "rok otplate", "kredit"])) score += 1;
    if (hasAny(text, ["rizik", "prinos", "obveznick", "etf", "pad vrijednosti"])) score += 1;
    if (explanation.trim().length >= 80) score += 1;
    return clampScore(score);
  }

  return 0;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(5, score));
}
