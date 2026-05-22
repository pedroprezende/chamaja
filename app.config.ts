// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID para produção nas lojas
const rawBundleId = "br.com.chamaja.app";
const bundleId = rawBundleId;
const schemeFromBundleId = "chamaja";

const env = {
  appName: "ChamaJá",
  appSlug: "chamaja",
  logoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663596077010/ewPQX5Hdn85qUpsT3fJo4T/chamaja-icon-3vFAMQS6WicwcQNCYQranh.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    associatedDomains: ["applinks:chamaja-production.up.railway.app"],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription: "O ChamaJá precisa acessar sua galeria para você poder enviar fotos para o perfil do seu serviço.",
      NSCameraUsageDescription: "O ChamaJá precisa acessar sua câmera para que você possa tirar fotos dos serviços que realiza.",
      NSLocationWhenInUseUsageDescription: "O ChamaJá usa sua localização para encontrar profissionais e serviços próximos a você.",
    }
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#1e2126",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: [
      "POST_NOTIFICATIONS",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "chamaja-production.up.railway.app",
            pathPrefix: "/",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
    name: "ChamaJá",
    shortName: "ChamaJá",
    themeColor: "#25D366",
    backgroundColor: "#F8F9FA",
    display: "standalone",
    startUrl: "/",
    dir: "ltr",
    lang: "pt-BR"
  },
  plugins: [
    "expo-router",
    "expo-location",
    [
      "expo-image-picker",
      {
        photosPermission: "O ChamaJá precisa acessar suas fotos para você escolher a foto do perfil e dos serviços.",
        cameraPermission: "O ChamaJá precisa acessar sua câmera para tirar fotos dos serviços."
      }
    ],
    [
      "expo-audio",
      {
        microphonePermission: "O ChamaJá precisa de acesso ao microfone para mensagens de áudio.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#1e2126",
        dark: {
          backgroundColor: "#1e2126",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
