import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

const resizeWebImage = (uri: string, maxWidth: number, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return resolve(uri);
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = uri;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      } else {
        reject(new Error("Canvas context is null"));
      }
    };
    img.onerror = (e) => reject(e);
  });
};

const resizeNativeImage = async (uri: string, maxWidth: number, quality: number): Promise<string> => {
  try {
    // Para evitar distorções, passamos apenas a largura (width) e o expo-image-manipulator
    // calcula a altura proporcional automaticamente se passarmos apenas um dos lados.
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (err) {
    console.warn("[ImageOptimizer] Failed to manipulate native image, using raw URI:", err);
    return uri;
  }
};

/**
 * Comprime e redimensiona uma imagem no lado do cliente antes do upload.
 */
export async function optimizeImage(uri: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> {
  if (!uri) return uri;
  if (uri.startsWith('http') && !uri.startsWith('blob:')) {
    return uri; // Ignora se for link web remoto completo
  }

  if (Platform.OS === 'web') {
    return resizeWebImage(uri, maxWidth, quality);
  } else {
    return resizeNativeImage(uri, maxWidth, quality);
  }
}

/**
 * Gera um thumbnail otimizado (menor tamanho e qualidade inferior) para exibição em listagens.
 */
export async function generateThumbnail(uri: string): Promise<string> {
  return optimizeImage(uri, 240, 0.6);
}
