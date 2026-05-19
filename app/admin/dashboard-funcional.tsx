import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAdminAuthReal } from "@/lib/admin-auth-real";
import { adminDB, type Service } from "@/lib/admin-database";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function AdminDashboardFuncionalScreen() {
  const router = useRouter();
  const { user, logout } = useAdminAuthReal();
  const [services, setServices] = useState<Service[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
  });

  // Carregar serviços ao inicializar
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    if (!user) return;
    try {
      const userServices = await adminDB.getServicesByAdminId(user.id);
      setServices(userServices);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
    }
  };

  const handleSignOut = async () => {
    try { await logout(); } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Você será desconectado", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        onPress: async () => {
          await handleSignOut();
          router.replace("/admin/auth");
        },
      },
    ]);
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        category: service.category,
        description: service.description,
      });
    } else {
      setEditingService(null);
      setFormData({ name: "", category: "", description: "" });
    }
    setIsModalVisible(true);
  };

  const handleSaveService = async () => {
    if (!formData.name || !formData.category || !formData.description) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      if (editingService) {
        // Atualizar serviço
        const updated = await adminDB.updateService(editingService.id, {
          name: formData.name,
          category: formData.category,
          description: formData.description,
        });
        if (updated) {
          setServices(
            services.map((s) => (s.id === updated.id ? updated : s))
          );
        }
        Alert.alert("Sucesso", "Serviço atualizado com sucesso");
      } else {
        // Criar novo serviço
        const newService = await adminDB.createService(
          user.id,
          formData.name,
          formData.category,
          formData.description
        );
        setServices([...services, newService]);
        Alert.alert("Sucesso", "Serviço criado com sucesso");
      }
      setIsModalVisible(false);
      setFormData({ name: "", category: "", description: "" });
    } catch (err) {
      Alert.alert("Erro", "Falha ao salvar serviço");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert("Deletar Serviço", "Tem certeza que deseja deletar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: async () => {
          try {
            await adminDB.deleteService(serviceId);
            setServices(services.filter((s) => s.id !== serviceId));
            Alert.alert("Sucesso", "Serviço deletado com sucesso");
          } catch (err) {
            Alert.alert("Erro", "Falha ao deletar serviço");
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="bg-gray-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-6 py-4 gap-2">
          <View className="flex-row justify-between items-center">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-gray-900">
                Meus Serviços
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
              <Text className="text-gray-600 text-sm">Total de Serviços</Text>
              <Text className="text-2xl font-bold text-gray-900">
                {services.length}
              </Text>
            </View>
            <View className="bg-blue-100 rounded-lg p-3">
              <MaterialIcons name="build" size={24} color="#3B82F6" />
            </View>
          </View>
        </View>

        {/* Create Button */}
        <View className="px-6 py-2">
          <TouchableOpacity
            onPress={() => handleOpenModal()}
            className="bg-blue-600 rounded-lg py-3 flex-row items-center justify-center gap-2"
          >
            <MaterialIcons name="add" size={24} color="#fff" />
            <Text className="text-white font-bold">Criar Novo Serviço</Text>
          </TouchableOpacity>
        </View>

        {/* Services List */}
        <View className="px-6 py-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Seus Serviços
          </Text>

          {services.length === 0 ? (
            <View className="bg-white rounded-lg border border-gray-200 p-6 items-center gap-2">
              <MaterialIcons name="build" size={48} color="#D1D5DB" />
              <Text className="text-gray-600 text-center">
                Você ainda não criou nenhum serviço
              </Text>
            </View>
          ) : (
            <FlatList
              data={services}
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
                          name="category"
                          size={16}
                          color="#6B7280"
                        />
                        <Text className="text-sm text-gray-600">
                          {item.category}
                        </Text>
                      </View>
                      <Text className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row gap-2 pt-2 border-t border-gray-200">
                    <TouchableOpacity
                      onPress={() => handleOpenModal(item)}
                      className="flex-1 bg-blue-100 rounded-lg py-2 flex-row items-center justify-center gap-1"
                    >
                      <MaterialIcons name="edit" size={18} color="#3B82F6" />
                      <Text className="text-blue-600 font-semibold text-sm">
                        Editar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteService(item.id)}
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

      {/* Modal de Criar/Editar Serviço */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 gap-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-2xl font-bold text-gray-900">
                {editingService ? "Editar Serviço" : "Novo Serviço"}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View className="gap-3">
              <View className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">
                  Nome do Serviço
                </Text>
                <TextInput
                  className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="Ex: Eletricista"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  editable={!isLoading}
                />
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">
                  Categoria
                </Text>
                <TextInput
                  className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="Ex: Elétrica"
                  value={formData.category}
                  onChangeText={(text) =>
                    setFormData({ ...formData, category: text })
                  }
                  editable={!isLoading}
                />
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">
                  Descrição
                </Text>
                <TextInput
                  className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="Descreva o serviço"
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  editable={!isLoading}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="flex-1 bg-gray-200 rounded-lg py-3"
                disabled={isLoading}
              >
                <Text className="text-gray-700 font-bold text-center">
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveService}
                className="flex-1 bg-blue-600 rounded-lg py-3"
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.6 : 1 }}
              >
                <Text className="text-white font-bold text-center">
                  {isLoading ? "Salvando..." : "Salvar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
