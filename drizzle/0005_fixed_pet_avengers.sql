CREATE TABLE "need_applications" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"need_id" varchar(64) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"provider_id" varchar(64),
	"message" text NOT NULL,
	"proposed_price" real,
	"estimated_time" varchar(100),
	"status" varchar(50) DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "needs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(255),
	"category_id" varchar(64),
	"subcategory_id" varchar(64),
	"subcategory_name" varchar(255),
	"required_professionals" integer DEFAULT 1 NOT NULL,
	"filled_spots" integer DEFAULT 0 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"start_time" varchar(5),
	"end_time" varchar(5),
	"budget" real,
	"payment_type" varchar(50) DEFAULT 'total' NOT NULL,
	"address" text,
	"neighborhood" varchar(255),
	"city" varchar(255) NOT NULL,
	"latitude" real,
	"longitude" real,
	"requirements" text,
	"notes" text,
	"photos" text[],
	"status" varchar(50) DEFAULT 'ativa' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "need_applications" ADD CONSTRAINT "need_applications_need_id_needs_id_fk" FOREIGN KEY ("need_id") REFERENCES "public"."needs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "need_applications" ADD CONSTRAINT "need_applications_user_id_users_open_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("open_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "need_applications" ADD CONSTRAINT "need_applications_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "needs" ADD CONSTRAINT "needs_user_id_users_open_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("open_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "needs" ADD CONSTRAINT "needs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "need_apps_need_user_idx" ON "need_applications" USING btree ("need_id","user_id");--> statement-breakpoint
CREATE INDEX "need_apps_need_id_idx" ON "need_applications" USING btree ("need_id");--> statement-breakpoint
CREATE INDEX "need_apps_user_id_idx" ON "need_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "need_apps_provider_id_idx" ON "need_applications" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "need_apps_status_idx" ON "need_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "need_apps_created_at_idx" ON "need_applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "needs_user_id_idx" ON "needs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "needs_category_id_idx" ON "needs" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "needs_subcategoryId_idx" ON "needs" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "needs_status_idx" ON "needs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "needs_city_idx" ON "needs" USING btree ("city");--> statement-breakpoint
CREATE INDEX "needs_start_date_idx" ON "needs" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "needs_latitude_idx" ON "needs" USING btree ("latitude");--> statement-breakpoint
CREATE INDEX "needs_longitude_idx" ON "needs" USING btree ("longitude");--> statement-breakpoint
CREATE INDEX "needs_created_at_idx" ON "needs" USING btree ("created_at");