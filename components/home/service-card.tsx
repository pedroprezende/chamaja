import React, { memo } from "react";
import { View, Text, Pressable, Image, StyleSheet, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

interface ServiceCardProps {
  id: string;
  name: string;
  category: string;
  imageUri?: string;
  whatsapp?: string;
  type?: "SERVICE" | "PROVIDER";
  rating?: number;
  onWhatsAppPress?: () => void;
}

export const ServiceCard = memo(({ 
  id, 
  name, 
  category, 
  imageUri, 
  whatsapp, 
  type = "SERVICE",
  rating = 5,
  onWhatsAppPress 
}: ServiceCardProps) => {
  const colors = useColors();
  const router = useRouter();

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === "SERVICE") {
      router.push({
        pathname: "/admin-services/[serviceId]",
        params: { serviceId: id, title: name },
      } as any);
    } else {
      router.push(`/professional/${id}` as any);
    }
  };

  const handleWhatsApp = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onWhatsAppPress?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
      ]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.iconBg, { backgroundColor: colors.background }]}>
            <MaterialIcons name="work" size={32} color={colors.primary} />
          </View>
        )}
        {rating > 0 && (
          <View style={[styles.ratingBadge, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="star" size={10} color="#FFFFFF" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.category, { color: colors.primary }]} numberOfLines={1}>
          {category}
        </Text>
      </View>

      {whatsapp && (
        <Pressable
          style={({ pressed }) => [
            styles.whatsappBtn,
            pressed && { opacity: 0.7, transform: [{ scale: 1.1 }] }
          ]}
          onPress={handleWhatsApp}
        >
          <MaterialIcons name="chat" size={14} color="#FFFFFF" />
        </Pressable>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 140,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  imageContainer: {
    width: "100%",
    height: 100,
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  iconBg: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  info: {
    padding: 10,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
  },
  category: {
    fontSize: 11,
    fontWeight: "600",
  },
  whatsappBtn: {
    position: "absolute",
    bottom: 38,
    right: 8,
    backgroundColor: "#25D366",
    borderRadius: 12,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
