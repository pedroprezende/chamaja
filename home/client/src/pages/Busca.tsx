import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  MapPin,
  Heart,
  Phone,
  Compass,
  Sparkles,
  Menu,
  X,
  SlidersHorizontal,
  ChevronDown,
  Search,
  Star,
  Map as MapIcon,
  List as ListIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Busca() {
  // Navigation & UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileShowMap, setMobileShowMap] = useState(false);

  // Search & Filters States
  const [providersList, setProvidersList] = useState<any[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [profileType, setProfileType] = useState<"all" | "professional" | "comercio">("all");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [currentLocationText, setCurrentLocationText] = useState("Bragança Paulista - SP");
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [favoritesList, setFavoritesList] = useState<string[]>([]);

  // Leaflet Map States
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markersList, setMarkersList] = useState<any[]>([]);
  const mapRef = useRef<any>(null);

  const displayCategories = [
    { id: "todos", name: "TODAS", icon: "🌐" },
    { id: "reformas-reparos", name: "REFORMAS", icon: "🔧" },
    { id: "comercios", name: "ALIMENTAÇÃO", icon: "🍔" },
    { id: "beleza-estetica", name: "BELEZA", icon: "💇" },
    { id: "automotivo", name: "AUTOMOTIVO", icon: "🚗" },
    { id: "servicos-domesticos", name: "CASA", icon: "🏠" },
    { id: "assistencia-tecnica", name: "TECNOLOGIA", icon: "💻" },
    { id: "pets", name: "PETS", icon: "🐾" },
    { id: "saude", name: "SAÚDE", icon: "🏥" },
    { id: "academias", name: "ACADEMIAS", icon: "🏋️" },
  ];

  // Load favorites, request geolocation, and load leaflet
  useEffect(() => {
    console.log("[Audit Busca] Componente Busca montado. Iniciando ciclo de vida do mapa.");

    // Load Local Favorites
    const favs = localStorage.getItem("xamaja_favs");
    if (favs) {
      try {
        setFavoritesList(JSON.parse(favs));
      } catch (e) {
        console.error("Error parsing favorites:", e);
      }
    }

    // Parse URL search parameters
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get("q") || "";
    const initialCategory = params.get("category") || "todos";
    const initialLoc = params.get("location") || "";

    if (initialQ) setSearchTerm(initialQ);
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialLoc) {
      setLocationTerm(initialLoc);
      setCurrentLocationText(initialLoc);
    }

    // Tentar inicializar o mapa imediatamente
    initializeMap();

    // Polling robusto para garantir a inicialização caso o Leaflet (window.L) ou o DOM demorem para carregar
    let retryCount = 0;
    const interval = setInterval(() => {
      const L = (window as any).L;
      const container = document.getElementById("busca-map");
      
      if (mapRef.current) {
        console.log("[Audit Busca] Polling cancelado: mapa já está ativo e instanciado.");
        clearInterval(interval);
        return;
      }

      if (L && container) {
        console.log("[Audit Busca] Leaflet e container detectados via polling, inicializando...");
        initializeMap();
        clearInterval(interval);
      } else {
        retryCount++;
        console.log(`[Audit Busca] Polling de inicialização: tentativa ${retryCount}... Leaflet=${!!L}, Container=${!!container}`);
        if (retryCount > 15) { // Desistir após 15 segundos
          console.error("[Audit Busca] Polling finalizado sem sucesso: Leaflet ou container não carregaram.");
          clearInterval(interval);
        }
      }
    }, 1000);

    const defaultCoords = { latitude: -22.9527, longitude: -46.5419 };

    // Request Browser Location or geocode searched location
    if (initialLoc) {
      const geocodeAndFetch = async () => {
        let coords: { latitude: number; longitude: number } | null = null;
        const cepRegex = /^\d{5}-?\d{3}$/;
        if (cepRegex.test(initialLoc)) {
          const cleanCep = initialLoc.replace("-", "");
          try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            if (res.ok) {
              const data = await res.json();
              if (!data.erro) {
                const fullLocText = `${data.localidade} - ${data.uf}`;
                setCurrentLocationText(fullLocText);
                const geoRes = await fetch(
                  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${data.localidade}, ${data.uf}, Brasil`)}&format=json&limit=1`,
                  { headers: { "User-Agent": "XamaJa-LocalSearch" } }
                );
                if (geoRes.ok) {
                  const geoData = await geoRes.json();
                  if (geoData.length > 0) {
                    coords = {
                      latitude: parseFloat(geoData[0].lat),
                      longitude: parseFloat(geoData[0].lon),
                    };
                    setUserCoords(coords);
                  }
                }
              }
            }
          } catch (err) {
            console.error("ViaCEP CEP lookup error:", err);
          }
        } else {
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${initialLoc}, Brasil`)}&format=json&limit=1`,
              { headers: { "User-Agent": "XamaJa-LocalSearch" } }
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData.length > 0) {
                coords = {
                  latitude: parseFloat(geoData[0].lat),
                  longitude: parseFloat(geoData[0].lon),
                };
                setUserCoords(coords);
              }
            }
          } catch (err) {
            console.error("Nominatim geocoding error:", err);
          }
        }
        fetchProviders(initialQ, initialCategory, profileType, coords || defaultCoords);
      };
      geocodeAndFetch();
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log("[Audit Busca] Localização obtida via Geolocalização do navegador:", coords);
          setUserCoords(coords);

          // Reverse geocode to display the current city name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
              { headers: { "User-Agent": "XamaJa-LocalSearch" } }
            );
            if (response.ok) {
              const data = await response.json();
              if (data.address) {
                const city = data.address.city || data.address.town || data.address.suburb || "Sua região";
                const state = data.address.state ? data.address.state.substring(0, 2).toUpperCase() : "SP";
                setCurrentLocationText(`${city} - ${state}`);
              }
            }
          } catch (e) {
            console.warn("Failed reverse geocoding:", e);
          }

          // Initial load sorted by proximity
          fetchProviders(initialQ, initialCategory, profileType, coords);
        },
        (error) => {
          console.log("[Audit Busca] Geolocalização falhou/negada. Usando padrão Bragança Paulista - SP:", error.message);
          fetchProviders(initialQ, initialCategory, profileType, defaultCoords);
        }
      );
    } else {
      console.log("[Audit Busca] Geolocalização não suportada pelo navegador. Usando padrão Bragança Paulista - SP.");
      fetchProviders(initialQ, initialCategory, profileType, defaultCoords);
    }

    return () => {
      console.log("[Audit Busca] Desmontando componente Busca. Removendo mapa e limpando listeners.");
      clearInterval(interval);
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          console.log("[Audit Busca] Instância do mapa removida com sucesso");
        } catch (e) {
          console.warn("[Audit Busca] Erro ao remover a instância do Leaflet:", e);
        }
        mapRef.current = null;
      }
    };
  }, []);

  // Fetch Providers list from DB or Fallbacks
  const fetchProviders = async (
    queryVal = "",
    categoryVal = "todos",
    typeVal: "all" | "professional" | "comercio" = "all",
    coords: { latitude: number; longitude: number } | null = null
  ) => {
    setIsLoadingProviders(true);
    try {
      const input: any = {
        sortBy: "relevance",
        profileType: typeVal,
      };

      if (queryVal && queryVal.trim()) {
        input.query = queryVal.trim();
      }

      if (categoryVal && categoryVal !== "todos") {
        input.categoryId = categoryVal;
      }

      if (coords) {
        input.userLatitude = coords.latitude;
        input.userLongitude = coords.longitude;
        input.maxDistanceKm = 50;
        input.sortBy = "distance";
      }

      const url = `/api/trpc/providers.searchFiltered?input=${encodeURIComponent(JSON.stringify(input))}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.result && json.result.data) {
          if (json.result.data.length > 0 || queryVal || categoryVal !== "todos" || coords || typeVal !== "all") {
            setProvidersList(json.result.data);
            setIsLoadingProviders(false);
            return;
          }
        }
      }
    } catch (e) {
      console.error("Failed fetching providers via tRPC:", e);
    }

    // Mock Fallback Data (matching DB seeds)
    const fallbackMocks = [
      {
        id: "mock-1",
        name: "X Burger",
        category: "Hamburgeria",
        categoryId: "comercios",
        city: "Bragança Paulista",
        state: "SP",
        rating: 4.8,
        ratingCount: 124,
        coverUri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
        avatarUri: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=100&q=80",
        isVerified: true,
        onlineStatus: true,
        phone: "(11) 97120-1234",
        plan: "premium",
        businessType: "comercio",
        latitude: -22.9519,
        longitude: -46.5419,
      },
      {
        id: "mock-2",
        name: "Auto Prime",
        category: "Oficina Mecânica",
        categoryId: "automotivo",
        city: "Bragança Paulista",
        state: "SP",
        rating: 4.9,
        ratingCount: 98,
        coverUri: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&q=80",
        avatarUri: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=100&q=80",
        isVerified: false,
        onlineStatus: true,
        phone: "(11) 97120-5678",
        plan: "premium",
        businessType: "servicos",
        latitude: -22.9620,
        longitude: -46.5310,
      },
      {
        id: "mock-3",
        name: "Linda's Beauty",
        category: "Salão de Beleza",
        categoryId: "beleza-estetica",
        city: "Bragança Paulista",
        state: "SP",
        rating: 4.7,
        ratingCount: 156,
        coverUri: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80",
        avatarUri: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=100&q=80",
        isVerified: false,
        onlineStatus: true,
        phone: "(11) 97120-9999",
        plan: "premium",
        businessType: "servicos",
        latitude: -22.9420,
        longitude: -46.5510,
      },
      {
        id: "mock-4",
        name: "Pizzaria do X",
        category: "Pizzaria",
        categoryId: "comercios",
        city: "Bragança Paulista",
        state: "SP",
        rating: 4.6,
        ratingCount: 87,
        coverUri: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
        avatarUri: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?w=100&q=80",
        isVerified: true,
        onlineStatus: true,
        phone: "(11) 97120-1111",
        plan: "standard",
        businessType: "comercio",
        latitude: -22.9560,
        longitude: -46.5460,
      },
      {
        id: "mock-5",
        name: "Hidro X",
        category: "Encanador",
        categoryId: "reformas-reparos",
        city: "Bragança Paulista",
        state: "SP",
        rating: 5.0,
        ratingCount: 63,
        coverUri: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
        avatarUri: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=100&q=80",
        isVerified: false,
        onlineStatus: true,
        phone: "(11) 97120-2222",
        plan: "premium",
        businessType: "servicos",
        latitude: -22.9480,
        longitude: -46.5380,
      },
    ];

    let filtered = fallbackMocks;
    if (queryVal && queryVal.trim()) {
      const lower = queryVal.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.category.toLowerCase().includes(lower) ||
          p.city.toLowerCase().includes(lower)
      );
    }
    if (categoryVal && categoryVal !== "todos") {
      filtered = filtered.filter((p) => p.categoryId === categoryVal);
    }
    if (typeVal === "comercio") {
      filtered = filtered.filter((p) => p.businessType === "comercio");
    } else if (typeVal === "professional") {
      filtered = filtered.filter((p) => p.businessType === "servicos");
    }

    setProvidersList(filtered);
    setIsLoadingProviders(false);
  };

  // Map Initialization
  const initializeMap = () => {
    console.log("[Audit Busca] Iniciando initializeMap...");
    const L = (window as any).L;
    if (!L) {
      console.warn("[Audit Busca] Leaflet (window.L) ainda não está carregado no objeto global window.");
      return;
    }
    console.log("[Audit Busca] Leaflet carregado");

    const mapContainer = document.getElementById("busca-map");
    if (!mapContainer) {
      console.error("[Audit Busca] Div com ID 'busca-map' não foi encontrada no DOM!");
      return;
    }
    console.log("[Audit Busca] Container encontrado");

    // Verificar se a div possui dimensões
    const rect = mapContainer.getBoundingClientRect();
    console.log(`[Audit Busca] Dimensões do container busca-map: largura=${rect.width}px, altura=${rect.height}px`);

    // Reset leaflet_id to prevent "Map container is already initialized" error when React remounts/reuses DOM node
    if ((mapContainer as any)._leaflet_id) {
      console.log("[Audit Busca] Limpando _leaflet_id anterior do container");
      (mapContainer as any)._leaflet_id = null;
    }

    try {
      const centerCoords = userCoords || { latitude: -22.9527, longitude: -46.5419 };
      console.log("[Audit Busca] Instanciando mapa centralizado em:", centerCoords);

      const map = L.map("busca-map", { zoomControl: false }).setView([centerCoords.latitude, centerCoords.longitude], 12);
      
      console.log("[Audit Busca] Adicionando TileLayer do OpenStreetMap (CartoDB DarkMatter)...");
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
      setMapInstance(map);
      console.log("[Audit Busca] Mapa iniciado");
      
      // Instantly trigger size recalculation
      setTimeout(() => {
        console.log("[Audit Busca] Forçando invalidateSize() pós-criação");
        map.invalidateSize();
      }, 100);
    } catch (err: any) {
      console.error("[Audit Busca] Falha crítica na etapa de instanciação/carregamento do mapa no try/catch:", err);
    }
  };

  // Map markers synchronization
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstance) {
      console.log("[Audit Busca] Sincronização de marcadores aguardando Leaflet ou mapInstance estar disponível.");
      return;
    }

    console.log("[Audit Busca] Sincronizando marcadores...");
    // Clear old markers
    markersList.forEach((marker) => marker.remove());
    const newMarkers: any[] = [];
    const bounds: any[] = [];

    const currentCenter = userCoords || { latitude: -22.9527, longitude: -46.5419 };

    try {
      providersList.forEach((p) => {
        let lat = p.latitude;
        let lng = p.longitude;

        if (lat === undefined || lat === null || lng === undefined || lng === null || isNaN(lat) || isNaN(lng)) {
          // Mock offset coordinates in Bragança Paulista for visual correctness
          lat = currentCenter.latitude + (Math.random() - 0.5) * 0.04;
          lng = currentCenter.longitude + (Math.random() - 0.5) * 0.04;
        }

        const iconHtml = `
          <div class="relative w-9 h-9 rounded-full border-2 border-[#84cc16] overflow-hidden shadow-[0_0_10px_rgba(132,204,22,0.4)] bg-black">
            <img src="${p.avatarUri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}" class="w-full h-full object-cover" />
          </div>
        `;
        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-leaflet-marker",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const popupContent = `
          <div class="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 max-w-[200px]" style="font-family: Inter, sans-serif;">
            <strong class="text-white text-sm font-bold block leading-tight">${p.name}</strong>
            <span class="text-[#84cc16] text-[10px] font-black tracking-wider uppercase block">${p.category || 'Profissional'}</span>
            <div class="flex items-center gap-1 text-[#84cc16] text-xs">
              <span>⭐</span>
              <span class="text-white font-bold">${Number(p.rating || 5.0).toFixed(1)}</span>
              <span class="text-zinc-500">(${p.ratingCount || 10})</span>
            </div>
            <span class="text-zinc-400 text-xs block">📍 ${p.city || 'Região local'}</span>
            <a href="/perfil/${p.id}" class="text-center font-bold text-xs text-white bg-[#84cc16] px-3 py-1.5 rounded-lg block mt-2 w-full transition hover:bg-[#84cc16]/90" style="text-decoration: none; color: white;">Ver Perfil</a>
          </div>
        `;

        const marker = L.marker([lat, lng], { icon: customIcon })
          .bindPopup(popupContent)
          .addTo(mapInstance);

        newMarkers.push(marker);
        bounds.push([lat, lng]);
      });

      setMarkersList(newMarkers);
      console.log("[Audit Busca] Marcadores carregados. Total:", newMarkers.length);

      if (bounds.length > 0) {
        mapInstance.fitBounds(bounds, { padding: [55, 55], maxZoom: 15 });
      } else {
        mapInstance.setView([currentCenter.latitude, currentCenter.longitude], 12);
      }
    } catch (markerErr: any) {
      console.error("[Audit Busca] Erro na etapa de sincronização/renderização de marcadores:", markerErr);
    }
  }, [providersList, mapInstance, userCoords]);

  // Recalculate map size whenever toggle or container visibility changes
  useEffect(() => {
    if (mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 200);
    }
  }, [mapInstance, mobileShowMap]);

  // Handle Search Submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    let coords = userCoords;
    let queryLoc = locationTerm.trim();

    if (queryLoc) {
      // Check if it is a CEP
      const cepRegex = /^\d{5}-?\d{3}$/;
      if (cepRegex.test(queryLoc)) {
        const cleanCep = queryLoc.replace("-", "");
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          if (res.ok) {
            const data = await res.json();
            if (!data.erro) {
              const fullLocText = `${data.localidade} - ${data.uf}`;
              setCurrentLocationText(fullLocText);
              // Geocode the city coordinates via OpenStreetMap Nominatim
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${data.localidade}, ${data.uf}, Brasil`)}&format=json&limit=1`,
                { headers: { "User-Agent": "XamaJa-LocalSearch" } }
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.length > 0) {
                  coords = {
                    latitude: parseFloat(geoData[0].lat),
                    longitude: parseFloat(geoData[0].lon),
                  };
                  setUserCoords(coords);
                }
              }
            }
          }
        } catch (err) {
          console.error("ViaCEP CEP lookup error:", err);
        }
      } else {
        // Direct city search geocode
        setCurrentLocationText(queryLoc);
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${queryLoc}, Brasil`)}&format=json&limit=1`,
            { headers: { "User-Agent": "XamaJa-LocalSearch" } }
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.length > 0) {
              coords = {
                latitude: parseFloat(geoData[0].lat),
                longitude: parseFloat(geoData[0].lon),
              };
              setUserCoords(coords);
            }
          }
        } catch (err) {
          console.error("Nominatim geocoding error:", err);
        }
      }
    }

    fetchProviders(searchTerm, selectedCategory, profileType, coords);
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    fetchProviders(searchTerm, catId, profileType, userCoords);
  };

  const handleProfileTypeChange = (type: "all" | "professional" | "comercio") => {
    setProfileType(type);
    fetchProviders(searchTerm, selectedCategory, type, userCoords);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    let updated: string[];
    if (favoritesList.includes(id)) {
      updated = favoritesList.filter((favId) => favId !== id);
    } else {
      updated = [...favoritesList, id];
    }
    setFavoritesList(updated);
    localStorage.setItem("xamaja_favs", JSON.stringify(updated));
  };

  const handleContactWhatsApp = (provider: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const cleanPhone = (provider.whatsapp || provider.phone || "").replace(/\D/g, "");
    if (!cleanPhone) {
      alert("Telefone do parceiro não configurado.");
      return;
    }
    const message = encodeURIComponent(`Olá ${provider.name}, vi seu perfil no XamaJá e gostaria de mais informações.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white select-none selection:bg-primary/30 selection:text-white antialiased overflow-x-hidden font-sans flex flex-col">
      {/* ── HEADER ── */}
      <header className="z-50 bg-[#050505] border-b border-zinc-900 flex-shrink-0">
        <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex flex-col items-start gap-0.5 cursor-pointer" onClick={() => window.location.href = "/"}>
            <div className="flex items-center gap-2">
              <img
                src="/assets/images/logo-xamaja.png"
                alt="XamaJá"
                className="h-9 w-auto object-contain"
              />
            </div>
            <span className="text-[9px] text-zinc-650 tracking-widest pl-0.5 font-mono uppercase">
              O X marca o local.
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
              Início
            </a>
            <a href="/#cadastro" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
              Seja um parceiro
            </a>
            <a href="/parceiros" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
              Parceiros
            </a>
            <a href="#results" className="text-sm font-semibold text-primary flex items-center gap-1.5">
              <Heart className="h-4 w-4 fill-current" />
              Favoritos ({favoritesList.length})
            </a>
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => (window.location.href = "/app")}
              className="text-sm font-semibold text-zinc-300 hover:text-white px-5 py-2.5 rounded-xl border border-zinc-900 bg-zinc-950 transition-all duration-200"
            >
              Entrar
            </button>
            <button
              onClick={() => (window.location.href = "/#cadastro")}
              className="text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.15)] transition"
            >
              Cadastre-se
            </button>
          </div>

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-[#050505] py-4 px-6 space-y-4 animate-in slide-in-from-top duration-250">
            <nav className="flex flex-col gap-3">
              <a href="/" className="text-zinc-400 hover:text-white py-2 text-base font-semibold border-b border-zinc-900">
                Início
              </a>
              <a href="/#cadastro" className="text-zinc-400 hover:text-white py-2 text-base font-semibold border-b border-zinc-900">
                Seja um parceiro
              </a>
              <a href="/parceiros" className="text-zinc-400 hover:text-white py-2 text-base font-semibold border-b border-zinc-900">
                Parceiros
              </a>
              <a href="#results" className="text-primary py-2 text-base font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 fill-current" />
                Favoritos ({favoritesList.length})
              </a>
            </nav>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => (window.location.href = "/app")}
                className="w-full text-center text-sm font-semibold text-zinc-300 py-3 rounded-xl border border-zinc-900 bg-zinc-950"
              >
                Entrar
              </button>
              <button
                onClick={() => (window.location.href = "/#cadastro")}
                className="w-full text-center text-sm font-bold text-primary-foreground bg-primary py-3 rounded-xl"
              >
                Cadastre-se
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── SEARCH & FILTER CONTROLS BAR ── */}
      <section className="bg-[#050505] border-b border-zinc-900 py-6 flex-shrink-0 z-30 shadow-md">
        <div className="container mx-auto px-4 lg:px-8 space-y-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row items-stretch bg-zinc-950 border border-zinc-900 rounded-2xl md:rounded-full p-1.5 shadow-2xl backdrop-blur-md max-w-4xl focus-within:border-primary/40 transition-all duration-300"
          >
            {/* Search query */}
            <div className="flex-1 flex items-center px-4 py-2 border-b md:border-b-0 md:border-r border-zinc-900">
              <Search className="h-5 w-5 text-zinc-500 mr-3 flex-shrink-0 focus-within:text-primary" />
              <input
                type="text"
                placeholder="Buscar profissionais ou comércios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-white placeholder-zinc-500 focus:outline-none text-sm font-semibold"
              />
            </div>

            {/* Location query */}
            <div className="flex-[0.8] flex items-center px-4 py-2">
              <MapPin className="h-5 w-5 text-zinc-500 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="CEP, Cidade ou Bairro"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                className="w-full bg-transparent text-white placeholder-zinc-500 focus:outline-none text-sm font-semibold"
              />
              <ChevronDown className="h-4 w-4 text-zinc-500 ml-2" />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold px-8 py-3.5 rounded-xl md:rounded-full shadow-lg shadow-primary/10 hover:shadow-primary/25 transition flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              <span>Buscar</span>
            </button>
          </form>

          {/* Quick Filters: Profile type toggles */}
          <div className="flex items-center justify-between border-t border-zinc-900/60 pt-4 flex-wrap gap-4">
            <div className="flex bg-zinc-950 border border-zinc-900 rounded-xl p-1">
              {[
                { type: "all", label: "Todos" },
                { type: "professional", label: "Prestadores" },
                { type: "comercio", label: "Comércios" },
              ].map((btn) => (
                <button
                  key={btn.type}
                  type="button"
                  onClick={() => handleProfileTypeChange(btn.type as any)}
                  className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                    profileType === btn.type
                      ? "bg-primary text-primary-foreground font-black shadow-md shadow-primary/10"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="text-zinc-500 text-xs font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Região de Busca: <strong className="text-zinc-300 font-bold">{currentLocationText}</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES BAR ── */}
      <section className="bg-[#050505] border-b border-zinc-900/60 sticky top-0 z-40 backdrop-blur-lg flex-shrink-0">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex gap-3.5 items-center justify-start overflow-x-auto no-scrollbar scroll-smooth">
          {displayCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex flex-col items-center justify-center gap-2.5 min-w-[110px] h-24 rounded-2xl border transition-all duration-300 ${
                  isSelected
                    ? "bg-transparent border-2 border-primary text-primary shadow-[0_0_15px_rgba(37,211,102,0.1)] scale-102"
                    : "bg-[#0c0c0e]/60 border border-[#1e1e1e] hover:border-zinc-800 text-white"
                }`}
              >
                <span className="text-[26px]">{cat.icon}</span>
                <span className={`text-[10px] font-black tracking-wider uppercase text-center px-1 ${
                  isSelected ? "text-primary" : "text-zinc-400"
                }`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── MAIN SPLIT CONTENT: LIST + MAP ── */}
      <main className="flex-1 flex flex-row relative h-[calc(100vh-250px)] overflow-hidden">
        {/* Left Column: Results List */}
        <div
          id="results"
          className={`${
            mobileShowMap ? "hidden" : "block"
          } lg:block w-full lg:w-[55%] xl:w-[60%] h-full overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800`}
        >
          {/* Header count */}
          <div className="flex items-center justify-between border-b border-zinc-900/60 pb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>Resultados Encontrados</span>
              <span className="bg-zinc-900 text-zinc-400 text-xs font-bold px-2 py-0.5 rounded-full font-mono">
                {providersList.length}
              </span>
            </h2>
          </div>

          {/* List of cards */}
          {isLoadingProviders ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
              <span className="text-zinc-500 text-xs font-semibold">Carregando prestadores...</span>
            </div>
          ) : providersList.length === 0 ? (
            <div className="text-center py-16 bg-zinc-950/20 rounded-3xl border border-dashed border-zinc-900 p-8 space-y-4">
              <Compass className="h-10 w-10 text-primary mx-auto opacity-50" />
              <h3 className="text-lg font-bold text-white">Nenhum parceiro nesta busca</h3>
              <p className="text-zinc-500 text-xs max-w-xs mx-auto">
                Não encontramos prestadores para os critérios selecionados nesta região. Tente alterar o termo ou filtre por outra categoria.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("todos");
                  setProfileType("all");
                  fetchProviders("", "todos", "all", userCoords);
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Limpar filtros e ver todos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {providersList.map((provider) => {
                const isFavorite = favoritesList.includes(provider.id);

                return (
                  <div
                    key={provider.id}
                    onClick={() => (window.location.href = `/perfil/${provider.id}`)}
                    className="group relative rounded-3xl bg-zinc-950/60 border border-zinc-900 hover:border-primary/30 overflow-hidden shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Cover Image Container (with overflow-hidden) */}
                      <div className="relative h-40 overflow-hidden bg-zinc-900 rounded-t-3xl">
                        <img
                          src={provider.coverUri || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"}
                          alt={provider.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Favorite button */}
                        <button
                          onClick={(e) => toggleFavorite(provider.id, e)}
                          className="absolute top-3.5 right-3.5 p-1.5 bg-black/60 backdrop-blur-md border border-white/10 hover:bg-primary hover:text-primary-foreground text-white rounded-full transition-all duration-300 z-10"
                        >
                          <Heart
                            className={`h-4.5 w-4.5 ${isFavorite ? "fill-primary text-primary-foreground" : "text-white"}`}
                          />
                        </button>
                      </div>

                      {/* Card Info Content */}
                      <div className="p-5 pt-8 space-y-1.5 relative">
                        {/* Brand Avatar Icon (OUTSIDE overflow-hidden cover, relative to Info Content) */}
                        <div className="absolute -top-7 left-5 w-14 h-14 rounded-full border-4 border-zinc-950 overflow-hidden shadow-xl bg-zinc-950 z-20">
                          <img
                            src={provider.avatarUri || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"}
                            alt={provider.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Title & Category */}
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-lg text-[#F5F5F5] group-hover:text-primary transition-colors leading-snug line-clamp-1">
                            {provider.name}
                          </h3>
                          <p className="text-[#A1A1A1] text-[9px] font-semibold uppercase tracking-widest">
                            {provider.category || "Profissional"}
                          </p>
                        </div>

                        {/* Rating, Location, and Status */}
                        <div className="flex items-center justify-between text-xs text-[#A1A1A1] font-semibold pt-3 border-t border-zinc-900/60 mt-2">
                          <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full text-xs text-primary">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="font-extrabold">{Number(provider.rating || 5.0).toFixed(1)}</span>
                            <span className="text-zinc-500 font-semibold text-[10px]">({provider.ratingCount || 10})</span>
                          </div>

                          {provider.distanceStr && (
                            <span className="text-primary text-[10px] font-bold bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {provider.distanceStr}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Action Button */}
                    <div className="p-5 pt-0">
                      <button
                        onClick={(e) => handleContactWhatsApp(provider, e)}
                        className="w-full py-3 bg-zinc-900 hover:bg-primary hover:text-primary-foreground border border-zinc-850 hover:border-primary rounded-xl flex items-center justify-center gap-2 font-extrabold text-xs text-zinc-300 transition-all duration-300 hover:scale-102 active:scale-98"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Chamar no WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Leaflet Map */}
        <div
          id="map-container"
          className={`${
            mobileShowMap ? "block w-full h-full" : "hidden"
          } lg:block lg:w-[45%] xl:w-[40%] h-full sticky top-0 bg-zinc-900/40`}
          style={{ height: "100%", minHeight: "650px" }}
        >
          <div id="busca-map" className="w-full h-full bg-[#09090b]" style={{ height: "100%", minHeight: "650px" }}></div>
        </div>

        {/* Mobile View Toggle Floating Action Button */}
        <button
          onClick={() => setMobileShowMap(!mobileShowMap)}
          className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-primary text-primary-foreground font-extrabold px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm"
        >
          {mobileShowMap ? (
            <>
              <ListIcon className="h-4.5 w-4.5" />
              <span>Ver Lista</span>
            </>
          ) : (
            <>
              <MapIcon className="h-4.5 w-4.5" />
              <span>Ver no Mapa</span>
            </>
          )}
        </button>
      </main>

      {/* Styles for Leaflet customization in dark mode */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background: #09090b !important;
          border: 1px solid #18181b !important;
          color: white !important;
          border-radius: 16px !important;
          padding: 0px !important;
          overflow: hidden !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background: #09090b !important;
          border: 1px solid #18181b !important;
        }
        .custom-leaflet-marker {
          background: transparent !important;
          border: none !important;
        }
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
