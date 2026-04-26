import { Stack } from "expo-router";
import { AdminProvider } from "@/lib/admin-context";

export default function AdminLayout() {
  return (
    <AdminProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="users" />
        <Stack.Screen name="professionals" />
        <Stack.Screen name="locations" />
        <Stack.Screen name="payments" />
      </Stack>
    </AdminProvider>
  );
}
