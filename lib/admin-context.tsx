import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "moderator";
  createdAt: string;
}

interface AdminContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Mock admin credentials (in production, use Firebase)
const ADMIN_CREDENTIALS = {
  email: "admin@chamaja.com",
  password: "admin123456",
};

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in
    const checkAdminSession = async () => {
      try {
        const savedAdmin = await AsyncStorage.getItem("admin_user");
        if (savedAdmin) {
          setAdminUser(JSON.parse(savedAdmin));
        }
      } catch (error) {
        console.error("Error checking admin session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock authentication (in production, use Firebase)
      if (
        email === ADMIN_CREDENTIALS.email &&
        password === ADMIN_CREDENTIALS.password
      ) {
        const admin: AdminUser = {
          id: "admin_1",
          email,
          name: "Administrador",
          role: "super_admin",
          createdAt: new Date().toISOString(),
        };
        setAdminUser(admin);
        await AsyncStorage.setItem("admin_user", JSON.stringify(admin));
      } else {
        throw new Error("Credenciais inválidas");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setAdminUser(null);
      await AsyncStorage.removeItem("admin_user");
    } finally {
      setIsLoading(false);
    }
  };

  const value: AdminContextType = {
    adminUser,
    isLoading,
    login,
    logout,
    isAdmin: !!adminUser,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
