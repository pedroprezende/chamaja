import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { ScreenContainer } from "@/components/screen-container";
import { createProfessional, subcategoriesByCategory } from "@/data/mock";

const allSpecialties = Object.values(subcategoriesByCategory).flat();

export default function RegisterProfessionalScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    neighborhood: "",
    phone: "",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    description: "",
  });

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, avatar: result.assets[0].uri });
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Erro", "Digite seu nome");
      return false;
    }
    if (selectedIds.length === 0) {
      Alert.alert("Erro", "Selecione pelo menos uma especialidade");
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert("Erro", "Digite sua cidade");
      return false;
    }
    if (!formData.neighborhood.trim()) {
      Alert.alert("Erro", "Digite seu bairro");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      Alert.alert("Erro", "Digite um WhatsApp válido (mín. 10 dígitos)");
      return false;
    }
    if (!formData.description.trim() || formData.description.length < 20) {
      Alert.alert("Erro", "Descrição deve ter pelo menos 20 caracteres");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Concatenar categorias para o mock/legacy DB
      const categoryNames = allSpecialties
        .filter(c => selectedIds.includes(c.id))
        .map(c => c.name.replace("\n", " "))
        .join(", ");

      const newProfessional = createProfessional({
        name: formData.name,
        category: categoryNames,
        city: formData.city,
        neighborhood: formData.neighborhood,
        phone: formData.phone,
        avatar: formData.avatar,
        description: formData.description,
      });

      Alert.alert(
        "Sucesso!",
        "Seu perfil foi criado! Você pode agora atualizar para PREMIUM para ter mais visibilidade.",
        [
          {
            text: "Explorar Planos",
            onPress: () => {
              router.push(`/professional-plans/${newProfessional.id}` as any);
            },
          },
          {
            text: "Voltar",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar o perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoriesText = selectedIds.length > 0
    ? allSpecialties
        .filter((c) => selectedIds.includes(c.id))
        .map((c) => c.name.replace("\n", " "))
        .join(", ")
    : "Selecione suas especialidades";

  const toggleCategory = (id: string) => {
    setSelectedSpecialties(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const selectedIds = Object.keys(selectedSpecialties).filter(id => selectedSpecialties[id]);

  return (
    <ScreenContainer containerClassName="bg-[#F5F5F5]" className="">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#11181C" />
          </Pressable>
          <Text style={styles.title}>Cadastro de Prestador</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Pressable
              style={({ pressed }) => [styles.avatarButton, pressed && { opacity: 0.8 }]}
              onPress={handlePickImage}
            >
              <Image source={{ uri: formData.avatar }} style={styles.avatar} />
              <View style={styles.cameraIcon}>
                <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
              </View>
            </Pressable>
            <Text style={styles.avatarLabel}>Foto de Perfil</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu nome"
                placeholderTextColor="#9CA3AF"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                editable={!loading}
              />
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Especialidades (selecione várias se desejar)</Text>
              <Pressable
                style={styles.selectButton}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    formData.categories.length === 0 && { color: "#9CA3AF" },
                  ]}
                  numberOfLines={1}
                >
                  {selectedCategoriesText}
                </Text>
                <MaterialIcons
                  name={showCategoryPicker ? "expand-less" : "expand-more"}
                  size={24}
                  color="#9CA3AF"
                />
              </Pressable>

              {showCategoryPicker && (
                <View style={styles.categoryList}>
                  {allSpecialties.map((cat) => {
                    const isSelected = !!selectedSpecialties[cat.id];
                    return (
                      <Pressable
                        key={cat.id}
                        style={({ pressed }) => [
                          styles.categoryItem,
                          pressed && { backgroundColor: "#F0FDF4" },
                          isSelected && { 
                            backgroundColor: "#DCFCE7",
                            borderLeftWidth: 4,
                            borderLeftColor: "#25D366" 
                          },
                        ]}
                        onPress={() => toggleCategory(cat.id)}
                        hitSlop={8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text
                            style={[
                              styles.categoryItemText,
                              isSelected && {
                                color: "#15803D",
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {cat.name.replace("\n", " ")}
                          </Text>
                          {isSelected && (
                            <MaterialIcons name="check-circle" size={20} color="#25D366" />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* City */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Cidade</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: São Paulo"
                placeholderTextColor="#9CA3AF"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                editable={!loading}
              />
            </View>

            {/* Neighborhood */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bairro</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Centro"
                placeholderTextColor="#9CA3AF"
                value={formData.neighborhood}
                onChangeText={(text) => setFormData({ ...formData, neighborhood: text })}
                editable={!loading}
              />
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>WhatsApp</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 5511999999999"
                placeholderTextColor="#9CA3AF"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Descrição (mín. 20 caracteres)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva seus serviços e experiência..."
                placeholderTextColor="#9CA3AF"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
                maxLength={500}
              />
              <Text style={styles.charCount}>
                {formData.description.length}/500
              </Text>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={20} color="#25D366" />
            <Text style={styles.infoText}>
              Seu perfil será criado como FREE. Você pode atualizar para PREMIUM para ter mais visibilidade!
            </Text>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Register Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.registerButton,
            pressed && { opacity: 0.85 },
            loading && { opacity: 0.6 },
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.registerButtonText}>Criar Perfil</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#11181C",
    flex: 1,
    textAlign: "center",
  },
  content: {
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarButton: {
    position: "relative",
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E5E7EB",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#25D366",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarLabel: {
    fontSize: 12,
    color: "#687076",
    fontWeight: "600",
  },
  form: {
    gap: 16,
    marginBottom: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#11181C",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#11181C",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    textAlignVertical: "top",
    paddingTop: 10,
  },
  charCount: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
  },
  selectButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectButtonText: {
    fontSize: 14,
    color: "#11181C",
    flex: 1,
  },
  categoryList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  categoryItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  categoryItemText: {
    fontSize: 14,
    color: "#11181C",
  },
  infoBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#25D366",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: "#25D366",
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  registerButton: {
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
