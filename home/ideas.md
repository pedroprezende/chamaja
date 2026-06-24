# XamaJá - Design Brainstorm

## Design Escolhido: Dark Tech Neon

### Referência

Replicação fiel do design fornecido na imagem original - tema escuro com verde neon vibrante (#CCFF00).

### Design Movement

**Cyberpunk Minimalist** - Fusão de estética futurista com simplicidade funcional. Inspirado em interfaces modernas de aplicativos de mobilidade e marketplaces digitais.

### Core Principles

1. **Contraste Alto**: Fundo escuro (#0A0E27 ou similar) com destaque em verde neon para máxima legibilidade e impacto visual
2. **Hierarquia Clara**: Tipografia em escala definida com pesos distintos (bold para títulos, regular para corpo)
3. **Espaçamento Generoso**: Breathing room entre seções para não sobrecarregar visualmente
4. **Elementos Geométricos**: Uso de formas limpas, linhas retas e ícones minimalistas

### Color Philosophy

- **Fundo Primário**: Preto/Cinza muito escuro (#0A0E27, #1A1F3A)
- **Cor Secundária**: Verde Neon (#CCFF00) - cor de marca, usada em CTAs, destaques e elementos interativos
- **Texto Principal**: Branco (#FFFFFF) para máximo contraste
- **Texto Secundário**: Cinza claro (#A0A0A0)
- **Acentos**: Azul suave (#4A90E2) para elementos complementares

### Layout Paradigm

**Asymmetric Hero + Modular Sections**

- Hero section com layout assimétrico (texto à esquerda, mockup de celular à direita)
- Seções modulares com alternância de posição (imagem esquerda/direita)
- Grid responsivo que se adapta para mobile
- Uso de espaço negativo para criar ritmo visual

### Signature Elements

1. **Mockups de Celular**: Exibição de interfaces do app em posições estratégicas
2. **Mascote Parrot**: Personagem amigável em seções-chave para humanizar a marca
3. **Linhas Neon**: Divisores e decorações com verde neon para conectar visualmente seções

### Interaction Philosophy

- Botões com hover effect em verde neon (brilho/glow)
- Transições suaves entre seções
- Elementos aparecem com fade-in ao scroll
- Feedback visual claro em todas as interações

### Animation

- Fade-in suave (300ms) para elementos ao entrar em viewport
- Hover scale (1.05) em botões com transição 200ms
- Glow effect em elementos neon ao hover
- Scroll reveal para imagens (parallax leve)

### Typography System

- **Display Font**: Montserrat Bold (títulos principais) - forte e moderna
- **Heading Font**: Montserrat SemiBold (subtítulos) - legível e profissional
- **Body Font**: Inter Regular (corpo de texto) - clara e acessível
- **Hierarchy**: H1 (48px), H2 (36px), H3 (24px), Body (16px), Small (14px)

### Brand Essence

**Onde a marca é o local** - Plataforma que conecta serviços locais com quem precisa, de forma rápida, segura e confiável.

**Personality**: Inovador, Confiável, Acessível

### Brand Voice

- Direto e objetivo, sem floreios
- Conversacional mas profissional
- Foco em benefícios práticos
- Exemplos:
  - "A solução mais rápida para conectar você ao que precisa"
  - "Encontre prestadores de serviços perto de você com segurança e confiança"

### Wordmark & Logo

Logo geométrico: Letra "X" em verde neon combinada com um ícone de localização (pin), formando um símbolo único e memorável. Sem texto, apenas marca.

### Signature Brand Color

**Verde Neon #CCFF00** - Cor exclusiva, vibrante, que diferencia XamaJá de competidores. Usada em:

- Botões de ação
- Destaques de texto
- Ícones principais
- Elementos interativos

---

## Estrutura de Seções

1. **Header/Navegação** - Logo, menu, botão "Entrar"
2. **Hero Section** - Headline, subheadline, CTA, mockup do app
3. **Como Funciona** - 4 passos com mockups de celular
4. **Para Cada Tipo de Negócio** - Seções para prestadores e comércios
5. **O App na Prática** - Showcase do app com múltiplos mockups
6. **Confiança que Gera Resultados** - Estatísticas e números
7. **CTA Final** - Chamada para ação final
8. **Footer** - Links, redes sociais, informações legais

---

## Notas de Implementação

- Usar Tailwind CSS 4 com tema dark
- Componentes shadcn/ui para consistência
- Imagens otimizadas via Manus storage
- Responsivo mobile-first
- Acessibilidade WCAG AA
