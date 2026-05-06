-- Fairway initial schema
-- Tables: profiles, students, lessons
-- Auth identity comes from Supabase's built-in auth.users table.
-- Every app table is scoped to a coach via coach_id = auth.uid() and
-- protected by Row Level Security (RLS).

-- ============================================================
-- 1. profiles — one row per authenticated user (the "coach")
-- ============================================================
create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  display_name  text,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 2. students — each row owned by a coach
-- ============================================================
create table public.students (
  id             uuid        primary key default gen_random_uuid(),
  coach_id       uuid        not null references auth.users(id) on delete cascade,
  name           text        not null,
  handicap       int         not null,
  total_lessons  int         not null default 0,
  last_lesson_at timestamptz,
  created_at     timestamptz not null default now()
);

create index students_coach_id_idx on public.students(coach_id);

alter table public.students enable row level security;

create policy "Coaches can read their own students"
  on public.students for select
  using (auth.uid() = coach_id);

create policy "Coaches can insert their own students"
  on public.students for insert
  with check (auth.uid() = coach_id);

create policy "Coaches can update their own students"
  on public.students for update
  using (auth.uid() = coach_id);

create policy "Coaches can delete their own students"
  on public.students for delete
  using (auth.uid() = coach_id);


-- ============================================================
-- 3. lessons — each lesson belongs to a student AND a coach
-- (coach_id denormalized for simpler/faster RLS checks)
-- ============================================================
create table public.lessons (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students(id) on delete cascade,
  coach_id    uuid        not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  notes       text,
  created_at  timestamptz not null default now()
);

create index lessons_student_id_idx on public.lessons(student_id);
create index lessons_coach_id_idx   on public.lessons(coach_id);

alter table public.lessons enable row level security;

create policy "Coaches can read their own lessons"
  on public.lessons for select
  using (auth.uid() = coach_id);

create policy "Coaches can insert their own lessons"
  on public.lessons for insert
  with check (auth.uid() = coach_id);

create policy "Coaches can update their own lessons"
  on public.lessons for update
  using (auth.uid() = coach_id);

create policy "Coaches can delete their own lessons"
  on public.lessons for delete
  using (auth.uid() = coach_id);
