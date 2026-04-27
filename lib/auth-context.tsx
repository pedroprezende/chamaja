import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AuthProvider = "google" | "microsoft" | "apple" | "email";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  provider: AuthProvider;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserPreferences: (preferences: Record<string, any>) => Promise<void>;
  updateProfile: (name: string, avatar?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sessão ao iniciar o app
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const userJson = await AsyncStorage.getItem("@chamaja_user");
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (e) {
      console.error("Erro ao restaurar sessão:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: User) => {
    await AsyncStorage.setItem("@chamaja_user", JSON.stringify(userData));
    setUser(userData);
  };

  const signInWithGoogle = async () => {
    try {
      // Simulação de login com Google
      // Em produção, isso seria integrado com o backend OAuth
      const mockUser: User = {
        id: `google_${Date.now()}`,
        email: "user@gmail.com",
        name: "Google User",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
        provider: "google",
        createdAt: new Date().toISOString(),
      };
      await saveUser(mockUser);
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      throw error;
    }
  };

  const signInWithMicrosoft = async () => {
    try {
      // Simulação de login com Microsoft
      const mockUser: User = {
        id: `microsoft_${Date.now()}`,
        email: "user@outlook.com",
        name: "Microsoft User",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
        provider: "microsoft",
        createdAt: new Date().toISOString(),
      };
      await saveUser(mockUser);
    } catch (error) {
      console.error("Erro ao fazer login com Microsoft:", error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      // Simulação de login com Apple
      const mockUser: User = {
        id: `apple_${Date.now()}`,
        email: "user@icloud.com",
        name: "Apple User",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
        provider: "apple",
        createdAt: new Date().toISOString(),
      };
      await saveUser(mockUser);
    } catch (error) {
      console.error("Erro ao fazer login com Apple:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      // Validação básica
      if (!email || !password || !name) {
        throw new Error("Todos os campos são obrigatórios");
      }
      if (password.length < 6) {
        throw new Error("Senha deve ter no mínimo 6 caracteres");
      }

      const mockUser: User = {
        id: `email_${Date.now()}`,
        email,
        name,
        provider: "email",
        createdAt: new Date().toISOString(),
      };
      await saveUser(mockUser);
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      if (!email || !password) {
        throw new Error("Email e senha são obrigatórios");
      }

      const mockUser: User = {
        id: `email_${Date.now()}`,
        email,
        name: email.split("@")[0],
        provider: "email",
        createdAt: new Date().toISOString(),
      };
      await saveUser(mockUser);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem("@chamaja_user");
      setUser(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  };

  const updateUserPreferences = async (preferences: Record<string, any>) => {
    try {
      if (user) {
        const updatedUser = { ...user, ...preferences };
        await saveUser(updatedUser);
      }
    } catch (error) {
      console.error("Erro ao atualizar preferências:", error);
      throw error;
    }
  };

  const updateProfile = async (name: string, avatar?: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      if (!name.trim()) throw new Error("Nome não pode ser vazio");
      const updatedUser: User = {
        ...user,
        name: name.trim(),
        ...(avatar !== undefined ? { avatar } : {}),
      };
      await saveUser(updatedUser);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn: user !== null,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithApple,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    updateUserPreferences,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
