import { Stack } from "expo-router";

export default function AdminLayout() {
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
      <Stack.Screen name="ads" />
      <Stack.Screen name="services" />
    </Stack>
  );
}
