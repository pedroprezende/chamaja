# ChamaJá — TODO

- [x] Configurar tema de cores (verde WhatsApp, fundo cinza claro, cards brancos)
- [x] Configurar tab bar inferior (Início, Buscar, Pedidos, Perfil)
- [x] Adicionar ícones ao icon-symbol.tsx
- [x] Criar dados mock (categorias, profissionais, serviços)
- [x] Implementar tela Home (saudação, busca, categorias, seções)
- [x] Implementar componente SearchBar
- [x] Implementar componente CategoryChip (scroll horizontal)
- [x] Implementar componente ServiceCard (grid com imagem)
- [x] Implementar componente ProfessionalCard (horizontal com WhatsApp)
- [x] Implementar componente SectionHeader
- [x] Implementar tela Listagem de Profissionais
- [x] Implementar tela Listagem de Categorias (grid)
- [x] Implementar tela Detalhe do Profissional
- [x] Implementar ação de abrir WhatsApp com mensagem pré-definida
- [x] Implementar tela Buscar
- [x] Implementar tela Pedidos
- [x] Implementar tela Perfil
- [x] Gerar logo do app ChamaJá
- [x] Configurar branding (nome, ícone, splash)
- [x] Salvar checkpoint final

## Autenticação e Login (Novo)

- [x] Criar tela de Login com OAuth (Google, Microsoft, Apple)
- [x] Criar tela de Cadastro com email/senha
- [x] Implementar autenticação via Google OAuth
- [x] Implementar autenticação via Microsoft OAuth
- [x] Implementar autenticação via Apple OAuth
- [x] Criar contexto de autenticação (AuthContext)
- [x] Configurar persistência de dados com AsyncStorage
- [x] Criar splash screen com verificação de autenticação
- [x] Proteger rotas autenticadas
- [x] Adicionar logout no perfil
- [ ] Salvar preferências do usuário (favoritos, histórico)


## Sistema de Avaliações (Novo)

- [x] Criar tipos TypeScript para avaliações (Rating, Review)
- [x] Adicionar dados mock de avaliações aos profissionais
- [x] Implementar tela de Avaliações do Profissional com lista de comentários
- [x] Criar modal de Deixar Avaliação com seletor de estrelas
- [x] Integrar avaliações no detalhe do profissional
- [x] Exibir média de avaliações na listagem de profissionais
- [ ] Permitir filtrar avaliações por estrelas
- [ ] Testar fluxo completo de avaliações


## Sistema de Cadastro de Prestadores (Novo)

- [x] Criar tipos TypeScript para prestadores (FREE/PREMIUM)
- [x] Implementar tela de Cadastro de Prestador
- [x] Validar campos de cadastro (nome, categoria, cidade, WhatsApp, foto)
- [x] Implementar tela de Planos PREMIUM
- [x] Criar sistema de pagamento (plano mensal e anual)
- [x] Integrar ranking (PREMIUM primeiro, depois FREE)
- [x] Adicionar selo visual PREMIUM
- [x] Destacar prestadores PREMIUM na home
- [x] Permitir atualizar para PREMIUM no perfil do prestador
- [x] Testar fluxo completo de cadastro e upgrade


## Firebase Authentication (Novo)

- [x] Configurar Firebase projeto e credenciais
- [x] Implementar login com Google via Firebase
- [x] Implementar login com Apple via Firebase
- [x] Integrar Firebase Auth no AuthContext
- [x] Persistir tokens Firebase no AsyncStorage
- [x] Testar fluxo de autenticação Firebase

## Integração Mercado Pago (Novo)

- [x] Configurar credenciais Mercado Pago (Access Token)
- [x] Implementar API de criação de preferências de pagamento
- [x] Suportar PIX como método de pagamento
- [x] Suportar Cartão de Crédito
- [x] Suportar Boleto
- [x] Criar tela de checkout com seleção de método
- [x] Implementar webhook para confirmação de pagamento
- [x] Salvar dados de pagamento no banco de dados

## Painel Administrativo (Novo)

- [x] Criar roteamento para painel admin (/admin)
- [x] Implementar autenticação de admin
- [x] Criar dashboard com estatísticas gerais
- [x] Seção de gerenciamento de usuários (listar, bloquear, deletar)
- [x] Seção de aprovação de prestadores (listar, aprovar, rejeitar)
- [x] Seção de pagamentos (listar, filtrar por status, exportar)
- [x] Seção de relatórios (receita, usuários ativos, prestadores premium)
- [x] Implementar busca e filtros em todas as seções
- [x] Testar fluxo completo do painel
