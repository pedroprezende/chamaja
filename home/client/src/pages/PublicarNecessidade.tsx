import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  UserCheck,
  Megaphone,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Camera,
  Upload,
  X,
  Plus,
  Minus,
  Check,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Handshake,
  Layers,
  Search,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { getSessionToken, supabase } from "@/lib/supabase";
import { CATEGORIES_BY_TYPE, ALL_CATEGORIES } from "@/constants/categories";

export type PaymentType = "total" | "diaria" | "hora" | "a_combinar";

interface NeedWebFormData {
  title: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  description: string;
  requiredProfessionals: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  paymentType: PaymentType;
  budget: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  requirements: string;
  notes: string;
  photos: string[];
}

const INITIAL_FORM: NeedWebFormData = {
  title: "",
  categoryId: "reformas-reparos",
  categoryName: "Reformas",
  subcategoryId: "eletricistas",
  subcategoryName: "Eletricistas",
  description: "",
  requiredProfessionals: 1,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  startTime: "08:00",
  endTime: "17:00",
  paymentType: "total",
  budget: "",
  cep: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "Bragança Paulista",
  latitude: -22.952,
  longitude: -46.542,
  requirements: "",
  notes: "",
  photos: [],
};

// Subcategorias expandidas para seleção no Desktop
const WEB_SUBCATEGORIES: Record<string, { id: string; name: string }[]> = {
  "reformas-reparos": [
    { id: "eletricistas", name: "Eletricista" },
    { id: "encanadores", name: "Encanador" },
    { id: "pedreiros", name: "Pedreiro" },
    { id: "pintores", name: "Pintor" },
    { id: "gesseiro", name: "Gesseiro" },
    { id: "serralheiros", name: "Serralheiro" },
    { id: "marceneiros", name: "Marceneiro" },
    { id: "marido-de-aluguel", name: "Marido de Aluguel" },
  ],
  "servicos-domesticos": [
    { id: "diarista", name: "Diarista" },
    { id: "faxineira", name: "Faxineira" },
    { id: "baba", name: "Babá" },
    { id: "cuidador", name: "Cuidador de Idosos" },
    { id: "cozinheira", name: "Cozinheira" },
    { id: "passadeira", name: "Passadeira" },
  ],
  "assistencia-tecnica": [
    { id: "celular", name: "Conserto de Celular" },
    { id: "notebook", name: "Técnico de Notebook" },
    { id: "ar-condicionado", name: "Ar-condicionado" },
    { id: "geladeira", name: "Técnico de Geladeira" },
    { id: "maquina-lavar", name: "Máquina de Lavar" },
    { id: "tv", name: "Conserto de TV" },
  ],
  automotivo: [
    { id: "mecanico", name: "Mecânico Geral" },
    { id: "auto-eletrica", name: "Auto Elétrica" },
    { id: "lava-rapido", name: "Lava Rápido" },
    { id: "guincho", name: "Guincho" },
    { id: "funileiro", name: "Funileiro & Pintura" },
  ],
  "beleza-estetica": [
    { id: "barbearia", name: "Barbeiro" },
    { id: "cabeleireiro", name: "Cabeleireiro(a)" },
    { id: "manicure", name: "Manicure & Pedicure" },
    { id: "designer-sobrancelha", name: "Designer de Sobrancelha" },
    { id: "maquiagem", name: "Maquiador(a)" },
    { id: "esteticista", name: "Estética Corporal/Facial" },
  ],
  comercios: [
    { id: "restaurante", name: "Restaurante / Lanchonete" },
    { id: "mercado", name: "Mercado / Mercearia" },
    { id: "farmacia", name: "Farmácia" },
    { id: "pet-shop", name: "Pet Shop" },
    { id: "loja-roupas", name: "Loja de Roupas" },
    { id: "materiais-construcao", name: "Materiais de Construção" },
  ],
  outros: [
    { id: "jardineiro", name: "Jardineiro" },
    { id: "piscineiro", name: "Piscineiro" },
    { id: "frete", name: "Fretes & Mudanças" },
    { id: "fotografo", name: "Fotógrafo" },
    { id: "professor", name: "Aulas & Reforço" },
    { id: "geral", name: "Outros Serviços" },
  ],
};

export default function PublicarNecessidade() {
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<NeedWebFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [publishedNeedId, setPublishedNeedId] = useState<string | null>(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  // Check auth session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await getSessionToken();
        const savedUser = localStorage.getItem("bp_user_profile");
        if (token && savedUser) {
          setUserProfile(JSON.parse(savedUser));
        } else if (token) {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            setUserProfile({
              name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
              email: data.user.email,
            });
          }
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        console.error("Erro ao verificar sessão:", e);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkSession();
  }, []);

  // Initialize and update Leaflet Map on Step 3 or 5
  useEffect(() => {
    if ((currentStep === 3 || currentStep === 5) && mapContainerRef.current) {
      const L = (window as any).L;
      if (!L) return;

      const lat = formData.latitude || -22.952;
      const lng = formData.longitude || -46.542;

      // Clean existing instance
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      // Custom green marker icon
      const customIcon = L.divIcon({
        className: "custom-web-marker",
        html: `
          <div style="background-color: #25D366; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(37,211,102,0.5); border: 3px solid #FFFFFF;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        draggable: currentStep === 3, // only draggable on step 3
      }).addTo(map);

      if (currentStep === 3) {
        marker.on("dragend", (e: any) => {
          const newPos = e.target.getLatLng();
          setFormData((prev) => ({
            ...prev,
            latitude: newPos.lat,
            longitude: newPos.lng,
          }));
        });

        map.on("click", (e: any) => {
          marker.setLatLng(e.latlng);
          setFormData((prev) => ({
            ...prev,
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
          }));
        });
      }

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  }, [currentStep]);

  const handleLoginRedirect = () => {
    localStorage.setItem("post_login_redirect", "/publicar-necessidade");
    window.location.href = "/parceiro";
  };

  // CEP Search
  const handleCepSearch = async (textCep: string) => {
    const cleanCep = textCep.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, cep: textCep }));

    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (data && !data.erro) {
          setFormData((prev) => ({
            ...prev,
            address: data.logradouro || prev.address,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
          }));

          // Geocode via Nominatim
          try {
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                `${data.logradouro}, ${data.bairro}, ${data.localidade}, Brasil`
              )}&format=json&limit=1`,
              {
                headers: { "User-Agent": "XamaJaWeb/1.0" },
              }
            );
            const nomData = await nomRes.json();
            if (Array.isArray(nomData) && nomData.length > 0) {
              const lat = parseFloat(nomData[0].lat);
              const lng = parseFloat(nomData[0].lon);
              setFormData((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
              }));

              if (mapInstanceRef.current && markerInstanceRef.current) {
                mapInstanceRef.current.setView([lat, lng], 16);
                markerInstanceRef.current.setLatLng([lat, lng]);
              }
            }
          } catch (e) {
            console.warn("Geocoding failed:", e);
          }
        }
      } catch (err) {
        console.warn("Erro ao buscar CEP:", err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  // Photo Upload Handler (Upload via /api/upload-image or Base64)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (formData.photos.length >= 5) {
      alert("Você já atingiu o limite de 5 fotos.");
      return;
    }

    setIsUploadingPhoto(true);
    const token = await getSessionToken();

    for (let i = 0; i < files.length && formData.photos.length + i < 5; i++) {
      const file = files[i];
      try {
        // Read file as Base64 data URL
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Send to server upload endpoint
        const response = await fetch("/api/upload-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            base64Data,
            fileType: file.type || "image/jpeg",
            bucket: "chamaja-images",
          }),
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.publicUrl) {
            setFormData((prev) => ({
              ...prev,
              photos: [...prev.photos, resJson.publicUrl],
            }));
            continue;
          }
        }

        // Fallback: use data URI if direct upload failed
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, base64Data],
        }));
      } catch (uploadErr) {
        console.error("Erro no upload de foto:", uploadErr);
      }
    }
    setIsUploadingPhoto(false);
  };

  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== index),
    }));
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.title.trim() || formData.title.trim().length < 3) {
        alert("Por favor, preencha um título com pelo menos 3 caracteres.");
        return false;
      }
      if (!formData.categoryId) {
        alert("Selecione uma categoria para o serviço.");
        return false;
      }
      if (!formData.description.trim() || formData.description.trim().length < 10) {
        alert("Por favor, detalhe o que você precisa na descrição (mínimo 10 caracteres).");
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.startDate) {
        alert("Informe a data de início do serviço.");
        return false;
      }
      if (formData.paymentType !== "a_combinar" && !formData.budget) {
        alert("Informe o valor oferecido ou selecione 'A Combinar'.");
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!formData.city.trim()) {
        alert("Informe a cidade onde o serviço será realizado.");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Submit via tRPC
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await getSessionToken();
      if (!token) {
        handleLoginRedirect();
        return;
      }

      const parsedBudget =
        formData.paymentType === "a_combinar"
          ? null
          : parseFloat(formData.budget.replace(/[^\d.,]/g, "").replace(",", ".")) ||
            null;

      let fullAddress = formData.address.trim();
      if (formData.number.trim()) fullAddress += `, ${formData.number.trim()}`;
      if (formData.complement.trim())
        fullAddress += ` (${formData.complement.trim()})`;

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.categoryName,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId || undefined,
        subcategoryName: formData.subcategoryName || undefined,
        requiredProfessionals: formData.requiredProfessionals,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        budget: parsedBudget ?? undefined,
        paymentType: formData.paymentType,
        address: fullAddress || undefined,
        neighborhood: formData.neighborhood.trim() || undefined,
        city: formData.city.trim(),
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
        requirements: formData.requirements.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        photos: formData.photos,
      };

      const response = await fetch("/api/trpc/needs.create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (response.ok && resData.result?.data?.success) {
        setPublishedNeedId(resData.result.data.id);
        setCurrentStep(6); // Success Step
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        throw new Error(
          resData.error?.message || "Não foi possível publicar sua necessidade."
        );
      }
    } catch (err: any) {
      console.error("Erro ao publicar necessidade:", err);
      alert(err.message || "Erro de conexão ao publicar necessidade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Serviço", icon: FileText },
    { num: 2, label: "Prazos & Valores", icon: DollarSign },
    { num: 3, label: "Localização", icon: MapPin },
    { num: 4, label: "Requisitos & Fotos", icon: Camera },
    { num: 5, label: "Revisão", icon: CheckCircle2 },
  ];

  const paymentLabels: Record<PaymentType, string> = {
    total: "Valor Total",
    diaria: "Por Diária",
    hora: "Por Hora",
    a_combinar: "A Combinar",
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-[#25D366]/30 selection:text-white font-sans">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao Início</span>
          </button>

          <a href="/" className="flex items-center gap-2">
            <img
              src="/assets/images/logo-xamaja.png"
              alt="XamaJá"
              className="h-8 w-auto object-contain"
            />
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/busca"
              className="text-xs font-semibold text-zinc-400 hover:text-white transition hidden sm:inline"
            >
              Buscar Serviços
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Title & Badge */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-bold uppercase tracking-wider">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Publicar Demanda de Serviço</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            Preciso de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] via-emerald-400 to-lime-400">alguém</span> para um serviço
          </h1>

          <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto">
            Preencha os detalhes do seu pedido e receba propostas de profissionais qualificados da sua região.
          </p>
        </div>

        {/* ── Auth Gate Check ── */}
        {isLoadingAuth ? (
          <div className="py-20 text-center text-zinc-400 space-y-3">
            <div className="w-8 h-8 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Verificando sua conta...</p>
          </div>
        ) : !userProfile ? (
          <div className="bg-zinc-950/80 border border-white/[0.1] rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Identificação Necessária</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Para publicar uma necessidade e receber propostas com segurança, você precisa estar conectado à sua conta XamaJá.
              </p>
            </div>
            <Button
              onClick={handleLoginRedirect}
              className="bg-[#25D366] hover:bg-[#22C55E] text-black font-black px-8 py-3.5 h-12 rounded-xl transition shadow-lg shadow-[#25D366]/20 w-full sm:w-auto"
            >
              <span>Entrar ou Criar Conta</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          /* ── Stepper Navigation Bar (Desktop & Mobile) ── */
          <div className="space-y-8">
            {currentStep <= 5 && (
              <div className="bg-zinc-950/60 border border-white/[0.08] rounded-2xl p-4 md:p-6 shadow-xl">
                <div className="grid grid-cols-5 gap-2 md:gap-4">
                  {stepsList.map((step) => {
                    const isPassed = step.num < currentStep;
                    const isCurrent = step.num === currentStep;
                    const IconComp = step.icon;
                    return (
                      <div
                        key={step.num}
                        onClick={() => {
                          if (step.num < currentStep) setCurrentStep(step.num);
                        }}
                        className={`flex flex-col md:flex-row items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl transition cursor-pointer select-none ${
                          isCurrent
                            ? "bg-[#25D366]/10 border border-[#25D366]/40 text-[#25D366]"
                            : isPassed
                              ? "bg-zinc-900/40 border border-white/[0.06] text-white hover:border-white/20"
                              : "text-zinc-600 border border-transparent"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                            isCurrent
                              ? "bg-[#25D366] text-black"
                              : isPassed
                                ? "bg-emerald-500/20 text-[#25D366]"
                                : "bg-zinc-900 text-zinc-600"
                          }`}
                        >
                          {isPassed ? <Check className="w-4 h-4" /> : step.num}
                        </div>
                        <div className="hidden md:block text-left">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block leading-none">
                            Etapa 0{step.num}
                          </span>
                          <span
                            className={`text-xs font-bold leading-tight block ${
                              isCurrent ? "text-[#25D366]" : isPassed ? "text-zinc-200" : "text-zinc-500"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                ETAPA 1: O QUE VOCÊ PRECISA? (Título, Categorias, Descrição, Vagas)
            ══════════════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <div className="bg-zinc-950/80 border border-white/[0.08] rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2 border-b border-white/[0.08] pb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#25D366]" />
                    <span>Dados do Serviço</span>
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Defina o título, a categoria correspondente e detalhe o que precisa ser feito.
                  </p>
                </div>

                {/* Título */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-200 block">
                    Título da Necessidade *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Instalação de 4 ventiladores de teto e troca de disjuntor"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    maxLength={100}
                    className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                  <div className="text-right text-xs text-zinc-500">
                    {formData.title.length}/100 caracteres
                  </div>
                </div>

                {/* Categoria */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-200 block">
                    Categoria Principal *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {Object.keys(WEB_SUBCATEGORIES).map((catKey) => {
                      const catLabels: Record<string, string> = {
                        "reformas-reparos": "Reformas & Obras",
                        "servicos-domesticos": "Serviços Domésticos",
                        "assistencia-tecnica": "Assistência Técnica",
                        automotivo: "Automotivo & Mecânica",
                        "beleza-estetica": "Beleza & Estética",
                        comercios: "Comércios & Lojas",
                        outros: "Outros Serviços",
                      };
                      const isSelected = formData.categoryId === catKey;
                      const subs = WEB_SUBCATEGORIES[catKey];
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              categoryId: catKey,
                              categoryName: catLabels[catKey],
                              subcategoryId: subs[0]?.id || "",
                              subcategoryName: subs[0]?.name || "",
                            });
                          }}
                          className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                            isSelected
                              ? "bg-[#25D366]/15 border-[#25D366] text-[#25D366]"
                              : "bg-zinc-900/60 border-white/[0.08] text-zinc-300 hover:border-white/20"
                          }`}
                        >
                          <span className="text-xs md:text-sm font-bold">{catLabels[catKey]}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#25D366]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subcategoria */}
                {WEB_SUBCATEGORIES[formData.categoryId] && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">
                      Especialidade / Subcategoria
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WEB_SUBCATEGORIES[formData.categoryId].map((sub) => {
                        const isSelected = formData.subcategoryId === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                subcategoryId: sub.id,
                                subcategoryName: sub.name,
                              });
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                              isSelected
                                ? "bg-[#25D366] text-black border-[#25D366]"
                                : "bg-zinc-900 border-white/[0.08] text-zinc-300 hover:border-white/20"
                            }`}
                          >
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Descrição */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-200 block">
                    Descrição Detalhada do Pedido *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Descreva detalhadamente o serviço que precisa ser realizado, dimensões, ferramentas necessárias, estado atual e qualquer informação relevante."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl p-4 text-sm text-white placeholder-zinc-500 focus:outline-none transition resize-none"
                  />
                  <div className="text-right text-xs text-zinc-500">
                    Mínimo 10 caracteres ({formData.description.length})
                  </div>
                </div>

                {/* Quantidade de Profissionais */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-200 block">
                    Quantidade de Profissionais Necessários
                  </label>
                  <div className="flex items-center gap-4 bg-zinc-900 border border-white/[0.1] rounded-xl p-2 w-fit">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          requiredProfessionals: Math.max(1, formData.requiredProfessionals - 1),
                        })
                      }
                      className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-sm text-white px-2">
                      {formData.requiredProfessionals} {formData.requiredProfessionals === 1 ? "profissional" : "profissionais"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          requiredProfessionals: formData.requiredProfessionals + 1,
                        })
                      }
                      className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleNext}
                    className="bg-[#25D366] hover:bg-[#22C55E] text-black font-black px-8 py-3.5 h-12 rounded-xl transition shadow-lg shadow-[#25D366]/20 flex items-center gap-2"
                  >
                    <span>Continuar: Prazos e Valores</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                ETAPA 2: PRAZOS E VALORES (Datas, Horários, Orçamento)
            ══════════════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <div className="bg-zinc-950/80 border border-white/[0.08] rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2 border-b border-white/[0.08] pb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-[#25D366]" />
                    <span>Prazos e Valores</span>
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Defina quando o serviço deve ser executado e o valor estimado que você oferece.
                  </p>
                </div>

                {/* Datas */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">
                      Data de Início Desejada *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">
                      Data de Término (Opcional)
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Horários */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">
                      Horário Inicial (Opcional)
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">
                      Horário Final (Opcional)
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-200 block">
                    Forma de Pagamento Pretendida *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        { id: "total", label: "Valor Total", icon: DollarSign },
                        { id: "diaria", label: "Por Diária", icon: Calendar },
                        { id: "hora", label: "Por Hora", icon: Clock },
                        { id: "a_combinar", label: "A Combinar", icon: Handshake },
                      ] as const
                    ).map((opt) => {
                      const isSelected = formData.paymentType === opt.id;
                      const IconOpt = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentType: opt.id })}
                          className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition text-center ${
                            isSelected
                              ? "bg-[#25D366]/15 border-[#25D366] text-[#25D366]"
                              : "bg-zinc-900/60 border-white/[0.08] text-zinc-400 hover:border-white/20"
                          }`}
                        >
                          <IconOpt className="w-5 h-5" />
                          <span className="text-xs font-bold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Valor Oferecido */}
                {formData.paymentType !== "a_combinar" && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">
                      Valor Oferecido (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                        R$
                      </span>
                      <input
                        type="text"
                        placeholder="250,00"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl pl-12 pr-4 py-3.5 text-base font-bold text-white focus:outline-none transition"
                      />
                    </div>
                  </div>
                )}

                {/* Info Card sobre Pagamento Direto */}
                <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-5 flex items-start gap-4 text-xs md:text-sm text-zinc-300">
                  <Info className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-white block font-bold">
                      Pagamento 100% Direto e Sem Intermediação
                    </strong>
                    <p className="leading-relaxed text-zinc-400">
                      O valor informado é o valor estimado oferecido por você. O pagamento do serviço será combinado e acertado diretamente entre você e o profissional contratado (fora do XamaJá / WhatsApp).
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-4 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    className="border border-white/10 text-white hover:bg-zinc-800 px-6 h-12 rounded-xl"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-[#25D366] hover:bg-[#22C55E] text-black font-black px-8 py-3.5 h-12 rounded-xl transition shadow-lg shadow-[#25D366]/20 flex items-center gap-2"
                  >
                    <span>Continuar: Localização</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                ETAPA 3: LOCALIZAÇÃO & MAPA (CEP, Endereço, Leaflet)
            ══════════════════════════════════════════════════════ */}
            {currentStep === 3 && (
              <div className="bg-zinc-950/80 border border-white/[0.08] rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2 border-b border-white/[0.08] pb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-[#25D366]" />
                    <span>Localização do Serviço</span>
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Informe o local e ajuste o marcador no mapa para que profissionais próximos vejam a demanda.
                  </p>
                </div>

                {/* CEP */}
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">
                      CEP (Busca Automática)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: 12900-000"
                        value={formData.cep}
                        onChange={(e) => handleCepSearch(e.target.value)}
                        maxLength={9}
                        className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition"
                      />
                      {isSearchingCep && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">
                      Logradouro / Rua
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Av. Salvador Markowicz"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Número, Complemento, Bairro e Cidade */}
                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">Número</label>
                    <input
                      type="text"
                      placeholder="Ex: 120"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">Complemento</label>
                    <input
                      type="text"
                      placeholder="Apto, Bloco..."
                      value={formData.complement}
                      onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">Bairro</label>
                    <input
                      type="text"
                      placeholder="Ex: Taboão / Centro"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-200 block">Cidade *</label>
                    <input
                      type="text"
                      placeholder="Ex: Bragança Paulista"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Mapa Leaflet */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-zinc-200 block">
                      Ponto Exato no Mapa (Clique ou arraste o marcador verde)
                    </label>
                    {formData.latitude && formData.longitude && (
                      <span className="text-xs text-zinc-500 font-mono">
                        {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                      </span>
                    )}
                  </div>
                  <div
                    ref={mapContainerRef}
                    className="w-full h-72 rounded-2xl overflow-hidden border border-white/[0.1] shadow-inner bg-zinc-900 z-10"
                  />
                </div>

                {/* Ações */}
                <div className="pt-4 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    className="border border-white/10 text-white hover:bg-zinc-800 px-6 h-12 rounded-xl"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-[#25D366] hover:bg-[#22C55E] text-black font-black px-8 py-3.5 h-12 rounded-xl transition shadow-lg shadow-[#25D366]/20 flex items-center gap-2"
                  >
                    <span>Continuar: Requisitos & Fotos</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                ETAPA 4: REQUISITOS & FOTOS (Observações, Uploads)
            ══════════════════════════════════════════════════════ */}
            {currentStep === 4 && (
              <div className="bg-zinc-950/80 border border-white/[0.08] rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2 border-b border-white/[0.08] pb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Camera className="w-6 h-6 text-[#25D366]" />
                    <span>Requisitos e Fotos</span>
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Anexe fotos do local/item e indique se há requisitos ou observações especiais.
                  </p>
                </div>

                {/* Requisitos */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-200 block">
                    Requisitos do Profissional (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Trazer escada alta, ferramentas próprias, ter certificação NR10, etc."
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl p-4 text-sm text-white placeholder-zinc-500 focus:outline-none transition resize-none"
                  />
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-200 block">
                    Observações e Acesso ao Local (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Condomínio com portaria, horário permitido até as 17h, estacionamento para veículos grandes."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/[0.1] focus:border-[#25D366] rounded-xl p-4 text-sm text-white placeholder-zinc-500 focus:outline-none transition resize-none"
                  />
                </div>

                {/* Upload de Fotos */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-zinc-200 block">
                      Fotos do Local ou Item ({formData.photos.length}/5)
                    </label>
                    <span className="text-xs text-zinc-500">JPG, PNG ou WEBP até 10MB</span>
                  </div>

                  {formData.photos.length < 5 && (
                    <label className="border-2 border-dashed border-white/[0.15] hover:border-[#25D366]/50 bg-zinc-900/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition group">
                      <input
                        type="file"
                        multiple
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:scale-110 flex items-center justify-center text-[#25D366] transition">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-white block">
                          Clique ou arraste imagens para fazer upload
                        </span>
                        <span className="text-xs text-zinc-500">
                          {isUploadingPhoto ? "Enviando imagem..." : "Até 5 fotos"}
                        </span>
                      </div>
                    </label>
                  )}

                  {/* Preview das fotos */}
                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                      {formData.photos.map((photoUrl, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.1] group bg-zinc-900"
                        >
                          <img
                            src={photoUrl}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 hover:bg-red-500 text-white flex items-center justify-center transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="pt-4 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    className="border border-white/10 text-white hover:bg-zinc-800 px-6 h-12 rounded-xl"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-[#25D366] hover:bg-[#22C55E] text-black font-black px-8 py-3.5 h-12 rounded-xl transition shadow-lg shadow-[#25D366]/20 flex items-center gap-2"
                  >
                    <span>Revisar Necessidade</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                ETAPA 5: REVISÃO COMPLETA E PUBLICAÇÃO
            ══════════════════════════════════════════════════════ */}
            {currentStep === 5 && (
              <div className="bg-zinc-950/80 border border-white/[0.08] rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2 border-b border-white/[0.08] pb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-[#25D366]" />
                    <span>Revisão e Confirmação</span>
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Confira todos os dados informados antes de publicar o seu pedido no XamaJá.
                  </p>
                </div>

                {/* Grid de Resumo */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Card 1: Serviço & Detalhes */}
                  <div className="bg-zinc-900/60 border border-white/[0.08] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#25D366]">
                        <Briefcase className="w-4 h-4" />
                        <span>Serviço</span>
                      </div>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="text-xs font-bold text-[#25D366] hover:underline"
                      >
                        Editar
                      </button>
                    </div>

                    <h3 className="text-lg font-black text-white">{formData.title}</h3>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-lg bg-white/[0.06] border border-white/[0.1] text-xs font-bold text-zinc-300">
                        {formData.categoryName}
                      </span>
                      {formData.subcategoryName && (
                        <span className="px-3 py-1 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-xs font-bold text-[#25D366]">
                          {formData.subcategoryName}
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-lg bg-white/[0.06] border border-white/[0.1] text-xs font-bold text-zinc-300">
                        {formData.requiredProfessionals} {formData.requiredProfessionals === 1 ? "vaga" : "vagas"}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-400 leading-relaxed pt-1">
                      {formData.description}
                    </p>
                  </div>

                  {/* Card 2: Prazos & Valores */}
                  <div className="bg-zinc-900/60 border border-white/[0.08] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#25D366]">
                        <DollarSign className="w-4 h-4" />
                        <span>Prazos & Valores</span>
                      </div>
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="text-xs font-bold text-[#25D366] hover:underline"
                      >
                        Editar
                      </button>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Data de Início:</span>
                        <strong className="text-white">
                          {formData.startDate} {formData.endDate ? `até ${formData.endDate}` : ""}
                        </strong>
                      </div>

                      {(formData.startTime || formData.endTime) && (
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Horário:</span>
                          <strong className="text-white">
                            {formData.startTime || "--:--"} às {formData.endTime || "--:--"}
                          </strong>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Forma de Pagamento:</span>
                        <strong className="text-white">
                          {paymentLabels[formData.paymentType]}
                        </strong>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                        <span className="text-zinc-400">Valor Oferecido:</span>
                        <strong className="text-base text-[#25D366] font-black">
                          {formData.paymentType === "a_combinar"
                            ? "A combinar diretamente"
                            : formData.budget
                              ? `R$ ${formData.budget}`
                              : "A combinar"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Localização */}
                  <div className="bg-zinc-900/60 border border-white/[0.08] rounded-2xl p-6 space-y-4 md:col-span-2">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#25D366]">
                        <MapPin className="w-4 h-4" />
                        <span>Localização</span>
                      </div>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="text-xs font-bold text-[#25D366] hover:underline"
                      >
                        Editar
                      </button>
                    </div>

                    <p className="text-sm font-semibold text-white">
                      {formData.address ? `${formData.address}` : ""}
                      {formData.number ? `, ${formData.number}` : ""}
                      {formData.neighborhood ? ` - ${formData.neighborhood}` : ""}
                      {` - ${formData.city}`}
                      {formData.cep ? ` (CEP: ${formData.cep})` : ""}
                    </p>

                    <div
                      ref={mapContainerRef}
                      className="w-full h-48 rounded-xl overflow-hidden border border-white/[0.08] bg-zinc-900 pointer-events-none"
                    />
                  </div>

                  {/* Card 4: Fotos */}
                  {formData.photos.length > 0 && (
                    <div className="bg-zinc-900/60 border border-white/[0.08] rounded-2xl p-6 space-y-4 md:col-span-2">
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#25D366]">
                          <Camera className="w-4 h-4" />
                          <span>Fotos Anexadas ({formData.photos.length})</span>
                        </div>
                        <button
                          onClick={() => setCurrentStep(4)}
                          className="text-xs font-bold text-[#25D366] hover:underline"
                        >
                          Editar
                        </button>
                      </div>

                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {formData.photos.map((p, idx) => (
                          <img
                            key={idx}
                            src={p}
                            alt={`Foto ${idx + 1}`}
                            className="w-20 h-20 rounded-xl object-cover border border-white/[0.1] flex-shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Alerta de Contato e Pagamento Direto */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4 text-xs md:text-sm text-zinc-300">
                  <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-amber-300 block font-bold">
                      Contato Direto via WhatsApp
                    </strong>
                    <p className="text-zinc-400 leading-relaxed">
                      Ao confirmar, seu pedido ficará acessível para profissionais da região entrarem em contato com você via WhatsApp. O XamaJá não intermedia nem cobra comissões sobre os serviços prestados.
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-4 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    disabled={isSubmitting}
                    onClick={handlePrev}
                    className="border border-white/10 text-white hover:bg-zinc-800 px-6 h-12 rounded-xl"
                  >
                    Voltar
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    onClick={handleFinalSubmit}
                    className="bg-[#25D366] hover:bg-[#22C55E] text-black font-black px-10 py-3.5 h-12 rounded-xl transition shadow-lg shadow-[#25D366]/20 flex items-center gap-2 text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Publicando...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirmar e Publicar Necessidade</span>
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                ETAPA 6: SUCESSO!
            ══════════════════════════════════════════════════════ */}
            {currentStep === 6 && (
              <div className="bg-zinc-950/80 border border-white/[0.08] rounded-3xl p-8 md:p-14 text-center max-w-2xl mx-auto shadow-2xl space-y-6 animate-in zoom-in-95 duration-400">
                <div className="w-20 h-20 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    Necessidade Publicada com Sucesso!
                  </h2>
                  <p className="text-sm md:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Sua demanda foi registrada e já está visível para os profissionais e comércios qualificados de {formData.city}.
                  </p>
                </div>

                {publishedNeedId && (
                  <div className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl p-4 inline-block mx-auto">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">
                      Código de Referência
                    </span>
                    <strong className="text-sm font-mono text-[#25D366]">{publishedNeedId}</strong>
                  </div>
                )}

                <div className="bg-zinc-900/40 border border-white/[0.06] rounded-2xl p-5 text-left text-xs md:text-sm text-zinc-400 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Sparkles className="w-4 h-4 text-[#25D366]" />
                    <span>Próximos Passos:</span>
                  </div>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Profissionais interessados entrarão em contato via WhatsApp.</li>
                    <li>Você poderá negociar valores, horários e tirar dúvidas diretamente.</li>
                    <li>Escolha a proposta mais adequada com total segurança.</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  {publishedNeedId && (
                    <Button
                      onClick={() => (window.location.href = `/necessidade/${publishedNeedId}`)}
                      className="bg-[#25D366] hover:bg-[#22C55E] text-black font-black px-8 py-3.5 h-12 rounded-xl transition shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2"
                    >
                      <span>Abrir Necessidade Criada</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/")}
                    className="border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white px-6 h-12 rounded-xl text-sm font-semibold"
                  >
                    <span>Página Inicial</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setFormData(INITIAL_FORM);
                      setCurrentStep(1);
                    }}
                    className="border border-white/10 text-white hover:bg-zinc-800 px-6 h-12 rounded-xl text-sm font-semibold"
                  >
                    Publicar Outra
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-zinc-600">
        <p>© 2024 XamaJá. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
