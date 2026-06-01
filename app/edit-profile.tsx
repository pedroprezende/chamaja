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
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";
import { storage } from "@/lib/storage";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [avatarUri, setAvatarUri] = useState(user?.avatar || "");
  const [saving, setSaving] = useState(false);

  const displayAvatar =
    avatarUri ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80";

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso à galeria para alterar sua foto de perfil."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Atenção", "O nome não pode estar vazio.");
      return;
    }
    setSaving(true);
    try {
      let finalAvatar = avatarUri;
      if (avatarUri && !avatarUri.startsWith("http")) {
        const uploadedUrl = await storage.uploadImage(avatarUri);
        if (uploadedUrl) {
          finalAvatar = uploadedUrl;
        }
      }
      await updateProfile(name.trim(), finalAvatar || undefined);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Perfil atualizado", "Suas informações foram salvas com sucesso.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Erro", e.message || "Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <Pressable
            style={({ pressed }) => [styles.saveHeaderBtn, pressed && { opacity: 0.75 }, saving && { opacity: 0.5 }]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#25D366" />
            ) : (
              <Text style={styles.saveHeaderText}>Salvar</Text>
            )}
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Pressable
              style={({ pressed }) => [styles.avatarWrapper, pressed && { opacity: 0.85 }]}
              onPress={handlePickImage}
            >
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
              <View style={styles.avatarOverlay}>
                <MaterialIcons name="photo-camera" size={22} color="#FFFFFF" />
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
          </View>

          {/* Formulário */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Informações pessoais</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nome completo</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                  onSubmitEditing={handleSaveProfile}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>E-mail</Text>
              <View style={[styles.inputWrapper, styles.inputDisabled]}>
                <MaterialIcons name="email" size={20} color="#D1D5DB" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: "#9CA3AF" }]}
                  value={user?.email || ""}
                  editable={false}
                  placeholder="E-mail"
                  placeholderTextColor="#D1D5DB"
                />
                <MaterialIcons name="lock-outline" size={16} color="#D1D5DB" />
              </View>
              <Text style={styles.fieldHint}>O e-mail não pode ser alterado.</Text>
            </View>
          </View>

          {/* Botão salvar */}
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.85 },
              saving && { opacity: 0.6 },
            ]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Salvar alterações</Text>
              </>
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  saveHeaderBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  saveHeaderText: { fontSize: 15, fontWeight: "600", color: "#25D366" },
  scrollContent: { paddingBottom: 32 },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#E5E7EB",
    borderWidth: 3, borderColor: "#FFFFFF",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0, right: 0,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFFFFF",
  },
  avatarHint: { marginTop: 10, fontSize: 13, color: "#6B7280" },
  formSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#6B7280", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5, borderColor: "#E5E7EB",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: "#FAFAFA", gap: 8,
  },
  inputDisabled: { backgroundColor: "#F9FAFB", borderColor: "#F3F4F6" },
  inputIcon: {},
  input: { flex: 1, fontSize: 15, color: "#111827" },
  fieldHint: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: "#25D366",
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
