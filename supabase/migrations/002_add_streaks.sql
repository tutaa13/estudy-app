-- =============================================
-- Streak system — columns on profiles
-- =============================================

alter table public.profiles
  add column if not exists current_streak      integer not null default 0,
  add column if not exists longest_streak      integer not null default 0,
  add column if not exists last_study_date     date,
  add column if not exists streak_freeze_count integer not null default 1;
