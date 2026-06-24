import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

import { createTRPCClient as createVanillaTRPCClient } from "@trpc/client";
export const vanillaTrpc = createVanillaTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getApiBaseUrl()}/api/trpc`,
      async headers() {
        try {
          const { getCachedSessionToken, supabase } =
            await import("./supabase");
          let token = getCachedSessionToken();
          if (!token) {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            token = session?.access_token || null;
          }
          return token ? { Authorization: `Bearer ${token}` } : {};
        } catch (e) {
          return {};
        }
      },
      fetch(url, options) {
        return fetch(url, { ...options, credentials: "include" });
      },
    }),
  ],
});

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        // Transformer removed to fix "Unable to transform response" error
        async headers() {
          try {
            const { getCachedSessionToken, supabase } =
              await import("./supabase");
            let token = getCachedSessionToken();
            if (!token) {
              const {
                data: { session },
              } = await supabase.auth.getSession();
              token = session?.access_token || null;
            }
            return token ? { Authorization: `Bearer ${token}` } : {};
          } catch (e) {
            return {};
          }
        },
        // Custom fetch to include credentials for cookie-based auth
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
}
