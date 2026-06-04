import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { LocationConfirmationMapProps } from "./location-confirmation-map";

const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #111827;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map = null;
    let marker = null;

    function initMap(lat, lng) {
      if (map) return;
      map = L.map('map', {
        zoomControl: true,
        attributionControl: false
      }).setView([lat, lng], 16);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map);

      // Create a draggable marker
      marker = L.marker([lat, lng], {
        draggable: true
      }).addTo(map);

      marker.on('dragend', function (event) {
        let position = marker.getLatLng();
        window.parent.postMessage({
          type: 'MARKER_DRAG_END',
          lat: position.lat,
          lng: position.lng
        }, '*');
      });

      // Also support clicking the map to move the marker
      map.on('click', function (event) {
        let latlng = event.latlng;
        marker.setLatLng(latlng);
        window.parent.postMessage({
          type: 'MARKER_DRAG_END',
          lat: latlng.lat,
          lng: latlng.lng
        }, '*');
      });
    }

    window.addEventListener('message', (e) => {
      const data = e.data;
      if (!data) return;

      if (data.type === 'INIT') {
        initMap(data.lat, data.lng);
      }
    });

    window.parent.postMessage({ type: 'MAP_READY' }, '*');
  </script>
</body>
</html>
`;

const LocationConfirmationMapWeb = forwardRef<any, LocationConfirmationMapProps>((props, ref) => {
  const { initialCoords, onConfirm, onCancel } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentCoords, setCurrentCoords] = useState(initialCoords);
  const isReadyRef = useRef(false);

  const sendToIframe = (msg: any) => {
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  };

  useImperativeHandle(ref, () => ({
    getCoords: () => currentCoords,
  }));

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "MAP_READY") {
        isReadyRef.current = true;
        sendToIframe({
          type: "INIT",
          lat: initialCoords.latitude,
          lng: initialCoords.longitude,
        });
      } else if (event.data?.type === "MARKER_DRAG_END") {
        setCurrentCoords({
          latitude: event.data.lat,
          longitude: event.data.lng,
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [initialCoords]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={MAP_HTML}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
      <View style={styles.overlayButtons}>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Pressable style={styles.confirmBtn} onPress={() => onConfirm(currentCoords)}>
          <Text style={styles.confirmText}>Confirmar Localização</Text>
        </Pressable>
      </View>
    </View>
  );
});

LocationConfirmationMapWeb.displayName = "LocationConfirmationMapWeb";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    position: "relative",
    width: "100%",
    height: "100%",
  },
  overlayButtons: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
    zIndex: 9999,
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

export default LocationConfirmationMapWeb;
