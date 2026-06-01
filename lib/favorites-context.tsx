import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./auth-context";
import { trpc } from "./trpc";

export interface FavoriteProfessional {
  id: string;
  name: string;
  category: string;
  city: string;
  avatar: string;
  rating: number;
  phone: string;
  type: "free" | "premium";
  latitude?: number | null;
  longitude?: number | null;
}

interface FavoritesContextType {
  favorites: FavoriteProfessional[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (pro: FavoriteProfessional) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAV_KEY = "@chamaja_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProfessional[]>([]);

  // Fetch favorites from database when user is signed in
  const { data: serverFavorites, refetch } = trpc.favorites.list.useQuery(undefined, {
    enabled: isSignedIn,
  });

  const toggleMutation = trpc.favorites.toggle.useMutation();

  // Sync favorites when login state or server data changes
  useEffect(() => {
    if (isSignedIn) {
      if (serverFavorites) {
        setFavorites(serverFavorites);
      }
    } else {
      // User is guest, load local favorites from AsyncStorage
      (async () => {
        try {
          const favRaw = await AsyncStorage.getItem(FAV_KEY);
          if (favRaw) {
            setFavorites(JSON.parse(favRaw));
          } else {
            setFavorites([]);
          }
        } catch {}
      })();
    }
  }, [isSignedIn, serverFavorites]);

  // Premium feature: Sync local favorites to database on sign-in
  useEffect(() => {
    if (isSignedIn && serverFavorites) {
      (async () => {
        try {
          const favRaw = await AsyncStorage.getItem(FAV_KEY);
          if (favRaw) {
            const localFavs: FavoriteProfessional[] = JSON.parse(favRaw);
            if (localFavs.length > 0) {
              // Toggle each local favorite that is not already in serverFavorites
              for (const pro of localFavs) {
                const isAlreadyServerFav = serverFavorites.some(f => f.id === pro.id);
                if (!isAlreadyServerFav) {
                  try {
                    await toggleMutation.mutateAsync({ providerId: pro.id });
                  } catch (e) {
                    console.warn(`[FavoritesContext] Syncing provider ${pro.id} failed:`, e);
                  }
                }
              }
              // Clear local AsyncStorage favorites after sync
              await AsyncStorage.removeItem(FAV_KEY);
              refetch();
            }
          }
        } catch (err) {
          console.warn("[FavoritesContext] Failed to sync local favorites to DB:", err);
        }
      })();
    }
  }, [isSignedIn, !!serverFavorites]);

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  const toggleFavorite = async (pro: FavoriteProfessional) => {
    // 1. Calculate the new local favorites state (optimistic update)
    let updated: FavoriteProfessional[];
    const currentlyFav = isFavorite(pro.id);
    if (currentlyFav) {
      updated = favorites.filter((f) => f.id !== pro.id);
    } else {
      updated = [...favorites, pro];
    }
    
    // 2. Set state immediately for smooth UI transition
    setFavorites(updated);

    if (isSignedIn) {
      // 3a. If logged in, call database mutation and then refetch to sync
      try {
        await toggleMutation.mutateAsync({ providerId: pro.id });
        refetch();
      } catch (err) {
        console.error("[FavoritesContext] Failed to toggle favorite in database:", err);
        // Rollback on error
        refetch();
      }
    } else {
      // 3b. If guest, write to local storage
      try {
        await AsyncStorage.setItem(FAV_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("[FavoritesContext] Failed to write local favorites:", err);
      }
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  return ctx;
}
