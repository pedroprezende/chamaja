import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/lib/auth-context";
import { useProvider, PLANS, type PlanType } from "@/lib/provider-context";

const CATEGORIES = [
  "Eletricista",
  "Encanador",
  "Diarista",
  "Pintor",
  "Pedreiro",
  "Marceneiro",
  "Jardineiro",
  "Marido de aluguel",
  "Cozinheira",
  "Babá",
  "Passadeira",
  "Ar condicionado",
  "Celular",
  "Outro",
];

type Step = "plan" | "form" | "payment" | "success";

export default function BecomeProviderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { registerProvider } = useProvider();

  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    category: "",
    city: "",
    neighborhood: "",
    phone: "",
    avatar: user?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    description: "",
  });

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setForm((prev) => ({ ...prev, avatar: result.assets[0].uri }));
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) { Alert.alert("Erro", "Digite seu nome"); return false; }
    if (!form.category) { Alert.alert("Erro", "Selecione uma categoria"); return false; }
    if (!form.city.trim()) { Alert.alert("Erro", "Digite sua cidade"); return false; }
    if (!form.neighborhood.trim()) { Alert.alert("Erro", "Digite seu bairro"); return false; }
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) {
      Alert.alert("Erro", "Digite um WhatsApp válido (mín. 10 dígitos)"); return false;
    }
    if (!form.description.trim() || form.description.length < 20) {
      Alert.alert("Erro", "Descrição deve ter pelo menos 20 caracteres"); return false;
    }
    return true;
  };

  const handleConfirmPayment = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Simula processamento de pagamento
      await new Promise((r) => setTimeout(r, 1500));
      await registerProvider(form, user.id, selectedPlan);
      setStep("success");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const plan = selectedPlan ? PLANS[selectedPlan] : null;

  // ── STEP: PLAN SELECTION ──
  if (step === "plan") {
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

          <Text style={styles.plansTitle}>Escolha seu plano</Text>

          {/* Monthly Plan */}
          <Pressable
            style={[styles.planCard, selectedPlan === "monthly" && styles.planCardSelected]}
            onPress={() => setSelectedPlan("monthly")}
          >
            <View style={styles.planRadio}>
              {selectedPlan === "monthly" && <View style={styles.planRadioInner} />}
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>Plano Mensal</Text>
              <Text style={styles.planPrice}>R$ 10,00<Text style={styles.planPeriod}>/mês</Text></Text>
              <Text style={styles.planDesc}>Cancele quando quiser</Text>
            </View>
          </Pressable>

          {/* Annual Plan */}
          <Pressable
            style={[styles.planCard, selectedPlan === "annual" && styles.planCardSelected]}
            onPress={() => setSelectedPlan("annual")}
          >
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Melhor valor</Text>
            </View>
            <View style={styles.planRadio}>
              {selectedPlan === "annual" && <View style={styles.planRadioInner} />}
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>Plano Anual</Text>
              <Text style={styles.planPrice}>R$ 99,90<Text style={styles.planPeriod}>/ano</Text></Text>
              <Text style={styles.planDesc}>Economize 58% em relação ao mensal</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
            onPress={() => setStep("form")}
          >
            <Text style={styles.ctaBtnText}>Continuar com plano {plan?.label}</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── STEP: FORM ──
  if (step === "form") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => setStep("plan")}
          >
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Seus Dados</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
          {/* Avatar */}
          <Pressable style={styles.avatarPicker} onPress={handlePickAvatar}>
            <Image source={{ uri: form.avatar }} style={styles.avatarPreview} />
            <View style={styles.avatarOverlay}>
              <MaterialIcons name="camera-alt" size={20} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Toque para adicionar foto</Text>

          <Text style={styles.fieldLabel}>Nome completo</Text>
          <View style={styles.fieldBox}>
            <MaterialIcons name="person" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.fieldInput}
              placeholder="Seu nome"
              placeholderTextColor="#9CA3AF"
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />
          </View>

          <Text style={styles.fieldLabel}>Categoria de serviço</Text>
          <Pressable
            style={styles.fieldBox}
            onPress={() => setShowCategoryPicker(true)}
          >
            <MaterialIcons name="category" size={18} color="#9CA3AF" />
            <Text style={[styles.fieldInput, !form.category && { color: "#9CA3AF" }]}>
              {form.category || "Selecione uma categoria"}
            </Text>
            <MaterialIcons name="expand-more" size={20} color="#9CA3AF" />
          </Pressable>

          <Text style={styles.fieldLabel}>Cidade</Text>
          <View style={styles.fieldBox}>
            <MaterialIcons name="location-city" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.fieldInput}
              placeholder="Ex: São Paulo"
              placeholderTextColor="#9CA3AF"
              value={form.city}
              onChangeText={(t) => setForm({ ...form, city: t })}
            />
          </View>

          <Text style={styles.fieldLabel}>Bairro</Text>
          <View style={styles.fieldBox}>
            <MaterialIcons name="place" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.fieldInput}
              placeholder="Ex: Centro"
              placeholderTextColor="#9CA3AF"
              value={form.neighborhood}
              onChangeText={(t) => setForm({ ...form, neighborhood: t })}
            />
          </View>

          <Text style={styles.fieldLabel}>WhatsApp</Text>
          <View style={styles.fieldBox}>
            <MaterialIcons name="phone" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.fieldInput}
              placeholder="(11) 99999-9999"
              placeholderTextColor="#9CA3AF"
              value={form.phone}
              onChangeText={(t) => setForm({ ...form, phone: t })}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.fieldLabel}>Descrição dos seus serviços</Text>
          <View style={[styles.fieldBox, { alignItems: "flex-start", paddingTop: 12 }]}>
            <TextInput
              style={[styles.fieldInput, { minHeight: 80, textAlignVertical: "top" }]}
              placeholder="Descreva sua experiência e os serviços que oferece..."
              placeholderTextColor="#9CA3AF"
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
              multiline
              numberOfLines={4}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
            onPress={() => { if (validateForm()) setStep("payment"); }}
          >
            <Text style={styles.ctaBtnText}>Revisar e pagar</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </ScrollView>

        {/* Category Picker Modal */}
        {showCategoryPicker && (
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Selecione a categoria</Text>
              <ScrollView>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={({ pressed }) => [styles.pickerItem, pressed && { backgroundColor: "#F3F4F6" }]}
                    onPress={() => { setForm({ ...form, category: cat }); setShowCategoryPicker(false); }}
                  >
                    <Text style={[styles.pickerItemText, form.category === cat && { color: "#25D366", fontWeight: "700" }]}>
                      {cat}
                    </Text>
                    {form.category === cat && <MaterialIcons name="check" size={20} color="#25D366" />}
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable style={styles.pickerClose} onPress={() => setShowCategoryPicker(false)}>
                <Text style={styles.pickerCloseText}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  }

  // ── STEP: PAYMENT ──
  if (step === "payment") {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => setStep("form")}
          >
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Confirmar Pagamento</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumo do pedido</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Prestador</Text>
              <Text style={styles.summaryValue}>{form.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Categoria</Text>
              <Text style={styles.summaryValue}>{form.category}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plano</Text>
              <Text style={styles.summaryValue}>{plan?.label}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>{plan?.priceLabel}</Text>
            </View>
          </View>

          {/* Payment methods */}
          <Text style={styles.plansTitle}>Forma de pagamento</Text>
          <View style={styles.paymentMethodsCard}>
            {[
              { icon: "pix", label: "PIX", sub: "Aprovação imediata" },
              { icon: "credit-card", label: "Cartão de crédito", sub: "Em até 12x" },
              { icon: "receipt", label: "Boleto bancário", sub: "Vence em 3 dias úteis" },
            ].map((m) => (
              <View key={m.label} style={styles.paymentMethodRow}>
                <MaterialIcons name={m.icon as any} size={22} color="#25D366" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentMethodLabel}>{m.label}</Text>
                  <Text style={styles.paymentMethodSub}>{m.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.secureRow}>
            <MaterialIcons name="lock" size={14} color="#6B7280" />
            <Text style={styles.secureText}>Pagamento 100% seguro e criptografado</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.ctaBtn, loading && { opacity: 0.7 }, pressed && { opacity: 0.85 }]}
            onPress={handleConfirmPayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.ctaBtnText}>Confirmar e ativar conta</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── STEP: SUCCESS ──
  return (
    <View style={[styles.container, styles.successContainer, { paddingTop: insets.top }]}>
      <View style={styles.successIcon}>
        <MaterialIcons name="check-circle" size={72} color="#25D366" />
      </View>
      <Text style={styles.successTitle}>Conta ativada!</Text>
      <Text style={styles.successSubtitle}>
        Parabéns, {form.name}! Sua conta de prestador foi ativada com o plano{" "}
        <Text style={{ fontWeight: "700" }}>{plan?.label}</Text>.{"\n"}
        Agora você aparece nas buscas de clientes.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.ctaBtn, { marginTop: 32 }, pressed && { opacity: 0.85 }]}
        onPress={() => router.replace("/provider-dashboard" as any)}
      >
        <MaterialIcons name="dashboard" size={20} color="#fff" />
        <Text style={styles.ctaBtnText}>Ir para minha área</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
        onPress={() => router.replace("/(tabs)" as any)}
      >
        <Text style={styles.secondaryBtnText}>Voltar ao início</Text>
      </Pressable>
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
  plansTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    position: "relative",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  planCardSelected: { borderColor: "#25D366", backgroundColor: "#F0FDF4" },
  planBadge: {
    position: "absolute", top: -10, right: 16,
    backgroundColor: "#FCD34D", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  planBadgeText: { fontSize: 11, fontWeight: "700", color: "#92400E" },
  planRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#25D366",
    alignItems: "center", justifyContent: "center",
  },
  planRadioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#25D366" },
  planInfo: { flex: 1, gap: 2 },
  planName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  planPrice: { fontSize: 22, fontWeight: "800", color: "#25D366" },
  planPeriod: { fontSize: 14, fontWeight: "400", color: "#6B7280" },
  planDesc: { fontSize: 12, color: "#6B7280" },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#25D366", borderRadius: 14, paddingVertical: 16,
    marginHorizontal: 16, marginTop: 16, gap: 8,
  },
  ctaBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  secondaryBtn: { marginTop: 12, alignItems: "center", paddingVertical: 12 },
  secondaryBtnText: { fontSize: 15, color: "#6B7280", fontWeight: "500" },
  // Form
  formContent: { padding: 20, paddingBottom: 40 },
  avatarPicker: {
    width: 90, height: 90, borderRadius: 45, alignSelf: "center",
    marginBottom: 4, position: "relative",
  },
  avatarPreview: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#E5E7EB" },
  avatarOverlay: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFFFFF",
  },
  avatarHint: { textAlign: "center", fontSize: 12, color: "#9CA3AF", marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  fieldBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, gap: 8,
  },
  fieldInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  // Category picker
  pickerOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: "70%", paddingTop: 16,
  },
  pickerTitle: { fontSize: 16, fontWeight: "700", color: "#111827", paddingHorizontal: 20, marginBottom: 8 },
  pickerItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  pickerItemText: { fontSize: 15, color: "#374151" },
  pickerClose: { padding: 16, alignItems: "center" },
  pickerCloseText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  // Payment
  summaryCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  summaryTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: "#6B7280" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  summaryTotal: { borderTopWidth: 1, borderTopColor: "#E5E7EB", marginTop: 8, paddingTop: 12 },
  summaryTotalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  summaryTotalValue: { fontSize: 18, fontWeight: "800", color: "#25D366" },
  paymentMethodsCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  paymentMethodRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  paymentMethodLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  paymentMethodSub: { fontSize: 12, color: "#9CA3AF" },
  secureRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 12 },
  secureText: { fontSize: 12, color: "#6B7280" },
  // Success
  successContainer: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  successIcon: { marginBottom: 20 },
  successTitle: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 12 },
  successSubtitle: { fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22 },
});
