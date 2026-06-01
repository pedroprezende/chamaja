import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFavorites } from "@/lib/favorites-context";
import { useLocation } from "@/lib/location-context";
import { calculateHaversineDistance, formatDistancePtBr } from "@/lib/location-utils";

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite } = useFavorites();
  const { coords, addressName, permissionGranted } = useLocation();
  const isDefaultCity = addressName === "Bragança Paulista - SP";
  const showDistance = permissionGranted || !isDefaultCity;

  const handleWhatsApp = (phone: string, name: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const msg = encodeURIComponent(
      `Olá ${name}, encontrei seu perfil no ChamaJá e gostaria de solicitar um orçamento.`
    );
    Linking.openURL(`https://wa.me/${number}?text=${msg}`).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.")
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Favoritos</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
         showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const distanceStr = (() => {
            if (showDistance && coords && item.latitude !== null && item.latitude !== undefined && item.longitude !== null && item.longitude !== undefined) {
              const distKm = calculateHaversineDistance(
                coords.latitude,
                coords.longitude,
                Number(item.latitude),
                Number(item.longitude)
              );
              return formatDistancePtBr(distKm);
            }
            return null;
          })();

          return (
            <View style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.cardMain, pressed && { opacity: 0.85 }]}
                onPress={() => router.push(`/professional/${item.id}` as any)}
              >
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    {item.type === "premium" && (
                      <View style={styles.premiumBadge}>
                        <MaterialIcons name="workspace-premium" size={10} color="#92400E" />
                        <Text style={styles.premiumText}>PREMIUM</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.category}>{item.category}</Text>
                  <View style={styles.ratingRow}>
                    <MaterialIcons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
                    <Text style={styles.city}>• {item.city}</Text>
                    {distanceStr && (
                      <Text style={[styles.city, { color: "#22C55E", fontWeight: "700" }]}>
                        {" • 📍 " + distanceStr}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [styles.whatsappBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => handleWhatsApp(item.phone, item.name)}
                >
                  <MaterialIcons name="chat" size={16} color="#fff" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => toggleFavorite(item)}
                >
                  <MaterialIcons name="favorite" size={18} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="favorite-border" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
            <Text style={styles.emptySubtitle}>
              Toque no coração no perfil de um profissional para salvá-lo aqui
            </Text>
            <Pressable
              style={styles.ctaBtn}
              onPress={() => router.push("/(tabs)/search" as any)}
            >
              <Text style={styles.ctaBtnText}>Explorar profissionais</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#111827", textAlign: "center" },
  listContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 14, marginBottom: 10, overflow: "hidden",
    borderWidth: 1, borderColor: "#F3F4F6",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardMain: { flex: 1, flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E5E7EB" },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "700", color: "#111827", flexShrink: 1 },
  premiumBadge: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: "#FDE68A", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  premiumText: { fontSize: 9, fontWeight: "800", color: "#92400E" },
  category: { fontSize: 13, color: "#6B7280" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  rating: { fontSize: 12, fontWeight: "600", color: "#374151" },
  city: { fontSize: 12, color: "#9CA3AF" },
  actions: { flexDirection: "column", gap: 6, paddingRight: 12 },
  whatsappBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
  },
  removeBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#FEF2F2",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#FECACA",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151", marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 32, lineHeight: 20 },
  ctaBtn: {
    marginTop: 16, backgroundColor: "#25D366", borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  ctaBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
