import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getPrivacyPolicyHtml, getDeletionPolicyHtml } from "./privacy";
import * as db from "../db";
 
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
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
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
    res.json({ status: "ok", message: "Servidor ChamaJá está ONLINE!", database: !!process.env.DATABASE_URL });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // Servir website institucional
  const rootDir = process.cwd();
  
  const publicPath = path.resolve(rootDir, "server", "public");
  app.use(express.static(publicPath));

  const projectAssetsPath = path.resolve(rootDir, "assets");
  app.use("/assets", express.static(projectAssetsPath));

  // Servir Expo Web do aplicativo
  const webDistPath = path.resolve(rootDir, "dist", "web");
  app.use("/app", express.static(webDistPath));

  // Rota de Cadastro de Prestador via Web
  app.post("/api/web-register-provider", async (req, res) => {
    try {
      const { name, email, phone, categoryId, otherCategory, city, neighborhood, description } = req.body;

      if (!name || !email || !phone || !categoryId || !city || !neighborhood || !description) {
        return res.status(400).json({ success: false, error: "Preencha todos os campos obrigatórios." });
      }

      const CATEGORY_MAP: Record<string, string> = {
        "reformas-reparos": "Reformas e Reparos",
        "assistencia-tecnica": "Assistência Técnica",
        "servicos-domesticos": "Serviços Domésticos",
        "servicos-externos": "Serviços Externos",
        "automotivo": "Automotivo",
        "beleza-estetica": "Beleza e Estética",
        "servicos-profissionais": "Serviços Profissionais",
        "saude": "Saúde",
        "eventos": "Eventos",
        "logistica": "Logística",
        "educacao": "Educação",
        "comercios": "Comércios",
        "mobilidade": "Mobilidade",
        "outro": "Outro"
      };

      const finalCategory = categoryId === "outro" ? (otherCategory || "Outro") : (CATEGORY_MAP[categoryId] || "");
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
        isActive: true,
        isVerified: false,
        rating: 5,
        ratingCount: 0,
        priceLevel: 2,
        onlineStatus: false,
      });

      console.log(`[Web API] Provider registered successfully: ${name} (${providerId}) in category: ${finalCategory}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Web API] Failed to register provider:", error);
      res.status(500).json({ success: false, error: error.message || "Erro interno no servidor." });
    }
  });

  // Fallback para rotas SPA do aplicativo Expo Web
  app.get("/app*", (req, res) => {
    res.sendFile(path.join(webDistPath, "index.html"), (err) => {
      if (err) {
        res.status(404).send("Frontend assets not found. Make sure to run the web build first.");
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
