import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";

interface GeocodeDebugInfo {
  inputtedAddress: string;
  geocodedLat: number;
  geocodedLng: number;
  finalSavedLat: number;
  finalSavedLng: number;
  timestamp: string;
}

export default function LocationDebugScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<GeocodeDebugInfo | null>(null);

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(
        "@chamaja_last_geocoded_debug_info",
      );
      if (raw) {
        setDebugInfo(JSON.parse(raw));
      } else {
        setDebugInfo(null);
      }
    } catch (e) {
      console.warn("Failed to load debug info:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const formatCoord = (val: number | undefined) => {
    if (val === undefined || val === null) return "N/A";
    return val.toFixed(7);
  };

  const getDifferenceInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371e3; // metres
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return d.toFixed(1) + " metros";
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={colors.foreground}
          />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Debug de Geolocalização
          </Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            Último endereço geocodificado
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.refreshBtn,
            pressed && { opacity: 0.6 },
          ]}
          onPress={loadDebugInfo}
          hitSlop={8}
        >
          <MaterialIcons name="refresh" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !debugInfo ? (
        <View style={styles.emptyState}>
          <MaterialIcons
            name="location-off"
            size={48}
            color={colors.muted}
            style={{ marginBottom: 12 }}
          />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Nenhum dado registrado
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Adicione ou edite um endereço no mapa para registrar as estatísticas
            de debug.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Endereço Informado */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="place" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Endereço Informado
              </Text>
            </View>
            <Text style={[styles.addressText, { color: colors.foreground }]}>
              {debugInfo.inputtedAddress}
            </Text>
            <Text style={[styles.timestampText, { color: colors.muted }]}>
              Registrado em:{" "}
              {new Date(debugInfo.timestamp).toLocaleString("pt-BR")}
            </Text>
          </View>

          {/* Coordenadas Retornadas pela Geocodificação */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="satellite" size={20} color="#F59E0B" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Retorno OSM (Nominatim)
              </Text>
            </View>
            <View style={styles.coordRow}>
              <Text style={[styles.coordLabel, { color: colors.muted }]}>
                Latitude:
              </Text>
              <Text style={[styles.coordValue, { color: colors.foreground }]}>
                {formatCoord(debugInfo.geocodedLat)}
              </Text>
            </View>
            <View style={styles.coordRow}>
              <Text style={[styles.coordLabel, { color: colors.muted }]}>
                Longitude:
              </Text>
              <Text style={[styles.coordValue, { color: colors.foreground }]}>
                {formatCoord(debugInfo.geocodedLng)}
              </Text>
            </View>
          </View>

          {/* Coordenadas Finais Confirmadas */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderLeftColor: colors.primary,
                borderLeftWidth: 4,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="check-circle"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[
                  styles.cardTitle,
                  { color: colors.foreground, fontWeight: "700" },
                ]}
              >
                Confirmado pelo Usuário
              </Text>
            </View>
            <View style={styles.coordRow}>
              <Text style={[styles.coordLabel, { color: colors.muted }]}>
                Latitude final:
              </Text>
              <Text
                style={[
                  styles.coordValue,
                  { color: colors.primary, fontWeight: "700" },
                ]}
              >
                {formatCoord(debugInfo.finalSavedLat)}
              </Text>
            </View>
            <View style={styles.coordRow}>
              <Text style={[styles.coordLabel, { color: colors.muted }]}>
                Longitude final:
              </Text>
              <Text
                style={[
                  styles.coordValue,
                  { color: colors.primary, fontWeight: "700" },
                ]}
              >
                {formatCoord(debugInfo.finalSavedLng)}
              </Text>
            </View>
          </View>

          {/* Diferença e Precisão */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="insights" size={20} color="#3b82f6" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Ajuste Manual do Usuário
              </Text>
            </View>
            <View style={styles.coordRow}>
              <Text style={[styles.coordLabel, { color: colors.muted }]}>
                Diferença (m):
              </Text>
              <Text
                style={[
                  styles.coordValue,
                  { color: colors.foreground, fontWeight: "700" },
                ]}
              >
                {getDifferenceInMeters(
                  debugInfo.geocodedLat,
                  debugInfo.geocodedLng,
                  debugInfo.finalSavedLat,
                  debugInfo.finalSavedLng,
                )}
              </Text>
            </View>
            <Text style={[styles.infoHintText, { color: colors.muted }]}>
              Esta distância representa a correção manual feita no mapa em
              relação ao ponto inicial sugerido pela busca do OpenStreetMap.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    backgroundColor: "transparent",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  addressText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  timestampText: {
    fontSize: 12,
    marginTop: 4,
  },
  coordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coordLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  coordValue: {
    fontSize: 14,
    fontFamily: "monospace",
  },
  infoHintText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
});
