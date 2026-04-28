import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Linking,
  Alert,
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

/** Normaliza número brasileiro e abre WhatsApp */
function openWhatsApp(phone: string, serviceName: string) {
  // Remove tudo que não é dígito
  let number = phone.replace(/\D/g, "");
  // Adiciona código do Brasil se não tiver
  if (!number.startsWith("55")) {
    number = "55" + number;
  }
  const message = encodeURIComponent(
    `Olá! Vi o serviço "${serviceName}" no ChamaJá e gostaria de mais informações. 😊`
  );
  const url = `https://wa.me/${number}?text=${message}`;
  Linking.openURL(url).catch(() => {
    Alert.alert(
      "WhatsApp não encontrado",
      "Não foi possível abrir o WhatsApp. Verifique se o aplicativo está instalado."
    );
  });
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
  const hasWhatsapp = !!service.whatsapp?.trim();

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

          {service.description ? (
            <Text style={styles.description}>{service.description}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <MaterialIcons name="calendar-today" size={14} color="#9CA3AF" />
            <Text style={styles.metaText}>
              Disponível desde {new Date(service.createdAt).toLocaleDateString("pt-BR")}
            </Text>
          </View>

          {/* Contato via WhatsApp — exibido apenas quando número estiver cadastrado */}
          {hasWhatsapp ? (
            <>
              {/* Número visível */}
              <View style={styles.whatsappInfoRow}>
                <MaterialIcons name="phone" size={16} color="#25D366" />
                <Text style={styles.whatsappNumber}>{service.whatsapp}</Text>
              </View>

              {/* Botão principal WhatsApp */}
              <Pressable
                style={({ pressed }) => [styles.whatsappBtn, pressed && { opacity: 0.85 }]}
                onPress={() => openWhatsApp(service.whatsapp!, service.name)}
              >
                <MaterialIcons name="chat" size={20} color="#FFFFFF" />
                <Text style={styles.whatsappBtnText}>Chamar no WhatsApp</Text>
              </Pressable>

              {/* Divisor */}
              <View style={styles.divider} />
            </>
          ) : null}

          {/* CTA — buscar profissionais na categoria */}
          {!hasWhatsapp && (
            <View style={styles.ctaBox}>
              <MaterialIcons name="info-outline" size={18} color="#2563EB" />
              <Text style={styles.ctaText}>
                Para contratar este serviço, busque profissionais da categoria{" "}
                <Text style={{ fontWeight: "700" }}>{service.category}</Text> no app.
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.searchBtn,
              hasWhatsapp && styles.searchBtnOutline,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() =>
              router.push(`/professionals/${service.category.toLowerCase()}` as any)
            }
          >
            <MaterialIcons name="search" size={20} color={hasWhatsapp ? "#25D366" : "#FFFFFF"} />
            <Text style={[styles.searchBtnText, hasWhatsapp && styles.searchBtnTextOutline]}>
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
  // WhatsApp
  whatsappInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  whatsappNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#15803D",
  },
  whatsappBtn: {
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsappBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
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
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    backgroundColor: "#25D366",
  },
  searchBtnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#25D366",
  },
  searchBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchBtnTextOutline: {
    color: "#25D366",
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
