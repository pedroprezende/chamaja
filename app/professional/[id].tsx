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
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";

import { LeaveReviewModal } from "@/components/leave-review-modal";
import { useFavorites } from "@/lib/favorites-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";
import { addReview } from "@/data/mock";
import { useLocation } from "@/lib/location-context";
import {
  calculateHaversineDistance,
  formatDistancePtBr,
  estimateDrivingTimeMinutes,
  formatDrivingTimePtBr,
  formatDistanceWithPreposition,
} from "@/lib/location-utils";

function getWhatsAppUrl(phone: string, name: string) {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  const message = encodeURIComponent(
    `Olá ${name}, encontrei seu perfil no ChamaJá e gostaria de solicitar um orçamento.`
  );
  return `https://wa.me/${number}?text=${message}`;
}

export default function ProfessionalDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const trackView = trpc.analytics.trackServiceView.useMutation();
  const trackWhatsapp = trpc.analytics.trackWhatsappClick.useMutation();
  const { coords } = useLocation();

  const { user } = useAuth();
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const submitReview = trpc.providers.submitReview.useMutation();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { data: professional, isLoading: loading, refetch } = trpc.providers.getById.useQuery(id as string, {
    enabled: !!id,
  });

  const distanceInfo = useMemo(() => {
    if (coords && professional && professional.latitude !== null && professional.latitude !== undefined && professional.longitude !== null && professional.longitude !== undefined) {
      const lat = Number(professional.latitude);
      const lon = Number(professional.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        const distKm = calculateHaversineDistance(coords.latitude, coords.longitude, lat, lon);
        const timeMin = estimateDrivingTimeMinutes(distKm);
        return {
          distanceText: formatDistancePtBr(distKm),
          distancePrepText: formatDistanceWithPreposition(distKm),
          drivingTimeText: formatDrivingTimePtBr(timeMin),
        };
      }
    }
    return null;
  }, [coords, professional]);

  const favored = professional ? isFavorite(professional.id) : false;

  useEffect(() => {
    if (professional) {
      trackView.mutate({
        categoryId: professional.categoryId || undefined,
        serviceId: professional.id,
      });
    }
  }, [professional?.id]);

  const handleOpenWhatsApp = () => {
    if (!professional) return;
    trackWhatsapp.mutate({
      providerId: professional.id,
      serviceName: professional.name,
      city: professional.city || undefined,
    });
    
    const phone = professional.phone || professional.whatsapp || "";
    const url = getWhatsAppUrl(phone, professional.name);
    Linking.openURL(url).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.")
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 12, fontWeight: "600" }}>Carregando perfil...</Text>
      </View>
    );
  }

  if (!professional) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <MaterialIcons name="person-off" size={64} color={colors.muted} />
          <Text style={[styles.notFoundText, { color: colors.foreground }]}>Profissional não encontrado</Text>
          <Text style={{ color: colors.muted, textAlign: "center", marginTop: 8, paddingHorizontal: 40 }}>
            Este perfil pode ter sido removido ou o link está incorreto.
          </Text>
          <Pressable 
            style={{ 
              marginTop: 24, 
              backgroundColor: colors.primary, 
              paddingHorizontal: 32, 
              paddingVertical: 14, 
              borderRadius: 16 
            }}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>Voltar para o Início</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.background }, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          style={({ pressed }) => [styles.shareBtn, { backgroundColor: colors.background, marginRight: 8 }, pressed && { opacity: 0.6 }]}
          onPress={() => professional && toggleFavorite({
            id: professional.id,
            name: professional.name,
            category: professional.category || "",
            city: professional.city || "",
            avatar: professional.avatarUri || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.name)}`,
            rating: Number(professional.rating) || 0,
            phone: professional.phone || "",
            type: (professional.plan?.toLowerCase() as "free" | "premium") ?? "free",
          })}
        >
          <MaterialIcons name={favored ? "favorite" : "favorite-border"} size={22} color={favored ? "#EF4444" : colors.foreground} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.shareBtn, { backgroundColor: colors.background }, pressed && { opacity: 0.6 }]}
          onPress={() =>
            Share.share({
              message: `Confira ${professional.name} no app ChamaJá!`,
            })
          }
        >
          <MaterialIcons name="share" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: professional.avatarUri || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.name)}` }}
            style={[styles.avatar, { borderColor: colors.border, borderWidth: 1 }]}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.foreground }]}>{professional.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "15" }]}>
              <MaterialIcons name="check-circle" size={13} color={colors.primary} />
              <Text style={[styles.categoryText, { color: colors.primary }]}>{professional.category}</Text>
            </View>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={14} color={colors.muted} />
              <Text style={[styles.locationText, { color: colors.muted }]}>
                {professional.neighborhood || "Bairro não informado"} • {professional.city || "Cidade não informada"}{distanceInfo ? ` • ${distanceInfo.distanceText}` : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Distance Card */}
        {distanceInfo && (
          <View style={[styles.distanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.distanceIconWrap, { backgroundColor: colors.primary + "15" }]}>
              <MaterialIcons name="directions-car" size={22} color={colors.primary} />
            </View>
            <View style={styles.distanceContent}>
              <Text style={[styles.distanceText, { color: colors.foreground }]}>
                {distanceInfo.distancePrepText}
              </Text>
              <Text style={[styles.drivingTimeText, { color: colors.muted }]}>
                {distanceInfo.drivingTimeText}
              </Text>
            </View>
          </View>
        )}

        {/* Rating */}
        <Pressable
          style={[styles.ratingRow, { backgroundColor: colors.surface, marginHorizontal: 20, borderRadius: 16, marginTop: 4, borderWidth: 1, borderColor: colors.border }]}
          onPress={() => router.push(`/reviews/${id}` as any)}
        >
          <MaterialIcons name="star" size={22} color={colors.star} />
          <Text style={[styles.ratingValue, { color: colors.foreground }]}>{Number(professional.rating || 0).toFixed(1)}</Text>
          <Text style={[styles.ratingCount, { color: colors.muted }]}>
            ({professional.ratingCount || 0} avaliações)
          </Text>
          <View style={{ flex: 1 }} />
          <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
        </Pressable>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sobre</Text>
          <Text style={[styles.description, { color: colors.muted }]}>{professional.description}</Text>
        </View>

        {/* Gallery */}
        {professional.gallery && Array.isArray(professional.gallery) && professional.gallery.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Galeria de Fotos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
              {professional.gallery.map((uri: string, idx: number) => (
                <Pressable 
                  key={idx} 
                  onPress={() => setSelectedImage(uri)}
                  style={({ pressed }) => [
                    styles.galleryImageWrapper,
                    { borderColor: colors.border, borderWidth: 1 },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                  ]}
                >
                  <Image source={{ uri }} style={styles.galleryImage} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Info Items */}
        <View style={[styles.infoList, { backgroundColor: colors.surface, marginHorizontal: 20, borderRadius: 20, marginTop: 10, borderWidth: 1, borderColor: colors.border }]}>
          <Pressable 
            style={[styles.infoItem, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 16 }]}
            onPress={async () => {
              if (professional.address && professional.address.startsWith("http")) {
                Linking.openURL(professional.address);
              } else if (professional.address) {
                const query = encodeURIComponent(professional.address);
                const url = Platform.select({
                  ios: `http://maps.apple.com/?q=${query}`,
                  android: `geo:0,0?q=${query}`,
                  web: `https://www.google.com/maps/search/?api=1&query=${query}`,
                });
                
                if (url) {
                  const supported = await Linking.canOpenURL(url);
                  if (supported) {
                    await Linking.openURL(url);
                  } else {
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                  }
                }
              }
            }}
          >
            <View style={[styles.infoIconWrap, { backgroundColor: colors.primary + "15" }]}>
              <MaterialIcons name="location-on" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.foreground }]}>Localização / Ver no Mapa</Text>
              <Text style={[styles.infoValue, { color: colors.primary, fontWeight: "700" }]}>
                {professional.address || professional.city || "Ver localização no Google Maps"}
              </Text>
              {distanceInfo ? (
                <View style={{ marginTop: 4, gap: 2 }}>
                  <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "600" }}>
                    📍 {distanceInfo.distancePrepText}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500" }}>
                    🚗 {distanceInfo.drivingTimeText}
                  </Text>
                </View>
              ) : null}
            </View>
            <MaterialIcons name="open-in-new" size={18} color={colors.muted} />
          </Pressable>

          <Pressable 
            style={[styles.infoItem, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 16 }]}
            onPress={handleOpenWhatsApp}
          >
            <View style={[styles.infoIconWrap, { backgroundColor: colors.primary + "15" }]}>
              <MaterialIcons name="chat" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.foreground }]}>Contato Direto</Text>
              <Text style={[styles.infoValue, { color: colors.primary, fontWeight: "700" }]}>
                Chamar no WhatsApp agora
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>

          <View style={[styles.infoItem, { paddingTop: 16 }]}>
            <View style={[styles.infoIconWrap, { backgroundColor: colors.background }]}>
              <MaterialIcons name="access-time" size={20} color={colors.muted} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.foreground }]}>Atendimento</Text>
              <Text style={[styles.infoValue, { color: colors.muted }]}>Consultar disponibilidade via WhatsApp</Text>
            </View>
          </View>
        </View>

        {/* Image Viewer Modal */}
        <Modal
          visible={!!selectedImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={styles.modalBackground}>
            <Pressable 
              style={styles.modalOverlay} 
              onPress={() => setSelectedImage(null)} 
            />
            <View style={styles.modalContent}>
              <Pressable 
                style={styles.closeModalBtn} 
                onPress={() => setSelectedImage(null)}
              >
                <MaterialIcons name="close" size={28} color="#FFF" />
              </Pressable>
              {selectedImage && (
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.fullImage} 
                  resizeMode="contain" 
                />
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.footerRow}>
          <Pressable
            style={({ pressed }) => [
              styles.reviewButton,
              { borderColor: colors.primary, backgroundColor: colors.primary + "10" },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => setShowReviewModal(true)}
          >
            <MaterialIcons name="star-outline" size={20} color={colors.primary} />
            <Text style={[styles.reviewButtonText, { color: colors.primary }]}>Avaliar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.whatsappButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleOpenWhatsApp}
          >
            <MaterialIcons name="chat" size={22} color="#FFFFFF" />
            <Text style={styles.whatsappButtonText}>Chamar no WhatsApp</Text>
          </Pressable>
        </View>
      </View>

      {/* Review Modal */}
      <LeaveReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        isLoading={isSubmittingReview}
        onSubmit={async (rating, comment) => {
          try {
            setIsSubmittingReview(true);
            const userName = user?.name || "Você";
            const userAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`;

            await submitReview.mutateAsync({
              providerId: professional.id,
              rating,
              comment,
              userName,
              userAvatar,
            });

            // Adiciona a avaliação aos mocks locais para exibição imediata
            addReview({
              professionalId: professional.id,
              userName,
              userAvatar,
              rating,
              comment,
              createdAt: new Date().toISOString().split("T")[0],
            });

            // Atualiza os dados do prestador no banco (rating e ratingCount)
            await refetch();

            setShowReviewModal(false);
            Alert.alert("Sucesso", "Sua avaliação foi registrada!");
          } catch (error) {
            console.error("Failed to submit review:", error);
            Alert.alert("Erro", "Não foi possível enviar a avaliação. Tente novamente.");
          } finally {
            setIsSubmittingReview(false);
          }
        }}
        professionalName={professional.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  shareBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    gap: 16,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E5E7EB",
  },
  profileInfo: {
    flex: 1,
    gap: 6,
    paddingTop: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "500",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  ratingCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    padding: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  infoList: {
    padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  infoValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 8,
  },
  footerRow: {
    flexDirection: "row",
    gap: 12,
  },
  reviewButton: {
    width: 60,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    gap: 2,
  },
  reviewButtonText: {
    fontSize: 10,
    fontWeight: "700",
  },
  whatsappButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    height: 56,
    gap: 10,
  },
  whatsappButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  galleryImageWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  galleryImage: {
    width: 220,
    height: 160,
    backgroundColor: "#F3F4F6",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  notFoundText: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: "100%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  closeModalBtn: {
    position: "absolute",
    top: 50,
    right: 25,
    zIndex: 10,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 25,
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  distanceCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  distanceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  distanceContent: {
    flex: 1,
    gap: 2,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: "700",
  },
  drivingTimeText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
