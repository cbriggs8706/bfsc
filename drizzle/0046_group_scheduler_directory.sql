CREATE TABLE "unit_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stake_id" uuid,
	"ward_id" uuid,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"preferred_contact_method" varchar(20) DEFAULT 'phone' NOT NULL,
	"best_contact_times" text,
	"notes" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"last_verified_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unit_contact_scope_ck" CHECK (
		(
			("unit_contacts"."stake_id" is not null and "unit_contacts"."ward_id" is null)
			or
			("unit_contacts"."stake_id" is null and "unit_contacts"."ward_id" is not null)
		)
	),
	CONSTRAINT "unit_contact_method_ck" CHECK ("unit_contacts"."preferred_contact_method" in ('phone', 'email', 'text'))
);
--> statement-breakpoint
CREATE TABLE "group_schedule_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stake_id" uuid NOT NULL,
	"ward_id" uuid,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" varchar(30) DEFAULT 'tentative' NOT NULL,
	"coordination_status" varchar(30) DEFAULT 'needs_contact' NOT NULL,
	"planning_notes" text,
	"internal_notes" text,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_schedule_event_status_ck" CHECK ("group_schedule_events"."status" in ('tentative','pending_confirmation','confirmed','completed','canceled')),
	CONSTRAINT "group_schedule_event_coordination_status_ck" CHECK ("group_schedule_events"."coordination_status" in ('needs_contact','contacted','awaiting_response','proposed_times_sent','confirmed','reschedule_requested','canceled')),
	CONSTRAINT "group_schedule_event_start_end_ck" CHECK ("group_schedule_events"."ends_at" > "group_schedule_events"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "group_schedule_event_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"author_user_id" uuid,
	"visibility" varchar(20) DEFAULT 'coordination' NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_schedule_event_note_visibility_ck" CHECK ("group_schedule_event_notes"."visibility" in ('coordination','private'))
);
--> statement-breakpoint
ALTER TABLE "unit_contacts" ADD CONSTRAINT "unit_contacts_stake_id_stakes_id_fk" FOREIGN KEY ("stake_id") REFERENCES "public"."stakes"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "unit_contacts" ADD CONSTRAINT "unit_contacts_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "unit_contacts" ADD CONSTRAINT "unit_contacts_created_by_user_id_public.user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "unit_contacts" ADD CONSTRAINT "unit_contacts_updated_by_user_id_public.user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_schedule_events" ADD CONSTRAINT "group_schedule_events_stake_id_stakes_id_fk" FOREIGN KEY ("stake_id") REFERENCES "public"."stakes"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_schedule_events" ADD CONSTRAINT "group_schedule_events_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_schedule_events" ADD CONSTRAINT "group_schedule_events_created_by_user_id_public.user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_schedule_events" ADD CONSTRAINT "group_schedule_events_updated_by_user_id_public.user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_schedule_event_notes" ADD CONSTRAINT "group_schedule_event_notes_event_id_group_schedule_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."group_schedule_events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_schedule_event_notes" ADD CONSTRAINT "group_schedule_event_notes_author_user_id_public.user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "unit_contacts_stake_idx" ON "unit_contacts" USING btree ("stake_id");
--> statement-breakpoint
CREATE INDEX "unit_contacts_ward_idx" ON "unit_contacts" USING btree ("ward_id");
--> statement-breakpoint
CREATE INDEX "unit_contacts_role_idx" ON "unit_contacts" USING btree ("role");
--> statement-breakpoint
CREATE INDEX "unit_contacts_public_idx" ON "unit_contacts" USING btree ("is_public");
--> statement-breakpoint
CREATE INDEX "group_schedule_events_stake_idx" ON "group_schedule_events" USING btree ("stake_id");
--> statement-breakpoint
CREATE INDEX "group_schedule_events_ward_idx" ON "group_schedule_events" USING btree ("ward_id");
--> statement-breakpoint
CREATE INDEX "group_schedule_events_start_idx" ON "group_schedule_events" USING btree ("starts_at");
--> statement-breakpoint
CREATE INDEX "group_schedule_events_status_idx" ON "group_schedule_events" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "group_schedule_event_notes_event_idx" ON "group_schedule_event_notes" USING btree ("event_id");
