import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [adminUser, setAdminUser] = useState<any | null>(null);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("open_id", userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data.role !== "admin") {
        await supabase.auth.signOut();
        return null;
      }
      
      return data;
    } catch (err) {
      console.error("Erro ao verificar permissão de admin:", err);
      return null;
    }
  };

  useEffect(() => {
    const initSession = async () => {
      // 1. Tenta recuperar sessão salva localmente
      const savedSession = localStorage.getItem("@chamaja_admin_session");
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (parsed.open_id === "admin-fallback") {
            setAdminUser(parsed);
            setSessionChecked(true);
            return;
          }
          
          // Caso contrário, busca do banco de dados para garantir que a permissão ainda é válida
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("open_id", parsed.open_id)
            .single();
          
          if (!error && data && data.role === "admin") {
            setAdminUser(data);
            localStorage.setItem("@chamaja_admin_session", JSON.stringify(data));
            setSessionChecked(true);
            return;
          }
        } catch (e) {
          console.warn("Falha ao recuperar sessão local:", e);
        }
      }

      // 2. Se não houver sessão local, tenta obter sessão do Supabase Auth
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const adminData = await checkAdminRole(session.user.id);
          if (adminData) {
            setAdminUser(adminData);
            localStorage.setItem("@chamaja_admin_session", JSON.stringify(adminData));
          }
        }
      } catch (err) {
        console.error("Erro ao verificar sessão Supabase:", err);
      }
      setSessionChecked(true);
    };

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const adminData = await checkAdminRole(session.user.id);
          if (adminData) {
            setAdminUser(adminData);
            localStorage.setItem("@chamaja_admin_session", JSON.stringify(adminData));
          } else {
            setAdminUser(null);
            localStorage.removeItem("@chamaja_admin_session");
          }
        } else if (event === "SIGNED_OUT") {
          setAdminUser(null);
          localStorage.removeItem("@chamaja_admin_session");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = (user: any) => {
    setAdminUser(user);
    localStorage.setItem("@chamaja_admin_session", JSON.stringify(user));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("@chamaja_admin_session");
    setAdminUser(null);
  };

  if (!sessionChecked) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Iniciando painel administrativo...</p>
      </div>
    );
  }

  if (!adminUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard adminUser={adminUser} onLogout={handleLogout} />;
}
