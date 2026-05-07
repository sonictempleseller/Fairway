-- Migration 0002 — automatic lesson-stats trigger
--
-- Whenever a row is inserted into or deleted from public.lessons, recompute
-- total_lessons and last_lesson_at on the corresponding row in public.students.
-- Keeps the denormalized columns on students always-correct without the
-- application code having to remember to update them.

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
    total_lessons  = (select count(*)            from public.lessons where student_id = target_student),
    last_lesson_at = (select max(occurred_at)    from public.lessons where student_id = target_student)
  where id = target_student;

  return coalesce(new, old);
end;
$$;

drop trigger if exists on_lesson_change on public.lessons;

create trigger on_lesson_change
  after insert or delete on public.lessons
  for each row execute function public.update_student_lesson_stats();
