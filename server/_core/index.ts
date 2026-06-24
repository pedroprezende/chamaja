import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getPrivacyPolicyHtml, getDeletionPolicyHtml } from "./privacy";
import * as db from "../db";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));

  // Logger middleware
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  registerStorageProxy(app);
  // registerOAuthRoutes(app); // Legacy OAuth removed in favor of Supabase Auth

  app.get("/politica-de-privacidade", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(getPrivacyPolicyHtml());
  });

  app.get("/privacy-policy", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(getPrivacyPolicyHtml());
  });

  app.get("/exclusao-conta", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(getDeletionPolicyHtml());
  });

  app.get("/delete-account", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(getDeletionPolicyHtml());
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Servidor ChamaJá está ONLINE!",
      database: !!process.env.DATABASE_URL,
    });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // Servir website institucional (React SPA em home/dist/public ou legado em server/public)
  const rootDir = process.cwd();

  const reactWebsitePath = path.resolve(rootDir, "home", "dist", "public");
  const legacyPublicPath = path.resolve(rootDir, "server", "public");
  const publicPath = fs.existsSync(reactWebsitePath)
    ? reactWebsitePath
    : legacyPublicPath;
  app.use(express.static(publicPath));

  const projectAssetsPath = path.resolve(rootDir, "assets");
  app.use("/assets", express.static(projectAssetsPath));

  // Servir Expo Web do aplicativo
  const webDistPath = path.resolve(rootDir, "dist", "web");
  app.use("/app", express.static(webDistPath));

  // Servir arquivos do Expo Web a partir da raiz para evitar que requisições retornem 404 e quebrem o app
  app.use("/_expo", express.static(path.resolve(webDistPath, "_expo")));
  app.use("/assets", express.static(path.resolve(webDistPath, "assets")));
  app.get("/service-worker.js", (req, res) =>
    res.sendFile(path.resolve(webDistPath, "service-worker.js")),
  );
  app.get("/manifest.json", (req, res) =>
    res.sendFile(path.resolve(webDistPath, "manifest.json")),
  );
  app.get("/favicon.png", (req, res) =>
    res.sendFile(path.resolve(webDistPath, "favicon.png")),
  );
  app.get("/favicon.ico", (req, res) =>
    res.sendFile(path.resolve(webDistPath, "favicon.ico")),
  );

  // Redireciona a URL de callback do Supabase da raiz para dentro da pasta do aplicativo (/app)
  app.get("/oauth/callback", (req, res) => {
    res.redirect(
      302,
      "/app/oauth/callback" + req.url.slice("/oauth/callback".length),
    );
  });

  // Rota de Cadastro de Prestador via Web
  app.post("/api/web-register-provider", async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        categoryId,
        otherCategory,
        city,
        neighborhood,
        description,
        refCode,
      } = req.body;

      if (
        !name ||
        !email ||
        !phone ||
        !categoryId ||
        !city ||
        !neighborhood ||
        !description
      ) {
        return res.status(400).json({
          success: false,
          error: "Preencha todos os campos obrigatórios.",
        });
      }

      const CATEGORY_MAP: Record<string, string> = {
        "reformas-reparos": "Reformas e Reparos",
        "assistencia-tecnica": "Assistência Técnica",
        "servicos-domesticos": "Serviços Domésticos",
        "servicos-externos": "Serviços Externos",
        automotivo: "Automotivo",
        "beleza-estetica": "Beleza e Estética",
        "servicos-profissionais": "Serviços Profissionais",
        saude: "Saúde",
        eventos: "Eventos",
        logistica: "Logística",
        educacao: "Educação",
        comercios: "Comércios",
        mobilidade: "Mobilidade",
        outro: "Outro",
      };

      const finalCategory =
        categoryId === "outro"
          ? otherCategory || "Outro"
          : CATEGORY_MAP[categoryId] || "";
      const providerId = `prov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.createProvider({
        id: providerId,
        userId: null,
        name,
        category: finalCategory,
        categoryId,
        city,
        neighborhood,
        phone,
        whatsapp: phone,
        description,
        plan: "monthly",
        isActive: false,
        status: "pendente",
        isVerified: false,
        rating: 5,
        ratingCount: 0,
        priceLevel: 2,
        onlineStatus: false,
      });

      console.log(
        `[Web API] Provider registered successfully: ${name} (${providerId}) in category: ${finalCategory}`,
      );

      // Se houver código de indicação, associa o lead ao parceiro
      if (refCode) {
        try {
          const partner = await db.getPartnerByCode(refCode);
          if (partner) {
            await db.createReferral({
              partnerId: partner.id,
              codigoIndicacao: refCode,
              nomeIndicado: name,
              telefoneIndicado: phone,
              status: "novo",
            });
            console.log(
              `[Web API] Lead/referral registered successfully for partner: ${partner.nome} (${refCode})`,
            );
          } else {
            console.warn(`[Web API] Partner with code ${refCode} not found`);
          }
        } catch (refErr) {
          console.error("[Web API] Failed to create referral entry:", refErr);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("[Web API] Failed to register provider:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno no servidor.",
      });
    }
  });

  // ── Rotas do Sistema de Parceiros ───────────────────────────────────────────

  // Registro de Parceiro
  app.post("/api/partners/register", async (req, res) => {
    try {
      const { nome, email, telefone, cidade, senha } = req.body;
      if (!nome || !email || !telefone || !cidade || !senha) {
        return res
          .status(400)
          .json({ success: false, error: "Todos os campos são obrigatórios." });
      }

      // 1. Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
      });

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      if (!data.user) {
        return res.status(400).json({
          success: false,
          error: "Falha ao criar conta de autenticação.",
        });
      }

      // 2. Gerar código único de indicação (Primeiro nome + 3 números aleatórios)
      const firstName = nome
        .trim()
        .split(" ")[0]
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
      const randomNum = Math.floor(100 + Math.random() * 900);
      const codigoIndicacao = `${firstName}${randomNum}`;

      // 3. Salvar perfil de parceiro no banco de dados local
      await db.createPartner({
        id: data.user.id,
        nome,
        email,
        telefone,
        cidade,
        codigoIndicacao,
      });

      res.json({ success: true, message: "Parceiro cadastrado com sucesso!" });
    } catch (error: any) {
      console.error("[Web API] Erro no cadastro de parceiro:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno no servidor.",
      });
    }
  });

  // Login de Parceiro
  app.post("/api/partners/login", async (req, res) => {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        return res
          .status(400)
          .json({ success: false, error: "E-mail e senha são obrigatórios." });
      }

      // 1. Login no Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      if (!data.user || !data.session) {
        return res
          .status(400)
          .json({ success: false, error: "Falha ao iniciar sessão." });
      }

      // 2. Buscar perfil de parceiro no banco de dados
      const partner = await db.getPartnerById(data.user.id);
      if (!partner) {
        return res.status(404).json({
          success: false,
          error: "Perfil de parceiro não encontrado no banco local.",
        });
      }

      res.json({
        success: true,
        sessionToken: data.session.access_token,
        partner: {
          id: partner.id,
          nome: partner.nome,
          email: partner.email,
          telefone: partner.telefone,
          cidade: partner.cidade,
          codigoIndicacao: partner.codigoIndicacao,
        },
      });
    } catch (error: any) {
      console.error("[Web API] Erro no login de parceiro:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno no servidor.",
      });
    }
  });

  // Dashboard de Indicações do Parceiro
  app.get("/api/partners/dashboard", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ success: false, error: "Não autorizado. Token ausente." });
      }

      const token = authHeader.split(" ")[1];

      // 1. Validar token no Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res
          .status(401)
          .json({ success: false, error: "Sessão inválida ou expirada." });
      }

      // 2. Buscar indicações associadas ao parceiro
      const referralsList = await db.getReferralsByPartnerId(user.id);

      res.json({
        success: true,
        referrals: referralsList,
      });
    } catch (error: any) {
      console.error("[Web API] Erro ao carregar dashboard do parceiro:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno no servidor.",
      });
    }
  });

  // ── Rotas do Sistema de Parceiros de Negócios (Prestadores e Comércios) ─────

  // Registro de Parceiro de Negócio (Prestador / Comércio)
  app.post("/api/business-partner/register", async (req, res) => {
    try {
      const { name, email, password, whatsapp, city, type } = req.body;
      if (!name || !email || !password || !whatsapp || !city || !type) {
        return res
          .status(400)
          .json({ success: false, error: "Todos os campos são obrigatórios." });
      }

      if (type !== "prestador" && type !== "comercio") {
        return res
          .status(400)
          .json({ success: false, error: "Tipo de parceiro inválido." });
      }

      // 1. Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      if (!data.user) {
        return res.status(400).json({
          success: false,
          error: "Falha ao criar conta de autenticação.",
        });
      }

      // 2. Salvar no banco local (users)
      await db.upsertUser({
        openId: data.user.id,
        name,
        email,
        phone: whatsapp,
        role: "user",
        tipo: type,
        lastSignedIn: new Date(),
      });

      const providerId = `prov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 3. Salvar perfil de negócio (providers)
      await db.createProvider({
        id: providerId,
        userId: data.user.id,
        name,
        phone: whatsapp,
        whatsapp,
        city,
        isActive: false, // Requer aprovação do admin
        status: "pendente",
        businessType: type === "comercio" ? "comercio" : "servicos",
        categoryId: type === "comercio" ? "comercios" : null,
        category: type === "comercio" ? "Comércios" : null,
        services: "[]",
        rating: 5,
        ratingCount: 0,
        priceLevel: 2,
        onlineStatus: false,
      });

      // 4. Salvar permissões do negócio (businessPermissions)
      await db.createBusinessPermission({
        businessId: providerId,
        maxServicos: 1, // Limite inicial de 1 serviço (preparando para planos futuros)
        status: "pendente",
      });

      // Log event
      await db.createAppEvent({
        tipoEvento: "cadastro",
        valor: `parceiro_${type}`,
        cidade: city,
        prestadorId: providerId,
        usuarioId: data.user.id,
      });

      res.json({
        success: true,
        message:
          "Cadastro realizado com sucesso! Aguarde a aprovação do administrador.",
      });
    } catch (error: any) {
      console.error(
        "[Web API] Erro no cadastro de parceiro de negócio:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno no servidor.",
      });
    }
  });

  // Login de Parceiro de Negócio (Prestador / Comércio)
  app.post("/api/business-partner/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ success: false, error: "E-mail e senha são obrigatórios." });
      }

      // 1. Login no Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      if (!data.user || !data.session) {
        return res
          .status(400)
          .json({ success: false, error: "Falha ao iniciar sessão." });
      }

      // 2. Buscar usuário localmente para validar o tipo
      let userProfile = await db.getUserByOpenId(data.user.id);
      if (!userProfile) {
        // Sincroniza se não encontrado no banco local
        await db.upsertUser({
          openId: data.user.id,
          name:
            data.user.user_metadata?.full_name ||
            data.user.email?.split("@")[0] ||
            null,
          email: data.user.email ?? null,
          loginMethod: "email",
          tipo: "cliente", // default se não cadastrado pelo fluxo do parceiro
        });
        userProfile = await db.getUserByOpenId(data.user.id);
      }

      if (!userProfile) {
        return res
          .status(404)
          .json({ success: false, error: "Usuário não encontrado." });
      }

      // Validar tipo
      if (
        userProfile.tipo !== "prestador" &&
        userProfile.tipo !== "comercio" &&
        userProfile.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          error: "Acesso negado. Apenas parceiros podem acessar esta área.",
        });
      }

      // 3. Buscar perfil de negócio vinculado
      const businessProfile = await db.getProviderByUserId(data.user.id);

      res.json({
        success: true,
        sessionToken: data.session.access_token,
        user: {
          id: userProfile.openId,
          name: userProfile.name,
          email: userProfile.email,
          tipo: userProfile.tipo,
          role: userProfile.role,
        },
        business: businessProfile
          ? {
              id: businessProfile.id,
              name: businessProfile.name,
              category: businessProfile.category,
              categoryId: businessProfile.categoryId,
              city: businessProfile.city,
              neighborhood: businessProfile.neighborhood,
              phone: businessProfile.phone,
              whatsapp: businessProfile.whatsapp,
              description: businessProfile.description,
              address: businessProfile.address,
              avatarUri: businessProfile.avatarUri,
              coverUri: businessProfile.coverUri,
              gallery: businessProfile.gallery,
              isActive: businessProfile.isActive,
              status: businessProfile.status,
              services: businessProfile.services
                ? JSON.parse(businessProfile.services)
                : [],
            }
          : null,
      });
    } catch (error: any) {
      console.error("[Web API] Erro no login de parceiro de negócio:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno no servidor.",
      });
    }
  });

  // Obter Perfil do "Meu Negócio"
  app.get("/api/business-partner/profile", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ success: false, error: "Não autorizado. Token ausente." });
      }

      const token = authHeader.split(" ")[1];

      // 1. Validar token no Supabase
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !authUser) {
        return res
          .status(401)
          .json({ success: false, error: "Sessão inválida ou expirada." });
      }

      // 2. Buscar perfil local do parceiro e de negócio
      const userProfile = await db.getUserByOpenId(authUser.id);
      const businessProfile = await db.getProviderByUserId(authUser.id);

      if (!userProfile) {
        return res
          .status(404)
          .json({ success: false, error: "Perfil de usuário não encontrado." });
      }

      if (!businessProfile) {
        return res
          .status(404)
          .json({ success: false, error: "Perfil de negócio não encontrado." });
      }

      // Buscar as categorias do sistema para permitir que ele selecione uma
      const categories = await db.getCategories();

      // Buscar permissões de limite de serviços
      const permissions = await db.getBusinessPermissionByProviderId(
        businessProfile.id,
      );

      res.json({
        success: true,
        user: {
          id: userProfile.openId,
          name: userProfile.name,
          email: userProfile.email,
          tipo: userProfile.tipo,
        },
        business: {
          id: businessProfile.id,
          name: businessProfile.name,
          category: businessProfile.category,
          categoryId: businessProfile.categoryId,
          city: businessProfile.city,
          neighborhood: businessProfile.neighborhood,
          phone: businessProfile.phone,
          whatsapp: businessProfile.whatsapp,
          description: businessProfile.description,
          address: businessProfile.address,
          avatarUri: businessProfile.avatarUri,
          coverUri: businessProfile.coverUri,
          gallery: businessProfile.gallery || [],
          isActive: businessProfile.isActive,
          status: businessProfile.status,
          services: businessProfile.services
            ? JSON.parse(businessProfile.services)
            : [],
        },
        permissions: permissions
          ? {
              maxServicos: permissions.maxServicos,
              status: permissions.status,
            }
          : { maxServicos: 1, status: "pendente" },
        categories: categories.map((c) => ({ id: c.id, name: c.name })),
      });
    } catch (error: any) {
      console.error("[Web API] Erro ao carregar perfil do parceiro:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno no servidor.",
      });
    }
  });

  // Atualizar Perfil do "Meu Negócio" (incluindo serviços)
  app.put("/api/business-partner/profile", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ success: false, error: "Não autorizado. Token ausente." });
      }

      const token = authHeader.split(" ")[1];

      // 1. Validar token no Supabase
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !authUser) {
        return res
          .status(401)
          .json({ success: false, error: "Sessão inválida ou expirada." });
      }

      const businessProfile = await db.getProviderByUserId(authUser.id);
      if (!businessProfile) {
        return res
          .status(404)
          .json({ success: false, error: "Perfil de negócio não encontrado." });
      }

      const {
        name,
        description,
        phone,
        whatsapp,
        categoryId,
        category,
        address,
        city,
        neighborhood,
        avatarUri,
        coverUri,
        gallery,
        services, // Array de serviços
      } = req.body;

      if (!name) {
        return res
          .status(400)
          .json({ success: false, error: "Nome do negócio é obrigatório." });
      }

      // Validar limite de serviços se for informado
      if (services && Array.isArray(services)) {
        const permissions = await db.getBusinessPermissionByProviderId(
          businessProfile.id,
        );
        const limit = permissions ? permissions.maxServicos : 1;
        if (limit !== -1 && services.length > limit) {
          return res.status(400).json({
            success: false,
            error: `Você atingiu o limite de ${limit} serviço(s) para o seu plano atual.`,
          });
        }
      }

      // Validar coordenadas do endereço se mudou
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not found");

      let latitude = businessProfile.latitude;
      let longitude = businessProfile.longitude;
      const addressChanged =
        address !== businessProfile.address ||
        neighborhood !== businessProfile.neighborhood ||
        city !== businessProfile.city;

      if (addressChanged && address) {
        const { geocodeAddress } = await import("../geocoding");
        const coords = await geocodeAddress(address, neighborhood, city);
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        }
      }

      // Salvar atualizações no banco local
      const updates: any = {
        name,
        description: description || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        address: address || null,
        city: city || null,
        neighborhood: neighborhood || null,
        latitude,
        longitude,
        avatarUri: avatarUri || null,
        coverUri: coverUri || null,
        gallery: gallery || [],
        updatedAt: new Date(),
      };

      if (categoryId !== undefined) {
        updates.categoryId = categoryId;
        updates.category = category || null;
      }

      if (services !== undefined) {
        updates.services = JSON.stringify(services);
      }

      await db.updateProvider(businessProfile.id, updates);

      res.json({
        success: true,
        message: "Informações do seu negócio atualizadas com sucesso!",
      });
    } catch (error: any) {
      console.error("[Web API] Erro ao atualizar perfil do parceiro:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno no servidor.",
      });
    }
  });

  // ── Rotas do Painel Administrativo de Indicações ───────────────────────────

  // Listar todas as indicações (Admin)
  app.get("/api/admin/referrals", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ success: false, error: "Não autorizado." });
      }

      const token = authHeader.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res
          .status(401)
          .json({ success: false, error: "Sessão inválida." });
      }

      // Verificar se é admin
      const userProfile = await db.getUserByOpenId(user.id);
      const isAdmin =
        userProfile?.role === "admin" ||
        userProfile?.email === "pedroprezende33@gmail.com";

      if (!isAdmin) {
        return res
          .status(403)
          .json({ success: false, error: "Acesso não autorizado." });
      }

      const allReferrals = await db.getAllReferrals();
      res.json({
        success: true,
        referrals: allReferrals,
      });
    } catch (error: any) {
      console.error(
        "[Web API] Erro ao carregar indicações para o admin:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno no servidor.",
      });
    }
  });

  // Alterar Status da Indicação (Admin)
  app.post("/api/admin/referrals/status", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ success: false, error: "Não autorizado." });
      }

      const token = authHeader.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res
          .status(401)
          .json({ success: false, error: "Sessão inválida." });
      }

      // Verificar se é admin
      const userProfile = await db.getUserByOpenId(user.id);
      const isAdmin =
        userProfile?.role === "admin" ||
        userProfile?.email === "pedroprezende33@gmail.com";

      if (!isAdmin) {
        return res
          .status(403)
          .json({ success: false, error: "Acesso não autorizado." });
      }

      const { id, status } = req.body;
      if (!id || !status) {
        return res
          .status(400)
          .json({ success: false, error: "ID e status são obrigatórios." });
      }

      await db.updateReferralStatus(Number(id), status);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Web API] Erro ao alterar status da indicação:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno no servidor.",
      });
    }
  });

  // Fallback para rotas SPA do aplicativo Expo Web
  app.get("/app*", (req, res) => {
    res.sendFile(path.join(webDistPath, "index.html"), (err) => {
      if (err) {
        res
          .status(404)
          .send(
            "Frontend assets not found. Make sure to run the web build first.",
          );
      }
    });
  });

  // Fallback para rotas SPA do website institucional
  app.get("*", (req, res) => {
    // Evitamos interceptar rotas de API, arquivos estáticos e do aplicativo Expo Web
    if (
      req.url.startsWith("/api/") ||
      req.url.startsWith("/app") ||
      req.url.startsWith("/_expo/") ||
      req.url.startsWith("/assets/")
    ) {
      return res.status(404).send("Not found");
    }
    res.sendFile(path.join(publicPath, "index.html"), (err) => {
      if (err) {
        res.status(404).send("Website assets not found.");
      }
    });
  });

  const PORT = 3000;
  const serverInstance = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[api] server listening on port ${PORT}`);
  });

  serverInstance.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[Error] Port ${PORT} is busy. Exiting to avoid mismatch.`);
      process.exit(1);
    }
  });
}

startServer().catch(console.error);
