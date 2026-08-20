import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Only use AsyncStorage on native platforms (iOS/Android)
    // On web, Supabase defaults to localStorage
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

let cachedSessionToken: string | null = null;

export function getCachedSessionToken(): string | null {
  return cachedSessionToken;
}

export function setCachedSessionToken(token: string | null) {
  cachedSessionToken = token;
}

// Subscreve para atualizar o token em memória sempre que a sessão mudar
supabase.auth.onAuthStateChange((event, session) => {
  cachedSessionToken = session?.access_token || null;
});
