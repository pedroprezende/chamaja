import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { getReviewsByProfessional, getProfessionalById } from "@/data/mock";

export default function ReviewsScreen() {
  const router = useRouter();
  const { professionalId } = useLocalSearchParams<{ professionalId: string }>();

  const professional = getProfessionalById(professionalId || "");
  const allReviews = getReviewsByProfessional(professionalId || "");

  if (!professional) {
    return (
      <ScreenContainer containerClassName="bg-[#F5F5F5]" className="items-center justify-center">
        <Text style={styles.errorText}>Profissional não encontrado</Text>
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
            size={16}
            color={star <= rating ? "#FCD34D" : "#D1D5DB"}
          />
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item }: any) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: item.userAvatar }} style={styles.userAvatar} />
        <View style={styles.reviewInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.reviewDate}>{item.createdAt}</Text>
        </View>
      </View>
      {renderStars(item.rating)}
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-[#F5F5F5]" className="">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#11181C" />
          </Pressable>
          <Text style={styles.title}>Avaliações</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Professional Info */}
        <View style={styles.profCard}>
          <Image source={{ uri: professional.avatar }} style={styles.profAvatar} />
          <View style={styles.profInfo}>
            <Text style={styles.profName}>{professional.name}</Text>
            <View style={styles.ratingContainer}>
              {renderStars(professional.rating)}
              <Text style={styles.ratingText}>
                {professional.rating} ({professional.reviewCount} avaliações)
              </Text>
            </View>
          </View>
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Comentários dos clientes</Text>
          {allReviews.length > 0 ? (
            <FlatList
              data={allReviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <Text style={styles.noReviewsText}>Nenhuma avaliação ainda</Text>
          )}
        </View>

        {/* Rating Distribution */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Distribuição de avaliações</Text>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = allReviews.filter((r) => r.rating === stars).length;
            const percentage =
              allReviews.length > 0 ? (count / allReviews.length) * 100 : 0;
            return (
              <View key={stars} style={styles.statRow}>
                <View style={styles.starLabel}>
                  <MaterialIcons name="star" size={14} color="#FCD34D" />
                  <Text style={styles.statText}>{stars}</Text>
                </View>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.countText}>{count}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#11181C",
    flex: 1,
    textAlign: "center",
  },
  profCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profInfo: {
    flex: 1,
  },
  profName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#11181C",
    marginBottom: 4,
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
    fontSize: 12,
    color: "#687076",
  },
  reviewsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#11181C",
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  reviewInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#11181C",
  },
  reviewDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginTop: 8,
  },
  separator: {
    height: 0,
  },
  noReviewsText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 24,
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  starLabel: {
    flexDirection: "row",
    alignItems: "center",
    width: 30,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#11181C",
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    backgroundColor: "#FCD34D",
    borderRadius: 3,
  },
  countText: {
    fontSize: 12,
    color: "#687076",
    width: 20,
    textAlign: "right",
  },
  errorText: {
    fontSize: 16,
    color: "#11181C",
  },
});
