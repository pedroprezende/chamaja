import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Users, CheckCircle, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/xamaja-logo-ddr6eZAXiZa9HMSPrbCtrd.webp"
              alt="XamaJá"
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-foreground">XamaJá</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition">
              Início
            </a>
            <a href="#como-funciona" className="text-muted-foreground hover:text-foreground transition">
              Como funciona
            </a>
            <a href="#para-prestadores" className="text-muted-foreground hover:text-foreground transition">
              Para prestadores
            </a>
            <a href="#para-comercios" className="text-muted-foreground hover:text-foreground transition">
              Para comércios
            </a>
            <a href="#vantagens" className="text-muted-foreground hover:text-foreground transition">
              Vantagens
            </a>
          </nav>

          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                <span className="text-primary text-sm font-semibold">✦ PLATAFORMA COMPLETA</span>
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
                  Encontre prestadores de serviços e comércios perto de você com praticidade, segurança e confiança.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base">
                  Cadastrar agora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" className="border-border text-foreground hover:bg-card px-8 py-6 text-base">
                  Quero ver prestador
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
                  <p className="text-sm text-muted-foreground">diversificados</p>
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
            <div className="flex justify-center">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/hero-phone-main-kzBbzgV84kxiJCS96A5sDY.webp"
                alt="App XamaJá"
                className="max-w-sm w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="py-20 md:py-32 bg-card/50" style={{backgroundColor: '#000000'}}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Como <span className="text-primary">funciona</span>
            </h2>
            <p className="text-lg text-muted-foreground">É simples, rápido e funcional</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Você busca",
                description: "Encontre o serviço ou comércio que precisa perto de você.",
                image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-how-it-works-1-YELFGGwpwvDRAB5gWkGeRy.webp",
              },
              {
                step: 2,
                title: "Encontre e escolha",
                description: "Veja avaliações, localização e escolha a melhor para você.",
                image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-how-it-works-2-gddMe4gnuUmsyxDMDXEV8Y.webp",
              },
              {
                step: 3,
                title: "Fale direto no WhatsApp",
                description: "Chame no WhatsApp e resolva tudo de forma rápida.",
                image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-how-it-works-3-R4296w5gJuujeFURG4oyzj.webp",
              },
              {
                step: 4,
                title: "Problema resolvido!",
                description: "Tudo que você precisa, em um só lugar.",
                image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-how-it-works-4-9A3jbMW432PLGGSxpUuDVa.webp",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <img src={item.image} alt={item.title} className="w-full h-auto mb-6 rounded-lg" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para Prestadores Section */}
      <section id="para-prestadores" className="py-20 md:py-32 bg-background" style={{backgroundColor: '#000000'}}>
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
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
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
          <div id="para-comercios" className="grid md:grid-cols-2 gap-12 items-center">
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
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Quero meu comércio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* O App na Prática Section */}
      <section className="py-20 md:py-32 bg-card/50" style={{backgroundColor: '#000000'}}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              O app na <span className="text-primary">prática</span>
            </h2>
            <p className="text-lg text-muted-foreground">Tudo que você precisa, em um só lugar.</p>
          </div>

          <div className="flex justify-center gap-4 overflow-x-auto pb-4">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-categories-WnxaxSy5YcqR9GYKJM377w.webp"
              alt="Categorias"
              className="max-w-xs w-full h-auto rounded-lg"
            />
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-profile-service-i3qrkeuJk74osjF9EguFjJ.webp"
              alt="Perfil"
              className="max-w-xs w-full h-auto rounded-lg"
            />
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/phone-app-showcase-WdeTpQk76sVEPj2emyYAPr.webp"
              alt="App"
              className="max-w-xs w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Confiança Section */}
      <section id="vantagens" className="py-20 md:py-32 bg-background" style={{backgroundColor: '#000000'}}>
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Confiança que gera <span className="text-primary">resultados</span>
          </h2>

          <div className="grid md:grid-cols-5 gap-8">
            {[
              { icon: "👥", number: "+1.200", label: "Prestadores ativos" },
              { icon: "🏢", number: "+500", label: "Comércios parceiros" },
              { icon: "🔍", number: "+15.000", label: "Buscas realizadas" },
              { icon: "⭐", number: "4.9", label: "Avaliação média" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
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
                Cadastre-se agora e comece a receber mais clientes ou encontre os melhores prestadores perto de você.
              </p>

              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base">
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
                <li><a href="#" className="hover:text-foreground transition">Início</a></li>
                <li><a href="#como-funciona" className="hover:text-foreground transition">Como funciona</a></li>
                <li><a href="#para-prestadores" className="hover:text-foreground transition">Para prestadores</a></li>
                <li><a href="#para-comercios" className="hover:text-foreground transition">Para comércios</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Central de ajuda</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contato</a></li>
                <li><a href="#" className="hover:text-foreground transition">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Termos de uso</a></li>
                <li><a href="#" className="hover:text-foreground transition">Política de privacidade</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Siga-nos</h3>
              <div className="flex gap-4">
                <a href="#" className="text-primary hover:text-primary/80 transition">Instagram</a>
                <a href="#" className="text-primary hover:text-primary/80 transition">WhatsApp</a>
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
