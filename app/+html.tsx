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
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-W9RMVT7L');`,
          }}
        />
        {/* End Google Tag Manager */}

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
              // Registrar o Service Worker com scope restrito a /app/
              // IMPORTANTE: O scope deve ser '/app/' para evitar interceptar
              // rotas do website institucional ('/') que podem ter redirects 301.
              // O Safari rejeita respostas com redirect servidas pelo SW.
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js', { scope: '/app/' }).then(function(registration) {
                    console.log('[SW] Registrado com scope:', registration.scope);
                  }, function(err) {
                    console.warn('[SW] Falha no registro:', err);
                  });
                });
              }
            `,
          }}
        />

        {/* CSS Global e fontes podem ir aqui */}
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W9RMVT7L"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}
      </body>
    </html>
  );
}
