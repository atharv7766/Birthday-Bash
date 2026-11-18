# A Magical Birthday Surprise ♡

A mobile-first romantic birthday experience: welcome reveal, personal message, birthday celebration, exactly 15 scrapbook photo slots, sealed letter reveal, long-form letter and music.

## Local setup
1. Install Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env`; set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `supabase/schema.sql` in Supabase SQL Editor.
4. Create an admin user in Supabase Authentication, then insert their UUID into `public.profiles` with role `admin`.
5. Run `npm run dev`.

Without Supabase variables, the public experience works with preview defaults; admin publishing is disabled rather than bypassed.

## Vercel
Import the repository, use build command `npm run build`, output `dist`, and configure the two Vite environment variables. Redeploy after configuring them.

Never put a Supabase service-role key in frontend variables. RLS policies restrict publishing and storage uploads to authenticated profiles with admin role. Uploads support JPG/PNG/WebP up to 8 MB and an audio bucket. Add personal photos and music through the admin studio after backend setup.
