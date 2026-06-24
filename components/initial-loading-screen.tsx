import React, { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function InitialLoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de pulsação suave para o logo/texto
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animação de rotação contínua para o anel de carregamento se necessário
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      
      {/* Círculos de luz de fundo estilizados (Glow Neon) */}
      <View style={styles.glowContainer}>
        <View style={styles.greenGlow} />
      </View>

      <View style={styles.content}>
        {/* Logo / Texto Pulsante */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.logoText}>XamaJá</Text>
          <Text style={styles.logoDot}>.</Text>
        </Animated.View>

        {/* Indicador de progresso circular premium */}
        <View style={styles.loaderContainer}>
          <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
            <View style={styles.spinnerArc} />
          </Animated.View>
          <ActivityIndicator size="small" color="#25D366" style={styles.nativeIndicator} />
        </View>

        {/* Textos Informativos */}
        <Text style={styles.loadingText}>Carregando XamaJá...</Text>
        <Text style={styles.subtitleText}>Conectando você aos melhores profissionais</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E17", // Deep space dark-blue / black
    justifyContent: "center",
    alignItems: "center",
  },
  glowContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.15,
  },
  greenGlow: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#25D366",
    filter: Platform.OS === "web" ? "blur(80px)" : undefined, // Filtro blur nativo não funciona no RN básico, mas funciona em web
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    paddingHorizontal: 32,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    textShadowColor: "rgba(37, 211, 102, 0.4)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  logoDot: {
    fontSize: 48,
    fontWeight: "900",
    color: "#25D366", // Verde neon
  },
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 64,
    width: 64,
    marginBottom: 24,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(37, 211, 102, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  spinnerArc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
    borderTopColor: "#25D366",
    position: "absolute",
  },
  nativeIndicator: {
    position: "absolute",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
  },
});
