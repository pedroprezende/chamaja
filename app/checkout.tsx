import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import {
  PAYMENT_PLANS,
  PAYMENT_METHODS,
  createPaymentPreference,
  processPayment,
} from "@/lib/mercadopago-service";

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { professionalId } = useLocalSearchParams<{ professionalId: string }>();

  const [selectedPlan, setSelectedPlan] = useState<string>("premium_monthly");
  const [selectedMethod, setSelectedMethod] = useState<string>("pix");
  const [loading, setLoading] = useState(false);

  const plan = PAYMENT_PLANS.find((p) => p.id === selectedPlan);
  const method = PAYMENT_METHODS.find((m) => m.id === selectedMethod);

  const handlePayment = async () => {
    if (!professionalId || !plan || !method) {
      Alert.alert("Erro", "Dados incompletos");
      return;
    }

    setLoading(true);
    try {
      // Create payment preference
      const preference = await createPaymentPreference(
        professionalId,
        selectedPlan,
        selectedMethod
      );

      // Process payment
      const result = await processPayment(preference, {
        method: selectedMethod,
      });

      if (result.success) {
        Alert.alert("Sucesso!", "Pagamento processado com sucesso", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Erro", result.error || "Falha ao processar pagamento");
      }
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error ? error.message : "Erro desconhecido"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#F5F5F5]">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Plan Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecione o Plano</Text>
            {PAYMENT_PLANS.map((p) => (
              <Pressable
                key={p.id}
                style={[
                  styles.planCard,
                  selectedPlan === p.id && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan(p.id)}
              >
                <View style={styles.planContent}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{p.name}</Text>
                    {selectedPlan === p.id && (
                      <MaterialIcons name="check-circle" size={24} color="#25D366" />
                    )}
                  </View>
                  <Text style={styles.planDescription}>{p.description}</Text>
                  <Text style={styles.planPrice}>
                    R$ {p.price.toFixed(2).replace(".", ",")}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Payment Method Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Método de Pagamento</Text>
            {PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m.id}
                style={[
                  styles.methodCard,
                  selectedMethod === m.id && styles.methodCardSelected,
                ]}
                onPress={() => setSelectedMethod(m.id)}
              >
                <View style={styles.methodContent}>
                  <View style={styles.methodHeader}>
                    <MaterialIcons
                      name={
                        m.type === "pix"
                          ? "qr-code"
                          : m.type === "credit_card"
                            ? "credit-card"
                            : "description"
                      }
                      size={24}
                      color={selectedMethod === m.id ? "#25D366" : "#9CA3AF"}
                    />
                    <Text style={styles.methodName}>{m.name}</Text>
                  </View>
                  {selectedMethod === m.id && (
                    <MaterialIcons name="check-circle" size={24} color="#25D366" />
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plano:</Text>
              <Text style={styles.summaryValue}>{plan?.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Método:</Text>
              <Text style={styles.summaryValue}>{method?.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                R$ {plan?.price.toFixed(2).replace(".", ",")}
              </Text>
            </View>
          </View>

          {/* Pay Button */}
          <Pressable
            style={({ pressed }) => [
              styles.payButton,
              pressed && { opacity: 0.9 },
              loading && { opacity: 0.6 },
            ]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.payButtonText}>Confirmar Pagamento</Text>
            )}
          </Pressable>

          {/* Info Text */}
          <Text style={styles.infoText}>
            Seu pagamento é seguro e processado pela Mercado Pago. Você receberá
            um comprovante por e-mail.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  planCardSelected: {
    borderColor: "#25D366",
    backgroundColor: "#F0FDF4",
  },
  planContent: {
    gap: 8,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  planDescription: {
    fontSize: 12,
    color: "#6B7280",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#25D366",
  },
  methodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  methodCardSelected: {
    borderColor: "#25D366",
    backgroundColor: "#F0FDF4",
  },
  methodContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  methodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  summary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#25D366",
  },
  payButton: {
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
});
