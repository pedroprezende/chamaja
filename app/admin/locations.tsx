import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import { Commerce, db } from "@/lib/database-schema";

export default function AdminLocationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Commerce | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP");
  const [address, setAddress] = useState("");

  // Mock data
  const [locations, setLocations] = useState<Commerce[]>([
    {
      id: "1",
      name: "São Paulo - Centro",
      city: "São Paulo",
      state: "SP",
      address: "Avenida Paulista, 1000",
      latitude: -23.5505,
      longitude: -46.6333,
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15",
      isActive: true,
    },
    {
      id: "2",
      name: "São Paulo - Vila Madalena",
      city: "São Paulo",
      state: "SP",
      address: "Rua Aspicuelta, 500",
      latitude: -23.5595,
      longitude: -46.6833,
      createdAt: "2024-02-20",
      updatedAt: "2024-02-20",
      isActive: true,
    },
    {
      id: "3",
      name: "Rio de Janeiro - Copacabana",
      city: "Rio de Janeiro",
      state: "RJ",
      address: "Avenida Atlântica, 1500",
      latitude: -22.9829,
      longitude: -43.1899,
      createdAt: "2024-03-10",
      updatedAt: "2024-03-10",
      isActive: true,
    },
  ]);

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingLocation(null);
    setName("");
    setCity("");
    setState("SP");
    setAddress("");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (location: Commerce) => {
    setEditingLocation(location);
    setName(location.name);
    setCity(location.city);
    setState(location.state);
    setAddress(location.address || "");
    setShowAddModal(true);
  };

  const handleSaveLocation = () => {
    if (!name || !city || !state) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    if (editingLocation) {
      // Editar
      setLocations(
        locations.map((loc) =>
          loc.id === editingLocation.id
            ? {
                ...loc,
                name,
                city,
                state,
                address,
                updatedAt: new Date().toISOString(),
              }
            : loc
        )
      );
      Alert.alert("Sucesso", "Local atualizado com sucesso!");
    } else {
      // Adicionar novo
      const newLocation: Commerce = {
        id: Date.now().toString(),
        name,
        city,
        state,
        address,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };
      setLocations([...locations, newLocation]);
      Alert.alert("Sucesso", "Local adicionado com sucesso!");
    }

    setShowAddModal(false);
  };

  const handleDeleteLocation = (locationId: string) => {
    Alert.alert("Deletar Local", "Tem certeza que deseja deletar este local?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: () => {
          setLocations(locations.filter((loc) => loc.id !== locationId));
          Alert.alert("Sucesso", "Local deletado com sucesso!");
        },
      },
    ]);
  };

  return (
    <ScreenContainer containerClassName="bg-[#111827]">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#E5E7EB" />
        </Pressable>
        <Text style={styles.headerTitle}>Gerenciar Locais</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
          onPress={handleOpenAddModal}
        >
          <MaterialIcons name="add" size={24} color="#25D366" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou cidade..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Locations List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.listContainer}>
        {filteredLocations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="location-off" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>Nenhum local encontrado</Text>
          </View>
        ) : (
          <View style={styles.locationsList}>
            {filteredLocations.map((location) => (
              <View key={location.id} style={styles.locationCard}>
                <View style={styles.locationInfo}>
                  <View style={styles.locationIconBox}>
                    <MaterialIcons name="location-on" size={24} color="#25D366" />
                  </View>
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationName}>{location.name}</Text>
                    <Text style={styles.locationCity}>
                      {location.city}, {location.state}
                    </Text>
                    {location.address && (
                      <Text style={styles.locationAddress}>{location.address}</Text>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleOpenEditModal(location)}
                  >
                    <MaterialIcons name="edit" size={20} color="#3B82F6" />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleDeleteLocation(location.id)}
                  >
                    <MaterialIcons name="delete" size={20} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={() => setShowAddModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#E5E7EB" />
              </Pressable>
              <Text style={styles.modalTitle}>
                {editingLocation ? "Editar Local" : "Adicionar Local"}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Modal Form */}
            <ScrollView style={styles.modalForm}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Local *</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="location-on" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: São Paulo - Centro"
                    placeholderTextColor="#6B7280"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* City Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cidade *</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="location-city" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: São Paulo"
                    placeholderTextColor="#6B7280"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
              </View>

              {/* State Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Estado *</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="public" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: SP"
                    placeholderTextColor="#6B7280"
                    value={state}
                    onChangeText={setState}
                    maxLength={2}
                  />
                </View>
              </View>

              {/* Address Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Endereço</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="home" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Avenida Paulista, 1000"
                    placeholderTextColor="#6B7280"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleSaveLocation}
              >
                <Text style={styles.saveBtnText}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stats Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Total de locais: <Text style={styles.footerValue}>{locations.length}</Text>
        </Text>
      </View>
    </ScreenContainer>
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
    borderBottomColor: "#374151",
  },
  backBtn: {
    padding: 8,
  },
  addBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#374151",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#FFFFFF",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  locationsList: {
    gap: 12,
    paddingVertical: 16,
  },
  locationCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationInfo: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  locationIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(37, 211, 102, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E5E7EB",
    marginBottom: 2,
  },
  locationCity: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 11,
    color: "#6B7280",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#374151",
    backgroundColor: "#1F2937",
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  footerValue: {
    fontWeight: "700",
    color: "#25D366",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalForm: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#374151",
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#FFFFFF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#374151",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#25D366",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
});
