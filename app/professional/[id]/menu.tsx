import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { useCart, CartProduct } from "@/lib/cart-context";

export default function MenuScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { items: cartItems, cartTotal, cartCount, addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("Tudo");

  // Busca detalhes do comércio
  const { data: professional, isLoading } = trpc.providers.getById.useQuery(
    id as string,
    {
      enabled: !!id,
    },
  );

  // Parse dos produtos
  const products = useMemo(() => {
    if (!professional || !professional.services) return [];
    try {
      const parsed =
        typeof professional.services === "string"
          ? JSON.parse(professional.services)
          : professional.services;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse products:", e);
      return [];
    }
  }, [professional]);

  const isRealCommerce = useMemo(() => {
    if (!professional) return false;
    return (
      professional.categoryId === "comercios" ||
      professional.category === "Comércios" ||
      professional.category === "comercios"
    );
  }, [professional]);

  // Dynamic label based on subcategoryId / type
  const menuLabel = useMemo(() => {
    const sub = (professional?.subcategoryId || "").toLowerCase();
    const foodSubs = new Set(["pizzaria", "restaurante", "hamburgueria", "lanchonete", "sushi", "churrascaria", "cafeteria", "padaria", "sorveteria", "bar", "buffet", "cantina", "food-truck", "doceria", "marmitaria"]);
    if (foodSubs.has(sub)) return { title: "Cardápio", icon: "restaurant" };
    if (professional?.categoryId === "beleza-estetica") return { title: "Serviços e Preços", icon: "content-cut" };
    if (professional?.categoryId === "saude") return { title: "Especialidades", icon: "medical-services" };
    if (professional?.categoryId === "academias" || sub === "academia") return { title: "Planos e Modalidades", icon: "fitness-center" };
    if (professional?.categoryId === "comercios") return { title: "Catálogo de Produtos", icon: "inventory-2" };
    return { title: "Serviços e Preços", icon: "assignment" };
  }, [professional]);
  // Categorias de produtos dinâmicas
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("Tudo");
    products.forEach((p: any) => {
      if (p.productCategory) {
        cats.add(p.productCategory);
      } else {
        cats.add("Outros");
      }
    });
    return Array.from(cats);
  }, [products]);

  // Filtragem de produtos por aba selecionada
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Tudo") return products;
    return products.filter((p: any) => {
      const cat = p.productCategory || "Outros";
      return cat === selectedCategory;
    });
  }, [products, selectedCategory]);

  const handleAddProduct = (product: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      imageUri: product.imageUri,
    };

    const success = addToCart(id as string, cartProduct, 1, false);

    if (!success) {
      Alert.alert(
        "Novo carrinho?",
        "Você já possui itens de outro estabelecimento no carrinho. Deseja limpar seu carrinho atual e iniciar um novo pedido aqui?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Limpar e Adicionar",
            style: "destructive",
            onPress: () => {
              addToCart(id as string, cartProduct, 1, true);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            },
          },
        ],
      );
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          Carregando cardápio...
        </Text>
      </View>
    );
  }

  if (!professional) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <MaterialIcons name="error-outline" size={48} color={colors.muted} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Comércio não encontrado
        </Text>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.foreground}
          />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text
            style={[styles.headerTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {menuLabel.title}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.muted }]}
            numberOfLines={1}
          >
            {professional.name}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(`/professional/${id}/cart` as any)}
          style={styles.headerCartBtn}
        >
          <MaterialIcons
            name="shopping-basket"
            size={22}
            color={colors.foreground}
          />
          {cartCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Tabs de Categorias */}
      <View
        style={[
          styles.categoriesContainer,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryTab,
                  isSelected && { borderBottomColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    { color: isSelected ? colors.primary : colors.muted },
                    isSelected && { fontWeight: "700" },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Produtos */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: cartCount > 0 ? 120 : 40 }}
        renderItem={({ item }) => {
          const cartItem = cartItems.find((ci) => ci.id === item.id);
          const quantityInCart = cartItem ? cartItem.quantity : 0;

          return (
            <View
              style={[
                styles.productCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {item.imageUri ? (
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.productImage}
                />
              ) : (
                <View
                  style={[
                    styles.productImage,
                    {
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.border + "40",
                    },
                  ]}
                >
                  <MaterialIcons
                    name={menuLabel.icon as any}
                    size={28}
                    color={colors.muted}
                  />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text
                  style={[styles.productName, { color: colors.foreground }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[styles.productDesc, { color: colors.muted }]}
                  numberOfLines={2}
                >
                  {item.description || "Sem descrição disponível."}
                </Text>
                <Text
                  style={[styles.productPrice, { color: colors.foreground }]}
                >
                  R$ {Number(item.price || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.actionContainer}>
                {quantityInCart > 0 ? (
                  <View
                    style={[
                      styles.quantityBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.quantityBadgeText}>
                      {quantityInCart}x
                    </Text>
                  </View>
                ) : null}
                <Pressable
                  style={({ pressed }) => [
                    styles.addBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => handleAddProduct(item)}
                >
                  <MaterialIcons name="add" size={20} color="#FFF" />
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Nenhum produto nesta categoria.
            </Text>
          </View>
        }
      />

      {/* Resumo do Carrinho Flutuante */}
      {cartCount > 0 && (
        <View
          style={[
            styles.cartBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.cartBarButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push(`/professional/${id}/cart` as any)}
          >
            <View style={styles.cartBarLeft}>
              <View style={styles.cartBarCount}>
                <Text style={styles.cartBarCountText}>{cartCount}</Text>
              </View>
              <Text style={styles.cartBarTotal}>
                Total: R$ {cartTotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.cartBarRight}>
              <Text style={styles.cartBarText}>Ver carrinho</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "700",
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: "#FFF",
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerCartBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
  },
  categoriesContainer: {
    borderBottomWidth: 1,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  productCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    gap: 3,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
  },
  productDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  actionContainer: {
    alignItems: "center",
    gap: 6,
  },
  quantityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  quantityBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
  cartBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  cartBarButton: {
    flexDirection: "row",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cartBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cartBarCount: {
    backgroundColor: "rgba(255,255,255,0.2)",
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBarCountText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  cartBarTotal: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  cartBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cartBarText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
