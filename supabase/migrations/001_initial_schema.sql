-- =============================================
-- EstudiApp — Schema inicial
-- =============================================

-- Enums
create type material_type as enum ('pdf', 'youtube', 'text', 'image');
create type material_status as enum ('pending', 'processing', 'ready', 'error');
create type question_type as enum ('multiple_choice', 'short_answer', 'true_false');
create type question_difficulty as enum ('easy', 'medium', 'hard');

-- =============================================
-- profiles
-- =============================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  timezone    text not null default 'UTC',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- subjects (materias)
-- =============================================
create table public.subjects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  description   text,
  color         text not null default '#6366f1',
  exam_date     date not null,
  hours_per_day numeric(4,2) not null default 2.0,
  is_archived   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.subjects enable row level security;

create policy "Users manage own subjects"
  on public.subjects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_subjects_user_id on public.subjects(user_id);
create index idx_subjects_exam_date on public.subjects(exam_date);

-- =============================================
-- materials
-- =============================================
create table public.materials (
  id                  uuid primary key default gen_random_uuid(),
  subject_id          uuid not null references public.subjects(id) on delete cascade,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  type                material_type not null,
  title               text not null,
  storage_path        text,
  source_url          text,
  raw_content         text,
  processed_content   text,
  status              material_status not null default 'pending',
  error_message       text,
  file_size_bytes     bigint,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.materials enable row level security;

create policy "Users manage own materials"
  on public.materials for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_materials_subject_id on public.materials(subject_id);
create index idx_materials_user_id on public.materials(user_id);

-- =============================================
-- study_plans
-- =============================================
create table public.study_plans (
  id            uuid primary key default gen_random_uuid(),
  subject_id    uuid not null references public.subjects(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  is_active     boolean not null default true,
  generated_at  timestamptz not null default now(),
  total_days    integer,
  total_hours   numeric(6,2)
);

alter table public.study_plans enable row level security;

create policy "Users manage own study plans"
  on public.study_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_study_plans_subject_id on public.study_plans(subject_id);

-- =============================================
-- study_sessions
-- =============================================
create table public.study_sessions (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references public.study_plans(id) on delete cascade,
  subject_id      uuid not null references public.subjects(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  scheduled_date  date not null,
  duration_hours  numeric(4,2) not null,
  title           text not null,
  description     text,
  topics          text[],
  is_completed    boolean not null default false,
  completed_at    timestamptz,
  notes           text,
  created_at      timestamptz not null default now()
);

alter table public.study_sessions enable row level security;

create policy "Users manage own sessions"
  on public.study_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_sessions_user_id on public.study_sessions(user_id);
create index idx_sessions_subject_id on public.study_sessions(subject_id);
create index idx_sessions_scheduled_date on public.study_sessions(scheduled_date);
create index idx_sessions_plan_id on public.study_sessions(plan_id);

-- =============================================
-- questions
-- =============================================
create table public.questions (
  id              uuid primary key default gen_random_uuid(),
  subject_id      uuid not null references public.subjects(id) on delete cascade,
  material_id     uuid references public.materials(id) on delete set null,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            question_type not null default 'multiple_choice',
  difficulty      question_difficulty not null default 'medium',
  question_text   text not null,
  options         jsonb,
  correct_answer  text not null,
  explanation     text,
  created_at      timestamptz not null default now()
);

alter table public.questions enable row level security;

create policy "Users manage own questions"
  on public.questions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_questions_subject_id on public.questions(subject_id);
create index idx_questions_user_id on public.questions(user_id);

-- =============================================
-- question_attempts
-- =============================================
create table public.question_attempts (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.questions(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  user_answer   text not null,
  is_correct    boolean not null,
  attempted_at  timestamptz not null default now()
);

alter table public.question_attempts enable row level security;

create policy "Users manage own attempts"
  on public.question_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_attempts_user_id on public.question_attempts(user_id);
create index idx_attempts_question_id on public.question_attempts(question_id);

-- =============================================
-- Storage bucket for materials
-- =============================================
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict do nothing;

create policy "Users upload own materials"
  on storage.objects for insert
  with check (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users view own materials"
  on storage.objects for select
  using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own materials"
  on storage.objects for delete
  using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);
