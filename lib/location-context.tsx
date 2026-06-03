import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Location = (Platform.OS !== "web" || typeof window !== "undefined")
  ? require("expo-location")
  : null;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationContextType {
  coords: Coordinates | null;
  addressName: string;
  permissionGranted: boolean;
  loading: boolean;
  errorMsg: string | null;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
  updateLocation: (coords: Coordinates, name: string) => Promise<void>;
  useGpsLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [addressName, setAddressName] = useState<string>("Bragança Paulista - SP");
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to reverse geocode lat/lng to a friendly name using OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        }
      );
      const data = await response.json();
      if (data && data.address) {
        const { road, suburb, house_number, city, town, village } = data.address;
        const streetPart = road ? (house_number ? `${road}, ${house_number}` : road) : "";
        const neighborhoodPart = suburb || "";
        const cityPart = city || town || village || "";
        
        const parts = [];
        if (streetPart) parts.push(streetPart);
        if (neighborhoodPart) parts.push(neighborhoodPart);
        if (cityPart && parts.length === 0) parts.push(cityPart);

        return parts.join(", ") || data.display_name || "Minha Localização (GPS)";
      }
      return data?.display_name || "Minha Localização (GPS)";
    } catch (err) {
      console.warn("Reverse geocoding failed, using fallback:", err);
      return "Minha Localização (GPS)";
    }
  };

  const fetchCoords = async () => {
    try {
      if (Platform.OS === "web") {
        if (typeof window === "undefined" || !navigator.geolocation) {
          setCoords({ latitude: -22.9520, longitude: -46.5420 });
          setAddressName("Bragança Paulista - SP");
          setLoading(false);
          return;
        }
        return new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const lat = position.coords.latitude;
              const lon = position.coords.longitude;
              setCoords({ latitude: lat, longitude: lon });
              const friendlyName = await reverseGeocode(lat, lon);
              setAddressName(friendlyName);
              setLoading(false);
              resolve();
            },
            (error) => {
              console.warn("Web fetchCoords failed:", error);
              setCoords({ latitude: -22.9520, longitude: -46.5420 });
              setAddressName("Bragança Paulista - SP");
              setLoading(false);
              resolve();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });
      }

      if (!Location) {
        // Fallback for web without geolocation API
        setCoords({ latitude: -22.9520, longitude: -46.5420 });
        setAddressName("Bragança Paulista - SP");
        setLoading(false);
        return;
      }

      try {
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          const lat = lastKnown.coords.latitude;
          const lon = lastKnown.coords.longitude;
          setCoords({ latitude: lat, longitude: lon });
          const friendlyName = await reverseGeocode(lat, lon);
          setAddressName(friendlyName);
        }
      } catch (e) {
        console.warn("getLastKnownPositionAsync failed, falling back", e);
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = current.coords.latitude;
      const lon = current.coords.longitude;
      setCoords({ latitude: lat, longitude: lon });
      const friendlyName = await reverseGeocode(lat, lon);
      setAddressName(friendlyName);
      setErrorMsg(null);
    } catch (err: any) {
      console.warn("Error fetching current position:", err);
      setErrorMsg(err.message || "Could not fetch current location");
      // Default fallback
      setCoords({ latitude: -22.9520, longitude: -46.5420 });
      setAddressName("Bragança Paulista - SP");
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    setLoading(true);
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !navigator.geolocation) {
        setCoords({ latitude: -22.9520, longitude: -46.5420 });
        setAddressName("Bragança Paulista - SP");
        setLoading(false);
        return false;
      }
      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            setCoords({ latitude: lat, longitude: lon });
            setPermissionGranted(true);
            const friendlyName = await reverseGeocode(lat, lon);
            setAddressName(friendlyName);
            setLoading(false);
            resolve(true);
          },
          (error) => {
            console.warn("Web Geolocation permission denied or failed:", error);
            setPermissionGranted(false);
            setCoords({ latitude: -22.9520, longitude: -46.5420 });
            setAddressName("Bragança Paulista - SP");
            setLoading(false);
            resolve(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    }

    if (!Location) {
      setCoords({ latitude: -22.9520, longitude: -46.5420 });
      setAddressName("Bragança Paulista - SP");
      setLoading(false);
      return true;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setPermissionGranted(granted);
      if (granted) {
        await fetchCoords();
      } else {
        // Permission denied fallback
        setCoords({ latitude: -22.9520, longitude: -46.5420 });
        setAddressName("Bragança Paulista - SP");
        setLoading(false);
      }
      return granted;
    } catch (err: any) {
      console.warn("Error requesting permission:", err);
      setErrorMsg(err.message || "Permission request failed");
      setCoords({ latitude: -22.9520, longitude: -46.5420 });
      setAddressName("Bragança Paulista - SP");
      setLoading(false);
      return false;
    }
  };

  const refreshLocation = async () => {
    setLoading(true);
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && navigator.geolocation) {
        await fetchCoords();
      } else {
        setLoading(false);
      }
      return;
    }
    if (!Location) {
      setLoading(false);
      return;
    }
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

  // Expose function to update custom coordinates and address name
  const updateLocation = async (newCoords: Coordinates, name: string) => {
    setCoords(newCoords);
    setAddressName(name);
    try {
      await AsyncStorage.setItem("@chamaja_custom_coords", JSON.stringify(newCoords));
      await AsyncStorage.setItem("@chamaja_custom_address_name", name);
      // Sincronizar com o seletor de região antigo
      await AsyncStorage.setItem("@chamaja_selected_region", name);
    } catch (e) {
      console.warn("Error saving custom location:", e);
    }
  };

  // Expose function to force GPS coordinates fetch and reverse geocoding
  const useGpsLocation = async () => {
    setLoading(true);
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !navigator.geolocation) {
        setErrorMsg("Location services not available on this browser");
        await updateLocation({ latitude: -22.9520, longitude: -46.5420 }, "Bragança Paulista - SP");
        setLoading(false);
        return;
      }
      return new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const friendlyName = await reverseGeocode(lat, lon);
            await updateLocation({ latitude: lat, longitude: lon }, friendlyName);
            setPermissionGranted(true);
            setLoading(false);
            resolve();
          },
          async (error) => {
            console.warn("Web GPS request failed:", error);
            setErrorMsg("GPS request failed: " + error.message);
            await updateLocation({ latitude: -22.9520, longitude: -46.5420 }, "Bragança Paulista - SP");
            setPermissionGranted(false);
            setLoading(false);
            resolve();
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    }

    try {
      if (Location) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setPermissionGranted(true);

          let lat: number | null = null;
          let lon: number | null = null;

          // 1. Try last known position first (fast, works indoors)
          try {
            const lastKnown = await Location.getLastKnownPositionAsync({});
            if (lastKnown) {
              lat = lastKnown.coords.latitude;
              lon = lastKnown.coords.longitude;
            }
          } catch (lkErr) {
            console.warn("getLastKnownPositionAsync failed, continuing to current position query", lkErr);
          }

          // 2. Try current position with timeout race
          try {
            const current = await Promise.race([
              Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              }),
              new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout getting current position")), 8000)
              )
            ]);
            if (current) {
              lat = current.coords.latitude;
              lon = current.coords.longitude;
            }
          } catch (currErr) {
            console.warn("getCurrentPositionAsync failed or timed out:", currErr);
            if (lat === null || lon === null) {
              throw currErr;
            }
          }

          if (lat !== null && lon !== null) {
            const friendlyName = await reverseGeocode(lat, lon);
            await updateLocation({ latitude: lat, longitude: lon }, friendlyName);
          } else {
            throw new Error("Could not determine GPS coordinates");
          }
        } else {
          throw new Error("GPS permission not granted");
        }
      } else {
        throw new Error("Location services not available");
      }
    } catch (e: any) {
      console.warn("GPS request failed:", e);
      setErrorMsg(e.message || "GPS request failed");
      // Fallback
      await updateLocation({ latitude: -22.9520, longitude: -46.5420 }, "Bragança Paulista - SP");
    } finally {
      setLoading(false);
    }
  };

  // Load custom location on mount
  useEffect(() => {
    const loadSavedLocation = async () => {
      try {
        const savedCoords = await AsyncStorage.getItem("@chamaja_custom_coords");
        const savedAddress = await AsyncStorage.getItem("@chamaja_custom_address_name");
        if (savedCoords && savedAddress) {
          setCoords(JSON.parse(savedCoords));
          setAddressName(savedAddress);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Failed to load saved custom location:", e);
      }
      requestPermission();
    };
    loadSavedLocation();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        coords,
        addressName,
        permissionGranted,
        loading,
        errorMsg,
        requestPermission,
        refreshLocation,
        updateLocation,
        useGpsLocation,
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
