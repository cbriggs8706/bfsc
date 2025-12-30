CREATE TABLE "project_checkpoint_completions" (
	"checkpoint_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"minutes_spent" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_checkpoint_completions_pk" PRIMARY KEY("checkpoint_id","user_id","completed_at")
);
--> statement-breakpoint
CREATE TABLE "project_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"estimated_duration" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"instructions" text,
	"specific" text,
	"measurable" text,
	"achievable" text,
	"relevant" text,
	"target_date" timestamp with time zone,
	"actual_completion_date" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reservation" RENAME TO "reservations";--> statement-breakpoint
ALTER TABLE "resource" RENAME TO "resources";--> statement-breakpoint
ALTER TABLE "reservations" RENAME COLUMN "approved_by_user_id" TO "confirmed_by_user_id";--> statement-breakpoint
ALTER TABLE "reservations" DROP CONSTRAINT "reservation_status_ck";--> statement-breakpoint
ALTER TABLE "reservations" DROP CONSTRAINT "reservation_assistance_level_ck";--> statement-breakpoint
ALTER TABLE "reservations" DROP CONSTRAINT "reservation_attendee_count_ck";--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resource_type_ck";--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resource_capacity_ck";--> statement-breakpoint
ALTER TABLE "reservations" DROP CONSTRAINT "reservation_resource_id_resource_id_fk";
--> statement-breakpoint
ALTER TABLE "reservations" DROP CONSTRAINT "reservation_user_id_public.user_id_fk";
--> statement-breakpoint
ALTER TABLE "reservations" DROP CONSTRAINT "reservation_approved_by_user_id_public.user_id_fk";
--> statement-breakpoint
ALTER TABLE "reservations" DROP CONSTRAINT "reservation_assigned_worker_id_public.user_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_block" DROP CONSTRAINT "resource_block_resource_id_resource_id_fk";
--> statement-breakpoint
ALTER TABLE "resource_block" DROP CONSTRAINT "resource_block_block_resource_id_resource_id_fk";
--> statement-breakpoint
ALTER TABLE "kiosk_people" ADD COLUMN "pid" text;--> statement-breakpoint
ALTER TABLE "project_checkpoint_completions" ADD CONSTRAINT "project_checkpoint_completions_checkpoint_id_project_checkpoints_id_fk" FOREIGN KEY ("checkpoint_id") REFERENCES "public"."project_checkpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_checkpoint_completions" ADD CONSTRAINT "project_checkpoint_completions_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_checkpoints" ADD CONSTRAINT "project_checkpoints_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_user_id_public.user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkpoint_completions_checkpoint_idx" ON "project_checkpoint_completions" USING btree ("checkpoint_id");--> statement-breakpoint
CREATE INDEX "checkpoint_completions_user_idx" ON "project_checkpoint_completions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_checkpoints_project_idx" ON "project_checkpoints" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_checkpoints_sort_idx" ON "project_checkpoints" USING btree ("project_id","sort_order");--> statement-breakpoint
CREATE INDEX "projects_created_by_idx" ON "projects" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "projects_target_date_idx" ON "projects" USING btree ("target_date");--> statement-breakpoint
CREATE INDEX "projects_archived_idx" ON "projects" USING btree ("is_archived");--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_confirmed_by_user_id_public.user_id_fk" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_assigned_worker_id_public.user_id_fk" FOREIGN KEY ("assigned_worker_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_block" ADD CONSTRAINT "resource_block_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_block" ADD CONSTRAINT "resource_block_block_resource_id_resources_id_fk" FOREIGN KEY ("block_resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservation_status_ck" CHECK ("reservations"."status" in ('pending','confirmed','denied','cancelled'));--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservation_assistance_level_ck" CHECK ("reservations"."assistance_level" in ('none','startup','full'));--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservation_attendee_count_ck" CHECK ("reservations"."attendee_count" >= 1);--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resource_type_ck" CHECK ("resources"."type" in ('equipment','room','booth', 'activity'));--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resource_capacity_ck" CHECK ("resources"."capacity" is null or "resources"."capacity" > 0);