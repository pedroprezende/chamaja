import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { ScreenContainer } from "@/components/screen-container";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);

  const handleSendVerificationCode = async () => {
    if (!email) {
      Alert.alert("Erro", "Preencha o e-mail");
      return;
    }

    setIsLoading(true);
    try {
      // Mock: simular envio de código
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Código de verificação enviado:", code);
      Alert.alert(
        "Código Enviado",
        `Um código de verificação foi enviado para ${email}\n\nCódigo para teste: ${code}`
      );
      setShowVerification(true);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível enviar o código");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode) {
      Alert.alert("Erro", "Digite o código de verificação");
      return;
    }

    setIsLoading(true);
    try {
      // Mock: simular verificação
      if (verificationCode.length === 6) {
        setEmailVerified(true);
        Alert.alert("Sucesso", "E-mail verificado com sucesso!");
        setShowVerification(false);
        setVerificationCode("");
      } else {
        Alert.alert("Erro", "Código inválido");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name || !email || !phone) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    if (!emailVerified) {
      Alert.alert("Erro", "Verifique seu e-mail antes de salvar");
      return;
    }

    setIsLoading(true);
    try {
      // Mock: simular salvamento
      console.log("Perfil atualizado:", { name, email, phone });
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar o perfil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScreenContainer containerClassName="bg-white">
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <Pressable style={styles.changeAvatarBtn}>
              <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor="#D1D5DB"
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <View style={styles.emailLabelRow}>
                <Text style={styles.label}>E-mail</Text>
                {emailVerified && (
                  <View style={styles.verifiedBadge}>
                    <MaterialIcons name="check-circle" size={14} color="#25D366" />
                    <Text style={styles.verifiedText}>Verificado</Text>
                  </View>
                )}
              </View>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#D1D5DB"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading && !emailVerified}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {!emailVerified && (
                <Pressable
                  style={({ pressed }) => [
                    styles.verifyBtn,
                    pressed && { opacity: 0.8 },
                    isLoading && { opacity: 0.6 },
                  ]}
                  onPress={handleSendVerificationCode}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="mail-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.verifyBtnText}>Enviar Código</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>

            {/* Email Verification */}
            {showVerification && !emailVerified && (
              <View style={styles.verificationBox}>
                <Text style={styles.verificationTitle}>Verificar E-mail</Text>
                <Text style={styles.verificationSubtitle}>
                  Digite o código de 6 dígitos enviado para {email}
                </Text>

                <TextInput
                  style={styles.verificationInput}
                  placeholder="000000"
                  placeholderTextColor="#D1D5DB"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLoading}
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.confirmVerifyBtn,
                    pressed && { opacity: 0.8 },
                    isLoading && { opacity: 0.6 },
                  ]}
                  onPress={handleVerifyEmail}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmVerifyBtnText}>Confirmar</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="phone" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor="#D1D5DB"
                  value={phone}
                  onChangeText={setPhone}
                  editable={!isLoading}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && { opacity: 0.9 },
                isLoading && { opacity: 0.6 },
              ]}
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="save" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Salvar Alterações</Text>
                </>
              )}
            </Pressable>

            {/* Delete Account */}
            <Pressable
              style={({ pressed }) => [
                styles.deleteBtn,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => {
                Alert.alert(
                  "Deletar Conta",
                  "Esta ação é irreversível. Tem certeza?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Deletar",
                      style: "destructive",
                      onPress: () => {
                        Alert.alert("Conta deletada", "Sua conta foi removida");
                        router.replace("/auth/login" as any);
                      },
                    },
                  ]
                );
              }}
            >
              <MaterialIcons name="delete" size={18} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Deletar Conta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 24,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  changeAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  form: {
    gap: 20,
    paddingBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  emailLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(37, 211, 102, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#25D366",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  verifyBtn: {
    backgroundColor: "#25D366",
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  verifyBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  verificationBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    gap: 12,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#15803D",
  },
  verificationSubtitle: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
  },
  verificationInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  confirmVerifyBtn: {
    backgroundColor: "#25D366",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmVerifyBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  saveBtn: {
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  deleteBtn: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
});
