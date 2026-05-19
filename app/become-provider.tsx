import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BecomeProviderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleWhatsAppContact = () => {
    const phone = "5511973909447";
    const message = encodeURIComponent("Olá! Gostaria de saber mais sobre como me tornar um prestador no ChamaJá.");
    const url = `https://wa.me/${phone}?text=${message}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback para web ou caso não tenha o app instalado
        Linking.openURL(`https://api.whatsapp.com/send?phone=${phone}&text=${message}`);
      }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Seja um Prestador</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="work" size={40} color="#25D366" />
          </View>
          <Text style={styles.heroTitle}>Comece a receber clientes hoje</Text>
          <Text style={styles.heroSubtitle}>
            Cadastre-se como prestador e apareça para milhares de clientes na sua região.
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          {[
            { icon: "visibility", text: "Apareça nas buscas de clientes" },
            { icon: "star", text: "Receba avaliações e construa reputação" },
            { icon: "phone", text: "Clientes entram em contato pelo WhatsApp" },
            { icon: "trending-up", text: "Aumente sua renda com novos clientes" },
          ].map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <MaterialIcons name={b.icon as any} size={18} color="#25D366" />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.contactInfoCard}>
          <Text style={styles.contactTitle}>Como funciona?</Text>
          <Text style={styles.contactText}>
            Para garantir a qualidade dos nossos serviços, o cadastro de novos profissionais é feito diretamente através da nossa central de atendimento.
          </Text>
          <Text style={styles.contactText}>
            Clique no botão abaixo para falar conosco via WhatsApp e solicitar sua ativação na plataforma.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.whatsappBtn, pressed && { opacity: 0.85 }]}
          onPress={handleWhatsAppContact}
        >
          <MaterialIcons name="chat" size={24} color="#fff" />
          <Text style={styles.whatsappBtnText}>Falar com a Central (WhatsApp)</Text>
        </Pressable>
        
        <Text style={styles.supportHint}>Atendimento de Segunda a Sábado, das 8h às 18h.</Text>
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
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#111827", textAlign: "center" },
  heroSection: { alignItems: "center", padding: 24, gap: 10 },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#BBF7D0",
  },
  heroTitle: { fontSize: 22, fontWeight: "700", color: "#111827", textAlign: "center" },
  heroSubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
  benefitsCard: {
    backgroundColor: "#FFFFFF", marginHorizontal: 16, borderRadius: 16,
    padding: 16, gap: 12, marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  benefitIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
  },
  benefitText: { flex: 1, fontSize: 14, color: "#374151" },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 16,
    marginTop: 20,
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
  supportHint: {
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 16,
    fontWeight: "500",
  },
});
