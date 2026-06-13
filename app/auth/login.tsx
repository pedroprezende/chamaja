import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Svg, { Path } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
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

  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    import("expo-apple-authentication")
      .then((m) => m.isAvailableAsync())
      .then((avail) => setIsAppleAvailable(avail))
      .catch(() => setIsAppleAvailable(false));
  }, []);

  const handleAppleLogin = async () => {
    try {
      setErrorMsg("");
      setIsLoading(true);
      await auth.signInWithApple();
    } catch (error) {
      console.warn("Apple login error:", error);
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
    <ScreenContainer edges={["top", "left", "right"]} style={{ backgroundColor: "#000000" }} containerClassName="bg-black">
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/logo_custom.png")}
              style={styles.logoImage}
            />
          </View>

          {/* Parrot Mascot */}
          <View style={styles.parrotContainer}>
            <Image
              source={require("@/assets/images/parrot_custom.png")}
              style={styles.parrotImage}
            />
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bem-vindo!</Text>
            <Text style={styles.cardSubtitle}>Faça login para continuar</Text>

            {/* Email/Phone Input */}
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person-outline" size={20} color="#84cc16" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email ou telefone"
                placeholderTextColor="#666666"
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

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={20} color="#84cc16" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#666666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                ref={passwordRef}
                returnKeyType="go"
                onSubmitEditing={handleEmailLogin}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#666666"
                />
              </Pressable>
            </View>

            {/* Forgot Password */}
            <Pressable
              onPress={() => router.push("/auth/forgot-password" as any)}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
            </Pressable>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Enter Button */}
            <Pressable
              style={({ pressed }) => [
                styles.enterBtn,
                pressed && { opacity: 0.9 },
                isLoading && { opacity: 0.6 },
              ]}
              onPress={handleEmailLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.enterBtnText}>Entrar</Text>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou continue com</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Logins */}
            <View style={styles.socialContainer}>
              {/* Google Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.socialBtn,
                  pressed && { opacity: 0.8 },
                  isLoading && { opacity: 0.6 },
                ]}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
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
                <Text style={styles.socialBtnText}>Entrar com Google</Text>
              </Pressable>

              {/* Apple Button */}
              {isAppleAvailable && (
                <Pressable
                  style={({ pressed }) => [
                    styles.socialBtn,
                    pressed && { opacity: 0.8 },
                    isLoading && { opacity: 0.6 },
                    { marginTop: 12 },
                  ]}
                  onPress={handleAppleLogin}
                  disabled={isLoading}
                >
                  <FontAwesome name="apple" size={20} color="#FFFFFF" />
                  <Text style={styles.socialBtnText}>Entrar com Apple</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerTextNormal}>Ainda não tem conta? </Text>
            <Pressable onPress={() => router.push("/auth/signup" as any)} disabled={isLoading}>
              <Text style={styles.footerTextLink}>Criar conta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  logoContainer: {
    marginTop: 10,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 200,
    height: 200 / 3.32,
    resizeMode: "contain",
  },
  parrotContainer: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  parrotImage: {
    width: 260,
    height: 260 / 1.86,
    resizeMode: "contain",
  },
  card: {
    width: "100%",
    backgroundColor: "#080808",
    borderWidth: 1,
    borderColor: "#151515",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    backgroundColor: "#040404",
    borderWidth: 1,
    borderColor: "#181818",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  inputIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#FFFFFF",
    fontSize: 15,
    padding: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    color: "#84cc16",
    fontSize: 13,
    fontWeight: "600",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#270808",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#4A1010",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    flex: 1,
  },
  enterBtn: {
    height: 54,
    backgroundColor: "#84cc16",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#84cc16",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  enterBtnText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#161616",
  },
  dividerText: {
    color: "#555555",
    fontSize: 12,
    fontWeight: "500",
  },
  socialContainer: {
    width: "100%",
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderWidth: 1,
    borderColor: "#181818",
    backgroundColor: "#040404",
    borderRadius: 12,
    gap: 12,
  },
  socialBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 10,
  },
  footerTextNormal: {
    color: "#777777",
    fontSize: 14,
  },
  footerTextLink: {
    color: "#84cc16",
    fontSize: 14,
    fontWeight: "700",
  },
});
