ALTER TABLE "public.user"
ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone;
