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

import { ScreenContainer } from "@/components/screen-container";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/use-colors";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleUpdatePassword = async () => {
    try {
      if (!password || !confirmPassword) {
        Alert.alert("Erro", "Todos os campos são obrigatórios");
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert("Erro", "As senhas não coincidem");
        return;
      }

      if (password.length < 6) {
        Alert.alert("Erro", "A senha deve ter no mínimo 6 caracteres");
        return;
      }

      setIsLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      
      setIsSuccess(true);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível atualizar sua senha");
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
            onPress={() => router.replace("/auth/login" as any)}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Nova Senha</Text>
        </View>

        {isSuccess ? (
          // Success State
          <View style={styles.successContainer}>
            <View style={[styles.successIconBox, { backgroundColor: colors.success + "20" }]}>
              <MaterialIcons name="check-circle" size={64} color={colors.success || "#22C55E"} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Senha atualizada!</Text>
            <Text style={[styles.successMessage, { color: colors.muted }]}>
              Sua senha foi redefinida com sucesso. Agora você já pode acessar o aplicativo normalmente.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.backToLoginBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 }
              ]}
              onPress={() => router.replace("/" as any)}
            >
              <Text style={styles.backToLoginText}>Ir para o Início</Text>
            </Pressable>
          </View>
        ) : (
          // Form State
          <View style={styles.form}>
            <Text style={[styles.description, { color: colors.muted }]}>
              Digite e confirme a sua nova senha de acesso abaixo para redefini-la com segurança.
            </Text>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Nova Senha</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="lock-outline" size={18} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
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

            {/* Confirm New Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Confirmar Nova Senha</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="lock-outline" size={18} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Confirme sua nova senha"
                  placeholderTextColor={colors.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  ref={confirmPasswordRef}
                  returnKeyType="go"
                  onSubmitEditing={handleUpdatePassword}
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
              onPress={handleUpdatePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.resetButtonText}>Salvar Senha</Text>
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
