import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { categories, sections, getSectionServices, getProfessionalsByRanking } from "@/data/mock";

const CATEGORY_ICONS: Record<string, string> = {
  "assistencia-tecnica": "settings",
  "reformas-reparos": "build",
  "eventos": "celebration",
  "servicos-domesticos": "home",
  "aulas": "school",
};

export default function HomeScreen() {
  const router = useRouter();
  const premiumProfessionals = getProfessionalsByRanking().filter((p) => p.type === "PREMIUM").slice(0, 3);

  return (
    <ScreenContainer containerClassName="bg-[#F5F5F5]" className="">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, Pedro</Text>
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

        {/* Categories */}
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesContainer}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.categoryItem, pressed && { opacity: 0.7 }]}
              onPress={() =>
                router.push(`/categories/${item.id}` as any)
              }
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

        {/* Premium Professionals */}
        {premiumProfessionals.length > 0 && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <View style={styles.premiumHeaderRow}>
                <MaterialIcons name="star" size={20} color="#FCD34D" />
                <Text style={styles.sectionTitle}>Profissionais em Destaque</Text>
              </View>
              <Pressable>
                <Text style={styles.seeAll}>Ver mais</Text>
              </Pressable>
            </View>
            <FlatList
              data={premiumProfessionals}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.premiumRow}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.premiumCard, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push(`/professional/${item.id}` as any)}
                >
                  <Image source={{ uri: item.avatar }} style={styles.premiumAvatar} />
                  <View style={styles.premiumBadgeHome}>
                    <MaterialIcons name="star" size={12} color="#FCD34D" />
                  </View>
                  <Text style={styles.premiumName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.premiumRating}>
                    <MaterialIcons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.premiumRatingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Sections */}
        {sections.map((section) => {
          const sectionServices = getSectionServices(section.id);
          return (
            <View key={section.id} style={styles.sectionWrapper}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Pressable
                  onPress={() =>
router.push(`/categories/${section.id}` as any)
                  }
                >
                  <Text style={styles.seeAll}>Ver tudo</Text>
                </Pressable>
              </View>

              {/* Service Cards Row */}
              <View style={styles.cardsRow}>
                {sectionServices.map((service) => (
                  <Pressable
                    key={service.id}
                    style={({ pressed }) => [styles.serviceCard, pressed && { opacity: 0.85 }]}
                    onPress={() =>
router.push(`/professionals/${service.id}` as any)
                    }
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
  bellBtn: {
    padding: 4,
  },
  bellWrapper: {
    position: "relative",
  },
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
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
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
  searchPlaceholder: {
    fontSize: 14,
    color: "#9CA3AF",
    flex: 1,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  categoryItem: {
    alignItems: "center",
    width: 76,
    gap: 6,
  },
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
  sectionWrapper: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  seeAll: {
    fontSize: 13,
    color: "#1A73E8",
    fontWeight: "500",
  },
  cardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
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
  serviceImage: {
    width: "100%",
    height: 90,
    backgroundColor: "#F3F4F6",
  },
  serviceName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111827",
    padding: 8,
    paddingTop: 6,
    lineHeight: 16,
  },
  premiumHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  premiumRow: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
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
  premiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
  },
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
  premiumRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  premiumRatingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F59E0B",
  },
});
