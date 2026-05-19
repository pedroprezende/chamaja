import { ThemedView } from "@/components/themed-view";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("[OAuth Callback] Verificando URL...");
        
        // No navegador (Web), o Supabase processa automaticamente os tokens na hash (#access_token=...)
        // ao inicializar ou ao chamar getSession()
        console.log("[OAuth Callback] Verificando sessão...");
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[OAuth Callback] Erro ao obter sessão:", error);
          throw error;
        }

        if (session) {
          console.log("[OAuth Callback] Sessão encontrada e processada");
          setStatus("success");
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 1000);
          return;
        }
        
        // Se não encontrou token (pode ser o App Nativo onde o deep link é resolvido no AuthContext)
        console.log("[OAuth Callback] Nenhum token direto na URL. Verificando estado atual...");
        
        // Verifica se já não foi autenticado (fallback)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          setStatus("success");
          router.replace("/(tabs)");
          return;
        }

        // Se realmente não tiver nada, joga erro
        setStatus("error");
        setErrorMessage("Nenhum token de autenticação recebido.");
        
        // Redireciona de volta para login após falha
        setTimeout(() => {
          router.replace("/auth/login");
        }, 3000);
        
      } catch (error) {
        console.error("[OAuth Callback] Erro geral:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Falha ao completar a autenticação"
        );
        setTimeout(() => {
          router.replace("/auth/login");
        }, 3000);
      }
    };

    handleCallback();
  }, [router]);

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
