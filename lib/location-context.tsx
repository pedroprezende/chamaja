import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";

const Location = (Platform.OS !== "web" || typeof window !== "undefined")
  ? require("expo-location")
  : null;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationContextType {
  coords: Coordinates | null;
  permissionGranted: boolean;
  loading: boolean;
  errorMsg: string | null;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCoords = async () => {
    try {
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          setCoords({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
        }
      } catch (e) {
        console.warn("getLastKnownPositionAsync failed, falling back", e);
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      setErrorMsg(null);
    } catch (err: any) {
      console.warn("Error fetching current position:", err);
      setErrorMsg(err.message || "Could not fetch current location");
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setPermissionGranted(granted);
      if (granted) {
        await fetchCoords();
      } else {
        setLoading(false);
      }
      return granted;
    } catch (err: any) {
      console.warn("Error requesting permission:", err);
      setErrorMsg(err.message || "Permission request failed");
      setLoading(false);
      return false;
    }
  };

  const refreshLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        setPermissionGranted(true);
        await fetchCoords();
      } else {
        setPermissionGranted(false);
        setLoading(false);
      }
    } catch (err: any) {
      console.warn("Error checking location permission:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        coords,
        permissionGranted,
        loading,
        errorMsg,
        requestPermission,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
