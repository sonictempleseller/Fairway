-- Migration 0006 — two-sided foundation
--
-- Turns Fairway from a coach-only CRM into a two-sided platform where
-- students can have their own login, be invited by a coach, and eventually
-- chat / share videos / receive homework etc.
--
-- Backwards compatible: existing data is preserved. Every existing
-- profile is treated as a coach (which they were, implicitly), and every
-- existing student row gets a NULL user_id meaning "not yet linked".

-- 1. profiles.user_type ----------------------------------------------------
alter table public.profiles
  add column if not exists user_type text not null default 'coach'
    check (user_type in ('coach', 'student'));

-- 2. students.user_id (linked auth user, when one exists) ------------------
alter table public.students
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- A given student-user can only appear once in a single coach's roster.
-- (They CAN appear in multiple coaches' rosters with the same user_id.)
drop index if exists students_coach_user_unique;
create unique index students_coach_user_unique
  on public.students(coach_id, user_id)
  where user_id is not null;

-- 3. handle_new_user trigger — read user_type from signup metadata ---------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_user_type text := coalesce(new.raw_user_meta_data->>'user_type', 'coach');
  signup_display   text := coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );
begin
  if signup_user_type not in ('coach', 'student') then
    signup_user_type := 'coach';
  end if;

  insert into public.profiles (id, display_name, user_type)
  values (new.id, signup_display, signup_user_type);

  return new;
end;
$$;

-- 4. RLS update on students — linked student can read their own row --------
drop policy if exists "Coaches can read their own students"          on public.students;
drop policy if exists "Coaches and linked students can read students" on public.students;

create policy "Coaches and linked students can read students"
  on public.students for select
  using (auth.uid() = coach_id or auth.uid() = user_id);

-- The coach-only insert / update / delete policies from migration 0001
-- remain in place: students can only READ their roster row, never write.

-- 5. student_invitations ---------------------------------------------------
-- One row per invite a coach generates for a student in their roster. The
-- token is a long random URL-safe string. It expires (default 14 days) and
-- can only be redeemed once.

create table if not exists public.student_invitations (
  id                  uuid        primary key default gen_random_uuid(),
  coach_id            uuid        not null references auth.users(id)        on delete cascade,
  student_id          uuid        not null references public.students(id)   on delete cascade,
  token               text        not null unique,
  email               text,
  expires_at          timestamptz not null default (now() + interval '14 days'),
  redeemed_at         timestamptz,
  redeemed_by_user_id uuid        references auth.users(id) on delete set null,
  created_at          timestamptz not null default now()
);

create index if not exists student_invitations_coach_id_idx  on public.student_invitations(coach_id);
create index if not exists student_invitations_student_id_idx on public.student_invitations(student_id);

alter table public.student_invitations enable row level security;

drop policy if exists "Coaches can read their own invitations"   on public.student_invitations;
drop policy if exists "Coaches can insert their own invitations" on public.student_invitations;
drop policy if exists "Coaches can update their own invitations" on public.student_invitations;
drop policy if exists "Coaches can delete their own invitations" on public.student_invitations;

create policy "Coaches can read their own invitations"
  on public.student_invitations for select
  using (auth.uid() = coach_id);

create policy "Coaches can insert their own invitations"
  on public.student_invitations for insert
  with check (auth.uid() = coach_id);

create policy "Coaches can update their own invitations"
  on public.student_invitations for update
  using (auth.uid() = coach_id);

create policy "Coaches can delete their own invitations"
  on public.student_invitations for delete
  using (auth.uid() = coach_id);

-- 6. Public token lookup ---------------------------------------------------
-- Anyone visiting /invite/<token> needs to look the invitation up before
-- they're authenticated. Direct SELECT on student_invitations would require
-- RLS to allow anon, which would let attackers enumerate. Instead, expose a
-- SECURITY DEFINER function that takes a token and returns *only* the safe
-- metadata: the coach's display name, the student's name, and expiry.

create or replace function public.lookup_invitation(invite_token text)
returns table (
  invitation_id uuid,
  coach_display_name text,
  student_name text,
  expires_at timestamptz,
  redeemed boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    inv.id,
    coalesce(coach_profile.display_name, split_part(coach_user.email, '@', 1)),
    s.name,
    inv.expires_at,
    inv.redeemed_at is not null
  from public.student_invitations inv
  join public.students s              on s.id = inv.student_id
  join auth.users      coach_user     on coach_user.id = inv.coach_id
  left join public.profiles coach_profile on coach_profile.id = inv.coach_id
  where inv.token = invite_token
  limit 1;
$$;

grant execute on function public.lookup_invitation(text) to anon, authenticated;

-- 7. Redemption helper -----------------------------------------------------
-- Called by a freshly-signed-up student from their session. Marks the
-- invitation as redeemed and links the student row to their auth user.

create or replace function public.redeem_invitation(invite_token text)
returns table (student_id uuid, coach_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to redeem invitation';
  end if;

  select * into inv
  from public.student_invitations
  where token = invite_token
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;
  if inv.redeemed_at is not null then
    raise exception 'Invitation already redeemed';
  end if;
  if inv.expires_at < now() then
    raise exception 'Invitation expired';
  end if;

  update public.students
    set user_id = auth.uid()
    where id = inv.student_id;

  update public.student_invitations
    set redeemed_at = now(),
        redeemed_by_user_id = auth.uid()
    where id = inv.id;

  return query select inv.student_id, inv.coach_id;
end;
$$;

grant execute on function public.redeem_invitation(text) to authenticated;
