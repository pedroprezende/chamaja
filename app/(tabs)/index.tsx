import {
  ScrollView,
  Text,
  View,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { AdsCarousel } from "@/components/ads-carousel";
import { categories, sections, getSectionServices } from "@/data/mock";
import { useAdminServices } from "@/hooks/use-admin-services";
import { useAds } from "@/hooks/use-ads";
import { useAuth } from "@/lib/auth-context";

const CATEGORY_ICONS: Record<string, string> = {
  "reformas-reparos":       "build",
  "assistencia-tecnica":    "settings",
  "servicos-domesticos":    "home",
  "servicos-externos":      "yard",
  "automotivo":             "directions-car",
  "beleza-estetica":        "content-cut",
  "servicos-profissionais": "business-center",
  "saude":                  "local-hospital",
  "eventos":                "celebration",
  "logistica":              "local-shipping",
  "educacao":               "school",
  "comercios":              "storefront",
  "mobilidade":             "commute",
};

const ADMIN_CATEGORY_ICONS: Record<string, string> = {
  eletricista: "electrical-services",
  encanador: "plumbing",
  diarista: "cleaning-services",
  pintor: "format-paint",
  pedreiro: "construction",
  marceneiro: "carpenter",
  jardineiro: "yard",
  default: "build",
};

function getAdminIcon(category: string): string {
  const key = category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  for (const k of Object.keys(ADMIN_CATEGORY_ICONS)) {
    if (key.includes(k)) return ADMIN_CATEGORY_ICONS[k];
  }
  return ADMIN_CATEGORY_ICONS.default;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { services: adminServices, isLoading: adminLoading } = useAdminServices(true);
  const { ads, isLoading: adsLoading } = useAds(true);

  // Nome do usuário logado
  const firstName = user?.name?.split(" ")[0] || "você";

  return (
    <ScreenContainer containerClassName="bg-[#F5F5F5]" className="">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {firstName}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.bellWrapper}>
              <MaterialIcons name="notifications-none" size={26} color="#111827" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Search Bar */}
        <Pressable
          style={styles.searchContainer}
          onPress={() => router.push("/search" as any)}
        >
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>O que você precisa?</Text>
        </Pressable>

        {/* Categories (mock) */}
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesContainer}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.categoryItem, pressed && { opacity: 0.7 }]}
              onPress={() => router.push(`/categories/${item.id}` as any)}
            >
              <View style={styles.categoryIconBox}>
                <MaterialIcons
                  name={CATEGORY_ICONS[item.id] as any}
                  size={26}
                  color="#374151"
                />
              </View>
              <Text style={styles.categoryLabel}>{item.name}</Text>
            </Pressable>
          )}
        />

        {/* ── Serviços do Admin ── */}
        {(adminLoading || adminServices.length > 0) && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="admin-panel-settings" size={18} color="#25D366" />
                <Text style={styles.sectionTitle}>Serviços Disponíveis</Text>
              </View>
            </View>

            {adminLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#25D366" />
              </View>
            ) : (
              <FlatList
                data={adminServices}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.adminServicesRow}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [styles.adminServiceCard, pressed && { opacity: 0.85 }]}
                    onPress={() =>
                      router.push({
                        pathname: "/admin-services/[serviceId]",
                        params: { serviceId: item.id, title: item.name },
                      } as any)
                    }
                  >
                    {item.imageUri ? (
                      <Image
                        source={{ uri: item.imageUri }}
                        style={styles.adminServiceImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.adminServiceIconBg}>
                        <MaterialIcons
                          name={getAdminIcon(item.category) as any}
                          size={30}
                          color="#25D366"
                        />
                      </View>
                    )}
                    <View style={styles.adminServiceInfo}>
                      <Text style={styles.adminServiceName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.adminServiceCategory} numberOfLines={1}>
                        {item.category}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        )}

        {/* Anúncios Patrocinados — substitui Profissionais em Destaque */}
        {!adsLoading && ads.length > 0 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <View style={styles.premiumHeaderRow}>
                <MaterialIcons name="campaign" size={20} color="#25D366" />
                <Text style={styles.sectionTitle}>Destaques</Text>
              </View>
            </View>
            <AdsCarousel ads={ads} />
          </View>
        )}

        {/* Sections (mock) */}
        {sections.map((section) => {
          const sectionServices = getSectionServices(section.id);
          return (
            <View key={section.id} style={styles.sectionWrapper}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Pressable onPress={() => router.push(`/categories/${section.id}` as any)}>
                  <Text style={styles.seeAll}>Ver tudo</Text>
                </Pressable>
              </View>
              <View style={styles.cardsRow}>
                {sectionServices.map((service) => (
                  <Pressable
                    key={service.id}
                    style={({ pressed }) => [styles.serviceCard, pressed && { opacity: 0.85 }]}
                    onPress={() => router.push(`/professionals/${service.id}` as any)}
                  >
                    <Image
                      source={{ uri: service.image }}
                      style={styles.serviceImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.serviceName} numberOfLines={2}>
                      {service.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  bellBtn: { padding: 4 },
  bellWrapper: { position: "relative" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchPlaceholder: { fontSize: 14, color: "#9CA3AF", flex: 1 },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  categoryItem: { alignItems: "center", width: 76, gap: 6 },
  categoryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 11,
    color: "#374151",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 14,
  },
  sectionWrapper: { marginTop: 8, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  seeAll: { fontSize: 13, color: "#1A73E8", fontWeight: "500" },
  loadingRow: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  // Admin services horizontal list
  adminServicesRow: {
    gap: 12,
    paddingBottom: 8,
  },
  adminServiceCard: {
    width: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  adminServiceImage: {
    width: "100%",
    height: 90,
    backgroundColor: "#F3F4F6",
  },
  adminServiceIconBg: {
    width: "100%",
    height: 90,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },
  adminServiceInfo: {
    padding: 8,
    gap: 2,
  },
  adminServiceName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  adminServiceCategory: {
    fontSize: 11,
    color: "#6B7280",
  },
  // Sections
  cardsRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  serviceCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceImage: { width: "100%", height: 90, backgroundColor: "#F3F4F6" },
  serviceName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
    padding: 8,
    paddingTop: 6,
    lineHeight: 16,
  },
  premiumHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  premiumRow: { gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  premiumCard: {
    width: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#FCD34D",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumAvatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 6 },
  premiumBadgeHome: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FCD34D",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  premiumName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  premiumRating: { flexDirection: "row", alignItems: "center", gap: 2 },
  premiumRatingText: { fontSize: 11, fontWeight: "600", color: "#F59E0B" },
});
