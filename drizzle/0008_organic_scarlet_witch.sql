CREATE TABLE "kiosk_special_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" varchar(10) NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"opens_at" varchar(5),
	"closes_at" varchar(5),
	"updated_at" timestamp with time zone DEFAULT now()
);
