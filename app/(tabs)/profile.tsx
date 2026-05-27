import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Platform,
  Switch,
  Modal,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useProvider } from "@/lib/provider-context";
import { useFavorites } from "@/lib/favorites-context";
import { useNotifications } from "@/lib/notifications-context";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, signOut, isAdmin } = useAuth();
  const { isProvider, provider } = useProvider();
  const { favorites } = useFavorites();
  const { unreadCount } = useNotifications();
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      try { await signOut(); } catch (e) { console.error(e); }
    } else {
      Alert.alert("Sair", "Tem certeza que deseja sair?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try { await signOut(); } catch (e) { console.error(e); }
          },
        },
      ]);
    }
  };

  const MENU_ITEMS = [
    { id: "favorites", label: "Favoritos", icon: "favorite-border", badge: favorites.length > 0 ? String(favorites.length) : undefined },
    { id: "notifications", label: "Notificações", icon: "notifications-none", badge: unreadCount > 0 ? String(unreadCount) : undefined },
    { id: "provider", label: isProvider ? "Minha área de prestador" : "Seja um prestador", icon: isProvider ? "work" : "add-business", highlight: !isProvider },
    { id: "help", label: "Ajuda e suporte", icon: "help-outline" },
    { id: "about", label: "Sobre o ChamaJá", icon: "info-outline" },
    { id: "privacy", label: "Política de Privacidade", icon: "security" },
    { id: "terms", label: "Termos de Uso", icon: "gavel" },
    ...(isAdmin ? [{ id: "admin", label: "Painel Admin", icon: "admin-panel-settings", isAdmin: true }] : []),
  ] as const;

  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case "favorites": router.push("/favorites" as any); break;
      case "notifications": router.push("/notifications" as any); break;
      case "provider": router.push(isProvider ? "/provider-dashboard" : "/become-provider" as any); break;
      case "admin": router.push("/admin" as any); break;
      case "help": setHelpModalVisible(true); break;
      case "about": setAboutModalVisible(true); break;
      case "privacy": setPrivacyModalVisible(true); break;
      case "terms": setTermsModalVisible(true); break;
    }
  };

  const displayAvatar = user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80";

  return (
    <ScreenContainer edges={["left", "right"]} className="">
      {/* Header */}
      <LinearGradient
        colors={["#FFFFFF", "#F8F9FA"]}
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Perfil</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            {isProvider && (
              <View style={[styles.providerBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                <MaterialIcons name="work" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name || "Usuário"}</Text>
            <Text style={[styles.userEmail, { color: colors.muted }]}>{user?.email}</Text>
            {isProvider && provider && (
              <View style={[styles.providerTag, { backgroundColor: colors.primary + "15" }]}>
                <MaterialIcons name="workspace-premium" size={11} color={colors.primary} />
                <Text style={[styles.providerTagText, { color: colors.primary }]}>Prestador • {provider.category}</Text>
              </View>
            )}
            {isAdmin && (
              <View style={[styles.providerTag, { backgroundColor: "#EFF6FF" }]}>
                <MaterialIcons name="admin-panel-settings" size={11} color="#2563EB" />
                <Text style={[styles.providerTagText, { color: "#2563EB" }]}>Administrador</Text>
              </View>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [styles.editBtn, { backgroundColor: colors.primary + "15" }, pressed && { opacity: 0.6 }]}
            onPress={() => router.push("/edit-profile" as any)}
          >
            <MaterialIcons name="edit" size={18} color={colors.primary} />
          </Pressable>
        </View>


        {/* Menu */}
        <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          {MENU_ITEMS.map((item, index) => {
            const isLast = index === MENU_ITEMS.length - 1;
            const isAdminItem = "isAdmin" in item && item.isAdmin;
            const isHighlight = "highlight" in item && item.highlight;
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  !isLast && [styles.menuItemBorder, { borderBottomColor: colors.border }],
                  pressed && { backgroundColor: colors.background },
                  isAdminItem && { backgroundColor: "#2563EB10" },
                  isHighlight && { backgroundColor: colors.primary + "10" },
                ]}
                onPress={() => handleMenuPress(item.id)}
              >
                <View style={[
                  styles.menuIcon,
                  { backgroundColor: colors.background },
                  isAdminItem && { backgroundColor: "#DBEAFE" },
                  isHighlight && { backgroundColor: colors.primary + "20" },
                ]}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={20}
                    color={isAdminItem ? "#2563EB" : isHighlight ? colors.primary : colors.muted}
                  />
                </View>
                <Text style={[
                  styles.menuLabel,
                  { color: colors.foreground },
                  isAdminItem && { color: "#2563EB", fontWeight: "700" },
                  isHighlight && { color: colors.primary, fontWeight: "700" },
                ]}>
                  {item.label}
                </Text>
                {"badge" in item && item.badge && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn, 
            { backgroundColor: colors.background, borderColor: "#EF444450" },
            pressed && { opacity: 0.8 }
          ]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>

      {/* Modal da Política de Privacidade */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={privacyModalVisible}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Política de Privacidade</Text>
              <Pressable
                onPress={() => setPrivacyModalVisible(false)}
                style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              <Text style={[styles.policyIntro, { color: colors.foreground }]}>
                Bem-vindo ao ChamaJá. Sua privacidade é importante para nós. Esta Política de Privacidade explica como coletamos, utilizamos e protegemos suas informações ao utilizar nosso aplicativo.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>1. Informações coletadas</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O ChamaJá pode coletar as seguintes informações:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "Nome completo",
                  "E-mail",
                  "Número de telefone",
                  "Localização aproximada",
                  "Foto de perfil",
                  "Informações de agendamentos e serviços",
                  "Conversas realizadas dentro do aplicativo"
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.policyText, { color: colors.foreground, marginTop: 8 }]}>
                Também podemos coletar informações automáticas do dispositivo, como:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "Modelo do aparelho",
                  "Sistema operacional",
                  "Endereço IP",
                  "Dados de uso do aplicativo"
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>2. Como usamos suas informações</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Utilizamos seus dados para:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "Permitir o funcionamento do aplicativo",
                  "Conectar clientes e prestadores de serviço",
                  "Melhorar a experiência do usuário",
                  "Exibir anúncios e conteúdos relevantes",
                  "Enviar notificações importantes",
                  "Garantir segurança e prevenção contra fraudes"
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>3. Compartilhamento de informações</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O ChamaJá não vende informações pessoais dos usuários.
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground, marginTop: 6 }]}>
                Algumas informações podem ser compartilhadas apenas quando necessário para:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "realização de serviços",
                  "processamento de pagamentos",
                  "cumprimento de obrigações legais"
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>4. Localização</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Podemos utilizar sua localização para mostrar profissionais e serviços próximos de você.
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground, marginTop: 6 }]}>
                Você pode desativar essa permissão nas configurações do seu dispositivo.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>5. Segurança</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Adotamos medidas de segurança para proteger seus dados, porém nenhum sistema é totalmente seguro.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>6. Exclusão da conta</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O usuário pode solicitar a exclusão da conta e dos dados através do suporte do aplicativo.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>7. Alterações nesta política</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Esta Política de Privacidade poderá ser atualizada periodicamente.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>8. Contato</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Em caso de dúvidas:
              </Text>
              <Pressable
                onPress={() => Linking.openURL("mailto:chamajasuporte@gmail.com")}
                style={({ pressed }) => [styles.emailButton, pressed && { opacity: 0.8 }]}
              >
                <MaterialIcons name="email" size={16} color="#FFFFFF" />
                <Text style={styles.emailButtonText}>chamajasuporte@gmail.com</Text>
              </Pressable>
              
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal dos Termos de Uso */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={termsModalVisible}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Termos de Uso</Text>
              <Pressable
                onPress={() => setTermsModalVisible(false)}
                style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              <Text style={[styles.policyIntro, { color: colors.foreground }]}>
                Ao utilizar o ChamaJá, você concorda com os seguintes termos:
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>1. Sobre o aplicativo</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O ChamaJá é uma plataforma que conecta clientes a prestadores de serviços e empresas locais.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>2. Cadastro</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O usuário é responsável pelas informações fornecidas no cadastro.
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground, marginTop: 8, fontWeight: "600" }]}>
                É proibido:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "utilizar informações falsas",
                  "criar contas fraudulentas",
                  "praticar atividades ilegais"
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>3. Prestadores de serviço</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Os prestadores são responsáveis pelos serviços oferecidos dentro da plataforma.
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground, marginTop: 6 }]}>
                O ChamaJá atua apenas como intermediador entre cliente e profissional.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>4. Pagamentos</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Alguns serviços podem envolver pagamentos dentro ou fora da plataforma.
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground, marginTop: 6 }]}>
                O ChamaJá poderá cobrar taxas, comissões ou valores promocionais.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>5. Avaliações</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Os usuários podem avaliar serviços realizados.
              </Text>
              <Text style={[styles.policyText, { color: colors.foreground, marginTop: 6 }]}>
                Comentários ofensivos, discriminatórios ou falsos poderão ser removidos.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>6. Suspensão de contas</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O ChamaJá poderá suspender contas que:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "violem os termos",
                  "pratiquem golpes",
                  "prejudiquem outros usuários"
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>7. Limitação de responsabilidade</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                O ChamaJá não se responsabiliza diretamente pela execução dos serviços realizados pelos prestadores.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>8. Alterações</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Os termos poderão ser alterados a qualquer momento.
              </Text>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Ajuda e Suporte */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={helpModalVisible}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Ajuda e Suporte</Text>
              <Pressable
                onPress={() => setHelpModalVisible(false)}
                style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              <Text style={[styles.policyIntro, { color: colors.foreground }]}>
                Precisa de ajuda? Estamos aqui para ajudar você.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary }]}>Suporte ao usuário</Text>
              <Text style={[styles.policyText, { color: colors.foreground, marginBottom: 8 }]}>
                Entre em contato com nossa equipe:
              </Text>
              <Pressable
                onPress={() => Linking.openURL("mailto:chamajasuporte@gmail.com")}
                style={({ pressed }) => [styles.emailButton, pressed && { opacity: 0.8 }]}
              >
                <MaterialIcons name="email" size={16} color="#FFFFFF" />
                <Text style={styles.emailButtonText}>chamajasuporte@gmail.com</Text>
              </Pressable>

              <Text style={[styles.policySectionTitle, { color: colors.primary, marginTop: 24 }]}>Problemas comuns</Text>
              
              <Text style={[styles.policySectionTitle, { fontSize: 14, marginTop: 12 }]}>Não consigo entrar na conta</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Verifique seu e-mail e senha ou utilize a opção “Esqueci minha senha”.
              </Text>

              <Text style={[styles.policySectionTitle, { fontSize: 14, marginTop: 16 }]}>Como contratar um serviço?</Text>
              <View style={styles.bulletList}>
                {[
                  "Escolha uma categoria",
                  "Selecione um profissional",
                  "Chame-o no Whatsapp"
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>{idx + 1}.</Text>
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.policySectionTitle, { fontSize: 14, marginTop: 16 }]}>Como virar prestador?</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Na tela de perfil, clique em:
              </Text>
              <View style={[styles.bulletRow, { marginTop: 8, paddingLeft: 8 }]}>
                <MaterialIcons name="check-circle" size={16} color="#16A34A" style={{ marginTop: 2 }} />
                <Text style={[styles.bulletText, { color: colors.foreground, fontWeight: "600" }]}>
                  “Seja um prestador”
                </Text>
              </View>
              <Text style={[styles.policyText, { color: colors.foreground, marginTop: 6 }]}>
                e complete seu cadastro.
              </Text>

              <Text style={[styles.policySectionTitle, { fontSize: 14, marginTop: 16 }]}>Como denunciar um usuário?</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Entre no perfil do usuário e utilize a opção “Denunciar”.
              </Text>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Sobre o ChamaJá */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={aboutModalVisible}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Sobre o ChamaJá</Text>
              <Pressable
                onPress={() => setAboutModalVisible(false)}
                style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              <Text style={[styles.policyIntro, { color: colors.foreground, fontSize: 16, fontWeight: "600" }]}>
                O ChamaJá é uma plataforma criada para conectar pessoas a profissionais e empresas locais de forma rápida, prática e segura.
              </Text>

              <Text style={[styles.policyText, { color: colors.foreground, marginTop: 12 }]}>
                Nosso objetivo é facilitar a contratação de serviços do dia a dia, aproximando clientes de prestadores da própria cidade.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary, marginTop: 24 }]}>
                Com o ChamaJá você pode:
              </Text>
              <View style={styles.bulletList}>
                {[
                  "encontrar profissionais próximos",
                  "agendar serviços",
                  "contratar empresas locais",
                  "divulgar seus próprios serviços",
                  "anunciar dentro da plataforma"
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: colors.primary }]}>•</Text>
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.policyText, { color: colors.foreground, marginTop: 16, fontWeight: "600", fontStyle: "italic" }]}>
                Tudo isso em um único aplicativo.
              </Text>

              <Text style={[styles.policySectionTitle, { color: colors.primary, marginTop: 24 }]}>Nossa missão</Text>
              <Text style={[styles.policyText, { color: colors.foreground }]}>
                Facilitar a conexão entre clientes e prestadores locais através da tecnologia.
              </Text>

              <View style={{
                marginTop: 32,
                padding: 20,
                borderRadius: 16,
                alignItems: "center",
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border
              }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary, marginBottom: 4 }}>ChamaJá</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, fontStyle: "italic", textAlign: "center" }}>
                  “O que você precisa, perto de você.” 🚀
                </Text>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarWrapper: { position: "relative" },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#E5E7EB" },
  providerBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2,
  },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 18, fontWeight: "800" },
  userEmail: { fontSize: 13 },
  providerTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    alignSelf: "flex-start", marginTop: 2,
  },
  providerTagText: { fontSize: 11, fontWeight: "700" },
  editBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  menuSection: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1 },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4 },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "700", color: "#EF4444" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  policyIntro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: "500",
  },
  policySectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bulletList: {
    marginTop: 8,
    paddingLeft: 8,
    gap: 6,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16A34A",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  emailButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
