import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import type { UserRole } from "./roles-permissions";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

// Admin validation is handled server-side via Supabase + role check.
// No hardcoded credentials are stored client-side.

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há sessão salva ao inicializar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("@admin_user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error("Erro ao verificar sessão:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error("Credenciais inválidas");
      }

      if (!data.user) {
        throw new Error("Falha ao autenticar");
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role, name")
        .eq("open_id", data.user.id)
        .single();

      const userRole = (profile?.role as UserRole) || "user";
      if (userRole !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Acesso não autorizado");
      }

      const adminUser: AdminUser = {
        id: data.user.id,
        email: data.user.email || email,
        name: profile?.name || data.user.email?.split("@")[0] || "Admin",
        role: "admin",
        createdAt: data.user.created_at,
        lastLogin: new Date().toISOString(),
      };

      await AsyncStorage.setItem("@admin_user", JSON.stringify(adminUser));
      setUser(adminUser);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao fazer login";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem("@admin_user");
      setUser(null);
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setError("Registro de admin não permitido");
    throw new Error("Registro de admin não permitido");
  };

  const clearError = () => setError(null);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        error,
        clearError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth deve ser usado dentro de AdminAuthProvider");
  }
  return context;
}
