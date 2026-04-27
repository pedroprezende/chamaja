import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

import { getProfessionalById, addReview } from "@/data/mock";
import { LeaveReviewModal } from "@/components/leave-review-modal";
import { useFavorites } from "@/lib/favorites-context";

function openWhatsApp(phone: string, name: string) {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  const message = encodeURIComponent(
    `Olá ${name}, encontrei seu perfil no ChamaJá e gostaria de solicitar um orçamento.`
  );
  const url = `https://wa.me/${number}?text=${message}`;
  Linking.openURL(url).catch(() =>
    Alert.alert("Erro", "Não foi possível abrir o WhatsApp.")
  );
}

export default function ProfessionalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { isFavorite, toggleFavorite, addOrder } = useFavorites();

  const professional = id ? getProfessionalById(id) : undefined;
  const favored = professional ? isFavorite(professional.id) : false;

  if (!professional) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Profissional não encontrado</Text>
        </View>
      </View>
    );
  }

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
        <View style={{ flex: 1 }} />
        <Pressable
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.6 }]}
          onPress={() => professional && toggleFavorite({
            id: professional.id,
            name: professional.name,
            category: professional.category,
            city: professional.city,
            avatar: professional.avatar,
            rating: professional.rating,
            phone: professional.phone,
            type: (professional.type?.toLowerCase() as "free" | "premium") ?? "free",
          })}
        >
          <MaterialIcons name={favored ? "favorite" : "favorite-border"} size={22} color={favored ? "#EF4444" : "#111827"} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.6 }]}
          onPress={() =>
            Share.share({
              message: `Confira ${professional.name} no app ChamaJá!`,
            })
          }
        >
          <MaterialIcons name="share" size={22} color="#111827" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: professional.avatar }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{professional.name}</Text>
            <View style={styles.categoryBadge}>
              <MaterialIcons name="check-circle" size={13} color="#25D366" />
              <Text style={styles.categoryText}>{professional.category}</Text>
            </View>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={14} color="#9CA3AF" />
              <Text style={styles.locationText}>
                {professional.neighborhood} • {professional.distance}
              </Text>
            </View>
          </View>
        </View>

        {/* Rating */}
        <Pressable
          style={styles.ratingRow}
          onPress={() => router.push(`/reviews/${id}` as any)}
        >
          <MaterialIcons name="star" size={22} color="#F59E0B" />
          <Text style={styles.ratingValue}>{professional.rating.toFixed(1)}</Text>
          <Text style={styles.ratingCount}>
            ({professional.reviewCount} avaliações)
          </Text>
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" style={{ marginLeft: 4 }} />
        </Pressable>

        <View style={styles.divider} />

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.description}>{professional.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* Info Items */}
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <MaterialIcons name="location-on" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Atende em toda a cidade</Text>
              <Text style={styles.infoValue}>{professional.serviceArea}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="access-time" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Atendimento</Text>
              <Text style={styles.infoValue}>{professional.schedule}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="credit-card" size={20} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Formas de pagamento</Text>
              <Text style={styles.infoValue}>{professional.paymentMethods}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Buttons */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.reviewButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => setShowReviewModal(true)}
        >
          <MaterialIcons name="star-outline" size={20} color="#25D366" />
          <Text style={styles.reviewButtonText}>Deixar avaliação</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.whatsappButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => {
            openWhatsApp(professional.phone, professional.name);
            addOrder({
              professionalId: professional.id,
              professionalName: professional.name,
              category: professional.category,
              avatar: professional.avatar,
              phone: professional.phone,
            });
          }}
        >
          <MaterialIcons name="chat" size={22} color="#FFFFFF" />
          <Text style={styles.whatsappButtonText}>Chamar no WhatsApp</Text>
        </Pressable>
      </View>

      {/* Review Modal */}
      <LeaveReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={(rating, comment) => {
          addReview({
            professionalId: id || "",
            userName: "Você",
            userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
            rating,
            comment,
            createdAt: new Date().toISOString().split("T")[0],
          });
          setShowReviewModal(false);
          Alert.alert("Sucesso", "Sua avaliação foi registrada!");
        }}
        professionalName={professional.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E7EB",
  },
  profileInfo: {
    flex: 1,
    gap: 6,
    paddingTop: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#25D366",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  locationText: {
    fontSize: 13,
    color: "#6B7280",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 4,
  },
  ratingValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 2,
  },
  ratingCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  divider: {
    height: 8,
    backgroundColor: "#F5F5F5",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  infoList: {
    padding: 20,
    gap: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  infoValue: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 8,
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#25D366",
  },
  reviewButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#25D366",
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  whatsappButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
});
