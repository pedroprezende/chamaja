CREATE TABLE "plan_benefits" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" uuid NOT NULL,
	"admin_id" varchar(64) NOT NULL,
	"old_values" jsonb NOT NULL,
	"new_values" jsonb NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"monthly_price" real DEFAULT 0 NOT NULL,
	"quarterly_price" real DEFAULT 0 NOT NULL,
	"semiannual_price" real DEFAULT 0 NOT NULL,
	"annual_price" real DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"badge_color" varchar(50),
	"apply_only_to_new" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "plan_id" uuid;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "billing_cycle" varchar(50);--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "locked_price" real;--> statement-breakpoint
ALTER TABLE "plan_benefits" ADD CONSTRAINT "plan_benefits_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_price_history" ADD CONSTRAINT "plan_price_history_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;