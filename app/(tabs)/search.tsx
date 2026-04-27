import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { services, categories } from "@/data/mock";

const POPULAR = [
  { id: "eletricista",       name: "Eletricista",       icon: "bolt" },
  { id: "diarista",         name: "Diarista",           icon: "cleaning-services" },
  { id: "ar-condicionado",  name: "Ar-condicionado",    icon: "ac-unit" },
  { id: "marido-aluguel",   name: "Marido de aluguel",  icon: "build" },
  { id: "cozinheira",       name: "Cozinheira",         icon: "restaurant" },
  { id: "jardineiro",       name: "Jardineiro",         icon: "grass" },
  { id: "conserto-celular", name: "Conserto de celular",icon: "phone-android" },
  { id: "baba",             name: "Babá",               icon: "child-care" },
  { id: "barbeiro",         name: "Barbeiro",           icon: "content-cut" },
  { id: "mecanico",         name: "Mecânico",           icon: "directions-car" },
  { id: "fotografo",        name: "Fotógrafo",          icon: "camera-alt" },
  { id: "personal-trainer", name: "Personal trainer",   icon: "fitness-center" },
];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const filtered = query.trim()
    ? services.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <ScreenContainer containerClassName="bg-[#F5F5F5]" className="">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="O que você precisa?"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {query.trim() ? (
        /* Search Results */
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.resultItem, pressed && { opacity: 0.7 }]}
              onPress={() =>
                router.push(`/professionals/${item.id}` as any)
              }
            >
              <View style={styles.resultIcon}>
                <MaterialIcons name="search" size={20} color="#6B7280" />
              </View>
              <Text style={styles.resultName}>{item.name}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="search-off" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Nenhum resultado</Text>
              <Text style={styles.emptySubtitle}>
                Tente buscar por outro serviço
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Popular Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Serviços populares</Text>
            <View style={styles.popularGrid}>
              {POPULAR.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.popularItem,
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() =>
                    router.push(`/professionals/${item.id}` as any)
                  }
                >
                  <View style={styles.popularIcon}>
                    <MaterialIcons
                      name={item.icon as any}
                      size={24}
                      color="#374151"
                    />
                  </View>
                  <Text style={styles.popularName}>{item.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* All Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Todas as categorias</Text>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  styles.categoryRow,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() =>
                  router.push(`/categories/${cat.id}` as any)
                }
              >
                <Text style={styles.categoryRowName}>
                  {cat.name.replace("\n", " ")}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  searchWrapper: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    padding: 0,
  },
  resultsList: {
    padding: 16,
    paddingBottom: 24,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  resultName: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#374151",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  popularItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  popularIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  popularName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryRowName: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
});
