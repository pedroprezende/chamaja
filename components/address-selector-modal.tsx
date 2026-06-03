import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocation } from "@/lib/location-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth-context";

interface AddressSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface SavedAddress {
  id: string;
  label: string; // e.g. "Casa", "Trabalho", "Mãe"
  addressName: string;
  latitude: number;
  longitude: number;
  neighborhood?: string;
  city?: string;
}

interface GeocodedAddress {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
  neighborhood?: string;
  city?: string;
}

export default function AddressSelectorModal({ visible, onClose }: AddressSelectorModalProps) {
  const { coords, addressName, updateLocation, useGpsLocation, loading: locationLoading } = useLocation();
  const { user } = useAuth();
  
  const userId = user?.id || "guest";
  const storageKey = `@chamaja_saved_user_addresses_${userId}`;

  const [addressInput, setAddressInput] = useState("");
  const [results, setResults] = useState<GeocodedAddress[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  
  const [selectedSearchAddress, setSelectedSearchAddress] = useState<GeocodedAddress | null>(null);
  const [customLabel, setCustomLabel] = useState("");
  const [activeLabelType, setActiveLabelType] = useState<"casa" | "trabalho" | "outro">("casa");
  const [saving, setSaving] = useState(false);

  // Load saved addresses on open/mount
  const loadSavedAddresses = async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        setSavedAddresses(JSON.parse(raw));
      } else {
        setSavedAddresses([]);
      }
    } catch (e) {
      console.warn("Failed to load saved addresses:", e);
    }
  };

  useEffect(() => {
    if (visible) {
      loadSavedAddresses();
      setAddressInput("");
      setResults([]);
      setSelectedSearchAddress(null);
      setErrorMsg(null);
      setSaving(false);
    }
  }, [visible]);

  // Searches addresses using the Nominatim API
  const handleSearch = async () => {
    if (!addressInput.trim()) return;
    setSearching(true);
    setErrorMsg(null);
    setSelectedSearchAddress(null);
    try {
      let queryStr = addressInput;
      if (!addressInput.toLowerCase().includes("bragança")) {
        queryStr += ", Bragança Paulista";
      }
      queryStr += ", Brasil";

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          queryStr
        )}&format=json&limit=5&addressdetails=1&countrycodes=br`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        }
      );
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const formatted: GeocodedAddress[] = data.map((item: any, idx: number) => {
          const { road, house_number, suburb, city, town, village, state } = item.address || {};
          const streetPart = road ? (house_number ? `${road}, ${house_number}` : road) : "";
          const neighborhoodPart = suburb || "";
          const cityPart = city || town || village || "";
          const statePart = state || "SP";
          
          const parts = [];
          if (streetPart) parts.push(streetPart);
          if (neighborhoodPart) parts.push(neighborhoodPart);
          if (cityPart) parts.push(`${cityPart} - ${statePart}`);
          
          const finalName = parts.join(", ") || item.display_name;

          return {
            id: `${item.place_id}-${idx}`,
            displayName: finalName,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            neighborhood: neighborhoodPart || undefined,
            city: cityPart || undefined,
          };
        });
        setResults(formatted);
      } else {
        setResults([]);
        setErrorMsg("Nenhum endereço encontrado. Tente refinar a busca.");
      }
    } catch (err) {
      console.warn("Search geocoding failed:", err);
      setErrorMsg("Erro ao buscar endereço. Verifique sua conexão.");
    } finally {
      setSearching(false);
    }
  };

  // Triggers native GPS request and reverse geocoding
  const handleUseGps = async () => {
    setGpsLoading(true);
    setErrorMsg(null);
    try {
      await useGpsLocation();
      onClose();
    } catch (err: any) {
      setErrorMsg("Não foi possível obter sua localização GPS.");
    } finally {
      setGpsLoading(false);
    }
  };

  // Triggers selection of searched result and prompts for custom label
  const handleSelectSearchAddress = (item: GeocodedAddress) => {
    setSelectedSearchAddress(item);
    setCustomLabel("");
    setActiveLabelType("casa");
  };

  // Saves a new address to the saved addresses list and updates location
  const handleSaveAndUseAddress = async () => {
    if (!selectedSearchAddress) return;

    setSaving(true);
    let finalCoords = {
      latitude: selectedSearchAddress.latitude,
      longitude: selectedSearchAddress.longitude,
    };

    // If manually entered address, geocode it before saving to ensure coordinates are real
    if (selectedSearchAddress.id.startsWith("manual-")) {
      try {
        let queryStr = selectedSearchAddress.displayName;
        if (!queryStr.toLowerCase().includes("bragança")) {
          queryStr += ", Bragança Paulista";
        }
        queryStr += ", Brasil";

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            queryStr
          )}&format=json&limit=1`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          }
        );
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          finalCoords.latitude = parseFloat(data[0].lat);
          finalCoords.longitude = parseFloat(data[0].lon);
        }
      } catch (err) {
        console.warn("Geocoding manual address failed, falling back to current location:", err);
      }
    }

    let finalLabel = "Casa";
    if (activeLabelType === "trabalho") {
      finalLabel = "Trabalho";
    } else if (activeLabelType === "outro") {
      finalLabel = customLabel.trim() || "Outro";
    }

    const newAddress: SavedAddress = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      label: finalLabel,
      addressName: selectedSearchAddress.displayName,
      latitude: finalCoords.latitude,
      longitude: finalCoords.longitude,
      neighborhood: selectedSearchAddress.neighborhood,
      city: selectedSearchAddress.city,
    };

    const updatedAddresses = [newAddress, ...savedAddresses];
    setSavedAddresses(updatedAddresses);

    try {
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updatedAddresses)
      );
      // Set active
      await updateLocation(
        { latitude: newAddress.latitude, longitude: newAddress.longitude },
        newAddress.addressName
      );
      onClose();
    } catch (e) {
      console.warn("Failed to save address:", e);
    } finally {
      setSaving(false);
    }
  };

  // Selects an already saved address
  const handleSelectSavedAddress = async (item: SavedAddress) => {
    await updateLocation(
      { latitude: item.latitude, longitude: item.longitude },
      item.addressName
    );
    onClose();
  };

  // Deletes an address from saved addresses
  const handleDeleteSavedAddress = async (id: string, e: any) => {
    e.stopPropagation();
    const updated = savedAddresses.filter((a) => a.id !== id);
    setSavedAddresses(updated);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to delete address:", err);
    }
  };

  const getLabelIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l === "casa") return "home";
    if (l === "trabalho") return "work";
    return "place";
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />
        
        <View style={styles.modalContent}>
          <View style={styles.dragIndicator} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Escolha onde receber</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Endereço Atual Ativo */}
          <View style={styles.currentAddressSection}>
            <MaterialIcons name="location-on" size={18} color="#22C55E" />
            <Text style={styles.currentAddressText} numberOfLines={1}>
              {addressName}
            </Text>
            <Text style={styles.currentAddressTag}>Atual</Text>
          </View>

          {/* Fluxo de Formulário de Rótulo / Rótulo de Endereço */}
          {selectedSearchAddress ? (
            <View style={styles.labelFormContainer}>
              <Text style={styles.labelFormTitle}>Como quer salvar esse endereço?</Text>
              <Text style={styles.labelFormSubtitle} numberOfLines={2}>
                {selectedSearchAddress.displayName}
              </Text>

              {/* Botões rápidos e Custom Label */}
              <View style={styles.labelSelectorRow}>
                <Pressable
                  onPress={() => setActiveLabelType("casa")}
                  style={[
                    styles.labelChoiceBtn,
                    activeLabelType === "casa" && styles.labelChoiceBtnActive,
                  ]}
                >
                  <MaterialIcons
                    name="home"
                    size={18}
                    color={activeLabelType === "casa" ? "#FFFFFF" : "#9CA3AF"}
                  />
                  <Text
                    style={[
                      styles.labelChoiceText,
                      activeLabelType === "casa" && styles.labelChoiceTextActive,
                    ]}
                  >
                    Casa
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveLabelType("trabalho")}
                  style={[
                    styles.labelChoiceBtn,
                    activeLabelType === "trabalho" && styles.labelChoiceBtnActive,
                  ]}
                >
                  <MaterialIcons
                    name="work"
                    size={18}
                    color={activeLabelType === "trabalho" ? "#FFFFFF" : "#9CA3AF"}
                  />
                  <Text
                    style={[
                      styles.labelChoiceText,
                      activeLabelType === "trabalho" && styles.labelChoiceTextActive,
                    ]}
                  >
                    Trabalho
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveLabelType("outro")}
                  style={[
                    styles.labelChoiceBtn,
                    activeLabelType === "outro" && styles.labelChoiceBtnActive,
                  ]}
                >
                  <MaterialIcons
                    name="place"
                    size={18}
                    color={activeLabelType === "outro" ? "#FFFFFF" : "#9CA3AF"}
                  />
                  <Text
                    style={[
                      styles.labelChoiceText,
                      activeLabelType === "outro" && styles.labelChoiceTextActive,
                    ]}
                  >
                    Outro
                  </Text>
                </Pressable>
              </View>

              {activeLabelType === "outro" && (
                <TextInput
                  style={styles.labelCustomInput}
                  placeholder="Nome do local (ex: Faculdade, Mãe)"
                  placeholderTextColor="#9CA3AF"
                  value={customLabel}
                  onChangeText={setCustomLabel}
                  maxLength={20}
                />
              )}

              <View style={styles.labelFormButtons}>
                <Pressable
                  onPress={() => setSelectedSearchAddress(null)}
                  style={styles.labelFormCancelBtn}
                >
                  <Text style={styles.labelFormCancelBtnText}>Voltar</Text>
                </Pressable>
                
                <Pressable
                  onPress={handleSaveAndUseAddress}
                  style={[styles.labelFormConfirmBtn, saving && { opacity: 0.7 }]}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.labelFormConfirmBtnText}>Salvar e Usar</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {/* Barra de Busca de Endereço */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                  <MaterialIcons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Adicionar novo endereço (rua, número)..."
                    placeholderTextColor="#9CA3AF"
                    value={addressInput}
                    onChangeText={setAddressInput}
                    onSubmitEditing={handleSearch}
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {addressInput.length > 0 && (
                    <Pressable onPress={() => setAddressInput("")}>
                      <MaterialIcons name="close" size={18} color="#9CA3AF" />
                    </Pressable>
                  )}
                </View>
                <Pressable onPress={handleSearch} style={styles.searchBtn}>
                  <Text style={styles.searchBtnText}>Buscar</Text>
                </Pressable>
              </View>

              {addressInput.trim().length > 0 && (
                <Pressable
                  onPress={() => {
                    const manualItem: GeocodedAddress = {
                      id: `manual-${Date.now()}`,
                      displayName: addressInput.trim(),
                      latitude: coords?.latitude ?? -22.9520,
                      longitude: coords?.longitude ?? -46.5420,
                    };
                    setSelectedSearchAddress(manualItem);
                  }}
                  style={styles.manualAddRow}
                >
                  <MaterialIcons name="add-location" size={20} color="#22C55E" />
                  <Text style={styles.manualAddText} numberOfLines={1}>
                    Adicionar "{addressInput.trim()}" manualmente
                  </Text>
                </Pressable>
              )}

              {/* Botão de Localização GPS */}
              <Pressable
                onPress={handleUseGps}
                disabled={gpsLoading || locationLoading}
                style={styles.gpsButton}
              >
                {gpsLoading ? (
                  <ActivityIndicator size="small" color="#22C55E" />
                ) : (
                  <MaterialIcons name="my-location" size={20} color="#22C55E" />
                )}
                <View style={styles.gpsTextContainer}>
                  <Text style={styles.gpsTitle}>Usar localização atual</Text>
                  <Text style={styles.gpsSubtitle}>Ativar GPS do celular</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </Pressable>

              {/* Lista Principal de Conteúdo: Resultados da Busca OR Lista de Endereços Salvos */}
              <View style={styles.resultsContainer}>
                {searching ? (
                  <View style={styles.centerSpinner}>
                    <ActivityIndicator size="large" color="#22C55E" />
                    <Text style={styles.spinnerText}>Procurando endereços...</Text>
                  </View>
                ) : errorMsg ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={32} color="#EF4444" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : results.length > 0 ? (
                  /* EXIBE RESULTADOS DA PESQUISA NOMINATIM */
                  <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => handleSelectSearchAddress(item)}
                        style={styles.resultRow}
                      >
                        <View style={styles.resultIconBox}>
                          <MaterialIcons name="location-on" size={20} color="#9CA3AF" />
                        </View>
                        <View style={styles.resultInfoBox}>
                          <Text style={styles.resultTitle} numberOfLines={1}>
                            {item.displayName.split(",")[0]}
                          </Text>
                          <Text style={styles.resultSubtitle} numberOfLines={2}>
                            {item.displayName}
                          </Text>
                        </View>
                        <Text style={styles.saveTagText}>+ Salvar</Text>
                      </Pressable>
                    )}
                  />
                ) : (
                  /* EXIBE MEUS ENDEREÇOS SALVOS (ESTILO IFOOD) */
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {savedAddresses.length > 0 && (
                      <Text style={styles.savedSectionTitle}>Meus endereços salvos</Text>
                    )}
                    
                    <FlatList
                      data={savedAddresses}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                      renderItem={({ item }) => (
                        <Pressable
                          onPress={() => handleSelectSavedAddress(item)}
                          style={styles.savedRow}
                        >
                          <View style={styles.savedIconBox}>
                            <MaterialIcons
                              name={getLabelIcon(item.label) as any}
                              size={20}
                              color="#22C55E"
                            />
                          </View>
                          <View style={styles.savedInfoBox}>
                            <Text style={styles.savedLabel}>{item.label}</Text>
                            <Text style={styles.savedAddressName} numberOfLines={1}>
                              {item.addressName}
                            </Text>
                          </View>
                          
                          {/* Botão de Excluir */}
                          <Pressable
                            onPress={(e) => handleDeleteSavedAddress(item.id, e)}
                            style={styles.deleteRowBtn}
                          >
                            <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                          </Pressable>
                        </Pressable>
                      )}
                      ListEmptyComponent={
                        <View style={styles.emptyResults}>
                          <MaterialIcons name="place" size={48} color="#374151" />
                          <Text style={styles.emptyResultsText}>
                            Nenhum endereço salvo ainda. Busque e salve um endereço para começar!
                          </Text>
                        </View>
                      }
                    />
                  </ScrollView>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  dismissOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    maxHeight: Dimensions.get("window").height * 0.85,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#374151",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  closeBtn: {
    padding: 4,
  },
  currentAddressSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.06)",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
    gap: 8,
  },
  currentAddressText: {
    flex: 1,
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  currentAddressTag: {
    fontSize: 10,
    color: "#22C55E",
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    padding: 0,
  },
  searchBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  gpsTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  gpsSubtitle: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 1,
  },
  resultsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    height: 350,
    backgroundColor: "#111827",
  },
  centerSpinner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  spinnerText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    gap: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
    gap: 12,
  },
  resultIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfoBox: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  resultSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    lineHeight: 16,
  },
  saveTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savedSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
    gap: 12,
  },
  savedIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  savedInfoBox: {
    flex: 1,
  },
  savedLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  savedAddressName: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  deleteRowBtn: {
    padding: 6,
  },
  emptyResults: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyResultsText: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  labelFormContainer: {
    padding: 20,
    backgroundColor: "#111827",
    gap: 14,
  },
  labelFormTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  labelFormSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 18,
    marginBottom: 4,
  },
  labelSelectorRow: {
    flexDirection: "row",
    gap: 10,
  },
  labelChoiceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1F2937",
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 6,
  },
  labelChoiceBtnActive: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  labelChoiceText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  labelChoiceTextActive: {
    color: "#FFFFFF",
  },
  labelCustomInput: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#374151",
  },
  labelFormButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  labelFormCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  labelFormCancelBtnText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "700",
  },
  labelFormConfirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  labelFormConfirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  manualAddRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    gap: 10,
  },
  manualAddText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
});
