import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { ActivityIndicator, View, Text } from "react-native";
import { initDatabase } from "@/lib/db";

export default function AdminIndexScreen() {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    initDatabase();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/auth/login");
      } else if (isAdmin) {
        router.replace("/admin/dashboard-admin");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [user, isLoading, isAdmin, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
      }}
    >
      <ActivityIndicator size="large" color="#25D366" />
      <Text style={{ marginTop: 16, color: "#6B7280", fontSize: 14 }}>
        Verificando acesso...
      </Text>
    </View>
  );
}
