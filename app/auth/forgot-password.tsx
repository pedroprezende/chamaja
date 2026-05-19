import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";

import { ScreenContainer } from "@/components/screen-container";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/use-colors";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
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
      
      const redirectTo = Platform.OS === "web"
        ? `${window.location.origin}/auth/reset-password`
        : Linking.createURL("/auth/reset-password");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;
      
      setIsSubmitted(true);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível enviar o e-mail de recuperação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="">
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
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Redefinir Senha</Text>
        </View>

        {isSubmitted ? (
          // Success State
          <View style={styles.successContainer}>
            <View style={[styles.successIconBox, { backgroundColor: colors.success + "20" }]}>
              <MaterialIcons name="check-circle" size={64} color={colors.success || "#22C55E"} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>E-mail enviado!</Text>
            <Text style={[styles.successMessage, { color: colors.muted }]}>
              Verifique sua caixa de entrada para obter o link de redefinição de senha
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.backToLoginBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 }
              ]}
              onPress={() => router.back()}
            >
              <Text style={styles.backToLoginText}>Voltar para Login</Text>
            </Pressable>
          </View>
        ) : (
          // Form State
          <View style={styles.form}>
            <Text style={[styles.description, { color: colors.muted }]}>
              Digite seu e-mail cadastrado e enviaremos um link seguro para redefinir sua senha.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="mail-outline" size={18} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.muted}
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
                { backgroundColor: colors.primary },
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
  },
  form: {
    gap: 24,
    flex: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  resetButton: {
    borderRadius: 16,
    paddingVertical: 16,
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
    paddingVertical: 40,
  },
  successIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  successMessage: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  backToLoginBtn: {
    marginTop: 24,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  backToLoginText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
