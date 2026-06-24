# XamaJá 📱

Aplicativo mobile de marketplace de serviços locais — conecta clientes a prestadores de serviço da região (eletricistas, encanadores, tatuadores, diaristas, etc.).

Desenvolvido com **Expo SDK 54**, **React Native 0.81**, **TypeScript** e **NativeWind 4** (Tailwind CSS).

---

## Funcionalidades

| Área                    | Descrição                                                                         |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Home**                | Carrossel de destaques/anúncios, categorias de serviço, listagem por subcategoria |
| **Busca**               | Pesquisa por nome, categoria ou subcategoria                                      |
| **Perfil do Prestador** | Galeria de fotos, WhatsApp, avaliações, planos                                    |
| **Painel Admin**        | Gestão de anúncios, prestadores, serviços, imagens de subcategorias               |
| **Autenticação**        | Login/cadastro via e-mail, OAuth (Manus)                                          |
| **Pedidos**             | Histórico de solicitações                                                         |
| **Notificações**        | Central de notificações com badge                                                 |

---

## Pré-requisitos

Antes de começar, instale as seguintes ferramentas na sua máquina:

- **Node.js** versão 22 ou superior → [nodejs.org](https://nodejs.org)
- **pnpm** versão 9 → `npm install -g pnpm@9`
- **Expo CLI** → `npm install -g expo-cli`
- **Expo Go** no celular (iOS ou Android) para testar em dispositivo físico → [expo.dev/go](https://expo.dev/go)

Para rodar em simulador/emulador (opcional):

- **iOS**: Xcode (apenas macOS) com simulador iPhone
- **Android**: Android Studio com emulador configurado

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/chamaja.git
cd chamaja
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# URL da API do servidor (backend)
EXPO_PUBLIC_API_URL=http://localhost:3000

# Segredo JWT para autenticação (qualquer string aleatória longa)
JWT_SECRET=sua_chave_secreta_aqui_minimo_32_caracteres

# Banco de dados PostgreSQL (necessário para funcionalidades de servidor)
DATABASE_URL=postgresql://usuario:senha@localhost:5432/chamaja

# (Opcional) Chave do MercadoPago para pagamentos
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
```

> **Nota:** Para uso local sem banco de dados, o app funciona com `AsyncStorage` para a maioria das funcionalidades. O banco de dados PostgreSQL só é necessário para sincronização entre dispositivos e funcionalidades de servidor.

### 4. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

Isso inicia simultaneamente:

- **Metro Bundler** (app mobile) na porta `8081`
- **Servidor backend** (API) na porta `3000`

---

## Como testar no celular

Após rodar `pnpm dev`, um QR code aparecerá no terminal. Escaneie-o com o app **Expo Go** no seu celular (iOS ou Android) para abrir o app diretamente.

Alternativamente, gere o QR code separadamente:

```bash
pnpm qr
```

---

## Como testar no simulador/emulador

```bash
# iOS (apenas macOS com Xcode instalado)
pnpm ios

# Android (com Android Studio e emulador rodando)
pnpm android

# Web (navegador)
pnpm dev:metro
```

---

## Estrutura do Projeto

```
chamaja/
├── app/                        ← Telas do app (Expo Router)
│   ├── (tabs)/                 ← Abas principais
│   │   ├── index.tsx           ← Home (Destaques, Categorias)
│   │   ├── search.tsx          ← Busca
│   │   ├── orders.tsx          ← Pedidos
│   │   └── profile.tsx         ← Perfil do usuário
│   ├── admin/                  ← Painel administrativo
│   │   ├── dashboard-admin.tsx ← Dashboard principal
│   │   ├── ads.tsx             ← Gestão de anúncios/destaques
│   │   ├── providers.tsx       ← Gestão de prestadores
│   │   ├── services.tsx        ← Gestão de serviços
│   │   └── subcategory-images.tsx ← Imagens de subcategorias
│   ├── auth/                   ← Telas de autenticação
│   ├── categories/             ← Listagem por categoria
│   └── subcategory/            ← Listagem por subcategoria
├── components/                 ← Componentes reutilizáveis
├── lib/                        ← Lógica de negócio e banco de dados local
│   ├── admin-database.ts       ← Serviços criados pelo admin
│   ├── admin-providers-db.ts   ← Prestadores criados pelo admin
│   ├── ads-database.ts         ← Anúncios/destaques
│   ├── providers-database.ts   ← Prestadores cadastrados via app
│   └── subcategory-images-db.ts← Imagens das subcategorias
├── data/                       ← Dados mock (profissionais, categorias)
├── server/                     ← Backend (Express + tRPC)
├── hooks/                      ← Hooks customizados
├── constants/                  ← Tema e cores
├── assets/                     ← Imagens, ícones, splash
├── theme.config.js             ← Paleta de cores do app
├── tailwind.config.js          ← Configuração do Tailwind/NativeWind
└── app.config.ts               ← Configuração do Expo
```

---

## Acesso ao Painel Admin

O painel administrativo é acessível pelo perfil do usuário admin. O login de administrador é o mesmo que o login comum — não há tela separada.

Para acessar o painel admin, faça login com a conta de administrador configurada em `lib/admin-database.ts` (campo `DEFAULT_ADMIN`).

---

## Scripts Disponíveis

| Comando           | Descrição                                 |
| ----------------- | ----------------------------------------- |
| `pnpm dev`        | Inicia o app e o servidor simultaneamente |
| `pnpm dev:metro`  | Inicia apenas o Metro Bundler (app)       |
| `pnpm dev:server` | Inicia apenas o servidor backend          |
| `pnpm ios`        | Abre no simulador iOS                     |
| `pnpm android`    | Abre no emulador Android                  |
| `pnpm test`       | Roda os testes com Vitest                 |
| `pnpm check`      | Verifica erros TypeScript                 |
| `pnpm lint`       | Verifica erros de lint                    |
| `pnpm db:push`    | Aplica migrações do banco de dados        |
| `pnpm qr`         | Gera QR code para Expo Go                 |

---

## Stack Tecnológica

| Tecnologia   | Versão | Uso                            |
| ------------ | ------ | ------------------------------ |
| Expo SDK     | 54     | Framework mobile               |
| React Native | 0.81.5 | Base do app                    |
| Expo Router  | 6      | Navegação baseada em arquivos  |
| NativeWind   | 4      | Tailwind CSS para React Native |
| TypeScript   | 5.9    | Tipagem estática               |
| tRPC         | 11     | API type-safe                  |
| AsyncStorage | 2      | Persistência local             |
| Drizzle ORM  | 0.44   | ORM para banco de dados        |
| Vitest       | 2      | Testes unitários               |

---

## Persistência de Dados

O app usa **AsyncStorage** como banco de dados local no dispositivo. Os dados persistem entre sessões, mas ficam apenas no dispositivo onde o app está instalado.

| Chave AsyncStorage            | Conteúdo                        |
| ----------------------------- | ------------------------------- |
| `@chamaja_admin_services`     | Serviços criados pelo admin     |
| `@chamaja_admin_providers`    | Prestadores criados pelo admin  |
| `@chamaja_ads`                | Anúncios/destaques do carrossel |
| `@chamaja_all_providers`      | Prestadores cadastrados via app |
| `@chamaja_subcategory_images` | Imagens das subcategorias       |

---

## Problemas Comuns

**O app abre mas está em branco / com erro**

Verifique se todas as dependências foram instaladas corretamente:

```bash
pnpm install
```

**Erro "Metro bundler failed to start"**

Limpe o cache do Metro:

```bash
npx expo start --clear
```

**Módulos não encontrados**

Certifique-se de estar usando **pnpm** e não npm ou yarn, pois o projeto usa `pnpm-lock.yaml`.

**Dados não aparecem no app local**

Os dados são armazenados no AsyncStorage do dispositivo/simulador. Ao rodar localmente pela primeira vez, o app começa com dados mock. Cadastre os seus dados pelo painel admin após fazer login.

---

## Licença

Projeto privado — todos os direitos reservados.
