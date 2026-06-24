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
  index,
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
  status: varchar("status", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  adminRole: varchar("admin_role", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

// ── Admins ────────────────────────────────────────────────────────────────────
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  adminRole: varchar("admin_role", { length: 50 }).default("moderador").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
}, (table) => [
  index("services_category_id_idx").on(table.categoryId),
  index("services_subcategory_id_idx").on(table.subcategoryId),
  index("services_is_active_idx").on(table.isActive),
]);

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
  avatarThumbnailUri: text("avatar_thumbnail_uri"),
  gallery: text("gallery").array(),
  rating: real("rating").default(0),
  ratingCount: integer("rating_count").default(0),
  latitude: real("latitude"),
  longitude: real("longitude"),
  coverUri: text("cover_uri"),
  coverThumbnailUri: text("cover_thumbnail_uri"),
  isVerified: boolean("is_verified").default(false).notNull(),
  hasCatalog: boolean("has_catalog").default(false).notNull(),
  onlineStatus: boolean("online_status").default(false).notNull(),
  responseTime: varchar("response_time", { length: 100 }),
  clientsServed: integer("clients_served").default(0),
  foundedYear: integer("founded_year"),
  topBadge: varchar("top_badge", { length: 100 }),
  popularServices: text("popular_services"),
  tags: text("tags"),
  workingHours: text("working_hours"),
  priceLevel: integer("price_level").default(2).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  status: varchar("status", { length: 50 }).default("ativo"),
  businessType: varchar("business_type", { length: 50 }).default("servicos").notNull(),
  deliveryTime: varchar("delivery_time", { length: 100 }).default("30-45 min"),
  displayOrder: integer("display_order").notNull().default(0),
  destaque: boolean("destaque").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("providers_category_id_idx").on(table.categoryId),
  index("providers_subcategory_id_idx").on(table.subcategoryId),
  index("providers_is_active_idx").on(table.isActive),
  index("providers_destaque_idx").on(table.destaque),
  index("providers_user_id_idx").on(table.userId),
  index("providers_latitude_idx").on(table.latitude),
  index("providers_longitude_idx").on(table.longitude),
  index("providers_rating_idx").on(table.rating),
  index("providers_online_status_idx").on(table.onlineStatus),
  index("providers_price_level_idx").on(table.priceLevel),
]);

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
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;
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
}, (table) => [
  index("reviews_professional_id_idx").on(table.professionalId),
]);

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull().references(() => users.openId, { onDelete: "cascade" }),
  providerId: varchar("provider_id", { length: 64 }).notNull().references(() => providers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("favorites_user_id_idx").on(table.userId),
  index("favorites_provider_id_idx").on(table.providerId),
]);

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

export const appEvents = pgTable("app_events", {
  id: serial("id").primaryKey(),
  tipoEvento: varchar("tipo_evento", { length: 50 }).notNull(), // busca, clique_whatsapp, visualizacao, cadastro
  valor: text("valor"), // e.g. search query, provider name
  cidade: varchar("cidade", { length: 255 }),
  prestadorId: varchar("prestador_id", { length: 64 }),
  usuarioId: varchar("usuario_id", { length: 64 }),
  utmSource: varchar("utm_source", { length: 255 }),
  criadoEm: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("app_events_prestador_id_idx").on(table.prestadorId),
  index("app_events_usuario_id_idx").on(table.usuarioId),
]);

export type AppEvent = typeof appEvents.$inferSelect;
export type InsertAppEvent = typeof appEvents.$inferInsert;

export const payments = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  prestadorId: varchar("prestador_id", { length: 64 }).notNull().references(() => providers.id, { onDelete: "cascade" }),
  plano: varchar("plano", { length: 20 }).notNull(), // 'mensal' / 'anual'
  valor: real("valor").notNull(),
  dataPagamento: timestamp("data_pagamento").notNull(),
  metodo: varchar("metodo", { length: 50 }).notNull(), // 'pix'
  nfcEnviada: boolean("nfc_enviada").default(false).notNull(),
  dataEnvioNfc: timestamp("data_envio_nfc"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const utmLinks = pgTable("utm_links", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 255 }).notNull(),
  medium: varchar("medium", { length: 255 }).notNull(),
  campaign: varchar("campaign", { length: 255 }).notNull(),
  linkCompleto: text("link_completo").notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export type UtmLink = typeof utmLinks.$inferSelect;
export type InsertUtmLink = typeof utmLinks.$inferInsert;

// ── Business Permissions ──────────────────────────────────────────────────────
export const businessPermissions = pgTable("business_permissions", {
  id: serial("id").primaryKey(),
  businessId: varchar("business_id", { length: 64 })
    .notNull()
    .unique()
    .references(() => providers.id, { onDelete: "cascade" }),
  maxServicos: integer("max_servicos").notNull().default(1),
  status: varchar("status", { length: 50 }).notNull().default("ativo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BusinessPermission = typeof businessPermissions.$inferSelect;
export type InsertBusinessPermission = typeof businessPermissions.$inferInsert;

// ── Partners ──────────────────────────────────────────────────────────────────
export const partners = pgTable("partners", {
  id: varchar("id", { length: 64 }).primaryKey(),
  nome: text("nome").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  telefone: varchar("telefone", { length: 50 }).notNull(),
  cidade: varchar("cidade", { length: 255 }).notNull(),
  codigoIndicacao: varchar("codigo_indicacao", { length: 50 }).notNull().unique(),
  comissao: real("comissao").default(0),
  pagamentoComissao: real("pagamento_comissao").default(0),
  planoAssociado: varchar("plano_associado", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

// ── Referrals ─────────────────────────────────────────────────────────────────
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  partnerId: varchar("partner_id", { length: 64 })
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  codigoIndicacao: varchar("codigo_indicacao", { length: 50 }).notNull(),
  nomeIndicado: text("nome_indicado").notNull(),
  telefoneIndicado: varchar("telefone_indicado", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("novo").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;




