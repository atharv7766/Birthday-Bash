create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,role text not null default 'visitor' check(role in('admin','visitor')));
create table if not exists public.birthday_content(id integer primary key check(id=1),content jsonb not null,published boolean not null default false,updated_at timestamptz not null default now());
alter table public.profiles enable row level security;alter table public.birthday_content enable row level security;
create policy "Profile self read" on public.profiles for select to authenticated using(auth.uid()=id);
create policy "Public published content" on public.birthday_content for select to anon,authenticated using(published=true);
create policy "Admin insert content" on public.birthday_content for insert to authenticated with check(exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "Admin update content" on public.birthday_content for update to authenticated using(exists(select 1 from public.profiles where id=auth.uid() and role='admin')) with check(exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('birthday-media','birthday-media',true,8388608,array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/ogg','audio/wav']) on conflict(id) do nothing;
create policy "Public media read" on storage.objects for select to anon,authenticated using(bucket_id='birthday-media');
create policy "Admin media upload" on storage.objects for insert to authenticated with check(bucket_id='birthday-media' and exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "Admin media update" on storage.objects for update to authenticated using(bucket_id='birthday-media' and exists(select 1 from public.profiles where id=auth.uid() and role='admin')) with check(bucket_id='birthday-media' and exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "Admin media delete" on storage.objects for delete to authenticated using(bucket_id='birthday-media' and exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
-- Create admin user in Supabase Auth, then run:
-- insert into public.profiles(id,role) values('AUTH_USER_UUID','admin');