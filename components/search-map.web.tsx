import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { SearchMapProps } from "./search-map";

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
    /* Custom styled markers */
    .custom-pin {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 44px !important;
      height: 52px !important;
      cursor: pointer;
    }
    .pin-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 3px solid #22C55E;
      background-color: #111827;
      background-size: cover;
      background-position: center;
      box-shadow: 0 3px 6px rgba(0,0,0,0.4);
      transition: all 0.2s ease-in-out;
    }
    .pin-triangle {
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 8px solid #22C55E;
      margin-top: -1px;
      transition: all 0.2s ease-in-out;
    }
    /* Active / Selected pin styling */
    .custom-pin.selected .pin-avatar {
      border-color: #ffffff;
      width: 44px;
      height: 44px;
      box-shadow: 0 4px 10px rgba(255,255,255,0.3);
    }
    .custom-pin.selected .pin-triangle {
      border-top-color: #ffffff;
      border-top-width: 9px;
      border-left-width: 7px;
      border-right-width: 7px;
    }
    /* User location dot */
    .user-dot-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }
    .user-dot-outer {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .user-dot-inner {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #3b82f6;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map = null;
    let userMarker = null;
    let userCircle = null;
    let providersMarkers = {};
    let activeSelectedId = null;

    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: '<div class="user-dot-container"><div class="user-dot-outer"><div class="user-dot-inner"></div></div></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    function initMap(lat, lng) {
      if (map) return;
      map = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView([lat, lng], 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map);
    }

    function updateUserLocation(lat, lng, centerMap) {
      const newLatLng = [lat, lng];
      if (!map) {
        initMap(lat, lng);
      }
      
      if (userMarker) {
        userMarker.setLatLng(newLatLng);
      } else {
        userMarker = L.marker(newLatLng, { icon: userIcon }).addTo(map);
      }

      if (userCircle) {
        userCircle.setLatLng(newLatLng);
      } else {
        userCircle = L.circle(newLatLng, {
          color: '#22C55E',
          fillColor: '#22C55E',
          fillOpacity: 0.08,
          radius: 1000,
          weight: 1.5,
          opacity: 0.25
        }).addTo(map);
      }

      if (centerMap) {
        map.setView(newLatLng, 14, { animate: true });
      }
    }

    function updateProviders(providersList) {
      if (!map) return;
      
      // Clear old markers
      Object.keys(providersMarkers).forEach(id => {
        map.removeLayer(providersMarkers[id]);
      });
      providersMarkers = {};

      providersList.forEach(p => {
        if (p.latitude && p.longitude) {
          const avatar = p.avatarUri || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80';
          const isSelected = p.id === activeSelectedId;
          const extraClass = isSelected ? ' selected' : '';

          const htmlContent = '<div class="pin-avatar" style="background-image: url(' + avatar + ')"></div><div class="pin-triangle"></div>';
          
          const pinIcon = L.divIcon({
            className: 'custom-pin' + extraClass,
            html: htmlContent,
            iconSize: isSelected ? [50, 60] : [44, 52],
            iconAnchor: isSelected ? [25, 60] : [22, 52]
          });

          const marker = L.marker([p.latitude, p.longitude], { icon: pinIcon }).addTo(map);
          
          marker.on('click', () => {
            window.parent.postMessage({ type: 'SELECT_PROVIDER', providerId: p.id }, '*');
          });

          providersMarkers[p.id] = marker;
        }
      });
    }

    function selectProvider(providerId) {
      if (!map) return;
      activeSelectedId = providerId;
      
      Object.keys(providersMarkers).forEach(id => {
        const marker = providersMarkers[id];
        const isSelected = id === activeSelectedId;
        
        let currentHtml = marker.options.icon.options.html;
        const match = currentHtml.match(/url\\(([^)]+)\\)/);
        const avatar = match ? match[1] : '';
        
        const extraClass = isSelected ? ' selected' : '';
        const htmlContent = '<div class="pin-avatar" style="background-image: url(' + avatar + ')"></div><div class="pin-triangle"></div>';
        
        const pinIcon = L.divIcon({
          className: 'custom-pin' + extraClass,
          html: htmlContent,
          iconSize: isSelected ? [50, 60] : [44, 52],
          iconAnchor: isSelected ? [25, 60] : [22, 52]
        });
        
        marker.setIcon(pinIcon);
      });
    }

    window.addEventListener('message', (e) => {
      const data = e.data;
      if (!data) return;

      if (data.type === 'INIT') {
        console.log("=== Leaflet Map Init ===");
        console.log("User Coords:", data.userCoords?.latitude, data.userCoords?.longitude);
        console.log("Providers count:", data.providers?.length);
        initMap(data.userCoords?.latitude, data.userCoords?.longitude);
        updateUserLocation(data.userCoords?.latitude, data.userCoords?.longitude, false);
        activeSelectedId = data.selectedProviderId;
        updateProviders(data.providers);
      } else if (data.type === 'RECENTER') {
        console.log("Leaflet Map Recenter:", data.lat, data.lng);
        map.setView([data.lat, data.lng], 14, { animate: true });
      } else if (data.type === 'PAN_TO_PROVIDER') {
        console.log("Leaflet Map Pan to provider:", data.lat, data.lng);
        map.setView([data.lat, data.lng], 14.5, { animate: true });
      } else if (data.type === 'UPDATE_USER_LOCATION') {
        console.log("Leaflet Map Update User Location:", data.lat, data.lng);
        updateUserLocation(data.lat, data.lng, true);
      } else if (data.type === 'UPDATE_PROVIDERS') {
        console.log("Leaflet Map Update Providers. New count:", data.providers?.length);
        updateProviders(data.providers);
      } else if (data.type === 'SELECT_PROVIDER') {
        console.log("Leaflet Map Select Provider:", data.providerId);
        selectProvider(data.providerId);
      }
    });

    window.parent.postMessage({ type: 'MAP_READY' }, '*');
  </script>
</body>
</html>
`;

const SearchMapWeb = forwardRef<any, SearchMapProps>((props, ref) => {
  const { providers, userCoords, selectedProviderId, onSelectProvider } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isReadyRef = useRef(false);

  const centerLat = userCoords?.latitude ?? -22.9519;
  const centerLng = userCoords?.longitude ?? -46.5419;

  const sendToIframe = (msg: any) => {
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  };

  useImperativeHandle(ref, () => ({
    recenter: () => {
      sendToIframe({
        type: "RECENTER",
        lat: userCoords?.latitude ?? -22.9519,
        lng: userCoords?.longitude ?? -46.5419,
      });
    },
  }));

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "MAP_READY") {
        isReadyRef.current = true;
        sendToIframe({
          type: "INIT",
          userCoords: { latitude: centerLat, longitude: centerLng },
          providers,
          selectedProviderId,
        });
      } else if (event.data?.type === "SELECT_PROVIDER") {
        onSelectProvider(event.data.providerId);
        sendToIframe({
          type: "SELECT_PROVIDER",
          providerId: event.data.providerId,
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [centerLat, centerLng, providers, selectedProviderId, onSelectProvider]);

  useEffect(() => {
    if (isReadyRef.current && userCoords) {
      sendToIframe({
        type: "UPDATE_USER_LOCATION",
        lat: userCoords.latitude,
        lng: userCoords.longitude,
      });
    }
  }, [userCoords?.latitude, userCoords?.longitude]);

  useEffect(() => {
    if (isReadyRef.current) {
      sendToIframe({
        type: "UPDATE_PROVIDERS",
        providers,
      });
    }
  }, [providers]);

  useEffect(() => {
    if (isReadyRef.current) {
      sendToIframe({
        type: "SELECT_PROVIDER",
        providerId: selectedProviderId,
      });
      if (selectedProviderId) {
        const selected = providers.find((p) => p.id === selectedProviderId);
        if (selected && selected.latitude && selected.longitude) {
          sendToIframe({
            type: "PAN_TO_PROVIDER",
            lat: selected.latitude - 0.002,
            lng: selected.longitude,
          });
        }
      }
    }
  }, [selectedProviderId, providers]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={MAP_HTML}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </View>
  );
});

SearchMapWeb.displayName = "SearchMapWeb";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
});

export default SearchMapWeb;
