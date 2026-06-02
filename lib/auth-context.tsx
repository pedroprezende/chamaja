import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";
import { Platform } from "react-native";
import { setSessionToken, removeSessionToken } from "./_core/auth";
import { logger } from "./logger";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

WebBrowser.maybeCompleteAuthSession();

export type AuthProvider = "google" | "microsoft" | "apple" | "email";
export type UserRole = "admin" | "user";

export interface User {
  id: string; // Supabase UID (open_id no banco)
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  provider: AuthProvider;
  role: UserRole;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  updateProfile: (name: string, avatar?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função central para buscar a Role do banco de dados (Fonte da Verdade)
  const getCurrentUserRole = async (userId: string, email: string): Promise<UserRole> => {
    logger.info("AUTH", `Buscando role para usuário: ${email}`);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("open_id", userId)
        .single();

      if (error) {
        logger.warn("AUTH", "Role não encontrada por open_id, tentando fallback por e-mail", { userId, error });
        const { data: dataEmail, error: errorEmail } = await supabase
          .from("users")
          .select("role")
          .eq("email", email)
          .single();
        
        if (errorEmail) {
          logger.warn("AUTH", "Role não encontrada por e-mail, assumindo 'user'");
          return "user";
        }
        return (dataEmail.role as UserRole) || "user";
      }

      logger.info("AUTH", `Role recuperada com sucesso: ${data.role}`);
      return (data.role as UserRole) || "user";
    } catch (err) {
      logger.error("AUTH", "Falha crítica ao buscar role", err);
      return "user";
    }
  };

  const syncUserSession = async (session: any) => {
    if (!session?.user) {
      logger.info("AUTH", "Sessão vazia, limpando dados de usuário");
      setUser(null);
      await AsyncStorage.removeItem("@chamaja_user");
      await removeSessionToken();
      return;
    }

    const { user: authUser, access_token } = session;
    logger.info("AUTH", `Sincronizando sessão para: ${authUser.email}`);
    
    await setSessionToken(access_token);

    const userRole = await getCurrentUserRole(authUser.id, authUser.email || "");

    const dbUser: User = {
      id: authUser.id,
      email: authUser.email || "",
      name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Usuário",
      avatar: authUser.user_metadata?.avatar_url,
      provider: (authUser.app_metadata?.provider as AuthProvider) || "email",
      role: userRole,
      createdAt: authUser.created_at,
    };

    setUser(dbUser);
    await AsyncStorage.setItem("@chamaja_user", JSON.stringify(dbUser));
    logger.info("AUTH", "Sessão de usuário persistida com sucesso");
  };

  useEffect(() => {
    const restoreSession = async () => {
      logger.info("AUTH", "Iniciando restauração de sessão...");
      try {
        const cachedUser = await AsyncStorage.getItem("@chamaja_user");
        if (cachedUser) {
          logger.info("AUTH", "Usuário encontrado no cache");
          setUser(JSON.parse(cachedUser));
        }

        // Recupera sessão do Supabase com timeout de segurança de 5 segundos
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((_, reject) =>
            setTimeout(() => reject(new Error("Supabase getSession timeout")), 5000)
          )
        ]).catch(err => {
          logger.warn("AUTH", "Timeout ou falha ao obter sessão do Supabase", err);
          return { data: { session: null } };
        });

        const session = sessionResult.data?.session;
        if (session) {
          logger.info("AUTH", "Sessão válida encontrada no Supabase");
          // Sincroniza a sessão mas protege contra travamentos com timeout de 5 segundos
          await Promise.race([
            syncUserSession(session),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Sync user session timeout")), 5000)
            )
          ]).catch(err => {
            logger.warn("AUTH", "Sincronização lenta ou falhou durante inicialização", err);
          });
        } else {
          logger.info("AUTH", "Nenhuma sessão ativa encontrada");
          setUser(null);
          await removeSessionToken();
        }
      } catch (err) {
        logger.error("AUTH", "Erro crítico ao restaurar sessão", err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info("AUTH", `Evento Auth detectado: ${event}`);
        try {
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
            // Sincroniza sessão mas não deixa travar o app se demorar
            await Promise.race([
              syncUserSession(session),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
            ]).catch(err => logger.warn("AUTH", "Sincronização lenta ou falhou", err));
          } else if (event === "SIGNED_OUT") {
            setUser(null);
            await AsyncStorage.removeItem("@chamaja_user");
            await removeSessionToken();
          }
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Capture UTM Source on web platform load
  useEffect(() => {
    if (Platform.OS === "web") {
      try {
        const search = window?.location?.search;
        if (search) {
          const params = new URLSearchParams(search);
          const utm = params.get("utm_source");
          if (utm) {
            logger.info("AUTH", `UTM Source detectado: ${utm}`);
            AsyncStorage.setItem("utm_source", utm).catch(() => {});
          }
        }
      } catch (err) {
        logger.warn("AUTH", "Erro ao tentar obter utm_source da URL", err);
      }
    }
  }, []);

  const refreshRole = async () => {
    if (user) {
      logger.info("AUTH", "Recarregando permissões do usuário...");
      const newRole = await getCurrentUserRole(user.id, user.email);
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      await AsyncStorage.setItem("@chamaja_user", JSON.stringify(updatedUser));
    }
  };

  const performOAuth = async (provider: "google" | "azure" | "apple") => {
    logger.info("AUTH", `Iniciando login OAuth com: ${provider}`);
    try {
      const redirectTo = Platform.OS === "web"
        ? `${window.location.origin}/oauth/callback`
        : Linking.createURL("/oauth/callback");
        
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== "web",
        },
      });

      if (error) throw error;

      if (Platform.OS !== "web" && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        logger.info("AUTH", `Resultado do WebBrowser: ${result.type}`);
        
        if (result.type === "success" && result.url) {
          const url = result.url.replace("#", "?");
          const params = Linking.parse(url).queryParams;
          const accessToken = params?.access_token as string;
          const refreshToken = params?.refresh_token as string;

          if (accessToken && refreshToken) {
            logger.info("AUTH", "Token recebido via OAuth, estabelecendo sessão...");
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    } catch (error) {
      logger.error("AUTH", `Falha no login com ${provider}`, error);
      throw error;
    }
  };

  const signInWithGoogle = async () => performOAuth("google");
  const signInWithMicrosoft = async () => performOAuth("azure");
  const signInWithApple = async () => { 
    logger.info("AUTH", "Iniciando login com Apple...");
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        logger.warn("AUTH", "Apple Authentication não está disponível neste dispositivo");
        // Fallback para o fluxo Web/OAuth normal
        await performOAuth("apple");
        return;
      }

      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error("Token de identidade da Apple não recebido");
      }

      logger.info("AUTH", "Autenticando no Supabase com token da Apple...");
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (error) throw error;

      if (data?.session) {
        // Se for o primeiro login, a Apple retorna o nome do usuário no credential.fullName
        const nameObj = credential.fullName;
        if (nameObj && (nameObj.givenName || nameObj.familyName)) {
          const fullName = [nameObj.givenName, nameObj.familyName].filter(Boolean).join(" ");
          if (fullName) {
            logger.info("AUTH", `Salvando nome recebido da Apple: ${fullName}`);
            await supabase.auth.updateUser({
              data: { full_name: fullName }
            });
            
            const updatedSession = {
              ...data.session,
              user: {
                ...data.session.user,
                user_metadata: {
                  ...data.session.user.user_metadata,
                  full_name: fullName
                }
              }
            };
            await syncUserSession(updatedSession);
            return;
          }
        }
        await syncUserSession(data.session);
      }
    } catch (error) {
      logger.error("AUTH", "Falha no login com Apple", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    logger.info("AUTH", `Iniciando cadastro por e-mail: ${email}`);
    
    let utmSource: string | null = null;
    try {
      utmSource = await AsyncStorage.getItem("utm_source");
    } catch (e) {
      logger.warn("AUTH", "Erro ao recuperar utm_source do cache");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: name,
          ...(utmSource ? { utm_source: utmSource } : {})
        } 
      },
    });
    if (error) {
      logger.error("AUTH", "Erro no cadastro por e-mail", error);
      throw error;
    }

    if (data?.session) {
      await syncUserSession(data.session);
    } else {
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!signInError && signInData?.session) {
          await syncUserSession(signInData.session);
        }
      } catch (e) {
        logger.warn("AUTH", "Auto-login pós-cadastro falhou ou exige confirmação de e-mail");
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    logger.info("AUTH", `Iniciando login por e-mail: ${email}`);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      logger.error("AUTH", "Erro no login por e-mail", error);
      throw error;
    }
  };

  const signOut = async () => {
    logger.info("AUTH", "Iniciando logout (otimista)...");
    try {
      // Limpa o estado local imediatamente para feedback visual instantâneo
      setUser(null);
      await AsyncStorage.removeItem("@chamaja_user");
      await removeSessionToken();
      
      // Faz a chamada de rede
      await supabase.auth.signOut();
      logger.info("AUTH", "Logout no servidor concluído");
    } catch (error) {
      logger.error("AUTH", "Erro ao comunicar logout ao servidor", error);
    }
  };

  const updateProfile = async (name: string, avatar?: string) => {
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name, avatar_url: avatar },
    });
    if (error) throw error;
  };

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    isAdmin: user?.role === "admin" || user?.email === "pedroprezende33@gmail.com",
    isLoading,
    isSignedIn: user !== null,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithApple,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    refreshRole,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth();
  return isAdmin;
}
