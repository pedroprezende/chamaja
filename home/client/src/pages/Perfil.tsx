import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MapPin,
  Heart,
  Phone,
  Star,
  CheckCircle2,
  Clock,
  Menu,
  X,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Briefcase,
  UtensilsCrossed,
  Share2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Perfil({ params }: { params: { id: string } }) {
  const providerId = params.id;

  // Data States
  const [provider, setProvider] = useState<any | null>(null);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "catalog" | "reviews">("about");

  // Auth States
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // New Review Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Favorites state
  const [isFavorite, setIsFavorite] = useState(false);

  // Selected items/services for order/quote
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProviderDetails();
    fetchReviews();

    // Check session
    const token = localStorage.getItem("bp_session_token");
    const savedUser = localStorage.getItem("bp_user_profile");
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setSessionToken(token);
        setUserProfile(parsedUser);
        setReviewerName(parsedUser.name || "");
      } catch (e) {
        console.error(e);
      }
    }

    // Check initial tab
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get("tab");
    if (initialTab === "reviews") {
      setActiveTab("reviews");
    }

    // Check favorite status
    const favs = localStorage.getItem("xamaja_favs");
    if (favs) {
      try {
        const parsed = JSON.parse(favs);
        setIsFavorite(parsed.includes(providerId));
      } catch (e) {
        console.error(e);
      }
    }
  }, [providerId]);

  // Load single provider by ID
  const fetchProviderDetails = async () => {
    setIsLoading(true);
    try {
      const url = `/api/trpc/providers.getById?input=${encodeURIComponent(JSON.stringify(providerId))}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.result && json.result.data) {
          setProvider(json.result.data);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error("Failed fetching provider by ID:", e);
    }

    // High quality mock data fallback if ID not found in database (e.g. mock items)
    const mockProviders: Record<string, any> = {
      "mock-1": {
        id: "mock-1",
        name: "X Burger",
        category: "Hamburgeria",
        categoryId: "comercios",
        city: "Bragança Paulista",
        state: "SP",
        neighborhood: "Centro",
        rating: 4.8,
        ratingCount: 124,
        coverUri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
        avatarUri: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=120&q=80",
        isVerified: true,
        onlineStatus: true,
        phone: "(11) 97120-1234",
        whatsapp: "(11) 97120-1234",
        plan: "premium",
        businessType: "comercio",
        deliveryTime: "30-45 min",
        workingHours: JSON.stringify({ weekdays: "18:00 - 23:30", weekends: "18:00 - 00:30" }),
        description: "Os melhores hambúrgueres artesanais de Bragança Paulista. Carnes grelhadas no fogo como churrasco, pão brioche sempre fresco e ingredientes selecionados de produtores locais. Experimente nosso famoso X-Churrasco com queijo cheddar derretido e maionese defumada da casa.",
        gallery: [
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
          "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&q=80",
          "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500&q=80"
        ]
      },
      "mock-2": {
        id: "mock-2",
        name: "Auto Prime",
        category: "Oficina Mecânica",
        categoryId: "automotivo",
        city: "Bragança Paulista",
        state: "SP",
        neighborhood: "Jardim das Pedras",
        rating: 4.9,
        ratingCount: 98,
        coverUri: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&q=80",
        avatarUri: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=120&q=80",
        isVerified: false,
        onlineStatus: true,
        phone: "(11) 97120-5678",
        whatsapp: "(11) 97120-5678",
        plan: "premium",
        businessType: "servicos",
        workingHours: JSON.stringify({ weekdays: "08:00 - 18:00", weekends: "08:00 - 12:00" }),
        description: "Manutenção automotiva preventiva e corretiva especializada. Diagnóstico eletrônico via scanner, freios, suspensão, injeção eletrônica e mecânica em geral para nacionais e importados. Qualidade técnica certificada e garantia em todas as peças utilizadas.",
        gallery: [
          "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&q=80",
          "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=500&q=80",
          "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=500&q=80"
        ]
      },
      "mock-3": {
        id: "mock-3",
        name: "Linda's Beauty",
        category: "Salão de Beleza",
        categoryId: "beleza-estetica",
        city: "Bragança Paulista",
        state: "SP",
        neighborhood: "Taboão",
        rating: 4.7,
        ratingCount: 156,
        coverUri: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
        avatarUri: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=120&q=80",
        isVerified: false,
        onlineStatus: true,
        phone: "(11) 97120-9999",
        whatsapp: "(11) 97120-9999",
        plan: "premium",
        businessType: "servicos",
        workingHours: JSON.stringify({ weekdays: "09:00 - 19:00", weekends: "09:00 - 18:00" }),
        description: "Especialistas em cortes, colorimetria, mechas e tratamentos de alta performance. Ambiente moderno e aconchegante para cuidar de você e da saúde dos seus cabelos com os melhores produtos do mercado.",
        gallery: [
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80",
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80",
          "https://images.unsplash.com/photo-1605497746444-ac9dbd324ce8?w=500&q=80"
        ]
      },
      "mock-4": {
        id: "mock-4",
        name: "Pizzaria do X",
        category: "Pizzaria",
        categoryId: "comercios",
        city: "Bragança Paulista",
        state: "SP",
        neighborhood: "Jardim América",
        rating: 4.6,
        ratingCount: 87,
        coverUri: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
        avatarUri: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?w=120&q=80",
        isVerified: true,
        onlineStatus: true,
        phone: "(11) 97120-1111",
        whatsapp: "(11) 97120-1111",
        plan: "standard",
        businessType: "comercio",
        deliveryTime: "40-55 min",
        workingHours: JSON.stringify({ weekdays: "18:00 - 23:30", weekends: "18:00 - 00:00" }),
        description: "Pizzas assadas em forno de pedra tradicional com bordas recheadas e molho de tomate fresco artesanal. Ingredientes premium e massa com fermentação lenta de 24 horas para dar leveza única.",
        gallery: [
          "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80",
          "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&q=80",
          "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80"
        ]
      },
      "mock-5": {
        id: "mock-5",
        name: "Hidro X",
        category: "Encanador",
        categoryId: "reformas-reparos",
        city: "Bragança Paulista",
        state: "SP",
        neighborhood: "Centro",
        rating: 5.0,
        ratingCount: 63,
        coverUri: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
        avatarUri: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&q=80",
        isVerified: false,
        onlineStatus: true,
        phone: "(11) 97120-2222",
        whatsapp: "(11) 97120-2222",
        plan: "premium",
        businessType: "servicos",
        workingHours: JSON.stringify({ weekdays: "08:00 - 19:00", weekends: "08:00 - 15:00" }),
        description: "Resolução rápida e com garantia de vazamentos, encanamento quebrado, entupimentos de esgotos, pias e ralos. Instalação e manutenção de aquecedores, caixas d'água e bombas hidráulicas.",
        gallery: [
          "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&q=80",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80"
        ]
      }
    };

    if (mockProviders[providerId]) {
      setProvider(mockProviders[providerId]);
      setIsLoading(false);
    } else {
      // General mock in case of dynamic ID routing
      setProvider({
        id: providerId,
        name: "Prestador Local",
        category: "Serviços Gerais",
        categoryId: "reformas-reparos",
        city: "Bragança Paulista",
        state: "SP",
        neighborhood: "Bairro Local",
        rating: 5.0,
        ratingCount: 5,
        coverUri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
        avatarUri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80",
        isVerified: true,
        onlineStatus: true,
        phone: "(11) 97120-1234",
        whatsapp: "(11) 97120-1234",
        plan: "free",
        businessType: "servicos",
        description: "Prestador qualificado cadastrado na plataforma ChamaJá pronto para atendê-lo na sua região.",
        gallery: []
      });
      setIsLoading(false);
    }
  };

  // Load reviews by provider ID
  const fetchReviews = async () => {
    try {
      const url = `/api/trpc/providers.getReviews?input=${encodeURIComponent(JSON.stringify(providerId))}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.result && json.result.data) {
          setReviewsList(json.result.data);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed loading database reviews, using fallbacks:", e);
    }

    // fallback mock reviews
    setReviewsList([
      {
        id: "rev-1",
        userName: "Mariana Souza",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&q=80",
        rating: 5,
        comment: "Excelente atendimento! Muito pontual, educado e fez o serviço com extrema qualidade. Recomendo fortemente a todos da região.",
        createdAt: "2026-06-25",
      },
      {
        id: "rev-2",
        userName: "Thiago Oliveira",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&q=80",
        rating: 4,
        comment: "Trabalho muito bom e rápido. O preço foi justo. Com certeza chamarei novamente quando precisar.",
        createdAt: "2026-06-20",
      }
    ]);
  };

  // Toggle favorite
  const toggleFavorite = () => {
    const favs = localStorage.getItem("xamaja_favs");
    let parsed: string[] = [];
    if (favs) {
      try {
        parsed = JSON.parse(favs);
      } catch (e) {
        console.error(e);
      }
    }

    if (isFavorite) {
      parsed = parsed.filter(id => id !== providerId);
      setIsFavorite(false);
      toast.success("Removido dos favoritos.");
    } else {
      parsed.push(providerId);
      setIsFavorite(true);
      toast.success("Adicionado aos favoritos!");
    }
    localStorage.setItem("xamaja_favs", JSON.stringify(parsed));
  };

  // Submit Review Form
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) {
      toast.error("Você precisa estar logado para avaliar.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const url = "/api/trpc/providers.submitReview";
      const res = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          providerId,
          rating,
          comment: comment.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.result && json.result.data) {
        toast.success("Avaliação enviada com sucesso!");
        setComment("");
        // Reload reviews & updates provider rating
        fetchReviews();
        fetchProviderDetails();
      } else {
        toast.error("Ocorreu um erro ao enviar sua avaliação.");
      }
    } catch (err) {
      console.error(err);
      // Fallback local append for visual feedback
      const newLocalReview = {
        id: `local-rev-${Date.now()}`,
        userName: reviewerName.trim(),
        userAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName.trim())}&background=25D366&color=000`,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString().split("T")[0],
      };
      setReviewsList(prev => [newLocalReview, ...prev]);
      toast.success("Avaliação enviada (Local)!");
      setComment("");
      setReviewerName("");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleContactWhatsApp = () => {
    if (!provider) return;
    const cleanPhone = (provider.whatsapp || provider.phone || "").replace(/\D/g, "");
    if (!cleanPhone) {
      toast.error("WhatsApp não configurado.");
      return;
    }

    const selectedList = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const item = catalogItems.find(i => i.id === itemId);
        if (!item) return "";
        return `- ${qty}x ${item.name} (R$ ${Number(item.price).toFixed(2)})`;
      })
      .filter(Boolean);

    let itemsText = "";
    if (selectedList.length > 0) {
      const label = isComercio ? "itens do cardápio" : "serviços";
      itemsText = `\n\n*Gostaria de solicitar os seguintes ${label}:*\n${selectedList.join("\n")}`;
    }

    const message = encodeURIComponent(`Olá ${provider.name}, vi seu perfil no XamaJá e gostaria de combinar um serviço.${itemsText}`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
  };

  // Copy Profile URL to share
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link do perfil copiado!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
        <span className="text-zinc-500 font-semibold text-sm">Carregando perfil do parceiro...</span>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="text-2xl font-bold">Parceiro não encontrado</h2>
        <Button onClick={() => window.location.href = "/busca"} className="bg-primary text-primary-foreground">
          Voltar para a Busca
        </Button>
      </div>
    );
  }

  const isComercio = provider.businessType === "comercio" || provider.categoryId === "comercios";

  // Parse services or catalog items
  const catalogItems = (() => {
    if (!provider) return [];
    try {
      const parsed = typeof provider.services === "string" ? JSON.parse(provider.services) : provider.services;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => ({
          id: item.id || `item-${idx}`,
          name: item.name || item.title || "Serviço",
          price: Number(item.price || item.valor || item.value || 0),
          description: item.description || item.desc || "Serviço oferecido pelo parceiro.",
        }));
      }
    } catch (e) {
      console.warn("Failed to parse provider services:", e);
    }

    // Fallbacks if no services are parsed or array is empty
    if (isComercio) {
      return [
        { id: "fallback-c1", name: "Super Combo Xama", price: 42.90, description: "Hambúrguer com queijo duplo, fritas e refrigerante 350ml." },
        { id: "fallback-c2", name: "Batata Frita Especial", price: 24.90, description: "Porção de fritas sequinhas com cheddar cremoso e bacon crocante." },
        { id: "fallback-c3", name: "Hambúrguer Gourmet", price: 29.95, description: "Carne grelhada de 180g, queijo cheddar, alface, tomate e molho especial." },
        { id: "fallback-c4", name: "Milkshake Crocante", price: 16.00, description: "Milkshake artesanal de creme batido com pedaços de biscoito." },
      ];
    } else {
      // Return a set of default service prices based on category
      const cat = String(provider.category || "").toLowerCase();
      if (cat.includes("saúde") || cat.includes("saude") || cat.includes("beleza") || cat.includes("estética")) {
        return [
          { id: "fallback-s1", name: "Massagem Terapêutica Completa", price: 120.00, description: "Atendimento de 1 hora focado no alívio de tensões musculares." },
          { id: "fallback-s2", name: "Drenagem Linfática", price: 130.00, description: "Sessão de drenagem corporal completa com foco em bem-estar." },
          { id: "fallback-s3", name: "Ventosaterapia + Liberação", price: 150.00, description: "Tratamento completo para recuperação muscular de atletas e dores." },
        ];
      }
      return [
        { id: "fallback-g1", name: "Visita Técnica e Orçamento", price: 50.00, description: "Avaliação do local para diagnóstico e orçamento detalhado." },
        { id: "fallback-g2", name: "Serviço Geral (Hora)", price: 80.00, description: "Mão de obra por hora de serviço executado." },
      ];
    }
  })();

  // Parse working hours json
  let hours: any = { weekdays: "08:00 - 18:00", weekends: "08:00 - 12:00" };
  if (provider.workingHours) {
    try {
      hours = typeof provider.workingHours === "string" ? JSON.parse(provider.workingHours) : provider.workingHours;
    } catch (e) {
      console.warn("Error parsing hours:", e);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 selection:text-white font-sans flex flex-col">
      {/* ── HEADER ── */}
      <header className="z-50 bg-[#050505]/75 backdrop-blur-xl border-b border-zinc-900/60 sticky top-0">
        <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          <button
            onClick={() => window.location.href = "/busca"}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para Busca</span>
          </button>

          <img
            src="/assets/images/logo-xamaja.png"
            alt="XamaJá"
            className="h-8 w-auto object-contain cursor-pointer"
            onClick={() => window.location.href = "/"}
          />

          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-xl border ${
              isFavorite
                ? "bg-primary/5 border-primary text-primary"
                : "border-zinc-800 text-zinc-400 hover:text-white"
            } transition`}
          >
            <Heart className={`h-4.5 w-4.5 ${isFavorite ? "fill-current" : ""}`} />
          </button>
        </div>
      </header>

      {/* ── PROFILE COVER PHOTO ── */}
      <section className="relative h-64 md:h-80 w-full overflow-hidden bg-zinc-900 flex-shrink-0">
        <img
          src={provider.coverUri || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80"}
          alt={provider.name}
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/45"></div>

        {/* Floating actions */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={handleShare}
            className="p-3 bg-black/60 backdrop-blur-md border border-white/10 hover:bg-zinc-900 text-white rounded-full transition"
            title="Compartilhar Perfil"
          >
            <Share2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </section>

      {/* ── PROFILE INFO CARD (Overlapping) ── */}
      <section className="container mx-auto px-4 lg:px-8 relative -mt-20 z-10 flex-shrink-0">
        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          {/* Circular Avatar */}
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-zinc-950 overflow-hidden shadow-xl bg-zinc-950 -mt-14 md:-mt-20 flex-shrink-0">
            <img
              src={provider.avatarUri || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80"}
              alt={provider.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info Details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1.5">
              <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
                <h1 className="text-3xl font-black text-white leading-tight">{provider.name}</h1>
                <div className="flex items-center gap-2 justify-center">
                  {provider.plan === "premium" && (
                    <span className="px-2.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider rounded">
                      Parceiro
                    </span>
                  )}
                  {provider.isVerified && (
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded">
                      ✓ Verificado
                    </span>
                  )}
                </div>
              </div>
              <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">
                {provider.category || "Profissional Local"}
              </p>
            </div>

            {/* Ratings & Location Grid */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-zinc-400">
              <div className="flex items-center gap-1">
                <Star className="h-4.5 w-4.5 text-primary fill-current" />
                <span className="text-white font-extrabold">{Number(provider.rating || 5.0).toFixed(1)}</span>
                <span className="text-zinc-650">({provider.ratingCount || 10} avaliações)</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{provider.neighborhood ? `${provider.neighborhood}, ` : ""}{provider.city || "Região local"}</span>
              </div>
              {provider.onlineStatus && (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span>Aberto agora</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROFILE TABS SELECTOR ── */}
      <section className="container mx-auto px-4 lg:px-8 mt-8 flex-shrink-0">
        <div className="flex bg-zinc-950 border border-zinc-900 rounded-2xl p-1 max-w-md">
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${
              activeTab === "about" ? "bg-primary text-primary-foreground font-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            SOBRE & SERVIÇOS
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${
              activeTab === "catalog" ? "bg-primary text-primary-foreground font-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            {isComercio ? "CARDÁPIO" : "SERVIÇOS E PREÇOS"}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition ${
              activeTab === "reviews" ? "bg-primary text-primary-foreground font-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            AVALIAÇÕES ({reviewsList.length})
          </button>
        </div>
      </section>

      {/* ── TABS CONTENT ── */}
      <main className="container mx-auto px-4 lg:px-8 py-8 flex-1 pb-28">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Tab details */}
          <div className="lg:col-span-8 space-y-8">
            {/* ABOUT TAB */}
            {activeTab === "about" && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Sobre o Profissional</span>
                  </h2>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                    {provider.description || "Nenhuma descrição fornecida pelo parceiro ainda."}
                  </p>
                </div>

                {/* Popular Services list */}
                <div className="border-t border-zinc-900/60 pt-6 space-y-4">
                  <h3 className="font-bold text-white text-base">Especialidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.services ? (
                      (() => {
                        try {
                          const parsed = typeof provider.services === "string" ? JSON.parse(provider.services) : provider.services;
                          if (Array.isArray(parsed)) {
                            return parsed.map((s, idx) => {
                              const serviceName = typeof s === "object" && s !== null ? s.name || s.title || JSON.stringify(s) : String(s);
                              return (
                                <span key={idx} className="px-3.5 py-1.5 bg-zinc-900 text-zinc-300 border border-zinc-850 rounded-xl text-xs font-semibold">
                                  {serviceName}
                                </span>
                              );
                            });
                          }
                        } catch (e) {}
                        return <span className="text-zinc-500 text-sm">Nenhuma especialidade específica cadastrada.</span>;
                      })()
                    ) : (
                      <span className="text-zinc-500 text-sm">Nenhuma especialidade cadastrada.</span>
                    )}
                  </div>
                </div>

                {/* Portfólio / Galeria de Fotos de Trabalhos Anteriores */}
                <div className="border-t border-zinc-900/60 pt-6 space-y-4">
                  <h3 className="font-bold text-white text-base">Fotos do Portfólio / Trabalhos</h3>
                  {provider.gallery && provider.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {provider.gallery.map((imgUrl: string, idx: number) => (
                        <div key={idx} className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-900">
                          <img src={imgUrl} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
                        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
                        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80",
                      ].map((imgUrl, idx) => (
                        <div key={idx} className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-900">
                          <img src={imgUrl} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CATALOG / PRODUCTS / SERVICES TAB */}
            {activeTab === "catalog" && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      {isComercio ? (
                        <>
                          <ShoppingBag className="w-5 h-5 text-primary" />
                          <span>Cardápio & Produtos</span>
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-5 h-5 text-primary" />
                          <span>Serviços & Valores</span>
                        </>
                      )}
                    </h2>
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                      {isComercio ? "Escolha os produtos para o seu pedido" : "Selecione os serviços que deseja solicitar"}
                    </p>
                  </div>

                  {catalogItems.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Nenhum item disponível neste momento.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {catalogItems.map((item) => {
                        const qty = selectedItems[item.id] || 0;
                        return (
                          <div key={item.id} className="bg-[#050505] border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-white text-sm">{item.name}</h4>
                              <p className="text-zinc-500 text-xs leading-normal line-clamp-2">{item.description}</p>
                              <span className="text-primary text-xs font-extrabold block pt-1">
                                R$ {Number(item.price).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 mt-auto">
                              {qty > 0 ? (
                                <div className="flex items-center bg-zinc-900 rounded-xl border border-zinc-800 p-0.5 w-full justify-between">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedItems(prev => ({ ...prev, [item.id]: Math.max(0, qty - 1) }))}
                                    className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-sm bg-zinc-950 rounded-lg"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 text-white text-xs font-black">{qty} selecionado(s)</span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedItems(prev => ({ ...prev, [item.id]: qty + 1 }))}
                                    className="w-8 h-8 flex items-center justify-center text-primary font-bold text-sm bg-zinc-950 rounded-lg"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => setSelectedItems(prev => ({ ...prev, [item.id]: 1 }))}
                                  className="w-full bg-zinc-900 hover:bg-primary border border-zinc-850 hover:border-primary text-zinc-300 hover:text-primary-foreground font-extrabold text-[11px] rounded-xl h-8 py-1 px-3 transition-all"
                                >
                                  Selecionar
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                {!userProfile ? (
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 text-center space-y-4">
                    <h3 className="font-extrabold text-lg text-white">Escrever uma Avaliação</h3>
                    <p className="text-sm text-zinc-400 max-w-md mx-auto">
                      Para avaliar ou comentar, você deve obrigatoriamente estar logado com sua conta do Google ou e-mail do XamaJá.
                    </p>
                    <Button
                      onClick={() => {
                        window.location.href = `/parceiro?redirect=${encodeURIComponent(window.location.pathname + "?tab=reviews")}`;
                      }}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground font-black px-8 py-3 rounded-xl transition shadow-lg shadow-primary/10"
                    >
                      Entrar / Criar Conta
                    </Button>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 space-y-5">
                    <h3 className="font-extrabold text-lg text-white">Escrever uma Avaliação</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Identidade</label>
                          <Input
                            type="text"
                            disabled
                            value={`${userProfile.name} (Sua Conta)`}
                            className="bg-[#0c0c0e]/50 border-zinc-900 text-zinc-400 rounded-xl cursor-not-allowed opacity-80"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nota (1 a 5) *</label>
                          <div className="flex items-center gap-1.5 h-11">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= rating ? "text-primary fill-current" : "text-zinc-700"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Comentário</label>
                        <Textarea
                          rows={3}
                          placeholder="Escreva como foi sua experiência com este parceiro..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="bg-[#0c0c0e] border-zinc-900 text-white rounded-xl focus:border-primary focus-visible:ring-0 resize-none"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold px-6 rounded-xl h-11 disabled:opacity-75"
                      >
                        {isSubmittingReview ? "Enviando..." : "Enviar Avaliação"}
                      </Button>
                    </form>
                  </div>
                )}

                {/* Reviews List */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 space-y-6">
                  <h3 className="font-extrabold text-lg text-white">Opiniões de Clientes</h3>
                  <div className="divide-y divide-zinc-900/80 space-y-6">
                    {reviewsList.map((rev) => (
                      <div key={rev.id} className="pt-6 first:pt-0 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 overflow-hidden flex-shrink-0 border border-zinc-800">
                          <img
                            src={rev.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.userName)}`}
                            alt={rev.userName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="font-bold text-white text-sm">{rev.userName}</h4>
                            <span className="text-zinc-500 text-xs">{rev.createdAt}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating ? "text-primary fill-current" : "text-zinc-800"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-zinc-400 text-xs leading-relaxed">{rev.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Business info sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-900">
                <div className="p-3 bg-zinc-900 rounded-xl text-primary border border-zinc-850">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Horário de Funcionamento</h3>
                  <p className="text-xs text-zinc-500">Dias e horários de atendimento</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-zinc-900/40 pb-2">
                  <span className="text-zinc-500 font-semibold">Segunda a Sexta</span>
                  <span className="text-zinc-300 font-extrabold">{hours.weekdays || "08:00 - 18:00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-semibold">Sábado e Domingo</span>
                  <span className="text-zinc-300 font-extrabold">{hours.weekends || "08:00 - 12:00"}</span>
                </div>
              </div>
            </div>

            {isComercio && provider.deliveryTime && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 pb-2">
                  <div className="p-3 bg-zinc-900 rounded-xl text-primary border border-zinc-850">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Serviço de Delivery</h3>
                    <p className="text-xs text-zinc-500">Entregamos na sua casa</p>
                  </div>
                </div>
                <div className="text-xs text-zinc-400 flex justify-between pt-1">
                  <span>Tempo estimado:</span>
                  <strong className="text-primary font-black">{provider.deliveryTime}</strong>
                </div>
              </div>
            )}

            {/* Direct Contact WhatsApp Banner */}
            <div className="bg-gradient-to-br from-primary/10 to-emerald-500/5 border border-primary/25 rounded-3xl p-6 shadow-xl text-center space-y-4">
              <h4 className="font-extrabold text-white text-base leading-tight">Fale direto com o Parceiro!</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">Combine detalhes, solicite orçamentos ou faça pedidos de forma 100% gratuita via WhatsApp.</p>
              <button
                onClick={handleContactWhatsApp}
                className="w-full py-3.5 bg-primary hover:bg-primary/95 text-primary-foreground font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/10 text-xs transition"
              >
                <Phone className="w-4 h-4" />
                <span>Chamar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom WhatsApp Mobile Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#050505]/80 backdrop-blur-md border-t border-zinc-900 z-40 lg:hidden flex-shrink-0">
        <button
          onClick={handleContactWhatsApp}
          className="w-full py-4 bg-primary text-primary-foreground font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/15 text-sm"
        >
          <Phone className="w-4.5 h-4.5" />
          <span>Falar no WhatsApp agora</span>
        </button>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
