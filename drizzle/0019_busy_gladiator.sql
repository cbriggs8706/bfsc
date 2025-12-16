CREATE TABLE "kiosk_person_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"sustained_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	CONSTRAINT "kiosk_person_positions_person_id_position_id_unique" UNIQUE("person_id","position_id")
);
--> statement-breakpoint
CREATE TABLE "faiths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faith_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stake_id" uuid NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kiosk_people" ADD COLUMN "ward_id" uuid;--> statement-breakpoint
ALTER TABLE "kiosk_person_positions" ADD CONSTRAINT "kiosk_person_positions_person_id_kiosk_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."kiosk_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_person_positions" ADD CONSTRAINT "kiosk_person_positions_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakes" ADD CONSTRAINT "stakes_faith_id_faiths_id_fk" FOREIGN KEY ("faith_id") REFERENCES "public"."faiths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wards" ADD CONSTRAINT "wards_stake_id_stakes_id_fk" FOREIGN KEY ("stake_id") REFERENCES "public"."stakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_people" ADD CONSTRAINT "kiosk_people_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE set null ON UPDATE no action;