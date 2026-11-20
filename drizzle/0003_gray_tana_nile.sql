CREATE TABLE "clinical_consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_id" uuid NOT NULL,
	"consulting_clinician_id" text NOT NULL,
	"requesting_clinician_or_facility" text NOT NULL,
	"consultation_date" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"outcome" text NOT NULL,
	"summary_recommendation" text,
	"next_action" text,
	"next_action_owner_id" text,
	"next_action_due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "confirmatory_follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_id" uuid NOT NULL,
	"required" text NOT NULL,
	"test_assessment_label" text NOT NULL,
	"ordered_by" text NOT NULL,
	"ordered_at" timestamp with time zone NOT NULL,
	"expected_date" timestamp with time zone,
	"status" text NOT NULL,
	"completed_at" timestamp with time zone,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"outcome_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinical_consultations" ADD CONSTRAINT "clinical_consultations_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_consultations" ADD CONSTRAINT "clinical_consultations_consulting_clinician_id_user_id_fk" FOREIGN KEY ("consulting_clinician_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_consultations" ADD CONSTRAINT "clinical_consultations_next_action_owner_id_user_id_fk" FOREIGN KEY ("next_action_owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmatory_follow_ups" ADD CONSTRAINT "confirmatory_follow_ups_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmatory_follow_ups" ADD CONSTRAINT "confirmatory_follow_ups_ordered_by_user_id_fk" FOREIGN KEY ("ordered_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmatory_follow_ups" ADD CONSTRAINT "confirmatory_follow_ups_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;