import { Platform } from "react-native";
import { vanillaTrpc } from "./trpc";


type LogCategory = "AUTH" | "STORAGE" | "PAYMENT" | "ADMIN" | "NETWORK" | "SYSTEM" | "CRASH" | "UI";

class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(category: LogCategory, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const platform = Platform.OS.toUpperCase();
    return `[${timestamp}] [${platform}] [${category}] ${message}`;
  }

  info(category: LogCategory, message: string, data?: any) {
    console.log(this.formatMessage(category, message), data || "");
    this.sendToServer("info", category, message, data);
  }

  warn(category: LogCategory, message: string, data?: any) {
    console.warn(this.formatMessage(category, message), data || "");
    this.sendToServer("warn", category, message, data);
  }

  error(category: LogCategory, message: string, error?: any) {
    console.error(this.formatMessage(category, message));
    let errorDetails = error;
    if (error) {
      console.error("  Details:", error.message || error);
      if (error.stack) console.error("  Stack:", error.stack);
      errorDetails = { message: error.message, stack: error.stack, ...error };
    }
    this.sendToServer("error", category, message, errorDetails);
  }

  private async sendToServer(level: "info" | "warn" | "error", category: string, message: string, details?: any) {
    try {
      // DISABLED: Sending logs to server is causing `vanillaTrpc` to call `supabase.auth.getSession()`
      // repeatedly during app initialization, which freezes the app.
      /*
      await vanillaTrpc.logs.register.mutate({
        level,
        category,
        message,
        details: details ? JSON.stringify(details) : undefined,
        platform: Platform.OS,
      });
      */
    } catch (e) {
      // Falha silenciosa para evitar loop infinito de log
    }
  }
}

export const logger = Logger.getInstance();
