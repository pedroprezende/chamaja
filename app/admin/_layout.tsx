import { Stack } from "expo-router";
import { AdminProvider } from "@/lib/admin-context";
import { AdminAuthProvider } from "@/lib/admin-auth-context";

export default function AdminLayout() {
  return (
    <AdminAuthProvider>
      <AdminProvider>
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
        </Stack>
      </AdminProvider>
    </AdminAuthProvider>
  );
}
