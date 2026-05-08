create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  study_group text not null,
  age_group text not null,
  gender text not null,
  consent boolean not null default false,
  financial_literacy_score integer not null check (financial_literacy_score between 0 and 21)
);

create table if not exists public.financial_literacy_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  knowledge_answers jsonb not null,
  behavior_answers jsonb not null,
  attitude_answers jsonb not null,
  score integer not null check (score between 0 and 21),
  created_at timestamptz not null default now()
);

create table if not exists public.task_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  task_id text not null check (task_id in ('task1', 'task2', 'task3', 'task4')),
  phase text not null check (phase in ('single', 'before_ai', 'after_ai')),
  selected_option text not null,
  explanation text not null,
  elapsed_seconds integer not null check (elapsed_seconds >= 0),
  score integer not null check (score between 0 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.post_task_survey_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  task_id text not null check (task_id in ('task1', 'task2', 'task3', 'task4')),
  phase text not null check (phase in ('single', 'before_ai', 'after_ai')),
  question_id text not null,
  answer_value text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_submissions_created_at on public.submissions(created_at);
create index if not exists idx_submissions_study_group on public.submissions(study_group);
create index if not exists idx_task_answers_submission_id on public.task_answers(submission_id);
create index if not exists idx_task_answers_task_phase on public.task_answers(task_id, phase);
create index if not exists idx_post_task_answers_submission_id on public.post_task_survey_answers(submission_id);

alter table public.submissions enable row level security;
alter table public.financial_literacy_answers enable row level security;
alter table public.task_answers enable row level security;
alter table public.post_task_survey_answers enable row level security;

-- The Next.js API uses SUPABASE_SERVICE_ROLE_KEY on the server, so no public RLS policies are required.
