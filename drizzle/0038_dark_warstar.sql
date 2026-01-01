ALTER TABLE "reservations" ADD COLUMN "phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "faith_id" uuid;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "ward_id" uuid;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_faith_id_faiths_id_fk" FOREIGN KEY ("faith_id") REFERENCES "public"."faiths"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_ward_id_wards_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."wards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservation_faith_xor_ward_ck" CHECK (
      (
        ("reservations"."ward_id" is not null and "reservations"."faith_id" is null)
        or
        ("reservations"."ward_id" is null and "reservations"."faith_id" is not null)
        or
        ("reservations"."ward_id" is null and "reservations"."faith_id" is null)
      )
    );