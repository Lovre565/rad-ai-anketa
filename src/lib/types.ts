export type Choice = {
  value: string;
  label: string;
};

export type ScaleQuestion = {
  id: string;
  text: string;
  minLabel: string;
  maxLabel: string;
};

export type FinancialLiteracyAnswer = {
  knowledge: Record<string, string>;
  behavior: Record<string, string>;
  attitudes: Record<string, number>;
};

export type TaskAnswer = {
  taskId: string;
  phase: "single" | "before_ai" | "after_ai";
  selectedOption: string;
  explanation: string;
  elapsedSeconds: number;
  answeredAt: string;
  followup: Record<string, string | number>;
  score: number;
};

export type SubmissionPayload = {
  demographics: {
    studyGroup: string;
    ageGroup: string;
    gender: string;
  };
  consent: boolean;
  financialLiteracy: FinancialLiteracyAnswer;
  financialLiteracyScore: number;
  tasks: TaskAnswer[];
};

export type AdminSubmission = {
  id: string;
  created_at: string;
  study_group: string;
  age_group: string;
  gender: string;
  financial_literacy_score: number;
};

export type AdminTaskAnswer = {
  submission_id: string;
  task_id: string;
  phase: string;
  selected_option: string;
  explanation: string;
  elapsed_seconds: number;
  score: number;
  created_at: string;
};
