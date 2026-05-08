import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSessionCookieName, isAdminSessionValid, supabaseRest } from "@/lib/supabase";
import type { AdminSubmission, AdminTaskAnswer } from "@/lib/types";

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
      "task_answers?select=submission_id,task_id,phase,selected_option,explanation,elapsed_seconds,score",
      { method: "GET" }
    );

    return NextResponse.json(buildSummary(submissions, taskAnswers));
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

function buildSummary(submissions: AdminSubmission[], taskAnswers: AdminTaskAnswer[]) {
  const byTask = ["task1", "task2", "task3", "task4"].map((taskId) => {
    const rows = taskAnswers.filter((row) => row.task_id === taskId);
    const avgTime = average(rows.map((row) => row.elapsed_seconds));
    const avgScore = average(rows.map((row) => row.score));
    const distribution = rows.reduce<Record<string, number>>((acc, row) => {
      const key = `${row.phase}:${row.selected_option}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return {
      taskId,
      count: rows.length,
      averageTimeSeconds: avgTime,
      averageScore: avgScore,
      distribution
    };
  });

  const byStudyGroup = submissions.reduce<Record<string, { count: number; averageFinancialLiteracy: number }>>(
    (acc, submission) => {
      const group = submission.study_group;
      const existing = acc[group] ?? { count: 0, averageFinancialLiteracy: 0 };
      const total = existing.averageFinancialLiteracy * existing.count + submission.financial_literacy_score;
      acc[group] = { count: existing.count + 1, averageFinancialLiteracy: round(total / (existing.count + 1)) };
      return acc;
    },
    {}
  );

  return {
    submissionCount: submissions.length,
    averageFinancialLiteracyScore: average(submissions.map((row) => row.financial_literacy_score)),
    byStudyGroup,
    byTask,
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
