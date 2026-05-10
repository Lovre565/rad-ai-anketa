import { cookies } from "next/headers";
import { getAdminSessionCookieName, isAdminSessionValid, supabaseRest } from "@/lib/supabase";
import type { AdminSubmission, AdminTaskAnswer } from "@/lib/types";

type LiteracyRow = {
  submission_id: string;
  knowledge_answers: Record<string, string>;
  behavior_answers: Record<string, string>;
  attitude_answers: Record<string, number>;
  score: number;
  created_at: string;
};

type FollowupRow = {
  submission_id: string;
  task_id: string;
  phase: string;
  question_id: string;
  answer_value: string;
  created_at: string;
};

export async function GET(request: Request) {
  if (!(await requireAdminSession())) {
    return new Response("Neispravna admin lozinka.", { status: 401 });
  }

  const submissions = await supabaseRest<AdminSubmission[]>(
    "submissions?select=id,created_at,study_group,age_group,gender,financial_literacy_score&order=created_at.asc",
    { method: "GET" }
  );
  const literacyRows = await supabaseRest<LiteracyRow[]>(
    "financial_literacy_answers?select=submission_id,knowledge_answers,behavior_answers,attitude_answers,score,created_at",
    { method: "GET" }
  );
  const taskRows = await supabaseRest<AdminTaskAnswer[]>(
    "task_answers?select=submission_id,task_id,phase,selected_option,explanation,elapsed_seconds,score,created_at",
    { method: "GET" }
  );
  const followupRows = await supabaseRest<FollowupRow[]>(
    "post_task_survey_answers?select=submission_id,task_id,phase,question_id,answer_value,created_at",
    { method: "GET" }
  );

  const csv = buildCsv(submissions, literacyRows, taskRows, followupRows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="eksperiment-ai-odgovori.csv"`
    }
  });
}

function buildCsv(
  submissions: AdminSubmission[],
  literacyRows: LiteracyRow[],
  taskRows: AdminTaskAnswer[],
  followupRows: FollowupRow[]
) {
  const literacyBySubmission = new Map(literacyRows.map((row) => [row.submission_id, row]));
  const taskBySubmission = groupBy(taskRows, (row) => row.submission_id);
  const followupBySubmission = groupBy(followupRows, (row) => row.submission_id);

  const dynamicColumns = new Set<string>();
  for (const row of literacyRows) {
    Object.keys(row.knowledge_answers ?? {}).forEach((key) => dynamicColumns.add(`knowledge_${key}`));
    Object.keys(row.behavior_answers ?? {}).forEach((key) => dynamicColumns.add(`behavior_${key}`));
    Object.keys(row.attitude_answers ?? {}).forEach((key) => dynamicColumns.add(`attitude_${key}`));
  }
  for (const row of taskRows) {
    dynamicColumns.add(`${row.task_id}_${row.phase}_option`);
    dynamicColumns.add(`${row.task_id}_${row.phase}_time_seconds`);
    dynamicColumns.add(`${row.task_id}_${row.phase}_score`);
    dynamicColumns.add(`${row.task_id}_${row.phase}_explanation`);
    dynamicColumns.add(`${row.task_id}_${row.phase}_stored_at`);
  }
  for (const row of followupRows) {
    dynamicColumns.add(`${row.task_id}_${row.phase}_${row.question_id}`);
    dynamicColumns.add(`${row.task_id}_${row.phase}_${row.question_id}_stored_at`);
  }

  const columns = [
    "submission_id",
    "created_at",
    "study_group",
    "age_group",
    "gender",
    "financial_literacy_score",
    "financial_literacy_stored_at",
    ...Array.from(dynamicColumns).sort()
  ];

  const lines = [columns.join(",")];
  for (const submission of submissions) {
    const values: Record<string, string | number> = {
      submission_id: submission.id,
      created_at: submission.created_at,
      study_group: submission.study_group,
      age_group: submission.age_group,
      gender: submission.gender,
      financial_literacy_score: submission.financial_literacy_score
    };

    const literacy = literacyBySubmission.get(submission.id);
    if (literacy) {
      values.financial_literacy_stored_at = literacy.created_at;
      Object.entries(literacy.knowledge_answers ?? {}).forEach(([key, value]) => (values[`knowledge_${key}`] = value));
      Object.entries(literacy.behavior_answers ?? {}).forEach(([key, value]) => (values[`behavior_${key}`] = value));
      Object.entries(literacy.attitude_answers ?? {}).forEach(([key, value]) => (values[`attitude_${key}`] = value));
    }

    for (const task of taskBySubmission.get(submission.id) ?? []) {
      values[`${task.task_id}_${task.phase}_option`] = task.selected_option;
      values[`${task.task_id}_${task.phase}_time_seconds`] = task.elapsed_seconds;
      values[`${task.task_id}_${task.phase}_score`] = task.score;
      values[`${task.task_id}_${task.phase}_explanation`] = task.explanation;
      values[`${task.task_id}_${task.phase}_stored_at`] = task.created_at;
    }

    for (const followup of followupBySubmission.get(submission.id) ?? []) {
      values[`${followup.task_id}_${followup.phase}_${followup.question_id}`] = followup.answer_value;
      values[`${followup.task_id}_${followup.phase}_${followup.question_id}_stored_at`] = followup.created_at;
    }

    lines.push(columns.map((column) => escapeCsv(values[column] ?? "")).join(","));
  }

  return `\uFEFF${lines.join("\n")}`;
}

function groupBy<T>(rows: T[], getKey: (row: T) => string) {
  return rows.reduce<Map<string, T[]>>((map, row) => {
    const key = getKey(row);
    map.set(key, [...(map.get(key) ?? []), row]);
    return map;
  }, new Map());
}

function escapeCsv(value: string | number) {
  const text = sanitizeSpreadsheetFormula(String(value));
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

async function requireAdminSession() {
  const cookieStore = await cookies();
  return isAdminSessionValid(cookieStore.get(getAdminSessionCookieName())?.value);
}

function sanitizeSpreadsheetFormula(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
