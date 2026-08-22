ALTER TABLE "needs" ADD COLUMN "allow_whatsapp_contact" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "needs" ADD COLUMN "whatsapp_contact" varchar(50);--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "address_number" varchar(50);--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "state" varchar(2);--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "opportunity_availability" jsonb;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "is_24_hours" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "providers_is_24_hours_idx" ON "providers" USING btree ("is_24_hours");