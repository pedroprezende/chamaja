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
  imageUrl: text("image_url"),
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

// ── Providers (prestadores cadastrados pelo admin e usuários) ─────────────────
export const providers = pgTable("providers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }),
  categoryId: varchar("category_id", { length: 64 }),
  city: varchar("city", { length: 255 }),
  neighborhood: varchar("neighborhood", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  plan: varchar("plan", { length: 20 }),
  planExpiresAt: timestamp("plan_expires_at"),
  services: text("services"), // Using text for JSON stringified services to match StoredProvider easily
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

// ── Analytics ─────────────────────────────────────────────────────────────────
export const whatsappClicks = pgTable("whatsapp_clicks", {
  id: serial("id").primaryKey(),
  providerId: varchar("provider_id", { length: 64 }).references(() => providers.id, { onDelete: "set null" }),
  serviceName: varchar("service_name", { length: 255 }),
  city: varchar("city", { length: 255 }),
  userId: varchar("user_id", { length: 64 }), // Open ID from users (nullable for guests)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceViews = pgTable("service_views", {
  id: serial("id").primaryKey(),
  categoryId: varchar("category_id", { length: 64 }),
  serviceId: varchar("service_id", { length: 64 }), // can be provider id or ad id
  userId: varchar("user_id", { length: 64 }), // Open ID from users
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const searchQueries = pgTable("search_queries", {
  id: serial("id").primaryKey(),
  query: varchar("query", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WhatsappClick = typeof whatsappClicks.$inferSelect;
export type InsertWhatsappClick = typeof whatsappClicks.$inferInsert;
export type ServiceView = typeof serviceViews.$inferSelect;
export type InsertServiceView = typeof serviceViews.$inferInsert;
export type SearchQuery = typeof searchQueries.$inferSelect;
export type InsertSearchQuery = typeof searchQueries.$inferInsert;

export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: varchar("level", { length: 20 }).notNull(), // error, warn, info
  category: varchar("category", { length: 50 }).notNull(), // AUTH, UI, DB, etc
  message: text("message").notNull(),
  details: text("details"), // JSON stringified details/stack trace
  userId: varchar("user_id", { length: 64 }),
  platform: varchar("platform", { length: 50 }),
  appVersion: varchar("app_version", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = typeof systemLogs.$inferInsert;

export const reviews = pgTable("reviews", {
  id: varchar("id", { length: 64 }).primaryKey(),
  professionalId: varchar("professional_id", { length: 64 }).notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userAvatar: text("user_avatar").notNull(),
  rating: real("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
