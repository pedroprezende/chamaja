import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetPassword = async () => {
    try {
      if (!email) {
        Alert.alert("Erro", "Digite seu email");
        return;
      }

      setIsLoading(true);
      // Simular envio de email
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível enviar o email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#1F2937]" className="">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.title}>Redefinir Senha</Text>
        </View>

        {isSubmitted ? (
          // Success State
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check-circle" size={64} color="#25D366" />
            </View>
            <Text style={styles.successTitle}>Email enviado!</Text>
            <Text style={styles.successMessage}>
              Verifique sua caixa de entrada para um link de redefinição de senha
            </Text>
            <Pressable
              style={({ pressed }) => [styles.backToLoginBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backToLoginText}>Voltar para Login</Text>
            </Pressable>
          </View>
        ) : (
          // Form State
          <View style={styles.form}>
            <Text style={styles.description}>
              Digite seu email e enviaremos um link para redefinir sua senha
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="mail-outline" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.resetButton,
                pressed && { opacity: 0.85 },
                isLoading && { opacity: 0.6 },
              ]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.resetButtonText}>Enviar Link</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  form: {
    gap: 24,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: "#9CA3AF",
    lineHeight: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#4B5563",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    padding: 0,
  },
  resetButton: {
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  successIcon: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  successMessage: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  backToLoginBtn: {
    marginTop: 24,
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
