import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { useCart, CartItem } from "@/lib/cart-context";
import { generateWhatsAppMessage, isFoodSegment, isProductSegment } from "@/lib/whatsapp-helper";

export default function WhatsappOrderScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { items, notes, deliveryAddress, cartTotal, clearCart } = useCart();

  // Busca detalhes do comércio para obter o número do WhatsApp
  const { data: professional, isLoading } = trpc.providers.getById.useQuery(
    id as string,
    {
      enabled: !!id,
    },
  );

  const isFood = professional ? isFoodSegment(professional) : false;
  const isProduct = professional ? isProductSegment(professional) : false;

  // Gera a mensagem formatada inteligente
  const messageText = useMemo(() => {
    if (!professional) return "";
    return generateWhatsAppMessage({
      provider: professional,
      items: items.map((i) => ({
        name: i.name || "Item",
        price: i.price,
        quantity: i.quantity,
      })),
      notes,
      deliveryAddress,
    });
  }, [professional, items, notes, deliveryAddress]);

  const handleSendOrder = () => {
    if (!professional) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const phone = professional.phone || professional.whatsapp || "";
    if (!phone) {
      Alert.alert(
        "Erro",
        "Este estabelecimento não possui um telefone cadastrado.",
      );
      return;
    }

    // Limpa o telefone
    let cleaned = phone.replace(/\D/g, "");
    const whatsappNumber = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const encodedText = encodeURIComponent(messageText);

    const whatsappAppUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodedText}`;
    const whatsappWebUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedText}`;

    // Tenta abrir o app do WhatsApp diretamente primeiro
    Linking.openURL(whatsappAppUrl)
      .then(() => {
        clearCart();
        router.replace({
          pathname: "/professional/[id]" as any,
          params: { id: id },
        });
      })
      .catch(() => {
        // Fallback: Tenta abrir a página web oficial do WhatsApp (que abre no navegador e redireciona)
        Linking.openURL(whatsappWebUrl)
          .then(() => {
            clearCart();
            router.replace({
              pathname: "/professional/[id]" as any,
              params: { id: id },
            });
          })
          .catch(() => {
            Alert.alert(
              "Erro",
              "Não foi possível abrir o WhatsApp. Certifique-se de que ele está instalado no dispositivo.",
            );
          });
      });
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          Carregando dados...
        </Text>
      </View>
    );
  }

  const screenTitle = isFood
    ? "Pedido via WhatsApp"
    : isProduct
    ? "Consulta via WhatsApp"
    : "Solicitação via WhatsApp";

  const infoLabel = isFood
    ? "Confira como seu pedido será enviado:"
    : isProduct
    ? "Confira como sua mensagem será enviada:"
    : "Confira como sua solicitação será enviada:";

  const warningText = isFood
    ? "Ao enviar, você será direcionado para o WhatsApp do estabelecimento para finalizar seu pedido."
    : isProduct
    ? "Ao enviar, você será direcionado para o WhatsApp da loja para consultar a disponibilidade do produto."
    : "Ao enviar, você será direcionado para o WhatsApp do prestador para solicitar seu orçamento.";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.foreground}
          />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {screenTitle}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.infoLabel, { color: colors.muted }]}>
          {infoLabel}
        </Text>

        {/* Simulador de Balão de WhatsApp */}
        <View style={styles.whatsappBubbleWrapper}>
          <View style={styles.whatsappBubble}>
            <View style={styles.whatsappHeader}>
              <Text style={styles.whatsappHeaderTitle}>Você</Text>
              <Text style={styles.whatsappTime}>
                {new Date().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <Text style={styles.whatsappText}>
              {messageText}
            </Text>
            <View style={styles.whatsappCheckRow}>
              <MaterialIcons name="done-all" size={16} color="#34B7F1" />
            </View>
          </View>
        </View>

        {/* Banner de Aviso */}
        <View
          style={[
            styles.warningBanner,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialIcons name="info-outline" size={20} color={colors.primary} />
          <Text style={[styles.warningText, { color: colors.muted }]}>
            {warningText}
          </Text>
        </View>
      </ScrollView>

      {/* Footer Checkout CTA */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.checkoutBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleSendOrder}
        >
          <Text style={styles.checkoutBtnText}>Abrir WhatsApp</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  whatsappBubbleWrapper: {
    alignItems: "flex-end",
    marginBottom: 24,
    width: "100%",
  },
  whatsappBubble: {
    backgroundColor: "#DCF8C6", // Verde clássico do WhatsApp
    borderRadius: 14,
    padding: 12,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1.5,
  },
  whatsappHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 12,
  },
  whatsappHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#075E54",
  },
  whatsappTime: {
    fontSize: 10,
    color: "#666",
  },
  whatsappText: {
    fontSize: 13,
    color: "#111",
    lineHeight: 18,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace", // Estilo monospace para alinhar os pontinhos
  },
  whatsappCheckRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  checkoutBtn: {
    flexDirection: "row",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  checkoutBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
