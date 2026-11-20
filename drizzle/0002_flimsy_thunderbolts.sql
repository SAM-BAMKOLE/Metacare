ALTER TABLE "notification_attempts" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "notification_attempts" ADD COLUMN "acknowledgement_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification_attempts" ADD COLUMN "understanding" text;--> statement-breakpoint
ALTER TABLE "notification_attempts" ADD COLUMN "concern_question" text;--> statement-breakpoint
ALTER TABLE "notification_attempts" ADD COLUMN "next_step_explained" boolean DEFAULT false NOT NULL;