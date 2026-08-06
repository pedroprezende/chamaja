import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform, View, ActivityIndicator, Text } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { useColors } from "@/hooks/use-colors";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProviderContextProvider, useProvider } from "@/lib/provider-context";
import InitialLoadingScreen from "@/components/initial-loading-screen";
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
import {
  initManusRuntime,
  subscribeSafeAreaInsets,
  isRunningInPreviewIframe,
} from "@/lib/_core/manus-runtime";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LocationProvider, useLocation } from "@/lib/location-context";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  const { isSignedIn, isLoading: isAuthLoading } = useAuth();
  const { provider, isLoading: isProviderLoading } = useProvider();
  const { loading: isLocationLoading } = useLocation();
  const segments = useSegments();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Safety timeout: if loading takes more than 8 seconds, force render
  useEffect(() => {
    if (!isAuthLoading && !isLocationLoading) return;
    const timer = setTimeout(() => {
      console.warn(
        "[RootLayoutNav] Loading timed out after 8s, forcing render",
      );
      setLoadingTimedOut(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [isAuthLoading, isLocationLoading]);

  const appIsLoading = (isAuthLoading || isLocationLoading) && !loadingTimedOut;
  const shouldRender = hasMounted && !appIsLoading;

  useEffect(() => {
    if (!shouldRender) return;
    // Prevent multiple navigations in the same render cycle
    if (hasNavigated.current) return;

    const inAuthGroup = segments[0] === "auth";
    const path = segments.join("/");

    // Rotas públicas que visitantes/não-autenticados podem navegar livremente no PWA
    const isPublicRoute =
      segments[0] === "professional" ||
      segments[0] === "professionals" ||
      segments[0] === "categories" ||
      segments[0] === "reviews" ||
      segments[0] === "(tabs)" ||
      !segments[0];

    if (!isSignedIn && !inAuthGroup && !isPublicRoute) {
      if (path !== "oauth/callback" && path !== "") {
        hasNavigated.current = true;
        router.replace("/auth/login" as any);
      }
    } else if (isSignedIn) {
      // User is signed in — redirect to appropriate dashboard or home
      (async () => {
        try {
          const isBusinessFlag = await AsyncStorage.getItem(
            "@chamaja_login_as_business",
          );
          const isBusiness = isBusinessFlag === "true";
          const firstSegment = segments[0] as string | undefined;
          const segmentsLength = segments.length as number;
          const inTabsGroup =
            firstSegment === "(tabs)" || segmentsLength === 0 || !firstSegment;

          if (isBusiness && (inAuthGroup || inTabsGroup)) {
            // Se for negócio e estiver no grupo de autenticação ou de abas comuns, redireciona para a área de prestador
            if (isProviderLoading && !loadingTimedOut) {
              return;
            }
            hasNavigated.current = true;
            if (provider) {
              if (provider.status === "pendente" || !provider.isActive) {
                router.replace("/become-provider" as any);
              } else {
                router.replace("/provider-dashboard" as any);
              }
            } else {
              router.replace("/register-professional" as any);
            }
          } else if (
            !isBusiness &&
            (inAuthGroup || segments[0] === "provider-dashboard")
          ) {
            // Se não for negócio mas tentar acessar login/painel do prestador, redireciona para a home
            hasNavigated.current = true;
            router.replace("/(tabs)" as any);
          }
        } catch {
          hasNavigated.current = true;
          router.replace("/(tabs)" as any);
        } finally {
          // Allow future navigations on dependency changes
          setTimeout(() => {
            hasNavigated.current = false;
          }, 100);
        }
      })();
    }
  }, [
    isSignedIn,
    isAuthLoading,
    isLocationLoading,
    segments,
    router,
    shouldRender,
    provider,
    isProviderLoading,
    loadingTimedOut,
  ]);

  if (!shouldRender) {
    return <InitialLoadingScreen />;
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
        <Stack.Screen name="appointments" />
        <Stack.Screen name="professional/[id]/schedule" />
        <Stack.Screen name="provider-agenda" />
      </Stack>
    </>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const colors = useColors();

  return (
    <View
      style={[
        Platform.OS === "web"
          ? {
              flex: 1,
              backgroundColor: "#E5E7EB", // Light gray for web outer area
              alignItems: "center",
              justifyContent: "center",
            }
          : { flex: 1 },
      ]}
    >
      <View
        style={[
          Platform.OS === "web"
            ? {
                width: "100%",
                maxWidth: 500,
                height: "100%",
                backgroundColor: colors.background,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
                elevation: 10,
              }
            : { flex: 1 },
        ]}
      >
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
    const metrics = initialWindowMetrics ?? {
      insets: initialInsets,
      frame: initialFrame,
    };
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

  const shouldOverrideSafeArea = Platform.OS === "web" && isRunningInPreviewIframe();

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
