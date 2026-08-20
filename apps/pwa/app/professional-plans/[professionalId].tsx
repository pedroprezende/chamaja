import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import {
  upgradeToPremium,
  getProfessionalById,
} from "@/data/mock";
import { trpc } from "@/lib/trpc";

export default function ProfessionalPlansScreen() {
  const router = useRouter();
  const { professionalId } = useLocalSearchParams<{ professionalId: string }>();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: premiumPlans, isLoading: plansLoading } = trpc.plans.list.useQuery();

  const professional = professionalId
    ? getProfessionalById(professionalId)
    : undefined;

  if (!professional) {
    return (
      <ScreenContainer
        containerClassName="bg-[#F5F5F5]"
        className="items-center justify-center"
      >
        <Text style={styles.errorText}>Profissional não encontrado</Text>
      </ScreenContainer>
    );
  }

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    try {
      upgradeToPremium(professionalId || "", planId);
      Alert.alert(
        "Parabéns!",
        "Você agora é um prestador PREMIUM! Sua visibilidade aumentou significativamente.",
        [
          {
            text: "Ver Perfil",
            onPress: () => {
              router.push(`/professional/${professionalId}` as any);
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Erro",
        "Não foi possível processar o upgrade. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const plan = premiumPlans?.find((p) => p.id === selectedPlan);

  if (plansLoading) {
    return (
      <ScreenContainer
        containerClassName="bg-[#F5F5F5]"
        className="items-center justify-center"
      >
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={{ marginTop: 12 }}>Carregando planos...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-[#F5F5F5]" className="">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#11181C" />
          </Pressable>
          <Text style={styles.title}>Planos Premium</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <MaterialIcons name="star" size={48} color="#FCD34D" />
            <Text style={styles.heroTitle}>Destaque seu Perfil</Text>
            <Text style={styles.heroSubtitle}>
              Apareça primeiro nos resultados e aumente suas chances de ser
              contratado
            </Text>
          </View>

          {/* Plans */}
          <View style={styles.plansContainer}>
            {premiumPlans?.map((p) => (
              <Pressable
                key={p.id}
                style={({ pressed }) => [
                  styles.planCard,
                  pressed && { opacity: 0.9 },
                  selectedPlan === p.id && styles.planCardSelected,
                ]}
                onPress={() =>
                  setSelectedPlan(selectedPlan === p.id ? null : p.id)
                }
              >
                {p.isFeatured && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>RECOMENDADO</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>{p.name}</Text>
                    {p.description ? <Text style={styles.planPeriod}>{p.description}</Text> : null}
                  </View>
                  <MaterialIcons
                    name={
                      selectedPlan === p.id
                        ? "radio-button-checked"
                        : "radio-button-unchecked"
                    }
                    size={24}
                    color={selectedPlan === p.id ? "#25D366" : "#D1D5DB"}
                  />
                </View>

                <View style={styles.priceSection}>
                  <Text style={styles.price}>R$ {p.monthlyPrice.toFixed(2)}</Text>
                  <Text style={styles.period}>/mês</Text>
                </View>

                {selectedPlan === p.id && (
                  <View style={styles.benefitsSection}>
                    <Text style={styles.benefitsTitle}>
                      Benefícios inclusos:
                    </Text>
                    {p.benefits?.map((benefit: any, idx: number) => (
                      <View key={idx} style={styles.benefitItem}>
                        <MaterialIcons
                          name="check-circle"
                          size={16}
                          color="#25D366"
                        />
                        <Text style={styles.benefitText}>{benefit.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* Comparison Table */}
          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonTitle}>Comparação</Text>
            <View style={styles.comparisonTable}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonFeature}>Recurso</Text>
                <Text style={styles.comparisonHeader}>Free</Text>
                <Text style={styles.comparisonHeader}>Premium</Text>
              </View>

              {[
                "Aparecer nos resultados",
                "Selo Premium",
                "Destaque na home",
                "Suporte prioritário",
              ].map((feature, idx) => (
                <View key={idx} style={styles.comparisonRow}>
                  <Text style={styles.comparisonFeature}>{feature}</Text>
                  <View style={styles.comparisonCell}>
                    {idx === 3 ? (
                      <MaterialIcons name="close" size={18} color="#D1D5DB" />
                    ) : (
                      <MaterialIcons name="check" size={18} color="#25D366" />
                    )}
                  </View>
                  <View style={styles.comparisonCell}>
                    <MaterialIcons name="check" size={18} color="#25D366" />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* FAQ */}
          <View style={styles.faqSection}>
            <Text style={styles.faqTitle}>Perguntas Frequentes</Text>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Posso cancelar meu plano?</Text>
              <Text style={styles.faqAnswer}>
                Sim, você pode cancelar a qualquer momento. Não há compromisso
                de longo prazo.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Como funciona o pagamento?</Text>
              <Text style={styles.faqAnswer}>
                Oferecemos pagamento seguro via PIX, cartão de crédito e
                transferência bancária.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>
                Quanto tempo leva para ativar?
              </Text>
              <Text style={styles.faqAnswer}>
                Seu plano Premium é ativado imediatamente após o pagamento.
              </Text>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Action Button */}
      {selectedPlan && (
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.upgradeButton,
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.6 },
            ]}
            onPress={() => handleUpgrade(selectedPlan)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="star" size={20} color="#FFFFFF" />
                <Text style={styles.upgradeButtonText}>
                  Atualizar para Premium
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#11181C",
    flex: 1,
    textAlign: "center",
  },
  content: {
    paddingHorizontal: 16,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#11181C",
    marginTop: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#687076",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  plansContainer: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  planCardSelected: {
    borderColor: "#25D366",
    backgroundColor: "#F0FDF4",
  },
  saveBadge: {
    backgroundColor: "#FCD34D",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  saveBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#78350F",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#11181C",
  },
  planPeriod: {
    fontSize: 13,
    color: "#687076",
    marginTop: 2,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    color: "#25D366",
  },
  period: {
    fontSize: 14,
    color: "#687076",
  },
  benefitsSection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    gap: 8,
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 4,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  comparisonSection: {
    marginBottom: 24,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#11181C",
    marginBottom: 12,
  },
  comparisonTable: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  comparisonFeature: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#11181C",
  },
  comparisonHeader: {
    flex: 0.5,
    fontSize: 12,
    fontWeight: "700",
    color: "#687076",
    textAlign: "center",
  },
  comparisonCell: {
    flex: 0.5,
    alignItems: "center",
  },
  faqSection: {
    marginBottom: 16,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#11181C",
    marginBottom: 12,
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: "#687076",
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  upgradeButton: {
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 16,
    color: "#11181C",
  },
});
