import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateWhatsAppMessage } from "../lib/whatsapp-helper";
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
  CheckCircle,
  Eye,
  Grid,
  Utensils,
  Scissors,
  HeartPulse,
  Wrench,
  Home as HomeIcon,
  Hammer,
  Car,
  GraduationCap,
  MoreHorizontal,
  Crosshair,
  Users,
  ThumbsUp,
  Megaphone,
  Clock,
  BadgeCheck,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getSessionToken } from "@/lib/supabase";

function getDisplayCategory(categoryId?: string | null, categoryName?: string | null): string {
  const catId = (categoryId || "").toLowerCase().trim();
  const catName = (categoryName || "").toLowerCase().trim();

  if (catName.includes("pintor") || catName.includes("eletricista") || catName.includes("encanador") || catName.includes("pedreiro")) {
    return "Serviços Residenciais";
  }
  if (catName.includes("pet") || catName.includes("veterin")) {
    return "Pets";
  }
  if (catName.includes("pizza") || catName.includes("burger") || catName.includes("hamburg") || catName.includes("restaurante") || catName.includes("bar") || catName.includes("lanchonete") || catName.includes("alimentacao") || catName.includes("alimentação") || catName.includes("comida")) {
    return "Alimentação";
  }
  if (catName.includes("mercado") || catName.includes("loja") || catName.includes("compras") || catName.includes("supermercado")) {
    return "Compras";
  }
  if (catName.includes("barbe") || catName.includes("cabelei") || catName.includes("unha") || catName.includes("esteti") || catName.includes("beleza")) {
    return "Beleza";
  }
  if (catName.includes("mecanic") || catName.includes("oficina") || catName.includes("auto")) {
    return "Automotivo";
  }
  if (catName.includes("advogad") || catName.includes("jurid")) {
    return "Jurídico";
  }
  if (catName.includes("dentis") || catName.includes("clinica") || catName.includes("saude") || catName.includes("saúde") || catName.includes("médic") || catName.includes("medic")) {
    return "Saúde";
  }
  if (catName.includes("academ") || catName.includes("fit") || catName.includes("treino") || catName.includes("personal")) {
    return "Fitness";
  }
  if (catName.includes("hotel") || catName.includes("pousada") || catName.includes("hosped")) {
    return "Hospedagem";
  }

  if (catId === "reformas-reparos" || catId === "servicos-domesticos") {
    return "Serviços Residenciais";
  }
  if (catId === "pets") {
    return "Pets";
  }
  if (catId === "beleza-estetica") {
    return "Beleza";
  }
  if (catId === "automotivo") {
    return "Automotivo";
  }
  if (catId === "saude") {
    return "Saúde";
  }
  if (catId === "academias" || catId === "fitness") {
    return "Fitness";
  }
  if (catId === "servicos-profissionais" || catId === "juridico") {
    return "Jurídico";
  }
  if (catId === "hospedagem") {
    return "Hospedagem";
  }
  if (catId === "comercios") {
    return "Alimentação";
  }

  return "Serviços";
}

export default function Busca() {
  // Navigation & UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileShowMap, setMobileShowMap] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

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

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(12);

  // Filter UI States
  const [sortBy, setSortBy] = useState("relevance");
  const [maxDistance, setMaxDistance] = useState(50);
  const [minRating, setMinRating] = useState(0);
  const [availability, setAvailability] = useState<string[]>([]);
  const [only24h, setOnly24h] = useState(false);

  // Leaflet Map States
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markersList, setMarkersList] = useState<any[]>([]);
  const mapRef = useRef<any>(null);

  const displayCategories = [
    { id: "todos", name: "Todos", icon: Grid },
    { id: "reformas-reparos", name: "Reformas e Reparos", icon: Hammer },
    { id: "assistencia-tecnica", name: "Assistência Técnica", icon: Wrench },
    { id: "servicos-domesticos", name: "Serviços Domésticos", icon: HomeIcon },
    { id: "automotivo", name: "Automotivo", icon: Car },
    { id: "beleza-estetica", name: "Beleza e Estética", icon: Scissors },
    { id: "saude", name: "Saúde e Bem-estar", icon: HeartPulse },
    { id: "educacao", name: "Eventos", icon: GraduationCap },
    { id: "mais", name: "Mais", icon: MoreHorizontal },
  ];

  // Load favorites, request geolocation, and load leaflet
  useEffect(() => {
    console.log("[Audit Busca] Componente Busca montado. Iniciando ciclo de vida do mapa.");

    const checkSession = async () => {
      const token = await getSessionToken();
      const savedUser = localStorage.getItem("bp_user_profile");
      if (token && savedUser) {
        try {
          setUserProfile(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkSession();

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
        fetchProviders(initialQ, initialCategory, profileType, coords || defaultCoords, 1);
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
          fetchProviders(initialQ, initialCategory, profileType, coords, 1);
        },
        (error) => {
          console.log("[Audit Busca] Geolocalização falhou/negada. Usando padrão Bragança Paulista - SP:", error.message);
          fetchProviders(initialQ, initialCategory, profileType, defaultCoords, 1);
        }
      );
    } else {
      console.log("[Audit Busca] Geolocalização não suportada pelo navegador. Usando padrão Bragança Paulista - SP.");
      fetchProviders(initialQ, initialCategory, profileType, defaultCoords, 1);
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
    queryVal = searchTerm,
    categoryVal = selectedCategory,
    typeVal: "all" | "professional" | "comercio" = profileType,
    coords: { latitude: number; longitude: number } | null = userCoords,
    pageVal: number = 1,
    only24hVal: boolean = only24h,
    sortByVal: string = sortBy,
    minRatingVal: number = minRating,
    maxDistanceVal: number = maxDistance
  ) => {
    setIsLoadingProviders(true);
    try {
      const input: any = {
        sortBy: sortByVal || "relevance",
        profileType: typeVal,
        page: pageVal,
        limit: pageSize,
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
        input.maxDistanceKm = maxDistanceVal || 50;
        if (sortByVal === "distance") {
          input.sortBy = "distance";
        }
      }

      if (minRatingVal > 0) {
        input.minRating = minRatingVal;
      }

      if (only24hVal) {
        input.is24Hours = true;
      }

      if (availability.includes("now")) {
        input.onlyOnline = true;
      }

      const url = `/api/trpc/providers.searchFiltered?input=${encodeURIComponent(JSON.stringify(input))}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const data = json.result?.data;
        if (data) {
          const items = Array.isArray(data) ? data : data.items || [];
          const total = Array.isArray(data) ? data.length : data.total ?? items.length;
          const pages = Array.isArray(data) ? Math.max(1, Math.ceil(total / pageSize)) : data.totalPages ?? 1;
          setProvidersList(items);
          setTotalCount(total);
          setTotalPages(Math.max(1, pages));
          setCurrentPage(pageVal);
          setIsLoadingProviders(false);
          return;
        }
      }
    } catch (e) {
      console.error("Failed fetching providers via tRPC:", e);
    }

    setProvidersList([]);
    setTotalCount(0);
    setTotalPages(1);
    setCurrentPage(1);
    setIsLoadingProviders(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchProviders(
      searchTerm,
      selectedCategory,
      profileType,
      userCoords,
      newPage,
      only24h,
      sortBy,
      minRating,
      maxDistance
    );
    document.getElementById("results")?.scrollTo({ top: 0, behavior: "smooth" });
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
          <div class="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 max-w-[200px]" style="font-family: 'Plus Jakarta Sans', sans-serif;"> <!-- impeccable-disable-line overused-font -->
            <strong class="text-white text-sm font-bold block leading-tight">${p.name}</strong>
            <span class="text-[#84cc16] text-[10px] font-black tracking-wider uppercase block">${p.category || 'Profissional'}</span>
            <div class="flex items-center gap-1 text-[#84cc16] text-xs">
              <span>⭐</span>
              ${p.ratingCount && Number(p.ratingCount) > 0 ? `
                <span class="text-white font-bold">${Number(p.rating).toFixed(1)}</span>
                <span class="text-zinc-500">(${p.ratingCount})</span>
              ` : `
                <span class="text-zinc-400 font-semibold">Novo</span>
              `}
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

    fetchProviders(searchTerm, selectedCategory, profileType, coords, 1, only24h, sortBy, minRating, maxDistance);
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
    fetchProviders(searchTerm, catId, profileType, userCoords, 1, only24h, sortBy, minRating, maxDistance);
  };

  const handleProfileTypeChange = (type: "all" | "professional" | "comercio") => {
    setProfileType(type);
    setCurrentPage(1);
    fetchProviders(searchTerm, selectedCategory, type, userCoords, 1, only24h, sortBy, minRating, maxDistance);
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
    const text = generateWhatsAppMessage({ provider });
    const message = encodeURIComponent(text);
    const targetPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${targetPhone}?text=${message}`, "_blank");
  };

  const toggleAvailability = (value: string) => {
    setAvailability(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const clearFilters = () => {
    setSortBy("relevance");
    setMaxDistance(50);
    setMinRating(0);
    setAvailability([]);
    setOnly24h(false);
    setCurrentPage(1);
    fetchProviders(searchTerm, selectedCategory, profileType, userCoords, 1, false, "relevance", 0, 50);
  };

  // ── FILTER SIDEBAR CONTENT (reused in desktop sidebar and mobile drawer) ──
  const renderFilters = () => (
    <div className="space-y-7">
      {/* Ordenar por */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ordenar por</label>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-semibold appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value="relevance">Mais bem avaliados</option>
            <option value="distance">Mais próximos</option>
            <option value="recent">Mais recentes</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Atendimento 24h */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Atendimento</label>
        <label className="flex items-center gap-3 cursor-pointer group bg-zinc-900/60 hover:bg-zinc-900 p-3 rounded-xl border border-zinc-800 hover:border-emerald-500/40 transition-colors">
          <input
            type="checkbox"
            className="busca-checkbox"
            checked={only24h}
            onChange={(e) => {
              setOnly24h(e.target.checked);
            }}
          />
          <div className="flex items-center justify-between flex-1">
            <span className="text-sm text-zinc-300 font-medium group-hover:text-white transition-colors">
              Atendimento 24 horas
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-wider uppercase border border-emerald-500/30">
              24h
            </span>
          </div>
        </label>
      </div>

      {/* Distância */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Distância</label>
          <span className="text-xs font-bold text-white">Até {maxDistance} km</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={maxDistance}
          onChange={(e) => setMaxDistance(Number(e.target.value))}
          className="busca-range w-full"
          style={{ "--range-pct": `${maxDistance}%` } as React.CSSProperties}
        />
      </div>

      {/* Avaliação mínima */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avaliação mínima</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setMinRating(minRating === star ? 0 : star)}
              className="busca-star"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  star <= minRating
                    ? "text-primary fill-primary"
                    : "text-zinc-700"
                }`}
              />
            </button>
          ))}
          <ChevronDown className="h-4 w-4 text-zinc-600 ml-1" />
          <span className="text-xs text-zinc-400 font-semibold ml-1">ou mais</span>
        </div>
      </div>

      {/* Disponibilidade */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Disponibilidade</label>
        <div className="space-y-2.5">
          {[
            { value: "now", label: "Disponível agora" },
            { value: "today", label: "Disponível hoje" },
            { value: "week", label: "Disponível esta semana" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="busca-checkbox"
                checked={availability.includes(opt.value)}
                onChange={() => toggleAvailability(opt.value)}
              />
              <span className="text-sm text-zinc-300 font-medium group-hover:text-white transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Aplicar filtros */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            setCurrentPage(1);
            fetchProviders(
              searchTerm,
              selectedCategory,
              profileType,
              userCoords,
              1,
              only24h,
              sortBy,
              minRating,
              maxDistance
            );
            setMobileFiltersOpen(false);
          }}
          className="w-full py-3 bg-primary hover:bg-primary/90 text-zinc-950 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/10"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Aplicar filtros</span>
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="w-full py-2.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-semibold text-xs rounded-xl transition-colors"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );

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
            {userProfile ? (
              <button
                onClick={() => (window.location.href = "/parceiro")}
                className="text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.15)] transition"
              >
                Olá, {userProfile.name?.split(" ")[0] || "Minha Conta"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => (window.location.href = "/parceiro")}
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
              </>
            )}
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
              {userProfile ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.href = "/parceiro";
                  }}
                  className="w-full text-center text-sm font-bold text-primary-foreground bg-primary py-3 rounded-xl"
                >
                  Olá, {userProfile.name || "Minha Conta"}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.href = "/parceiro";
                    }}
                    className="w-full text-center text-sm font-semibold text-zinc-300 py-3 rounded-xl border border-zinc-900 bg-zinc-950"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.href = "/#cadastro";
                    }}
                    className="w-full text-center text-sm font-bold text-primary-foreground bg-primary py-3 rounded-xl"
                  >
                    Cadastre-se
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION WITH STATS ── */}
      <section className="bg-[#050505] py-8 md:py-10 flex-shrink-0 border-b border-zinc-900">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary text-sm font-bold">
                <MapPin className="h-4 w-4" />
                <span>Encontre os melhores</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                Profissionais <span className="italic">perto de você</span>
              </h1>
              <p className="text-zinc-500 text-sm max-w-md">
                Busque por serviços, categorias ou profissionais na sua região e encontre exatamente o que precisa.
              </p>
            </div>

            {/* Right: Stats Pills */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-white font-black text-sm leading-none">+ {providersList.length > 0 ? providersList.length : "..."}</div>
                  <div className="text-zinc-500 text-[10px] font-semibold">Profissionais ativos</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Grid className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-white font-black text-sm leading-none">+ 50</div>
                  <div className="text-zinc-500 text-[10px] font-semibold">Categorias de serviços</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <ThumbsUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-white font-black text-sm leading-none">+ 3.500</div>
                  <div className="text-zinc-500 text-[10px] font-semibold">Avaliações positivas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH BAR ── */}
      <section className="bg-[#050505] pt-2 pb-4 flex-shrink-0 z-30">
        <div className="container mx-auto px-4 lg:px-8">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row items-stretch bg-zinc-950 border border-zinc-800 rounded-2xl p-1.5 max-w-5xl focus-within:border-primary/40 transition-all duration-300"
          >
            {/* Search query */}
            <div className="flex-1 flex items-center px-4 py-2.5 border-b md:border-b-0 md:border-r border-zinc-800">
              <Search className="h-5 w-5 text-zinc-500 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="O que você precisa? Ex: eletricista, encanador, designer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-white placeholder-zinc-600 focus:outline-none text-sm font-medium"
              />
            </div>

            {/* Location query */}
            <div className="flex-[0.7] flex items-center px-4 py-2.5">
              <MapPin className="h-5 w-5 text-zinc-500 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder={currentLocationText}
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                className="w-full bg-transparent text-white placeholder-zinc-500 focus:outline-none text-sm font-medium"
              />
              <Crosshair className="h-4 w-4 text-zinc-600 ml-2 flex-shrink-0 cursor-pointer hover:text-primary transition-colors" />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold px-8 py-3 rounded-xl md:rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/25 transition flex items-center justify-center gap-2 text-sm"
            >
              <span>Buscar</span>
            </button>
          </form>
        </div>
      </section>

      {/* ── CATEGORIES BAR ── */}
      <section className="bg-[#050505] pb-4 flex-shrink-0 z-40 select-none border-b border-zinc-900">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none no-scrollbar">
            {displayCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id || (selectedCategory === "all" && cat.id === "todos");
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
                    isSelected
                      ? "bg-zinc-900 border border-primary/40 text-primary"
                      : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{cat.name}</span>
                  {cat.id === "mais" && <ChevronDown className="h-3 w-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MAIN SPLIT CONTENT: FILTERS + LIST + MAP ── */}
      <main className="flex-1 flex flex-row relative overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>

        {/* ── LEFT COLUMN: FILTERS (desktop) ── */}
        <aside className="hidden lg:block w-[260px] flex-shrink-0 h-full overflow-y-auto border-r border-zinc-900 bg-[#050505] p-5 busca-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black text-white">Filtros</h3>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-zinc-500 hover:text-primary transition-colors"
            >
              Limpar
            </button>
          </div>
          {renderFilters()}
        </aside>

        {/* ── Mobile Filter Drawer ── */}
        <div
          className={`busca-filter-overlay lg:hidden ${mobileFiltersOpen ? "open" : ""}`}
          onClick={() => setMobileFiltersOpen(false)}
        />
        <div className={`busca-filter-drawer lg:hidden ${mobileFiltersOpen ? "open" : ""}`}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-black text-white">Filtros</h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderFilters()}
          </div>
        </div>

        {/* ── CENTER COLUMN: RESULTS LIST ── */}
        <div
          id="results"
          className={`${
            mobileShowMap ? "hidden" : "block"
          } lg:block flex-1 h-full overflow-y-auto busca-scrollbar`}
        >
          {/* Results header */}
          <div className="sticky top-0 z-20 bg-[#050505]/95 backdrop-blur-sm border-b border-zinc-900 px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold text-white">
                {totalCount} {totalCount === 1 ? "parceiro encontrado" : "parceiros encontrados"}
              </span>
            </div>
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <ListIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === "map"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mapa</span>
              </button>
            </div>
          </div>

          {/* Cards list */}
          <div className="p-4 md:p-5 space-y-3">
            {isLoadingProviders ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
                <span className="text-zinc-500 text-xs font-semibold">Carregando prestadores...</span>
              </div>
            ) : providersList.length === 0 ? (
              <div className="text-center py-16 bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-900 p-8 space-y-4">
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
                    setOnly24h(false);
                    fetchProviders("", "todos", "all", userCoords, 1, false);
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Limpar filtros e ver todos
                </button>
              </div>
            ) : (
              providersList.map((provider, idx) => {
                const isFavorite = favoritesList.includes(provider.id);
                const hasRating = provider.ratingCount && Number(provider.ratingCount) > 0;
                const tags = provider.tags
                  ? (Array.isArray(provider.tags)
                      ? provider.tags
                      : typeof provider.tags === "string"
                        ? provider.tags.split(",").map((t: string) => t.trim())
                        : [])
                  : [];

                return (
                  <div
                    key={provider.id}
                    onClick={() => (window.location.href = `/perfil/${provider.id}`)}
                    className="busca-card-animate group bg-zinc-950/60 border border-zinc-900 hover:border-primary/30 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:bg-zinc-950"
                    style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}
                  >
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full border-2 border-primary/60 overflow-hidden bg-zinc-900">
                          <img
                            src={provider.avatarUri || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=84cc16&color=fff&size=150`}
                            alt={provider.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {provider.isVerified && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-zinc-950 p-0.5 rounded-full border-2 border-zinc-950">
                            <BadgeCheck className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="font-bold text-white text-sm group-hover:text-primary transition-colors truncate">
                                {provider.name}
                              </h3>
                              {provider.isVerified && (
                                <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                              {provider.is24Hours && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-md uppercase tracking-wider flex-shrink-0">
                                  <Clock className="w-3 h-3" /> 24h
                                </span>
                              )}
                            </div>
                            <p className="text-zinc-500 text-xs font-medium mt-0.5">
                              {provider.category || "Profissional"}
                            </p>
                          </div>

                          {/* Distance + Availability */}
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1 text-zinc-400 text-xs">
                              <MapPin className="h-3 w-3 text-zinc-500" />
                              <span className="font-semibold">{provider.distanceStr || "Região local"}</span>
                            </div>
                            <span className="text-[10px] font-bold text-primary">
                              {provider.onlineStatus === true ? "Disponível agora" : "Disponível hoje"}
                            </span>
                          </div>
                        </div>

                        {/* Rating row */}
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                            {hasRating ? (
                              <>
                                <span className="text-white font-bold">{Number(provider.rating).toFixed(1)}</span>
                                <span className="text-zinc-500">({provider.ratingCount} avaliações)</span>
                              </>
                            ) : (
                              <span className="text-zinc-400 font-semibold">Novo</span>
                            )}
                          </div>
                          {provider.experienceYears && (
                            <>
                              <span className="text-zinc-700">•</span>
                              <span className="text-zinc-500">{provider.experienceYears} anos de experiência</span>
                            </>
                          )}
                        </div>

                        {/* Tags */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {tags.slice(0, 3).map((tag: string, i: number) => (
                              <span
                                key={i}
                                className="text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/perfil/${provider.id}`;
                            }}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Ver perfil</span>
                          </button>
                          <button
                            onClick={(e) => handleContactWhatsApp(provider, e)}
                            className="w-9 h-9 bg-primary/15 hover:bg-primary/25 border border-primary/30 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <MessageCircle className="h-4 w-4 text-primary" />
                          </button>
                          <button
                            onClick={(e) => toggleFavorite(provider.id, e)}
                            className="w-9 h-9 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center justify-center transition-colors ml-auto"
                          >
                            <Heart
                              className={`h-4 w-4 transition-colors ${isFavorite ? "fill-primary text-primary" : "text-zinc-500"}`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 pb-2 border-t border-zinc-900 mt-6">
                <div className="text-xs text-zinc-400 font-semibold">
                  Página <span className="text-white font-bold">{currentPage}</span> de{" "}
                  <span className="text-white font-bold">{totalPages}</span> ({totalCount}{" "}
                  {totalCount === 1 ? "resultado" : "resultados"})
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, index, array) => {
                        const showEllipsis = index > 0 && p - array[index - 1] > 1;
                        return (
                          <div key={p} className="flex items-center gap-1">
                            {showEllipsis && <span className="text-zinc-600 px-1 text-xs">...</span>}
                            <button
                              type="button"
                              onClick={() => handlePageChange(p)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                currentPage === p
                                  ? "bg-primary text-zinc-950 shadow-sm"
                                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                  >
                    Próxima <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: MAP ── */}
        <div
          id="map-container"
          className={`${
            mobileShowMap ? "block w-full h-full" : "hidden"
          } lg:block lg:w-[45%] xl:w-[42%] h-full bg-zinc-900/40 relative flex-shrink-0`}
          style={{ height: "100%", minHeight: "500px" }}
        >
          {/* Map header */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <button
              type="button"
              onClick={() => {
                if (mapInstance) {
                  const center = mapInstance.getCenter();
                  const coords = { latitude: center.lat, longitude: center.lng };
                  setUserCoords(coords);
                  fetchProviders(searchTerm, selectedCategory, profileType, coords);
                }
              }}
              className="px-4 py-2 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-full text-xs font-bold text-white hover:border-primary/40 transition-colors shadow-xl"
            >
              Buscar nesta área
            </button>
          </div>

          <div id="busca-map" className="w-full h-full bg-[#09090b]" style={{ height: "100%", minHeight: "500px" }}></div>

          {/* CTA: Não encontrou? */}
          <div className="absolute bottom-4 left-4 right-4 z-30">
            <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold leading-tight">Não encontrou o que precisa?</p>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  Publique uma solicitação e receba orçamentos de profissionais interessados.
                </p>
              </div>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/preciso-de-alguem";
                  }
                }}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4 text-zinc-600 hover:text-white transition-colors absolute top-3 right-3" />
              </button>
            </div>
            <a
              href="/preciso-de-alguem"
              className="mt-2 block w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl text-center transition-colors"
            >
              Publicar solicitação
            </a>
          </div>
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
