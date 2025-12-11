CREATE TABLE "kiosk_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"full_name" text NOT NULL,
	"email" text,
	"passcode" varchar(6),
	"is_consultant_cached" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kiosk_people_passcode_unique" UNIQUE("passcode")
);
--> statement-breakpoint
CREATE TABLE "kiosk_shift_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"arrival_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_departure_at" timestamp with time zone NOT NULL,
	"actual_departure_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "kiosk_visit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"user_id" uuid,
	"purpose_id" integer,
	"mailing_list_opt_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "kiosk_visit_purposes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kiosk_visit_purposes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kiosk_people" ADD CONSTRAINT "kiosk_people_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_shift_logs" ADD CONSTRAINT "kiosk_shift_logs_person_id_kiosk_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."kiosk_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_shift_logs" ADD CONSTRAINT "kiosk_shift_logs_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_visit_logs" ADD CONSTRAINT "kiosk_visit_logs_person_id_kiosk_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."kiosk_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_visit_logs" ADD CONSTRAINT "kiosk_visit_logs_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_visit_logs" ADD CONSTRAINT "kiosk_visit_logs_purpose_id_kiosk_visit_purposes_id_fk" FOREIGN KEY ("purpose_id") REFERENCES "public"."kiosk_visit_purposes"("id") ON DELETE set null ON UPDATE no action;