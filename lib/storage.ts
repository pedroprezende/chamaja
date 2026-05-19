import { supabase, supabaseUrl, supabaseAnonKey } from "./supabase";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { decode } from "base64-arraybuffer";

import { logger } from "./logger";

export const storage = {
  async uploadImage(uri: string, bucket: string = "providers"): Promise<string | null> {
    logger.info("STORAGE", `Iniciando upload de imagem para o bucket: ${bucket}`);
    
    try {
      if (!uri) {
        logger.warn("STORAGE", "URI de imagem vazia recebida no upload");
        return null;
      }
      
      if (uri.startsWith("http")) {
        logger.info("STORAGE", "URI já é uma URL remota, ignorando upload");
        return uri;
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
      const filePath = fileName;

      logger.info("STORAGE", `Processando imagem local: ${uri.substring(0, 50)}...`);

      let publicUrl = "";

      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, blob, { contentType: "image/jpeg", cacheControl: "3600", upsert: true });
        
        if (error) throw error;
        
        const { data: { publicUrl: url } } = supabase.storage.from(bucket).getPublicUrl(filePath);
        publicUrl = url;
      } else {
        logger.info("STORAGE", "Lendo arquivo local como Base64...");
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: (FileSystem as any).EncodingType?.Base64 || "base64",
        });
        
        logger.info("STORAGE", `Decodificando Base64 (${base64.length} chars)...`);
        const body = decode(base64);
        
        logger.info("STORAGE", "Enviando para o Supabase via SDK...");
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, body, {
            contentType: "image/jpeg",
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          logger.error("STORAGE", "Erro no upload via SDK (Base64 Mode)", error);
          throw error;
        }

        const { data: { publicUrl: url } } = supabase.storage.from(bucket).getPublicUrl(filePath);
        publicUrl = url;
      }

      logger.info("STORAGE", `Upload concluído com sucesso: ${publicUrl}`);
      return publicUrl;
    } catch (e: any) {
      logger.error("STORAGE", "Falha crítica no helper de upload", e);
      if (Platform.OS !== "web") {
        const { Alert } = require("react-native");
        Alert.alert("Erro de Armazenamento", `Não foi possível enviar a foto: ${e.message || "Verifique sua conexão"}`);
      }
      throw e;
    }
  },
};
