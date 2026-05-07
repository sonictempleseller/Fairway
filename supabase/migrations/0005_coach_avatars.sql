-- Migration 0005 — coach avatar uploads
--
-- Adds an avatar_url column to public.profiles and provisions a public
-- "avatars" storage bucket with RLS scoped per-user. Each coach can only
-- write objects under a path that starts with their own auth.uid().

-- 1. avatar_url column ----------------------------------------------------
alter table public.profiles
  add column if not exists avatar_url text;

-- 2. Storage bucket -------------------------------------------------------
-- Public so the rendered <img> src can fetch without an auth header.
-- 5 MB max, JPG/PNG/WebP only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3. Storage RLS policies -------------------------------------------------
-- Drop-if-exists pattern keeps this idempotent.

drop policy if exists "Avatars are readable by anyone"        on storage.objects;
drop policy if exists "Users can upload their own avatar"     on storage.objects;
drop policy if exists "Users can update their own avatar"     on storage.objects;
drop policy if exists "Users can delete their own avatar"     on storage.objects;

-- Anyone (including unauthenticated visitors) can read avatar bytes.
create policy "Avatars are readable by anyone"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- A user can write to <their-uuid>/anything but nothing else.
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
