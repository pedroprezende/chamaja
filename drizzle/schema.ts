import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  real,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const planEnum = pgEnum("plan_type", ["monthly", "annual"]);

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

// ── Categories ────────────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 64 }).notNull().default("build"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Sub-services ──────────────────────────────────────────────────────────────
export const subServices = pgTable("sub_services", {
  id: varchar("id", { length: 64 }).primaryKey(),
  categoryId: varchar("category_id", { length: 64 }).notNull().references(() => categories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 64 }).notNull().default("build"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Regions ───────────────────────────────────────────────────────────────────
export const regions = pgTable("regions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  providerCount: integer("provider_count").notNull().default(0),
  adCount: integer("ad_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Services (anúncios de serviços criados pelo admin) ─────────────────────────
export const services = pgTable("services", {
  id: varchar("id", { length: 64 }).primaryKey(),
  adminId: varchar("admin_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  categoryId: varchar("category_id", { length: 64 }),
  subcategoryId: varchar("subcategory_id", { length: 64 }),
  subcategoryName: varchar("subcategory_name", { length: 255 }),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  imageUri: text("image_uri"),
  whatsapp: varchar("whatsapp", { length: 20 }),
  address: text("address"),
  gallery: text("gallery").array(),
  showOnHome: boolean("show_on_home").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Providers (prestadores cadastrados pelo admin) ─────────────────────────────
export const providers = pgTable("providers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  serviceId: varchar("service_id", { length: 64 }),
  serviceName: varchar("service_name", { length: 255 }),
  subcategoryId: varchar("subcategory_id", { length: 64 }),
  subcategoryName: varchar("subcategory_name", { length: 255 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  description: text("description"),
  address: text("address"),
  avatarUri: text("avatar_uri"),
  gallery: text("gallery").array(),
  rating: real("rating").default(0),
  ratingCount: integer("rating_count").default(0),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Featured Ads (destaques) ───────────────────────────────────────────────────
export const featuredAds = pgTable("featured_ads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  providerName: varchar("provider_name", { length: 255 }),
  viewCount: integer("view_count").default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Types ─────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type SubService = typeof subServices.$inferSelect;
export type InsertSubService = typeof subServices.$inferInsert;
export type Region = typeof regions.$inferSelect;
export type InsertRegion = typeof regions.$inferInsert;
export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;
export type Provider = typeof providers.$inferSelect;
export type InsertProvider = typeof providers.$inferInsert;
export type FeaturedAd = typeof featuredAds.$inferSelect;
export type InsertFeaturedAd = typeof featuredAds.$inferInsert;
