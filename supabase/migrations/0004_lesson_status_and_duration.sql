-- Migration 0004 — split scheduling from logging
--
-- A lesson is now either:
--   - scheduled : planned ahead, no notes required
--   - logged    : completed and recorded after the fact, with notes
--
-- We also start tracking duration_minutes (default 60) so the calendar can
-- eventually show time blocks.
--
-- Stats on the students table (total_lessons, last_lesson_at) only reflect
-- logged lessons, so a future calendar full of scheduled lessons doesn't
-- inflate a coach's "lessons given" count.

-- 1. Columns ---------------------------------------------------------------
alter table public.lessons
  add column if not exists status text not null default 'scheduled'
    check (status in ('scheduled', 'logged'));

alter table public.lessons
  add column if not exists duration_minutes int not null default 60
    check (duration_minutes > 0 and duration_minutes <= 600);

-- Anything that already existed before this migration was a logged lesson.
update public.lessons set status = 'logged' where status is null or status = 'scheduled';

-- 2. Trigger update --------------------------------------------------------
-- Recompute student stats from logged lessons only. Also re-fire on UPDATE
-- so a status flip from scheduled -> logged updates the totals.

create or replace function public.update_student_lesson_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_student uuid := coalesce(new.student_id, old.student_id);
begin
  update public.students
  set
    total_lessons  = (
      select count(*) from public.lessons
      where student_id = target_student and status = 'logged'
    ),
    last_lesson_at = (
      select max(occurred_at) from public.lessons
      where student_id = target_student and status = 'logged'
    )
  where id = target_student;

  return coalesce(new, old);
end;
$$;

drop trigger if exists on_lesson_change on public.lessons;

create trigger on_lesson_change
  after insert or update or delete on public.lessons
  for each row execute function public.update_student_lesson_stats();

-- 3. Index for calendar range queries --------------------------------------
create index if not exists lessons_coach_occurred_at_idx
  on public.lessons (coach_id, occurred_at);
