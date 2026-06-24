import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { useCart } from "@/lib/cart-context";
import AddressSelectorModal from "@/components/address-selector-modal";

export default function CartScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    items,
    notes,
    setNotes,
    deliveryAddress,
    setDeliveryAddress,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
  } = useCart();

  const [showAddressModal, setShowAddressModal] = useState(false);

  // Busca detalhes do comércio
  const { data: professional } = trpc.providers.getById.useQuery(id as string, {
    enabled: !!id,
  });

  const confirmAction = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", style: "destructive", onPress: onConfirm },
      ]);
    }
  };

  const handleClearCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    confirmAction(
      "Esvaziar carrinho?",
      "Tem certeza que deseja remover todos os itens do seu carrinho?",
      () => {
        clearCart();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    );
  };

  const handleDecreaseQuantity = (itemId: string, currentQty: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentQty === 1) {
      confirmAction(
        "Remover item?",
        "Deseja remover este item do carrinho?",
        () => removeFromCart(itemId),
      );
    } else {
      updateQuantity(itemId, currentQty - 1);
    }
  };

  const handleIncreaseQuantity = (itemId: string, currentQty: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateQuantity(itemId, currentQty + 1);
  };

  const handleCheckout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (
      !deliveryAddress ||
      deliveryAddress.trim() === "" ||
      deliveryAddress.includes("defina seu endereço") ||
      deliveryAddress.includes("endereço de atendimento")
    ) {
      Alert.alert(
        isFood ? "Endereço necessário" : "Local de atendimento necessário",
        isFood
          ? "Por favor, defina um endereço de entrega antes de finalizar seu pedido."
          : "Por favor, defina o endereço de atendimento antes de finalizar seu pedido.",
      );
      return;
    }
    // Redireciona para a tela de geração do pedido formatado
    router.push(`/professional/${id}/whatsapp-order` as any);
  };

  const isFood = (professional?.businessType || "servicos") === "alimentacao";
  const formattedDeliveryTime = professional?.deliveryTime || "30-45 min";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
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
              Carrinho
            </Text>
            {professional && (
              <Text
                style={[styles.headerSubtitle, { color: colors.muted }]}
                numberOfLines={1}
              >
                {professional.name}
              </Text>
            )}
          </View>
          {cartCount > 0 && (
            <Pressable onPress={handleClearCart} style={styles.headerClearBtn}>
              <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
            </Pressable>
          )}
        </View>

        {cartCount === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="shopping-basket"
              size={64}
              color={colors.muted}
            />
            <Text style={[styles.emptyText, { color: colors.foreground }]}>
              Seu carrinho está vazio
            </Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>
              Navegue pelo cardápio e adicione itens para fazer seu pedido.
            </Text>
            <Pressable
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={styles.emptyBtnText}>Ver Cardápio</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 140 }}
          >
            {/* Seção Entrega/Endereço */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.sectionHeader}>
                <MaterialIcons
                  name={isFood ? "local-shipping" : "room"}
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[styles.sectionTitle, { color: colors.foreground }]}
                >
                  {isFood ? "Entrega" : "Local de Atendimento"}
                </Text>
              </View>

              {isFood && (
                <>
                  <View style={styles.infoRow}>
                    <MaterialIcons
                      name="access-time"
                      size={16}
                      color={colors.muted}
                    />
                    <Text
                      style={[styles.infoText, { color: colors.foreground }]}
                    >
                      Tempo estimado:{" "}
                      <Text style={{ fontWeight: "700" }}>
                        {formattedDeliveryTime}
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              <View style={styles.addressRow}>
                <View style={styles.addressLeft}>
                  <MaterialIcons name="location-on" size={18} color="#EF4444" />
                  <View style={styles.addressTextContainer}>
                    <Text
                      style={[styles.addressLabel, { color: colors.muted }]}
                    >
                      {isFood ? "Entregar em" : "Atender em"}
                    </Text>
                    <Text
                      style={[
                        styles.addressValue,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={2}
                    >
                      {deliveryAddress ||
                        (isFood
                          ? "Defina seu endereço de entrega"
                          : "Defina o endereço de atendimento")}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setShowAddressModal(true)}
                  style={[
                    styles.addressEditBtn,
                    { borderColor: colors.primary + "30" },
                  ]}
                >
                  <Text
                    style={[
                      styles.addressEditBtnText,
                      { color: colors.primary },
                    ]}
                  >
                    Alterar
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Itens do Pedido */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.cardSectionTitle, { color: colors.foreground }]}
              >
                Seu pedido
              </Text>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  {item.imageUri ? (
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.itemImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.itemImage,
                        {
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: colors.border + "40",
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="restaurant"
                        size={20}
                        color={colors.muted}
                      />
                    </View>
                  )}
                  <View style={styles.itemDetails}>
                    <Text
                      style={[styles.itemName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.itemPrice, { color: colors.muted }]}>
                      R$ {item.price.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <Pressable
                      onPress={() =>
                        handleDecreaseQuantity(item.id, item.quantity)
                      }
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                    >
                      <MaterialIcons
                        name="remove"
                        size={16}
                        color={colors.foreground}
                      />
                    </Pressable>
                    <Text
                      style={[styles.qtyText, { color: colors.foreground }]}
                    >
                      {item.quantity}
                    </Text>
                    <Pressable
                      onPress={() =>
                        handleIncreaseQuantity(item.id, item.quantity)
                      }
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                    >
                      <MaterialIcons
                        name="add"
                        size={16}
                        color={colors.foreground}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        confirmAction(
                          "Remover item?",
                          `Deseja remover "${item.name || "este produto"}" do carrinho?`,
                          () => removeFromCart(item.id),
                        );
                      }}
                      style={{ marginLeft: 10, padding: 4 }}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={20}
                        color="#EF4444"
                      />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {/* Observações */}
            {isFood && (
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardSectionTitle,
                    { color: colors.foreground },
                  ]}
                >
                  Observação (opcional)
                </Text>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  placeholder="Ex: Sem cebola, trocar refrigerante de guaraná por zero..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                  maxLength={120}
                />
                <Text style={[styles.notesCharCount, { color: colors.muted }]}>
                  {notes.length}/120
                </Text>
              </View>
            )}

            {/* Resumo Financeiro */}
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>
                  Subtotal
                </Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  R$ {cartTotal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>
                  Taxa de entrega
                </Text>
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  A combinar
                </Text>
              </View>

              <View style={[styles.divider, { marginVertical: 12 }]} />

              <View style={styles.summaryRow}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                >
                  Total estimado
                </Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                >
                  R$ {cartTotal.toFixed(2)}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Footer Checkout CTA */}
        {cartCount > 0 && (
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
              onPress={handleCheckout}
            >
              <MaterialIcons name="chat" size={22} color="#FFF" />
              <View style={styles.checkoutBtnTextContainer}>
                <Text style={styles.checkoutBtnText}>
                  Enviar pedido no WhatsApp
                </Text>
                <Text style={styles.checkoutBtnSub}>
                  Seu pedido será enviado para o WhatsApp do estabelecimento
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Modal para trocar o endereço */}
        <AddressSelectorModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerClearBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: {
    color: "#FFF",
    fontWeight: "700",
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 14,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  addressLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 8,
  },
  addressTextContainer: {
    flex: 1,
    gap: 1,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  addressValue: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  addressEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  addressEditBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
  },
  itemPrice: {
    fontSize: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "700",
    minWidth: 16,
    textAlign: "center",
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    height: 70,
    textAlignVertical: "top",
    fontSize: 13,
  },
  notesCharCount: {
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
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
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  checkoutBtnTextContainer: {
    flex: 1,
    gap: 1,
  },
  checkoutBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  checkoutBtnSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "500",
  },
});
