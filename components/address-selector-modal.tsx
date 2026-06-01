import React, { useState } from "react";
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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocation } from "@/lib/location-context";

interface AddressSelectorModalProps {
  visible: boolean;
  onClose: () => void;
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
  const { addressName, updateLocation, useGpsLocation, loading: locationLoading } = useLocation();
  const [addressInput, setAddressInput] = useState("");
  const [results, setResults] = useState<GeocodedAddress[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Searches addresses using the Nominatim API
  const handleSearch = async () => {
    if (!addressInput.trim()) return;
    setSearching(true);
    setErrorMsg(null);
    try {
      // Append Bragança Paulista to help search locally first, but allow national search
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

  // Selects an address option and updates context
  const handleSelectAddress = async (item: GeocodedAddress) => {
    await updateLocation(
      { latitude: item.latitude, longitude: item.longitude },
      item.displayName
    );
    onClose();
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
          {/* Barra de arrastar superior */}
          <View style={styles.dragIndicator} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Escolha onde receber</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Endereço Atual */}
          <View style={styles.currentAddressSection}>
            <MaterialIcons name="location-on" size={18} color="#22C55E" />
            <Text style={styles.currentAddressText} numberOfLines={1}>
              {addressName}
            </Text>
            <Text style={styles.currentAddressTag}>Atual</Text>
          </View>

          {/* Barra de Busca de Endereço */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar rua, número, bairro..."
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

          {/* Botão de Localização GPS */}
          <Pressable
            onPress={handleUseGps}
            disabled={gpsLoading || locationLoading}
            style={({ pressed }) => [
              styles.gpsButton,
              pressed && { opacity: 0.8 }
            ]}
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

          {/* Resultados de Busca */}
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
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelectAddress(item)}
                    style={({ pressed }) => [
                      styles.resultRow,
                      pressed && { backgroundColor: "#374151" }
                    ]}
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
                    <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
                  </Pressable>
                )}
                ListEmptyComponent={
                  addressInput.trim() && results.length === 0 ? null : (
                    <View style={styles.emptyResults}>
                      <MaterialIcons name="map" size={48} color="#374151" />
                      <Text style={styles.emptyResultsText}>
                        Digite seu endereço acima para buscar
                      </Text>
                    </View>
                  )
                }
              />
            )}
          </View>
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
    height: 300,
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
  emptyResults: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyResultsText: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
