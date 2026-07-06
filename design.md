---
name: XamaJá
description: Mobile marketplace for local services connecting clients directly to providers via WhatsApp.
colors:
  primary: "#25D366"
  primary-dark: "#84cc16"
  background: "#F8F9FA"
  background-dark: "#000000"
  surface: "#FFFFFF"
  surface-dark: "#080808"
  foreground: "#0F172A"
  foreground-dark: "#FFFFFF"
  muted: "#64748B"
  muted-dark: "#D1D5DB"
  border: "#E2E8F0"
  border-dark: "#1C1C1E"
  accent: "#3B82F6"
  accent-dark: "#1C1C1E"
  star: "#F59E0B"
  star-dark: "#FBBF24"
  success: "#22C55E"
  success-dark: "#16A34A"
  error: "#EF4444"
  error-dark: "#EF4444"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.15
  headline:
    fontFamily: "Outfit, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-whatsapp:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.xl}"
    padding: "16px 24px"
  card-provider:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  search-bar:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
---

# Design System: XamaJá

## 1. Overview

**Creative North Star: "O Atalho de Confiança" (The Trusted Shortcut)**

O XamaJá foi projetado com foco em eficiência móvel e facilidade de contato. A interface deve passar uma sensação de utilidade imediata, permitindo ao usuário resolver um problema doméstico (eletricista, encanador, diarista) em poucos toques. A estética visual rejeita a complexidade de múltiplos fluxos de checkout e o visual corporativo frio das fintechs modernas, preferindo um visual limpo, amigável e focado na ação.

### Key Characteristics:
- **Alta Legibilidade**: Textos com contraste robusto e tipografia moderna baseada no sistema.
- **Foco na Ação**: Call-to-actions de destaque absoluto, especialmente para iniciar contatos via WhatsApp.
- **Clareza de Estado**: Modos claro e escuro bem definidos para uso confortável em qualquer iluminação.

---

## 2. Colors

A paleta de cores é liderada pelo verde vibrante que evoca a conexão direta e a familiaridade do WhatsApp, sustentada por tons neutros equilibrados para os modos claro e escuro.

### Primary
- **WhatsApp Green** (#25D366 / #84cc16): Usado para botões e links de contato principais via WhatsApp.
- **Primary Accent** (#3B82F6 / #1C1C1E): Links de apoio, navegação "Ver tudo" e destaques de categoria secundários.

### Neutral
- **Background** (#F8F9FA / #000000): Fundo limpo para as telas.
- **Surface** (#FFFFFF / #080808): Fundo de cards, inputs e componentes suspensos.
- **Foreground** (#0F172A / #FFFFFF): Texto principal de alta legibilidade.
- **Muted** (#64748B / #D1D5DB): Textos de legenda, placeholders e informações de suporte.
- **Border** (#E2E8F0 / #1C1C1E): Linhas divisórias sutis.

### Named Rules
**The WhatsApp Green Rule.** O verde vibrante (#25D366 / #84cc16) é reservado prioritariamente para ações relacionadas ao WhatsApp. Ele nunca deve ser usado em avisos de erro ou decorações que distraiam o usuário da ação principal de contato.

---

## 3. Typography

**Display Font:** Outfit, sans-serif (Google Fonts)
**Body Font:** Plus Jakarta Sans, sans-serif (Google Fonts)

A tipografia utiliza as fontes modernas Google Fonts para máxima expressividade visual no ambiente web e consistência no aplicativo móvel.

### Hierarchy
- **Display** (Bold, 24px, 1.15): Título principal de telas e saudação do usuário.
- **Headline** (Semibold, 18px, 1.2): Títulos de seções, categorias e cabeçalhos de cards.
- **Title** (Medium, 16px, 1.25): Nomes de serviços principais e textos em botões de ação médios.
- **Body** (Regular, 14px, 1.5): Textos informativos, descrições "Sobre" dos profissionais e avaliações.
- **Label** (Regular, 12px, 1.4): Textos pequenos de suporte, distância, horários e legendas de abas.

---

## 4. Elevation

O XamaJá utiliza um modelo híbrido. No modo claro, cards e contêineres usam sombras suaves para dar profundidade e destacar o conteúdo do fundo claro. No modo escuro, a profundidade é obtida exclusivamente por variação tonal (background mais escuro vs. surfaces levemente cinzas) e bordas finas.

### Shadow Vocabulary
- **Card Shadow** (`box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)`): Usada em cards de prestadores de serviços e banners na Home no modo claro.
- **Input Shadow** (`box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05)`): Usada na barra de busca.

---

## 5. Components

### Buttons
- **Shape:** Cantos bem arredondados (16px / rounded-xl) ou pílula completa (9999px).
- **Primary (WhatsApp):** Fundo verde (#25D366 / #84cc16), texto em contraste, padding generoso para fácil toque.
- **Secondary (Link/Outline):** Sem fundo ou com borda fina, texto azul (#3B82F6).

### Cards / Containers
- **Corner Style:** Cantos arredondados (12px / rounded-lg).
- **Background:** Surface branca no modo claro, cinza escuro (#080808) no modo escuro.
- **Border:** Borda sutil de 1px (#E2E8F0) no modo claro e (#1C1C1E) no modo escuro.

### Inputs / Fields
- **Style:** Bordas arredondadas (8px), fundo claro (#F8F9FA) ou escuro (#0E0E10) dependendo do tema.
- **Focus:** Borda verde ou brilho sutil para indicar foco ativo.

---

## 6. Do's and Don'ts

### Do:
- **Do** Manter o foco do clique direcionado para o WhatsApp nas listagens de profissionais.
- **Do** Garantir que o texto nos cards de serviço e profissionais caiba sem quebras estranhas ou truncamento severo.
- **Do** Utilizar as cores de status corretamente (verde para sucesso/contato, amarelo para avaliações, vermelho para erros).

### Don't:
- **Don't** Usar gradientes coloridos ou efeitos de vidro (glassmorphism) decorativos que interfiram na legibilidade.
- **Don't** Usar bordas decorativas grossas na lateral esquerda de cards para destacar categorias.
- **Don't** Adicionar etapas extras de confirmação ou formulários extensos que retardem o fluxo direto para o WhatsApp.
