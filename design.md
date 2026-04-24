# ChamaJá — Plano de Design Mobile

## Visão Geral

App de serviços locais onde usuários encontram profissionais e entram em contato via WhatsApp.
Design fiel à imagem de referência: tema claro, cards brancos com sombra, bordas arredondadas, tipografia moderna.

---

## Paleta de Cores

| Token       | Valor (light)  | Uso                          |
|-------------|----------------|------------------------------|
| primary     | #25D366        | Botão WhatsApp, ícone ativo  |
| background  | #F5F5F5        | Fundo das telas              |
| surface     | #FFFFFF        | Cards, inputs                |
| foreground  | #111827        | Texto principal              |
| muted       | #6B7280        | Texto secundário             |
| border      | #E5E7EB        | Bordas e divisores           |
| accent      | #1A73E8        | Links, "Ver tudo"            |
| star        | #F59E0B        | Estrelas de avaliação        |

---

## Lista de Telas

### 1. Home (index)
- Saudação: "Olá, Pedro" + ícone de sino (notificação)
- Campo de busca: "O que você precisa?"
- Categorias horizontais com ícones (Assistência Técnica, Reformas e Reparos, Eventos, Serviços Domésticos, Aulas)
- Seção "Reformas e Reparos" → 3 cards com imagem + nome (Eletricista, Marido de aluguel, Mudanças Carretos) + "Ver tudo"
- Seção "Assistência Técnica" → 3 cards (Ar condicionado, Celular, Geladeira e freezer) + "Ver tudo"
- Seção "Serviços Domésticos" → 3 cards (Babá, Cozinheira, Diarista) + "Ver tudo"

### 2. Listagem de Profissionais (professionals/[category])
- Header com nome da categoria + botão voltar
- Campo de busca específico + ícone de filtro
- Filtro "Próximo a você" (dropdown)
- Lista de cards horizontais:
  - Avatar circular
  - Nome do profissional
  - Avaliação (⭐ + número + quantidade de avaliações)
  - Localização + distância
  - Botão "WhatsApp" verde (borda arredondada)

### 3. Listagem de Categorias (categories/[section])
- Header com nome da seção + botão voltar + ícone busca
- Grid 3 colunas de cards:
  - Imagem quadrada com bordas arredondadas
  - Nome do serviço abaixo

### 4. Detalhe do Profissional (professional/[id])
- Header: botão voltar + ícone compartilhar
- Avatar grande (circular)
- Nome do profissional
- Badge da categoria (verde)
- Localização + distância
- Avaliação com estrela + número + ">" para ver avaliações
- Seção "Sobre": descrição do serviço
- Ícone + "Atende em toda a cidade": bairros
- Ícone + "Atendimento": horário
- Ícone + "Formas de pagamento": métodos
- Botão fixo no rodapé: "Chamar no WhatsApp" (verde, ícone WhatsApp)

### 5. Buscar
- Campo de busca centralizado
- Categorias populares em grid
- Estado vazio com ilustração

### 6. Pedidos
- Lista de pedidos/contatos realizados
- Estado vazio com mensagem

### 7. Perfil
- Avatar do usuário
- Nome e informações básicas
- Configurações

---

## Fluxos Principais

1. **Encontrar profissional**: Home → toca categoria → Listagem → toca card → Detalhe → "Chamar no WhatsApp"
2. **Busca direta**: Home → campo de busca → digita → Listagem filtrada → Detalhe
3. **Ver tudo da seção**: Home → "Ver tudo" → Listagem de Categorias → toca categoria → Listagem de Profissionais

---

## Componentes Reutilizáveis

- `SearchBar`: campo de busca com ícone lupa
- `CategoryChip`: chip horizontal com ícone + label
- `ServiceCard`: card com imagem + nome (grid)
- `ProfessionalCard`: card horizontal com avatar, info, botão WhatsApp
- `SectionHeader`: título + link "Ver tudo"
- `RatingBadge`: estrela + número
- `WhatsAppButton`: botão verde com ícone

---

## Menu Inferior (Tab Bar)

| Tab     | Ícone         | Rota         |
|---------|---------------|--------------|
| Início  | house.fill    | /            |
| Buscar  | magnifyingglass | /search    |
| Pedidos | bag           | /orders      |
| Perfil  | person        | /profile     |

---

## Tipografia

- Título principal: 24px, bold
- Subtítulo seção: 18px, semibold
- Corpo: 14px, regular
- Caption: 12px, regular, muted
