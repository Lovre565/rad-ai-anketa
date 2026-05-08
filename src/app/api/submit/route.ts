import { NextResponse } from "next/server";
import { scoreFinancialLiteracy, scoreTask } from "@/lib/scoring";
import { supabaseRest } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { SubmissionPayload } from "@/lib/types";
import { validateSubmissionPayload } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`submit:${ip}`, 12, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Previše pokušaja. Pokušajte kasnije." }, { status: 429 });
  }

  let submissionId: string | null = null;

  try {
    const payload = (await request.json()) as SubmissionPayload;
    validateSubmissionPayload(payload);

    const financialLiteracyScore = scoreFinancialLiteracy(payload.financialLiteracy);

    const submissions = await supabaseRest<Array<{ id: string }>>("submissions", {
      method: "POST",
      body: JSON.stringify({
        study_group: payload.demographics.studyGroup,
        age_group: payload.demographics.ageGroup,
        gender: payload.demographics.gender,
        consent: payload.consent,
        financial_literacy_score: financialLiteracyScore
      })
    });

    submissionId = submissions[0]?.id ?? null;
    if (!submissionId) {
      throw new Error("Supabase nije vratio submission id.");
    }

    await supabaseRest("financial_literacy_answers", {
      method: "POST",
      body: JSON.stringify({
        submission_id: submissionId,
        knowledge_answers: payload.financialLiteracy.knowledge,
        behavior_answers: payload.financialLiteracy.behavior,
        attitude_answers: payload.financialLiteracy.attitudes,
        score: financialLiteracyScore
      })
    });

    const taskRows = payload.tasks.map((task) => ({
      submission_id: submissionId,
      task_id: task.taskId,
      phase: task.phase,
      selected_option: task.selectedOption,
      explanation: task.explanation,
      elapsed_seconds: task.elapsedSeconds,
      score: scoreTask(task.taskId, task.selectedOption, task.explanation)
    }));

    await supabaseRest("task_answers", {
      method: "POST",
      body: JSON.stringify(taskRows)
    });

    const followupRows = payload.tasks.flatMap((task) =>
      Object.entries(task.followup).map(([questionId, value]) => ({
        submission_id: submissionId,
        task_id: task.taskId,
        phase: task.phase,
        question_id: questionId,
        answer_value: String(value)
      }))
    );

    if (followupRows.length > 0) {
      await supabaseRest("post_task_survey_answers", {
        method: "POST",
        body: JSON.stringify(followupRows)
      });
    }

    return NextResponse.json({ ok: true, id: submissionId });
  } catch (error) {
    console.error("Submit failed", error);
    if (submissionId) {
      try {
        await supabaseRest(`submissions?id=eq.${submissionId}`, {
          method: "DELETE",
          prefer: "return=minimal"
        });
      } catch (cleanupError) {
        console.error("Submit cleanup failed", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Predaja nije uspjela. Provjerite odgovore i pokušajte ponovno." },
      { status: 400 }
    );
  }
}
