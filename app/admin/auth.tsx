import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAdminAuthReal } from "@/lib/admin-auth-real";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function AdminAuthScreen() {
  const router = useRouter();
  const { login, register, isLoading, error, clearError } = useAdminAuthReal();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    clearError();

    if (!email || !password) {
      Alert.alert("Erro", "E-mail e senha são obrigatórios");
      return;
    }

    if (!isLoginMode && !name) {
      Alert.alert("Erro", "Nome é obrigatório");
      return;
    }

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      router.replace("/admin/dashboard-funcional");
    } catch (err) {
      Alert.alert(
        "Erro",
        error || "Falha na autenticação. Tente novamente."
      );
    }
  };

  return (
    <ScreenContainer className="bg-gradient-to-b from-blue-600 to-blue-800">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1 justify-center px-6"
      >
        <View className="gap-8">
          {/* Header */}
          <View className="items-center gap-3">
            <View className="bg-white rounded-full p-4">
              <MaterialIcons name="admin-panel-settings" size={48} color="#2563EB" />
            </View>
            <Text className="text-3xl font-bold text-white">ChamaJá Admin</Text>
            <Text className="text-blue-100 text-center">
              {isLoginMode ? "Faça login em sua conta" : "Crie sua conta de admin"}
            </Text>
          </View>

          {/* Form */}
          <View className="bg-white rounded-2xl p-6 gap-4 shadow-lg">
            {/* Name Input (Register only) */}
            {!isLoginMode && (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">Nome</Text>
                <TextInput
                  className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="Seu nome completo"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                />
              </View>
            )}

            {/* Email Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-700">E-mail</Text>
              <TextInput
                className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                placeholder="seu@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-700">Senha</Text>
              <View className="flex-row items-center bg-gray-100 border border-gray-300 rounded-lg px-4">
                <TextInput
                  className="flex-1 py-3 text-gray-900"
                  placeholder="Digite sua senha"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              {!isLoginMode && (
                <Text className="text-xs text-gray-500">
                  Mínimo 6 caracteres
                </Text>
              )}
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3">
                <Text className="text-red-700 text-sm">{error}</Text>
              </View>
            )}

            {/* Auth Button */}
            <TouchableOpacity
              onPress={handleAuth}
              disabled={isLoading}
              className="bg-blue-600 rounded-lg py-3 items-center mt-2"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  {isLoginMode ? "Entrar" : "Criar Conta"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle Mode */}
          <View className="flex-row justify-center gap-2">
            <Text className="text-blue-100">
              {isLoginMode ? "Não tem conta?" : "Já tem conta?"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsLoginMode(!isLoginMode);
                clearError();
                setEmail("");
                setPassword("");
                setName("");
              }}
              disabled={isLoading}
            >
              <Text className="text-white font-bold">
                {isLoginMode ? "Registre-se" : "Faça login"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View className="bg-blue-500 bg-opacity-20 border border-blue-300 rounded-lg p-4 gap-2">
            <Text className="text-blue-50 font-semibold text-sm">
              💡 Dica:
            </Text>
            <Text className="text-blue-100 text-xs">
              {isLoginMode
                ? "Use suas credenciais de admin para acessar o painel"
                : "Crie uma conta para começar a gerenciar seus serviços"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
