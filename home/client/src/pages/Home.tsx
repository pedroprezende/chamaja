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
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("Bragança Paulista - SP");
  const [userProfile, setUserProfile] = useState<any | null>(null);

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

  // Dynamic featured ads from app's database
  const [featuredAdsList, setFeaturedAdsList] = useState<any[]>([]);
  const [isLoadingFeaturedAds, setIsLoadingFeaturedAds] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  const adsToRender = useMemo(() => {
    return featuredAdsList.length > 0 ? featuredAdsList : [
      {
        id: "mock-ad-japa",
        providerId: "mock-ad-japa",
        providerName: "Pizzaria Japá",
        title: "Alimentação",
        description: "A pizzaria mais querida da região. Venha experimentar o melhor rodízio e pizzas gourmet com borda recheada de Bragança Paulista.",
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80",
        whatsapp: "11988888888"
      },
      {
        id: "mock-ad-clinica",
        providerId: "mock-ad-clinica",
        providerName: "Dr. Heron Rocha - Saúde",
        title: "Saúde",
        description: "Atendimento médico domiciliar de excelência. Check-ups preventivos, exames e consultas completas com cuidado e dedicação.",
        imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=1200&q=80",
        whatsapp: "11977777777"
      }
    ];
  }, [featuredAdsList]);

  useEffect(() => {
    if (adsToRender.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % adsToRender.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [adsToRender]);

  useEffect(() => {
    const token = localStorage.getItem("bp_session_token");
    const savedUser = localStorage.getItem("bp_user_profile");
    if (token && savedUser) {
      try {
        setUserProfile(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    async function loadFeaturedAds() {
      try {
        const res = await fetch("/api/trpc/featuredAds.list");
        if (res.ok) {
          const json = await res.json();
          if (json.result && json.result.data) {
            const activeAds = json.result.data.filter((ad: any) => ad.isFeatured !== false);
            setFeaturedAdsList(activeAds);
          }
        }
      } catch (e) {
        console.error("Failed to load featured ads:", e);
      } finally {
        setIsLoadingFeaturedAds(false);
      }
    }
    loadFeaturedAds();
  }, []);

  // Nearby Providers and Leaflet Map States
  const [nearbyProviders, setNearbyProviders] = useState<any[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(true);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Map Search and filtering states
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapCategoryFilter, setMapCategoryFilter] = useState("all");

  // Use refs for Leaflet instances - prevents React re-renders from destroying Leaflet's state
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const mapInitializedRef = useRef(false);

  // Memoize so the array reference is stable — avoids re-triggering marker-creation effect on every render
  const filteredNearbyProviders = useMemo(() => nearbyProviders.filter((p) => {
    if (mapCategoryFilter !== "all") {
      const isComercio = p.businessType === "comercio" || p.categoryId === "comercios"
        || p.category?.toLowerCase() === "comércios" || p.category?.toLowerCase() === "comércio";
      if (mapCategoryFilter === "comercio" && !isComercio) return false;
      if (mapCategoryFilter === "servico" && isComercio) return false;
    }
    if (mapSearchQuery.trim()) {
      const q = mapSearchQuery.toLowerCase();
      if (
        !p.name?.toLowerCase().includes(q) &&
        !p.description?.toLowerCase().includes(q) &&
        !p.category?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  }), [nearbyProviders, mapCategoryFilter, mapSearchQuery]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Load nearby providers on mount with geolocation fallback
  useEffect(() => {
    async function loadNearby() {
      setIsLoadingNearby(true);
      try {
        let coords = { latitude: -22.9527, longitude: -46.5419 };

        // Try browser GPS first
        if (navigator.geolocation) {
          try {
            const pos = await new Promise<any>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 })
            );
            coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          } catch (_) {
            // silently fall through to default
          }
        }

        const input = { sortBy: "distance", profileType: "all", userLatitude: coords.latitude, userLongitude: coords.longitude };
        const url = `/api/trpc/providers.searchFiltered?input=${encodeURIComponent(JSON.stringify(input))}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.result?.data) setNearbyProviders(json.result.data);
        }
      } catch (e) {
        console.error("Failed to load nearby providers:", e);
      } finally {
        setIsLoadingNearby(false);
      }
    }
    loadNearby();
  }, []);

  const DEFAULT_MASCOT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/mascote-parrot-WdeTpQk76sVEPj2emyYAPr.webp";

  // Helper: build marker icon HTML
  const buildIcon = useCallback((L: any, photoUrl: string, isSelected: boolean) => {
    const border = isSelected
      ? 'border-[#25D366] shadow-[0_0_15px_rgba(37,211,102,0.7)]'
      : 'border-[#84cc16] shadow-[0_0_8px_rgba(132,204,22,0.4)]';
    const sizeClass = isSelected ? 'w-10 h-10' : 'w-8 h-8';
    return L.divIcon({
      html: `<div class="${sizeClass} rounded-full border-2 ${border} overflow-hidden bg-black" style="transition:all 0.2s;"><img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" /></div>`,
      className: "",
      iconSize: isSelected ? [40, 40] : [32, 32],
      iconAnchor: isSelected ? [20, 20] : [16, 16],
      popupAnchor: [0, isSelected ? -22 : -18],
    });
  }, []);

  // Imperative function: select a provider, update icons, pan map, open popup.
  // Called by BOTH the list card click AND the Leaflet marker click handler.
  // No useEffect needed — all operations happen synchronously/imperatively.
  const selectProvider = useCallback((providerId: string) => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map) return;

    setSelectedProviderId(providerId);

    markersRef.current.forEach(m => {
      const mId = (m as any)._xamajaId;
      const mProvider = nearbyProviders.find(pv => pv.id === mId);
      if (!mProvider) return;
      const mPhoto = mProvider.avatarUri || mProvider.coverUri || DEFAULT_MASCOT;
      const isSel = mId === providerId;
      m.setIcon(buildIcon(L, mPhoto, isSel));
      if (isSel) {
        // Pan to marker first, then open popup after animation settles
        map.setView(m.getLatLng(), 14, { animate: true, duration: 0.5 });
        setTimeout(() => {
          try { m.openPopup(); } catch (_) {}
        }, 550);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyProviders, buildIcon]);

  // Create ALL markers once when nearbyProviders loads.
  // Filter changes do NOT recreate markers — they just show/hide them.
  useEffect(() => {
    if (nearbyProviders.length === 0) return;

    const L = (window as any).L;
    if (!L) return;

    // Initialise map on first load
    if (!mapInitializedRef.current) {
      const container = document.getElementById("nearby-map");
      if (!container) return;

      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = null;
        container.innerHTML = "";
      }

      try {
        const map = L.map("nearby-map", { zoomControl: false });
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: "&copy; CartoDB",
          subdomains: "abcd",
          maxZoom: 20,
        }).addTo(map);
        L.control.zoom({ position: "bottomright" }).addTo(map);
        map.setView([-22.9527, -46.5419], 13);
        mapRef.current = map;
        mapInitializedRef.current = true;
        setTimeout(() => map.invalidateSize(), 100);
        setTimeout(() => map.invalidateSize(), 600);
        window.addEventListener("resize", () => map.invalidateSize());
      } catch (err) {
        console.error("Leaflet init error:", err);
        return;
      }
    }

    const map = mapRef.current;
    if (!map) return;

    // Remove previous markers
    markersRef.current.forEach(m => { try { map.removeLayer(m); } catch (_) {} });
    markersRef.current = [];

    const bounds: any[] = [];

    nearbyProviders.forEach((p) => {
      if (!p.latitude || !p.longitude) return;
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      const photo = p.avatarUri || p.coverUri || DEFAULT_MASCOT;
      const coverPhoto = p.coverUri || p.avatarUri || DEFAULT_MASCOT;
      const distanceStr = p.distanceStr || p.neighborhood || p.city || "Região local";

      const marker = L.marker([lat, lng], { icon: buildIcon(L, photo, false) }).addTo(map);

      const popupHtml = `
        <div style="background:#09090b;border:1px solid #27272a;border-radius:14px;padding:10px;max-width:190px;font-family:system-ui,sans-serif;">
          <div style="width:100%;height:72px;border-radius:10px;overflow:hidden;background:#18181b;margin-bottom:8px;border:1px solid #27272a">
            <img src="${coverPhoto}" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <strong style="color:#fff;font-size:11px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</strong>
          <span style="color:#84cc16;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-top:2px;">${p.category || "Parceiro"}</span>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#71717a;margin-top:6px;padding-top:6px;border-top:1px solid #27272a;">
            <span style="color:#eab308;font-weight:700;">&#9733; ${Number(p.rating || 5).toFixed(1)}</span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;">&#128205; ${distanceStr}</span>
          </div>
          <a href="/perfil/${p.id}" style="display:block;text-align:center;background:#84cc16;color:#000;font-weight:800;font-size:10px;padding:6px;border-radius:8px;margin-top:8px;text-decoration:none;">Ver Perfil</a>
        </div>
      `;
      marker.bindPopup(popupHtml, { maxWidth: 200, className: "xamaja-popup" });

      // Leaflet marker click: same selectProvider flow
      marker.on("click", () => {
        // Scroll matching list card into view
        const card = document.getElementById(`provider-card-${p.id}`);
        if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        // Update icons + open popup
        selectProvider(p.id);
      });

      (marker as any)._xamajaId = p.id;
      markersRef.current.push(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyProviders, buildIcon]);

  // When the search/filter changes, just show or hide markers — no recreation
  useEffect(() => {
    if (markersRef.current.length === 0) return;
    const filteredIds = new Set(filteredNearbyProviders.map(p => p.id));
    const map = mapRef.current;
    if (!map) return;

    const bounds: any[] = [];
    markersRef.current.forEach(m => {
      const mId = (m as any)._xamajaId;
      if (filteredIds.has(mId)) {
        if (!map.hasLayer(m)) map.addLayer(m);
        const pos = m.getLatLng();
        bounds.push([pos.lat, pos.lng]);
      } else {
        if (map.hasLayer(m)) map.removeLayer(m);
      }
    });
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredNearbyProviders]);

  // Rotating words for the hero title
  const rotatingWords = ["comércios", "eletricistas", "pizzarias", "encanadores", "salões", "mecânicos", "reformas"];
  const [currentWordIdx, setCurrentWordIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIdx(prev => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

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
            <button
              onClick={() =>
                document
                  .getElementById("cadastro")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              className="text-muted-foreground hover:text-white transition"
            >
              Anunciar meu negócio
            </button>
            <a
              href="/indique-e-ganhe"
              className="text-muted-foreground hover:text-white transition"
            >
              Indique e ganhe
            </a>
            {userProfile ? (
              <Button
                onClick={() => (window.location.href = "/parceiro")}
                className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl px-5 h-10 text-xs transition"
              >
                Olá, {userProfile.name?.split(" ")[0] || "Minha Conta"}
              </Button>
            ) : (
              <>
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
              </>
            )}
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
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  document
                    .getElementById("cadastro")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="text-muted-foreground hover:text-white py-2 text-base font-semibold border-b border-zinc-900 text-left"
              >
                Anunciar meu negócio
              </button>
              <a
                href="/indique-e-ganhe"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-white py-2 text-base font-semibold border-b border-zinc-900"
              >
                Indique e ganhe
              </a>
            </nav>
            <div className="flex flex-col gap-3 pt-2">
              {userProfile ? (
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.href = "/parceiro";
                  }}
                  className="w-full text-center bg-primary text-primary-foreground hover:bg-primary/95 font-bold rounded-xl py-3 text-sm transition"
                >
                  Olá, {userProfile.name || "Minha Conta"}
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.href = "/parceiro";
                    }}
                    className="w-full text-center text-white hover:bg-zinc-900 border border-zinc-800 rounded-xl py-3 text-sm font-semibold"
                  >
                    Entrar
                  </Button>
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.href = "/parceiro";
                    }}
                    className="w-full text-center bg-primary text-primary-foreground hover:bg-primary/95 font-bold rounded-xl py-3 text-sm transition"
                  >
                    Criar Conta
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <section className="relative py-12 md:py-16 overflow-hidden border-b border-zinc-900 bg-[#070708]">
        <div className="container mx-auto px-4 relative z-10">
          {/* Stacked on mobile, side-by-side grid on desktop/tablets */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-10 items-center">
            {/* Left Content */}
            <div className="space-y-6 relative w-full">
              {/* Mobile Ambient Glow behind Left Content */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0 lg:hidden"></div>

              {/* Location Pin & Mobile Mascot wrapper */}
              <div className="flex items-center justify-between gap-4 select-none relative z-10">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Sua localização:</span>
                  <span className="text-primary font-bold underline cursor-pointer hover:text-primary/80 transition">
                    {searchLocation} ▾
                  </span>
                </div>
                {/* Mobile Mascot: shows a small cute mascot avatar floating in the upper corner */}
                <div className="lg:hidden flex-shrink-0 relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-glow-pulse"></div>
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/YfEX4Z3YNEgNHNWGECNatQ/mascote-parrot-WdeTpQk76sVEPj2emyYAPr.webp"
                    alt="Xará"
                    className="w-10 h-10 object-contain relative z-10 drop-shadow-md animate-float-slow"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white font-sans">
                  Encontre os melhores
                  <br />
                  <span className="inline-block text-primary transition-all duration-500 ease-out transform translate-y-0 opacity-100 min-w-[280px]">
                    {rotatingWords[currentWordIdx]}
                  </span>
                  <br />
                  <span className="text-zinc-400">perto de você.</span>
                </h1>

                <p className="text-sm md:text-base text-zinc-400 max-w-lg leading-relaxed">
                  Busque comércios e prestadores de serviço na sua região de forma simples e rápida.
                </p>
              </div>

              {/* Integrated Search Bar (Airbnb / Google Maps Inspired) */}
              <div className="bg-[#0c0c0e] border border-zinc-800 p-2 rounded-2xl flex flex-col md:flex-row items-center gap-2 shadow-2xl w-full max-w-4xl transition-all duration-300 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
                {/* Input 1: O que você procura */}
                <div className="flex-1 flex items-center px-4 gap-3 w-full group">
                  <Search className="text-zinc-500 group-focus-within:text-primary h-5 w-5 flex-shrink-0 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        handleSearchSubmit();
                      }
                    }}
                    className="bg-transparent border-none focus:outline-none focus:ring-0 text-white w-full text-xs sm:text-sm py-3 placeholder:text-zinc-650"
                    placeholder="O que você procura? Ex: pizzaria, eletricista..."
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Divider */}
                <div className="hidden md:block h-8 w-px bg-zinc-800"></div>

                {/* Input 2: Cidade, bairro ou CEP */}
                <div className="flex-1 flex items-center px-4 gap-3 w-full group">
                  <MapPin className="text-zinc-500 group-focus-within:text-primary h-5 w-5 flex-shrink-0 transition-colors" />
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={e => setSearchLocation(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        handleSearchSubmit();
                      }
                    }}
                    className="bg-transparent border-none focus:outline-none focus:ring-0 text-white w-full text-xs sm:text-sm py-3 placeholder:text-zinc-650"
                    placeholder="Cidade, bairro ou CEP"
                  />
                  {searchLocation && (
                    <button
                      type="button"
                      onClick={() => setSearchLocation("")}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearchSubmit}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-black px-8 py-3.5 h-10 sm:h-12 rounded-xl transition shadow-lg shadow-primary/10 w-full md:w-auto text-xs sm:text-sm"
                >
                  Buscar
                </Button>
              </div>

              {/* Quick Tags */}
              <div className="hidden sm:flex flex-wrap gap-2 text-xs items-center pt-2">
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
            <div className="flex justify-center relative w-full h-[320px] md:h-[450px] lg:h-[580px] items-center">
              {/* Animated glowing background blobs */}
              <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-glow-pulse pointer-events-none z-0"></div>
              <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] animate-glow-pulse pointer-events-none z-0" style={{ animationDelay: "2s" }}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#84cc16]/15 rounded-full blur-[90px] animate-glow-pulse pointer-events-none z-0" style={{ animationDelay: "4s" }}></div>

              {/* Big 3D Glowing Green X (Mockup image) */}
              <div className="relative z-10 w-full h-full max-w-[340px] md:max-w-[440px] lg:max-w-[500px] flex items-center justify-center animate-float-slow">
                <img
                  src="/assets/images/hero_mockup_right.png"
                  alt="XamaJá App Ecosystem"
                  className="w-full h-full object-contain drop-shadow-[0_0_60px_rgba(132,204,22,0.3)]"
                />

                {/* Floating Widget 1: X marca o local */}
                <div className="absolute -top-4 right-4 z-20 bg-zinc-950/90 border border-zinc-800/80 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md select-none animate-float-reverse max-w-[170px]">
                  <span className="text-primary font-black text-xs block mb-1">X marca o local</span>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Conectando você aos melhores negócios da sua região.
                  </p>
                </div>

                {/* Floating Widget 2: 100% Seguro */}
                <div className="absolute bottom-10 -left-6 z-20 bg-zinc-950/95 border border-zinc-800/85 p-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md select-none animate-float-slow flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <ShieldCheck className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <span className="text-white font-extrabold text-[11px] block">100% Seguro</span>
                    <span className="text-zinc-500 text-[9px] block">Sem intermediários</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HIGH-CONVERSION SPONSORED BANNER SHOWCASE (DESTAQUES PRIME) ── */}
      <section className="bg-[#050505] border-b border-zinc-900/60 py-12 relative overflow-hidden select-none">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[90px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                  Patrocinado
                </span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white font-sans tracking-tight">Destaques em Evidência</h2>
              <p className="text-zinc-500 text-xs font-semibold">Os comércios e prestadores mais requisitados do XamaJá</p>
            </div>
            
            {/* Scroll navigation helper indicators */}
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
              <span>Arraste para o lado para ver mais</span>
              <ArrowRight className="w-3.5 h-3.5 animate-slide-hint" />
            </div>
          </div>

          {/* Banner Slider Container */}
          <div className="relative overflow-hidden w-full rounded-2xl border border-zinc-900 bg-zinc-950">
            <div 
              className="flex transition-transform duration-500 ease-in-out w-full"
              style={{ transform: `translateX(-${currentAdIndex * 100}%)` }}
            >
              {isLoadingFeaturedAds ? (
                <div className="w-full min-w-[100%] h-[160px] md:h-[250px] bg-zinc-950/60 border border-zinc-900 rounded-2xl animate-pulse"></div>
              ) : adsToRender.map((p) => {
                const linkUrl = p.id.startsWith("mock-ad") ? "/busca" : `/perfil/${p.providerId || ""}`;
                const isMock = p.id.startsWith("mock-ad");
                const cleanPhone = p.whatsapp;
                const waMessage = encodeURIComponent(`Olá ${p.providerName}, vi seu destaque no XamaJá e gostaria de realizar um pedido/combinar serviço.`);

                return (
                  <div
                    key={p.id}
                    className="w-full min-w-[100%] aspect-[16/6] md:aspect-[21/7] min-h-[160px] md:min-h-[250px] overflow-hidden bg-zinc-950 relative snap-start group shadow-2xl transition duration-500"
                  >
                    {/* Background visual cover image */}
                    <img
                      src={p.imageUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80"}
                      alt={p.providerName}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition duration-700 pointer-events-none"
                    />

                    {/* Dark gradient overlay layers for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-10 pointer-events-none"></div>

                    {/* Top right sponsored label */}
                    <div className="absolute top-4 right-4 z-20">
                      <span className="text-[9px] font-black tracking-widest bg-yellow-500 text-black border border-yellow-500 px-2.5 py-0.5 rounded-md uppercase shadow-lg">
                        Patrocinado
                      </span>
                    </div>

                    {/* Banner Overlay Content */}
                    <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 z-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        {/* Circle logo */}
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-3 border-zinc-950 bg-black overflow-hidden flex-shrink-0 shadow-2xl">
                          <img
                            src={p.imageUrl || "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=100&q=80"}
                            alt={p.providerName}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Title block */}
                        <div className="space-y-1 min-w-0">
                          <span className="inline-block text-[8px] font-black text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                            {p.title || "Destaque"}
                          </span>
                          
                          <h3 className="text-base md:text-2xl font-black text-white leading-none truncate drop-shadow-md">
                            {p.providerName}
                          </h3>

                          <p className="text-zinc-300 text-[10px] md:text-xs line-clamp-1 max-w-lg font-medium leading-relaxed drop-shadow-md">
                            {p.description || "Comércio ou prestador de serviço de alto destaque da região."}
                          </p>

                          <div className="flex items-center gap-2 text-zinc-400 text-[10px] md:text-xs">
                            <span className="flex items-center gap-0.5 text-yellow-500 font-bold">
                              ★ <span className="text-white">5.0</span>
                            </span>
                            <span>•</span>
                            <span className="truncate">Região local</span>
                          </div>
                        </div>
                      </div>

                      {/* Call-to-action buttons */}
                      <div className="flex gap-2 flex-shrink-0 w-full md:w-auto">
                        <Button
                          onClick={() => window.location.href = linkUrl}
                          className="flex-1 md:flex-initial bg-white hover:bg-zinc-200 text-black font-black text-[10px] md:text-xs px-4 h-9 rounded-lg transition-all shadow-xl"
                        >
                          Ver Detalhes
                        </Button>
                        {isMock && cleanPhone && (
                          <Button
                            onClick={() => window.open(`https://wa.me/55${cleanPhone}?text=${waMessage}`, "_blank")}
                            className="flex-1 md:flex-initial bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-[10px] md:text-xs px-4 h-9 rounded-lg transition-all shadow-xl flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>WhatsApp</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons and indicators */}
            {adsToRender.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentAdIndex((prev) => (prev - 1 + adsToRender.length) % adsToRender.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full hidden md:flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentAdIndex((prev) => (prev + 1) % adsToRender.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full hidden md:flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                  {adsToRender.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentAdIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${currentAdIndex === idx ? 'bg-primary w-4' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Categories Modern Cards Grid */}
      <section className="bg-black py-10 border-b border-zinc-900 select-none">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 space-y-1">
            <h3 className="text-lg font-extrabold text-white">Navegue por Categoria</h3>
            <p className="text-zinc-500 text-xs">Encontre comércios ou prestadores de serviço por especialidade</p>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-5 lg:grid-cols-10 md:pb-0 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
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
                  className={`group flex flex-col items-center justify-center gap-3 h-28 w-24 md:w-auto flex-shrink-0 md:flex-shrink rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                    isActive 
                      ? "bg-zinc-950 border-2 border-primary text-primary shadow-[0_10px_20px_rgba(132,204,22,0.15)]" 
                      : "bg-[#0c0c0e] border border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800 hover:shadow-2xl hover:shadow-primary/5"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl transition duration-300 ${
                    isActive ? "bg-primary/10" : "bg-zinc-900/60 group-hover:bg-primary/10 group-hover:text-primary"
                  }`}>
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  <span className="text-[11px] font-bold tracking-wide">{cat.name}</span>
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
                const isPremium = p.benefitKeys?.includes("premium_badge") || p.benefitKeys?.includes("featured_search");
                const statusLabel = p.onlineStatus === true ? "Aberto agora" : "Fechado";
                const linkUrl = `/perfil/${p.id}`;
                const isFav = !!favorites[p.id];

                return (
                  <div 
                    key={p.id}
                    onClick={() => window.location.href = linkUrl}
                    className="min-w-[290px] md:min-w-[330px] bg-zinc-950/60 border border-zinc-900 rounded-3xl overflow-hidden hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300 snap-start shadow-xl hover:shadow-primary/5 flex flex-col justify-between group cursor-pointer"
                  >
                    {/* Image & Badge overlay */}
                    <div className="relative h-44 w-full overflow-hidden border-b border-zinc-900/60">
                      <img 
                        src={coverImage} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Left Badges Overlay */}
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                        {isPremium && (
                          <span className="text-[9px] font-black tracking-widest bg-yellow-500 text-black px-2.5 py-0.5 rounded-md shadow-md uppercase">
                            Patrocinado
                          </span>
                        )}
                        <span className={`text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-md shadow-md uppercase border ${
                          isVerified 
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "bg-black/80 border-zinc-800 text-primary"
                        }`}>
                          {isVerified ? "Verificado" : "Parceiro"}
                        </span>
                      </div>

                      {/* Favorite toggle */}
                      <button 
                        onClick={(e) => toggleFavorite(p.id, e)}
                        className="absolute top-4 right-4 p-2 bg-black/75 border border-zinc-800/80 rounded-full hover:bg-zinc-900 transition-all shadow-md active:scale-90"
                      >
                        <Heart className={`h-4 w-4 transition-colors duration-200 ${isFav ? 'text-red-500 fill-current' : 'text-white hover:text-red-500'}`} />
                      </button>
                    </div>

                    {/* Content details */}
                    <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-extrabold text-base text-white group-hover:text-primary transition-colors truncate max-w-[190px]">
                            {p.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold flex-shrink-0">
                            <span>★</span>
                            <span className="text-white">{Number(p.rating || 5.0).toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                          <span className="font-bold text-zinc-500">{p.category || "Serviço"}</span>
                          <span>•</span>
                          <span className="truncate">{p.distanceStr || p.neighborhood || "Região local"}</span>
                        </div>
                      </div>

                      {/* Footer status line */}
                      <div className="flex justify-between items-center pt-3 border-t border-zinc-900/60 mt-auto">
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${p.onlineStatus === true ? "text-emerald-500" : "text-zinc-500"}`}>
                          <span className={`w-2 h-2 rounded-full ${p.onlineStatus === true ? "bg-emerald-500 animate-pulse" : "bg-zinc-650"}`}></span>
                          <span>{statusLabel}</span>
                        </div>
                        
                        <Button 
                          onClick={() => window.location.href = linkUrl}
                          className="bg-zinc-900 hover:bg-primary border border-zinc-850 hover:border-primary text-zinc-300 hover:text-primary-foreground font-extrabold text-[10px] rounded-xl px-4 py-1.5 h-8 transition-all"
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

      {/* ── MAP INTEGRATED SECTION (PROFISSIONAIS PRÓXIMOS) ── */}
      <section className="py-16 bg-[#030303] border-b border-zinc-900">
        <div className="container mx-auto px-4">
          <style>{`
            .leaflet-popup-content-wrapper {
              background: #09090b !important;
              color: #ffffff !important;
              border: 1px solid #27272a !important;
              border-radius: 12px !important;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6) !important;
              padding: 0 !important;
            }
            .leaflet-popup-content {
              margin: 0 !important;
              padding: 0 !important;
            }
            .leaflet-popup-tip {
              background: #09090b !important;
              border: 1px solid #27272a !important;
              box-shadow: none !important;
            }
            .leaflet-container a.leaflet-popup-close-button {
              color: #a1a1aa !important;
              font-weight: bold !important;
              padding: 6px 6px 0 0 !important;
            }
            .leaflet-container a.leaflet-popup-close-button:hover {
              color: #ffffff !important;
              background: transparent !important;
            }
          `}</style>

          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-primary h-6 w-6" />
                  <h2 className="text-2xl md:text-3xl font-black text-white font-sans tracking-tight">
                    Profissionais próximos de você
                  </h2>
                </div>
                <p className="text-zinc-500 text-xs mt-1 font-semibold">
                  Explore prestadores e comércios no mapa com visualização em tempo real
                </p>
              </div>
            </div>
          </div>

          {/* Local Search & Category Filters above split layout */}
          <div className="mb-8 grid md:grid-cols-3 gap-4 bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl relative z-20">
            <div className="md:col-span-2 relative">
              <span className="absolute left-4 top-3.5 text-zinc-500 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nome, especialidade ou descrição..."
                value={mapSearchQuery}
                onChange={(e) => setMapSearchQuery(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <select
                value={mapCategoryFilter}
                onChange={(e) => setMapCategoryFilter(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="all">Todas as categorias</option>
                <option value="comercio">Apenas Comércios</option>
                <option value="servico">Apenas Serviços</option>
              </select>
            </div>
          </div>

          {/* Persistent side-by-side grid on both mobile and desktop */}
          <div className="grid grid-cols-[1.2fr_0.8fr] md:grid-cols-5 gap-4 md:gap-8 items-start">
            {/* Left Side: Partners List */}
            <div className="md:col-span-3 space-y-4 max-h-[380px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar no-scrollbar relative z-10">
              {isLoadingNearby ? (
                // Skeletons
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-28 bg-zinc-950 border border-zinc-900 rounded-2xl animate-pulse" />
                ))
              ) : filteredNearbyProviders.length === 0 ? (
                <div className="text-zinc-500 text-xs sm:text-sm text-center py-12 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
                  Nenhum profissional encontrado com os filtros aplicados.
                </div>
              ) : (
                filteredNearbyProviders.map((p) => {
                  const isSelected = p.id === selectedProviderId;
                  const isFav = !!favorites[p.id];
                  const isPremium = p.benefitKeys?.includes("premium_badge") || p.benefitKeys?.includes("featured_search");
                  const statusLabel = p.onlineStatus === true ? "Aberto agora" : "Fechado";

                  return (
                    <div
                      key={p.id}
                      id={`provider-card-${p.id}`}
                      onClick={() => selectProvider(p.id)}
                      className={`flex flex-col sm:flex-row gap-3 bg-zinc-950/70 border p-3 rounded-2xl transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? "border-primary bg-zinc-900/40 shadow-[0_0_20px_rgba(132,204,22,0.1)]" 
                          : "border-zinc-900 hover:border-zinc-800"
                      }`}
                    >
                      {/* Left side cover img */}
                      <div className="relative w-full sm:w-24 h-20 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-900">
                        <img src={p.coverUri || p.avatarUri || "https://images.unsplash.com/photo-1521791136368-1a868270f63b?w=200&q=80"} alt={p.name} className="w-full h-full object-cover" />
                        
                        <button 
                          onClick={(e) => toggleFavorite(p.id, e)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full hover:bg-zinc-900 transition shadow"
                        >
                          <Heart className={`h-3 w-3 ${isFav ? 'text-red-500 fill-current' : 'text-white'}`} />
                        </button>
                      </div>

                      {/* Info details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-extrabold text-[11px] sm:text-sm text-white truncate">{p.name}</h4>
                            <span className="text-yellow-500 text-[9px] sm:text-[11px] font-bold flex-shrink-0 flex items-center gap-0.5">
                              ★ {Number(p.rating || 5.0).toFixed(1)}
                            </span>
                          </div>
                          <span className="text-[8px] sm:text-[10px] font-black text-primary uppercase block mt-0.5">{p.category || 'Parceiro'}</span>
                          
                          <p className="text-zinc-500 text-[10px] sm:text-[11px] line-clamp-1 mt-1 leading-relaxed">
                            {p.description || "Prestador qualificado disponível."}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-900/60">
                          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-zinc-400">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span className="truncate">{p.distanceStr || p.neighborhood || p.city}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] sm:text-[10px] font-bold ${p.onlineStatus === true ? 'text-emerald-500' : 'text-zinc-500'}`}>
                              ● {statusLabel}
                            </span>
                            <a
                              href={`/perfil/${p.id}`}
                              className="text-[9px] sm:text-[10px] font-extrabold text-[#84cc16] hover:underline"
                            >
                              Perfil
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Side: OpenStreetMap Container (40% width) */}
            <div className="md:col-span-2 h-[380px] sm:h-[500px] md:h-[600px] w-full rounded-3xl overflow-hidden border border-zinc-900 bg-zinc-950 relative z-10 sticky top-24">
              <div id="nearby-map" className="w-full h-full animate-fade-in"></div>
            </div>
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
                  <button
                    onClick={() =>
                      document
                        .getElementById("cadastro")
                        ?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                    className="text-primary hover:text-primary/80 transition font-semibold text-left"
                  >
                    Anunciar meu negócio ✦
                  </button>
                </li>
                <li>
                  <a
                    href="/indique-e-ganhe"
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
