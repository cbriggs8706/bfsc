CREATE TABLE "case_investigators" (
	"case_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "case_investigators_case_id_user_id_pk" PRIMARY KEY("case_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "cases" DROP CONSTRAINT "cases_created_by_user_id_public.user_id_fk";
--> statement-breakpoint
ALTER TABLE "case_investigators" ADD CONSTRAINT "case_investigators_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_investigators" ADD CONSTRAINT "case_investigators_user_id_public.user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."public.user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_user_id_public.user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."public.user"("id") ON DELETE restrict ON UPDATE no action;