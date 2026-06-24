import { ThemedView } from "@/components/themed-view";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OAuthCallback() {
  const router = useRouter();
  const { isSignedIn, isLoading, user } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (isSignedIn) {
      console.log("[OAuth Callback] Sessão encontrada e processada via AuthContext:", user?.email);
      setStatus("success");
      
      const checkRedirect = async () => {
        try {
          const isBusinessFlag = await AsyncStorage.getItem("@chamaja_login_as_business");
          if (isBusinessFlag === "true") {
            router.replace("/become-provider" as any);
          } else {
            router.replace("/(tabs)");
          }
        } catch {
          router.replace("/(tabs)");
        }
      };

      setTimeout(() => {
        checkRedirect();
      }, 1000);
    } else {
      console.log("[OAuth Callback] Nenhuma sessão ativa encontrada.");
      setStatus("error");
      setErrorMessage("Nenhum token de autenticação recebido.");
      
      setTimeout(() => {
        router.replace("/auth/login");
      }, 3000);
    }
  }, [isLoading, isSignedIn, router, user]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" color="#25D366" />
            <Text className="mt-4 text-base leading-6 text-center text-foreground">
              Completando a autenticação...
            </Text>
          </>
        )}
        {status === "success" && (
          <>
            <Text className="text-base leading-6 text-center text-foreground">
              Autenticação concluída!
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              Redirecionando...
            </Text>
          </>
        )}
        {status === "error" && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">
              Falha na Autenticação
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              {errorMessage}
            </Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
