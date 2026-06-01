import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Clipboard,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

// Default Play Store and App Store presets
const PLAY_STORE_DEFAULT = "https://play.google.com/store/apps/details?id=com.chamaja.app";
const APP_STORE_DEFAULT = "https://apps.apple.com/br/app/chamaja/id1234567890";

function formatDate(dateInput: any) {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "-";
  
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function UtmLinksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  // Form states
  const [destino, setDestino] = useState(PLAY_STORE_DEFAULT);
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");

  // Queries & Mutations
  const { data: utmLinksData = [], isLoading } = trpc.utm.listAll.useQuery();

  const generateMutation = trpc.utm.generate.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Link UTM gerado e registrado no histórico!");
      utils.utm.listAll.invalidate();
      // Reset form states except destination
      setSource("");
      setMedium("");
      setCampaign("");
    },
    onError: (err) => {
      Alert.alert("Erro", err.message || "Erro ao salvar link UTM.");
    }
  });

  // Dynamic URL builder
  const generatedLink = useMemo(() => {
    if (!destino.trim()) return "";
    let url = destino.trim();
    const queryParams = [];
    
    if (source.trim()) {
      queryParams.push(`utm_source=${encodeURIComponent(source.trim().toLowerCase())}`);
    }
    if (medium.trim()) {
      queryParams.push(`utm_medium=${encodeURIComponent(medium.trim().toLowerCase())}`);
    }
    if (campaign.trim()) {
      queryParams.push(`utm_campaign=${encodeURIComponent(campaign.trim().toLowerCase())}`);
    }

    if (queryParams.length === 0) return url;

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${queryParams.join("&")}`;
  }, [destino, source, medium, campaign]);

  const handleCopyAndSave = () => {
    if (!destino.trim()) {
      Alert.alert("Erro", "O link de destino não pode estar vazio.");
      return;
    }
    if (!source.trim()) {
      Alert.alert("Erro", "A fonte da campanha (utm_source) é obrigatória.");
      return;
    }
    if (!medium.trim()) {
      Alert.alert("Erro", "A mídia (utm_medium) é obrigatória.");
      return;
    }
    if (!campaign.trim()) {
      Alert.alert("Erro", "A campanha (utm_campaign) é obrigatória.");
      return;
    }

    // Copy to Clipboard
    Clipboard.setString(generatedLink);

    // Save to Database
    generateMutation.mutate({
      source: source.trim().toLowerCase(),
      medium: medium.trim().toLowerCase(),
      campaign: campaign.trim().toLowerCase(),
      linkCompleto: generatedLink,
    });
  };

  const handleCopyLinkOnly = (link: string) => {
    Clipboard.setString(link);
    Alert.alert("Copiado!", "O link foi copiado para a área de transferência.");
  };

  return (
    <ScreenContainer style={{ backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.push("/admin/dashboard-admin" as any)}
        >
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Campanhas e Links UTM</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gerador de Links</Text>

          {/* Destino URL */}
          <Text style={styles.inputLabel}>Link de Destino (Play Store ou App Store)</Text>
          <TextInput
            style={styles.input}
            value={destino}
            onChangeText={setDestino}
            placeholder="Cole o link do app..."
            placeholderTextColor="#9CA3AF"
          />
          {/* Presets */}
          <View style={styles.presetRow}>
            <Pressable 
              style={[styles.presetBtn, destino === PLAY_STORE_DEFAULT && styles.presetBtnActive]}
              onPress={() => setDestino(PLAY_STORE_DEFAULT)}
            >
              <MaterialIcons name="android" size={14} color={destino === PLAY_STORE_DEFAULT ? "#059669" : "#4B5563"} />
              <Text style={[styles.presetText, destino === PLAY_STORE_DEFAULT && styles.presetTextActive]}>Google Play Store</Text>
            </Pressable>
            <Pressable 
              style={[styles.presetBtn, destino === APP_STORE_DEFAULT && styles.presetBtnActive]}
              onPress={() => setDestino(APP_STORE_DEFAULT)}
            >
              <MaterialIcons name="phone-iphone" size={14} color={destino === APP_STORE_DEFAULT ? "#059669" : "#4B5563"} />
              <Text style={[styles.presetText, destino === APP_STORE_DEFAULT && styles.presetTextActive]}>Apple App Store</Text>
            </Pressable>
          </View>

          {/* Fonte (utm_source) */}
          <Text style={styles.inputLabel}>Fonte da Campanha (utm_source)</Text>
          <TextInput
            style={styles.input}
            value={source}
            onChangeText={setSource}
            placeholder="Ex: instagram, facebook, google"
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.presetRow}>
            {["instagram", "facebook", "whatsapp", "google"].map((src) => (
              <Pressable 
                key={src} 
                style={[styles.smallPresetBtn, source === src && styles.smallPresetBtnActive]}
                onPress={() => setSource(src)}
              >
                <Text style={[styles.smallPresetText, source === src && styles.smallPresetTextActive]}>{src}</Text>
              </Pressable>
            ))}
          </View>

          {/* Mídia (utm_medium) */}
          <Text style={styles.inputLabel}>Mídia da Campanha (utm_medium)</Text>
          <TextInput
            style={styles.input}
            value={medium}
            onChangeText={setMedium}
            placeholder="Ex: stories, bio, cpc, feed, status"
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.presetRow}>
            {["stories", "bio", "feed", "cpc", "status"].map((med) => (
              <Pressable 
                key={med} 
                style={[styles.smallPresetBtn, medium === med && styles.smallPresetBtnActive]}
                onPress={() => setMedium(med)}
              >
                <Text style={[styles.smallPresetText, medium === med && styles.smallPresetTextActive]}>{med}</Text>
              </Pressable>
            ))}
          </View>

          {/* Campanha (utm_campaign) */}
          <Text style={styles.inputLabel}>Nome da Campanha (utm_campaign)</Text>
          <TextInput
            style={styles.input}
            value={campaign}
            onChangeText={setCampaign}
            placeholder="Ex: prestadores_junho, trafego_pago"
            placeholderTextColor="#9CA3AF"
          />

          {/* Real-time Generated Link Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Link Gerado em Tempo Real:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
              <Text style={styles.previewLinkText} selectable={true}>
                {generatedLink || "Preencha os campos acima para gerar o link..."}
              </Text>
            </ScrollView>
          </View>

          {/* Action button */}
          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }]}
            onPress={handleCopyAndSave}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="content-copy" size={20} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Copiar e Salvar Link</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* History Table */}
        <Text style={styles.sectionTitle}>Histórico de Links UTM</Text>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#25D366" />
            <Text style={styles.loaderText}>Carregando histórico...</Text>
          </View>
        ) : utmLinksData.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="link-off" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Nenhum link UTM gerado ainda.</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {utmLinksData.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyCampaign}>Campanha: {item.campaign}</Text>
                    <Text style={styles.historyMeta}>
                      Fonte: <Text style={styles.boldText}>{item.source}</Text> • Mídia: <Text style={styles.boldText}>{item.medium}</Text>
                    </Text>
                  </View>
                  
                  {/* Conversions / Registration Count Badge */}
                  <View style={styles.conversionsBadge}>
                    <MaterialIcons name="person-add" size={14} color="#059669" />
                    <Text style={styles.conversionsText}>
                      {item.registrationsCount} {item.registrationsCount === 1 ? "Cadastro" : "Cadastros"}
                    </Text>
                  </View>
                </View>

                {/* Sub-block showing generated URL */}
                <View style={styles.historyUrlBlock}>
                  <Text style={styles.historyUrlText} numberOfLines={1}>
                    {item.linkCompleto}
                  </Text>
                  <Pressable 
                    onPress={() => handleCopyLinkOnly(item.linkCompleto)}
                    style={({ pressed }) => [styles.copyIconBtn, pressed && { backgroundColor: "#E5E7EB" }]}
                  >
                    <MaterialIcons name="content-copy" size={16} color="#4B5563" />
                  </Pressable>
                </View>

                <View style={styles.historyFooter}>
                  <Text style={styles.historyDate}>Criado em {formatDate(item.criadoEm)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 6,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    marginTop: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    color: "#111827",
    fontSize: 14,
    // Fix outline on web
    ...({ outlineStyle: "none" } as any),
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: -2,
    marginBottom: 4,
  },
  presetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  presetBtnActive: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
  },
  presetText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
  },
  presetTextActive: {
    color: "#059669",
  },
  smallPresetBtn: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  smallPresetBtnActive: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
  },
  smallPresetText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
  },
  smallPresetTextActive: {
    color: "#059669",
  },
  previewContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 8,
    gap: 6,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
  },
  previewScroll: {
    width: "100%",
  },
  previewLinkText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  submitBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginTop: 24,
    marginBottom: 12,
  },
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: "#4B5563",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 10,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  historyCampaign: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  historyMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  boldText: {
    fontWeight: "600",
    color: "#374151",
  },
  conversionsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  conversionsText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  historyUrlBlock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    justifyContent: "space-between",
    gap: 8,
  },
  historyUrlText: {
    flex: 1,
    fontSize: 11,
    color: "#6B7280",
  },
  copyIconBtn: {
    padding: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  historyDate: {
    fontSize: 11,
    color: "#9CA3AF",
  },
});
