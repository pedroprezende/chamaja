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

  // Verificar se há sessão salva ao inicializar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("@admin_user_real");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // Verificar se a sessão ainda é válida
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
    setIsLoading(true);
    setError(null);

    try {
      // Validar campos
      if (!email || !password) {
        throw new Error("E-mail e senha são obrigatórios");
      }

      // Verificar credenciais
      const isValid = await adminDB.verifyPassword(email, password);
      if (!isValid) {
        throw new Error("E-mail ou senha incorretos");
      }

      // Buscar admin
      const adminUser = await adminDB.getAdminByEmail(email);
      if (!adminUser) {
        throw new Error("Usuário não encontrado");
      }

      // Salvar sessão
      await AsyncStorage.setItem("@admin_user_real", JSON.stringify(adminUser));
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

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validar campos
      if (!email || !password || !name) {
        throw new Error("Todos os campos são obrigatórios");
      }

      if (password.length < 6) {
        throw new Error("Senha deve ter no mínimo 6 caracteres");
      }

      if (!email.includes("@")) {
        throw new Error("E-mail inválido");
      }

      // Criar admin
      const newAdmin = await adminDB.createAdmin(email, password, name);

      // Salvar sessão
      await AsyncStorage.setItem("@admin_user_real", JSON.stringify(newAdmin));
      setUser(newAdmin);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao registrar";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("@admin_user_real");
      setUser(null);
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuthReal() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error(
      "useAdminAuthReal deve ser usado dentro de AdminAuthRealProvider"
    );
  }
  return context;
}
