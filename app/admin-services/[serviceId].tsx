import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdminServices } from "@/hooks/use-admin-services";

const CATEGORY_ICONS: Record<string, string> = {
  eletricista: "electrical-services",
  encanador: "plumbing",
  diarista: "cleaning-services",
  pintor: "format-paint",
  pedreiro: "construction",
  marceneiro: "carpenter",
  jardineiro: "yard",
  default: "build",
};

function getCategoryIcon(category: string): string {
  const key = category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  for (const k of Object.keys(CATEGORY_ICONS)) {
    if (key.includes(k)) return CATEGORY_ICONS[k];
  }
  return CATEGORY_ICONS.default;
}

export default function AdminServiceDetailScreen() {
  const { serviceId, title } = useLocalSearchParams<{
    serviceId: string;
    title?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { services } = useAdminServices();

  const service = services.find((s) => s.id === serviceId);

  if (!service) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>{title || "Serviço"}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.empty}>
          <MaterialIcons name="search-off" size={52} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Serviço não encontrado</Text>
        </View>
      </View>
    );
  }

  const iconName = getCategoryIcon(service.category) as any;

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
          {service.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Imagem de capa */}
        {service.imageUri ? (
          <Image
            source={{ uri: service.imageUri }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <MaterialIcons name={iconName} size={56} color="#25D366" />
          </View>
        )}

        {/* Info */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{service.category}</Text>
            </View>
          </View>

          <Text style={styles.description}>{service.description}</Text>

          <View style={styles.metaRow}>
            <MaterialIcons name="calendar-today" size={14} color="#9CA3AF" />
            <Text style={styles.metaText}>
              Disponível desde {new Date(service.createdAt).toLocaleDateString("pt-BR")}
            </Text>
          </View>

          {/* CTA */}
          <View style={styles.ctaBox}>
            <MaterialIcons name="info-outline" size={18} color="#2563EB" />
            <Text style={styles.ctaText}>
              Para contratar este serviço, busque profissionais da categoria{" "}
              <Text style={{ fontWeight: "700" }}>{service.category}</Text> no app.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.8 }]}
            onPress={() =>
              router.push(`/professionals/${service.category.toLowerCase()}` as any)
            }
          >
            <MaterialIcons name="search" size={20} color="#FFFFFF" />
            <Text style={styles.searchBtnText}>
              Buscar profissionais de {service.category}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
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
  coverImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#F3F4F6",
  },
  coverPlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },
  content: {
    padding: 20,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  serviceName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },
  description: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  ctaBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  ctaText: {
    flex: 1,
    fontSize: 13,
    color: "#1D4ED8",
    lineHeight: 19,
  },
  searchBtn: {
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  searchBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
});
