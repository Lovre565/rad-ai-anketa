import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSessionCookieName, isAdminSessionValid, supabaseRest } from "@/lib/supabase";
import type { AdminSubmission, AdminTaskAnswer } from "@/lib/types";

type FollowupRow = {
  submission_id: string;
  task_id: string;
  phase: string;
  question_id: string;
  answer_value: string;
};

export async function GET(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Neispravna admin lozinka." }, { status: 401 });
  }

  try {
    const submissions = await supabaseRest<AdminSubmission[]>(
      "submissions?select=id,created_at,study_group,age_group,gender,financial_literacy_score&order=created_at.desc",
      { method: "GET" }
    );
    const taskAnswers = await supabaseRest<AdminTaskAnswer[]>(
      "task_answers?select=submission_id,task_id,phase,selected_option,explanation,elapsed_seconds,score,created_at",
      { method: "GET" }
    );
    const followupAnswers = await supabaseRest<FollowupRow[]>(
      "post_task_survey_answers?select=submission_id,task_id,phase,question_id,answer_value",
      { method: "GET" }
    );

    return NextResponse.json(buildSummary(submissions, taskAnswers, followupAnswers));
  } catch (error) {
    console.error("Admin summary failed", error);
    return NextResponse.json(
      { error: "Admin statistika nije dostupna." },
      { status: 400 }
    );
  }
}

async function requireAdminSession() {
  const cookieStore = await cookies();
  return isAdminSessionValid(cookieStore.get(getAdminSessionCookieName())?.value);
}

function buildSummary(submissions: AdminSubmission[], taskAnswers: AdminTaskAnswer[], followupAnswers: FollowupRow[]) {
  const byTask = ["task1", "task2", "task3", "task4"].map((taskId) => {
    const rows = taskAnswers.filter((row) => row.task_id === taskId);
    const avgTime = average(rows.map((row) => row.elapsed_seconds));
    const avgScore = average(rows.map((row) => row.score));
    const times = rows.map((row) => row.elapsed_seconds);
    const distribution = rows.reduce<Record<string, number>>((acc, row) => {
      const key = `${row.phase}:${row.selected_option}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const phases = Array.from(new Set(rows.map((row) => row.phase))).sort().map((phase) => {
      const phaseRows = rows.filter((row) => row.phase === phase);
      return {
        phase,
        count: phaseRows.length,
        averageTimeSeconds: average(phaseRows.map((row) => row.elapsed_seconds)),
        medianTimeSeconds: median(phaseRows.map((row) => row.elapsed_seconds)),
        averageScore: average(phaseRows.map((row) => row.score)),
        distribution: countBy(phaseRows.map((row) => row.selected_option))
      };
    });

    return {
      taskId,
      count: rows.length,
      averageTimeSeconds: avgTime,
      medianTimeSeconds: median(times),
      minTimeSeconds: times.length ? Math.min(...times) : 0,
      maxTimeSeconds: times.length ? Math.max(...times) : 0,
      averageScore: avgScore,
      distribution,
      phases
    };
  });

  const byStudyGroup = submissions.reduce<Record<string, { count: number; averageFinancialLiteracy: number; averageTaskScore: number; averageTaskTimeSeconds: number }>>(
    (acc, submission) => {
      const group = submission.study_group;
      const existing = acc[group] ?? { count: 0, averageFinancialLiteracy: 0, averageTaskScore: 0, averageTaskTimeSeconds: 0 };
      const total = existing.averageFinancialLiteracy * existing.count + submission.financial_literacy_score;
      const groupSubmissionIds = submissions.filter((row) => row.study_group === group).map((row) => row.id);
      const groupTasks = taskAnswers.filter((row) => groupSubmissionIds.includes(row.submission_id));
      acc[group] = {
        count: existing.count + 1,
        averageFinancialLiteracy: round(total / (existing.count + 1)),
        averageTaskScore: average(groupTasks.map((row) => row.score)),
        averageTaskTimeSeconds: average(groupTasks.map((row) => row.elapsed_seconds))
      };
      return acc;
    },
    {}
  );
  const numericFollowups = followupAnswers
    .filter((row) => !row.question_id.startsWith("__") && /^[1-5]$/.test(row.answer_value))
    .reduce<Record<string, number[]>>((acc, row) => {
      const key = `${row.task_id}:${row.phase}:${row.question_id}`;
      acc[key] = [...(acc[key] ?? []), Number(row.answer_value)];
      return acc;
    }, {});

  return {
    submissionCount: submissions.length,
    taskAnswerCount: taskAnswers.length,
    averageFinancialLiteracyScore: average(submissions.map((row) => row.financial_literacy_score)),
    averageTaskScore: average(taskAnswers.map((row) => row.score)),
    averageTaskTimeSeconds: average(taskAnswers.map((row) => row.elapsed_seconds)),
    byStudyGroup,
    byTask,
    scaleAverages: Object.fromEntries(
      Object.entries(numericFollowups).map(([key, values]) => [key, { count: values.length, average: average(values) }])
    ),
    recentSubmissions: submissions.slice(0, 10)
  };
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  return round((sorted[middle - 1] + sorted[middle]) / 2);
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
