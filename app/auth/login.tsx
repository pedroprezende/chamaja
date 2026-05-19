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
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const auth = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const passwordRef = useRef<TextInput>(null);

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg("");
      setIsLoading(true);
      await auth.signInWithGoogle();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível fazer login com Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setErrorMsg("");
    try {
      if (!email || !password) {
        setErrorMsg("Email e senha são obrigatórios");
        return;
      }

      setIsLoading(true);
      await auth.signInWithEmail(email, password);
    } catch (error: any) {
      setErrorMsg(error.message || "Não foi possível fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["left", "right"]} className="">
      <LinearGradient
        colors={colors.background === "#F8F9FA" ? ["#FFFFFF", "#F3F4F6"] : ["#1E293B", "#0F172A"]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={[styles.logoBox, { backgroundColor: colors.primary + "20" }]}>
            <MaterialIcons name="local-fire-department" size={56} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>ChamaJá</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Encontre profissionais confiáveis agora</Text>
        </View>

        {/* Email/Password Form */}
        <View style={styles.form}>
          {/* Email Input */}
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
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordHeader}>
              <Text style={[styles.label, { color: colors.foreground }]}>Senha</Text>
              <Pressable onPress={() => router.push("/auth/forgot-password" as any)}>
                <Text style={[styles.forgotLink, { color: colors.primary }]}>Esqueceu?</Text>
              </Pressable>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="lock-outline" size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Sua senha"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                ref={passwordRef}
                returnKeyType="go"
                onSubmitEditing={handleEmailLogin}
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

          {/* Error Message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Login Button */}
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85 },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.muted }]}>Ou continue com</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Google OAuth Button */}
        <View style={styles.oauthSection}>
          <Pressable
            style={({ pressed }) => [
              styles.oauthButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <MaterialIcons name="g-translate" size={22} color="#EA4335" />
            <Text style={[styles.oauthText, { color: colors.foreground }]}>Continuar com Google</Text>
          </Pressable>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text style={[styles.signupText, { color: colors.muted }]}>Não tem uma conta? </Text>
          <Pressable onPress={() => router.push("/auth/signup" as any)}>
            <Text style={[styles.signupLink, { color: colors.primary }]}>Cadastre-se</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  forgotLink: {
    fontSize: 12,
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
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    flex: 1,
  },
  loginButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  oauthSection: {
    marginBottom: 24,
  },
  oauthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  oauthText: {
    fontSize: 16,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  signupText: {
    fontSize: 15,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: "800",
  },
  footer: {
    marginTop: 32,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
    paddingHorizontal: 20,
  },
});
