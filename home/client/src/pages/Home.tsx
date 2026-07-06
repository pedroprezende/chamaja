import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Utensils,
  Scissors,
  Car,
  Home as HomeIcon,
  HeartPulse,
  Grid,
  ChevronLeft,
  ChevronRight,
  Star,
  Search,
  ChevronDown,
  Heart,
  ShieldCheck,
  Gift,
  Hammer,
  GraduationCap,
  MoreHorizontal,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("Bragança Paulista - SP");

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

  // Dynamic featured providers from DB
  const [featuredProviders, setFeaturedProviders] = useState<any[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

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

    // 3. Fetch actual providers from the database
    async function loadFeatured() {
      try {
        const input = {
          sortBy: "relevance",
          profileType: "all",
        };
        const url = `/api/trpc/providers.searchFiltered?input=${encodeURIComponent(JSON.stringify(input))}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.result && json.result.data) {
            setFeaturedProviders(json.result.data.slice(0, 8));
          }
        }
      } catch (e) {
        console.error("Failed to load featured providers:", e);
      } finally {
        setIsLoadingFeatured(false);
      }
    }
    loadFeatured();
  }, []);

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name || !email || !phone) {
      setFormError("Por favor, preencha todos os campos obrigatórios da identificação.");
      return;
    }
    setActiveStep(2);
  };

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
        setActiveStep(1);
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

  const handleSearchSubmit = () => {
    window.location.href = `/busca?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(searchLocation)}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img
              src="/assets/images/logo-xamaja.png"
              alt="XamaJá"
              className="h-9 w-auto object-contain"
            />
            
            {/* Navegar Dropdown */}
            <div className="hidden lg:flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-white cursor-pointer transition select-none">
              <span>Navegar</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a
              href="/parceiros"
              className="text-muted-foreground hover:text-white transition"
            >
              Seja um parceiro
            </a>
            <a
              href="/parceiros#indicacao"
              className="text-muted-foreground hover:text-white transition"
            >
              Indique e ganhe
            </a>
            <a
              href="/busca?filter=favorites"
              className="text-muted-foreground hover:text-white transition flex items-center gap-1.5"
            >
              <Heart className="h-4 w-4" />
              <span>Favoritos</span>
            </a>
            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/app")}
              className="text-white hover:text-white hover:bg-zinc-900 border border-zinc-800 rounded-xl px-5 h-10 text-xs"
            >
              Entrar
            </Button>
            <Button
              onClick={() => {
                document
                  .getElementById("cadastro")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl px-5 h-10 text-xs transition"
            >
              Cadastre-se
            </Button>
          </nav>

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-background/95 backdrop-blur-sm py-4 px-6 space-y-4 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col gap-3">
              <a 
                href="/parceiros" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-white py-2 text-base font-semibold border-b border-zinc-900"
              >
                Seja um parceiro
              </a>
              <a 
                href="/parceiros#indicacao" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-white py-2 text-base font-semibold border-b border-zinc-900"
              >
                Indique e ganhe
              </a>
              <a 
                href="/busca?filter=favorites" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-primary py-2 text-base font-semibold flex items-center gap-2"
              >
                <Heart className="h-4.5 w-4.5 fill-current" />
                <span>Favoritos</span>
              </a>
            </nav>
            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.href = "/app";
                }}
                className="w-full text-center text-white hover:bg-zinc-900 border border-zinc-800 rounded-xl py-3 text-sm font-semibold"
              >
                Entrar
              </Button>
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  document
                    .getElementById("cadastro")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="w-full text-center bg-primary text-primary-foreground hover:bg-primary/95 font-bold rounded-xl py-3 text-sm transition"
              >
                Cadastre-se
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-36 overflow-hidden border-b border-zinc-900 bg-[#070708]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Location Pin */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Sua localização:</span>
                <span className="text-primary font-bold underline cursor-pointer hover:text-primary/80 transition">
                  {searchLocation} ▾
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-white font-sans">
                  Encontre tudo
                  <br />
                  <span className="text-primary">perto de você.</span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground max-w-lg font-medium">
                  Busque comércios e prestadores de serviço na sua região.
                </p>
              </div>

              {/* Integrated Search Bar */}
              <div className="bg-zinc-950/80 border border-zinc-800 p-2 rounded-2xl flex flex-col md:flex-row items-center gap-2 shadow-2xl w-full max-w-2xl backdrop-blur-md">
                {/* Input 1: O que você procura */}
                <div className="flex-1 flex items-center px-3 gap-2.5 w-full">
                  <Search className="text-muted-foreground h-4.5 w-4.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        handleSearchSubmit();
                      }
                    }}
                    className="bg-transparent border-none focus:outline-none focus:ring-0 text-foreground w-full text-sm py-2"
                    placeholder="O que você procura? Ex: pizzaria, eletricista, salão..."
                  />
                </div>
                
                {/* Divider */}
                <div className="hidden md:block h-6 w-px bg-zinc-850"></div>

                {/* Input 2: Cidade, bairro ou CEP */}
                <div className="flex-1 flex items-center px-3 gap-2.5 w-full">
                  <MapPin className="text-muted-foreground h-4.5 w-4.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={e => setSearchLocation(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        handleSearchSubmit();
                      }
                    }}
                    className="bg-transparent border-none focus:outline-none focus:ring-0 text-foreground w-full text-sm py-2"
                    placeholder="Cidade, bairro ou CEP"
                  />
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearchSubmit}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 px-6 py-3.5 h-11 rounded-xl font-bold transition-all w-full md:w-auto text-xs"
                >
                  Buscar
                </Button>
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-2 text-xs items-center pt-2">
                <span className="text-muted-foreground">Mais buscados:</span>
                {["Restaurante", "Eletricista", "Salão de Beleza", "Mecânico", "Marceneiro", "Academia"].map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      window.location.href = `/busca?q=${encodeURIComponent(tag)}`;
                    }}
                    className="px-3.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-primary/50 text-muted-foreground hover:text-white rounded-full transition duration-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content */}
            <div className="flex justify-center relative w-full h-[400px] md:h-[550px] lg:h-[650px]">
              {/* Radial green glow backdrop */}
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl filter opacity-40 pointer-events-none z-0"></div>
              {/* Big 3D Glowing Green X */}
              <img
                src="https://lh3.googleusercontent.com/aida/AP1WRLth_3_Siyte1uWF2CyBkUYA0Dm7FZfbiCFNSxxA9So6JXyAolQgjg-PQHH8hcj7UNGt4NPg0saT9grrHp-9i3IeL19EGI6XlO0w4hQcGkwn-zcTKjTNyCtk_U2OTn54GwWwg2C-q6CpwVHWquIz1qlAeLGw03XFcaG9wFSLVk8iwqdXb1RJcnEjbtE7oYerPcmapAnubctAzeiny-SYPk3Z1_5qFZ8KnPNl_76sy-6EHndkLf5BYKI2CvXD"
                alt="XamaJá App Ecosystem"
                className="max-w-[480px] md:max-w-[540px] lg:max-w-[580px] w-full h-full relative z-10 object-contain drop-shadow-[0_0_50px_rgba(132,204,22,0.25)] animate-pulse"
                style={{ animationDuration: "4s" }}
              />
              {/* Floating widget card */}
              <div className="absolute top-10 right-0 md:right-4 z-20 bg-zinc-950/85 border border-zinc-800 p-5 rounded-2xl max-w-[200px] shadow-2xl backdrop-blur-md select-none">
                <span className="text-primary font-bold text-sm block mb-1">X marca o local</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Conectando você aos melhores negócios da sua região.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Horizontal bar (from user screenshot) */}
      <section className="bg-black py-6 border-b border-zinc-900 select-none">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none no-scrollbar justify-between items-center">
            {[
              { id: "all", name: "Todas", icon: Grid },
              { id: "comercios", name: "Alimentação", icon: Utensils },
              { id: "beleza-estetica", name: "Beleza", icon: Scissors },
              { id: "saude", name: "Saúde", icon: HeartPulse },
              { id: "reformas-reparos", name: "Serviços", icon: Wrench },
              { id: "servicos-domesticos", name: "Casa", icon: HomeIcon },
              { id: "construcao", name: "Construção", icon: Hammer },
              { id: "automotivo", name: "Automotivo", icon: Car },
              { id: "educacao", name: "Educação", icon: GraduationCap },
              { id: "mais", name: "Mais", icon: MoreHorizontal },
            ].map(cat => {
              const Icon = cat.icon;
              const isActive = cat.id === "all"; // Make "Todas" active by default
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === "all" || cat.id === "mais") {
                      window.location.href = "/busca";
                    } else {
                      window.location.href = `/busca?category=${cat.id}`;
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-2 w-[115px] h-[100px] shrink-0 rounded-2xl cursor-pointer transition duration-300 ${
                    isActive 
                      ? "bg-zinc-950 border border-primary/50 text-primary shadow-[0_0_15px_rgba(132,204,22,0.1)]" 
                      : "bg-zinc-950/40 border border-zinc-900 text-muted-foreground hover:text-white hover:border-zinc-800"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-zinc-400 group-hover:text-white"}`} />
                  <span className="text-xs font-semibold tracking-wide">{cat.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Destaques para você (from user screenshot) */}
      <section className="py-16 bg-black border-b border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-2">
              <Star className="text-primary h-6 w-6 fill-primary" />
              <h2 className="text-2xl md:text-3xl font-extrabold text-white font-sans">
                Destaques para você
              </h2>
            </div>
            <a 
              href="/busca" 
              className="text-primary font-bold text-sm flex items-center gap-1 hover:underline transition"
            >
              <span>Ver todos</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div 
            className="flex gap-6 overflow-x-auto pb-6 scrollbar-none no-scrollbar snap-x snap-mandatory"
            id="featured-partners-row"
          >
            {isLoadingFeatured ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, idx) => (
                <div 
                  key={idx}
                  className="min-w-[280px] md:min-w-[320px] h-[340px] bg-zinc-950 border border-zinc-900 rounded-[2rem] animate-pulse"
                />
              ))
            ) : featuredProviders.length === 0 ? (
              <div className="w-full text-center py-12 text-muted-foreground text-sm">
                Nenhum prestador encontrado no momento.
              </div>
            ) : (
              featuredProviders.map((p, idx) => {
                const categoryImages: Record<string, string> = {
                  "comercios": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
                  "beleza-estetica": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80",
                  "saude": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80",
                  "reformas-reparos": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80",
                  "servicos-domesticos": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80",
                  "construcao": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
                  "automotivo": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80",
                  "educacao": "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&q=80"
                };

                const categoryLogos: Record<string, string> = {
                  "comercios": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=100&q=80",
                  "beleza-estetica": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&q=80",
                  "saude": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80",
                  "reformas-reparos": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&q=80",
                  "servicos-domesticos": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=100&q=80",
                  "construcao": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=100&q=80",
                  "automotivo": "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=100&q=80",
                  "educacao": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100&q=80"
                };

                const coverImage = p.coverUri || categoryImages[p.categoryId || ""] || "https://images.unsplash.com/photo-1521791136368-1a868270f63b?w=600&q=80";
                const logoImage = p.avatarUri || categoryLogos[p.categoryId || ""] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80";
                const isVerified = p.isVerified === true;
                const tagLabel = isVerified ? "Verificado" : "Parceiro";
                const statusLabel = p.onlineStatus === true ? "Aberto agora" : "Fechado";

                return (
                  <div 
                    key={p.id}
                    className="min-w-[280px] md:min-w-[320px] bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden hover:border-zinc-800 transition duration-300 snap-start shadow-xl relative group"
                  >
                    {/* Image & Badge overlay */}
                    <div className="relative h-40 w-full overflow-hidden">
                      <img 
                        src={coverImage} 
                        alt={p.name} 
                        onClick={() => window.location.href = `/perfil/${p.id}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      />
                      {/* Overlay Tag */}
                      <span className={`absolute top-4 left-4 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md ${
                        isVerified 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-black/60 border border-zinc-800 text-primary"
                      }`}>
                        {tagLabel}
                      </span>
                      {/* Favorite toggle */}
                      <button className="absolute top-4 right-4 p-2 bg-black/60 border border-zinc-800/80 rounded-full hover:bg-zinc-900 transition shadow-md">
                        <Heart className="h-4 w-4 text-white hover:text-red-500 transition-colors" />
                      </button>
                    </div>

                    {/* Avatar Badge overlapping */}
                    <div 
                      onClick={() => window.location.href = `/perfil/${p.id}`}
                      className="w-14 h-14 rounded-full border-4 border-zinc-950 bg-black -mt-7 ml-6 relative z-10 flex items-center justify-center overflow-hidden shadow-lg cursor-pointer"
                    >
                      <img src={logoImage} alt={p.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Content details */}
                    <div className="p-6 pt-4 space-y-4">
                      <div>
                        <div className="flex justify-between items-center">
                          <h3 
                            onClick={() => window.location.href = `/perfil/${p.id}`}
                            className="font-bold text-lg text-white group-hover:text-primary transition-colors truncate max-w-[180px] cursor-pointer"
                          >
                            {p.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                            <span>★</span>
                            <span>{p.rating || "5.0"}</span>
                            <span className="text-muted-foreground text-[10px]">({p.ratingCount || "0"})</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-xs font-semibold mt-1">
                          {p.category}
                        </p>
                        <p className="text-muted-foreground text-[11px] font-medium mt-0.5">
                          {p.neighborhood && p.city ? `${p.neighborhood} - ${p.city}` : p.city || "Região"}
                        </p>
                      </div>

                      {/* Footer status line */}
                      <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${p.onlineStatus === true ? "text-emerald-500" : "text-zinc-500"}`}>
                          <span className={`w-2 h-2 rounded-full ${p.onlineStatus === true ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`}></span>
                          <span>{statusLabel}</span>
                        </div>
                        <Button 
                          onClick={() => window.location.href = `/perfil/${p.id}`}
                          className="bg-transparent hover:bg-zinc-900 border border-zinc-800 text-white font-bold text-[11px] rounded-xl px-4 py-2 h-8"
                        >
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Features Footer row (from user screenshot) */}
      <section className="py-12 bg-black border-b border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-[2rem] p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Tudo perto de você</h4>
                <p className="text-xs text-muted-foreground mt-1">Encontre o que precisa na sua região</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Parceiros verificados</h4>
                <p className="text-xs text-muted-foreground mt-1">Mais segurança para você e sua família</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Contato rápido</h4>
                <p className="text-xs text-muted-foreground mt-1">Fale direto pelo WhatsApp com o parceiro</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-primary">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Indique e ganhe</h4>
                <p className="text-xs text-muted-foreground mt-1">Indique parceiros e ganhe benefícios exclusivos</p>
              </div>
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
            {/* Step Progress Bar */}
            <div className="flex items-center justify-center gap-4 mb-8 border-b border-border/40 pb-6">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${activeStep === 1 ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(37,211,102,0.2)]' : 'bg-primary/20 text-primary border-primary'}`}>
                  {activeStep > 1 ? "✓" : "1"}
                </div>
                <span className={`text-xs font-semibold ${activeStep === 1 ? 'text-white' : 'text-zinc-500'}`}>Identificação</span>
              </div>
              <div className="w-8 h-px bg-zinc-800"></div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${activeStep === 2 ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(37,211,102,0.2)]' : 'bg-background border-zinc-800 text-zinc-500'}`}>2</div>
                <span className={`text-xs font-semibold ${activeStep === 2 ? 'text-white' : 'text-zinc-500'}`}>Profissional</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {activeStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
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

                  <div className="pt-4">
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground font-black py-4 h-14 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                    >
                      <span>Avançar</span>
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
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

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      variant="outline"
                      className="flex-[0.4] border-border text-foreground hover:bg-card h-14 rounded-xl font-bold"
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-3 bg-primary text-primary-foreground font-black py-4 h-14 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed"
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
                  </div>
                </div>
              )}
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
