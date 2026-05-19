import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@chamaja_notifications";

export type NotificationType = "info" | "promo" | "order" | "review" | "welcome";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const WELCOME_NOTIFICATIONS: AppNotification[] = [
  {
    id: "welcome-1",
    type: "welcome",
    title: "Bem-vindo ao ChamaJá! 🎉",
    body: "Encontre os melhores profissionais da sua região com facilidade.",
    time: "Agora",
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: "welcome-2",
    type: "info",
    title: "Dica: Use o WhatsApp",
    body: "Toque em 'Chamar no WhatsApp' no perfil de qualquer profissional para entrar em contato direto.",
    time: "Agora",
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: "welcome-3",
    type: "promo",
    title: "Seja um prestador!",
    body: "Cadastre-se como prestador por apenas R$10/mês e comece a receber clientes.",
    time: "Agora",
    createdAt: new Date().toISOString(),
    read: false,
  },
];

function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return date.toLocaleDateString("pt-BR");
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: AppNotification[] = JSON.parse(stored);
          // Refresh relative times
          const refreshed = parsed.map((n) => ({
            ...n,
            time: formatRelativeTime(n.createdAt),
          }));
          setNotifications(refreshed);
        } else {
          // First time — seed welcome notifications
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(WELCOME_NOTIFICATIONS));
          setNotifications(WELCOME_NOTIFICATIONS);
        }
      } catch {
        setNotifications(WELCOME_NOTIFICATIONS);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const save = useCallback(async (list: AppNotification[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }, []);

  const addNotification = useCallback(
    async (n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
      const newNotif: AppNotification = {
        ...n,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        save(updated);
        return updated;
      });
    },
    [save]
  );

  const markRead = useCallback(
    async (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        save(updated);
        return updated;
      });
    },
    [save]
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      save(updated);
      return updated;
    });
  }, [save]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clearAll }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
