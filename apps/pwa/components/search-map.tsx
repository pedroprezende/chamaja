import React, { forwardRef } from "react";
import { Platform } from "react-native";

export interface MapProvider {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  subcategoryId: string;
  subcategoryName: string;
  city: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  avatarUri?: string | null;
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  destaque: boolean;
  onlineStatus: boolean;
}

export interface SearchMapProps {
  providers: MapProvider[];
  userCoords: { latitude: number; longitude: number } | null;
  selectedProviderId: string | null;
  onSelectProvider: (id: string | null) => void;
  onMapCenterChange?: (coords: { latitude: number; longitude: number }) => void;
  mapRef?: any;
}

// Conditionally require components to avoid bundler issues on web
const SearchMap = forwardRef<any, SearchMapProps>((props, ref) => {
  if (Platform.OS === "web") {
    const MapWeb = require("./search-map.web").default;
    return <MapWeb ref={ref} {...props} />;
  } else {
    const MapNative = require("./search-map.native").default;
    return <MapNative ref={ref} {...props} />;
  }
});

SearchMap.displayName = "SearchMap";

export default SearchMap;
