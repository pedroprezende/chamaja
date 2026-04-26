import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { ActivityIndicator, View, Text } from "react-native";

const ADMIN_EMAIL = "pedroprezende33@gmail.com";

export default function AdminIndexScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Não está logado — redireciona para o login principal do app
        router.replace("/auth/login");
      } else if (user.email === ADMIN_EMAIL) {
        // É o admin — abre o dashboard diretamente
        router.replace("/admin/dashboard-admin");
      } else {
        // Está logado mas não é admin
        router.replace("/(tabs)");
      }
    }
  }, [user, isLoading, router]);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#2563EB" />
      <Text className="mt-4 text-gray-500 text-sm">Verificando acesso...</Text>
    </View>
  );
}
