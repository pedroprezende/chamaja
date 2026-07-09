import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Gift,
  Users,
  Link2,
  BarChart3,
  ChevronDown,
  CheckCircle,
  Sparkles,
  Copy,
  Share2,
  TrendingUp,
  ShieldCheck,
  Star,
  Heart,
  MapPin,
  Menu,
  X,
} from "lucide-react";

const faqItems = [
  {
    question: "Quem pode participar do programa?",
    answer:
      "Qualquer pessoa que criar uma conta no XamaJá recebe automaticamente um código de indicação exclusivo. Não é necessário ter um negócio cadastrado — basta ter uma conta.",
  },
  {
    question: "Como funciona o código de indicação?",
    answer:
      "Quando alguém se cadastra no XamaJá usando o seu link ou código, essa indicação fica registrada no seu painel. Você pode acompanhar em tempo real quantas pessoas indicou e o status de cada uma.",
  },
  {
    question: "Quanto posso ganhar indicando?",
    answer:
      "As recompensas variam conforme o plano contratado pelo parceiro indicado. Quanto mais parceiros você trouxer para a plataforma, maior o seu potencial de ganho acumulado.",
  },
  {
    question: "Como acompanho minhas indicações?",
    answer:
      "Após criar sua conta, acesse 'Minha Conta' e clique em 'Indique e Ganhe'. Lá você encontra seu código, link, histórico completo e o valor acumulado.",
  },
  {
    question: "Existe limite de indicações?",
    answer:
      "Não! Você pode indicar quantos parceiros quiser. Não há limite de indicações — quanto mais você indicar, mais você pode ganhar.",
  },
  {
    question: "O código expira?",
    answer:
      "Não. Seu código de indicação é permanente e vinculado à sua conta. Ele nunca expira enquanto sua conta estiver ativa.",
  },
];

const steps = [
  {
    icon: <Users className="w-6 h-6" />,
    step: "01",
    title: "Crie sua conta",
    description:
      "Cadastre-se gratuitamente no XamaJá. Você recebe automaticamente um código e link exclusivo de indicação.",
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    step: "02",
    title: "Compartilhe com negócios",
    description:
      "Envie seu link para comércios, prestadores de serviço e profissionais da sua região que queiram se divulgar.",
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    step: "03",
    title: "Indicação confirmada",
    description:
      "Quando o negócio se cadastrar usando seu link, a indicação é registrada automaticamente no seu painel.",
  },
  {
    icon: <Gift className="w-6 h-6" />,
    step: "04",
    title: "Receba suas recompensas",
    description:
      "Acompanhe seus ganhos em tempo real e receba suas recompensas conforme os parceiros ativam seus planos.",
  },
];

export default function IndiqueGanhe() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const exampleCode = "SEUCOD123";
  const exampleLink = `https://xamaja.com.br/?ref=${exampleCode}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img
              src="/assets/images/logo-xamaja.png"
              alt="XamaJá"
              className="h-9 w-auto object-contain"
            />
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="/" className="text-muted-foreground hover:text-white transition">
              Início
            </a>
            <a href="/busca" className="text-muted-foreground hover:text-white transition">
              Buscar serviços
            </a>
            <button
              onClick={() => {
                window.location.href = "/";
                setTimeout(() => {
                  document
                    .getElementById("cadastro")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 300);
              }}
              className="text-muted-foreground hover:text-white transition"
            >
              Anunciar meu negócio
            </button>
            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/parceiro")}
              className="text-white hover:text-white hover:bg-zinc-900 border border-zinc-800 rounded-xl px-5 h-10 text-xs"
            >
              Entrar
            </Button>
            <Button
              onClick={() => (window.location.href = "/parceiro")}
              className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl px-5 h-10 text-xs transition"
            >
              Criar Conta
            </Button>
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-background/95 backdrop-blur-sm py-4 px-6 space-y-4 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col gap-3">
              <a
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-white py-2 text-base font-semibold border-b border-zinc-900"
              >
                Início
              </a>
              <a
                href="/busca"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-white py-2 text-base font-semibold border-b border-zinc-900"
              >
                Buscar serviços
              </a>
            </nav>
            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.href = "/parceiro";
                }}
                className="w-full text-white hover:bg-zinc-900 border border-zinc-800 rounded-xl py-3 text-sm font-semibold"
              >
                Entrar
              </Button>
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.href = "/parceiro";
                }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/95 font-bold rounded-xl py-3 text-sm transition"
              >
                Criar Conta
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative py-20 md:py-32 overflow-hidden border-b border-zinc-900 bg-[#070708]">
        {/* Ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="text-primary text-xs font-bold uppercase tracking-wider">
              Programa de Indicação
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05] mb-6">
            Indique e{" "}
            <span className="text-primary">ganhe</span>
            <br />
            sem complicação
          </h1>

          <p className="text-base md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Apresente negócios locais ao XamaJá. Cada parceiro que você indicar gera recompensas
            para você — sem limite de indicações e sem burocracia.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => (window.location.href = "/parceiro")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-black px-8 py-4 h-14 rounded-xl text-base transition shadow-lg shadow-primary/20 hover:-translate-y-0.5 flex items-center gap-2"
            >
              Criar Conta Grátis
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/parceiro")}
              className="border border-zinc-800 text-white hover:bg-zinc-900 px-8 h-14 rounded-xl text-base font-semibold"
            >
              Já tenho conta — Entrar
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap gap-6 justify-center text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-primary" />
              Conta gratuita
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-primary" />
              Código automático para todos
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-primary" />
              Sem limite de indicações
            </span>
          </div>
        </div>
      </section>

      {/* ── Como Funciona ── */}
      <section className="py-20 md:py-28 bg-black border-b border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-3">
            <span className="text-primary text-xs font-bold uppercase tracking-widest">
              Passo a passo
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Como funciona
            </h2>
            <p className="text-zinc-500 text-base max-w-xl mx-auto">
              Em 4 passos simples você começa a ganhar com suas indicações
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {steps.map((item, idx) => (
              <div
                key={idx}
                className="group relative bg-zinc-950 border border-zinc-900 hover:border-primary/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(132,204,22,0.08)]"
              >
                {/* Connector line (desktop only) */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-3 w-6 h-px bg-gradient-to-r from-zinc-800 to-transparent z-10" />
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/15 transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-3xl font-black text-zinc-900 group-hover:text-zinc-800 transition-colors select-none">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quanto pode ganhar ── */}
      <section className="py-20 md:py-28 bg-[#060607] border-b border-zinc-900">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 space-y-3">
            <span className="text-primary text-xs font-bold uppercase tracking-widest">
              Recompensas
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Quanto você pode ganhar
            </h2>
            <p className="text-zinc-500 text-base max-w-xl mx-auto">
              Suas indicações geram recompensas reais. Quanto mais parceiros você trouxer, mais você ganha.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: <Gift className="w-6 h-6" />,
                title: "1 indicação",
                subtitle: "Primeiros ganhos",
                description:
                  "Cada primeiro parceiro ativado via seu código já gera recompensa para você.",
                highlight: false,
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "5+ indicações",
                subtitle: "Nível Embaixador",
                description:
                  "Com 5 ou mais parceiros indicados, você entra no nível embaixador com benefícios extras.",
                highlight: true,
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Sem limite",
                subtitle: "Escala seus ganhos",
                description:
                  "Não existe teto. Quanto mais você indicar, mais suas comissões acumulam.",
                highlight: false,
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl p-6 border transition-all duration-300 ${
                  card.highlight
                    ? "bg-primary/5 border-primary/30 shadow-[0_0_40px_rgba(132,204,22,0.1)]"
                    : "bg-zinc-950 border-zinc-900 hover:border-zinc-700"
                }`}
              >
                {card.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                      Mais popular
                    </span>
                  </div>
                )}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    card.highlight
                      ? "bg-primary/20 border border-primary/30 text-primary"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                  }`}
                >
                  {card.icon}
                </div>
                <h3 className={`text-2xl font-black mb-0.5 ${card.highlight ? "text-primary" : "text-white"}`}>
                  {card.title}
                </h3>
                <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-3">
                  {card.subtitle}
                </span>
                <p className="text-zinc-400 text-sm leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-1">
                Valores exatos disponíveis no seu painel
              </h4>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Os valores de comissão são detalhados dentro da sua conta, na seção "Indique e Ganhe". Crie sua conta agora para ver todos os detalhes do programa.
              </p>
            </div>
            <Button
              onClick={() => (window.location.href = "/parceiro")}
              className="flex-shrink-0 bg-primary text-black font-black px-6 h-12 rounded-xl hover:bg-primary/90 transition flex items-center gap-2"
            >
              Ver detalhes
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Código de Indicação ── */}
      <section className="py-20 md:py-28 bg-black border-b border-zinc-900">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-6">
              <span className="text-primary text-xs font-bold uppercase tracking-widest">
                Seu código exclusivo
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Um código.
                <br />
                Infinitas possibilidades.
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed">
                Ao criar sua conta, você recebe automaticamente um código e um link de indicação
                únicos. Compartilhe por WhatsApp, Instagram, ou onde quiser — e ganhe por cada
                parceiro que se cadastrar.
              </p>
              <ul className="space-y-3">
                {[
                  "Código pessoal e permanente",
                  "Link direto para compartilhar",
                  "Rastreamento em tempo real",
                  "Histórico completo de indicações",
                ].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-zinc-300 text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — mockup card */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-2xl pointer-events-none" />
              <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-white font-bold text-sm block">Meu Código</span>
                    <span className="text-zinc-500 text-xs">Indique e Ganhe</span>
                  </div>
                </div>

                {/* Code display */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">
                    Seu código de indicação
                  </label>
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    <span className="flex-1 text-primary font-black text-xl tracking-widest">
                      {exampleCode}
                    </span>
                    <button
                      onClick={() => handleCopy(exampleCode)}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition px-2 py-1 rounded-lg hover:bg-zinc-800"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                {/* Link display */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">
                    Seu link de indicação
                  </label>
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                    <Link2 className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    <span className="flex-1 text-zinc-300 text-xs truncate">{exampleLink}</span>
                    <button
                      onClick={() => handleCopy(exampleLink)}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition px-2 py-1 rounded-lg hover:bg-zinc-800"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-900">
                  {[
                    { label: "Indicações", value: "0" },
                    { label: "Confirmados", value: "0" },
                    { label: "Ganhos", value: "R$0" },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <div className="text-white font-black text-xl">{stat.value}</div>
                      <div className="text-zinc-600 text-[10px] font-semibold">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-zinc-600 text-center italic">
                  * Prévia do painel — disponível após criar sua conta
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefícios extras ── */}
      <section className="py-16 bg-[#060607] border-b border-zinc-900">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-white">
              Muito mais que indicações
            </h2>
            <p className="text-zinc-500 text-sm">
              Sua conta XamaJá abre portas para todo o ecossistema
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: <Heart className="w-5 h-5" />, label: "Favoritos", desc: "Salve seus negócios preferidos" },
              { icon: <Star className="w-5 h-5" />, label: "Avaliações", desc: "Avalie e ajude sua comunidade" },
              { icon: <Gift className="w-5 h-5" />, label: "Indique e ganhe", desc: "Seu código exclusivo" },
              { icon: <MapPin className="w-5 h-5" />, label: "Histórico", desc: "Tudo em um só lugar" },
              { icon: <Users className="w-5 h-5" />, label: "Anuncie", desc: "Se tiver um negócio, divulgue" },
              { icon: <ShieldCheck className="w-5 h-5" />, label: "Conta segura", desc: "Seus dados protegidos" },
            ].map(item => (
              <div
                key={item.label}
                className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-5 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center text-primary mb-3 group-hover:bg-primary/12 transition-colors">
                  {item.icon}
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{item.label}</h4>
                <p className="text-zinc-600 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 bg-black border-b border-zinc-900">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-14 space-y-3">
            <span className="text-primary text-xs font-bold uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Perguntas frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className={`bg-zinc-950 border rounded-2xl overflow-hidden transition-all duration-300 ${
                  openFaq === idx ? "border-primary/30" : "border-zinc-900 hover:border-zinc-800"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-white font-semibold text-sm leading-snug">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-500 flex-shrink-0 transition-transform duration-300 ${
                      openFaq === idx ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-zinc-400 text-sm leading-relaxed border-t border-zinc-900 pt-4">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20 md:py-32 bg-[#060607] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="text-primary text-xs font-bold uppercase tracking-wider">
              Comece agora — é grátis
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
            Pronto para ganhar
            <br />
            <span className="text-primary">indicando?</span>
          </h2>

          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Crie sua conta gratuita e receba imediatamente seu código exclusivo de indicação. Comece a indicar agora mesmo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => (window.location.href = "/parceiro")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-black px-10 py-4 h-14 rounded-xl text-base transition shadow-lg shadow-primary/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Criar Conta Grátis
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/parceiro")}
              className="border border-zinc-800 text-white hover:bg-zinc-900 px-10 h-14 rounded-xl text-base font-semibold"
            >
              Entrar na minha conta
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer simples ── */}
      <footer className="bg-background border-t border-zinc-900 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <img
            src="/assets/images/logo-xamaja.png"
            alt="XamaJá"
            className="h-7 w-auto object-contain opacity-60"
          />
          <p>© 2024 XamaJá. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="/termos-de-uso" className="hover:text-zinc-400 transition">Termos</a>
            <a href="/politica-de-privacidade" className="hover:text-zinc-400 transition">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
