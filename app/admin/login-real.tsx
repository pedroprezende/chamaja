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
import { useAdminAuth } from "@/lib/admin-auth-context";

export default function AdminLoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAdminAuth();
  const [email, setEmail] = useState("pedroprezende33@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    try {
      await login(email, password);
      router.replace("/admin/dashboard");
    } catch (err) {
      Alert.alert(
        "Erro de Login",
        error || "Falha ao fazer login. Verifique suas credenciais."
      );
    }
  };

  return (
    <ScreenContainer className="bg-gray-900">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1 justify-center px-6"
      >
        <View className="gap-8">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-white">ChamaJá</Text>
            <Text className="text-lg text-gray-400">Painel Administrativo</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Email Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-300">
                E-mail
              </Text>
              <TextInput
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                placeholder="seu@email.com"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-300">Senha</Text>
              <View className="flex-row items-center bg-gray-800 border border-gray-700 rounded-lg px-4">
                <TextInput
                  className="flex-1 py-3 text-white"
                  placeholder="Digite sua senha"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Text className="text-gray-400 font-semibold">
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-900 border border-red-700 rounded-lg p-3">
                <Text className="text-red-200 text-sm">{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="bg-blue-600 rounded-lg py-3 items-center mt-4"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Entrar no Painel
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View className="bg-blue-900 border border-blue-700 rounded-lg p-4 gap-2">
            <Text className="text-blue-200 font-semibold text-sm">
              Credenciais de Teste:
            </Text>
            <Text className="text-blue-100 text-xs">
              E-mail: pedroprezende33@gmail.com
            </Text>
            <Text className="text-blue-100 text-xs">Senha: admin123456</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
