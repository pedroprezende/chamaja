import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialIcons name="explore-off" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Página não encontrada
        </Text>

        <Text style={[styles.description, { color: colors.muted }]}>
          A página ou tela que você tentou acessar não foi localizada.
        </Text>

        {pathname ? (
          <View
            style={[
              styles.pathBadge,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.pathText, { color: colors.muted }]}>
              {pathname}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)" as any);
              }
            }}
            style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
          >
            <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={styles.btnPrimaryText}>Voltar</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(tabs)" as any)}
            style={[
              styles.btnSecondary,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <MaterialIcons name="home" size={20} color={colors.text} />
            <Text style={[styles.btnSecondaryText, { color: colors.text }]}>
              Ir para o Início
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    textAlign: "center",
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  pathBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 28,
  },
  pathText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
