CREATE TABLE "announcement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"roles" jsonb NOT NULL,
	"image_url" varchar(500),
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"approved_by_user_id" uuid,
	"approved_at" timestamp with time zone,
	"title" varchar(200) NOT NULL,
	"description" text,
	"location" varchar(200) NOT NULL,
	"zoom_url" text,
	"recording_url" text,
	"cover_image_path" text,
	"cover_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_series_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"series_id" uuid NOT NULL,
	"label" varchar(120) NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_series_presenter" (
	"series_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"series_id" uuid NOT NULL,
	"part_number" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"status" varchar(16) DEFAULT 'scheduled' NOT NULL,
	"canceled_reason" text,
	"title_override" varchar(200),
	"description_override" text,
	"location_override" varchar(200),
	"zoom_url_override" text,
	"recording_url_override" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_session_handout" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"public_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_session_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"label" varchar(120) NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_session_presenter" (
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_setting" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kiosk_people" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "shift_exceptions" ADD COLUMN "requested_by" uuid;--> statement-breakpoint
ALTER TABLE "shift_exceptions" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "shift_exceptions" ADD COLUMN "status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "weekly_shifts" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "class_series" ADD CONSTRAINT "class_series_created_by_user_id_public.user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_series" ADD CONSTRAINT "class_series_approved_by_user_id_public.user_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_series_link" ADD CONSTRAINT "class_series_link_series_id_class_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."class_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_series_presenter" ADD CONSTRAINT "class_series_presenter_series_id_class_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."class_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_series_presenter" ADD CONSTRAINT "class_series_presenter_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_session" ADD CONSTRAINT "class_session_series_id_class_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."class_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_session_handout" ADD CONSTRAINT "class_session_handout_session_id_class_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_session_link" ADD CONSTRAINT "class_session_link_session_id_class_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_session_presenter" ADD CONSTRAINT "class_session_presenter_session_id_class_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_session_presenter" ADD CONSTRAINT "class_session_presenter_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "class_series_status_idx" ON "class_series" USING btree ("status");--> statement-breakpoint
CREATE INDEX "class_series_created_by_idx" ON "class_series" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "class_series_link_series_idx" ON "class_series_link" USING btree ("series_id");--> statement-breakpoint
CREATE UNIQUE INDEX "class_series_presenter_pk" ON "class_series_presenter" USING btree ("series_id","user_id");--> statement-breakpoint
CREATE INDEX "class_session_series_idx" ON "class_session" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "class_session_starts_at_idx" ON "class_session" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "class_session_series_part_uq" ON "class_session" USING btree ("series_id","part_number");--> statement-breakpoint
CREATE INDEX "class_session_handout_session_idx" ON "class_session_handout" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "class_session_link_session_idx" ON "class_session_link" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "class_session_presenter_pk" ON "class_session_presenter" USING btree ("session_id","user_id");--> statement-breakpoint
ALTER TABLE "shift_exceptions" ADD CONSTRAINT "shift_exceptions_requested_by_public.user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_exceptions" ADD CONSTRAINT "shift_exceptions_approved_by_public.user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;