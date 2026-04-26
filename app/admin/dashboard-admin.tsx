import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAdminAuthReal } from "@/lib/admin-auth-real";
import { adminDB, type Service } from "@/lib/admin-database";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAdminAuthReal();
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
  });

  // Verificar se é o admin principal
  useEffect(() => {
    if (!user || user.email !== "pedroprezende33@gmail.com") {
      Alert.alert(
        "Acesso Negado",
        "Apenas o admin principal pode acessar este painel",
        [
          {
            text: "OK",
            onPress: () => {
              logout();
              router.replace("/admin/auth");
            },
          },
        ]
      );
      return;
    }

    loadServices();
  }, [user]);

  const loadServices = async () => {
    try {
      const allServices = await adminDB.getAllServices();
      setServices(allServices);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
    }
  };

  const handleCreateService = async () => {
    if (!formData.name || !formData.category || !formData.description) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    try {
      if (user) {
        const newService = await adminDB.createService(
          user.id,
          formData.name,
          formData.category,
          formData.description
        );
        setServices([...services, newService]);
        setFormData({ name: "", category: "", description: "" });
        setShowModal(false);
        Alert.alert("Sucesso", "Serviço criado com sucesso!");
      }
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;
    if (!formData.name || !formData.category || !formData.description) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    try {
      const updated = await adminDB.updateService(editingService.id, {
        name: formData.name,
        category: formData.category,
        description: formData.description,
      });
      setServices(
        services.map((s) => (s.id === updated.id ? updated : s))
      );
      setFormData({ name: "", category: "", description: "" });
      setEditingService(null);
      setShowModal(false);
      Alert.alert("Sucesso", "Serviço atualizado com sucesso!");
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert("Confirmar", "Tem certeza que deseja deletar este serviço?", [
      { text: "Cancelar", onPress: () => {} },
      {
        text: "Deletar",
        onPress: async () => {
          try {
            await adminDB.deleteService(serviceId);
            setServices(services.filter((s) => s.id !== serviceId));
            Alert.alert("Sucesso", "Serviço deletado com sucesso!");
          } catch (err: any) {
            Alert.alert("Erro", err.message);
          }
        },
      },
    ]);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description,
    });
    setShowModal(true);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Tem certeza que deseja sair?", [
      { text: "Cancelar", onPress: () => {} },
      {
        text: "Sair",
        onPress: async () => {
          await logout();
          router.replace("/admin/auth");
        },
      },
    ]);
  };

  if (!user || user.email !== "pedroprezende33@gmail.com") {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <Text className="text-lg text-foreground">Carregando...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-primary p-6 rounded-b-2xl mb-6">
          <Text className="text-2xl font-bold text-white mb-2">
            Painel Admin
          </Text>
          <Text className="text-white opacity-90">
            Gerenciar Serviços e Comércios
          </Text>
        </View>

        {/* Stats */}
        <View className="px-4 mb-6">
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm text-muted mb-2">Total de Serviços</Text>
            <Text className="text-3xl font-bold text-foreground">
              {services.length}
            </Text>
          </View>
        </View>

        {/* Create Button */}
        <View className="px-4 mb-6">
          <TouchableOpacity
            onPress={() => {
              setEditingService(null);
              setFormData({ name: "", category: "", description: "" });
              setShowModal(true);
            }}
            className="bg-primary rounded-lg p-4 active:opacity-80"
          >
            <Text className="text-white font-semibold text-center">
              + Criar Novo Serviço
            </Text>
          </TouchableOpacity>
        </View>

        {/* Services List */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-4">
            Serviços Criados
          </Text>
          {services.length === 0 ? (
            <View className="bg-surface rounded-lg p-6 items-center">
              <Text className="text-muted">Nenhum serviço criado ainda</Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={services}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
                  <Text className="text-lg font-semibold text-foreground mb-1">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-muted mb-2">
                    {item.category}
                  </Text>
                  <Text className="text-sm text-muted mb-3 leading-relaxed">
                    {item.description}
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleEditService(item)}
                      className="flex-1 bg-blue-500 rounded-lg p-2 active:opacity-80"
                    >
                      <Text className="text-white font-semibold text-center">
                        Editar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteService(item.id)}
                      className="flex-1 bg-red-500 rounded-lg p-2 active:opacity-80"
                    >
                      <Text className="text-white font-semibold text-center">
                        Deletar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* Logout Button */}
        <View className="px-4 mb-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500 rounded-lg p-4 active:opacity-80"
          >
            <Text className="text-white font-semibold text-center">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 pb-10">
            <Text className="text-xl font-bold text-foreground mb-4">
              {editingService ? "Editar Serviço" : "Criar Novo Serviço"}
            </Text>

            <TextInput
              placeholder="Nome do Serviço"
              value={formData.name}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
              className="bg-surface border border-border rounded-lg p-3 mb-3 text-foreground"
              placeholderTextColor="#999"
            />

            <TextInput
              placeholder="Categoria"
              value={formData.category}
              onChangeText={(text) =>
                setFormData({ ...formData, category: text })
              }
              className="bg-surface border border-border rounded-lg p-3 mb-3 text-foreground"
              placeholderTextColor="#999"
            />

            <TextInput
              placeholder="Descrição"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={4}
              className="bg-surface border border-border rounded-lg p-3 mb-4 text-foreground"
              placeholderTextColor="#999"
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="flex-1 bg-gray-500 rounded-lg p-3 active:opacity-80"
              >
                <Text className="text-white font-semibold text-center">
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={
                  editingService ? handleUpdateService : handleCreateService
                }
                className="flex-1 bg-primary rounded-lg p-3 active:opacity-80"
              >
                <Text className="text-white font-semibold text-center">
                  {editingService ? "Atualizar" : "Criar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
