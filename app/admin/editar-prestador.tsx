import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  Image,
  Platform,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";

const CATEGORIES = [
  "Eletricista", "Encanador", "Pedreiro", "Pintor", "Diarista",
  "Barbearia", "Cabeleireiro", "Mecânico", "Alimentação", "Técnico em TI",
];

const ADDRESSES = [
  "Centro, Bragança Paulista - SP",
  "Jd. América, Bragança Paulista - SP",
  "Vila Nova, Bragança Paulista - SP",
  "Atibaia - SP",
];

export default function EditarPrestador() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState("Elétrica do Zé");
  const [category, setCategory] = useState("Eletricista");
  const [description, setDescription] = useState("Serviços elétricos em geral.\nResidencial, comercial e predial.");
  const [address, setAddress] = useState("Centro, Bragança Paulista - SP");
  const [isActive, setIsActive] = useState(true);
  const [whatsapp, setWhatsapp] = useState("(11) 99999-9999");
  const [showDistance, setShowDistance] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.back();
    }, 1200);
  };

  const handleDelete = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Remover este prestador? Esta ação não pode ser desfeita.")) {
        router.back();
      }
    } else {
      Alert.alert("Remover prestador", "Esta ação não pode ser desfeita.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: () => router.back() },
      ]);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Editar Prestador</Text>
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&q=80" }}
              style={styles.avatar}
            />
            <Pressable style={styles.cameraBtn}>
              <MaterialIcons name="camera-alt" size={16} color="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* Fields */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Nome do prestador</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Categoria</Text>
          <Pressable
            style={styles.selectField}
            onPress={() => { setShowCategoryPicker(!showCategoryPicker); setShowAddressPicker(false); }}
          >
            <Text style={styles.selectText}>{category}</Text>
            <MaterialIcons
              name={showCategoryPicker ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={20}
              color="#6B7280"
            />
          </Pressable>
          {showCategoryPicker && (
            <View style={styles.pickerDropdown}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  style={({ pressed }) => [styles.pickerOption, pressed && { backgroundColor: "#F0FDF4" }, c === category && styles.pickerOptionActive]}
                  onPress={() => { setCategory(c); setShowCategoryPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, c === category && { color: "#25D366", fontWeight: "700" }]}>{c}</Text>
                  {c === category && <MaterialIcons name="check" size={16} color="#25D366" />}
                </Pressable>
              ))}
            </View>
          )}

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Descrição</Text>
          <TextInput
            style={[styles.fieldInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Endereço</Text>
          <Pressable
            style={styles.selectField}
            onPress={() => { setShowAddressPicker(!showAddressPicker); setShowCategoryPicker(false); }}
          >
            <Text style={styles.selectText}>{address}</Text>
            <MaterialIcons
              name={showAddressPicker ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={20}
              color="#6B7280"
            />
          </Pressable>
          {showAddressPicker && (
            <View style={styles.pickerDropdown}>
              {ADDRESSES.map((a) => (
                <Pressable
                  key={a}
                  style={({ pressed }) => [styles.pickerOption, pressed && { backgroundColor: "#F0FDF4" }, a === address && styles.pickerOptionActive]}
                  onPress={() => { setAddress(a); setShowAddressPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, a === address && { color: "#25D366", fontWeight: "700" }]}>{a}</Text>
                  {a === address && <MaterialIcons name="check" size={16} color="#25D366" />}
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Status</Text>
            <View style={styles.switchRight}>
              <Text style={[styles.switchLabel, { color: isActive ? "#25D366" : "#9CA3AF" }]}>
                {isActive ? "Ativo" : "Inativo"}
              </Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                thumbColor={isActive ? "#25D366" : "#D1D5DB"}
              />
            </View>
          </View>
        </View>

        {/* Contact */}
        <Text style={styles.sectionTitle}>Informações de contato</Text>
        <View style={styles.card}>
          <View style={styles.contactRow}>
            <View style={styles.waIcon}>
              <MaterialIcons name="chat" size={18} color="#25D366" />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <TextInput
              style={styles.contactInput}
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={[styles.switchRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" }]}>
            <Text style={styles.fieldLabel}>Mostrar distância</Text>
            <View style={styles.switchRight}>
              <Text style={[styles.switchLabel, { color: showDistance ? "#374151" : "#9CA3AF" }]}>
                {showDistance ? "Mostrar no app" : "Oculto"}
              </Text>
              <Switch
                value={showDistance}
                onValueChange={setShowDistance}
                trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
                thumbColor={showDistance ? "#25D366" : "#D1D5DB"}
              />
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saved && styles.saveBtnSaved]}
          onPress={handleSave}
        >
          <MaterialIcons name={saved ? "check-circle" : "save"} size={20} color="#FFF" />
          <Text style={styles.saveBtnText}>{saved ? "Salvo!" : "Salvar alterações"}</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827" },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#FEF2F2",
    alignItems: "center", justifyContent: "center",
  },
  content: { padding: 16, gap: 0 },
  avatarSection: { alignItems: "center", marginBottom: 20 },
  avatarWrap: { position: "relative" },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#F3F4F6" },
  cameraBtn: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFF",
  },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#F3F4F6", marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 8, marginTop: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  fieldInput: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: "#111827", backgroundColor: "#F9FAFB",
    outlineStyle: "none",
  } as any,
  textArea: { minHeight: 80, textAlignVertical: "top", paddingTop: 10 },
  selectField: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: "#F9FAFB",
  },
  selectText: { fontSize: 14, color: "#111827" },
  pickerDropdown: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, marginTop: 4,
    backgroundColor: "#FFFFFF", overflow: "hidden",
  },
  pickerOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  pickerOptionActive: { backgroundColor: "#F0FDF4" },
  pickerOptionText: { fontSize: 14, color: "#374151" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  switchRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  switchLabel: { fontSize: 13, fontWeight: "600" },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  waIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
  },
  contactLabel: { fontSize: 13, fontWeight: "600", color: "#374151", width: 70 },
  contactInput: {
    flex: 1, fontSize: 14, color: "#111827",
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#F9FAFB",
    outlineStyle: "none",
  } as any,
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#25D366", borderRadius: 14, paddingVertical: 15, gap: 8,
    marginTop: 8,
  },
  saveBtnSaved: { backgroundColor: "#16A34A" },
  saveBtnText: { fontSize: 16, fontWeight: "800", color: "#FFF" },
});
