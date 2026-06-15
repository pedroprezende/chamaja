import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
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
import { supabase } from "@/lib/supabase";
import {
  calculateHaversineDistance,
  formatDistancePtBr,
  estimateDrivingTimeMinutes,
  formatDrivingTimePtBr,
  formatDistanceWithPreposition,
} from "@/lib/location-utils";

const DEFAULT_COVER = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80";

function getWhatsAppUrl(phone: string, name: string) {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  const message = encodeURIComponent(
    `Olá ${name}, encontrei seu perfil no XamaJá e gostaria de solicitar um orçamento.`
  );
  return `https://wa.me/${number}?text=${message}`;
}

const parseJsonArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  if (typeof val === "string") {
    return val.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
};

const getAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=25D366&color=fff&size=150`;

export default function ProfessionalDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const trackView = trpc.analytics.trackServiceView.useMutation();
  const trackWhatsapp = trpc.analytics.trackWhatsappClick.useMutation();
  const { coords, addressName, permissionGranted } = useLocation();
  const isDefaultCity = addressName === "Bragança Paulista - SP";
  const showDistance = coords !== null;

  const { user } = useAuth();
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const submitReview = trpc.providers.submitReview.useMutation();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<"perfil_falso" | "golpe" | "informacoes_incorretas" | "comportamento_inadequado" | "outro">("perfil_falso");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const { data: professional, isLoading: loading, refetch } = trpc.providers.getById.useQuery(id as string, {
    enabled: !!id,
  });

  const galleryImages = professional?.gallery || [];
  const currentImageIndex = selectedImage ? galleryImages.indexOf(selectedImage) : -1;

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setSelectedImage(galleryImages[currentImageIndex - 1]);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < galleryImages.length - 1) {
      setSelectedImage(galleryImages[currentImageIndex + 1]);
    }
  };

  const { data: reviews = [], refetch: refetchReviews } = trpc.providers.getReviews.useQuery(id as string, {
    enabled: !!id,
  });

  const distanceInfo = useMemo(() => {
    if (showDistance && coords && professional && professional.latitude !== null && professional.latitude !== undefined && professional.longitude !== null && professional.longitude !== undefined) {
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
  }, [coords, professional, showDistance]);

  const favored = professional ? isFavorite(professional.id) : false;

  useEffect(() => {
    if (professional) {
      trackView.mutate({
        categoryId: professional.categoryId || undefined,
        serviceId: professional.id,
        userId: user?.id || undefined,
      });
    }
  }, [professional?.id, user?.id]);

  const handleOpenWhatsApp = () => {
    if (!professional) return;
    trackWhatsapp.mutate({
      providerId: professional.id,
      serviceName: professional.name,
      city: professional.city || undefined,
      userId: user?.id || undefined,
    });
    
    const phone = professional.phone || professional.whatsapp || "";
    const url = getWhatsAppUrl(phone, professional.name);
    Linking.openURL(url).catch(() =>
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.")
    );
  };

  const handleOpenReportModal = () => {
    if (!user) {
      Alert.alert("Acesso Necessário", "Você precisa estar conectado em uma conta para enviar uma denúncia.");
      router.push("/auth/login" as any);
      return;
    }
    setReportReason("perfil_falso");
    setReportDetails("");
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!professional || !user) return;
    setIsSubmittingReport(true);

    try {
      const isCommerce = professional.categoryId === "comercios" || professional.category === "Comércios" || professional.category === "comercios";
      const reportedType = isCommerce ? "comércio" : "prestador";

      const { error } = await supabase
        .from("denuncias")
        .insert({
          reporter_id: user.id,
          reported_id: professional.id,
          reported_type: reportedType,
          reason: reportReason,
          details: reportDetails.trim() || null,
          status: "pendente",
        });

      if (error) throw error;

      Alert.alert("Denúncia Enviada", "Agradecemos o seu envio. A equipe administrativa analisará a denúncia em breve.");
      setShowReportModal(false);
    } catch (err: any) {
      console.error("Erro ao enviar denúncia:", err);
      Alert.alert("Erro", "Não foi possível enviar a denúncia. Tente novamente mais tarde.");
    } finally {
      setIsSubmittingReport(false);
    }
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
        <View style={[styles.notFoundHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
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

  // Type-narrowed alias to prevent TS closure warnings
  const prof = professional;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating Header */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.floatingBackBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          style={({ pressed }) => [styles.floatingBackBtn, { marginRight: 8 }, pressed && { opacity: 0.6 }]}
          onPress={() => toggleFavorite({
            id: prof.id,
            name: prof.name,
            category: prof.category || "",
            city: prof.city || "",
            avatar: prof.avatarThumbnailUri || prof.avatarUri || getAvatarUrl(prof.name),
            rating: Number(prof.rating) || 0,
            phone: prof.phone || "",
            type: (typeof prof.plan === "string" ? (prof.plan.toLowerCase() as "free" | "premium") : "free"),
            latitude: prof.latitude ? Number(prof.latitude) : null,
            longitude: prof.longitude ? Number(prof.longitude) : null,
          })}
        >
          <MaterialIcons name={favored ? "favorite" : "favorite-border"} size={22} color={favored ? "#EF4444" : "#FFF"} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.floatingBackBtn, { marginRight: 8 }, pressed && { opacity: 0.6 }]}
          onPress={handleOpenReportModal}
        >
          <MaterialIcons name="report" size={22} color="#FFF" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.floatingBackBtn, pressed && { opacity: 0.6 }]}
          onPress={() =>
            Share.share({
              message: `Confira ${prof.name} no app XamaJá!`,
            })
          }
        >
          <MaterialIcons name="share" size={22} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Banner Superior (Capa) */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: prof.coverUri || DEFAULT_COVER }}
            style={styles.coverImage}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.5)", "transparent", "rgba(0,0,0,0.7)"]}
            style={StyleSheet.absoluteFillObject}
          />
          
          {/* Badges Overlays */}
          <View style={styles.badgeOverlayContainer}>
            {prof.onlineStatus && (
              <View style={[styles.overlayBadge, styles.onlineBadge]}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online agora</Text>
              </View>
            )}
            {prof.topBadge && (
              <View style={[styles.overlayBadge, styles.topBadge]}>
                <MaterialIcons name="emoji-events" size={13} color="#FFF" />
                <Text style={styles.topBadgeText}>{prof.topBadge}</Text>
              </View>
            )}
            {prof.responseTime && (
              <View style={[styles.overlayBadge, styles.responseBadge]}>
                <MaterialIcons name="speed" size={13} color="#FFF" />
                <Text style={styles.responseBadgeText}>Responde rápido</Text>
              </View>
            )}
          </View>
        </View>

        {/* Profile Card Overlay */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Avatar floating */}
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: prof.avatarUri || getAvatarUrl(prof.name) }}
              style={[styles.avatar, { borderColor: colors.surface }]}
            />
            {prof.isVerified && (
              <View style={styles.verifiedIconWrap}>
                <MaterialIcons name="verified" size={20} color="#15803D" />
              </View>
            )}
          </View>

          {/* Professional Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: colors.foreground }]}>{prof.name}</Text>
            </View>
            
            {prof.isVerified && (
              <View style={styles.verifiedRow}>
                <MaterialIcons name="check" size={12} color="#15803D" />
                <Text style={styles.verifiedText}>Prestador Verificado</Text>
              </View>
            )}

            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {prof.subcategoryName || prof.category}
            </Text>

            <View style={[styles.locationContainer, { marginTop: 8, gap: 4 }]}>
              <Text style={{ fontSize: 14, color: colors.foreground, textAlign: "center" }}>
                📍 Bairro: <Text style={{ fontWeight: "700" }}>{prof.neighborhood || "Não informado"}</Text>
              </Text>
              <Text style={{ fontSize: 14, color: colors.foreground, textAlign: "center" }}>
                📍 Cidade: <Text style={{ fontWeight: "700" }}>{prof.city || "Não informada"}</Text>
              </Text>
              {distanceInfo ? (
                <Text style={{ fontSize: 14, color: "#15803D", fontWeight: "700", textAlign: "center" }}>
                  🚗 Distância até você: {distanceInfo.distanceText}
                </Text>
              ) : (
                <Text style={{ fontSize: 13, color: colors.muted, fontStyle: "italic", textAlign: "center" }}>
                  🚗 Distância até você: Indisponível (defina seu endereço)
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Metric Grid (3 Columns) */}
        <View style={[styles.metricGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Col 1: Rating */}
          <View style={styles.metricItem}>
            <MaterialIcons name="star" size={22} color="#F59E0B" />
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              {Number(prof.rating || 0).toFixed(1)}
            </Text>
            <Text style={styles.metricLabel}>{prof.ratingCount || 0} avaliações</Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Col 2: Founded Year */}
          <View style={styles.metricItem}>
            <MaterialIcons name="event" size={22} color="#15803D" />
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              {prof.foundedYear ? `Desde ${prof.foundedYear}` : "--"}
            </Text>
            <Text style={styles.metricLabel}>Ano início</Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Col 3: Response Time */}
          <View style={styles.metricItem}>
            <MaterialIcons name="speed" size={22} color="#7C3AED" />
            <Text style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1}>
              {prof.responseTime || "Rápido"}
            </Text>
            <Text style={styles.metricLabel}>Tempo resp.</Text>
          </View>
        </View>

        {/* Popular Services Section */}
        {parseJsonArray(prof.popularServices).length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Serviços Mais Procurados</Text>
            <View style={styles.chipsContainer}>
              {parseJsonArray(prof.popularServices).map((service, index) => (
                <View key={index} style={[styles.chip, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                  <MaterialIcons name="bolt" size={13} color={colors.primary} />
                  <Text style={[styles.chipText, { color: colors.primary }]}>{service}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sobre o Prestador</Text>
          <Text style={[styles.description, { color: colors.muted }]}>{prof.description || "Nenhuma descrição fornecida."}</Text>
          
          {parseJsonArray(prof.tags).length > 0 && (
            <View style={[styles.chipsContainer, { marginTop: 12 }]}>
              {parseJsonArray(prof.tags).map((tag, index) => (
                <View key={index} style={[styles.tagChip, { backgroundColor: "#F1F5F9" }]}>
                  <MaterialIcons name="check" size={12} color="#64748B" />
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Gallery */}
        {prof.gallery && Array.isArray(prof.gallery) && prof.gallery.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>Galeria de Fotos</Text>
              <Pressable onPress={() => setSelectedImage(prof.gallery?.[0] || null)}>
                <Text style={[styles.sectionHeaderLink, { color: colors.primary }]}>Ver todas ({prof.gallery.length})</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20, paddingTop: 10 }}>
              {prof.gallery.map((uri: string, idx: number) => (
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

        {/* Bloco de Localização, Contato e Horários */}
        <View style={[styles.infoList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {/* Endereço */}
          <Pressable 
            style={[styles.infoItem, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 16 }]}
            onPress={async () => {
              const locationQuery = prof.latitude && prof.longitude
                ? `${prof.latitude},${prof.longitude}`
                : (prof.address || `${prof.neighborhood || ""}, ${prof.city || ""}`).trim();

              if (locationQuery) {
                if (prof.address && prof.address.startsWith("http")) {
                  Linking.openURL(prof.address);
                } else {
                  const encodedQuery = encodeURIComponent(locationQuery);
                  const url = Platform.select({
                    ios: `http://maps.apple.com/?q=${encodedQuery}`,
                    android: `geo:0,0?q=${encodedQuery}`,
                    web: `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`,
                  });

                  try {
                    if (url) {
                      await Linking.openURL(url);
                    } else {
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`);
                    }
                  } catch (err) {
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`);
                  }
                }
              }
            }}
          >
            <View style={[styles.infoIconWrap, { backgroundColor: colors.primary + "12" }]}>
              <MaterialIcons name="location-on" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.foreground }]}>Endereço</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {prof.address || `${prof.neighborhood || ""}, ${prof.city || ""}`}
              </Text>
              <Text style={styles.mapLinkText}>Toque para ver no mapa</Text>
            </View>
            <MaterialIcons name="open-in-new" size={16} color={colors.muted} />
          </Pressable>

          {/* Contato */}
          <Pressable 
            style={[styles.infoItem, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 16 }]}
            onPress={handleOpenWhatsApp}
          >
            <View style={[styles.infoIconWrap, { backgroundColor: "#25D36615" }]}>
              <MaterialIcons name="chat" size={20} color="#25D366" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.foreground }]}>Contato</Text>
              <Text style={[styles.infoValue, { color: colors.foreground, fontWeight: "600" }]}>
                {prof.phone || prof.whatsapp || "Chamar no WhatsApp"}
              </Text>
              <Text style={styles.whatsappSubText}>Clique para abrir conversa</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>

          {/* Horário de Atendimento */}
          <View style={[styles.infoItem, { paddingTop: 16 }]}>
            <View style={[styles.infoIconWrap, { backgroundColor: "#7C3AED12" }]}>
              <MaterialIcons name="access-time" size={20} color="#7C3AED" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.foreground }]}>Horário de atendimento</Text>
              {(() => {
                let weekdayHours = "";
                let satHours = "";
                if (prof.workingHours) {
                  try {
                    const parsed = JSON.parse(prof.workingHours);
                    weekdayHours = parsed.weekday || "";
                    satHours = parsed.saturday || "";
                  } catch {
                    weekdayHours = prof.workingHours;
                  }
                }
                
                if (weekdayHours || satHours) {
                  return (
                    <View style={{ gap: 2, marginTop: 2 }}>
                      {!!weekdayHours && (
                        <Text style={styles.hoursText}>Segunda a Sexta: <Text style={styles.hoursValueText}>{weekdayHours}</Text></Text>
                      )}
                      {!!satHours && (
                        <Text style={styles.hoursText}>Sábado: <Text style={styles.hoursValueText}>{satHours}</Text></Text>
                      )}
                    </View>
                  );
                }
                return (
                  <Text style={[styles.infoValue, { color: colors.muted }]}>Consultar disponibilidade via WhatsApp</Text>
                );
              })()}
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
              Avaliações e Comentários
            </Text>
            <Pressable onPress={() => setShowReviewModal(true)}>
              <Text style={[styles.sectionHeaderLink, { color: colors.primary }]}>Escrever avaliação</Text>
            </Pressable>
          </View>

          {reviews && reviews.length > 0 ? (
            <View style={{ gap: 16, marginTop: 14 }}>
              {reviews.slice(0, 5).map((rev: any) => (
                <View key={rev.id} style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{ uri: rev.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.userName)}` }}
                      style={styles.reviewAvatar}
                    />
                    <View style={styles.reviewUserMeta}>
                      <Text style={[styles.reviewUserName, { color: colors.foreground }]}>{rev.userName}</Text>
                      <Text style={styles.reviewDate}>{rev.createdAt}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                      <MaterialIcons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.reviewRatingText}>{Number(rev.rating).toFixed(1)}</Text>
                    </View>
                  </View>
                  {!!rev.comment && (
                    <Text style={[styles.reviewComment, { color: colors.muted }]}>
                      {rev.comment}
                    </Text>
                  )}
                </View>
              ))}
              {reviews.length > 5 && (
                <Pressable 
                  style={styles.viewAllReviewsBtn}
                  onPress={() => router.push(`/reviews/${id}` as any)}
                >
                  <Text style={[styles.viewAllReviewsText, { color: colors.primary }]}>
                    Ver todas as {reviews.length} avaliações
                  </Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.emptyReviews}>
              <MaterialIcons name="rate-review" size={32} color={colors.muted} />
              <Text style={[styles.emptyReviewsText, { color: colors.muted }]}>
                Nenhuma avaliação ainda. Seja o primeiro a avaliar!
              </Text>
            </View>
          )}
        </View>

        {/* Report Link */}
        <Pressable 
          style={({ pressed }) => [styles.reportBtn, pressed && { opacity: 0.7 }]}
          onPress={handleOpenReportModal}
        >
          <MaterialIcons name="outlined-flag" size={18} color="#EF4444" />
          <Text style={styles.reportBtnText}>Denunciar este prestador</Text>
        </Pressable>
      </ScrollView>

      {/* Footer / Call to Action */}
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
                contentFit="contain" 
              />
            )}
            
            {/* Gallery Navigation Controls */}
            {galleryImages.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <Pressable 
                    style={styles.modalLeftBtn} 
                    onPress={handlePrevImage}
                  >
                    <MaterialIcons name="chevron-left" size={36} color="#FFF" />
                  </Pressable>
                )}
                {currentImageIndex < galleryImages.length - 1 && (
                  <Pressable 
                    style={styles.modalRightBtn} 
                    onPress={handleNextImage}
                  >
                    <MaterialIcons name="chevron-right" size={36} color="#FFF" />
                  </Pressable>
                )}
                
                {/* Image counter indicator */}
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1} de {galleryImages.length}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Leave Review Modal */}
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
              providerId: prof.id,
              rating,
              comment,
              userName,
              userAvatar,
            });

            addReview({
              professionalId: prof.id,
              userName,
              userAvatar,
              rating,
              comment,
              createdAt: new Date().toISOString().split("T")[0],
            });

            await refetch();
            await refetchReviews();

            setShowReviewModal(false);
            Alert.alert("Sucesso", "Sua avaliação foi registrada!");
          } catch (error) {
            console.error("Failed to submit review:", error);
            Alert.alert("Erro", "Não foi possível enviar a avaliação. Tente novamente.");
          } finally {
            setIsSubmittingReview(false);
          }
        }}
        professionalName={prof.name}
      />

      {/* Leave Report Modal */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlayBackground}>
          <View style={[styles.reportModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.reportModalHeader}>
              <Text style={[styles.reportModalTitle, { color: colors.foreground }]}>Denunciar Perfil</Text>
              <Pressable onPress={() => setShowReportModal(false)} style={styles.closeReportBtn}>
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={[styles.reportModalSubtitle, { color: colors.muted }]}>
                Selecione o motivo mais adequado para a denúncia contra o perfil de <Text style={{ fontWeight: "700" }}>{prof.name}</Text>:
              </Text>

              {/* Reasons selector */}
              {(
                [
                  { key: "perfil_falso", label: "Perfil falso / Clone" },
                  { key: "golpe", label: "Golpe / Tentativa de Fraude" },
                  { key: "informacoes_incorretas", label: "Informações incorretas / Desatualizadas" },
                  { key: "comportamento_inadequado", label: "Comportamento inadequado / Ofensivo" },
                  { key: "outro", label: "Outro motivo" },
                ] as const
              ).map((item) => {
                const isSelected = reportReason === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setReportReason(item.key)}
                    style={[
                      styles.reasonOption,
                      { borderColor: isSelected ? colors.primary : colors.border },
                      isSelected && { backgroundColor: colors.primary + "09" }
                    ]}
                  >
                    <View style={[
                      styles.radioButton,
                      { borderColor: isSelected ? colors.primary : colors.muted }
                    ]}>
                      {isSelected && <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />}
                    </View>
                    <Text style={[styles.reasonLabelText, { color: colors.foreground, fontWeight: isSelected ? "600" : "400" }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}

              <Text style={[styles.detailsLabelText, { color: colors.foreground, marginTop: 16 }]}>
                Mais detalhes (Opcional)
              </Text>
              <TextInput
                style={[
                  styles.detailsInput, 
                  { 
                    color: colors.foreground, 
                    borderColor: colors.border,
                    backgroundColor: colors.background 
                  }
                ]}
                placeholder="Explique detalhadamente o motivo da denúncia para nos ajudar a analisar o caso..."
                placeholderTextColor={colors.muted}
                multiline={true}
                numberOfLines={4}
                value={reportDetails}
                onChangeText={setReportDetails}
              />
            </ScrollView>

            <View style={[styles.reportModalFooter, { borderTopColor: colors.border }]}>
              <Pressable
                style={[styles.reportModalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowReportModal(false)}
                disabled={isSubmittingReport}
              >
                <Text style={[styles.reportCancelBtnText, { color: colors.foreground }]}>Cancelar</Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.reportModalSubmitBtn, 
                  { backgroundColor: "#EF4444" },
                  isSubmittingReport && { opacity: 0.7 }
                ]}
                onPress={handleSubmitReport}
                disabled={isSubmittingReport}
              >
                {isSubmittingReport ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.reportSubmitBtnText}>Enviar Denúncia</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  floatingBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverContainer: {
    width: "100%",
    height: 220,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  badgeOverlayContainer: {
    position: "absolute",
    bottom: 48,
    left: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    zIndex: 2,
  },
  overlayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  onlineBadge: {
    backgroundColor: "#16A34A",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  onlineText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  topBadge: {
    backgroundColor: "#D97706",
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  responseBadge: {
    backgroundColor: "#2563EB",
  },
  responseBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: -35,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginTop: -55,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    backgroundColor: "#E5E7EB",
  },
  verifiedIconWrap: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },
  detailsContainer: {
    alignItems: "center",
    marginTop: 10,
    gap: 4,
    width: "100%",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  locationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    gap: 2,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
  distanceGreenText: {
    fontSize: 13,
    fontWeight: "700",
  },
  metricGrid: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  metricDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionHeaderLink: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  galleryImageWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  galleryImage: {
    width: 200,
    height: 125,
    backgroundColor: "#F3F4F6",
  },
  infoList: {
    marginHorizontal: 16,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  mapLinkText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 2,
  },
  whatsappSubText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "600",
    marginTop: 2,
  },
  hoursText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  hoursValueText: {
    fontWeight: "700",
    color: "#1E293B",
  },
  reviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
  },
  reviewUserMeta: {
    flex: 1,
    gap: 2,
  },
  reviewUserName: {
    fontSize: 13,
    fontWeight: "700",
  },
  reviewDate: {
    fontSize: 10,
    color: "#64748B",
  },
  reviewStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reviewRatingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
  },
  viewAllReviewsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
  },
  viewAllReviewsText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyReviews: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 6,
  },
  emptyReviewsText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
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
  notFoundHeader: {
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
  modalLeftBtn: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 25,
  },
  modalRightBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 25,
  },
  imageCounter: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  imageCounterText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  reportBtnText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlayBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  reportModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  reportModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  reportModalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  closeReportBtn: {
    padding: 4,
  },
  reportModalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonLabelText: {
    fontSize: 14,
  },
  detailsLabelText: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  detailsInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    height: 90,
    textAlignVertical: "top",
    fontSize: 14,
  },
  reportModalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  reportModalCancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  reportCancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  reportModalSubmitBtn: {
    flex: 2,
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  reportSubmitBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
