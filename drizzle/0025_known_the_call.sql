CREATE TABLE "shift_assignment_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"shift_recurrence_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"assigned_user_id" uuid NOT NULL,
	"reason" varchar(30) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "shift_assignment_exceptions" ADD CONSTRAINT "shift_assignment_exceptions_shift_id_weekly_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."weekly_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignment_exceptions" ADD CONSTRAINT "shift_assignment_exceptions_shift_recurrence_id_shift_recurrences_id_fk" FOREIGN KEY ("shift_recurrence_id") REFERENCES "public"."shift_recurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignment_exceptions" ADD CONSTRAINT "shift_assignment_exceptions_assigned_user_id_public.user_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shift_assignment_exceptions_date_idx" ON "shift_assignment_exceptions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "shift_assignment_exceptions_recurrence_idx" ON "shift_assignment_exceptions" USING btree ("shift_recurrence_id");