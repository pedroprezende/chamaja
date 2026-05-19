import React, { memo } from "react";
import { View, Text, Pressable, Image, StyleSheet, FlatList, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

interface SubCategory {
  id: string;
  name: string;
  imageUrl?: string;
  icon?: string;
  categoryId: string;
}

interface CategoryBlockProps {
  category: {
    id: string;
    name: string;
  };
  subCategories: SubCategory[];
  serviceCount: number;
}

const SubCategoryCard = memo(({ item, onPress }: { item: SubCategory; onPress: () => void }) => {
  const colors = useColors();
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.subCatCard, 
        { backgroundColor: colors.background, borderColor: colors.border },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
      ]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={styles.subCatImageWrapper}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.subCatImage} resizeMode="cover" />
        ) : (
          <View style={[styles.subCatPlaceholder, { backgroundColor: colors.surface }]}>
            <MaterialIcons name={(item.icon as any) || "build"} size={32} color={colors.muted} />
          </View>
        )}
      </View>
      <View style={styles.subCatInfo}>
        <Text style={[styles.subCatName, { color: colors.foreground }]} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </Pressable>
  );
});

export const CategoryBlock = memo(({ category, subCategories, serviceCount }: CategoryBlockProps) => {
  const colors = useColors();
  const router = useRouter();

  const handleSeeAll = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/categories/${category.id}` as any);
  };

  return (
    <View style={[styles.categoryBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.categoryHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
            {category.name.replace("\n", " ")}
          </Text>
          {serviceCount > 0 && (
            <Text style={[styles.categorySubtitle, { color: colors.muted }]}>
              {serviceCount} serviço{serviceCount !== 1 ? "s" : ""} disponível{serviceCount !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
        <Pressable 
          onPress={handleSeeAll}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver tudo</Text>
        </Pressable>
      </View>

      {subCategories.length > 0 ? (
        <FlatList
          data={subCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subCatList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SubCategoryCard item={item} onPress={handleSeeAll} />
          )}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={5}
        />
      ) : (
        <View style={[styles.emptySubCat, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptySubCatText, { color: colors.muted }]}>
            Nenhum serviço disponível nesta categoria no momento.
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  categoryBlock: {
    marginBottom: 20,
    borderRadius: 24,
    paddingVertical: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  categorySubtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "700",
  },
  subCatList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  subCatCard: {
    width: 140,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  subCatImageWrapper: {
    width: "100%",
    height: 90,
    backgroundColor: "#F3F4F6",
  },
  subCatImage: {
    width: "100%",
    height: "100%",
  },
  subCatPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  subCatInfo: {
    padding: 12,
  },
  subCatName: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  emptySubCat: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  emptySubCatText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
