ALTER TABLE "app_settings"
ADD COLUMN IF NOT EXISTS "assigned_genie_greenie_microskill_ids" jsonb NOT NULL DEFAULT '[]'::jsonb;
