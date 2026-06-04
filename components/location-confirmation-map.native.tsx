import React, { useState } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { LocationConfirmationMapProps } from "./location-confirmation-map";

export default function LocationConfirmationMapNative({
  initialCoords,
  onConfirm,
  onCancel,
}: LocationConfirmationMapProps) {
  const [markerCoords, setMarkerCoords] = useState(initialCoords);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: initialCoords.latitude,
          longitude: initialCoords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        onPress={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
      >
        <Marker
          draggable
          coordinate={markerCoords}
          onDragEnd={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
          title="Segure e arraste para ajustar"
          description="Arraste até o ponto correto do seu imóvel"
        />
      </MapView>

      <View style={styles.overlayButtons}>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Pressable style={styles.confirmBtn} onPress={() => onConfirm(markerCoords)}>
          <Text style={styles.confirmText}>Confirmar Localização</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  overlayButtons: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 15,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
