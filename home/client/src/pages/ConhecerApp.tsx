import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  MapPin,
  Users,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function ConhecerApp() {
  const [activeStep, setActiveStep] = useState(1);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    // 1. Capture ref parameter from URL search params
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("ref_code", ref);
    }

    // 2. Scroll to #cadastro if URL path is /cadastro or has hash
    if (
      window.location.pathname === "/cadastro" ||
      window.location.hash === "#cadastro"
    ) {
      setTimeout(() => {
        const element = document.getElementById("cadastro");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormSuccess(false);
    setFormError("");

    if (
      !name ||
      !email ||
      !phone ||
      !categoryId ||
      !city ||
      !neighborhood ||
      !description
    ) {
      setFormError("Por favor, preencha todos os campos obrigatórios.");
      setIsSubmitting(false);
      return;
    }

    if (categoryId === "outro" && !otherCategory) {
      setFormError("Por favor, especifique a sua categoria.");
      setIsSubmitting(false);
      return;
    }

    try {
      const refCode = localStorage.getItem("ref_code") || undefined;
      const response = await fetch("/api/web-register-provider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          categoryId,
          otherCategory,
          city,
          neighborhood,
          description,
          refCode,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setFormSuccess(true);
        setName("");
        setEmail("");
        setPhone("");
        setCategoryId("");
        setOtherCategory("");
        setCity("");
        setNeighborhood("");
        setDescription("");
      } else {
        setFormError(
          result.error ||
            "Ocorreu um erro ao realizar o cadastro. Tente novamente."
        );
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setFormError(
        "Falha na conexão com o servidor. Verifique sua conexão e tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/assets/images/logo-xamaja.png"
              alt="XamaJá"
              className="h-10 w-auto object-contain"
            />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="/"
              className="text-muted-foreground hover:text-foreground transition"
            >
              Início
            </a>
            <a
              href="#como-funciona"
              className="text-muted-foreground hover:text-foreground transition"
            >
              Como funciona
            </a>
            <a
              href="#para-prestadores"
              className="text-muted-foreground hover:text-foreground transition"
            >
              Para prestadores
            </a>
            <a
              href="#para-comercios"
              className="text-muted-foreground hover:text-foreground transition"
            >
              Para comércios
            </a>
            <a
              href="/busca"
              className="text-primary font-semibold hover:text-primary/80 transition"
            >
              Buscar Serviços 🔍
            </a>
            <a
              href="/parceiros"
              className="text-zinc-400 hover:text-white transition font-semibold"
            >
              Seja um Parceiro ✦
            </a>
          </nav>

          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => (window.location.href = "/app")}
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
                <span className="text-primary text-sm font-semibold">
                  ✦ PLATAFORMA COMPLETA
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  A solução mais
                  <br />
                  rápida para conectar
                  <br />
                  <span className="text-primary">você ao que precisa.</span>
                </h1>

                <p className="text-lg text-muted-foreground max-w-md">
                  Encontre prestadores de serviços e comércios perto de você com
                  praticidade, segurança e confiança.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() =>
                    document
                      .getElementById("cadastro")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base"
                >
                  Cadastrar agora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = "/busca"}
                  className="border-border text-foreground hover:bg-card px-8 py-6 text-base font-bold flex items-center gap-2"
                >
                  Buscar Serviços 🔍
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-border">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">Mais clientes</span>
                  </div>
                  <p className="text-sm text-muted-foreground">da sua região</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">Serviços</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    diversificados
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">Pagamentos</span>
                  </div>
                  <p className="text-sm text-muted-foreground">seguros</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">Cresça seu</span>
                  </div>
                  <p className="text-sm text-muted-foreground">negócio</p>
                </div>
              </div>
            </div>

            {/* Right - Phone Mockup */}
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl filter opacity-40 pointer-events-none"></div>
              <img
                src="/assets/images/hero_mockup_right.png"
                alt="App XamaJá"
                className="max-w-[650px] w-full h-auto relative z-10 drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section
        id="como-funciona"
        className="py-20 md:py-32 bg-card/50"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Como <span className="text-primary">funciona</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              É simples, rápido e funcional
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Você busca",
                description:
                  "Encontre o serviço ou comércio que precisa perto de você.",
                image:
                  "https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-how-it-works-1-YELFGGwpwvDRAB5gWkGeRy.webp",
              },
              {
                step: 2,
                title: "Encontre e escolha",
                description:
                  "Veja avaliações, localização e escolha a melhor para você.",
                image:
                  "https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-how-it-works-2-gddMe4gnuUmsyxDMDXEV8Y.webp",
              },
              {
                step: 3,
                title: "Fale direto no WhatsApp",
                description:
                  "Chame no WhatsApp e resolva tudo de forma rápida.",
                image:
                  "https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-how-it-works-3-R4296w5gJuujeFURG4oyzj.webp",
              },
              {
                step: 4,
                title: "Problema resolvido!",
                description: "Tudo que você precisa, em um só lugar.",
                image:
                  "https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-how-it-works-4-9A3jbMW432PLGGSxpUuDVa.webp",
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-auto mb-6 rounded-lg"
                />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para Prestadores Section */}
      <section
        id="para-prestadores"
        className="py-20 md:py-32 bg-background"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Para prestadores
                <br />
                <span className="text-primary">de serviços</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Mais visibilidade. Mais clientes. Mais ganhos.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "Receba clientes perto de você",
                  "Gerencie seus serviços e horários",
                  "Veja avaliações de clientes",
                  "Autentique seus ganhos todos os dias",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() =>
                  document
                    .getElementById("cadastro")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Quero ser encontrado
              </Button>
            </div>

            <div className="flex justify-center">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-service-provider-Md5EygbsDPWs42ZSrzGGp6.webp"
                alt="Para Prestadores"
                className="max-w-sm w-full h-auto"
              />
            </div>
          </div>

          {/* Para Comércios Section */}
          <div
            id="para-comercios"
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div className="flex justify-center order-2 md:order-1">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-commerce-kCETcfMaD2NsM9wbVS6gvi.webp"
                alt="Para Comércios"
                className="max-w-sm w-full h-auto"
              />
            </div>

            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Para comércios
                <br />
                <span className="text-primary">locais</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Seu negócio em destaque na sua comunidade.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "Divulgue seu cardápio ou produtos",
                  "Receba pedidos direto no WhatsApp",
                  "Mais pedidos, mais vendas",
                  "Sem taxas por pedido",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() =>
                  document
                    .getElementById("cadastro")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Quero meu comércio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* O App na Prática Section */}
      <section
        className="py-20 md:py-32 bg-card/50"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              O app na <span className="text-primary">prática</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Tudo que você precisa, em um só lugar.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pb-4">
            {[
              {
                title: "Categorias",
                img: "/assets/images/xj/categorias_mockup.png",
              },
              {
                title: "Perfil",
                img: "/assets/images/xj/prestador_mockup.png",
              },
              {
                title: "App",
                img: "/assets/images/xj/app_mockup.png",
              },
            ].map(item => (
              <div
                key={item.title}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-[220px] h-[450px] md:w-[280px] md:h-[580px] rounded-2xl bg-[#09090b] border border-zinc-800/80 p-0 flex items-center justify-center shadow-2xl transition hover:border-primary/50 hover:scale-[1.02] duration-300 overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-zinc-400 text-lg font-medium tracking-wide">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section (Registration) */}
      <section
        id="cadastro"
        className="py-20 bg-card/10 border-b border-border"
      >
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Cadastre seu <span className="text-primary">Serviço</span> ou{" "}
              <span className="text-primary">Negócio</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Preencha o formulário abaixo com as informações do seu negócio ou
              serviço. Nossa equipe fará a verificação e entrará em contato para
              ativar seu perfil.
            </p>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-2xl relative">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-semibold text-white"
                  >
                    Nome do Profissional ou Negócio *
                  </label>
                  <Input
                    type="text"
                    id="name"
                    placeholder="Ex: João Silva ou Pinturas Silva"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-background border-border text-foreground rounded-xl px-4 py-3.5 focus-visible:ring-primary focus-visible:border-primary text-sm h-12"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-white"
                  >
                    E-mail *
                  </label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="Ex: joao@gmail.com"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-background border-border text-foreground rounded-xl px-4 py-3.5 focus-visible:ring-primary focus-visible:border-primary text-sm h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-semibold text-white"
                  >
                    Telefone / WhatsApp *
                  </label>
                  <Input
                    type="tel"
                    id="phone"
                    placeholder="Ex: (11) 99999-9999"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="bg-background border-border text-foreground rounded-xl px-4 py-3.5 focus-visible:ring-primary focus-visible:border-primary text-sm h-12"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="categoryId"
                    className="text-sm font-semibold text-white font-body"
                  >
                    Categoria Principal *
                  </label>
                  <select
                    id="categoryId"
                    required
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="bg-background border border-border text-foreground rounded-xl px-4 py-3 h-12 focus:border-primary focus:outline-none transition text-sm"
                  >
                    <option value="" className="bg-card">
                      Selecione uma categoria...
                    </option>
                    <option value="reformas-reparos" className="bg-card">
                      Reformas
                    </option>
                    <option value="comercios" className="bg-card">
                      Alimentação
                    </option>
                    <option value="beleza-estetica" className="bg-card">
                      Beleza
                    </option>
                    <option value="automotivo" className="bg-card">
                      Automotivo
                    </option>
                    <option value="servicos-domesticos" className="bg-card">
                      Casa
                    </option>
                    <option value="assistencia-tecnica" className="bg-card">
                      Tecnologia / Assistência Técnica
                    </option>
                    <option value="pets" className="bg-card">
                      Pets
                    </option>
                    <option value="saude" className="bg-card">
                      Saúde
                    </option>
                    <option value="academias" className="bg-card">
                      Academias / Fitness
                    </option>
                    <option value="outro" className="bg-card">
                      Outro (Especificar)...
                    </option>
                  </select>
                </div>
              </div>

              {categoryId === "outro" && (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="otherCategory"
                    className="text-sm font-semibold text-white"
                  >
                    Especifique a Categoria *
                  </label>
                  <Input
                    type="text"
                    id="otherCategory"
                    placeholder="Ex: Pet Shop, Consultoria, etc."
                    required
                    value={otherCategory}
                    onChange={e => setOtherCategory(e.target.value)}
                    className="bg-background border-border text-foreground rounded-xl px-4 py-3.5 focus-visible:ring-primary focus-visible:border-primary text-sm h-12"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="city"
                    className="text-sm font-semibold text-white"
                  >
                    Cidade *
                  </label>
                  <Input
                    type="text"
                    id="city"
                    placeholder="Ex: Bragança Paulista"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="bg-background border-border text-foreground rounded-xl px-4 py-3.5 focus-visible:ring-primary focus-visible:border-primary text-sm h-12"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="neighborhood"
                    className="text-sm font-semibold text-white"
                  >
                    Bairro *
                  </label>
                  <Input
                    type="text"
                    id="neighborhood"
                    placeholder="Ex: Centro"
                    required
                    value={neighborhood}
                    onChange={e => setNeighborhood(e.target.value)}
                    className="bg-background border-border text-foreground rounded-xl px-4 py-3.5 focus-visible:ring-primary focus-visible:border-primary text-sm h-12"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="description"
                  className="text-sm font-semibold text-white"
                >
                  Descrição do seu negócio, produtos ou serviços *
                </label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Descreva brevemente o seu comércio, loja, os produtos que vende ou serviços que oferece..."
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl px-4 py-3 focus-visible:ring-primary focus-visible:border-primary text-sm resize-none"
                />
              </div>

              {/* Status Messages */}
              {formSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-4 gap-3 text-sm flex items-start">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Cadastro enviado com sucesso!</strong> Recebemos
                    suas informações. Analisaremos os dados e entraremos em
                    contato para ativar o seu perfil no app XamaJá.
                  </div>
                </div>
              )}

              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 gap-3 text-sm flex items-start">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground font-black py-4 h-14 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span>Enviando...</span>
                    <span className="loader-btn w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                  </>
                ) : (
                  <span>Enviar Formulário</span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Partners Banner Section */}
      <section className="py-16 bg-card border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl filter opacity-30 pointer-events-none"></div>
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="bg-[#09090b]/80 border border-primary/20 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm">
            <div className="space-y-4 max-w-xl text-left">
              <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/30 rounded-full">
                <span className="text-primary text-xs font-semibold uppercase tracking-wider">
                  ✦ Indicações & Parceiros
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Ganhe Indicando Prestadores e Comércios!
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Indique profissionais e comércios locais para a nossa
                plataforma. Cadastre-se como parceiro, obtenha seu código de
                indicação exclusivo e acompanhe todos os seus leads pelo painel
                de controle.
              </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
              <Button
                onClick={() => (window.location.href = "/indique")}
                className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 py-6 rounded-xl flex items-center justify-center gap-2"
              >
                <span>Indicar Negócios</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-20 md:py-32 bg-gradient-to-r from-primary/10 to-primary/5 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/mascote-parrot-WdeTpQk76sVEPj2emyYAPr.webp"
                alt="Mascote XamaJá"
                className="max-w-sm w-full h-auto"
              />
            </div>

            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Pronto para crescer com o XamaJá?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Cadastre-se agora e comece a receber mais clientes ou encontre
                os melhores prestadores perto de você.
              </p>

              <Button
                onClick={() =>
                  document
                    .getElementById("cadastro")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base"
              >
                Cadastrar agora <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Navegação</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Início
                  </a>
                </li>
                <li>
                  <a
                    href="#como-funciona"
                    className="hover:text-foreground transition"
                  >
                    Como funciona
                  </a>
                </li>
                <li>
                  <a
                    href="#para-prestadores"
                    className="hover:text-foreground transition"
                  >
                    Para prestadores
                  </a>
                </li>
                <li>
                  <a
                    href="#para-comercios"
                    className="hover:text-foreground transition"
                  >
                    Para comércios
                  </a>
                </li>
                <li>
                  <a
                    href="/parceiros"
                    className="text-primary hover:text-primary/80 transition font-semibold"
                  >
                    Seja um Parceiro ✦
                  </a>
                </li>
                <li>
                  <a
                    href="/indique"
                    className="text-zinc-400 hover:text-foreground transition"
                  >
                    Indique e Ganhe ✦
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Central de ajuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Contato
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/termos-de-uso" className="hover:text-foreground transition">
                    Termos de uso
                  </a>
                </li>
                <li>
                  <a href="/politica-de-privacidade" className="hover:text-foreground transition">
                    Política de privacidade
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Siga-nos</h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-primary hover:text-primary/80 transition"
                >
                  Instagram
                </a>
                <a
                  href="#"
                  className="text-primary hover:text-primary/80 transition"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 XamaJá. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
