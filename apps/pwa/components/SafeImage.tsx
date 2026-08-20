import React, { useState, useEffect } from "react";
import {
  Image,
  ImageProps,
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface SafeImageProps extends ImageProps {
  fallbackIcon?: keyof typeof MaterialIcons.glyphMap;
  showLoading?: boolean;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  source,
  style,
  fallbackIcon = "person",
  showLoading = true,
  ...props
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset error state when source changes
  useEffect(() => {
    setError(false);
  }, [source]);

  // Check if source is empty
  const isEmpty =
    !source || (typeof source === "object" && !(source as any).uri);

  if (error || isEmpty) {
    return (
      <View style={[style, styles.fallbackContainer]}>
        <MaterialIcons name={fallbackIcon} size={24} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        {...props}
        source={source}
        style={[style, StyleSheet.absoluteFill]}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      {loading && showLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#25D366" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
});
