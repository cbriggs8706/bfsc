CREATE TYPE "public"."library_copy_status" AS ENUM('available', 'checked_out', 'retired', 'lost');--> statement-breakpoint
CREATE TYPE "public"."library_item_type" AS ENUM('book', 'equipment');--> statement-breakpoint
CREATE TABLE "library_copies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"copy_code" varchar(64) NOT NULL,
	"model_number" varchar(64),
	"status" "library_copy_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "library_item_type" NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"year" integer,
	"author_manufacturer" varchar(256),
	"isbn" varchar(32),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"copy_id" uuid NOT NULL,
	"borrower_user_id" uuid,
	"borrower_name" varchar(256),
	"borrower_email" varchar(256),
	"borrower_phone" varchar(32),
	"checked_out_at" timestamp with time zone DEFAULT now() NOT NULL,
	"returned_at" timestamp with time zone,
	"checked_out_by_user_id" uuid,
	"returned_by_user_id" uuid
);
--> statement-breakpoint
ALTER TABLE "library_copies" ADD CONSTRAINT "library_copies_item_id_library_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."library_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_copy_id_library_copies_id_fk" FOREIGN KEY ("copy_id") REFERENCES "public"."library_copies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_borrower_user_id_public.user_id_fk" FOREIGN KEY ("borrower_user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_checked_out_by_user_id_public.user_id_fk" FOREIGN KEY ("checked_out_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_returned_by_user_id_public.user_id_fk" FOREIGN KEY ("returned_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "library_copies_copy_code_uq" ON "library_copies" USING btree ("copy_code");--> statement-breakpoint
CREATE INDEX "library_copies_item_id_idx" ON "library_copies" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "library_copies_status_idx" ON "library_copies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "library_items_type_idx" ON "library_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "library_items_name_idx" ON "library_items" USING btree ("name");--> statement-breakpoint
CREATE INDEX "library_items_isbn_idx" ON "library_items" USING btree ("isbn");--> statement-breakpoint
CREATE INDEX "library_loans_copy_id_idx" ON "library_loans" USING btree ("copy_id");--> statement-breakpoint
CREATE INDEX "library_loans_active_by_copy_idx" ON "library_loans" USING btree ("copy_id","returned_at");--> statement-breakpoint
CREATE INDEX "library_loans_borrower_user_idx" ON "library_loans" USING btree ("borrower_user_id");