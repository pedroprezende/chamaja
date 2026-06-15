import { View, Text, StyleSheet, FlatList, Pressable, Linking, Alert } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { useFavorites } from "@/lib/favorites-context";
import { useColors } from "@/hooks/use-colors";
import { useLocation } from "@/lib/location-context";
import { calculateHaversineDistance, formatDistancePtBr } from "@/lib/location-utils";

export default function FavoritesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();
  const { coords, addressName, permissionGranted } = useLocation();
  const isDefaultCity = addressName === "Bragança Paulista - SP";
  const showDistance = coords !== null;

  const handleWhatsApp = (phone: string, name: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const msg = encodeURIComponent(
      `Olá ${name}, vi seu perfil no XamaJá e gostaria de um orçamento.`
    );
    Linking.openURL(`https://wa.me/${number}?text=${msg}`).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.")
    );
  };

  return (
    <ScreenContainer edges={["left", "right"]} className="">
      {/* Header */}
      <LinearGradient
        colors={colors.background === "#F8F9FA" ? ["#FFFFFF", "#F8F9FA"] : ["#1E293B", "#0F172A"]}
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Favoritos</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

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
            <Pressable
              style={({ pressed }) => [
                styles.card, 
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
              ]}
              onPress={() => router.push(`/professional/${item.id}` as any)}
            >
              <Image 
                source={{ uri: item.avatar }} 
                style={styles.avatar} 
                contentFit="cover"
                transition={150}
              />
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.service, { color: colors.muted }]}>{item.category}</Text>
                <View style={styles.ratingRow}>
                  <MaterialIcons name="star" size={14} color={colors.star} />
                  <Text style={[styles.ratingText, { color: colors.muted }]}>{item.rating.toFixed(1)}</Text>
                  {distanceStr && (
                    <Text style={[styles.ratingText, { color: colors.primary, fontWeight: "700" }]}>
                      {" • 📍 " + distanceStr}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.right}>
                <Pressable
                  style={({ pressed }) => [styles.favoriteBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => toggleFavorite(item)}
                >
                  <MaterialIcons name="favorite" size={24} color="#EF4444" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.whatsappBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
                  onPress={() => handleWhatsApp(item.phone, item.name)}
                >
                  <MaterialIcons name="chat" size={14} color="#fff" />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="favorite-border" size={48} color={colors.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum favorito ainda</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Sua lista de profissionais favoritos aparecerá aqui para você encontrar mais rápido
            </Text>
            <Pressable
              style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/search" as any)}
            >
              <Text style={styles.ctaBtnText}>Explorar serviços</Text>
            </Pressable>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  listContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#E5E7EB" },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: "700" },
  service: { fontSize: 13, fontWeight: "500" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, fontWeight: "600" },
  right: { alignItems: "flex-end", gap: 8 },
  favoriteBtn: { padding: 4 },
  whatsappBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  emptySubtitle: {
    fontSize: 15, textAlign: "center",
    lineHeight: 22,
  },
  ctaBtn: {
    marginTop: 32, borderRadius: 16,
    paddingHorizontal: 32, paddingVertical: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  ctaBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
