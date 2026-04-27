import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getProfessionalsByService, getProfessionalsByRanking, professionals } from "@/data/mock";
import type { Professional } from "@/data/mock";

function openWhatsApp(phone: string) {
  const message = encodeURIComponent(
    "Olá, encontrei seu contato no app ChamaJá e gostaria de um serviço."
  );
  const url = `https://wa.me/${phone}?text=${message}`;
  Linking.openURL(url).catch(() =>
    Alert.alert("Erro", "Não foi possível abrir o WhatsApp.")
  );
}

function ProfessionalCard({
  item,
  onPress,
}: {
  item: Professional;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      onPress={onPress}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.type === "PREMIUM" && (
            <View style={styles.premiumBadge}>
              <MaterialIcons name="star" size={12} color="#FCD34D" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>
        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={14} color="#F59E0B" />
          <Text style={styles.rating}>
            {item.rating.toFixed(1)}{" "}
            <Text style={styles.reviewCount}>({item.reviewCount} avaliações)</Text>
          </Text>
        </View>
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={13} color="#9CA3AF" />
          <Text style={styles.location}>
            {item.neighborhood} • {item.distance}
          </Text>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.whatsappBtn, pressed && { opacity: 0.8 }]}
        onPress={(e) => {
          e.stopPropagation();
          openWhatsApp(item.phone);
        }}
      >
        <MaterialIcons name="chat" size={16} color="#25D366" />
        <Text style={styles.whatsappText}>WhatsApp</Text>
      </Pressable>
    </Pressable>
  );
}

export default function ProfessionalsScreen() {
  const { category, title } = useLocalSearchParams<{
    category: string;
    title: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const data = category
    ? getProfessionalsByRanking(category)
    : getProfessionalsByRanking();

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || "Profissionais"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Buscar ${title || "profissional"}...`}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <Pressable style={styles.filterBtn}>
          <MaterialIcons name="filter-list" size={22} color="#374151" />
        </Pressable>
      </View>

      {/* Location filter */}
      <Pressable style={styles.locationFilter}>
        <MaterialIcons name="location-on" size={16} color="#25D366" />
        <Text style={styles.locationFilterText}>Próximo a você</Text>
        <MaterialIcons name="keyboard-arrow-down" size={18} color="#374151" />
      </Pressable>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProfessionalCard
            item={item}
            onPress={() =>
              router.push(`/professional/${item.id}` as any)
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.comingSoon}>
            <View style={styles.comingSoonIconWrapper}>
              <MaterialIcons name="schedule" size={48} color="#25D366" />
            </View>
            <Text style={styles.comingSoonTitle}>Em breve</Text>
            <Text style={styles.comingSoonSubtitle}>
              {`Estamos adicionando profissionais nesta categoria.\nVolte em breve!`}
            </Text>
            <View style={styles.comingSoonBadge}>
              <MaterialIcons name="notifications-active" size={14} color="#25D366" />
              <Text style={styles.comingSoonBadgeText}>Novidades chegando</Text>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  premiumBadge: {
    backgroundColor: "#FCD34D",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#78350F",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    padding: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  locationFilter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  locationFilterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginRight: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rating: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  reviewCount: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6B7280",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  location: {
    fontSize: 12,
    color: "#6B7280",
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#25D366",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 4,
    marginLeft: 8,
  },
  whatsappText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#25D366",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
  },
  comingSoon: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 16,
  },
  comingSoonIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#BBF7D0",
  },
  comingSoonTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  comingSoonSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginTop: 4,
  },
  comingSoonBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#25D366",
  },
});
