import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface Store {
  id: string;
  name: string;
  city: string;
  category: string;
  createdAt: string;
  status: "active" | "inactive";
}

export default function ComercianteDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stores, setStores] = useState<Store[]>([
    {
      id: "1",
      name: "Loja Centro",
      city: "São Paulo",
      category: "Eletricista",
      createdAt: "2024-01-15",
      status: "active",
    },
    {
      id: "2",
      name: "Loja Vila Madalena",
      city: "São Paulo",
      category: "Encanador",
      createdAt: "2024-02-20",
      status: "active",
    },
  ]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Você será desconectado", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const handleEditStore = (storeId: string) => {
    Alert.alert("Editar Loja", `Editando loja ${storeId}`);
  };

  const handleDeleteStore = (storeId: string) => {
    Alert.alert("Deletar Loja", "Tem certeza que deseja deletar esta loja?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: () => {
          setStores(stores.filter((s) => s.id !== storeId));
          Alert.alert("Sucesso", "Loja deletada com sucesso");
        },
      },
    ]);
  };

  const handleCreateStore = () => {
    Alert.alert("Criar Loja", "Abrindo formulário de criação");
  };

  return (
    <ScreenContainer className="bg-gray-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-6 py-4 gap-2">
          <View className="flex-row justify-between items-center">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-gray-900">
                Minhas Lojas
              </Text>
              <Text className="text-sm text-gray-600">{user?.name}</Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-red-100 rounded-lg p-2"
            >
              <MaterialIcons name="logout" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 py-4 gap-3">
          <View className="bg-white rounded-lg border border-gray-200 p-4 flex-row justify-between items-center">
            <View className="gap-1">
              <Text className="text-gray-600 text-sm">Total de Lojas</Text>
              <Text className="text-2xl font-bold text-gray-900">
                {stores.length}
              </Text>
            </View>
            <View className="bg-blue-100 rounded-lg p-3">
              <MaterialIcons name="store" size={24} color="#3B82F6" />
            </View>
          </View>

          <View className="bg-white rounded-lg border border-gray-200 p-4 flex-row justify-between items-center">
            <View className="gap-1">
              <Text className="text-gray-600 text-sm">Ativas</Text>
              <Text className="text-2xl font-bold text-gray-900">
                {stores.filter((s) => s.status === "active").length}
              </Text>
            </View>
            <View className="bg-green-100 rounded-lg p-3">
              <MaterialIcons name="check-circle" size={24} color="#22C55E" />
            </View>
          </View>
        </View>

        {/* Create Store Button */}
        <View className="px-6 py-2">
          <TouchableOpacity
            onPress={handleCreateStore}
            className="bg-blue-600 rounded-lg py-3 flex-row items-center justify-center gap-2"
          >
            <MaterialIcons name="add" size={24} color="#fff" />
            <Text className="text-white font-bold">Criar Nova Loja</Text>
          </TouchableOpacity>
        </View>

        {/* Stores List */}
        <View className="px-6 py-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Suas Lojas
          </Text>

          {stores.length === 0 ? (
            <View className="bg-white rounded-lg border border-gray-200 p-6 items-center gap-2">
              <MaterialIcons name="store" size={48} color="#D1D5DB" />
              <Text className="text-gray-600 text-center">
                Você ainda não tem lojas criadas
              </Text>
            </View>
          ) : (
            <FlatList
              data={stores}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View className="bg-white rounded-lg border border-gray-200 p-4 mb-3 gap-3">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 gap-1">
                      <Text className="text-lg font-bold text-gray-900">
                        {item.name}
                      </Text>
                      <View className="flex-row gap-2 items-center">
                        <MaterialIcons
                          name="location-on"
                          size={16}
                          color="#6B7280"
                        />
                        <Text className="text-sm text-gray-600">
                          {item.city}
                        </Text>
                      </View>
                      <View className="flex-row gap-2 items-center">
                        <View
                          className={`px-2 py-1 rounded ${
                            item.status === "active"
                              ? "bg-green-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              item.status === "active"
                                ? "text-green-700"
                                : "text-gray-700"
                            }`}
                          >
                            {item.status === "active" ? "Ativa" : "Inativa"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row gap-2 pt-2 border-t border-gray-200">
                    <TouchableOpacity
                      onPress={() => handleEditStore(item.id)}
                      className="flex-1 bg-blue-100 rounded-lg py-2 flex-row items-center justify-center gap-1"
                    >
                      <MaterialIcons name="edit" size={18} color="#3B82F6" />
                      <Text className="text-blue-600 font-semibold text-sm">
                        Editar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteStore(item.id)}
                      className="flex-1 bg-red-100 rounded-lg py-2 flex-row items-center justify-center gap-1"
                    >
                      <MaterialIcons name="delete" size={18} color="#EF4444" />
                      <Text className="text-red-600 font-semibold text-sm">
                        Deletar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
