import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocation } from "./location-context";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUri?: string;
}

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUri?: string;
}

interface CartContextType {
  items: CartItem[];
  merchantId: string | null;
  notes: string;
  deliveryAddress: string;
  setNotes: (notes: string) => void;
  setDeliveryAddress: (address: string) => void;
  addToCart: (merchantId: string, product: CartProduct, quantity?: number, force?: boolean) => boolean;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "@chamaja_cart_state";

export function CartProvider({ children }: { children: ReactNode }) {
  const { addressName } = useLocation();
  const [items, setItems] = useState<CartItem[]>([]);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");

  // Inicializa o endereço com o LocationProvider se estiver vazio
  useEffect(() => {
    if (addressName && !deliveryAddress) {
      setDeliveryAddress(addressName);
    }
  }, [addressName]);

  // Carrega o carrinho do cache ao iniciar
  useEffect(() => {
    const loadCart = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setItems(parsed.items || []);
          setMerchantId(parsed.merchantId || null);
          setNotes(parsed.notes || "");
          if (parsed.deliveryAddress) {
            setDeliveryAddress(parsed.deliveryAddress);
          }
        }
      } catch (e) {
        console.error("[CartContext] Failed to load cart:", e);
      }
    };
    loadCart();
  }, []);

  // Salva no AsyncStorage quando houver mudanças
  const saveCart = async (newItems: CartItem[], newMerchantId: string | null, newNotes: string, newAddress: string) => {
    try {
      const payload = {
        items: newItems,
        merchantId: newMerchantId,
        notes: newNotes,
        deliveryAddress: newAddress
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("[CartContext] Failed to save cart:", e);
    }
  };

  const addToCart = (
    targetMerchantId: string,
    product: CartProduct,
    quantity: number = 1,
    force: boolean = false
  ): boolean => {
    // Se já existem itens e são de outro comerciante
    if (items.length > 0 && merchantId !== targetMerchantId) {
      if (!force) {
        return false; // Retorna falso indicando conflito de estabelecimento
      }
      // Se forçado (ex: usuário aceitou limpar o carrinho), limpa tudo
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        imageUri: product.imageUri
      };
      const newItems = [newItem];
      setItems(newItems);
      setMerchantId(targetMerchantId);
      setNotes("");
      saveCart(newItems, targetMerchantId, "", deliveryAddress);
      return true;
    }

    // Adiciona ou incrementa o item no carrinho
    let newItems = [...items];
    const existingIndex = items.findIndex((item) => item.id === product.id);

    if (existingIndex > -1) {
      newItems[existingIndex].quantity += quantity;
    } else {
      newItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        imageUri: product.imageUri
      });
    }

    setItems(newItems);
    setMerchantId(targetMerchantId);
    saveCart(newItems, targetMerchantId, notes, deliveryAddress);
    return true;
  };

  const removeFromCart = (itemId: string) => {
    const newItems = items.filter((item) => item.id !== itemId);
    const newMerchantId = newItems.length === 0 ? null : merchantId;
    
    setItems(newItems);
    setMerchantId(newMerchantId);
    saveCart(newItems, newMerchantId, notes, deliveryAddress);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setItems(newItems);
    saveCart(newItems, merchantId, notes, deliveryAddress);
  };

  const clearCart = () => {
    setItems([]);
    setMerchantId(null);
    setNotes("");
    saveCart([], null, "", deliveryAddress);
  };

  const handleSetNotes = (val: string) => {
    setNotes(val);
    saveCart(items, merchantId, val, deliveryAddress);
  };

  const handleSetAddress = (val: string) => {
    setDeliveryAddress(val);
    saveCart(items, merchantId, notes, val);
  };

  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        merchantId,
        notes,
        deliveryAddress,
        setNotes: handleSetNotes,
        setDeliveryAddress: handleSetAddress,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
