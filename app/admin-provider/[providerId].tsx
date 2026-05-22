/**
 * Tela de detalhe de um Prestador Admin
 * Exibe informações completas do prestador cadastrado pelo admin.
 */
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Linking,
  Alert,
  Dimensions,
  FlatList,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adminProvidersDB, type AdminProvider } from "@/lib/admin-providers-db";
import { useWindowDimensions } from "react-native";
import { useLocation } from "@/lib/location-context";
import { calculateHaversineDistance, formatDistancePtBr } from "@/lib/location-utils";

function openWhatsApp(phone: string, name: string) {
  let number = phone.replace(/\D/g, "");
  if (!number.startsWith("55")) number = "55" + number;
  const msg = encodeURIComponent(
    `Olá ${name}! Vi o seu perfil no ChamaJá e gostaria de solicitar um serviço. 😊`
  );
  Linking.openURL(`https://wa.me/${number}?text=${msg}`).catch(() =>
    Alert.alert("WhatsApp não encontrado", "Verifique se o WhatsApp está instalado.")
  );
}

export default function AdminProviderDetailScreen() {
  const { width: WINDOW_WIDTH } = useWindowDimensions();
  const width = Platform.OS === "web" ? Math.min(WINDOW_WIDTH, 500) : WINDOW_WIDTH;

  const { providerId, title } = useLocalSearchParams<{ providerId: string; title: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coords } = useLocation();

  const [provider, setProvider] = useState<AdminProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const distance = useMemo(() => {
    if (coords && provider && provider.latitude !== null && provider.latitude !== undefined && provider.longitude !== null && provider.longitude !== undefined) {
      const lat = Number(provider.latitude);
      const lon = Number(provider.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        const distKm = calculateHaversineDistance(coords.latitude, coords.longitude, lat, lon);
        return formatDistancePtBr(distKm);
      }
    }
    return null;
  }, [coords, provider]);

  useEffect(() => {
    (async () => {
      try {
        adminProvidersDB.resetCache();
        const all = await adminProvidersDB.getAll();
        const found = all.find((p) => p.id === providerId);
        setProvider(found ?? null);
      } catch {
        setProvider(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [providerId]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>{title || "Prestador"}</Text>
        </View>
        <View style={styles.loadingCenter}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Prestador</Text>
        </View>
        <View style={styles.loadingCenter}>
          <MaterialIcons name="error-outline" size={48} color="#D1D5DB" />
          <Text style={styles.notFoundText}>Prestador não encontrado</Text>
        </View>
      </View>
    );
  }

  const gallery = provider.gallery ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{provider.name}</Text>
        <View style={styles.verifiedBadge}>
          <MaterialIcons name="verified" size={14} color="#25D366" />
          <Text style={styles.verifiedText}>Verificado</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Foto de perfil + nome */}
        <View style={styles.heroSection}>
          {provider.avatarUri ? (
            <Image source={{ uri: provider.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialIcons name="person" size={48} color="#9CA3AF" />
            </View>
          )}
          <Text style={styles.providerName}>{provider.name}</Text>
          <View style={styles.serviceBadge}>
            <MaterialIcons name="work" size={12} color="#3B82F6" />
            <Text style={styles.serviceBadgeText}>{provider.serviceName}</Text>
          </View>
          {(!!provider.address || !!distance) && (
            <View style={styles.addressRow}>
              <MaterialIcons name="place" size={14} color="#9CA3AF" />
              <Text style={styles.addressText}>
                {provider.address || "Localização não informada"}{distance ? ` • ${distance}` : ""}
              </Text>
            </View>
          )}
          {provider.rating !== undefined && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialIcons
                  key={star}
                  name="star"
                  size={16}
                  color={star <= Math.round(provider.rating ?? 0) ? "#F59E0B" : "#E5E7EB"}
                />
              ))}
              <Text style={styles.ratingText}>
                {provider.rating.toFixed(1)}
                {provider.ratingCount ? ` (${provider.ratingCount} avaliações)` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Botão WhatsApp */}
        {!!provider.whatsapp && (
          <View style={styles.ctaSection}>
            <Pressable
              style={({ pressed }) => [styles.whatsappBtn, pressed && { opacity: 0.85 }]}
              onPress={() => openWhatsApp(provider.whatsapp!, provider.name)}
            >
              <MaterialIcons name="chat" size={20} color="#FFFFFF" />
              <Text style={styles.whatsappBtnText}>Chamar no WhatsApp</Text>
            </Pressable>
          </View>
        )}

        {/* Descrição */}
        {!!provider.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre</Text>
            <Text style={styles.descriptionText}>{provider.description}</Text>
          </View>
        )}

        {/* Galeria */}
        {gallery.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fotos do local ({gallery.length})</Text>
            <FlatList
              data={gallery}
              keyExtractor={(_, i) => String(i)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingRight: 20 }}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => setGalleryIndex(index)}
                  style={({ pressed }) => [styles.galleryThumb, pressed && { opacity: 0.85 }]}
                >
                  <Image
                    source={{ uri: item }}
                    style={[
                      styles.galleryThumbImg,
                      galleryIndex === index && styles.galleryThumbActive,
                    ]}
                    resizeMode="cover"
                  />
                </Pressable>
              )}
            />
            {/* Foto expandida */}
            <Image
              source={{ uri: gallery[galleryIndex] }}
              style={[styles.galleryMain, { height: width * 0.6 }]}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Informações adicionais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="category" size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>Serviço</Text>
              <Text style={styles.infoValue}>{provider.serviceName}</Text>
            </View>
            {!!provider.address && (
              <View style={styles.infoRow}>
                <MaterialIcons name="place" size={16} color="#6B7280" />
                <Text style={styles.infoLabel}>Endereço</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoValue}>{provider.address}</Text>
                  {distance ? (
                    <Text style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                      Distância aproximada: {distance}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
            {!!provider.whatsapp && (
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={16} color="#25D366" />
                <Text style={styles.infoLabel}>WhatsApp</Text>
                <Text style={[styles.infoValue, { color: "#25D366" }]}>{provider.whatsapp}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#111827" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: { fontSize: 11, color: "#25D366", fontWeight: "600" },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#6B7280" },
  notFoundText: { fontSize: 15, color: "#9CA3AF" },
  // Hero
  heroSection: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 4 },
  avatarPlaceholder: { backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  providerName: { fontSize: 22, fontWeight: "800", color: "#111827", textAlign: "center" },
  serviceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  serviceBadgeText: { fontSize: 13, color: "#3B82F6", fontWeight: "600" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  addressText: { fontSize: 13, color: "#9CA3AF" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingText: { fontSize: 13, color: "#6B7280", marginLeft: 4 },
  // CTA
  ctaSection: { paddingHorizontal: 20, paddingVertical: 16 },
  whatsappBtn: {
    backgroundColor: "#25D366",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  whatsappBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  // Sections
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 12 },
  descriptionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  // Gallery
  galleryThumb: { borderRadius: 10, overflow: "hidden" },
  galleryThumbImg: { width: 72, height: 72, borderRadius: 10 },
  galleryThumbActive: { borderWidth: 2, borderColor: "#25D366" },
  galleryMain: {
    width: "100%",
    borderRadius: 14,
    marginTop: 12,
  },
  // Info card
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: { fontSize: 13, color: "#6B7280", width: 70 },
  infoValue: { flex: 1, fontSize: 13, color: "#111827", fontWeight: "500" },
});
