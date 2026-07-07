import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowRight,
  LogOut,
  Store,
  Wrench,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
  Edit2,
  ChevronLeft,
  X,
  CreditCard,
  Compass,
  Users,
  Copy,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface BusinessProfile {
  id: string;
  name: string;
  category: string | null;
  categoryId: string | null;
  city: string | null;
  neighborhood: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  address: string | null;
  avatarUri: string | null;
  coverUri: string | null;
  gallery: string[];
  isActive: boolean;
  status: "pendente" | "ativo" | "rejeitado";
  services: Service[];
  latitude: number | null;
  longitude: number | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  tipo: "prestador" | "comercio" | "cliente";
}

interface BusinessPermissions {
  maxServicos: number;
  status: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function Parceiro() {
  const [location, setLocation] = useLocation();
  // Page states: 'select' | 'login' | 'register' | 'dashboard' | 'complete-profile'
  const [view, setView] = useState<
    "select" | "login" | "register" | "dashboard" | "complete-profile"
  >("select");
  const [isLoading, setIsLoading] = useState(false);

  // Session states
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [partner, setPartner] = useState<any | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [permissions, setPermissions] = useState<BusinessPermissions | null>(
    null
  );
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Auth fields
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regWhatsapp, setRegWhatsapp] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regType, setRegType] = useState<"prestador" | "comercio" | "cliente">(
    "prestador"
  );

  // Complete profile fields
  const [completeType, setCompleteType] = useState<"prestador" | "comercio">(
    "prestador"
  );
  const [completeWhatsapp, setCompleteWhatsapp] = useState("");
  const [completeCity, setCompleteCity] = useState("");

  // Dashboard active tab
  const [activeTab, setActiveTab] = useState<
    "dados" | "localizacao" | "fotos" | "servicos" | "assinatura"
  >("dados");

  // Profile Form States
  const [busName, setBusName] = useState("");
  const [busDescription, setBusDescription] = useState("");
  const [busPhone, setBusPhone] = useState("");
  const [busWhatsapp, setBusWhatsapp] = useState("");
  const [busCategoryId, setBusCategoryId] = useState("");
  const [busCategoryName, setBusCategoryName] = useState("");

  const [busAddress, setBusAddress] = useState("");
  const [busCity, setBusCity] = useState("");
  const [busNeighborhood, setBusNeighborhood] = useState("");
  const [busCep, setBusCep] = useState("");

  const [busAvatarUri, setBusAvatarUri] = useState("");
  const [busCoverUri, setBusCoverUri] = useState("");
  const [galleryInput, setGalleryInput] = useState("");
  const [busGallery, setBusGallery] = useState<string[]>([]);

  // Services Form/Modal States
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [srvName, setSrvName] = useState("");
  const [srvDescription, setSrvDescription] = useState("");
  const [srvPrice, setSrvPrice] = useState("");

  // Check storage on load and set page title
  useEffect(() => {
    document.title = "Área de Parceiros XamaJá";

    // Check for auth error from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get("auth_error");
    if (authError) {
      toast.error(decodeURIComponent(authError));
      window.history.replaceState(null, "", window.location.pathname);
    }

    const completeRegParam = urlParams.get("complete_registration");
    if (completeRegParam) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    // Check for session_token and user profile passed in query parameters from OAuth flow
    const sessionTokenParam = urlParams.get("session_token");
    const userParam = urlParams.get("user");
    if (sessionTokenParam && userParam) {
      localStorage.setItem("bp_session_token", sessionTokenParam);
      localStorage.setItem("bp_user_profile", userParam);
      const cleanUrl = window.location.pathname + (urlParams.get("complete_registration") ? "?complete_registration=true" : "");
      window.history.replaceState(null, "", cleanUrl);
    }

    // Check for existing session
    const token = localStorage.getItem("bp_session_token");
    const savedUser = localStorage.getItem("bp_user_profile");
    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setSessionToken(token);
      setUser(parsedUser);
      
      if (parsedUser.tipo === "prestador" || parsedUser.tipo === "comercio") {
        setView("dashboard");
        if (location === "/parceiros" || location === "/parceiro") {
          setLocation(location + "/dashboard");
        }
      } else if (completeRegParam || parsedUser.tipo === "cliente") {
        setView("complete-profile");
      } else {
        setView("dashboard");
        if (location === "/parceiros" || location === "/parceiro") {
          setLocation(location + "/dashboard");
        }
      }
    } else {
      // Not logged in: if trying to access dashboard, send to select/login
      if (location === "/parceiros/dashboard") {
        setLocation("/parceiros");
      } else if (location === "/parceiro/dashboard") {
        setLocation("/parceiro");
      }
      setView("select");
    }
  }, [location]);

  const handleGoogleLogin = () => {
    localStorage.setItem("oauth_redirect_target", "partner");
    window.location.href = "/api/auth/google";
  };

  // Fetch full profile info once session token is set
  useEffect(() => {
    if (sessionToken) {
      fetchProfile();
    }
  }, [sessionToken]);

  const fetchProfile = async () => {
    if (!sessionToken) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/business-partner/profile", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setBusiness(result.business);
        setPartner(result.partner);
        setReferrals(result.referrals || []);
        setPermissions(result.permissions);
        setCategories(result.categories || []);

        // Populate form fields
        if (result.business) {
          setBusName(result.business.name || "");
          setBusDescription(result.business.description || "");
          setBusPhone(result.business.phone || "");
          setBusWhatsapp(result.business.whatsapp || "");
          setBusCategoryId(result.business.categoryId || "");
          setBusCategoryName(result.business.category || "");

          setBusAddress(result.business.address || "");
          setBusCity(result.business.city || "");
          setBusNeighborhood(result.business.neighborhood || "");
          setBusCep(result.business.cep || "");

          setBusAvatarUri(result.business.avatarUri || "");
          setBusCoverUri(result.business.coverUri || "");
          setBusGallery(result.business.gallery || []);
          setServicesList(result.business.services || []);
        } else if (result.partner) {
          setBusName(result.partner.nome || "");
          setBusWhatsapp(result.partner.telefone || "");
          setBusCity(result.partner.cidade || "");
        }
      } else {
        toast.error(result.error || "Falha ao carregar informações do perfil.");
        if (response.status === 401) {
          handleLogout();
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("Erro ao carregar dados do negócio.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/business-partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: authEmail,
          password: authPassword,
          whatsapp: regWhatsapp,
          city: regCity,
          type: regType,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(result.message || "Cadastro realizado com sucesso!");
        // Clear fields and switch to login
        setRegName("");
        setRegWhatsapp("");
        setRegCity("");
        setView("login");
      } else {
        toast.error(result.error || "Falha ao realizar cadastro.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Erro de conexão ao realizar cadastro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/business-partner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        localStorage.setItem("bp_session_token", result.sessionToken);
        localStorage.setItem("bp_user_profile", JSON.stringify(result.user));

        setSessionToken(result.sessionToken);
        setUser(result.user);
        setPartner(result.partner);
        toast.success(`Bem-vindo, ${result.user.name}!`);
        setView("dashboard");
        if (location === "/parceiros" || location === "/parceiro") {
          setLocation(location + "/dashboard");
        }
      } else {
        toast.error(
          result.error || "Falha no login. Verifique suas credenciais."
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Erro de conexão ao fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      setView("login");
      return;
    }
    if (!completeWhatsapp || !completeCity) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/business-partner/complete-registration", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          type: completeType,
          whatsapp: completeWhatsapp,
          city: completeCity,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success("Cadastro concluído com sucesso!");
        if (user) {
          const updatedUser = { ...user, tipo: completeType };
          setUser(updatedUser);
          localStorage.setItem("bp_user_profile", JSON.stringify(updatedUser));
        }
        await fetchProfile();
        setView("dashboard");
        if (location === "/parceiros" || location === "/parceiro") {
          setLocation(location + "/dashboard");
        }
      } else {
        toast.error(result.error || "Erro ao completar cadastro.");
      }
    } catch (err) {
      console.error("Error completing registration:", err);
      toast.error("Erro de conexão ao salvar informações.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bp_session_token");
    localStorage.removeItem("bp_user_profile");
    setSessionToken(null);
    setUser(null);
    setBusiness(null);
    setPartner(null);
    setReferrals([]);
    setPermissions(null);
    setCategories([]);
    setView("select");
    toast.success("Sessão encerrada.");
    setLocation("/");
  };

  const saveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sessionToken) return;

    setIsLoading(true);
    try {
      const payload =
        user?.tipo === "cliente"
          ? {
              name: busName,
              whatsapp: busWhatsapp,
              city: busCity,
            }
          : {
              name: busName,
              description: busDescription,
              phone: busPhone,
              whatsapp: busWhatsapp,
              categoryId: busCategoryId || null,
              category: busCategoryName || null,
              address: busAddress,
              city: busCity,
              neighborhood: busNeighborhood,
              cep: busCep,
              avatarUri: busAvatarUri || null,
              coverUri: busCoverUri || null,
              gallery: busGallery,
              services: servicesList,
            };

      const response = await fetch("/api/business-partner/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(result.message || "Perfil atualizado com sucesso!");
        // Refresh local business status
        fetchProfile();
      } else {
        toast.error(result.error || "Falha ao salvar dados.");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Erro de conexão ao salvar informações.");
    } finally {
      setIsLoading(false);
    }
  };

  // Category select helper
  const handleCategorySelect = (id: string) => {
    setBusCategoryId(id);
    const cat = categories.find(c => c.id === id);
    setBusCategoryName(cat ? cat.name : "");
  };

  // Gallery URL handlers
  const addGalleryImage = () => {
    if (!galleryInput) return;
    if (
      !galleryInput.startsWith("http://") &&
      !galleryInput.startsWith("https://")
    ) {
      toast.error("Insira uma URL válida.");
      return;
    }
    setBusGallery([...busGallery, galleryInput]);
    setGalleryInput("");
    toast.success(
      "Foto adicionada temporariamente. Salve o perfil para confirmar."
    );
  };

  const removeGalleryImage = (index: number) => {
    setBusGallery(busGallery.filter((_, i) => i !== index));
    toast.success("Foto removida. Salve o perfil para confirmar.");
  };

  // Helper to upload base64 images from browser file input
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (
    file: File,
    onSuccess: (url: string) => void
  ) => {
    if (!sessionToken) {
      toast.error("Você precisa estar logado para fazer upload.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo excede o limite de tamanho de 5MB.");
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading("Enviando imagem...");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(",")[1];
        const fileType = file.type;

        try {
          const response = await fetch("/api/business-partner/upload-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({ base64Data, fileType }),
          });

          const result = await response.json();
          if (response.ok && result.success && result.publicUrl) {
            onSuccess(result.publicUrl);
            toast.success("Imagem enviada com sucesso!", { id: toastId });
          } else {
            toast.error(result.error || "Erro ao fazer upload.", { id: toastId });
          }
        } catch (err) {
          console.error("Upload fetch error:", err);
          toast.error("Erro ao conectar com o servidor para upload.", { id: toastId });
        } finally {
          setIsUploadingImage(false);
        }
      };
    } catch (err) {
      console.error("FileReader error:", err);
      toast.error("Erro ao processar arquivo local.", { id: toastId });
      setIsUploadingImage(false);
    }
  };

  // Service limit check
  const maxServicos = permissions?.maxServicos ?? 1;
  const isLimitReached =
    maxServicos !== -1 && servicesList.length >= maxServicos;

  // Service handlers
  const openAddServiceModal = () => {
    if (isLimitReached) {
      toast.warning("Você atingiu o limite de serviços do seu plano.");
      return;
    }
    setEditingServiceId(null);
    setSrvName("");
    setSrvDescription("");
    setSrvPrice("");
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (srv: Service) => {
    setEditingServiceId(srv.id);
    setSrvName(srv.name);
    setSrvDescription(srv.description);
    setSrvPrice(srv.price.toString());
    setIsServiceModalOpen(true);
  };

  const saveService = () => {
    if (!srvName) {
      toast.error("O nome do serviço é obrigatório.");
      return;
    }
    const priceNum = parseFloat(srvPrice.replace(",", ".")) || 0;

    let updatedList: Service[];
    if (editingServiceId) {
      // Edit mode
      updatedList = servicesList.map(s =>
        s.id === editingServiceId
          ? {
              ...s,
              name: srvName,
              description: srvDescription,
              price: priceNum,
            }
          : s
      );
      toast.success("Serviço editado.");
    } else {
      // Add mode
      if (isLimitReached) {
        toast.error("Não foi possível adicionar. Limite excedido.");
        return;
      }
      const newService: Service = {
        id: `srv_${Date.now()}`,
        name: srvName,
        description: srvDescription,
        price: priceNum,
      };
      updatedList = [...servicesList, newService];
      toast.success("Serviço adicionado.");
    }

    setServicesList(updatedList);
    setIsServiceModalOpen(false);

    // Save changes to database immediately
    setTimeout(() => {
      // Auto-save the profile with updated services
      setIsLoading(true);
      const payload = {
        name: busName,
        description: busDescription,
        phone: busPhone,
        whatsapp: busWhatsapp,
        categoryId: busCategoryId || null,
        category: busCategoryName || null,
        address: busAddress,
        city: busCity,
        neighborhood: busNeighborhood,
        avatarUri: busAvatarUri || null,
        coverUri: busCoverUri || null,
        gallery: busGallery,
        services: updatedList,
      };

      fetch("/api/business-partner/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(payload),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            toast.success("Lista de serviços salva no servidor!");
            fetchProfile();
          } else {
            toast.error(data.error || "Falha ao salvar serviços.");
          }
        })
        .catch(() => toast.error("Erro ao sincronizar serviços."))
        .finally(() => setIsLoading(false));
    }, 100);
  };

  const deleteService = (id: string) => {
    const updatedList = servicesList.filter(s => s.id !== id);
    setServicesList(updatedList);
    toast.success("Serviço excluído.");

    // Sync deletion to server
    setTimeout(() => {
      setIsLoading(true);
      const payload = {
        name: busName,
        description: busDescription,
        phone: busPhone,
        whatsapp: busWhatsapp,
        categoryId: busCategoryId || null,
        category: busCategoryName || null,
        address: busAddress,
        city: busCity,
        neighborhood: busNeighborhood,
        avatarUri: busAvatarUri || null,
        coverUri: busCoverUri || null,
        gallery: busGallery,
        services: updatedList,
      };

      fetch("/api/business-partner/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(payload),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            toast.success("Sincronizado com o servidor!");
            fetchProfile();
          } else {
            toast.error(data.error || "Erro ao atualizar no servidor.");
          }
        })
        .catch(() => toast.error("Erro ao conectar."))
        .finally(() => setIsLoading(false));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img
              src="/assets/images/logo-xamaja.png"
              alt="XamaJá"
              className="h-10 w-auto object-contain"
            />
          </a>
          <nav className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Início
            </a>
            {sessionToken && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition"
              >
                <LogOut className="h-4.5 w-4.5" /> Sair
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {view === "select" && (
          <section className="flex-1 py-16 md:py-28 bg-background flex items-center justify-center">
            <div className="container mx-auto px-4 max-w-4xl text-center space-y-12">
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-primary text-xs font-semibold uppercase tracking-wider">
                    Portal do Parceiro
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
                  Faça parte do <span className="text-primary">XamaJá</span>
                </h1>
                <p className="text-base md:text-xl text-muted-foreground leading-relaxed">
                  Cadastre seu negócio e seja encontrado por clientes da sua
                  região. Potencialize suas vendas e serviços!
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {/* Já sou parceiro */}
                <div className="group bg-card hover:bg-card/80 border border-border hover:border-primary/50 rounded-3xl p-8 transition-all duration-300 shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="p-4 bg-zinc-800/80 rounded-2xl border border-zinc-700/50 text-white group-hover:scale-110 transition-transform duration-300">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black text-white">
                      Já sou parceiro
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Acesse sua conta para gerenciar seu perfil de negócio,
                      fotos, serviços e verificação.
                    </p>
                  </div>
                  <Button
                    onClick={() => setView("login")}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-12 rounded-xl mt-8 flex items-center justify-center gap-2 border border-zinc-700/60"
                  >
                    <span>Entrar</span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </Button>
                </div>

                {/* Ainda não sou parceiro */}
                <div className="group bg-card hover:bg-card/80 border border-border hover:border-primary/50 rounded-3xl p-8 transition-all duration-300 shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-primary group-hover:scale-110 transition-transform duration-300">
                      <Store className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-black text-white">
                      Ainda não sou parceiro
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Crie uma conta em minutos. Escolha se você é prestador de
                      serviço ou comércio e comece.
                    </p>
                  </div>
                  <Button
                    onClick={() => setView("register")}
                    className="w-full bg-primary text-primary-foreground font-black uppercase tracking-wider h-12 rounded-xl mt-8 flex items-center justify-center gap-2 hover:bg-primary/95 transition shadow-lg shadow-primary/10"
                  >
                    <span>Criar conta</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Complete Profile View */}
        {view === "complete-profile" && (
          <section className="flex-1 py-16 bg-background flex items-center justify-center">
            <div className="container mx-auto px-4 max-w-md space-y-6">
              <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="space-y-2 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    <span className="text-primary text-[10px] font-bold uppercase tracking-wider">
                      Google Conectado
                    </span>
                  </div>
                  <h1 className="text-3xl font-black text-white">
                    Completar Cadastro
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Para acessar o painel de parceiros, precisamos de mais alguns dados do seu negócio.
                  </p>
                </div>

                {/* Partner Type Selector cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div
                    onClick={() => setCompleteType("prestador")}
                    className={`cursor-pointer rounded-2xl p-4 border flex flex-col items-center gap-2 text-center transition-all duration-300 ${
                      completeType === "prestador"
                        ? "border-primary bg-primary/5 text-white shadow-lg shadow-primary/5"
                        : "border-border bg-background text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <Wrench
                      className={`h-6 w-6 transition-colors duration-300 ${completeType === "prestador" ? "text-primary" : "text-zinc-500"}`}
                    />
                    <span className="text-xs font-bold leading-tight">
                      Prestador de Serviços
                    </span>
                  </div>
                  <div
                    onClick={() => setCompleteType("comercio")}
                    className={`cursor-pointer rounded-2xl p-4 border flex flex-col items-center gap-2 text-center transition-all duration-300 ${
                      completeType === "comercio"
                        ? "border-primary bg-primary/5 text-white shadow-lg shadow-primary/5"
                        : "border-border bg-background text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <Store
                      className={`h-6 w-6 transition-colors duration-300 ${completeType === "comercio" ? "text-primary" : "text-zinc-500"}`}
                    />
                    <span className="text-xs font-bold leading-tight">
                      Comércio / Loja
                    </span>
                  </div>
                  <div
                    onClick={() => setCompleteType("cliente")}
                    className={`cursor-pointer rounded-2xl p-4 border flex flex-col items-center gap-2 text-center transition-all duration-300 ${
                      completeType === "cliente"
                        ? "border-primary bg-primary/5 text-white shadow-lg shadow-primary/5"
                        : "border-border bg-background text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <User
                      className={`h-6 w-6 transition-colors duration-300 ${completeType === "cliente" ? "text-primary" : "text-zinc-500"}`}
                    />
                    <span className="text-xs font-bold leading-tight">
                      Cliente (Indicador)
                    </span>
                  </div>
                </div>

                <form onSubmit={handleCompleteProfile} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-white uppercase tracking-wider">
                      WhatsApp / Celular
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                      <Input
                        type="tel"
                        placeholder="Ex: (11) 99999-9999"
                        required
                        value={completeWhatsapp}
                        onChange={e => setCompleteWhatsapp(e.target.value)}
                        className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Cidade de Atuação
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                      <Input
                        type="text"
                        placeholder="Ex: São Paulo"
                        required
                        value={completeCity}
                        onChange={e => setCompleteCity(e.target.value)}
                        className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground font-black uppercase tracking-wider h-12 rounded-xl mt-4 hover:bg-primary/95 transition shadow-lg shadow-primary/10 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="loader-btn w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Concluir Cadastro</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <button
                    onClick={handleLogout}
                    className="text-xs text-red-400 hover:text-red-300 font-bold transition hover:underline"
                  >
                    Sair da conta
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Login Form View */}
        {view === "login" && (
          <section className="flex-1 py-16 bg-background flex items-center justify-center">
            <div className="container mx-auto px-4 max-w-md space-y-6">
              <button
                onClick={() => setView("select")}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition group"
              >
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                Voltar para opções
              </button>

              <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-black text-white">
                    Acesse seu Painel
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Insira as credenciais do seu perfil de parceiro XamaJá.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      E-mail corporativo
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                      <Input
                        type="email"
                        placeholder="Ex: seu-negocio@exemplo.com"
                        required
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                        className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      Senha secreta
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        required
                        value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                        className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground font-black uppercase tracking-wider h-12 rounded-xl mt-4 hover:bg-primary/95 transition shadow-lg shadow-primary/10 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="loader-btn w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Entrar no Painel</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground font-semibold">ou continue com</span>
                  </div>
                </div>

                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleLogin}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-3 border border-zinc-700/60 transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  </svg>
                  Entrar com Google
                </Button>

                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    Ainda não tem conta de negócio?{" "}
                    <button
                      onClick={() => {
                        setView("register");
                        setAuthPassword("");
                      }}
                      className="text-primary font-bold hover:underline"
                    >
                      Criar conta
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Register Form View */}
        {view === "register" && (
          <section className="flex-1 py-12 bg-background flex items-center justify-center">
            <div className="container mx-auto px-4 max-w-xl space-y-6">
              <button
                onClick={() => setView("select")}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition group"
              >
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                Voltar para opções
              </button>

              <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-black text-white font-mono uppercase tracking-tight">
                    Criar Conta de Parceiro
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Preencha os campos abaixo para iniciar seu cadastro
                    corporativo.
                  </p>
                </div>

                {/* Partner Type Selector cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div
                    onClick={() => setRegType("prestador")}
                    className={`cursor-pointer rounded-2xl p-4 border flex flex-col items-center gap-2 text-center transition-all ${
                      regType === "prestador"
                        ? "border-primary bg-primary/5 text-white"
                        : "border-border bg-background text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <Wrench
                      className={`h-6 w-6 ${regType === "prestador" ? "text-primary" : "text-zinc-500"}`}
                    />
                    <span className="text-xs font-bold leading-tight">
                      Prestador
                    </span>
                  </div>
                  <div
                    onClick={() => setRegType("comercio")}
                    className={`cursor-pointer rounded-2xl p-4 border flex flex-col items-center gap-2 text-center transition-all ${
                      regType === "comercio"
                        ? "border-primary bg-primary/5 text-white"
                        : "border-border bg-background text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <Store
                      className={`h-6 w-6 ${regType === "comercio" ? "text-primary" : "text-zinc-500"}`}
                    />
                    <span className="text-xs font-bold leading-tight">
                      Comércio
                    </span>
                  </div>
                  <div
                    onClick={() => setRegType("cliente")}
                    className={`cursor-pointer rounded-2xl p-4 border flex flex-col items-center gap-2 text-center transition-all ${
                      regType === "cliente"
                        ? "border-primary bg-primary/5 text-white"
                        : "border-border bg-background text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <User
                      className={`h-6 w-6 ${regType === "cliente" ? "text-primary" : "text-zinc-500"}`}
                    />
                    <span className="text-xs font-bold leading-tight">
                      Cliente
                    </span>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-white uppercase tracking-wider">
                      {regType === "cliente"
                        ? "Nome Completo"
                        : "Nome Completo / Nome do Negócio"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                      <Input
                        type="text"
                        placeholder={
                          regType === "cliente"
                            ? "Ex: Pedro Silva"
                            : "Ex: Pedro Reformas ou Mercadinho Real"
                        }
                        required
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-white uppercase tracking-wider">
                        WhatsApp / Celular
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                        <Input
                          type="tel"
                          placeholder="Ex: (11) 99999-9999"
                          required
                          value={regWhatsapp}
                          onChange={e => setRegWhatsapp(e.target.value)}
                          className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-white uppercase tracking-wider">
                        Cidade
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                        <Input
                          type="text"
                          placeholder="Bragança Paulista"
                          required
                          value={regCity}
                          onChange={e => setRegCity(e.target.value)}
                          className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-white uppercase tracking-wider">
                      {regType === "cliente" ? "E-mail" : "E-mail corporativo"}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                      <Input
                        type="email"
                        placeholder={
                          regType === "cliente"
                            ? "Ex: seu-nome@exemplo.com"
                            : "Ex: contato@seu-negocio.com"
                        }
                        required
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                        className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Senha secreta
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        required
                        value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                        className="bg-background border-border pl-12 h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground font-black uppercase tracking-wider h-12 rounded-xl mt-4 hover:bg-primary/95 transition shadow-lg shadow-primary/10 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="loader-btn w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Criar Minha Conta</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    Já tem conta cadastrada?{" "}
                    <button
                      onClick={() => {
                        setView("login");
                        setAuthPassword("");
                      }}
                      className="text-primary font-bold hover:underline"
                    >
                      Acessar conta
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Dashboard Panel */}
        {view === "dashboard" && user && (
          <section className="flex-1 py-12 bg-background">
            <div className="container mx-auto px-4 max-w-6xl space-y-8">
              {user.tipo === "cliente" ? (
                /* Cliente/Usuário comum Referral Dashboard */
                <div className="space-y-8">
                  {/* Dashboard Top Header */}
                  <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>

                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-zinc-900 border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                        <User className="h-8 w-8 text-primary" />
                      </div>

                      <div className="space-y-1.5">
                        <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                          Olá, <span className="text-primary">{partner?.nome || user.name}</span>!
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground font-semibold bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700/50 flex items-center gap-1">
                            <User className="h-3 w-3 text-primary" />
                            Cliente Indicador
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1">
                            <ShieldCheck className="h-3 w-3" /> Programa de Indicações
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid for Referral Code and Referred List */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Referral details */}
                    <div className="lg:col-span-4 space-y-6">
                      <div className="bg-card border border-border rounded-3xl p-6 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                            <Users className="h-6 w-6" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-white">
                              Sua Identidade
                            </h2>
                            <p className="text-xs text-muted-foreground">
                              Indique novos parceiros
                            </p>
                          </div>
                        </div>

                        {partner && (
                          <>
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Seu Código Único
                              </span>
                              <div className="bg-background border border-border rounded-2xl px-6 py-4 flex items-center justify-center border-dashed border-primary/30">
                                <span className="text-3xl font-black tracking-widest text-primary font-mono">
                                  {partner.codigoIndicacao}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Link de Indicação
                              </span>
                              <div className="relative">
                                <input
                                  type="text"
                                  readOnly
                                  value={`${window.location.origin}/cadastro?ref=${partner.codigoIndicacao}`}
                                  className="w-full bg-background border border-border text-muted-foreground rounded-2xl pl-4 pr-14 py-3.5 focus:outline-none text-xs text-ellipsis overflow-hidden"
                                />
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/cadastro?ref=${partner.codigoIndicacao}`
                                    );
                                    setCopied(true);
                                    toast.success("Link de indicação copiado!");
                                    setTimeout(() => setCopied(false), 2000);
                                  }}
                                  className="absolute right-2 top-2 p-2 rounded-xl bg-card border border-border text-foreground hover:text-primary hover:border-primary/50 transition"
                                  title="Copiar Link"
                                >
                                  {copied ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-4 w-4 text-zinc-400" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </>
                        )}

                        <div className="pt-2 text-xs text-muted-foreground leading-relaxed flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-2xl p-4">
                          <CheckCircle className="h-4.5 w-4.5 text-primary flex-shrink-0 mt-0.5" />
                          <p>
                            Compartilhe este link com prestadores ou comércios. Ao
                            se cadastrarem, eles serão vinculados automaticamente à
                            sua conta.
                          </p>
                        </div>

                        {/* Edit Profile Form for Client */}
                        <div className="border-t border-border pt-6 space-y-4">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Editar Meus Dados
                          </h3>
                          <form onSubmit={saveProfile} className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Nome Completo
                              </label>
                              <Input
                                type="text"
                                required
                                value={busName}
                                onChange={e => setBusName(e.target.value)}
                                className="bg-background border-border h-10 rounded-xl focus-visible:ring-primary text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                WhatsApp / Celular
                              </label>
                              <Input
                                type="tel"
                                required
                                value={busWhatsapp}
                                onChange={e => setBusWhatsapp(e.target.value)}
                                className="bg-background border-border h-10 rounded-xl focus-visible:ring-primary text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Cidade
                              </label>
                              <Input
                                type="text"
                                required
                                value={busCity}
                                onChange={e => setBusCity(e.target.value)}
                                className="bg-background border-border h-10 rounded-xl focus-visible:ring-primary text-xs"
                              />
                            </div>
                            <Button
                              type="submit"
                              disabled={isLoading}
                              className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-10 rounded-xl text-xs flex items-center justify-center gap-1.5"
                            >
                              {isLoading ? "Salvando..." : "Salvar Dados"}
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>

                    {/* Right: Referrals list */}
                    <div className="lg:col-span-8">
                      <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden min-h-[400px] flex flex-col">
                        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card">
                          <div className="space-y-1">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                              Indicações Realizadas
                            </h2>
                            <p className="text-xs text-muted-foreground">
                              Acompanhe o andamento dos parceiros que você indicou
                            </p>
                          </div>
                          <span className="bg-zinc-800 text-zinc-200 px-3 py-1 rounded-full text-xs font-bold font-mono">
                            {referrals.length}{" "}
                            {referrals.length === 1 ? "indicação" : "indicações"}
                          </span>
                        </div>

                        {referrals.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-600">
                              <Users className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-base font-bold text-white">
                                Nenhuma indicação ainda
                              </p>
                              <p className="text-sm text-muted-foreground max-w-sm">
                                Compartilhe seu link exclusivo com prestadores
                                locais para começar a registrar indicações!
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-border bg-background/30">
                                  <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                    Profissional / Comércio
                                  </th>
                                  <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                    Telefone
                                  </th>
                                  <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                    Data
                                  </th>
                                  <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60">
                                {referrals.map(ref => (
                                  <tr
                                    key={ref.id}
                                    className="hover:bg-zinc-800/10 transition"
                                  >
                                    <td className="px-6 py-4">
                                      <span className="text-sm font-bold text-white">
                                        {ref.nomeIndicado}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-sm text-zinc-300 font-mono">
                                        {ref.telefoneIndicado}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-sm text-zinc-400">
                                        {new Date(ref.createdAt).toLocaleDateString(
                                          "pt-BR"
                                        )}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      {ref.status === "novo" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                          Novo
                                        </span>
                                      )}
                                      {ref.status === "contatado" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                          Contatado
                                        </span>
                                      )}
                                      {ref.status === "cadastrado" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                          Cadastrado
                                        </span>
                                      )}
                                      {ref.status === "ativo" && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                          Ativo
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Business partner dashboard */
                <div className="space-y-8">
                  {/* Dashboard Top Header */}
                  {business && (
                    <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>

                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {business.avatarUri ? (
                            <img
                              src={business.avatarUri}
                              alt="Logo Negócio"
                              className="w-full h-full object-cover"
                            />
                          ) : user.tipo === "comercio" ? (
                            <Store className="h-8 w-8 text-primary" />
                          ) : (
                            <Wrench className="h-8 w-8 text-primary" />
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                            {business.name || user.name}
                          </h1>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground font-semibold bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700/50 flex items-center gap-1">
                              {user.tipo === "comercio" ? (
                                <Store className="h-3 w-3 text-primary" />
                              ) : (
                                <Wrench className="h-3 w-3 text-primary" />
                              )}
                              {user.tipo === "comercio"
                                ? "Comércio"
                                : "Prestador de Serviço"}
                            </span>
                            {business.status === "pendente" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 gap-1 animate-pulse">
                                <Clock className="h-3 w-3" /> Pendente de Aprovação
                              </span>
                            )}
                            {business.status === "ativo" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1">
                                <ShieldCheck className="h-3 w-3" /> Negócio Ativo
                              </span>
                            )}
                            {business.status === "rejeitado" && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                Rejeitado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
                        <Button
                          onClick={() => saveProfile()}
                          disabled={isLoading}
                          className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 h-11 px-6 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                          {isLoading ? (
                            <span className="loader-btn w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                          ) : (
                            "Salvar Alterações"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Sub-warning for pending profiles */}
                  {business?.status === "pendente" && (
                    <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 text-amber-400 text-sm flex items-start gap-3">
                      <Clock className="h-5 w-5 flex-shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <strong>Seu negócio está pendente de aprovação:</strong>{" "}
                        Você já pode preencher os dados, cadastrar fotos e adicionar
                        serviços. No entanto, o seu perfil não aparecerá nas buscas
                        públicas dos clientes até que um administrador aprove seu
                        cadastro.
                      </div>
                    </div>
                  )}

                  {/* Tab Selector & Main Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-3 space-y-3">
                      {[
                        { id: "dados", label: "Dados do Negócio", icon: User },
                        {
                          id: "localizacao",
                          label: "Endereço & Localização",
                          icon: MapPin,
                        },
                        { id: "fotos", label: "Fotos & Galeria", icon: ImageIcon },
                        { id: "servicos", label: "Meus Serviços", icon: Wrench },
                        {
                          id: "assinatura",
                          label: "Plano & Limites",
                          icon: CreditCard,
                        },
                      ].map(tab => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all border ${
                              activeTab === tab.id
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/5"
                                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-card/85"
                            }`}
                          >
                            <Icon className="h-4.5 w-4.5" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Tabs Panels Container */}
                    <div className="lg:col-span-9">
                      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl min-h-[500px]">
                        {/* DADOS PANEL */}
                        {activeTab === "dados" && (
                          <div className="space-y-6">
                            <div className="pb-4 border-b border-border">
                              <h2 className="text-xl font-black text-white">
                                Dados Principais
                              </h2>
                              <p className="text-xs text-muted-foreground">
                                Configure as informações comerciais exibidas aos
                                clientes.
                              </p>
                            </div>

                            <form onSubmit={saveProfile} className="space-y-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                                    Nome Comercial do Negócio *
                                  </label>
                                  <Input
                                    type="text"
                                    required
                                    value={busName}
                                    onChange={e => setBusName(e.target.value)}
                                    className="bg-background border-border h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-white uppercase tracking-wider font-body">
                                    Categoria Principal *
                                  </label>
                                  <select
                                    required
                                    value={busCategoryId}
                                    onChange={e =>
                                      handleCategorySelect(e.target.value)
                                    }
                                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 h-12 focus:border-primary focus:outline-none transition text-sm"
                                  >
                                    <option value="">
                                      Selecione uma categoria...
                                    </option>
                                    {categories.map(cat => (
                                      <option
                                        key={cat.id}
                                        value={cat.id}
                                        className="bg-card"
                                      >
                                        {cat.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                                    Telefone Fixo / Comercial
                                  </label>
                                  <Input
                                    type="tel"
                                    placeholder="Ex: (11) 4033-1234"
                                    value={busPhone}
                                    onChange={e => setBusPhone(e.target.value)}
                                    className="bg-background border-border h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                                    WhatsApp para Contato Direto
                                  </label>
                                  <Input
                                    type="tel"
                                    placeholder="Ex: (11) 99999-9999"
                                    value={busWhatsapp}
                                    onChange={e => setBusWhatsapp(e.target.value)}
                                    className="bg-background border-border h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold text-white uppercase tracking-wider">
                                  Descrição Detalhada do Negócio
                                </label>
                                <Textarea
                                  rows={5}
                                  placeholder="Descreva brevemente o seu negócio, os produtos que vende ou serviços que oferece para os clientes na busca..."
                                  value={busDescription}
                                  onChange={e => setBusDescription(e.target.value)}
                                  className="bg-background border-border rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm resize-none"
                                />
                              </div>

                              <div className="pt-4 border-t border-border flex justify-end">
                                <Button
                                  type="submit"
                                  disabled={isLoading}
                                  className="bg-primary text-primary-foreground font-bold hover:bg-primary/95 h-11 px-6 rounded-xl flex items-center gap-2"
                                >
                                  {isLoading && (
                                    <span className="loader-btn w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                                  )}
                                  Salvar Dados
                                </Button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* LOCALIZACAO PANEL */}
                        {activeTab === "localizacao" && (
                          <div className="space-y-6">
                            <div className="pb-4 border-b border-border">
                              <h2 className="text-xl font-black text-white">
                                Localização Física
                              </h2>
                              <p className="text-xs text-muted-foreground">
                                Cadastre o endereço do seu comércio ou sua base de
                                atuação. O endereço é utilizado para geolocalização
                                dos clientes.
                              </p>
                            </div>

                            <form onSubmit={saveProfile} className="space-y-5">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-white uppercase tracking-wider">
                                  Endereço Completo (Rua, Número, Complemento) *
                                </label>
                                <Input
                                  type="text"
                                  required
                                  placeholder="Ex: Av. Salvador Markowicz, 123 - Sala 4"
                                  value={busAddress}
                                  onChange={e => setBusAddress(e.target.value)}
                                  className="bg-background border-border h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                                    CEP *
                                  </label>
                                  <Input
                                    type="text"
                                    required
                                    placeholder="00000-000"
                                    value={busCep}
                                    onChange={e => setBusCep(e.target.value)}
                                    className="bg-background border-border h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm font-mono text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                                    Bairro *
                                  </label>
                                  <Input
                                    type="text"
                                    required
                                    placeholder="Ex: Centro"
                                    value={busNeighborhood}
                                    onChange={e =>
                                      setBusNeighborhood(e.target.value)
                                    }
                                    className="bg-background border-border h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                                    Cidade *
                                  </label>
                                  <Input
                                    type="text"
                                    required
                                    placeholder="Ex: Bragança Paulista"
                                    value={busCity}
                                    onChange={e => setBusCity(e.target.value)}
                                    className="bg-background border-border h-12 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm"
                                  />
                                </div>
                              </div>

                              {/* Coordinates debug */}
                              {business &&
                                (business.latitude || business.longitude) && (
                                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-3">
                                    <Compass className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div className="text-xs text-muted-foreground">
                                      <span className="text-white font-bold block mb-0.5">
                                        Geolocalização Ativa:
                                      </span>
                                      Latitude:{" "}
                                      <span className="font-mono text-white mr-4">
                                        {business.latitude?.toFixed(6)}
                                      </span>
                                      Longitude:{" "}
                                      <span className="font-mono text-white">
                                        {business.longitude?.toFixed(6)}
                                      </span>
                                    </div>
                                  </div>
                                )}

                              <div className="pt-4 border-t border-border flex justify-end">
                                <Button
                                  type="submit"
                                  disabled={isLoading}
                                  className="bg-primary text-primary-foreground font-bold hover:bg-primary/95 h-11 px-6 rounded-xl flex items-center gap-2"
                                >
                                  {isLoading && (
                                    <span className="loader-btn w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                                  )}
                                  Salvar Endereço
                                </Button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* FOTOS PANEL */}
                        {activeTab === "fotos" && (
                          <div className="space-y-6">
                            <div className="pb-4 border-b border-border">
                              <h2 className="text-xl font-black text-white">
                                Identidade Visual & Galeria
                              </h2>
                              <p className="text-xs text-muted-foreground">
                                Insira as URLs das fotos do seu negócio (logotipo,
                                capa e imagens dos seus produtos/serviços).
                              </p>
                            </div>
                            <form onSubmit={saveProfile} className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Avatar Upload */}
                                <div className="space-y-3 bg-background/30 border border-border rounded-2xl p-5 flex flex-col justify-between">
                                  <div>
                                    <label className="text-xs font-bold text-white uppercase tracking-wider block">
                                      Foto de Perfil (Logo ou Avatar)
                                    </label>
                                    <span className="text-[10px] text-zinc-500 block mb-3">Arraste ou clique abaixo para fazer upload</span>
                                    <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700/55 overflow-hidden flex items-center justify-center mb-3">
                                      {busAvatarUri ? (
                                        <img
                                          src={busAvatarUri}
                                          alt="Preview Avatar"
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <ImageIcon className="h-6 w-6 text-zinc-500" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="cursor-pointer bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-white text-xs font-bold py-2 px-3 rounded-xl block text-center transition-all duration-200">
                                      <span>Escolher arquivo...</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleImageUpload(file, setBusAvatarUri);
                                        }}
                                      />
                                    </label>
                                    <Input
                                      type="text"
                                      placeholder="Ou cole o link da foto de perfil..."
                                      value={busAvatarUri}
                                      onChange={e => setBusAvatarUri(e.target.value)}
                                      className="bg-background border-border text-xs rounded-xl focus-visible:ring-primary"
                                    />
                                  </div>
                                </div>

                                {/* Cover Upload */}
                                <div className="space-y-3 bg-background/30 border border-border rounded-2xl p-5 flex flex-col justify-between">
                                  <div>
                                    <label className="text-xs font-bold text-white uppercase tracking-wider block">
                                      Foto de Capa do Perfil
                                    </label>
                                    <span className="text-[10px] text-zinc-500 block mb-3">Arraste ou clique abaixo para fazer upload</span>
                                    <div className="w-full h-16 rounded-xl bg-zinc-800 border border-zinc-700/55 overflow-hidden flex items-center justify-center mb-3">
                                      {busCoverUri ? (
                                        <img
                                          src={busCoverUri}
                                          alt="Preview Cover"
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-xs text-zinc-500">Sem Capa</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="cursor-pointer bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-white text-xs font-bold py-2 px-3 rounded-xl block text-center transition-all duration-200">
                                      <span>Escolher arquivo...</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleImageUpload(file, setBusCoverUri);
                                        }}
                                      />
                                    </label>
                                    <Input
                                      type="text"
                                      placeholder="Ou cole o link da foto de capa..."
                                      value={busCoverUri}
                                      onChange={e => setBusCoverUri(e.target.value)}
                                      className="bg-background border-border text-xs rounded-xl focus-visible:ring-primary"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Gallery Link Lists */}
                              <div className="space-y-4 bg-background/30 border border-border rounded-2xl p-5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                  <div>
                                    <label className="text-xs font-bold text-white uppercase tracking-wider block">
                                      Galeria de Fotos (Destaques)
                                    </label>
                                    <span className="text-[10px] text-zinc-500 block">Adicione fotos de produtos/serviços para seu feed do aplicativo</span>
                                  </div>
                                  <label className="cursor-pointer bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-black py-2 px-4 rounded-xl text-center transition-all duration-200 flex items-center justify-center gap-1.5 self-start">
                                    <Plus className="h-4.5 w-4.5 text-black" />
                                    <span>Upload da Galeria</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleImageUpload(file, (url) => {
                                            setBusGallery(prev => [...prev, url]);
                                          });
                                        }
                                      }}
                                    />
                                  </label>
                                </div>

                                <div className="flex gap-2">
                                  <Input
                                    type="text"
                                    placeholder="Ou cole a URL de uma foto para adicionar à galeria"
                                    value={galleryInput}
                                    onChange={e => setGalleryInput(e.target.value)}
                                    className="bg-background border-border rounded-xl focus-visible:ring-primary focus-visible:border-primary text-sm flex-1"
                                  />
                                  <Button
                                    type="button"
                                    onClick={addGalleryImage}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-bold px-4 rounded-xl flex items-center gap-1.5"
                                  >
                                    <Plus className="h-4 w-4 text-primary" />{" "}
                                    Adicionar
                                  </Button>
                                </div>

                                {/* Grid of gallery preview items */}
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-4 pt-3">
                                  {busGallery.map((imgUrl, index) => (
                                    <div
                                      key={index}
                                      className="relative group aspect-square rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden shadow-inner"
                                    >
                                      <img
                                        src={imgUrl}
                                        alt={`Foto Galeria ${index}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeGalleryImage(index)}
                                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 hover:bg-red-600/90 text-white transition duration-200"
                                        title="Remover Foto"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                  {busGallery.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1">
                                      <ImageIcon className="h-6 w-6 text-zinc-600" />
                                      <span>
                                        Nenhuma foto na galeria. Adicione URLs
                                        acima.
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-4 border-t border-border flex justify-end">
                                <Button
                                  type="submit"
                                  disabled={isLoading}
                                  className="bg-primary text-primary-foreground font-bold hover:bg-primary/95 h-11 px-6 rounded-xl flex items-center gap-2"
                                >
                                  {isLoading && (
                                    <span className="loader-btn w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                                  )}
                                  Salvar Fotos
                                </Button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* SERVICOS PANEL */}
                        {activeTab === "servicos" && (
                          <div className="space-y-6">
                            <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <h2 className="text-xl font-black text-white">
                                  Meus Serviços
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                  Cadastre os serviços prestados pelo seu negócio e
                                  os respectivos valores.
                                </p>
                              </div>
                              <Button
                                type="button"
                                onClick={openAddServiceModal}
                                disabled={isLimitReached}
                                className="bg-primary text-primary-foreground font-black hover:bg-primary/95 h-11 px-5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="h-4.5 w-4.5" /> Adicionar Serviço
                              </Button>
                            </div>

                            {/* Services count / Limits banner */}
                            <div className="bg-zinc-800/40 border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                                  Uso do Plano
                                </span>
                                <span className="text-base font-black text-white">
                                  {servicesList.length} de{" "}
                                  {maxServicos === -1
                                    ? "Ilimitados"
                                    : `${maxServicos} serviço(s)`}{" "}
                                  cadastrado(s)
                                </span>
                              </div>
                              {isLimitReached && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Limite Atingido
                                </span>
                              )}
                            </div>

                            {isLimitReached && (
                              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start gap-3.5">
                                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                  <p className="text-sm text-zinc-200 leading-relaxed">
                                    <strong>Precisa de mais serviços?</strong> Faça
                                    o upgrade para o plano Premium e cadastre
                                    serviços ilimitados, ganhe selo de verificação e
                                    destaque nas buscas.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab("assinatura")}
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                  >
                                    Ver planos disponíveis{" "}
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Services List Table/Grid */}
                            <div className="space-y-4">
                              {servicesList.map(srv => (
                                <div
                                  key={srv.id}
                                  className="bg-background/40 hover:bg-background/80 border border-border rounded-2xl p-5 flex items-start justify-between gap-4 transition duration-200"
                                >
                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-3">
                                      <h3 className="text-base font-bold text-white leading-snug">
                                        {srv.name}
                                      </h3>
                                      <span className="text-sm font-black text-primary font-mono bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                                        R$ {srv.price.toFixed(2)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                                      {srv.description}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openEditServiceModal(srv)}
                                      className="p-2 rounded-xl bg-card border border-border text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                                      title="Editar Serviço"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteService(srv.id)}
                                      className="p-2 rounded-xl bg-card border border-border text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition"
                                      title="Excluir Serviço"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {servicesList.length === 0 && (
                                <div className="py-16 text-center text-sm text-muted-foreground border border-dashed border-border rounded-3xl flex flex-col items-center justify-center gap-2">
                                  <Wrench className="h-8 w-8 text-zinc-700" />
                                  <p className="font-bold text-white">
                                    Nenhum serviço cadastrado
                                  </p>
                                  <p className="text-xs max-w-sm">
                                    Cadastre seus serviços e defina os valores para
                                    que os clientes saibam exatamente o que você
                                    oferece.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ASSINATURA & PLANOS PANEL */}
                        {activeTab === "assinatura" && (
                          <div className="space-y-6">
                            <div className="pb-4 border-b border-border">
                              <h2 className="text-xl font-black text-white">
                                Plano & Limites de Assinatura
                              </h2>
                              <p className="text-xs text-muted-foreground">
                                Gerencie seus limites corporativos e consulte os
                                benefícios dos planos do XamaJá.
                              </p>
                            </div>

                            {/* Plan Summary Card */}
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="bg-[#0c0c0e] border border-primary/20 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>

                                <div className="space-y-4">
                                  <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                    <span className="text-primary text-[10px] font-black uppercase tracking-wider">
                                      Seu plano atual
                                    </span>
                                  </div>

                                  <h3 className="text-3xl font-black text-white">
                                    Plano Grátis
                                  </h3>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    Limite inicial para novos cadastros. Permite
                                    configurar o seu perfil completo de negócio e
                                    listar até 1 serviço.
                                  </p>
                                </div>

                                <div className="pt-6 border-t border-border mt-6 space-y-2">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Limite de Serviços:</span>
                                    <span className="text-white font-bold">
                                      {servicesList.length} / {maxServicos}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Selo de Verificação:</span>
                                    <span className="text-red-400 font-bold">
                                      Não ativo
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Premium Plan Offer */}
                              <div className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition duration-300">
                                <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>

                                <div className="space-y-4">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    <span className="text-primary text-[10px] font-black uppercase tracking-wider">
                                      Recomendado
                                    </span>
                                  </div>

                                  <h3 className="text-3xl font-black text-white">
                                    Plano Premium
                                  </h3>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    Desbloqueie todo o potencial da plataforma com
                                    serviços ilimitados, relevância nas buscas e
                                    suporte prioritário.
                                  </p>
                                </div>

                                <div className="pt-6 space-y-4">
                                  <ul className="space-y-2.5 text-xs text-zinc-300">
                                    <li className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                      <span>Serviços Ilimitados</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                      <span>Selo de Verificação Premium</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                      <span>Destaque nas buscas de clientes</span>
                                    </li>
                                  </ul>

                                  <Button
                                    type="button"
                                    onClick={() =>
                                      toast.info(
                                        "Funcionalidade de pagamento online será ativada em breve. Fale com o administrador."
                                      )
                                    }
                                    className="w-full bg-primary text-primary-foreground font-black uppercase tracking-wider h-11 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/95 transition shadow-lg shadow-primary/10"
                                  >
                                    <span>Quero ser Premium</span>
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Services Edit Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsServiceModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-zinc-400 hover:text-white transition"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-white">
                {editingServiceId ? "Editar Serviço" : "Adicionar Novo Serviço"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Informe o nome, descrição e preço do serviço oferecido.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Nome do Serviço *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ex: Pintura Residencial (por m²)"
                  value={srvName}
                  onChange={e => setSrvName(e.target.value)}
                  className="bg-background border-border h-12 rounded-xl focus-visible:ring-primary text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Valor do Serviço (R$)
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 120.00"
                  value={srvPrice}
                  onChange={e => setSrvPrice(e.target.value)}
                  className="bg-background border-border h-12 rounded-xl focus-visible:ring-primary text-sm font-mono text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  Descrição Resumida
                </label>
                <Textarea
                  rows={4}
                  placeholder="Descreva o que está incluso no serviço e as condições de execução..."
                  value={srvDescription}
                  onChange={e => setSrvDescription(e.target.value)}
                  className="bg-background border-border rounded-xl focus-visible:ring-primary text-sm resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold h-11 px-5 rounded-xl border border-zinc-700/60"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={saveService}
                className="bg-primary text-primary-foreground font-black uppercase tracking-wider h-11 px-6 rounded-xl hover:bg-primary/95 transition"
              >
                {editingServiceId ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 XamaJá. Todos os direitos reservados.</p>
          <p>O X MARCA O LOCAL.</p>
        </div>
      </footer>
    </div>
  );
}
