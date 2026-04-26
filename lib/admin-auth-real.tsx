import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { adminDB, type AdminAccount } from "./admin-database";

interface AdminAuthContextType {
  user: AdminAccount | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export function AdminAuthRealProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AdminAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("@admin_user_real");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          const adminUser = await adminDB.getAdminById(parsedUser.id);
          if (adminUser) {
            setUser(adminUser);
          } else {
            await AsyncStorage.removeItem("@admin_user_real");
          }
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
    setError(null);
    try {
      const adminUser = await adminDB.getAdminByEmail(email);
      if (!adminUser) {
        throw new Error("E-mail não encontrado");
      }
      if (adminUser.password !== password) {
        throw new Error("Senha incorreta");
      }
      setUser(adminUser);
      await AsyncStorage.setItem("@admin_user_real", JSON.stringify(adminUser));
    } catch (err: any) {
      const errorMessage = err.message || "Falha ao fazer login";
      setError(errorMessage);
      throw err;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string
  ) => {
    setError(null);
    try {
      const adminUser = await adminDB.createAdmin(email, password, name);
      setUser(adminUser);
      await AsyncStorage.setItem("@admin_user_real", JSON.stringify(adminUser));
    } catch (err: any) {
      const errorMessage = err.message || "Falha ao registrar";
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem("@admin_user_real");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AdminAuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuthReal() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error(
      "useAdminAuthReal deve ser usado dentro de AdminAuthRealProvider"
    );
  }
  return context;
}
