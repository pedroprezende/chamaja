CREATE TABLE "appointments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"provider_id" varchar(64) NOT NULL,
	"user_id" varchar(64),
	"client_name" varchar(255) NOT NULL,
	"client_phone" varchar(50) NOT NULL,
	"service_id" varchar(64),
	"service_name" varchar(255) NOT NULL,
	"price" real,
	"date" timestamp NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "supports_scheduling" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "schedule_settings" jsonb;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "invited_email" varchar(320);--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_open_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("open_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_provider_id_idx" ON "appointments" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "appointments_user_id_idx" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "appointments_date_idx" ON "appointments" USING btree ("date");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");