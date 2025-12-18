CREATE TABLE "learning_course_completions" (
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"certificate_id" uuid,
	CONSTRAINT "learning_course_completions_pk" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "learning_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"level" integer,
	"is_published" boolean DEFAULT false NOT NULL,
	"cover_image_path" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "learning_lesson_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"type" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_lesson_completions" (
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_lesson_completions_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "learning_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" text NOT NULL,
	"course_id" uuid,
	"external_provider" text,
	"external_certificate_id" text,
	"title" text NOT NULL,
	"category" text,
	"level" integer,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verify_url" text,
	"meta" jsonb,
	CONSTRAINT "user_certificates_external_unique" UNIQUE("external_provider","external_certificate_id")
);
--> statement-breakpoint
ALTER TABLE "positions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "kiosk_people" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "kiosk_people" ADD COLUMN "faith_id" uuid;--> statement-breakpoint
ALTER TABLE "kiosk_people" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "learning_course_completions" ADD CONSTRAINT "learning_course_completions_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_course_completions" ADD CONSTRAINT "learning_course_completions_course_id_learning_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."learning_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_lesson_blocks" ADD CONSTRAINT "learning_lesson_blocks_lesson_id_learning_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."learning_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_lesson_completions" ADD CONSTRAINT "learning_lesson_completions_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_lesson_completions" ADD CONSTRAINT "learning_lesson_completions_lesson_id_learning_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."learning_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_lessons" ADD CONSTRAINT "learning_lessons_unit_id_learning_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."learning_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_units" ADD CONSTRAINT "learning_units_course_id_learning_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."learning_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_certificates" ADD CONSTRAINT "user_certificates_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_certificates" ADD CONSTRAINT "user_certificates_course_id_learning_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."learning_courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learning_course_completions_user_idx" ON "learning_course_completions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "learning_course_completions_course_idx" ON "learning_course_completions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "learning_courses_published_idx" ON "learning_courses" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "learning_courses_category_level_idx" ON "learning_courses" USING btree ("category","level");--> statement-breakpoint
CREATE INDEX "learning_blocks_lesson_idx" ON "learning_lesson_blocks" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "learning_lesson_completions_user_idx" ON "learning_lesson_completions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "learning_lesson_completions_lesson_idx" ON "learning_lesson_completions" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "learning_lessons_unit_idx" ON "learning_lessons" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "learning_units_course_idx" ON "learning_units" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "user_certificates_user_idx" ON "user_certificates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_certificates_source_idx" ON "user_certificates" USING btree ("source");--> statement-breakpoint
ALTER TABLE "kiosk_people" ADD CONSTRAINT "kiosk_people_faith_id_faiths_id_fk" FOREIGN KEY ("faith_id") REFERENCES "public"."faiths"("id") ON DELETE set null ON UPDATE no action;