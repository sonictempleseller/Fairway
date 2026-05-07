-- Migration 0003 — repair missing RLS policies on public.lessons
--
-- Background: migration 0001 declared insert / update / delete policies for
-- public.lessons, but in this Supabase project only the select policy
-- actually exists (verified via pg_policies). Without a matching policy,
-- RLS rejects writes — which is the cause of the
--   "new row violates row-level security policy for table 'lessons'"
-- error coaches were seeing when trying to log a lesson.
--
-- This migration is idempotent — drop-if-exists then create.

drop policy if exists "Coaches can insert their own lessons" on public.lessons;
drop policy if exists "Coaches can update their own lessons" on public.lessons;
drop policy if exists "Coaches can delete their own lessons" on public.lessons;

create policy "Coaches can insert their own lessons"
  on public.lessons for insert
  with check (auth.uid() = coach_id);

create policy "Coaches can update their own lessons"
  on public.lessons for update
  using (auth.uid() = coach_id);

create policy "Coaches can delete their own lessons"
  on public.lessons for delete
  using (auth.uid() = coach_id);
