import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { SearchMapProps } from "./search-map";

const SearchMapWeb = forwardRef<any, SearchMapProps>((props, ref) => {
  const { providers, userCoords, selectedProviderId, onSelectProvider } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const centerLat = userCoords?.latitude ?? -22.9519;
  const centerLng = userCoords?.longitude ?? -46.5419;

  useImperativeHandle(ref, () => ({
    recenter: () => {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "RECENTER",
          lat: centerLat,
          lng: centerLng,
        },
        "*"
      );
    },
  }));

  // Pan to selected provider if it changes
  useEffect(() => {
    if (selectedProviderId) {
      const selected = providers.find((p) => p.id === selectedProviderId);
      if (selected && selected.latitude && selected.longitude) {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "PAN_TO_PROVIDER",
            lat: selected.latitude - 0.002, // slightly offset to prevent card overlap
            lng: selected.longitude,
          },
          "*"
        );
      }
    }
  }, [selectedProviderId, providers]);

  // Leaflet inside self-contained iframe document
  const html = `
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
        // Init map with zoom controls hidden to match native look
        const map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${centerLat}, ${centerLng}], 14);

        // Dark Matter map tiles (CartoDB)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20
        }).addTo(map);

        // User location marker
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: '<div class="user-dot-container"><div class="user-dot-outer"><div class="user-dot-inner"></div></div></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        L.marker([${centerLat}, ${centerLng}], { icon: userIcon }).addTo(map);

        // Scanning Circle (Radar)
        L.circle([${centerLat}, ${centerLng}], {
          color: '#22C55E',
          fillColor: '#22C55E',
          fillOpacity: 0.08,
          radius: 1000,
          weight: 1.5,
          opacity: 0.25
        }).addTo(map);

        // Providers Layer
        const providers = ${JSON.stringify(providers)};
        const markers = {};
        let activeSelectedId = ${selectedProviderId ? `'${selectedProviderId}'` : "null"};

        providers.forEach(p => {
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

            markers[p.id] = marker;
          }
        });

        // Listen for communication from React Native parent
        window.addEventListener('message', (e) => {
          if (e.data.type === 'RECENTER') {
            map.setView([e.data.lat, e.data.lng], 14, { animate: true });
          } else if (e.data.type === 'PAN_TO_PROVIDER') {
            map.setView([e.data.lat, e.data.lng], 14.5, { animate: true });
          }
        });
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SELECT_PROVIDER") {
        onSelectProvider(event.data.providerId);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSelectProvider]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={html}
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
