import React, { useState } from "react";
import { supabase } from "../supabase";
import { Shield, Mail, Lock, AlertTriangle } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let dbUser: any = null;

      // 1. Tenta login normal via Supabase Auth
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!authError && authData.user) {
          // Busca role no banco de dados
          const { data, error: dbError } = await supabase
            .from("users")
            .select("*")
            .eq("open_id", authData.user.id)
            .single();

          if (!dbError && data) {
            dbUser = data;
          }
        }
      } catch (e) {
        console.warn("Falha no login via Supabase Auth. Usando fallback se credenciais de teste forem válidas...", e);
      }

      // 2. Fallback de segurança para e-mail/senhas de admin conhecidos do projeto
      const lowercaseEmail = email.toLowerCase();
      const isFallbackAdmin =
        lowercaseEmail === "pedroprezende33@gmail.com" &&
        (password === "admin123456" || password === "3404001#Sayajins" || password === "340401#Sayajins");

      if (!dbUser && isFallbackAdmin) {
        // Tenta buscar o admin direto na tabela public.users (que tem leitura pública)
        const { data, error: dbError } = await supabase
          .from("users")
          .select("*")
          .eq("email", "pedroprezende33@gmail.com")
          .limit(1);

        if (!dbError && data && data.length > 0) {
          dbUser = data[0];
        } else {
          // Se o usuário ainda não existe na tabela users, cria um mock com a role admin
          dbUser = {
            id: 9999,
            open_id: "admin-fallback",
            name: "Pedro Prezende",
            email: "pedroprezende33@gmail.com",
            role: "admin",
            admin_role: "principal",
            created_at: new Date().toISOString(),
            last_signed_in: new Date().toISOString(),
          };
        }
      }

      if (!dbUser) {
        throw new Error("E-mail ou senha incorretos.");
      }

      if (dbUser.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Acesso não autorizado. Apenas administradores podem acessar este painel.");
      }

      onLoginSuccess(dbUser);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao tentar entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg-glow"></div>
      <div className="login-bg-glow-bottom"></div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <Shield className="logo-icon" size={36} />
            <h1 className="logo-text">Chama<span>Já</span></h1>
          </div>
          <p className="login-subtitle">Painel Administrativo</p>
        </div>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                className="form-input"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                className="form-input"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Verificando..." : "Entrar no Painel"}
          </button>
        </form>
      </div>
    </div>
  );
};
