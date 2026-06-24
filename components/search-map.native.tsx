import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { View, StyleSheet, Image } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { SearchMapProps } from "./search-map";

// Premium dark mode map theme JSON (Google Maps style)
const DARK_MAP_STYLE = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#111827",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9ca3af",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#111827",
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#374151",
      },
    ],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [
      {
        color: "#1f2937",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [
      {
        color: "#111827",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9ca3af",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      {
        color: "#1f2937",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#111827",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#374151",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#111827",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#0f172a",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#4b5563",
      },
    ],
  },
];

const SearchMapNative = forwardRef<any, SearchMapProps>((props, ref) => {
  const {
    providers,
    userCoords,
    selectedProviderId,
    onSelectProvider,
    onMapCenterChange,
  } = props;
  const mapRef = useRef<MapView>(null);

  const centerLat = userCoords?.latitude ?? -22.9519;
  const centerLng = userCoords?.longitude ?? -46.5419;

  useImperativeHandle(ref, () => ({
    recenter: () => {
      mapRef.current?.animateToRegion(
        {
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        1000,
      );
    },
  }));

  // Pan to selected provider if it changes
  useEffect(() => {
    if (selectedProviderId) {
      const selected = providers.find((p) => p.id === selectedProviderId);
      if (selected && selected.latitude && selected.longitude) {
        mapRef.current?.animateToRegion(
          {
            latitude: selected.latitude - 0.002, // slightly offset to prevent card overlap
            longitude: selected.longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          },
          800,
        );
      }
    }
  }, [selectedProviderId, providers]);

  // Pan to user location if it changes
  useEffect(() => {
    if (userCoords) {
      mapRef.current?.animateToRegion(
        {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        1000,
      );
    }
  }, [userCoords?.latitude, userCoords?.longitude]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onPress={() => onSelectProvider(null)}
        onRegionChangeComplete={(region) => {
          if (onMapCenterChange) {
            onMapCenterChange({
              latitude: region.latitude,
              longitude: region.longitude,
            });
          }
        }}
      >
        {/* User Location Marker (Blue Dot) */}
        {userCoords && (
          <Marker
            coordinate={{
              latitude: userCoords.latitude,
              longitude: userCoords.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => onSelectProvider(null)}
          >
            <View style={styles.userDotContainer}>
              <View style={styles.userDotOuter}>
                <View style={styles.userDotInner} />
              </View>
            </View>
          </Marker>
        )}

        {/* User Radar Circle (Translucent Green) */}
        {userCoords && (
          <Circle
            center={{
              latitude: userCoords.latitude,
              longitude: userCoords.longitude,
            }}
            radius={1000} // 1 km radius
            fillColor="rgba(34, 197, 94, 0.08)"
            strokeColor="rgba(34, 197, 94, 0.25)"
            strokeWidth={1.5}
          />
        )}

        {/* Provider/Shop Pins */}
        {providers.map((p) => {
          if (!p.latitude || !p.longitude) return null;

          const isSelected = p.id === selectedProviderId;

          return (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => onSelectProvider(p.id)}
            >
              <View style={styles.customMarker}>
                <View
                  style={[
                    styles.markerContainer,
                    isSelected && styles.markerContainerSelected,
                  ]}
                >
                  <Image
                    source={{
                      uri:
                        p.avatarUri ||
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
                    }}
                    style={styles.markerAvatar}
                  />
                </View>
                <View
                  style={[
                    styles.markerTriangle,
                    isSelected && styles.markerTriangleSelected,
                  ]}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
});

SearchMapNative.displayName = "SearchMapNative";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  userDotContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
  },
  userDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  userDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3b82f6",
  },
  customMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: "#22C55E",
    backgroundColor: "#111827",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerContainerSelected: {
    borderColor: "#FFFFFF",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
  },
  markerAvatar: {
    width: "100%",
    height: "100%",
  },
  markerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#22C55E",
    marginTop: -2,
  },
  markerTriangleSelected: {
    borderTopColor: "#FFFFFF",
    borderTopWidth: 9,
    borderLeftWidth: 7,
    borderRightWidth: 7,
  },
});

export default SearchMapNative;
