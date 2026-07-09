import { ForbiddenError } from "../../shared/_core/errors.js";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";
import { COOKIE_NAME } from "../../shared/const.js";

// Initialize Supabase Client for the server
// Uses SERVICE_ROLE_KEY when available (for admin operations like user deletion),
// falls back to anon key for basic auth verification
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  async authenticateRequest(req: Request): Promise<User> {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token: string | undefined;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }

    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = token || cookies.get(COOKIE_NAME);

    if (!sessionCookie) {
      throw ForbiddenError("Missing auth token");
    }

    // Use Supabase to verify the JWT token with a safety timeout
    let authUser, error;
    try {
      const authPromise = supabase.auth.getUser(sessionCookie);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase Auth Timeout")), 5000),
      );

      const result = (await Promise.race([authPromise, timeoutPromise])) as any;
      authUser = result.data?.user;
      error = result.error;
    } catch (e: any) {
      console.error(
        "[Auth] Supabase verification failed or timed out:",
        e.message,
      );
      throw ForbiddenError("Authentication service timeout or failure");
    }

    if (error || !authUser) {
      console.error("[Auth] Supabase token verification failed:", error);
      throw ForbiddenError("Invalid session token");
    }

    const sessionUserId = authUser.id;
    const signedInAt = new Date();

    let user = await db.getUserByOpenId(sessionUserId);

    // If user not in DB, sync from Supabase automatically
    if (!user) {
      try {
        await db.upsertUser({
          openId: sessionUserId,
          name:
            authUser.user_metadata?.full_name ||
            authUser.email?.split("@")[0] ||
            null,
          email: authUser.email ?? null,
          loginMethod: authUser.app_metadata?.provider ?? "email",
          avatarUrl: authUser.user_metadata?.avatar_url || null,
          lastSignedIn: signedInAt,
        });
        user = await db.getUserByOpenId(sessionUserId);

        // Log user registration event
        await db.createAppEvent({
          tipoEvento: "cadastro",
          valor: authUser.app_metadata?.provider ?? "email",
          usuarioId: sessionUserId,
          utmSource: authUser.user_metadata?.utm_source || null,
        });
      } catch (upsertError) {
        console.error("[Auth] Failed to sync user from Supabase:", upsertError);
        throw ForbiddenError("Failed to sync user info");
      }
    }

    if (!user) {
      throw ForbiddenError("User not found after sync");
    }

    await db.upsertUser({
      openId: user.openId,
      avatarUrl: authUser.user_metadata?.avatar_url || null,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export const sdk = new SDKServer();
