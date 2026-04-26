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
import { useAuth } from "@/lib/auth-context";
import { adminDB, type Service } from "@/lib/admin-database";

const ADMIN_EMAIL = "pedroprezende33@gmail.com";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
  });

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.email !== ADMIN_EMAIL) {
      Alert.alert("Acesso Negado", "Você não tem permissão para acessar este painel.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
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
      setServices(services.map((s) => (s.id === updated.id ? updated : s)));
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
      { text: "Cancelar" },
      {
        text: "Deletar",
        style: "destructive",
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
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-lg text-foreground">Verificando acesso...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="bg-primary p-6 rounded-b-2xl mb-6">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-2xl font-bold text-white mb-1">
                Painel Admin
              </Text>
              <Text className="text-white opacity-80 text-sm">
                {user.name || user.email}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text className="text-white font-semibold text-sm">Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="px-4 mb-6">
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm text-muted mb-1">Total de Serviços</Text>
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
            className="bg-primary rounded-xl p-4 active:opacity-80"
          >
            <Text className="text-white font-bold text-center text-base">
              + Criar Novo Serviço
            </Text>
          </TouchableOpacity>
        </View>

        {/* Services List */}
        <View className="px-4">
          <Text className="text-lg font-bold text-foreground mb-4">
            Serviços Criados
          </Text>
          {services.length === 0 ? (
            <View className="bg-surface rounded-xl p-8 items-center border border-border">
              <Text className="text-muted text-center">
                Nenhum serviço criado ainda.{"\n"}Toque em "Criar Novo Serviço" para começar.
              </Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={services}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
                  <Text className="text-base font-semibold text-foreground mb-1">
                    {item.name}
                  </Text>
                  <Text className="text-xs text-primary font-medium mb-2">
                    {item.category}
                  </Text>
                  <Text className="text-sm text-muted mb-3 leading-relaxed">
                    {item.description}
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleEditService(item)}
                      style={{ flex: 1, backgroundColor: "#3B82F6", borderRadius: 8, padding: 8 }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600", textAlign: "center" }}>
                        Editar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteService(item.id)}
                      style={{ flex: 1, backgroundColor: "#EF4444", borderRadius: 8, padding: 8 }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600", textAlign: "center" }}>
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

      {/* Modal de Criar/Editar */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#11181C", marginBottom: 16 }}>
              {editingService ? "Editar Serviço" : "Criar Novo Serviço"}
            </Text>

            <TextInput
              placeholder="Nome do Serviço"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={{ backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14, color: "#11181C" }}
              placeholderTextColor="#9BA1A6"
            />

            <TextInput
              placeholder="Categoria (ex: Eletricista, Diarista)"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
              style={{ backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14, color: "#11181C" }}
              placeholderTextColor="#9BA1A6"
            />

            <TextInput
              placeholder="Descrição do serviço"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              style={{ backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 14, color: "#11181C", minHeight: 80, textAlignVertical: "top" }}
              placeholderTextColor="#9BA1A6"
            />

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={{ flex: 1, backgroundColor: "#6B7280", borderRadius: 10, padding: 12 }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", textAlign: "center" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={editingService ? handleUpdateService : handleCreateService}
                style={{ flex: 1, backgroundColor: "#0a7ea4", borderRadius: 10, padding: 12 }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", textAlign: "center" }}>
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
