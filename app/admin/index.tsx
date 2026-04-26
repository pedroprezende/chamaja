import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAdminAuthReal } from "@/lib/admin-auth-real";
import { ActivityIndicator, View } from "react-native";

export default function AdminIndexScreen() {
  const router = useRouter();
  const { user, isLoading } = useAdminAuthReal();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/admin/dashboard-admin");
      } else {
        router.replace("/admin/auth");
      }
    }
  }, [user, isLoading, router]);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}
