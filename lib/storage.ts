import { supabase, supabaseUrl, supabaseAnonKey } from "./supabase";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { decode } from "base64-arraybuffer";

import { logger } from "./logger";

export const storage = {
  async uploadImage(
    uri: string,
    bucket: string = "providers",
  ): Promise<string | null> {
    logger.info(
      "STORAGE",
      `Iniciando upload de imagem para o bucket: ${bucket}`,
    );

    try {
      if (!uri) {
        logger.warn("STORAGE", "URI de imagem vazia recebida no upload");
        return null;
      }

      if (uri.startsWith("http")) {
        logger.info("STORAGE", "URI já é uma URL remota, ignorando upload");
        return uri;
      }

      let fileSize = 0;
      let fileType = "";

      if (uri.startsWith("data:")) {
        const match = uri.match(/^data:(image\/[a-z0-9-+.]+);base64,/i);
        if (match) {
          fileType = match[1];
        }
        const base64Data = uri.split(",")[1];
        fileSize = base64Data ? Math.round(base64Data.length * 0.75) : 0;
      } else if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        fileSize = blob.size;
        fileType = blob.type;
      } else {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error("Arquivo não encontrado no caminho especificado.");
        }
        fileSize = fileInfo.size || 0;

        const cleanUri = uri.split("?")[0].split("#")[0];
        const ext = cleanUri
          .substring(cleanUri.lastIndexOf(".") + 1)
          .toLowerCase();
        if (ext === "jpg" || ext === "jpeg") {
          fileType = "image/jpeg";
        } else if (ext === "png") {
          fileType = "image/png";
        } else if (ext === "webp") {
          fileType = "image/webp";
        } else {
          fileType = `image/${ext}`;
        }
      }

      logger.info(
        "STORAGE",
        `Validando arquivo: tamanho = ${fileSize} bytes, tipo = ${fileType}`,
      );

      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (fileSize > MAX_SIZE) {
        logger.error(
          "STORAGE",
          `Arquivo excede o limite de tamanho: ${fileSize} > ${MAX_SIZE}`,
        );
        throw new Error("O arquivo excede o limite de tamanho de 5MB.");
      }

      const ALLOWED_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!ALLOWED_TYPES.includes(fileType.toLowerCase())) {
        logger.error("STORAGE", `Tipo de arquivo não permitido: ${fileType}`);
        throw new Error(
          "Formato de arquivo inválido. Apenas imagens JPG, PNG e WEBP são permitidas.",
        );
      }

      const ext =
        fileType.toLowerCase() === "image/png"
          ? "png"
          : fileType.toLowerCase() === "image/webp"
            ? "webp"
            : "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const filePath = fileName;

      logger.info(
        "STORAGE",
        `Processando imagem local: ${uri.substring(0, 50)}...`,
      );

      let publicUrl = "";

      if (Platform.OS === "web") {
        try {
          // 1. Converter URI (blob: ou data:) em Base64 limpo
          let base64String = uri;
          if (uri.startsWith("blob:") || !uri.startsWith("data:")) {
            const response = await fetch(uri);
            const blob = await response.blob();
            base64String = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
          
          // 2. Enviar via endpoint de servidor (Evita CORS / RLS client-side no Supabase)
          const sessionData = await supabase.auth.getSession();
          const token = sessionData.data.session?.access_token || "";

          const serverRes = await fetch("/api/upload-image", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              base64Data: base64String,
              fileType: fileType || "image/jpeg",
              bucket: bucket || "providers",
            }),
          });

          if (serverRes.ok) {
            const resData = await serverRes.json();
            if (resData.success && resData.publicUrl) {
              logger.info(
                "STORAGE",
                `Upload via Servidor concluído: ${resData.publicUrl}`,
              );
              return resData.publicUrl;
            }
          }

          // Fallback para upload direto via SDK caso o servidor falhe
          const response = await fetch(uri);
          const blob = await response.blob();
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, blob, {
              contentType: fileType || "image/jpeg",
              cacheControl: "3600",
              upsert: true,
            });

          if (error) throw error;

          const {
            data: { publicUrl: url },
          } = supabase.storage.from(bucket).getPublicUrl(filePath);
          publicUrl = url;
        } catch (webErr: any) {
          logger.warn(
            "STORAGE",
            "Upload no Supabase Web falhou, verificando fallback:",
            webErr,
          );
          console.error("[STORAGE] Erro web completo:", webErr);
          throw new Error("Falha no upload da imagem para a nuvem. Erro: " + (webErr.message || "Desconhecido"));
        }
      } else {
        logger.info("STORAGE", "Lendo arquivo local como Base64...");
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: (FileSystem as any).EncodingType?.Base64 || "base64",
        });

        logger.info(
          "STORAGE",
          `Decodificando Base64 (${base64.length} chars)...`,
        );
        const body = decode(base64);

        logger.info("STORAGE", "Enviando para o Supabase via SDK...");
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, body, {
            contentType: fileType,
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          logger.error(
            "STORAGE",
            "Erro no upload via SDK (Base64 Mode)",
            error,
          );
          throw error;
        }

        const {
          data: { publicUrl: url },
        } = supabase.storage.from(bucket).getPublicUrl(filePath);
        publicUrl = url;
      }

      logger.info("STORAGE", `Upload concluído com sucesso: ${publicUrl}`);
      return publicUrl;
    } catch (e: any) {
      logger.error("STORAGE", "Falha crítica no helper de upload", e);
      if (Platform.OS !== "web") {
        const { Alert } = require("react-native");
        Alert.alert(
          "Erro de Armazenamento",
          `Não foi possível enviar a foto: ${e.message || "Verifique sua conexão"}`,
        );
      }
      throw e;
    }
  },

  async uploadOptimizedImage(
    uri: string,
    bucket: string = "providers",
  ): Promise<{ imageUrl: string | null; thumbnailUrl: string | null }> {
    if (!uri) return { imageUrl: null, thumbnailUrl: null };
    if (uri.startsWith("http")) return { imageUrl: uri, thumbnailUrl: uri };

    try {
      const { optimizeImage, generateThumbnail } =
        await import("./image-optimizer");

      logger.info(
        "STORAGE",
        "Iniciando otimização de imagem e geração de miniatura...",
      );
      const [optimizedUri, thumbnailUri] = await Promise.all([
        optimizeImage(uri, 1000, 0.8),
        generateThumbnail(uri),
      ]);

      logger.info(
        "STORAGE",
        "Fazendo upload das imagens otimizadas para o Supabase...",
      );
      const [imageUrl, thumbnailUrl] = await Promise.all([
        this.uploadImage(optimizedUri, bucket),
        this.uploadImage(thumbnailUri, bucket),
      ]);

      return { imageUrl, thumbnailUrl };
    } catch (err) {
      logger.error(
        "STORAGE",
        "Erro no upload otimizado, usando fallback de upload normal:",
        err,
      );
      const imageUrl = await this.uploadImage(uri, bucket);
      return { imageUrl, thumbnailUrl: imageUrl };
    }
  },
};
