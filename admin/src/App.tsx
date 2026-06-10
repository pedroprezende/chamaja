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
    // Check active session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const adminData = await checkAdminRole(session.user.id);
        if (adminData) {
          setAdminUser(adminData);
        }
      }
      setSessionChecked(true);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const adminData = await checkAdminRole(session.user.id);
          if (adminData) {
            setAdminUser(adminData);
          } else {
            setAdminUser(null);
          }
        } else if (event === "SIGNED_OUT") {
          setAdminUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    return <Login onLoginSuccess={(user) => setAdminUser(user)} />;
  }

  return <Dashboard adminUser={adminUser} onLogout={handleLogout} />;
}
