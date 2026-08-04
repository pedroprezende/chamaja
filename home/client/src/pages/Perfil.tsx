import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateWhatsAppMessage } from "../lib/whatsapp-helper";
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
  Globe,
  Calendar,
  Eye,
  MessageCircle,
  Shield,
  Compass,
  Camera,
  Instagram,
  Facebook,
  Youtube,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  parseWorkingHours,
  calculateRealTimeStatus,
  formatDaySchedule,
  DAYS_CONFIG,
} from "../../../../lib/working-hours";

const TikTokIcon = () => (
  <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.99 1.13 2.37 1.83 3.84 2.05v3.83c-1.39-.08-2.74-.52-3.92-1.28-.27-.18-.52-.37-.76-.58-.07 1.94-.12 3.89-.18 5.83-.09 1.76-.56 3.53-1.52 5.01-1.34 2.02-3.66 3.25-6.07 3.28-2.31.1-4.66-.81-6.1-2.61-1.61-1.89-2.07-4.64-1.32-7.05.65-2.22 2.47-3.99 4.71-4.46.2-.04.4-.08.61-.11v3.91c-.81.25-1.54.76-2.03 1.45-.63.85-.75 2-.42 3.03.3.93 1.07 1.67 2.03 1.93.99.29 2.11.08 2.92-.57.87-.66 1.34-1.74 1.36-2.83.02-3.82.01-7.64.01-11.46.01 0 .01-.01.01-.02z"/>
  </svg>
);

const parseJsonArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch { }
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};



export default function Perfil({ params }: { params: { id: string } }) {
  const providerId = params.id;

  // Data States
  const [provider, setProvider] = useState<any | null>(null);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "catalog" | "reviews" | "photos">("about");

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

  // Image Viewer Modal State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    } else if (initialTab === "photos") {
      setActiveTab("photos");
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
      const inputPayload = JSON.stringify(providerId);
      const url = `/api/trpc/providers.getReviews?input=${encodeURIComponent(inputPayload)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.result && Array.isArray(json.result.data)) {
          setReviewsList(json.result.data);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed loading database reviews:", e);
    }

    setReviewsList([]);
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
        await fetchReviews();
        await fetchProviderDetails();
      } else {
        const errorMsg = json.error?.json?.message || json.error?.message || "Ocorreu um erro ao enviar sua avaliação.";
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão ao enviar avaliação.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleContactWhatsApp = (singleItemName?: string) => {
    if (!provider) return;
    const cleanPhone = (provider.whatsapp || provider.phone || "").replace(/\D/g, "");
    if (!cleanPhone) {
      toast.error("WhatsApp não configurado.");
      return;
    }

    const items = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const item = catalogItems.find(i => i.id === itemId);
        return {
          name: item?.name || "Item",
          price: item?.price || 0,
          quantity: qty,
        };
      });

    const text = generateWhatsAppMessage({
      provider,
      items,
      selectedItemName: typeof singleItemName === "string" ? singleItemName : undefined,
    });

    const message = encodeURIComponent(text);
    const targetPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${targetPhone}?text=${message}`, "_blank");
  };

  // Copy Profile URL to share
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link do perfil copiado!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center gap-4">
        <div className="w-11 h-11 border-[3px] border-zinc-800 border-t-primary rounded-full animate-spin"></div>
        <span className="text-zinc-500 font-semibold text-sm tracking-wide">Carregando perfil...</span>
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
          imageUri: item.imageUri || item.image || item.imageUrl || item.photo || null,
        }));
      }
    } catch (e) {
      console.warn("Failed to parse provider services:", e);
    }
    return [];
  })();

  const socialLinks = (() => {
    if (!provider?.socialLinks) return {};
    if (typeof provider.socialLinks === "object") return provider.socialLinks;
    try {
      return JSON.parse(provider.socialLinks);
    } catch {
      return {};
    }
  })();

  const parsedHours = parseWorkingHours(provider.workingHours);
  const realTimeStatus = calculateRealTimeStatus(parsedHours);

  // Gallery List
  const galleryList = parseJsonArray(provider.gallery);

  // Review List
  const reviewsToDisplay = reviewsList;

  // Specialties parser
  const specialties = (() => {
    if (provider.tags) {
      try {
        const parsed = typeof provider.tags === "string" ? JSON.parse(provider.tags) : provider.tags;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
      if (typeof provider.tags === "string" && provider.tags.trim()) {
        return provider.tags.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    }
    if (catalogItems.length > 0) {
      return catalogItems.map(item => item.name);
    }
    if (provider.popularServices) {
      try {
        const parsed = typeof provider.popularServices === "string" ? JSON.parse(provider.popularServices) : provider.popularServices;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
      if (typeof provider.popularServices === "string" && provider.popularServices.trim()) {
        return provider.popularServices.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return [];
  })();

  // Mock distance for stable layout (using first char of ID to make it realistic & persistent per provider)
  const mockDistance = (() => {
    const code = provider.id.charCodeAt(0) || 1;
    return `${((code % 5) * 0.4 + 0.5).toFixed(1)} km de você`;
  })();

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 selection:text-white font-sans flex flex-col pb-24 lg:pb-32">
      {/* ── HEADER ── */}
      <header className="z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0">
        <div className="container mx-auto px-4 lg:px-8 h-[72px] flex items-center justify-between gap-4">
          <button
            onClick={() => window.location.href = "/busca"}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar para Busca</span>
          </button>

          <img
            src="/assets/images/logo-xamaja.png"
            alt="XamaJá"
            className="h-8 w-auto object-contain cursor-pointer"
            onClick={() => window.location.href = "/"}
          />

          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-2 px-3 h-10 rounded-full border text-xs font-bold transition ${
              isFavorite
                ? "bg-primary/10 border-primary text-primary"
                : "border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            <span className="hidden sm:inline">{isFavorite ? "Favoritado" : "Favoritar"}</span>
          </button>
        </div>
      </header>

      {/* ── PROFILE COVER PHOTO ── */}
      <section className="relative h-64 md:h-96 w-full overflow-hidden bg-zinc-950 flex-shrink-0">
        {provider.coverUri ? (
          <img
            src={provider.coverUri}
            alt={provider.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center border-b border-white/[0.04]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-black/25" />

        {/* Floating actions */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={handleShare}
            className="p-3 bg-black/50 backdrop-blur-md border border-white/15 hover:bg-black/70 hover:border-white/25 text-white rounded-full transition"
            title="Compartilhar Perfil"
          >
            <Share2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </section>

      {/* ── PROFILE INFO CARD (Overlapping) ── */}
      <section className="container mx-auto px-4 lg:px-8 relative -mt-16 md:-mt-24 z-10 flex-shrink-0">
        <div className="bg-zinc-950/40 backdrop-blur-xl border border-white/[0.08] rounded-[28px] p-6 md:p-9 shadow-2xl flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
          {/* Left / Center Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full lg:w-auto">
            {/* Circular Avatar */}
            <div className="relative flex-shrink-0 -mt-14 md:-mt-20">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-[5px] border-zinc-950 overflow-hidden shadow-xl bg-zinc-900">
                <img
                  src={provider.avatarUri || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=25D366&color=fff&size=150`}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {provider.isVerified && (
                <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-[3px] border-zinc-950">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white fill-current" />
                </div>
              )}
            </div>

            {/* Info details */}
            <div className="flex-1 text-center md:text-left space-y-3 w-full">
              <div className="flex flex-wrap items-center gap-2.5 justify-center md:justify-start">
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{provider.name}</h1>
                {provider.isVerified && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-[#25D366] text-black text-[9px] font-black uppercase tracking-wider rounded-md">
                    <CheckCircle2 className="w-3 h-3 fill-current" /> VERIFICADO
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-sm font-medium">
                {provider.subcategoryName || provider.category || "Profissional Local"}
              </p>

              {/* Stats Line */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-zinc-400 pt-1">
                <div className="flex items-center gap-1 text-zinc-300">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                  <span className="text-white font-extrabold">{Number(provider.rating || 5.0).toFixed(1)}</span>
                  <span className="text-zinc-500">({provider.ratingCount || 2} avaliações)</span>
                </div>
                <span className="text-zinc-800">•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{provider.neighborhood || "Centro"}, {provider.city || "Bragança Paulista"}</span>
                </div>
                <span className="text-zinc-800">•</span>
                <div className="flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{mockDistance}</span>
                </div>
                {provider.responseTime && (
                  <>
                    <span className="text-zinc-800">•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Responde em {provider.responseTime}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Badges line */}
              {provider.responseTime && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                  <span className="flex items-center gap-1 px-3 py-1 bg-zinc-900 border border-white/[0.06] text-zinc-300 text-[10px] font-bold rounded-lg">
                    <MessageCircle className="w-3.5 h-3.5 text-zinc-400" /> Responde em {provider.responseTime}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Status Card */}
          <div className="w-full lg:w-auto bg-[#0a0a0c] border border-white/[0.08] p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 min-w-[220px]">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1.5 ${
              realTimeStatus.isOpen
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${realTimeStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
              {realTimeStatus.badge}
            </span>
            <p className="text-xs text-zinc-400 font-semibold">{realTimeStatus.detailMessage}</p>
            <button
              onClick={() => {
                document.getElementById("working-hours-card")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-1 flex items-center gap-1.5 px-3 py-1.5 border border-white/10 hover:border-white/20 text-zinc-450 hover:text-white rounded-lg text-[10px] font-extrabold transition-all"
            >
              <Calendar className="w-3 h-3" /> Ver horário completo
            </button>
          </div>
        </div>
      </section>

      {/* ── PROFILE TABS SELECTOR ── */}
      <section className="container mx-auto px-4 lg:px-8 mt-8 sticky top-[72px] z-40 bg-[#050505]/95 backdrop-blur-xl pb-3 pt-2 flex-shrink-0">
        <div className="flex bg-transparent border-b border-white/[0.08] pb-1 gap-2 max-w-full overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("about")}
            className={`py-3 px-5 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 ${
              activeTab === "about"
                ? "border border-[#25D366] bg-[#25D366]/5 text-[#25D366] font-black"
                : "border border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" /> SOBRE & SERVIÇOS
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`py-3 px-5 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 ${
              activeTab === "catalog"
                ? "border border-[#25D366] bg-[#25D366]/5 text-[#25D366] font-black"
                : "border border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Briefcase className="w-4 h-4" /> {isComercio ? "CARDÁPIO" : "SERVIÇOS E PREÇOS"}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`py-3 px-5 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 ${
              activeTab === "reviews"
                ? "border border-[#25D366] bg-[#25D366]/5 text-[#25D366] font-black"
                : "border border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Star className="w-4 h-4" /> AVALIAÇÕES ({reviewsList.length})
          </button>
          {galleryList.length > 0 && (
            <button
              onClick={() => setActiveTab("photos")}
              className={`py-3 px-5 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 ${
                activeTab === "photos"
                  ? "border border-[#25D366] bg-[#25D366]/5 text-[#25D366] font-black"
                  : "border border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Camera className="w-4 h-4" /> FOTOS
            </button>
          )}
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main className="container mx-auto px-4 lg:px-8 py-6 flex-1">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ABOUT & SERVICES TAB (VERTICAL FLOW) */}
            {activeTab === "about" && (
              <>
                {/* Fotos do Trabalho Card */}
                {galleryList.length > 0 && (
                  <div className="bg-zinc-950 border border-white/[0.08] rounded-[28px] p-6 md:p-8 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <Camera className="w-4.5 h-4.5 text-primary" /> Fotos do Trabalho
                      </h3>
                      <button
                        onClick={() => setActiveTab("photos")}
                        className="text-xs font-bold text-zinc-450 hover:text-white transition"
                      >
                        Ver todas as fotos →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-1">
                      {galleryList.slice(0, 4).map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedImage(imgUrl)}
                          className="aspect-[4/3] bg-zinc-900 rounded-xl overflow-hidden border border-white/[0.05] cursor-pointer group"
                        >
                          <img
                            src={imgUrl}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                      ))}

                      {/* 5th Card as Blur Overlay */}
                      {galleryList.length >= 5 && (
                        <div
                          onClick={() => setActiveTab("photos")}
                          className="aspect-[4/3] bg-zinc-900 rounded-xl overflow-hidden border border-white/[0.05] relative cursor-pointer group"
                        >
                          <img
                            src={galleryList[4]}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300 filter blur-xs"
                          />
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-2">
                            <span className="text-white font-black text-sm">+{galleryList.length - 4}</span>
                            <span className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider mt-0.5">Ver todas</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sobre o Profissional Card */}
                <div className="bg-zinc-950 border border-white/[0.08] rounded-[28px] p-6 md:p-8 space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <User className="w-4.5 h-4.5 text-primary" /> Sobre o {isComercio ? "Estabelecimento" : "Profissional"}
                    </h3>
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                      {provider.description || "Nenhuma descrição detalhada cadastrada."}
                    </p>
                  </div>

                  {/* Especialidades */}
                  {specialties.length > 0 && (
                    <div className="border-t border-white/[0.06] pt-5 space-y-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Especialidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {specialties.map((spec: string, idx: number) => (
                          <span key={idx} className="px-3.5 py-1.5 bg-[#0a0a0c] text-zinc-300 border border-white/[0.06] rounded-xl text-xs font-semibold">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Atendimento */}
                  <div className="border-t border-white/[0.06] pt-5 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Atende</h4>
                    <div className="flex flex-wrap gap-4">
                      <div className={`flex items-center gap-2 text-xs font-bold ${
                        provider.businessType !== "comercio"
                          ? "text-emerald-400 bg-emerald-500/5 px-3.5 py-2 border border-emerald-500/10 rounded-xl"
                          : "text-zinc-500 px-3.5 py-2 border border-white/[0.04] rounded-xl line-through"
                      }`}>
                        <span>🏠</span> Em domicílio
                      </div>
                      <div className={`flex items-center gap-2 text-xs font-bold ${
                        provider.businessType === "comercio" || provider.address || provider.neighborhood
                          ? "text-emerald-400 bg-emerald-500/5 px-3.5 py-2 border border-emerald-500/10 rounded-xl"
                          : "text-zinc-500 px-3.5 py-2 border border-white/[0.04] rounded-xl line-through"
                      }`}>
                        <span>🏢</span> No estabelecimento
                      </div>
                      <div className={`flex items-center gap-2 text-xs font-bold ${
                        specialties.some((s: string) => s.toLowerCase().includes("online")) || provider.category?.toLowerCase().includes("aula") || provider.category?.toLowerCase().includes("tutoria")
                          ? "text-emerald-400 bg-emerald-500/5 px-3.5 py-2 border border-emerald-500/10 rounded-xl"
                          : "text-zinc-500 px-3.5 py-2 border border-white/[0.04] rounded-xl"
                      }`}>
                        <span>💻</span> Atendimento online
                      </div>
                    </div>
                  </div>
                </div>

                {/* Avaliações dos Clientes Card */}
                <div className="bg-zinc-950 border border-white/[0.08] rounded-[28px] p-6 md:p-8 space-y-5">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2.5 text-sm font-extrabold text-white">
                      <Star className="w-4.5 h-4.5 text-primary" /> Avaliações dos Clientes
                      <span className="text-amber-400 font-extrabold ml-1.5">{Number(provider.rating || 5.0).toFixed(1)}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s: number) => (
                          <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-zinc-500 font-normal">({reviewsList.length} avaliações)</span>
                    </div>
                    {reviewsToDisplay.length > 0 && (
                      <button
                        onClick={() => setActiveTab("reviews")}
                        className="text-xs font-bold text-zinc-450 hover:text-white transition"
                      >
                        Ver todas as avaliações →
                      </button>
                    )}
                  </div>

                  {reviewsToDisplay.length === 0 ? (
                    <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center text-zinc-550 w-full">
                      <Star className="w-8 h-8 mx-auto mb-3 opacity-40 text-primary" />
                      <p className="font-bold text-white text-sm">Nenhuma avaliação ainda</p>
                      <p className="text-xs text-zinc-450 mt-1 max-w-xs mx-auto">
                        Este parceiro ainda não recebeu avaliações.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {reviewsToDisplay.slice(0, 2).map((rev) => (
                        <div key={rev.id} className="bg-[#0a0a0c] border border-white/[0.06] p-5 rounded-2xl flex gap-4">
                          <div className="w-9 h-9 rounded-full bg-zinc-900 overflow-hidden flex-shrink-0 border border-white/[0.08]">
                            <img
                              src={rev.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.userName)}`}
                              alt={rev.userName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <h4 className="font-bold text-white text-xs">{rev.userName}</h4>
                              <span className="text-zinc-500 text-[10px]">{rev.createdAt}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s: number) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= rev.rating ? "text-amber-400 fill-current" : "text-zinc-800"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-zinc-400 text-xs leading-normal">{rev.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* CATALOG TAB */}
            {activeTab === "catalog" && (
              <div className="bg-zinc-950 border border-white/[0.08] rounded-[28px] p-6 md:p-9 space-y-8">
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
                    <p className="text-zinc-550 text-[10px] font-bold uppercase tracking-wider">
                      {isComercio ? "Escolha os produtos para o seu pedido" : "Selecione os serviços que deseja solicitar"}
                    </p>
                  </div>

                  {catalogItems.length === 0 ? (
                    <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center text-zinc-550 w-full">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-3 opacity-40 text-primary" />
                      <p className="font-bold text-white text-sm">Catálogo em atualização</p>
                      <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                        Os itens e serviços ainda não foram cadastrados pelo proprietário. Entre em contato para mais informações!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {catalogItems.map((item: any) => {
                        const qty = selectedItems[item.id] || 0;
                        return (
                          <div key={item.id} className="bg-[#0a0a0b] border border-white/[0.07] hover:border-white/[0.14] p-5 rounded-2xl flex flex-col justify-between gap-4 transition-colors">
                            <div className="flex gap-4 items-start">
                              {item.imageUri && (
                                <div
                                  onClick={() => setSelectedImage(item.imageUri)}
                                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.08] flex-shrink-0 cursor-pointer group"
                                >
                                  <img
                                    src={item.imageUri}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  />
                                </div>
                              )}
                              <div className="space-y-1 flex-1 min-w-0">
                                <h4 className="font-extrabold text-white text-sm">{item.name}</h4>
                                <p className="text-zinc-500 text-xs leading-normal line-clamp-2">{item.description}</p>
                                {item.price > 0 && (
                                  <span className="text-[#25D366] text-sm font-extrabold block pt-1">
                                    R$ {Number(item.price).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-auto">
                              {qty > 0 ? (
                                <div className="flex items-center bg-zinc-900 rounded-xl border border-white/[0.08] p-0.5 w-full justify-between">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedItems(prev => ({ ...prev, [item.id]: Math.max(0, qty - 1) }))}
                                    className="w-8 h-8 flex items-center justify-center text-zinc-450 hover:text-white font-bold text-sm bg-zinc-950 rounded-lg"
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
                                  className="w-full bg-zinc-900 hover:bg-[#25D366] border border-white/[0.08] hover:border-primary text-zinc-350 hover:text-black font-extrabold text-[11px] rounded-xl h-9 py-1 px-3 transition-all"
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
                  <div className="bg-zinc-950 border border-white/[0.08] rounded-[28px] p-6 md:p-9 text-center space-y-4">
                    <h3 className="font-extrabold text-lg text-white">Escrever uma Avaliação</h3>
                    <p className="text-sm text-zinc-450 max-w-md mx-auto">
                      Para avaliar ou comentar, você deve estar conectado à sua conta do XamaJá.
                    </p>
                    <Button
                      onClick={() => {
                        window.location.href = `/parceiro?redirect=${encodeURIComponent(window.location.pathname + "?tab=reviews")}`;
                      }}
                      className="bg-[#25D366] hover:bg-[#25D366]/95 text-black font-black px-8 py-3 rounded-xl transition shadow-lg shadow-emerald-500/10"
                    >
                      Entrar / Criar Conta
                    </Button>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-white/[0.08] rounded-[28px] p-6 md:p-9 space-y-5">
                    <h3 className="font-extrabold text-lg text-white">Escrever uma Avaliação</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Identidade</label>
                          <Input
                            type="text"
                            disabled
                            value={`${userProfile.name} (Sua Conta)`}
                            className="bg-[#0c0c0e]/50 border-white/[0.08] text-zinc-400 rounded-xl cursor-not-allowed opacity-80"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Nota (1 a 5) *</label>
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
                                    star <= rating ? "text-amber-400 fill-current" : "text-zinc-700"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Comentário</label>
                        <Textarea
                          rows={3}
                          placeholder="Escreva como foi sua experiência com este parceiro..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="bg-[#0c0c0e] border-white/[0.08] text-white rounded-xl focus:border-[#25D366] focus-visible:ring-0 resize-none"
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
                <div className="bg-zinc-950 border border-white/[0.08] rounded-[28px] p-6 md:p-9 space-y-6">
                  <h3 className="font-extrabold text-lg text-white">Opiniões de Clientes</h3>
                  
                  {reviewsToDisplay.length === 0 ? (
                    <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center text-zinc-550 w-full">
                      <Star className="w-8 h-8 mx-auto mb-3 opacity-40 text-primary" />
                      <p className="font-bold text-white text-sm">Nenhuma avaliação ainda</p>
                      <p className="text-xs text-zinc-450 mt-1 max-w-xs mx-auto">
                        Seja o primeiro a avaliar e compartilhe sua experiência com outros usuários!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.06] space-y-6">
                      {reviewsToDisplay.map((rev: any) => (
                        <div key={rev.id} className="pt-6 first:pt-0 flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-zinc-900 overflow-hidden flex-shrink-0 border border-white/[0.08]">
                            <img
                              src={rev.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.userName)}`}
                              alt={rev.userName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <h4 className="font-bold text-white text-sm">{rev.userName}</h4>
                              <span className="text-zinc-550 text-xs">{rev.createdAt}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= rev.rating ? "text-amber-400 fill-current" : "text-zinc-800"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed">{rev.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PHOTOS TAB */}
            {activeTab === "photos" && (
              <div className="bg-zinc-950 border border-white/[0.08] rounded-[28px] p-6 md:p-9 space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    <span>Galeria de Fotos</span>
                  </h2>
                  <p className="text-zinc-550 text-[10px] font-bold uppercase tracking-wider">
                    Confira todos os trabalhos e registros deste parceiro
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                  {galleryList.map((imgUrl: string, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(imgUrl)}
                      className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-white/[0.06] cursor-pointer group"
                    >
                      <img
                        src={imgUrl}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Horário de Funcionamento */}
            <div id="working-hours-card" className="bg-zinc-950 border border-white/[0.08] rounded-[28px] p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-900 rounded-xl text-primary border border-white/[0.06]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Horário de Funcionamento</h3>
                    <p className="text-xs text-zinc-450">{realTimeStatus.detailMessage}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap flex items-center gap-1 ${
                  realTimeStatus.isOpen
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {realTimeStatus.isOpen ? "🟢 Aberto agora" : "🔴 Fechado agora"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {DAYS_CONFIG.map(({ key, label }) => {
                  const daySched = parsedHours[key];
                  const formatted = formatDaySchedule(daySched);
                  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
                  const dayKeysOrder: typeof key[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                  const isToday = dayKeysOrder[todayIndex] === key;

                  return (
                    <div
                      key={key}
                      className={`flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-b-0 ${
                        isToday ? "font-bold text-white bg-zinc-900/60 px-2.5 py-2 rounded-xl -mx-2 border-primary/20 border" : "text-zinc-400"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        {isToday && <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse"></span>}
                        <span>{label}</span>
                      </span>
                      <span className={daySched.active ? "text-zinc-200 font-extrabold" : "text-zinc-500 font-normal"}>
                        {formatted}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Profissional de Confiança */}
            <div className="bg-zinc-950 border border-white/[0.08] rounded-[28px] p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
                <div className="p-2.5 bg-zinc-900 rounded-xl text-primary border border-white/[0.06]">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-sm">
                  {isComercio ? "Comércio de Confiança" : "Profissional de Confiança"}
                </h3>
              </div>

              {/* 4 badges in 4 columns grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-zinc-900/60 border border-white/[0.04] p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1.5">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 fill-current" />
                  <div className="text-[8px] font-black text-zinc-400 leading-tight">
                    <p>Perfil</p>
                    <p className="text-white">verificado</p>
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-white/[0.04] p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1.5">
                  <MessageCircle className="w-4.5 h-4.5 text-emerald-400" />
                  <div className="text-[8px] font-black text-zinc-400 leading-tight">
                    <p>WhatsApp</p>
                    <p className="text-white">confirmado</p>
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-white/[0.04] p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1.5">
                  <MapPin className="w-4.5 h-4.5 text-emerald-400" />
                  <div className="text-[8px] font-black text-zinc-400 leading-tight">
                    <p>Endereço</p>
                    <p className="text-white">confirmado</p>
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-white/[0.04] p-2.5 rounded-xl flex flex-col items-center justify-center text-center gap-1.5">
                  <Calendar className="w-4.5 h-4.5 text-[#a78bfa]" />
                  <div className="text-[8px] font-black text-zinc-400 leading-tight">
                    <p>Atua desde</p>
                    <p className="text-white">{provider.foundedYear || 2025}</p>
                  </div>
                </div>
              </div>

              {/* Redes Sociais */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-white text-xs">Redes Sociais</h4>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {(() => {
                    const SOCIAL_NETWORKS_CONFIG = [
                      { key: "instagram", icon: <Instagram className="w-4.5 h-4.5 text-white" />, label: "Instagram", bg: "hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600" },
                      { key: "facebook", icon: <Facebook className="w-4.5 h-4.5 text-white" />, label: "Facebook", bg: "hover:bg-[#1877F2]" },
                      { key: "youtube", icon: <Youtube className="w-4.5 h-4.5 text-white" />, label: "YouTube", bg: "hover:bg-[#FF0000]" },
                      { key: "tiktok", icon: <TikTokIcon />, label: "TikTok", bg: "hover:bg-black hover:border-white/30" },
                      { key: "website", icon: <Globe className="w-4.5 h-4.5 text-white" />, label: "Website", bg: "hover:bg-zinc-800" },
                    ];

                    const activeNetworks = SOCIAL_NETWORKS_CONFIG.filter(
                      (n) => socialLinks[n.key] && String(socialLinks[n.key]).trim() !== ""
                    );

                    // If no networks are set, render a fallback set for premium mockup appearance
                    const listToRender = activeNetworks.length > 0 ? activeNetworks : [
                      { key: "instagram", icon: <Instagram className="w-4.5 h-4.5 text-white" />, label: "Instagram", bg: "hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600" },
                      { key: "facebook", icon: <Facebook className="w-4.5 h-4.5 text-white" />, label: "Facebook", bg: "hover:bg-[#1877F2]" },
                      { key: "youtube", icon: <Youtube className="w-4.5 h-4.5 text-white" />, label: "YouTube", bg: "hover:bg-[#FF0000]" },
                      { key: "tiktok", icon: <TikTokIcon />, label: "TikTok", bg: "hover:bg-black hover:border-white/30" },
                      { key: "website", icon: <Globe className="w-4.5 h-4.5 text-white" />, label: "Website", bg: "hover:bg-zinc-800" },
                    ];

                    return listToRender.map((network) => {
                      const rawUrl = socialLinks[network.key] ? String(socialLinks[network.key]).trim() : "";
                      const fullUrl = rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`) : "#";

                      return (
                        <a
                          key={network.key}
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={network.label}
                          className={`w-9.5 h-9.5 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center transition-all duration-350 hover:scale-105 active:scale-95 ${network.bg}`}
                        >
                          {network.icon}
                        </a>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Direct Contact WhatsApp Banner */}
            <div className="bg-gradient-to-br from-primary/10 to-emerald-500/5 border border-primary/25 rounded-[28px] p-6 shadow-xl text-center space-y-4">
              <div className="flex justify-center">
                <span className="text-xl">✨</span>
              </div>
              <h4 className="font-extrabold text-white text-base leading-tight">Fale direto com o {isComercio ? "comércio" : "profissional"}!</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">Combine detalhes, solicite orçamentos ou faça pedidos de forma 100% gratuita via WhatsApp.</p>
              <button
                onClick={handleContactWhatsApp}
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#25D366]/95 text-black font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 text-xs transition"
              >
                <Phone className="w-4 h-4 fill-current" />
                <span>Chamar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── STICKY BOTTOM BAR (DESKTOP) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/85 backdrop-blur-md border-t border-white/[0.08] z-40 hidden lg:block py-4 shadow-2xl">
        <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-zinc-900">
              <img
                src={provider.avatarUri || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=25D366&color=fff&size=150`}
                alt={provider.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs leading-tight">{provider.name}</h4>
              <p className="text-zinc-400 text-[10px] mt-0.5">{provider.subcategoryName || provider.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-zinc-300">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-400 fill-current" />
              <span className="text-white font-extrabold">{Number(provider.rating || 5.0).toFixed(1)}</span>
              <span className="text-zinc-550 text-[10px]">({reviewsList.length || 2} avaliações)</span>
            </div>
            <span className="text-zinc-800">•</span>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{mockDistance}</span>
            </div>
            <span className="text-zinc-800">•</span>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${realTimeStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
              <span className={realTimeStatus.isOpen ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {realTimeStatus.badge}
              </span>
              <span className="text-zinc-500 text-[10px]">({realTimeStatus.detailMessage})</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setActiveTab("catalog");
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="bg-transparent border border-white/10 hover:border-white/20 text-white font-bold px-5 h-10 rounded-xl text-xs transition"
            >
              Ver Serviços
            </Button>
            <Button
              onClick={handleContactWhatsApp}
              className="bg-[#25D366] hover:bg-[#25D366]/90 text-black font-black px-5 h-10 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              <Phone className="w-3.5 h-3.5 fill-current" /> Solicitar Orçamento
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom WhatsApp Mobile Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#050505]/85 backdrop-blur-md border-t border-white/[0.08] z-40 lg:hidden flex-shrink-0">
        <button
          onClick={handleContactWhatsApp}
          className="w-full py-4 bg-primary text-primary-foreground font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/15 text-sm"
        >
          <Phone className="w-4.5 h-4.5" />
          <span>Falar no WhatsApp agora</span>
        </button>
      </div>

      {/* ── IMAGE VIEWER MODAL ── */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Trabalho do Profissional"
            className="max-w-full max-h-[85vh] object-contain rounded-lg border border-white/10"
          />
        </div>
      )}

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
