import React, { forwardRef } from "react";
import { Platform } from "react-native";

export interface LocationConfirmationMapProps {
  initialCoords: { latitude: number; longitude: number };
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
  onCancel: () => void;
}

const LocationConfirmationMap = forwardRef<any, LocationConfirmationMapProps>((props, ref) => {
  if (Platform.OS === "web") {
    const MapWeb = require("./location-confirmation-map.web").default;
    return <MapWeb ref={ref} {...props} />;
  } else {
    const MapNative = require("./location-confirmation-map.native").default;
    return <MapNative ref={ref} {...props} />;
  }
});

LocationConfirmationMap.displayName = "LocationConfirmationMap";

export default LocationConfirmationMap;
