import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface FavoriteProfessional {
  id: string;
  name: string;
  category: string;
  city: string;
  avatar: string;
  rating: number;
  phone: string;
  type: "free" | "premium";
}

interface FavoritesContextType {
  favorites: FavoriteProfessional[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (pro: FavoriteProfessional) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAV_KEY = "@chamaja_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProfessional[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const favRaw = await AsyncStorage.getItem(FAV_KEY);
        if (favRaw) setFavorites(JSON.parse(favRaw));
      } catch {}
    })();
  }, []);

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  const toggleFavorite = async (pro: FavoriteProfessional) => {
    let updated: FavoriteProfessional[];
    if (isFavorite(pro.id)) {
      updated = favorites.filter((f) => f.id !== pro.id);
    } else {
      updated = [...favorites, pro];
    }
    setFavorites(updated);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(updated));
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
