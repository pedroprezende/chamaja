import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Copy,
  Check,
  LogOut,
  Users,
  CheckCircle2,
  UserCheck,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface Referral {
  id: number;
  codigoIndicacao: string;
  nomeIndicado: string;
  telefoneIndicado: string;
  status: "novo" | "contatado" | "cadastrado" | "ativo";
  createdAt: string;
}

interface Partner {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  codigoIndicacao: string;
}

export default function Parceiros() {
  // Auth state
  const [partner, setPartner] = useState<Partner | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [senha, setSenha] = useState("");

  // Dashboard state
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check for active session on load
  useEffect(() => {
    const savedToken = localStorage.getItem("partner_token");
    const savedPartner = localStorage.getItem("partner_profile");
    if (savedToken && savedPartner) {
      setSessionToken(savedToken);
      setPartner(JSON.parse(savedPartner));
    }
  }, []);

  // Fetch referrals when session is active
  useEffect(() => {
    if (sessionToken) {
      fetchReferrals();
    }
  }, [sessionToken]);

  const fetchReferrals = async () => {
    if (!sessionToken) return;
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/partners/dashboard", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setReferrals(result.referrals || []);
      } else {
        toast.error(result.error || "Falha ao carregar suas indicações.");
        // If unauthorized/session expired, logout
        if (response.status === 401) {
          handleLogout();
        }
      }
    } catch (err) {
      console.error("Error fetching referrals:", err);
      toast.error("Erro de conexão ao buscar indicações.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const response = await fetch("/api/partners/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          localStorage.setItem("partner_token", result.sessionToken);
          localStorage.setItem(
            "partner_profile",
            JSON.stringify(result.partner)
          );
          setSessionToken(result.sessionToken);
          setPartner(result.partner);
          toast.success(`Bem-vindo de volta, ${result.partner.nome}!`);
          resetForm();
        } else {
          toast.error(
            result.error || "Falha no login. Verifique suas credenciais."
          );
        }
      } else {
        // Registration flow
        const response = await fetch("/api/partners/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, telefone, cidade, senha }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          toast.success(
            "Cadastro realizado com sucesso! Agora você pode fazer login."
          );
          setIsLogin(true);
          setSenha("");
        } else {
          toast.error(result.error || "Falha ao realizar cadastro.");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("partner_token");
    localStorage.removeItem("partner_profile");
    setSessionToken(null);
    setPartner(null);
    setReferrals([]);
    toast.success("Sessão encerrada.");
  };

  const resetForm = () => {
    setNome("");
    setEmail("");
    setTelefone("");
    setCidade("");
    setSenha("");
  };

  const copyReferralLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link de indicação copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "novo":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Novo
          </span>
        );
      case "contatado":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Contatado
          </span>
        );
      case "cadastrado":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Cadastrado
          </span>
        );
      case "ativo":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            Ativo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img
              src="/assets/images/logo-xamaja.png"
              alt="XamaJá"
              className="h-10 w-auto object-contain"
            />
          </a>
          <nav className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Início
            </a>
            {partner && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {!partner ? (
          // Auth Screen
          <section className="flex-1 py-16 md:py-24 bg-gradient-to-b from-background to-background/50 flex items-center justify-center">
            <div className="container mx-auto px-4 max-w-lg">
              <div className="text-center mb-8 space-y-3">
                <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                  <span className="text-primary text-xs font-semibold uppercase tracking-wider">
                    ✦ Programa de Parceiros
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                  Seja um Parceiro XamaJá
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Indique prestadores e comércios locais, ajude a nossa rede a
                  crescer e acompanhe suas indicações.
                </p>
              </div>

              <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl">
                {/* Tabs switcher */}
                <div className="flex bg-background border border-border rounded-xl p-1 mb-8">
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      resetForm();
                    }}
                    className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${
                      isLogin
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      resetForm();
                    }}
                    className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${
                      !isLogin
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Criar Conta
                  </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                  {!isLogin && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white uppercase tracking-wider">
                          Nome Completo
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                          <Input
                            type="text"
                            placeholder="Ex: Pedro Silva"
                            required
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary focus:border-primary text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-white uppercase tracking-wider">
                            Telefone
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                            <Input
                              type="tel"
                              placeholder="(11) 99999-9999"
                              required
                              value={telefone}
                              onChange={e => setTelefone(e.target.value)}
                              className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary focus:border-primary text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-white uppercase tracking-wider">
                            Cidade
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                            <Input
                              type="text"
                              placeholder="Bragança Paulista"
                              required
                              value={cidade}
                              onChange={e => setCidade(e.target.value)}
                              className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary focus:border-primary text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                      <Input
                        type="email"
                        placeholder="parceiro@exemplo.com"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary focus:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        required
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary focus:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground font-black uppercase tracking-wider h-12 rounded-xl mt-4 hover:bg-primary/95 transition shadow-lg shadow-primary/10 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="loader-btn w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>
                          {isLogin ? "Acessar Painel" : "Criar Minha Conta"}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </section>
        ) : (
          // Dashboard Screen
          <section className="flex-1 py-12 bg-gradient-to-b from-background to-background/50">
            <div className="container mx-auto px-4 max-w-6xl">
              {/* Profile Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-white">
                    Olá, <span className="text-primary">{partner.nome}</span>!
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base flex items-center gap-1.5">
                    <MapPin className="h-4.5 w-4.5 text-primary flex-shrink-0" />
                    Parceiro de {partner.cidade} • Acompanhe suas indicações
                    abaixo
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={fetchReferrals}
                    disabled={isRefreshing}
                    className="border-border text-foreground hover:bg-card px-4 h-11 rounded-xl text-sm font-semibold flex items-center gap-2"
                  >
                    <Clock
                      className={`h-4.5 w-4.5 text-primary ${isRefreshing ? "animate-spin" : ""}`}
                    />
                    Atualizar Dados
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Card: Referral Code */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                      <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          Sua Identidade
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Indique novos prestadores
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Seu Código Único
                      </span>
                      <div className="bg-background border border-border rounded-2xl px-6 py-4 flex items-center justify-center border-dashed border-primary/30">
                        <span className="text-3xl font-black tracking-widest text-primary font-mono">
                          {partner.codigoIndicacao}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Link de Indicação
                      </span>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/?ref=${partner.codigoIndicacao}`}
                          className="w-full bg-background border border-border text-muted-foreground rounded-2xl pl-4 pr-14 py-3.5 focus:outline-none text-xs text-ellipsis overflow-hidden"
                        />
                        <button
                          onClick={() =>
                            copyReferralLink(
                              `${window.location.origin}/?ref=${partner.codigoIndicacao}`
                            )
                          }
                          className="absolute right-2 top-2 p-2 rounded-xl bg-card border border-border text-foreground hover:text-primary hover:border-primary/50 transition"
                          title="Copiar Link"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 text-xs text-muted-foreground leading-relaxed flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-2xl p-4">
                      <CheckCircle2 className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
                      <p>
                        Compartilhe este link com prestadores ou comércios. Ao
                        se cadastrarem, eles serão vinculados automaticamente à
                        sua conta de parceiro.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Card: Referrals List */}
                <div className="lg:col-span-8">
                  <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden min-h-[400px] flex flex-col">
                    <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          Indicações Realizadas
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Controle de leads cadastrados
                        </p>
                      </div>
                      <span className="bg-zinc-800 text-zinc-200 px-3 py-1 rounded-full text-xs font-bold font-mono">
                        {referrals.length}{" "}
                        {referrals.length === 1 ? "indicação" : "indicações"}
                      </span>
                    </div>

                    {referrals.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-600">
                          <Users className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-bold text-white">
                            Nenhuma indicação ainda
                          </p>
                          <p className="text-sm text-muted-foreground max-w-sm">
                            Compartilhe seu link exclusivo com prestadores
                            locais para começar a registrar indicações!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-background/30">
                              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Profissional / Comércio
                              </th>
                              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Telefone
                              </th>
                              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Data
                              </th>
                              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {referrals.map(ref => (
                              <tr
                                key={ref.id}
                                className="hover:bg-zinc-800/10 transition"
                              >
                                <td className="px-6 py-4">
                                  <span className="text-sm font-bold text-white">
                                    {ref.nomeIndicado}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-zinc-300 font-mono">
                                    {ref.telefoneIndicado}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-zinc-400">
                                    {new Date(ref.createdAt).toLocaleDateString(
                                      "pt-BR"
                                    )}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {getStatusBadge(ref.status)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 XamaJá. Todos os direitos reservados.</p>
          <p>O X MARCA O LOCAL.</p>
        </div>
      </footer>
    </div>
  );
}
