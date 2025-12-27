CREATE TABLE "worker_shift_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shift_id" uuid NOT NULL,
	"shift_recurrence_id" uuid,
	"level" varchar(20) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_sub_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"shift_recurrence_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"type" varchar(20) NOT NULL,
	"status" varchar(40) DEFAULT 'open' NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"notes" text,
	"has_nominated_sub" boolean DEFAULT false NOT NULL,
	"nominated_sub_user_id" uuid,
	"nominated_confirmed_at" timestamp with time zone,
	"accepted_by_user_id" uuid,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_sub_volunteers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"volunteer_user_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'offered' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_trade_offer_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"shift_id" uuid NOT NULL,
	"shift_recurrence_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"status" varchar(20) DEFAULT 'offered' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_trade_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"offered_by_user_id" uuid NOT NULL,
	"message" text,
	"status" varchar(20) DEFAULT 'offered' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "worker_shift_availability" ADD CONSTRAINT "worker_shift_availability_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_shift_availability" ADD CONSTRAINT "worker_shift_availability_shift_id_weekly_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."weekly_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_shift_availability" ADD CONSTRAINT "worker_shift_availability_shift_recurrence_id_shift_recurrences_id_fk" FOREIGN KEY ("shift_recurrence_id") REFERENCES "public"."shift_recurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_sub_requests" ADD CONSTRAINT "shift_sub_requests_shift_id_weekly_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."weekly_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_sub_requests" ADD CONSTRAINT "shift_sub_requests_shift_recurrence_id_shift_recurrences_id_fk" FOREIGN KEY ("shift_recurrence_id") REFERENCES "public"."shift_recurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_sub_requests" ADD CONSTRAINT "shift_sub_requests_requested_by_user_id_public.user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_sub_requests" ADD CONSTRAINT "shift_sub_requests_nominated_sub_user_id_public.user_id_fk" FOREIGN KEY ("nominated_sub_user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_sub_requests" ADD CONSTRAINT "shift_sub_requests_accepted_by_user_id_public.user_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_sub_volunteers" ADD CONSTRAINT "shift_sub_volunteers_request_id_shift_sub_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."shift_sub_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_sub_volunteers" ADD CONSTRAINT "shift_sub_volunteers_volunteer_user_id_public.user_id_fk" FOREIGN KEY ("volunteer_user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_trade_offer_options" ADD CONSTRAINT "shift_trade_offer_options_offer_id_shift_trade_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."shift_trade_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_trade_offer_options" ADD CONSTRAINT "shift_trade_offer_options_shift_id_weekly_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."weekly_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_trade_offer_options" ADD CONSTRAINT "shift_trade_offer_options_shift_recurrence_id_shift_recurrences_id_fk" FOREIGN KEY ("shift_recurrence_id") REFERENCES "public"."shift_recurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_trade_offers" ADD CONSTRAINT "shift_trade_offers_request_id_shift_sub_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."shift_sub_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_trade_offers" ADD CONSTRAINT "shift_trade_offers_offered_by_user_id_public.user_id_fk" FOREIGN KEY ("offered_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worker_shift_availability_user_idx" ON "worker_shift_availability" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "worker_shift_availability_shift_idx" ON "worker_shift_availability" USING btree ("shift_id");--> statement-breakpoint
CREATE UNIQUE INDEX "worker_shift_availability_uq" ON "worker_shift_availability" USING btree ("user_id","shift_id","shift_recurrence_id");--> statement-breakpoint
CREATE INDEX "shift_sub_requests_date_idx" ON "shift_sub_requests" USING btree ("date");--> statement-breakpoint
CREATE INDEX "shift_sub_requests_shift_idx" ON "shift_sub_requests" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "shift_sub_requests_requested_by_idx" ON "shift_sub_requests" USING btree ("requested_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shift_sub_requests_requester_shift_date_uq" ON "shift_sub_requests" USING btree ("requested_by_user_id","shift_id","date");--> statement-breakpoint
CREATE INDEX "shift_sub_volunteers_request_idx" ON "shift_sub_volunteers" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "shift_sub_volunteers_volunteer_idx" ON "shift_sub_volunteers" USING btree ("volunteer_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shift_sub_volunteers_request_volunteer_uq" ON "shift_sub_volunteers" USING btree ("request_id","volunteer_user_id");--> statement-breakpoint
CREATE INDEX "shift_trade_offer_options_offer_idx" ON "shift_trade_offer_options" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "shift_trade_offer_options_date_idx" ON "shift_trade_offer_options" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "shift_trade_offer_options_offer_shift_date_uq" ON "shift_trade_offer_options" USING btree ("offer_id","shift_id","date");--> statement-breakpoint
CREATE INDEX "shift_trade_offers_request_idx" ON "shift_trade_offers" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "shift_trade_offers_offered_by_idx" ON "shift_trade_offers" USING btree ("offered_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shift_trade_offers_request_user_uq" ON "shift_trade_offers" USING btree ("request_id","offered_by_user_id");