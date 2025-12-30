CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'difficult');--> statement-breakpoint
ALTER TABLE "project_checkpoint_completions" RENAME TO "project_checkpoint_contributions";--> statement-breakpoint
ALTER TABLE "project_checkpoint_contributions" RENAME COLUMN "completed_at" TO "created_at";--> statement-breakpoint
ALTER TABLE "project_checkpoint_contributions" DROP CONSTRAINT "project_checkpoint_completions_checkpoint_id_project_checkpoints_id_fk";
--> statement-breakpoint
ALTER TABLE "project_checkpoint_contributions" DROP CONSTRAINT "project_checkpoint_completions_user_id_public.user_id_fk";
--> statement-breakpoint
DROP INDEX "checkpoint_completions_checkpoint_idx";--> statement-breakpoint
DROP INDEX "checkpoint_completions_user_idx";--> statement-breakpoint
ALTER TABLE "project_checkpoint_contributions" DROP CONSTRAINT "project_checkpoint_completions_pk";--> statement-breakpoint
ALTER TABLE "project_checkpoint_contributions" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "project_checkpoints" ADD COLUMN "difficulty" "difficulty" DEFAULT 'easy' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_checkpoints" ADD COLUMN "is_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "project_checkpoints" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "project_checkpoints" ADD COLUMN "completed_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "difficulty" "difficulty" DEFAULT 'easy' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_checkpoint_contributions" ADD CONSTRAINT "project_checkpoint_contributions_checkpoint_id_project_checkpoints_id_fk" FOREIGN KEY ("checkpoint_id") REFERENCES "public"."project_checkpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_checkpoint_contributions" ADD CONSTRAINT "project_checkpoint_contributions_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_checkpoints" ADD CONSTRAINT "project_checkpoints_completed_by_user_id_public.user_id_fk" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkpoint_contrib_checkpoint_idx" ON "project_checkpoint_contributions" USING btree ("checkpoint_id");--> statement-breakpoint
CREATE INDEX "checkpoint_contrib_user_idx" ON "project_checkpoint_contributions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_checkpoints_completed_idx" ON "project_checkpoints" USING btree ("is_completed");