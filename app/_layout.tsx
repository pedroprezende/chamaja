import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform, View } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { useColors } from "@/hooks/use-colors";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProviderContextProvider, useProvider } from "@/lib/provider-context";
import { FavoritesProvider } from "@/lib/favorites-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { CartProvider } from "@/lib/cart-context";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LocationProvider } from "@/lib/location-context";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  const { isSignedIn, isLoading } = useAuth();
  const { provider, isLoading: isProviderLoading } = useProvider();
  const segments = useSegments();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || isLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const path = segments.join("/");

    if (!isSignedIn && !inAuthGroup) {
      if (path !== "oauth/callback" && path !== "") {
        router.replace("/auth/login" as any);
      } else if (path === "") {
        router.replace("/auth/login" as any);
      }
    } else if (isSignedIn) {
      (async () => {
        try {
          const isBusinessFlag = await AsyncStorage.getItem("@chamaja_login_as_business");
          if (isBusinessFlag === "true") {
            const currentPath = segments.join("/");
            if (currentPath !== "provider-dashboard" && currentPath !== "become-provider") {
              if (isProviderLoading) return;
              if (provider) {
                router.replace("/provider-dashboard" as any);
              } else {
                router.replace("/become-provider" as any);
              }
            }
          } else if (inAuthGroup) {
            router.replace("/(tabs)" as any);
          }
        } catch {
          if (inAuthGroup) {
            router.replace("/(tabs)" as any);
          }
        }
      })();
    }
  }, [isSignedIn, isLoading, segments, router, hasMounted, provider, isProviderLoading]);

  if (!hasMounted || isLoading) {
    return null;
  }

  return (
    <>
      <StatusBar 
        style="dark" 
        backgroundColor="transparent" 
        translucent={true} 
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="oauth/callback" />
        <Stack.Screen name="professionals/[category]" />
        <Stack.Screen name="categories/[section]" />
        <Stack.Screen name="professional/[id]/index" />
        <Stack.Screen name="professional/[id]/menu" />
        <Stack.Screen name="professional/[id]/cart" />
        <Stack.Screen name="professional/[id]/whatsapp-order" />
        <Stack.Screen name="become-provider" />
        <Stack.Screen name="provider-dashboard" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="admin-services/[serviceId]" />
      </Stack>
    </>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  
  return (
    <View style={[
      Platform.OS === 'web' ? {
        flex: 1,
        backgroundColor: "#E5E7EB", // Light gray for web outer area
        alignItems: 'center',
        justifyContent: 'center',
      } : { flex: 1 }
    ]}>
      <View style={[
        Platform.OS === 'web' ? {
          width: '100%',
          maxWidth: 500,
          height: '100dvh' as any,
          backgroundColor: colors.background,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 10,
        } : { flex: 1 }
      ]}>
        {children}
      </View>
    </View>
  );
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 60 * 5, // 5 minutos
            gcTime: 1000 * 60 * 10, // 10 minutos
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <LocationProvider>
              <AuthProvider>
                <ProviderContextProvider>
                  <FavoritesProvider>
                    <NotificationsProvider>
                      <CartProvider>
                        <MainContent>
                          <RootLayoutNav />
                        </MainContent>
                      </CartProvider>
                    </NotificationsProvider>
                  </FavoritesProvider>
                </ProviderContextProvider>
              </AuthProvider>
            </LocationProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        {shouldOverrideSafeArea ? (
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        ) : (
          content
        )}
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
