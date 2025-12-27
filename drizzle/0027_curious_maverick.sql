ALTER TYPE "public"."sub_request_status" ADD VALUE 'awaiting_nomination_confirmation' BEFORE 'accepted';--> statement-breakpoint
ALTER TABLE "public.user" ADD COLUMN "is_active_worker" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD COLUMN "assignment_role" varchar(20) DEFAULT 'worker' NOT NULL;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD COLUMN "notes" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "shift_assignments_user_recurrence_uq" ON "shift_assignments" USING btree ("shift_recurrence_id","user_id");--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_role_ck" CHECK ("shift_assignments"."assignment_role" in ('worker','shift_lead','trainer'));