import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProvider } from "@/lib/provider-context";
import { useAuth } from "@/lib/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BecomeProviderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { provider, isLoading } = useProvider();
  const { signOut } = useAuth();

  const handleExitBusinessMode = async () => {
    try {
      await AsyncStorage.setItem("@chamaja_login_as_business", "false");
      router.replace("/(tabs)" as any);
    } catch (e) {
      console.error("Failed to exit business mode:", e);
    }
  };

  const handleWhatsAppContact = (customMessage?: string) => {
    const phone = "5511973909447";
    const defaultMsg =
      "Olá! Gostaria de saber mais sobre como me tornar um prestador no XamaJá.";
    const message = encodeURIComponent(customMessage || defaultMsg);
    const url = `https://wa.me/${phone}?text=${message}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(
          `https://api.whatsapp.com/send?phone=${phone}&text=${message}`,
        );
      }
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  const isPending =
    provider && (provider.status === "pendente" || !provider.isActive);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.6 }]}
          onPress={handleExitBusinessMode}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color="#6B7280"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.exitBtnText}>Modo Cliente</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isPending ? "Aguardando Aprovação" : "Seja um Prestador"}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && { opacity: 0.6 },
          ]}
          onPress={signOut}
        >
          <MaterialIcons name="logout" size={20} color="#EF4444" />
        </Pressable>
      </View>

      {isPending ? (
        /* PENDING APPROVAL VIEW */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.heroSection}>
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
              ]}
            >
              <MaterialIcons name="watch-later" size={40} color="#F59E0B" />
            </View>
            <Text style={styles.heroTitle}>Aguardando Aprovação</Text>
            <Text style={styles.heroSubtitle}>
              Seu cadastro foi realizado com sucesso! O XamaJá realiza uma
              análise detalhada dos perfis para garantir a qualidade de nossos
              serviços.
            </Text>
          </View>

          {/* Registered Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Dados do seu negócio</Text>

            <View style={styles.infoCardRow}>
              <Text style={styles.infoCardLabel}>Nome:</Text>
              <Text style={styles.infoCardValue}>{provider.name}</Text>
            </View>

            <View style={styles.infoCardRow}>
              <Text style={styles.infoCardLabel}>WhatsApp:</Text>
              <Text style={styles.infoCardValue}>{provider.phone}</Text>
            </View>

            <View style={styles.infoCardRow}>
              <Text style={styles.infoCardLabel}>Localização:</Text>
              <Text style={styles.infoCardValue}>
                {provider.neighborhood}, {provider.city}
              </Text>
            </View>
          </View>

          <View style={styles.contactInfoCard}>
            <Text style={styles.contactTitle}>O que fazer agora?</Text>
            <Text style={styles.contactText}>
              A aprovação do seu perfil pode levar até 24 horas úteis. Para
              agilizar o processo e obter ativação imediata, clique no botão
              abaixo para conversar diretamente conosco pelo WhatsApp.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.whatsappBtn,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() =>
              handleWhatsAppContact(
                `Olá! Cadastrei meu negócio no XamaJá como ${provider.name} e gostaria de solicitar a aprovação.`,
              )
            }
          >
            <MaterialIcons name="chat" size={24} color="#fff" />
            <Text style={styles.whatsappBtnText}>
              Solicitar Ativação Rápida
            </Text>
          </Pressable>

          <Text style={styles.supportHint}>
            Atendimento de Segunda a Sábado, das 8h às 18h.
          </Text>
        </ScrollView>
      ) : (
        /* ONBOARDING / EMPTY FLOW VIEW */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="work" size={40} color="#25D366" />
            </View>
            <Text style={styles.heroTitle}>Comece a receber clientes hoje</Text>
            <Text style={styles.heroSubtitle}>
              Cadastre-se como prestador e apareça para milhares de clientes na
              sua região.
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsCard}>
            {[
              { icon: "visibility", text: "Apareça nas buscas de clientes" },
              { icon: "star", text: "Receba avaliações e construa reputação" },
              {
                icon: "phone",
                text: "Clientes entram em contato pelo WhatsApp",
              },
              {
                icon: "trending-up",
                text: "Aumente sua renda com novos clientes",
              },
            ].map((b) => (
              <View key={b.text} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <MaterialIcons
                    name={b.icon as any}
                    size={18}
                    color="#25D366"
                  />
                </View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 12 }}>
            <Pressable
              style={({ pressed }) => [
                styles.whatsappBtn, // Reusing the whatsapp button style from the pending view
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => handleWhatsAppContact()}
            >
              <MaterialIcons name="chat" size={24} color="#fff" />
              <Text style={styles.whatsappBtnText}>
                Falar no WhatsApp
              </Text>
            </Pressable>
          </View>

          <Text style={styles.supportHint}>
            Atendimento de Segunda a Sábado, das 8h às 18h.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  exitBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  exitBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  logoutBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    maxWidth: 150,
  },
  heroSection: { alignItems: "center", padding: 24, gap: 10 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#BBF7D0",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  benefitsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { flex: 1, fontSize: 14, color: "#374151" },

  registerBtnAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    borderRadius: 16,
    paddingVertical: 18,
    gap: 12,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerBtnActionText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },

  secondaryContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: "#25D366",
    gap: 10,
  },
  secondaryContactBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#25D366",
  },

  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 16,
    marginTop: 10,
    gap: 12,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  whatsappBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },

  contactInfoCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  contactText: { fontSize: 14, color: "#4B5563", lineHeight: 22 },

  infoCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  infoCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 6,
  },
  infoCardLabel: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  infoCardValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },

  supportHint: {
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 16,
    fontWeight: "500",
  },
});
