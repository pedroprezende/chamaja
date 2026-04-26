import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await auth.signInWithGoogle();
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível fazer login com Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true);
      await auth.signInWithMicrosoft();
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível fazer login com Microsoft");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      await auth.signInWithApple();
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível fazer login com Apple");
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
        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <MaterialIcons name="local-fire-department" size={48} color="#25D366" />
          </View>
          <Text style={styles.title}>ChamaJá</Text>
          <Text style={styles.subtitle}>Encontre profissionais confiáveis</Text>
        </View>

        {/* OAuth Buttons */}
        <View style={styles.oauthSection}>
          <Pressable
            style={({ pressed }) => [
              styles.oauthButton,
              styles.googleButton,
              pressed && { opacity: 0.8 },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <MaterialIcons name="g-translate" size={20} color="#EA4335" />
            <Text style={styles.oauthText}>Continuar com Google</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.oauthButton,
              styles.microsoftButton,
              pressed && { opacity: 0.8 },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleMicrosoftLogin}
            disabled={isLoading}
          >
            <MaterialIcons name="window" size={20} color="#0078D4" />
            <Text style={styles.oauthText}>Continuar com Microsoft</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.oauthButton,
              styles.appleButton,
              pressed && { opacity: 0.8 },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleAppleLogin}
            disabled={isLoading}
          >
            <MaterialIcons name="apple" size={20} color="#FFFFFF" />
            <Text style={[styles.oauthText, styles.appleButtonText]}>Continuar com Apple</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email Input */}
        <View style={styles.emailSection}>
          <Text style={styles.emailLabel}>Digite seu endereço de e-mail</Text>
          <Pressable
            style={({ pressed }) => [styles.emailInput, pressed && { opacity: 0.8 }]}
            onPress={() => router.push("/auth/login-email" as any)}
          >
            <MaterialIcons name="mail-outline" size={18} color="#9CA3AF" />
            <Text style={styles.emailPlaceholder}>seu@email.com</Text>
          </Pressable>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#25D366" />
            <Text style={styles.loadingText}>Autenticando...</Text>
          </View>
        )}

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Não tem conta? </Text>
          <Pressable onPress={() => router.push("/auth/signup" as any)}>
            <Text style={styles.signupLink}>Cadastre-se</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 48,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(37, 211, 102, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#9CA3AF",
  },
  oauthSection: {
    gap: 12,
    marginBottom: 24,
  },
  oauthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  microsoftButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  appleButton: {
    backgroundColor: "#000000",
    borderColor: "#333333",
  },
  oauthText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#374151",
  },
  dividerText: {
    fontSize: 13,
    color: "#6B7280",
  },
  emailSection: {
    gap: 10,
    marginBottom: 24,
  },
  emailLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  emailInput: {
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
  emailPlaceholder: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  loadingContainer: {
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
  },
  signupText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#25D366",
  },
  footer: {
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },
});
