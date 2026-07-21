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
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

export default function SignupScreen() {
  const router = useRouter();
  const auth = useAuth();
  const colors = useColors();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    import("expo-apple-authentication")
      .then((m) => m.isAvailableAsync())
      .then((avail) => setIsAppleAvailable(avail))
      .catch(() => setIsAppleAvailable(false));
  }, []);

  const handleSignup = async () => {
    try {
      if (!name || !email || !password || !confirmPassword) {
        Alert.alert("Erro", "Todos os campos são obrigatórios");
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert("Erro", "As senhas não coincidem");
        return;
      }

      if (password.length < 6) {
        Alert.alert("Erro", "Senha deve ter no mínimo 6 caracteres");
        return;
      }

      setIsLoading(true);
      const result = await auth.signUpWithEmail(email, password, name);

      if (result.accountAlreadyExisted) {
        // Account existed and auto-login succeeded
        Alert.alert(
          "Conta encontrada 👋",
          "Esta conta já existe. Você foi conectado automaticamente.",
          [
            {
              text: "Continuar",
              onPress: async () => {
                const isBusinessFlag = await AsyncStorage.getItem(
                  "@chamaja_login_as_business",
                );
                if (isBusinessFlag === "true") {
                  router.replace("/register-professional" as any);
                } else {
                  router.replace("/(tabs)" as any);
                }
              },
            },
          ],
        );
      } else if (result.needsConfirmation) {
        Alert.alert(
          "Cadastro Realizado!",
          "Enviamos um e-mail de confirmação. Por favor, acesse seu e-mail e clique no link de ativação para poder realizar o login.",
          [
            {
              text: "Entendi",
              onPress: () => router.replace("/auth/login" as any),
            },
          ],
        );
      } else {
        Alert.alert("Sucesso!", "Conta criada com sucesso!", [
          {
            text: "Avançar",
            onPress: async () => {
              const isBusinessFlag = await AsyncStorage.getItem(
                "@chamaja_login_as_business",
              );
              if (isBusinessFlag === "true") {
                router.replace("/register-professional" as any);
              } else {
                router.replace("/(tabs)" as any);
              }
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível criar a conta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      // Preserve business flag if set
      await auth.signInWithGoogle();
      // Note: navigation is handled by the auth state change listener.
      // If account already existed, the user is logged in seamlessly.
    } catch (error) {
      Alert.alert("Erro", "Não foi possível continuar com o Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    try {
      setIsLoading(true);
      await auth.signInWithApple();
    } catch (error) {
      console.warn("Apple signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => router.back()}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colors.foreground}
            />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Criar Conta
          </Text>
        </View>

        {/* OAuth Buttons */}
        <View style={styles.oauthSection}>
          {/* Google Button */}
          <Pressable
            style={({ pressed }) => [
              styles.oauthBtn,
              { borderColor: colors.border, backgroundColor: colors.surface },
              pressed && { opacity: 0.8 },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleGoogleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.foreground} size="small" />
            ) : (
              <>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <Path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <Path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <Path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                </Svg>
                <Text style={[styles.oauthBtnText, { color: colors.foreground }]}>
                  Continuar com Google
                </Text>
              </>
            )}
          </Pressable>

          {/* Apple Button */}
          {isAppleAvailable && (
            <Pressable
              style={({ pressed }) => [
                styles.oauthBtn,
                { borderColor: colors.border, backgroundColor: colors.surface },
                pressed && { opacity: 0.8 },
                isLoading && { opacity: 0.6 },
              ]}
              onPress={handleAppleSignup}
              disabled={isLoading}
            >
              <FontAwesome name="apple" size={20} color={colors.foreground} />
              <Text style={[styles.oauthBtnText, { color: colors.foreground }]}>
                Continuar com Apple
              </Text>
            </Pressable>
          )}
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border }]}
          />
          <Text style={[styles.dividerText, { color: colors.muted }]}>
            ou crie com e-mail
          </Text>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border }]}
          />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Nome completo
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MaterialIcons
                name="person-outline"
                size={18}
                color={colors.muted}
              />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Seu nome"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                editable={!isLoading}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Email
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MaterialIcons
                name="mail-outline"
                size={18}
                color={colors.muted}
              />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="seu@email.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                ref={emailRef}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Senha
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MaterialIcons
                name="lock-outline"
                size={18}
                color={colors.muted}
              />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                ref={passwordRef}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                blurOnSubmit={false}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={18}
                  color={colors.muted}
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Confirmar senha
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MaterialIcons
                name="lock-outline"
                size={18}
                color={colors.muted}
              />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Confirme sua senha"
                placeholderTextColor={colors.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                ref={confirmPasswordRef}
                returnKeyType="go"
                onSubmitEditing={handleSignup}
              />
            </View>
          </View>

          {/* Sign Up Button */}
          <Pressable
            style={({ pressed }) => [
              styles.signupButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85 },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signupButtonText}>Criar Conta</Text>
            )}
          </Pressable>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.muted }]}>
              Já tem conta?{" "}
            </Text>
            <Pressable onPress={() => router.back()} disabled={isLoading}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>
                Faça login
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Ao criar uma conta, você concorda com nossos Termos de Serviço e
            Política de Privacidade
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
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
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
  oauthSection: {
    gap: 12,
    marginBottom: 24,
  },
  oauthBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  oauthBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  form: {
    gap: 20,
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
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  signupButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
