import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* PWA iOS e Safari Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="XamaJá" />
        <meta name="theme-color" content="#25D366" />

        {/* Ícone para iPhone */}
        <link rel="apple-touch-icon" href="/icon-512.png" />

        {/* O manifest gerado pelo Expo ou customizado (se criado em public/manifest.json) */}
        <link rel="manifest" href="/manifest.json" />

        {/* Reset styles para Expo Router Web */}
        <ScrollViewStyleReset />

        {/* Scripts de inicialização */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Registrar o Service Worker para suporte PWA offline
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
                    console.log('ServiceWorker registrado com sucesso no escopo: ', registration.scope);
                  }, function(err) {
                    console.log('Falha no registro do ServiceWorker: ', err);
                  });
                });
              }
            `,
          }}
        />

        {/* CSS Global e fontes podem ir aqui */}
      </head>
      <body>{children}</body>
    </html>
  );
}
