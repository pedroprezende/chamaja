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

export interface OrderRecord {
  id: string;
  professionalId: string;
  professionalName: string;
  category: string;
  avatar: string;
  phone: string;
  contactedAt: string;
  status: "contacted" | "in_progress" | "completed";
}

interface FavoritesContextType {
  favorites: FavoriteProfessional[];
  orders: OrderRecord[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (pro: FavoriteProfessional) => Promise<void>;
  addOrder: (pro: Omit<OrderRecord, "id" | "contactedAt" | "status">) => Promise<void>;
  clearOrders: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAV_KEY = "@chamaja_favorites";
const ORDERS_KEY = "@chamaja_orders";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProfessional[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [favRaw, ordRaw] = await Promise.all([
          AsyncStorage.getItem(FAV_KEY),
          AsyncStorage.getItem(ORDERS_KEY),
        ]);
        if (favRaw) setFavorites(JSON.parse(favRaw));
        if (ordRaw) setOrders(JSON.parse(ordRaw));
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

  const addOrder = async (pro: Omit<OrderRecord, "id" | "contactedAt" | "status">) => {
    // Evita duplicar pedidos do mesmo profissional no mesmo dia
    const today = new Date().toDateString();
    const alreadyToday = orders.some(
      (o) => o.professionalId === pro.professionalId && new Date(o.contactedAt).toDateString() === today
    );
    if (alreadyToday) return;
    const newOrder: OrderRecord = {
      ...pro,
      id: `ord-${Date.now()}`,
      contactedAt: new Date().toISOString(),
      status: "contacted",
    };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  };

  const clearOrders = async () => {
    setOrders([]);
    await AsyncStorage.removeItem(ORDERS_KEY);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, orders, isFavorite, toggleFavorite, addOrder, clearOrders }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  return ctx;
}
