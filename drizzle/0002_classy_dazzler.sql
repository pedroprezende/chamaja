ALTER TABLE "pagamentos" ADD COLUMN "plan_id" uuid;--> statement-breakpoint
ALTER TABLE "plan_benefits" ADD COLUMN "key" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "plan_status" varchar(50) DEFAULT 'gratuito';--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "plan_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "social_links" text;--> statement-breakpoint
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;