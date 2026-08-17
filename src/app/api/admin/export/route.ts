import { cookies } from "next/headers";
import { getAdminSessionCookieName, isAdminSessionValid, supabaseRest } from "@/lib/supabase";
import type { AdminSubmission, AdminTaskAnswer } from "@/lib/types";

type LiteracyRow = {
  submission_id: string;
  knowledge_answers: Record<string, string>;
  behavior_answers: Record<string, string>;
  attitude_answers: Record<string, number>;
  score: number;
};

type FollowupRow = {
  submission_id: string;
  task_id: string;
  phase: string;
  question_id: string;
  answer_value: string;
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
    "financial_literacy_answers?select=submission_id,knowledge_answers,behavior_answers,attitude_answers,score",
    { method: "GET" }
  );
  const taskRows = await supabaseRest<AdminTaskAnswer[]>(
    "task_answers?select=submission_id,task_id,phase,selected_option,explanation,elapsed_seconds,score,created_at",
    { method: "GET" }
  );
  const followupRows = await supabaseRest<FollowupRow[]>(
    "post_task_survey_answers?select=submission_id,task_id,phase,question_id,answer_value",
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
    dynamicColumns.add(`${row.task_id}_${row.phase}_answered_at`);
    dynamicColumns.add(`${row.task_id}_${row.phase}_time_seconds`);
    dynamicColumns.add(`${row.task_id}_${row.phase}_score`);
    dynamicColumns.add(`${row.task_id}_${row.phase}_explanation`);
  }
  for (const row of followupRows) {
    if (row.question_id.startsWith("__")) continue;
    dynamicColumns.add(`${row.task_id}_${row.phase}_${row.question_id}`);
  }

  const columns = [
    "submission_id",
    "created_at",
    "study_group",
    "age_group",
    "gender",
    "financial_literacy_score",
    "app_version",
    "data_status",
    "followup_missing_count",
    ...getPrimaryTaskColumns(),
    ...Array.from(dynamicColumns).sort().filter((column) => !getPrimaryTaskColumns().includes(column))
  ];

  const lines = [columns.join(",")];
  for (const submission of submissions) {
    const values: Record<string, string | number> = {
      submission_id: submission.id,
      created_at: submission.created_at,
      study_group: submission.study_group,
      age_group: submission.age_group,
      gender: submission.gender,
      financial_literacy_score: submission.financial_literacy_score,
      app_version: getAppVersion()
    };

    const literacy = literacyBySubmission.get(submission.id);
    if (literacy) {
      Object.entries(literacy.knowledge_answers ?? {}).forEach(([key, value]) => (values[`knowledge_${key}`] = value));
      Object.entries(literacy.behavior_answers ?? {}).forEach(([key, value]) => (values[`behavior_${key}`] = value));
      Object.entries(literacy.attitude_answers ?? {}).forEach(([key, value]) => (values[`attitude_${key}`] = value));
    }

    for (const task of taskBySubmission.get(submission.id) ?? []) {
      values[`${task.task_id}_${task.phase}_option`] = task.selected_option;
      values[`${task.task_id}_${task.phase}_answered_at`] = task.created_at;
      values[`${task.task_id}_${task.phase}_time_seconds`] = task.elapsed_seconds;
      values[`${task.task_id}_${task.phase}_score`] = task.score;
      values[`${task.task_id}_${task.phase}_explanation`] = task.explanation;
    }

    for (const followup of followupBySubmission.get(submission.id) ?? []) {
      if (followup.question_id === "__task_answered_at") {
        values[`${followup.task_id}_${followup.phase}_answered_at`] = followup.answer_value;
        continue;
      }
      if (followup.question_id.startsWith("__")) continue;
      values[`${followup.task_id}_${followup.phase}_${followup.question_id}`] = followup.answer_value;
    }

    const missingFollowups = countMissingFollowups(values);
    values.followup_missing_count = missingFollowups;
    values.data_status =
      missingFollowups === 0
        ? "OK"
        : "Fale dodatna pitanja koja nisu zapisana u bazu; glavni odgovori su spremljeni.";

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

function getPrimaryTaskColumns() {
  return [
    "task1_single_option",
    "task1_single_time_seconds",
    "task1_single_answered_at",
    "task1_single_score",
    "task1_single_explanation",
    "task2_single_option",
    "task2_single_time_seconds",
    "task2_single_answered_at",
    "task2_single_score",
    "task2_single_explanation",
    "task3_single_option",
    "task3_single_time_seconds",
    "task3_single_answered_at",
    "task3_single_score",
    "task3_single_explanation",
    "task4_before_ai_option",
    "task4_before_ai_time_seconds",
    "task4_before_ai_answered_at",
    "task4_before_ai_score",
    "task4_before_ai_explanation",
    "task4_after_ai_option",
    "task4_after_ai_time_seconds",
    "task4_after_ai_answered_at",
    "task4_after_ai_score",
    "task4_after_ai_explanation"
  ];
}

function countMissingFollowups(values: Record<string, string | number>) {
  return getRequiredFollowupColumns().filter((column) => values[column] === undefined || values[column] === "").length;
}

function getRequiredFollowupColumns() {
  return [
    "task1_single_confidence",
    "task1_single_difficulty",
    "task1_single_extra_sources",
    "task1_single_inflation",
    "task1_single_liquidity",
    "task1_single_risk",
    "task2_single_ai_reliance",
    "task2_single_availability",
    "task2_single_confidence",
    "task2_single_difficulty",
    "task2_single_info_influence",
    "task2_single_loss_risk",
    "task2_single_tax",
    "task2_single_used_internet",
    "task2_single_would_use_ai",
    "task3_single_ai_influence",
    "task3_single_ai_reliability",
    "task3_single_challenged_ai",
    "task3_single_confidence",
    "task3_single_difficulty",
    "task3_single_horizon",
    "task3_single_missing_info",
    "task3_single_payout_rules",
    "task3_single_risk_return",
    "task3_single_tax_incentives",
    "task3_single_used_ai",
    "task4_before_ai_missing_before_ai",
    "task4_after_ai_ai_influence",
    "task4_after_ai_ai_reliability",
    "task4_after_ai_challenged_ai",
    "task4_after_ai_confidence_with_ai",
    "task4_after_ai_confidence_without_ai",
    "task4_after_ai_difficulty_with_ai",
    "task4_after_ai_difficulty_without_ai",
    "task4_after_ai_loan_term_age",
    "task4_after_ai_monthly_credit_payment",
    "task4_after_ai_price_growth",
    "task4_after_ai_real_estate_tax"
  ];
}

async function requireAdminSession() {
  const cookieStore = await cookies();
  return isAdminSessionValid(cookieStore.get(getAdminSessionCookieName())?.value);
}

function sanitizeSpreadsheetFormula(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function getAppVersion() {
  return process.env.VERCEL_GIT_COMMIT_SHA ?? "local";
}
