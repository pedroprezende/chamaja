import { useState, useEffect } from "react";
import LocationConfirmationMap from "@/components/location-confirmation-map";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Platform,
  Switch,
  Modal,
  Linking,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavedAddress } from "@/components/address-selector-modal";

interface GeocodedAddress {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
  neighborhood?: string;
  city?: string;
  cep?: string;
}
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useProvider } from "@/lib/provider-context";
import { useLocation } from "@/lib/location-context";
import { useFavorites } from "@/lib/favorites-context";
import { useNotifications } from "@/lib/notifications-context";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, signOut, isAdmin } = useAuth();
  const { isProvider, provider, hasProviderProfile, providerStatus } = useProvider();
  const { favorites } = useFavorites();
  const { unreadCount } = useNotifications();
  const { coords } = useLocation();

  const userId = user?.id || "guest";
  const storageKey = `@chamaja_saved_user_addresses_${userId}`;
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  const [addressesModalVisible, setAddressesModalVisible] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodedAddress[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedAddressToAdd, setSelectedAddressToAdd] =
    useState<GeocodedAddress | null>(null);
  const [activeLabelType, setActiveLabelType] = useState<
    "casa" | "trabalho" | "outro"
  >("casa");
  const [customLabel, setCustomLabel] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [customStreet, setCustomStreet] = useState("");
  const [customNeighborhood, setCustomNeighborhood] = useState("");
  const [customCity, setCustomCity] = useState("Bragança Paulista");
  const [customCep, setCustomCep] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customComplement, setCustomComplement] = useState("");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Confirmation Map States
  const [showConfirmationMap, setShowConfirmationMap] = useState(false);
  const [tempGeocodedCoords, setTempGeocodedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [initialGeocodedCoords, setInitialGeocodedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const loadSavedAddresses = async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        setSavedAddresses(JSON.parse(raw));
      } else {
        setSavedAddresses([]);
      }
    } catch (e) {
      console.warn("Failed to load saved addresses:", e);
    }
  };

  useEffect(() => {
    if (addressesModalVisible) {
      loadSavedAddresses();
      setIsAddingNew(false);
      setAddressInput("");
      setSearchResults([]);
      setSearchError(null);
      setSelectedAddressToAdd(null);
      setCustomStreet("");
      setCustomNeighborhood("");
      setCustomCity("Bragança Paulista");
      setCustomCep("");
      setCustomNumber("");
      setCustomComplement("");
      setEditingAddressId(null);
      setSavingAddress(false);
      setShowConfirmationMap(false);
      setTempGeocodedCoords(null);
      setInitialGeocodedCoords(null);
    }
  }, [addressesModalVisible]);

  const handleSearchAddress = async () => {
    if (!addressInput.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSelectedAddressToAdd(null);
    try {
      // Check if input is a Brazilian CEP (e.g. 12914-380 or 12914380)
      const cleanInput = addressInput.trim().replace(/\D/g, "");
      if (cleanInput.length === 8) {
        try {
          const res = await fetch(
            `https://viacep.com.br/ws/${cleanInput}/json/`,
          );
          const viaCepData = await res.json();
          if (viaCepData && !viaCepData.erro) {
            const street = viaCepData.logradouro;
            const neighborhood = viaCepData.bairro;
            const city = viaCepData.localidade;
            const uf = viaCepData.uf;
            const displayName = `${street}, ${neighborhood}, ${city} - ${uf}`;

            setCustomStreet(street);
            setCustomNeighborhood(neighborhood);
            setCustomCity(city);
            setCustomCep(viaCepData.cep);
            // Fetch coordinates for the street as fallback, including CEP
            let lat = coords?.latitude ?? -22.952;
            let lon = coords?.longitude ?? -46.542;
            try {
              const nomRes = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                  `${street}, ${neighborhood}, ${city}, ${viaCepData.cep}, Brasil`,
                )}&format=json&limit=1`,
                {
                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  },
                },
              );
              const nomData = await nomRes.json();
              if (Array.isArray(nomData) && nomData.length > 0) {
                lat = parseFloat(nomData[0].lat);
                lon = parseFloat(nomData[0].lon);
              }
            } catch (nomErr) {
              console.warn("Geocoding CEP street in profile failed:", nomErr);
            }

            const cepAddressItem: GeocodedAddress = {
              id: `cep-${Date.now()}`,
              displayName,
              latitude: lat,
              longitude: lon,
              neighborhood,
              city,
              cep: viaCepData.cep,
            };

            setSelectedAddressToAdd(cepAddressItem);
            setCustomNumber("");
            setCustomComplement("");
            setSearching(false);
            return;
          }
        } catch (cepErr) {
          console.warn("ViaCEP request failed in profile:", cepErr);
        }
      }

      let queryStr = addressInput;
      if (!addressInput.toLowerCase().includes("bragança")) {
        queryStr += ", Bragança Paulista";
      }
      queryStr += ", Brasil";

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          queryStr,
        )}&format=json&limit=5&addressdetails=1&countrycodes=br`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        },
      );
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const formatted: GeocodedAddress[] = data.map(
          (item: any, idx: number) => {
            const {
              road,
              house_number,
              suburb,
              city,
              town,
              village,
              state,
              postcode,
            } = item.address || {};
            const streetPart = road
              ? house_number
                ? `${road}, ${house_number}`
                : road
              : "";
            const neighborhoodPart = suburb || "";
            const cityPart = city || town || village || "";
            const statePart = state || "SP";

            const parts = [];
            if (streetPart) parts.push(streetPart);
            if (neighborhoodPart) parts.push(neighborhoodPart);
            if (cityPart) parts.push(`${cityPart} - ${statePart}`);

            const finalName = parts.join(", ") || item.display_name;

            return {
              id: `${item.place_id}-${idx}`,
              displayName: finalName,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              neighborhood: neighborhoodPart || undefined,
              city: cityPart || undefined,
              cep: postcode || undefined,
            };
          },
        );
        setSearchResults(formatted);
      } else {
        setSearchResults([]);
        setSearchError("Nenhum endereço encontrado. Tente refinar a busca.");
      }
    } catch (err) {
      console.warn("Search geocoding failed:", err);
      setSearchError("Erro ao buscar endereço. Verifique sua conexão.");
    } finally {
      setSearching(false);
    }
  };

  const handleEditSavedAddress = (item: SavedAddress, e: any) => {
    e.stopPropagation();
    setEditingAddressId(item.id);
    setCustomStreet(item.street || "");
    setCustomNumber(item.number || "");
    setCustomComplement(item.complement || "");
    setCustomNeighborhood(item.neighborhood || "");
    setCustomCity(item.city || "Bragança Paulista");
    setCustomCep(item.cep || "");

    setSelectedAddressToAdd({
      id: `edit-${item.id}`,
      displayName: item.addressName,
      latitude: item.latitude,
      longitude: item.longitude,
      neighborhood: item.neighborhood,
      city: item.city,
    });

    setCustomLabel(
      item.label === "Casa" || item.label === "Trabalho" ? "" : item.label,
    );
    setActiveLabelType(
      item.label === "Casa"
        ? "casa"
        : item.label === "Trabalho"
          ? "trabalho"
          : "outro",
    );
    setIsAddingNew(true);
  };

  const handleSaveAddress = async () => {
    if (!selectedAddressToAdd) return;

    if (!customStreet.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, informe a Rua.");
      return;
    }
    if (!customNumber.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, informe o Número.");
      return;
    }
    if (!customNeighborhood.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, informe o Bairro.");
      return;
    }
    if (!customCity.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, informe a Cidade.");
      return;
    }
    if (!customCep.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, informe o CEP.");
      return;
    }

    setSavingAddress(true);
    let resolvedCoords = {
      latitude: selectedAddressToAdd.latitude,
      longitude: selectedAddressToAdd.longitude,
    };

    // Geocode precise custom address details entered by the user
    try {
      const fetchNominatimOne = async (q: string) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              q,
            )}&format=json&limit=1&addressdetails=1&countrycodes=br`,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            },
          );
          const data = await res.json();
          return Array.isArray(data) && data.length > 0 ? data[0] : null;
        } catch (e) {
          return null;
        }
      };

      let result = null;

      // 1. Precise query: Rua + Número + Bairro + Cidade + CEP + Brasil
      let q1 = `${customStreet}`;
      if (customNumber.trim()) q1 += `, ${customNumber.trim()}`;
      if (customNeighborhood.trim()) q1 += `, ${customNeighborhood.trim()}`;
      if (customCity.trim()) q1 += `, ${customCity.trim()}`;
      if (customCep.trim()) q1 += `, ${customCep.trim()}`;
      q1 += `, Brasil`;

      result = await fetchNominatimOne(q1);

      // Fallback 1.1: Try fuzzy spelling replacement for sabela -> sabella
      if (!result && q1.toLowerCase().includes("sabela")) {
        const fuzzyQ = q1.replace(/sabela/gi, "sabella");
        result = await fetchNominatimOne(fuzzyQ);
      }

      // Fallback 2: Without CEP
      if (!result) {
        let q2 = `${customStreet}`;
        if (customNumber.trim()) q2 += `, ${customNumber.trim()}`;
        if (customNeighborhood.trim()) q2 += `, ${customNeighborhood.trim()}`;
        if (customCity.trim()) q2 += `, ${customCity.trim()}`;
        q2 += `, Brasil`;

        result = await fetchNominatimOne(q2);

        if (!result && q2.toLowerCase().includes("sabela")) {
          const fuzzyQ2 = q2.replace(/sabela/gi, "sabella");
          result = await fetchNominatimOne(fuzzyQ2);
        }
      }

      // Fallback 3: Street + Neighborhood + City (without number)
      if (!result) {
        let q3 = `${customStreet}`;
        if (customNeighborhood.trim()) q3 += `, ${customNeighborhood.trim()}`;
        if (customCity.trim()) q3 += `, ${customCity.trim()}`;
        q3 += `, Brasil`;

        result = await fetchNominatimOne(q3);

        if (!result && q3.toLowerCase().includes("sabela")) {
          const fuzzyQ3 = q3.replace(/sabela/gi, "sabella");
          result = await fetchNominatimOne(fuzzyQ3);
        }
      }

      // Fallback 4: Street + City (without neighborhood)
      if (!result) {
        let q4 = `${customStreet}, ${customCity.trim()}, Brasil`;
        result = await fetchNominatimOne(q4);

        if (!result && q4.toLowerCase().includes("sabela")) {
          const fuzzyQ4 = q4.replace(/sabela/gi, "sabella");
          result = await fetchNominatimOne(fuzzyQ4);
        }
      }

      if (result) {
        resolvedCoords.latitude = parseFloat(result.lat);
        resolvedCoords.longitude = parseFloat(result.lon);

        const { suburb, city, town, village } = result.address || {};
        if (suburb && !customNeighborhood.trim()) {
          setCustomNeighborhood(suburb);
        }
        if ((city || town || village) && !customCity.trim()) {
          setCustomCity(city || town || village);
        }
      }
    } catch (err) {
      console.warn("Geocoding address details on save in profile failed:", err);
    } finally {
      setSavingAddress(false);
    }

    setInitialGeocodedCoords(resolvedCoords);
    setTempGeocodedCoords(resolvedCoords);
    setShowConfirmationMap(true);
  };

  const handleConfirmLocationProfile = async (finalCoords: {
    latitude: number;
    longitude: number;
  }) => {
    setShowConfirmationMap(false);
    setSavingAddress(true);

    // Save debug info
    const fullAddressInput = `${customStreet}, ${customNumber}, ${customNeighborhood}, ${customCity}, ${customCep}`;
    const debugInfo = {
      inputtedAddress: fullAddressInput,
      geocodedLat: initialGeocodedCoords?.latitude ?? 0,
      geocodedLng: initialGeocodedCoords?.longitude ?? 0,
      finalSavedLat: finalCoords.latitude,
      finalSavedLng: finalCoords.longitude,
      timestamp: new Date().toISOString(),
    };
    try {
      await AsyncStorage.setItem(
        "@chamaja_last_geocoded_debug_info",
        JSON.stringify(debugInfo),
      );
    } catch (e) {
      console.warn("Failed to save debug info:", e);
    }

    let finalLabel = "Casa";
    if (activeLabelType === "trabalho") {
      finalLabel = "Trabalho";
    } else if (activeLabelType === "outro") {
      finalLabel = customLabel.trim() || "Outro";
    }

    // Build the final display name from inputs
    let finalAddressName = customStreet.trim();
    if (customNumber.trim()) {
      finalAddressName += `, ${customNumber.trim()}`;
    }
    if (customComplement.trim()) {
      finalAddressName += `, ${customComplement.trim()}`;
    }
    if (customNeighborhood.trim()) {
      finalAddressName += ` - ${customNeighborhood.trim()}`;
    }
    if (customCity.trim()) {
      finalAddressName += `, ${customCity.trim()}`;
      if (
        !customCity.toLowerCase().includes("sp") &&
        !customCity.toLowerCase().includes("estado")
      ) {
        finalAddressName += ` - SP`;
      }
    }
    if (customCep.trim()) {
      finalAddressName += `, ${customCep.trim()}`;
    }

    const newAddress: SavedAddress = {
      id:
        editingAddressId ||
        `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      label: finalLabel,
      addressName: finalAddressName,
      latitude: finalCoords.latitude,
      longitude: finalCoords.longitude,
      neighborhood: customNeighborhood.trim() || undefined,
      city: customCity.trim() || undefined,
      street: customStreet.trim(),
      number: customNumber.trim(),
      complement: customComplement.trim(),
      cep: customCep.trim() || undefined,
    };

    let updatedAddresses;
    if (editingAddressId) {
      updatedAddresses = savedAddresses.map((addr) =>
        addr.id === editingAddressId ? newAddress : addr,
      );
    } else {
      updatedAddresses = [newAddress, ...savedAddresses];
    }
    setSavedAddresses(updatedAddresses);

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedAddresses));
      // Reset view to saved addresses list
      setIsAddingNew(false);
      setAddressInput("");
      setSearchResults([]);
      setSelectedAddressToAdd(null);
      setEditingAddressId(null);
      loadSavedAddresses();
    } catch (e) {
      console.warn("Failed to save address:", e);
      Alert.alert("Erro", "Não foi possível salvar o endereço.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const deleteAction = async () => {
      const updated = savedAddresses.filter((a) => a.id !== id);
      setSavedAddresses(updated);
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.warn("Failed to delete address:", err);
        Alert.alert("Erro", "Não foi possível excluir o endereço.");
      }
    };

    if (Platform.OS === "web") {
      await deleteAction();
    } else {
      Alert.alert(
        "Excluir endereço",
        "Deseja realmente remover este endereço salvo?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Excluir", style: "destructive", onPress: deleteAction },
        ],
      );
    }
  };

  const getLabelIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l === "casa") return "home";
    if (l === "trabalho") return "work";
    return "place";
  };

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      try {
        await signOut();
      } catch (e) {
        console.error(e);
      }
    } else {
      Alert.alert("Sair", "Tem certeza que deseja sair?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]);
    }
  };

  const MENU_ITEMS = [
    { id: "addresses", label: "Meus endereços", icon: "place" },
    { id: "appointments", label: "Meus agendamentos", icon: "event" },
    {
      id: "favorites",
      label: "Favoritos",
      icon: "favorite-border",
      badge: favorites.length > 0 ? String(favorites.length) : undefined,
    },
    {
      id: "notifications",
      label: "Notificações",
      icon: "notifications-none",
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
    },
    {
      id: "provider",
      label: isProvider
        ? "Minha área de prestador"
        : hasProviderProfile
          ? providerStatus === "pendente"
            ? "Meu Negócio (Aguardando aprovação)"
            : "Meu Negócio"
          : "Seja um prestador",
      icon: isProvider
        ? "work"
        : hasProviderProfile
          ? "store"
          : "add-business",
      highlight: !hasProviderProfile,
    },
    { id: "help", label: "Ajuda e suporte", icon: "help-outline" },
    { id: "about", label: "Sobre o XamaJá", icon: "info-outline" },
    { id: "privacy", label: "Política de Privacidade", icon: "security" },
    { id: "terms", label: "Termos de Uso", icon: "gavel" },
    { id: "debug_location", label: "Debug de Localização", icon: "bug-report" },
    ...(isAdmin
      ? [
          {
            id: "admin",
            label: "Painel Admin",
            icon: "admin-panel-settings",
            isAdmin: true,
          },
        ]
      : []),
  ] as const;

  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case "addresses":
        setAddressesModalVisible(true);
        break;
      case "appointments":
        router.push("/appointments" as any);
        break;
      case "favorites":
        router.push("/favorites" as any);
        break;
      case "notifications":
        router.push("/notifications" as any);
        break;
      case "provider":
        if (isProvider) {
          router.push("/provider-dashboard" as any);
        } else if (hasProviderProfile) {
          router.push("/become-provider" as any);
        } else {
          router.push("/become-provider" as any);
        }
        break;
      case "admin":
        router.push("/admin" as any);
        break;
      case "help":
        setHelpModalVisible(true);
        break;
      case "about":
        setAboutModalVisible(true);
        break;
      case "privacy":
        setPrivacyModalVisible(true);
        break;
      case "terms":
        setTermsModalVisible(true);
        break;
      case "debug_location":
        router.push("/dev/location-debug" as any);
        break;
    }
  };

  const displayAvatar =
    user?.avatar ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80";

  return (
    <ScreenContainer edges={["left", "right"]} className="">
      {/* Header */}
      <LinearGradient
        colors={
          colors.background === "#F8F9FA"
            ? ["#FFFFFF", "#F8F9FA"]
            : ["#1E293B", "#0F172A"]
        }
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Perfil
        </Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* User Card */}
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            {isProvider && (
              <View
                style={[
                  styles.providerBadge,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.surface,
                  },
                ]}
              >
                <MaterialIcons name="work" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {user?.name || "Usuário"}
            </Text>
            <Text style={[styles.userEmail, { color: colors.muted }]}>
              {user?.email}
            </Text>
            {isProvider && provider && (
              <View
                style={[
                  styles.providerTag,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <MaterialIcons
                  name="workspace-premium"
                  size={11}
                  color={colors.primary}
                />
                <Text
                  style={[styles.providerTagText, { color: colors.primary }]}
                >
                  Prestador • {provider.category}
                </Text>
              </View>
            )}
            {isAdmin && (
              <View
                style={[styles.providerTag, { backgroundColor: "#EFF6FF" }]}
              >
                <MaterialIcons
                  name="admin-panel-settings"
                  size={11}
                  color="#2563EB"
                />
                <Text style={[styles.providerTagText, { color: "#2563EB" }]}>
                  Administrador
                </Text>
              </View>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.editBtn,
              { backgroundColor: colors.primary + "15" },
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => router.push("/edit-profile" as any)}
          >
            <MaterialIcons name="edit" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {/* Menu */}
        <View
          style={[
            styles.menuSection,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          {MENU_ITEMS.map((item, index) => {
            const isLast = index === MENU_ITEMS.length - 1;
            const isAdminItem = "isAdmin" in item && item.isAdmin;
            const isHighlight = "highlight" in item && item.highlight;
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  !isLast && [
                    styles.menuItemBorder,
                    { borderBottomColor: colors.border },
                  ],
                  pressed && { backgroundColor: colors.background },
                  isAdminItem && { backgroundColor: "#2563EB10" },
                  isHighlight && { backgroundColor: colors.primary + "10" },
                ]}
                onPress={() => handleMenuPress(item.id)}
              >
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: colors.background },
                    isAdminItem && { backgroundColor: "#DBEAFE" },
                    isHighlight && { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <MaterialIcons
                    name={item.icon as any}
                    size={20}
                    color={
                      isAdminItem
                        ? "#2563EB"
                        : isHighlight
                          ? colors.primary
                          : colors.muted
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    { color: colors.foreground },
                    isAdminItem && { color: "#2563EB", fontWeight: "700" },
                    isHighlight && { color: colors.primary, fontWeight: "700" },
                  ]}
                >
                  {item.label}
                </Text>
                {"badge" in item && item.badge && (
                  <View
                    style={[styles.badge, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            { backgroundColor: colors.background, borderColor: "#EF444450" },
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>

      {/* Modal de Gerenciamento de Endereços */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addressesModalVisible}
        onRequestClose={() => {
          if (isAddingNew) {
            setIsAddingNew(false);
            setAddressInput("");
            setSearchResults([]);
            setSelectedAddressToAdd(null);
          } else {
            setAddressesModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {isAddingNew ? "Novo Endereço" : "Meus Endereços"}
              </Text>
              <Pressable
                onPress={() => {
                  if (isAddingNew) {
                    setIsAddingNew(false);
                    setAddressInput("");
                    setSearchResults([]);
                    setSelectedAddressToAdd(null);
                  } else {
                    setAddressesModalVisible(false);
                  }
                }}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons
                  name={isAddingNew ? "arrow-back" : "close"}
                  size={24}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            {showConfirmationMap && tempGeocodedCoords ? (
              <View
                style={{
                  flex: 1,
                  minHeight: 350,
                  width: "100%",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <LocationConfirmationMap
                  initialCoords={tempGeocodedCoords}
                  onConfirm={handleConfirmLocationProfile}
                  onCancel={() => setShowConfirmationMap(false)}
                />
              </View>
            ) : isAddingNew ? (
              // TELA DE ADICIONAR NOVO ENDEREÇO
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="handled"
              >
                {selectedAddressToAdd ? (
                  // SUB-FLUXO: DEFINIR RÓTULO DO ENDEREÇO SELECIONADO
                  <View style={styles.labelForm}>
                    <Text
                      style={[
                        styles.policySectionTitle,
                        { color: colors.foreground, marginTop: 0 },
                      ]}
                    >
                      Como quer salvar esse endereço?
                    </Text>
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 13,
                        marginBottom: 16,
                      }}
                    >
                      {selectedAddressToAdd.displayName}
                    </Text>

                    {/* Inputs para Rua, Bairro, CEP, Número e Complemento */}
                    <View style={{ gap: 12, marginBottom: 16 }}>
                      <View style={{ gap: 6 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: colors.muted,
                          }}
                        >
                          Rua
                        </Text>
                        <TextInput
                          style={[
                            styles.inputField,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                              color: colors.foreground,
                              marginBottom: 0,
                            },
                          ]}
                          placeholder="Rua..."
                          placeholderTextColor={colors.muted}
                          value={customStreet}
                          onChangeText={setCustomStreet}
                        />
                      </View>

                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 1, gap: 6 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color: colors.muted,
                            }}
                          >
                            Bairro
                          </Text>
                          <TextInput
                            style={[
                              styles.inputField,
                              {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.foreground,
                                marginBottom: 0,
                              },
                            ]}
                            placeholder="Bairro..."
                            placeholderTextColor={colors.muted}
                            value={customNeighborhood}
                            onChangeText={setCustomNeighborhood}
                          />
                        </View>
                        <View style={{ flex: 1, gap: 6 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color: colors.muted,
                            }}
                          >
                            CEP
                          </Text>
                          <TextInput
                            style={[
                              styles.inputField,
                              {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.foreground,
                                marginBottom: 0,
                              },
                            ]}
                            placeholder="Ex: 12900-000"
                            placeholderTextColor={colors.muted}
                            value={customCep}
                            onChangeText={(text) => {
                              const cleaned = text.replace(/\D/g, "");
                              let formatted = cleaned;
                              if (cleaned.length > 5) {
                                formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5, 8)}`;
                              }
                              setCustomCep(formatted);
                            }}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <View style={{ flex: 1, gap: 6 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color: colors.muted,
                            }}
                          >
                            Número *
                          </Text>
                          <TextInput
                            style={[
                              styles.inputField,
                              {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.foreground,
                                marginBottom: 0,
                              },
                            ]}
                            placeholder="Ex: 997"
                            placeholderTextColor={colors.muted}
                            value={customNumber}
                            onChangeText={setCustomNumber}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={{ flex: 1, gap: 6 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color: colors.muted,
                            }}
                          >
                            Complemento
                          </Text>
                          <TextInput
                            style={[
                              styles.inputField,
                              {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.foreground,
                                marginBottom: 0,
                              },
                            ]}
                            placeholder="Ex: Apto 12 (Opcional)"
                            placeholderTextColor={colors.muted}
                            value={customComplement}
                            onChangeText={setCustomComplement}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Chips de seleção de rótulo */}
                    <View style={styles.chipContainer}>
                      {[
                        { type: "casa", label: "Casa", icon: "home" },
                        { type: "trabalho", label: "Trabalho", icon: "work" },
                        { type: "outro", label: "Outro", icon: "place" },
                      ].map((chip) => {
                        const isSelected = activeLabelType === chip.type;
                        return (
                          <Pressable
                            key={chip.type}
                            onPress={() => setActiveLabelType(chip.type as any)}
                            style={[
                              styles.chipButton,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : colors.background,
                                borderColor: isSelected
                                  ? colors.primary
                                  : colors.border,
                              },
                            ]}
                          >
                            <MaterialIcons
                              name={chip.icon as any}
                              size={18}
                              color={isSelected ? "#FFFFFF" : colors.muted}
                            />
                            <Text
                              style={[
                                styles.chipText,
                                {
                                  color: isSelected
                                    ? "#FFFFFF"
                                    : colors.foreground,
                                },
                              ]}
                            >
                              {chip.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {activeLabelType === "outro" && (
                      <TextInput
                        style={[
                          styles.inputField,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.foreground,
                          },
                        ]}
                        placeholder="Ex: Faculdade, Casa da Mãe"
                        placeholderTextColor={colors.muted}
                        value={customLabel}
                        onChangeText={setCustomLabel}
                        maxLength={20}
                      />
                    )}

                    <View
                      style={{ flexDirection: "row", gap: 12, marginTop: 24 }}
                    >
                      <Pressable
                        onPress={() => setSelectedAddressToAdd(null)}
                        style={[
                          styles.actionButtonCancel,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: colors.foreground,
                            fontWeight: "600",
                          }}
                        >
                          Voltar
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSaveAddress}
                        style={[
                          styles.actionButtonConfirm,
                          { backgroundColor: colors.primary },
                          savingAddress && { opacity: 0.7 },
                        ]}
                        disabled={savingAddress}
                      >
                        {savingAddress ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                            Salvar Endereço
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  // BUSCA DE ENDEREÇO VIA NOMINATIM
                  <View style={{ gap: 16 }}>
                    <Text style={{ color: colors.muted, fontSize: 14 }}>
                      Busque o endereço completo para cadastrar
                    </Text>

                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        style={[
                          styles.searchAddressInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.foreground,
                          },
                        ]}
                        placeholder="Rua, número, bairro..."
                        placeholderTextColor={colors.muted}
                        value={addressInput}
                        onChangeText={setAddressInput}
                        onSubmitEditing={handleSearchAddress}
                        autoCorrect={false}
                        returnKeyType="search"
                      />
                      <Pressable
                        onPress={handleSearchAddress}
                        style={[
                          styles.searchAddressBtn,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        {searching ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                            Buscar
                          </Text>
                        )}
                      </Pressable>
                    </View>

                    {addressInput.trim().length > 0 && (
                      <Pressable
                        onPress={() => {
                          const manualItem: GeocodedAddress = {
                            id: `manual-${Date.now()}`,
                            displayName: addressInput.trim(),
                            latitude: coords?.latitude ?? -22.952,
                            longitude: coords?.longitude ?? -46.542,
                          };

                          let parsedNumber = "";
                          const numberMatch = addressInput.match(/\b\d+\b/);
                          if (numberMatch) {
                            parsedNumber = numberMatch[0];
                          }

                          setSelectedAddressToAdd(manualItem);
                          const streetNameWithoutNumber = addressInput
                            .replace(/\b\d+\b/g, "")
                            .replace(/\s+,/g, ",")
                            .trim();
                          setCustomStreet(
                            streetNameWithoutNumber || addressInput.trim(),
                          );
                          setCustomNeighborhood("");
                          setCustomCity("Bragança Paulista");
                          setCustomCep("");
                          setCustomNumber(parsedNumber);
                          setCustomComplement("");
                          setCustomLabel("");
                          setActiveLabelType("casa");
                        }}
                        style={[
                          styles.manualAddRow,
                          {
                            borderColor: colors.primary + "40",
                            backgroundColor: colors.background,
                          },
                        ]}
                      >
                        <MaterialIcons
                          name="add-location"
                          size={20}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.manualAddText,
                            { color: colors.primary },
                          ]}
                          numberOfLines={1}
                        >
                          Adicionar "{addressInput.trim()}" manualmente
                        </Text>
                      </Pressable>
                    )}

                    {searchError && (
                      <Text style={{ color: "#EF4444", fontSize: 13 }}>
                        {searchError}
                      </Text>
                    )}

                    {searchResults.length > 0 && (
                      <View style={{ gap: 8, marginTop: 8 }}>
                        {searchResults.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => {
                              setSelectedAddressToAdd(item);
                              const parts = item.displayName.split(", ");
                              const street = parts[0] || "";
                              const neighborhood =
                                item.neighborhood || parts[1] || "";
                              const city =
                                item.city ||
                                (parts[2]
                                  ? parts[2].split(" - ")[0]
                                  : "Bragança Paulista");

                              // Parse number from addressInput
                              let parsedNumber = "";
                              const numberMatch = addressInput.match(/\b\d+\b/);
                              if (numberMatch) {
                                parsedNumber = numberMatch[0];
                              }

                              setCustomStreet(street);
                              setCustomNeighborhood(neighborhood);
                              setCustomCity(city);
                              setCustomCep(item.cep || "");
                              setCustomNumber(parsedNumber);
                              setCustomComplement("");
                              setCustomLabel("");
                              setActiveLabelType("casa");
                            }}
                            style={({ pressed }) => [
                              styles.searchResultItem,
                              { borderBottomColor: colors.border },
                              pressed && { backgroundColor: colors.background },
                            ]}
                          >
                            <MaterialIcons
                              name="location-on"
                              size={18}
                              color={colors.muted}
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  color: colors.foreground,
                                  fontWeight: "600",
                                  fontSize: 13,
                                }}
                                numberOfLines={1}
                              >
                                {item.displayName.split(",")[0]}
                              </Text>
                              <Text
                                style={{ color: colors.muted, fontSize: 12 }}
                                numberOfLines={2}
                              >
                                {item.displayName}
                              </Text>
                            </View>
                            <MaterialIcons
                              name="add"
                              size={20}
                              color={colors.primary}
                            />
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            ) : (
              // LISTA DE ENDEREÇOS SALVOS
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalBody}
              >
                {savedAddresses.length > 0 ? (
                  <View style={{ gap: 12 }}>
                    {savedAddresses.map((item) => (
                      <View
                        key={item.id}
                        style={[
                          styles.addressItemRow,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.addressIconWrapper,
                            { backgroundColor: colors.primary + "15" },
                          ]}
                        >
                          <MaterialIcons
                            name={getLabelIcon(item.label) as any}
                            size={20}
                            color={colors.primary}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: colors.foreground,
                              fontWeight: "700",
                              fontSize: 14,
                            }}
                          >
                            {item.label}
                          </Text>
                          <Text
                            style={{ color: colors.muted, fontSize: 12 }}
                            numberOfLines={1}
                          >
                            {item.addressName}
                          </Text>
                        </View>

                        {/* Botão de Editar */}
                        <Pressable
                          onPress={(e) => handleEditSavedAddress(item, e)}
                          style={({ pressed }) => [
                            { padding: 8, marginRight: 4 },
                            pressed && { opacity: 0.6 },
                          ]}
                        >
                          <MaterialIcons
                            name="edit"
                            size={20}
                            color={colors.primary}
                          />
                        </Pressable>

                        {/* Botão de Excluir */}
                        <Pressable
                          onPress={() => handleDeleteAddress(item.id)}
                          style={({ pressed }) => [
                            styles.deleteBtnRow,
                            pressed && { opacity: 0.6 },
                          ]}
                        >
                          <MaterialIcons
                            name="delete-outline"
                            size={20}
                            color="#EF4444"
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyAddressesView}>
                    <MaterialIcons
                      name="place"
                      size={48}
                      color={colors.muted}
                    />
                    <Text
                      style={{
                        color: colors.muted,
                        textAlign: "center",
                        fontSize: 14,
                        marginTop: 8,
                      }}
                    >
                      Nenhum endereço cadastrado. Salve seus locais frequentes
                      para facilitar o cálculo de distâncias.
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={() => setIsAddingNew(true)}
                  style={({ pressed }) => [
                    styles.addNewAddressBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <MaterialIcons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addNewAddressBtnText}>
                    Adicionar Endereço
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal da Política de Privacidade */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={privacyModalVisible}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Política de Privacidade
              </Text>
              <Pressable
                onPress={() => setPrivacyModalVisible(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              <Text style={[styles.policyIntro, { color: colors.foreground }]}>
                Bem-vindo ao XamaJá. Sua privacidade é importante para nós. Esta
                Política de Privacidade explica como coletamos, utilizamos,
                armazenamos e protegemos suas informações ao utilizar nosso
                aplicativo.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                1. INFORMAÇÕES COLETADAS
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O XamaJá pode coletar as seguintes informações fornecidas pelo
                usuário:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "Nome completo",
                  "E-mail",
                  "Número de telefone",
                  "Foto de perfil",
                  "Endereços cadastrados",
                  "Informações relacionadas a serviços e agendamentos",
                  "Avaliações realizadas dentro da plataforma",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>
                      •
                    </Text>
                    <Text
                      style={[styles.bulletText, { color: colors.foreground }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 12 },
                ]}
              >
                Também podemos coletar automaticamente algumas informações do
                dispositivo e uso do aplicativo:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "Modelo do aparelho",
                  "Sistema operacional",
                  "Endereço IP",
                  "Dados de navegação e utilização do aplicativo",
                  "Informações de desempenho e diagnóstico",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>
                      •
                    </Text>
                    <Text
                      style={[styles.bulletText, { color: colors.foreground }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                2. COMO UTILIZAMOS SUAS INFORMAÇÕES
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Utilizamos seus dados para:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "Permitir o funcionamento correto do aplicativo",
                  "Conectar clientes e prestadores de serviços",
                  "Exibir profissionais e estabelecimentos próximos ao usuário",
                  "Melhorar a experiência de navegação",
                  "Personalizar recomendações and conteúdos",
                  "Enviar notificações importantes",
                  "Garantir segurança, autenticação e prevenção contra fraudes",
                  "Cumprir obrigações legais e regulatórias",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>
                      •
                    </Text>
                    <Text
                      style={[styles.bulletText, { color: colors.foreground }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                3. COMPARTILHAMENTO DE INFORMAÇÕES
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O XamaJá não vende informações pessoais dos usuários.
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 8 },
                ]}
              >
                As informações poderão ser compartilhadas apenas quando
                necessário para:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "Permitir a prestação dos serviços oferecidos na plataforma",
                  "Atender determinações legais ou judiciais",
                  "Proteger direitos, segurança e integridade dos usuários e da plataforma",
                  "Operação de serviços essenciais para funcionamento do aplicativo",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>
                      •
                    </Text>
                    <Text
                      style={[styles.bulletText, { color: colors.foreground }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                4. USO DA LOCALIZAÇÃO
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O XamaJá poderá utilizar a localização do usuário, mediante
                autorização, para:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "Exibir profissionais e estabelecimentos próximos",
                  "Calcular a distância entre usuários e prestadores de serviço",
                  "Melhorar a relevância dos resultados exibidos",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>
                      •
                    </Text>
                    <Text
                      style={[styles.bulletText, { color: colors.foreground }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 8 },
                ]}
              >
                O usuário pode revogar essa permissão a qualquer momento nas
                configurações do dispositivo.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                5. SEGURANÇA DOS DADOS
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Adotamos medidas técnicas e organizacionais adequadas para
                proteger as informações dos usuários contra acessos não
                autorizados, perda, alteração, divulgação ou destruição
                indevida.
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 8 },
                ]}
              >
                Apesar dos esforços empregados, nenhum sistema de armazenamento
                ou transmissão de dados é totalmente seguro.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                6. EXCLUSÃO DE CONTA E DADOS
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O usuário poderá excluir sua conta diretamente pelo aplicativo
                através da área de configurações.
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 8 },
                ]}
              >
                Após a solicitação de exclusão, os dados pessoais serão
                removidos ou anonimizados, exceto quando houver necessidade
                legal de retenção ou cumprimento de obrigações regulatórias.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                7. RESPONSABILIDADE SOBRE OS SERVIÇOS
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O XamaJá atua exclusivamente como uma plataforma de conexão
                entre usuários, profissionais autônomos, prestadores de serviços
                e estabelecimentos comerciais.
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 8 },
                ]}
              >
                A execução dos serviços contratados, qualidade do atendimento,
                preços praticados, prazos e demais condições são de
                responsabilidade exclusiva das partes envolvidas na contratação.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                8. LGPD
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O tratamento dos dados pessoais é realizado em conformidade com
                a Lei Geral de Proteção de Dados (Lei nº 13.709/2018),
                observando os princípios da finalidade, necessidade,
                transparência, segurança e boa-fé.
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 8 },
                ]}
              >
                O usuário poderá exercer seus direitos previstos na LGPD
                mediante contato pelos canais de atendimento informados nesta
                política.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                9. ALTERAÇÕES NESTA POLÍTICA
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Esta Política de Privacidade poderá ser atualizada
                periodicamente para refletir melhorias no aplicativo, alterações
                legais ou mudanças em nossos serviços.
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 8 },
                ]}
              >
                Recomendamos a consulta periódica deste documento.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                10. CONTATO
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginBottom: 12 },
                ]}
              >
                Em caso de dúvidas, solicitações ou assuntos relacionados à
                privacidade e proteção de dados, entre em contato conosco:
              </Text>
              <Pressable
                onPress={() =>
                  Linking.openURL("mailto:chamajasuporte@gmail.com")
                }
                style={({ pressed }) => [
                  styles.emailButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <MaterialIcons name="email" size={16} color="#FFFFFF" />
                <Text style={styles.emailButtonText}>
                  chamajasuporte@gmail.com
                </Text>
              </Pressable>

              <Text
                style={[
                  styles.policyText,
                  {
                    color: colors.muted,
                    marginTop: 24,
                    fontSize: 12,
                    fontStyle: "italic",
                    textAlign: "center",
                  },
                ]}
              >
                Ao utilizar o XamaJá, você declara estar ciente e concordar com
                os termos desta Política de Privacidade.
              </Text>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal dos Termos de Uso */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={termsModalVisible}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Termos de Uso
              </Text>
              <Pressable
                onPress={() => setTermsModalVisible(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              <Text style={[styles.policyIntro, { color: colors.foreground }]}>
                Ao utilizar o XamaJá, você concorda com os seguintes termos:
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                1. Sobre o aplicativo
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O XamaJá é uma plataforma que conecta clientes a prestadores de
                serviços e empresas locais.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                2. Cadastro
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O usuário é responsável pelas informações fornecidas no
                cadastro.
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 8, fontWeight: "600" },
                ]}
              >
                É proibido:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "utilizar informações falsas",
                  "criar contas fraudulentas",
                  "praticar atividades ilegais",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>
                      •
                    </Text>
                    <Text
                      style={[styles.bulletText, { color: colors.foreground }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                3. Prestadores de serviço
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Os prestadores são responsáveis pelos serviços oferecidos dentro
                da plataforma.
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 6 },
                ]}
              >
                O XamaJá atua apenas como intermediador entre cliente e
                profissional.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                4. Pagamentos
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Alguns serviços podem envolver pagamentos dentro ou fora da
                plataforma.
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 6 },
                ]}
              >
                O XamaJá poderá cobrar taxas, comissões ou valores promocionais.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                5. Avaliações
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Os usuários podem avaliar serviços realizados.
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 6 },
                ]}
              >
                Comentários ofensivos, discriminatórios ou falsos poderão ser
                removidos.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                6. Suspensão de contas
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O XamaJá poderá suspender contas que:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "violem os termos",
                  "pratiquem golpes",
                  "prejudiquem outros usuários",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>
                      •
                    </Text>
                    <Text
                      style={[styles.bulletText, { color: colors.foreground }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                7. Limitação de responsabilidade
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O XamaJá não se responsabiliza diretamente pela execução dos
                serviços realizados pelos prestadores.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                8. Alterações
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Os termos poderão ser alterados a qualquer momento.
              </Text>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Ajuda e Suporte */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={helpModalVisible}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Ajuda e Suporte
              </Text>
              <Pressable
                onPress={() => setHelpModalVisible(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              <Text style={[styles.policyIntro, { color: colors.foreground }]}>
                Precisa de ajuda? Estamos aqui para ajudar você.
              </Text>

              <Text
                style={[styles.policySectionTitle, { color: colors.primary }]}
              >
                Suporte ao usuário
              </Text>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginBottom: 8 },
                ]}
              >
                Entre em contato com nossa equipe:
              </Text>
              <Pressable
                onPress={() =>
                  Linking.openURL("mailto:chamajasuporte@gmail.com")
                }
                style={({ pressed }) => [
                  styles.emailButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <MaterialIcons name="email" size={16} color="#FFFFFF" />
                <Text style={styles.emailButtonText}>
                  chamajasuporte@gmail.com
                </Text>
              </Pressable>

              <Text
                style={[
                  styles.policySectionTitle,
                  { color: colors.primary, marginTop: 24 },
                ]}
              >
                Problemas comuns
              </Text>

              <Text
                style={[
                  styles.policySectionTitle,
                  { fontSize: 14, marginTop: 12 },
                ]}
              >
                Não consigo entrar na conta
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Verifique seu e-mail e senha ou utilize a opção “Esqueci minha
                senha”.
              </Text>

              <Text
                style={[
                  styles.policySectionTitle,
                  { fontSize: 14, marginTop: 16 },
                ]}
              >
                Como contratar um serviço?
              </Text>
              <View style={styles.bulletList}>
                {[
                  "Escolha uma categoria",
                  "Selecione um profissional",
                  "Chame-o no Whatsapp",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>
                      {idx + 1}.
                    </Text>
                    <Text
                      style={[styles.bulletText, { color: colors.foreground }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                style={[
                  styles.policySectionTitle,
                  { fontSize: 14, marginTop: 16 },
                ]}
              >
                Como virar prestador?
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Na tela de perfil, clique em:
              </Text>
              <View
                style={[styles.bulletRow, { marginTop: 8, paddingLeft: 8 }]}
              >
                <MaterialIcons
                  name="check-circle"
                  size={16}
                  color="#16A34A"
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={[
                    styles.bulletText,
                    { color: colors.foreground, fontWeight: "600" },
                  ]}
                >
                  “Seja um prestador”
                </Text>
              </View>
              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 6 },
                ]}
              >
                e complete seu cadastro.
              </Text>

              <Text
                style={[
                  styles.policySectionTitle,
                  { fontSize: 14, marginTop: 16 },
                ]}
              >
                Como denunciar um usuário?
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Entre no perfil do usuário e utilize a opção “Denunciar”.
              </Text>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Sobre o XamaJá */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={aboutModalVisible}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Sobre o XamaJá
              </Text>
              <Pressable
                onPress={() => setAboutModalVisible(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              <Text
                style={[
                  styles.policyIntro,
                  { color: colors.foreground, fontSize: 16, fontWeight: "600" },
                ]}
              >
                O XamaJá é uma plataforma criada para conectar pessoas a
                profissionais e empresas locais de forma rápida, prática e
                segura.
              </Text>

              <Text
                style={[
                  styles.policyText,
                  { color: colors.foreground, marginTop: 12 },
                ]}
              >
                Nosso objetivo é facilitar a contratação de serviços do dia a
                dia, aproximando clientes de prestadores da própria cidade.
              </Text>

              <Text
                style={[
                  styles.policySectionTitle,
                  { color: colors.primary, marginTop: 24 },
                ]}
              >
                Com o XamaJá você pode:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "encontrar profissionais próximos",
                  "agendar serviços",
                  "contratar empresas locais",
                  "divulgar seus próprios serviços",
                  "anunciar dentro da plataforma",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>
                      •
                    </Text>
                    <Text
                      style={[styles.bulletText, { color: colors.foreground }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                style={[
                  styles.policyText,
                  {
                    color: colors.foreground,
                    marginTop: 16,
                    fontWeight: "600",
                    fontStyle: "italic",
                  },
                ]}
              >
                Tudo isso em um único aplicativo.
              </Text>

              <Text
                style={[
                  styles.policySectionTitle,
                  { color: colors.primary, marginTop: 24 },
                ]}
              >
                Nossa missão
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Facilitar a conexão entre clientes e prestadores locais através
                da tecnologia.
              </Text>

              <View
                style={{
                  marginTop: 32,
                  padding: 20,
                  borderRadius: 16,
                  alignItems: "center",
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: colors.primary,
                    marginBottom: 4,
                  }}
                >
                  XamaJá
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.foreground,
                    fontStyle: "italic",
                    textAlign: "center",
                  }}
                >
                  “O que você precisa, perto de você.” 🚀
                </Text>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#E5E7EB",
  },
  providerBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 18, fontWeight: "800" },
  userEmail: { fontSize: 13 },
  providerTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  providerTagText: { fontSize: 11, fontWeight: "700" },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  menuSection: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "700", color: "#EF4444" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  policyIntro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: "500",
  },
  policySectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bulletList: {
    marginTop: 8,
    paddingLeft: 8,
    gap: 6,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16A34A",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  emailButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  addressItemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  addressIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnRow: {
    padding: 6,
  },
  emptyAddressesView: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  addNewAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 24,
  },
  addNewAddressBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  searchAddressInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  searchAddressBtn: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  labelForm: {
    paddingTop: 8,
  },
  chipContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  chipButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  inputField: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 16,
  },
  actionButtonCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonConfirm: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  manualAddRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  manualAddText: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
});
