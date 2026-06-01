import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

export default function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isLoading]);

  if (isLoading || !isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="login-real" />
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="dashboard-funcional" />
      <Stack.Screen name="dashboard-admin" />
      <Stack.Screen name="users" />
      <Stack.Screen name="professionals" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="utm" />
      <Stack.Screen name="ads" />
      <Stack.Screen name="services" />
      <Stack.Screen name="providers" />
      <Stack.Screen name="subcategory-images" />
      <Stack.Screen name="regioes" />
      <Stack.Screen name="servicos-admin" />
      <Stack.Screen name="prestadores-admin" />
      <Stack.Screen name="destaques-admin" />
      <Stack.Screen name="editar-prestador" />
    </Stack>
  );
}
