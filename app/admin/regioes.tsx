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
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { regionsDB, type DbRegion } from "@/lib/db";

export default function RegioesAdmin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [regions, setRegions] = useState<DbRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newState, setNewState] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await regionsDB.list();
    setRegions(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = regions.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (region: DbRegion) => {
    await regionsDB.update(region.id, { is_active: !region.is_active });
    loadData();
  };

  const handleDelete = (region: DbRegion) => {
    const doDelete = async () => {
      const result = await regionsDB.delete(region.id);
      if (result.error) { alert(result.error); return; }
      loadData();
    };
    if (Platform.OS === "web") {
      if (window.confirm(`Remover "${region.name}"?`)) doDelete();
    } else {
      Alert.alert("Remover região", `Remover "${region.name}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const result = await regionsDB.insert({ name: newName, state: newState });
    setSaving(false);
    if (result.error) { alert(result.error); return; }
    setNewName("");
    setNewState("");
    setShowAdd(false);
    loadData();
  };

  const formatUpdated = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return `hoje, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      if (diffDays === 1) return `ontem, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
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

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#25D366" size="large" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          <Text style={styles.listHint}>{filtered.length} região{filtered.length !== 1 ? "ões" : ""} encontrada{filtered.length !== 1 ? "s" : ""}</Text>
          {filtered.map((region) => (
            <View key={region.id} style={styles.regionCard}>
              <View style={styles.regionTop}>
                <View style={styles.regionIconBox}>
                  <MaterialIcons name="location-on" size={20} color="#25D366" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.regionNameRow}>
                    <Text style={styles.regionName}>{region.name}</Text>
                    <Text style={styles.regionState}>{region.state}</Text>
                    <View style={[styles.statusBadge, !region.is_active && styles.statusInactive]}>
                      <Text style={[styles.statusText, !region.is_active && styles.statusTextInactive]}>
                        {region.is_active ? "Ativa" : "Inativa"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.regionMeta}>
                    {region.providers_count} prestadores • {region.ads_count} anúncios
                  </Text>
                  <Text style={styles.regionUpdated}>
                    Atualizada: {formatUpdated(region.updated_at)}
                  </Text>
                </View>
              </View>
              <View style={styles.regionActions}>
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => handleToggle(region)}
                >
                  <MaterialIcons
                    name={region.is_active ? "pause-circle-outline" : "play-circle-outline"}
                    size={16}
                    color={region.is_active ? "#EA580C" : "#25D366"}
                  />
                  <Text style={[styles.actionBtnText, { color: region.is_active ? "#EA580C" : "#25D366" }]}>
                    {region.is_active ? "Pausar" : "Ativar"}
                  </Text>
                </Pressable>
                <View style={styles.actionDivider} />
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => handleDelete(region)}
                >
                  <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
                  <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Remover</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {filtered.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <MaterialIcons name="location-off" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {search ? `Nenhum resultado para "${search}"` : "Nenhuma região ainda"}
              </Text>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <AdminTabBar />

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Região</Text>
              <Pressable onPress={() => { setShowAdd(false); setNewName(""); setNewState(""); }}>
                <MaterialIcons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Nome da cidade</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Ex: Jundiaí"
              placeholderTextColor="#9CA3AF"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Estado (UF)</Text>
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
              <Pressable
                style={[styles.modalBtn, styles.modalBtnConfirm, (!newName.trim() || saving) && { opacity: 0.5 }]}
                onPress={handleAdd}
                disabled={!newName.trim() || saving}
              >
                {saving
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.modalBtnConfirmText}>Adicionar</Text>
                }
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
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#25D366", alignItems: "center", justifyContent: "center" },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    marginHorizontal: 16, marginTop: 12, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", outlineStyle: "none" } as any,
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#6B7280", fontSize: 14 },
  list: { padding: 16, gap: 10 },
  listHint: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
  regionCard: { backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#F3F4F6", overflow: "hidden" },
  regionTop: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12 },
  regionIconBox: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", marginTop: 2 },
  regionNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" },
  regionName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  regionState: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" },
  statusBadge: { backgroundColor: "#DCFCE7", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusInactive: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 11, fontWeight: "700", color: "#15803D" },
  statusTextInactive: { color: "#DC2626" },
  regionMeta: { fontSize: 12, color: "#6B7280" },
  regionUpdated: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  regionActions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  actionDivider: { width: 1, backgroundColor: "#F3F4F6" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, gap: 5 },
  actionBtnText: { fontSize: 12, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: "700", color: "#9CA3AF", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 10 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  fieldInput: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111827",
    backgroundColor: "#F9FAFB", outlineStyle: "none",
  } as any,
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 10 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  modalBtnCancel: { backgroundColor: "#F3F4F6" },
  modalBtnCancelText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  modalBtnConfirm: { backgroundColor: "#25D366" },
  modalBtnConfirmText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
