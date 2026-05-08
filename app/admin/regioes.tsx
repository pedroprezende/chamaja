import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { AdminTabBar } from "@/components/admin/AdminTabBar";

interface Region {
  id: string;
  name: string;
  state: string;
  providers: number;
  ads: number;
  isActive: boolean;
  updatedAt: string;
}

const INITIAL_REGIONS: Region[] = [
  { id: "1", name: "Bragança Paulista", state: "SP", providers: 128, ads: 12, isActive: true, updatedAt: "hoje, 08:30" },
  { id: "2", name: "Atibaia", state: "SP", providers: 98, ads: 8, isActive: true, updatedAt: "ontem, 18:20" },
  { id: "3", name: "Extrema", state: "MG", providers: 45, ads: 4, isActive: true, updatedAt: "ontem, 16:10" },
  { id: "4", name: "Itatiba", state: "SP", providers: 62, ads: 6, isActive: true, updatedAt: "22/05, 11:40" },
  { id: "5", name: "Camanducaia", state: "MG", providers: 28, ads: 3, isActive: false, updatedAt: "21/05, 09:15" },
  { id: "6", name: "Piracaia", state: "SP", providers: 33, ads: 2, isActive: true, updatedAt: "20/05, 14:00" },
];

export default function RegioesAdmin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>(INITIAL_REGIONS);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newState, setNewState] = useState("");

  const filtered = regions.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (id: string) => {
    setRegions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleDelete = (id: string) => {
    const doDelete = () => setRegions((prev) => prev.filter((r) => r.id !== id));
    if (Platform.OS === "web") {
      if (window.confirm("Remover esta região?")) doDelete();
    } else {
      Alert.alert("Remover região", "Tem certeza?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const reg: Region = {
      id: Date.now().toString(),
      name: newName.trim(),
      state: newState.trim() || "SP",
      providers: 0,
      ads: 0,
      isActive: true,
      updatedAt: "agora",
    };
    setRegions((prev) => [reg, ...prev]);
    setNewName("");
    setNewState("");
    setShowAdd(false);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.push("/admin/dashboard-admin" as any)}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Regiões</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <MaterialIcons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar região..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <MaterialIcons name="close" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filtered.map((region) => (
          <Pressable
            key={region.id}
            style={({ pressed }) => [styles.regionCard, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.regionTop}>
              <View style={styles.regionIconBox}>
                <MaterialIcons name="location-on" size={20} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.regionNameRow}>
                  <Text style={styles.regionName}>{region.name}</Text>
                  <View style={[styles.statusBadge, !region.isActive && styles.statusInactive]}>
                    <Text style={[styles.statusText, !region.isActive && styles.statusTextInactive]}>
                      {region.isActive ? "Ativa" : "Inativa"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.regionMeta}>
                  {region.providers} prestadores • {region.ads} anúncios
                </Text>
                <Text style={styles.regionUpdated}>Última atualização: {region.updatedAt}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
            </View>

            <View style={styles.regionActions}>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                onPress={() => handleToggle(region.id)}
              >
                <MaterialIcons
                  name={region.isActive ? "pause-circle-outline" : "play-circle-outline"}
                  size={16}
                  color={region.isActive ? "#EA580C" : "#25D366"}
                />
                <Text style={[styles.actionBtnText, { color: region.isActive ? "#EA580C" : "#25D366" }]}>
                  {region.isActive ? "Pausar" : "Ativar"}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                onPress={() => handleDelete(region.id)}
              >
                <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Remover</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      <AdminTabBar />

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Região</Text>
            <Text style={styles.fieldLabel}>Nome da cidade</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Ex: Jundiaí"
              placeholderTextColor="#9CA3AF"
              value={newName}
              onChangeText={setNewName}
            />
            <Text style={styles.fieldLabel}>Estado (UF)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Ex: SP"
              placeholderTextColor="#9CA3AF"
              value={newState}
              onChangeText={setNewState}
              maxLength={2}
              autoCapitalize="characters"
            />
            <View style={styles.modalBtns}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => { setShowAdd(false); setNewName(""); setNewState(""); }}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={handleAdd}>
                <Text style={styles.modalBtnConfirmText}>Adicionar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#25D366",
    alignItems: "center", justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    marginHorizontal: 16, marginTop: 12, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", outlineStyle: "none" } as any,
  list: { padding: 16, gap: 10 },
  regionCard: {
    backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#F3F4F6", overflow: "hidden",
  },
  regionTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  regionIconBox: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
  },
  regionNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  regionName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  statusBadge: { backgroundColor: "#DCFCE7", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusInactive: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 11, fontWeight: "700", color: "#15803D" },
  statusTextInactive: { color: "#DC2626" },
  regionMeta: { fontSize: 12, color: "#6B7280" },
  regionUpdated: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  regionActions: {
    flexDirection: "row", borderTopWidth: 1, borderTopColor: "#F3F4F6",
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 10, gap: 5,
  },
  actionBtnText: { fontSize: 12, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  fieldInput: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: "#111827", backgroundColor: "#F9FAFB", outlineStyle: "none",
  } as any,
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  modalBtnCancel: { backgroundColor: "#F3F4F6" },
  modalBtnCancelText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  modalBtnConfirm: { backgroundColor: "#25D366" },
  modalBtnConfirmText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
