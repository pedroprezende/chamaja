import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function ReviewsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { professionalId } = useLocalSearchParams<{ professionalId: string }>();

  // Busca o profissional no banco de dados real
  const { data: professional, isLoading: loadingProfessional } = trpc.providers.getById.useQuery(professionalId || "");
  
  // Busca as avaliações no banco de dados (mescladas com mocks no backend)
  const { data: dbReviews, isLoading: loadingReviews } = trpc.providers.getReviews.useQuery(professionalId || "", {
    enabled: !!professionalId,
  });

  const isLoading = loadingProfessional || loadingReviews;
  const allReviews = dbReviews || [];

  if (isLoading) {
    return (
      <ScreenContainer edges={["left", "right"]} className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 12, fontWeight: "600" }}>Carregando avaliações...</Text>
      </ScreenContainer>
    );
  }

  if (!professional) {
    return (
      <ScreenContainer edges={["left", "right"]} className="items-center justify-center">
        <MaterialIcons name="person-off" size={64} color={colors.muted} />
        <Text style={[styles.errorText, { marginTop: 16, color: colors.foreground, fontWeight: "700" }]}>Profissional não encontrado</Text>
        <Pressable 
          onPress={() => router.back()}
          style={{ marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 }}
        >
          <Text style={{ color: "#FFF", fontWeight: "700" }}>Voltar</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={18}
            color={star <= rating ? colors.star : colors.muted + "40"}
          />
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item }: any) => (
    <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: item.userAvatar }} style={styles.userAvatar} />
        <View style={styles.reviewInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>{item.userName}</Text>
          <Text style={[styles.reviewDate, { color: colors.muted }]}>{item.createdAt}</Text>
        </View>
        {renderStars(item.rating)}
      </View>
      {item.comment ? (
        <Text style={[styles.reviewComment, { color: colors.muted }]}>{item.comment}</Text>
      ) : null}
    </View>
  );

  return (
    <ScreenContainer edges={["left", "right"]} className="">
      {/* Header */}
      <LinearGradient
        colors={colors.background === "#F8F9FA" ? ["#FFFFFF", "#F8F9FA"] : ["#1E293B", "#0F172A"]}
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Pressable
          style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.background }, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Avaliações</Text>
        <View style={{ width: 42 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Professional Info */}
        <View style={[styles.profCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <Image 
            source={{ uri: professional.avatarUri || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.name)}` }} 
            style={styles.profAvatar} 
          />
          <View style={styles.profInfo}>
            <Text style={[styles.profName, { color: colors.foreground }]}>{professional.name}</Text>
            <View style={styles.ratingContainer}>
              {renderStars(Number(professional.rating) || 0)}
              <Text style={[styles.ratingText, { color: colors.muted }]}>
                {Number(professional.rating).toFixed(1)} ({professional.ratingCount || 0} avaliações)
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={[styles.statsSection, { backgroundColor: colors.surface, marginHorizontal: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Distribuição de avaliações</Text>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = allReviews.filter((r) => r.rating === stars).length;
            const percentage =
              allReviews.length > 0 ? (count / allReviews.length) * 100 : 0;
            return (
              <View key={stars} style={styles.statRow}>
                <View style={styles.starLabel}>
                  <Text style={[styles.statText, { color: colors.foreground }]}>{stars}</Text>
                  <MaterialIcons name="star" size={14} color={colors.star} />
                </View>
                <View style={[styles.barContainer, { backgroundColor: colors.background }]}>
                  <View
                    style={[
                      styles.bar,
                      { width: `${percentage}%`, backgroundColor: colors.star },
                    ]}
                  />
                </View>
                <Text style={[styles.countText, { color: colors.muted }]}>{count}</Text>
              </View>
            );
          })}
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Comentários dos clientes</Text>
          {allReviews.length > 0 ? (
            <FlatList
              data={allReviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <MaterialIcons name="rate-review" size={48} color={colors.muted + "40"} />
              <Text style={[styles.noReviewsText, { color: colors.muted }]}>Nenhuma avaliação detalhada ainda</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  profCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  profAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  profInfo: {
    flex: 1,
  },
  profName: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
  },
  reviewsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  reviewCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: "#E5E7EB",
  },
  reviewInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
  },
  reviewDate: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "400",
  },
  separator: {
    height: 0,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderRadius: 20,
    gap: 12,
  },
  noReviewsText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  statsSection: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  starLabel: {
    flexDirection: "row",
    alignItems: "center",
    width: 34,
    gap: 4,
    justifyContent: "flex-end",
  },
  statText: {
    fontSize: 13,
    fontWeight: "700",
  },
  barContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: "700",
    width: 24,
    textAlign: "right",
  },
  errorText: {
    fontSize: 18,
  },
});
