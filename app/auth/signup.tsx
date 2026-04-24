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
import { useAuth } from "@/lib/auth-context";

export default function SignupScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      await auth.signUpWithEmail(email, password, name);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível criar a conta");
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
          <Text style={styles.title}>Criar Conta</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome completo</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Seu nome"
                placeholderTextColor="#6B7280"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Email Input */}
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

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={18}
                  color="#9CA3AF"
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar senha</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Confirme sua senha"
                placeholderTextColor="#6B7280"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Sign Up Button */}
          <Pressable
            style={({ pressed }) => [
              styles.signupButton,
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
            <Text style={styles.loginText}>Já tem conta? </Text>
            <Pressable onPress={() => router.back()} disabled={isLoading}>
              <Text style={styles.loginLink}>Faça login</Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade
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
    gap: 20,
    flex: 1,
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
  signupButton: {
    backgroundColor: "#25D366",
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
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#25D366",
  },
  footer: {
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },
});
