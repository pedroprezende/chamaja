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


## Edição de Perfil e Autenticação de E-mail (Novo)

- [x] Corrigir visibilidade do botão Apple no login
- [x] Criar tela de edição de perfil do usuário
- [x] Implementar autenticação de e-mail com código de verificação
- [x] Permitir alterar nome, foto e dados pessoais
- [x] Salvar alterações no banco de dados

## Banco de Dados (Novo)

- [x] Criar schema de usuários (id, name, email, phone, avatar, createdAt)
- [x] Criar schema de comércios/locais (id, name, city, address, coordinates)
- [x] Criar schema de prestadores (id, name, category, city, avatar, type)
- [x] Migrar dados mock para banco de dados real
- [x] Implementar CRUD para usuários
- [x] Implementar CRUD para comércios

## Painel Admin - Gerenciamento de Locais (Novo)

- [x] Criar tela de listagem de locais/cidades
- [x] Implementar adicionar novo local
- [x] Implementar editar local existente
- [x] Implementar deletar local
- [x] Adicionar busca e filtros de locais
- [x] Exibir estatísticas de prestadores por local


## Sistema de Roles e Permissões (Novo)

- [x] Criar tipos de roles (Admin, Comerciante, Cliente)
- [x] Implementar autenticação real de admin com e-mail pedroprezende33@gmail.com
- [x] Criar sistema de senha seguro para admin
- [x] Adicionar controle de acesso baseado em roles
- [x] Admin pode gerenciar todos os comércios e comerciantes
- [x] Comerciante pode criar e editar apenas suas lojas
- [x] Criar painel do comerciante com dashboard
- [x] Implementar permissões granulares nas operações CRUD
- [x] Testar fluxo de autenticação e permissões


## Sistema de Login Admin Funcional (Novo)

- [x] Criar sistema de registro de admin com validação
- [x] Salvar credenciais de admin no banco de dados
- [x] Implementar login com verificação de credenciais
- [x] Criar fluxo de navegação (login/registro/dashboard)
- [x] Proteger rotas do admin (apenas autenticados)
- [x] Implementar painel admin para criar serviços
- [x] Implementar painel admin para gerenciar serviços
- [x] Testar fluxo completo de login e criação de serviços


## Correção do Painel Admin (Novo)

- [x] Corrigir sistema de roles (Admin vs Contratante)
- [x] Apenas pedroprezende33@gmail.com tem acesso ao painel admin completo
- [x] Contratantes só gerenciam seus próprios serviços
- [x] Criar painel admin exclusivo
- [x] Criar painel de contratante
- [x] Testar fluxo de autenticação e permissões

- [x] Corrigir erro AdminAuthRealProvider no layout admin

## Unificação de Login Admin (Novo)

- [ ] Remover login separado do admin
- [ ] Integrar painel admin com AuthContext principal
- [ ] Painel admin acessível diretamente quando logado como admin
- [ ] Redirecionar para login principal se não autenticado
- [ ] Verificar e-mail admin (pedroprezende33@gmail.com) no AuthContext

## Upload de Imagem e Integração Home (Novo)

- [x] Adicionar campo imageUri à interface Service no admin-database
- [x] Implementar upload de imagem de capa via galeria no painel admin
- [x] Exibir miniatura da imagem nos cards de serviço do painel admin
- [x] Criar hook useAdminServices para consumir serviços do adminDB
- [x] Criar tela de detalhe do serviço admin (app/admin-services/[serviceId].tsx)
- [x] Exibir seção "Serviços Disponíveis" na Home com cards clicáveis dos serviços admin
- [x] Exibir imagem de capa ou ícone dinâmico por categoria nos cards da Home
- [x] Navegar para tela de detalhe ao tocar no card de serviço admin

## Correção Logout Admin + Funcionalidades Completas (Novo)

- [ ] Corrigir logout do painel admin de forma definitiva
- [ ] Implementar sistema de prestadores com plano R$10/mês e R$99,90/ano
- [ ] Tela de adesão ao plano de prestador (para usuários não-prestadores)
- [ ] Dashboard do prestador: listar, adicionar, editar e remover próprios serviços
- [ ] Busca funcional com filtro por categoria e nome
- [ ] Favoritos: salvar/remover profissionais favoritos
- [ ] Pedidos: histórico de contatos/solicitações
- [ ] Notificações: lista de notificações do app
- [ ] WhatsApp: abrir app real com mensagem pré-definida
- [ ] Perfil: exibir dados reais do usuário logado
- [ ] Persistência de dados com AsyncStorage

## Atualização — Funcionalidades Completas (Novo)

- [x] Corrigir logout do painel admin (lê AsyncStorage diretamente, sem depender do contexto React)
- [x] Criar ProviderContextProvider com persistência via AsyncStorage
- [x] Tela become-provider: escolha de plano (R$10/mês ou R$99,90/ano), formulário completo, confirmação de pagamento, tela de sucesso
- [x] Tela provider-dashboard: perfil do prestador, plano ativo, estatísticas, CRUD de serviços com imagem
- [x] Criar FavoritesProvider com persistência de favoritos e histórico de pedidos
- [x] Botão de favorito no detalhe do profissional (coração vermelho/vazio)
- [x] WhatsApp real com número formatado e mensagem personalizada
- [x] Registro automático de pedido ao clicar em WhatsApp
- [x] Tela favorites.tsx: lista de favoritos com WhatsApp e remoção
- [x] Tela orders-history.tsx: histórico real de contatos com status
- [x] Tela notifications.tsx: notificações com marcação de lida
- [x] Perfil atualizado: dados reais do usuário, badges de prestador/admin, stats reais (pedidos, favoritos, serviços)
- [x] Menu do perfil: "Seja um prestador" ou "Minha área" conforme status
- [x] Registrar todas as novas rotas no _layout.tsx

## Painel Admin — Melhorias (Novo)

- [x] Botão voltar no canto superior esquerdo do painel admin (volta para o app)
- [x] Seletor de categoria no modal de serviço (categorias existentes do app)
- [x] Toggle "Exibir na Home" por serviço no painel admin
- [x] Home filtra apenas serviços marcados como visíveis

## Expansão de Categorias e Serviços

- [x] Implementar 13 categorias: Reformas, Assistência Técnica, Domésticos, Externos, Automotivo, Beleza, Profissionais, Saúde, Eventos, Logística, Educação, Comércios, Mobilidade
- [x] Implementar ~80 serviços distribuídos nas categorias
- [x] Atualizar Home com chips de todas as categorias
- [x] Atualizar tela de listagem por categoria
- [x] Atualizar seletor de categorias no painel admin

## Carrossel de Anúncios Patrocinados

- [x] Criar lib/ads-database.ts com estrutura de anúncios e dados mockados
- [x] Criar hook useAds para consumir anúncios ativos com reatividade
- [x] Criar componente AdsCarousel com autoplay (4s), indicadores de posição e navegação ao prestador
- [x] Substituir seção "Profissionais em Destaque" na Home pelo carrossel
- [x] Adicionar seção "Anúncios" no painel admin (CRUD + upload de imagem + seletor de prestador)
- [x] Ocultar seção da Home quando não houver anúncios ativos
- [x] Botão "Anúncios" na stats bar do dashboard-admin para acesso rápido

## Correções UI (27/04)
- [x] Corrigir seletor de categoria no painel admin (stopPropagation no sheet + ScrollView para todas as 13 categorias)
- [x] Ajustar imagens cortadas no carrossel de Destaques da Home (altura 210, dimensões explícitas)

## Correções Críticas Admin (27/04 - v2)
- [x] Corrigir logout do painel admin (definitivo) — usa signOut() do AuthContext
- [x] Corrigir seletor de categoria no painel admin — dropdown inline sem Modal aninhado

## Card "Em breve" automático (27/04)
- [x] Exibir card "Em breve" em categorias sem prestadores cadastrados
- [x] Ocultar "Em breve" automaticamente quando um prestador for adicionado (baseado nos dados reais)

## Tela de Gerenciamento de Serviços no Admin (27/04)
- [x] Criar tela admin/services.tsx com layout da Home (seções por categoria)
- [x] Cards horizontais com botões Editar e Excluir
- [x] Modal de criação/edição de serviço (nome, categoria, imagem)
- [x] Confirmação de exclusão com Alert
- [x] Card "Em breve" para categorias sem serviços
- [x] Botão "Serviços" na stats bar do dashboard-admin
- [x] Alterações refletem imediatamente na Home via useAdminServices

## Perfil e Notificações Funcionais (27/04)
- [x] Edição de perfil: upload de foto da galeria (expo-image-picker, crop 1:1)
- [x] Edição de perfil: alterar nome com persistência no AsyncStorage
- [x] AuthContext: suporte a updateProfile (nome + avatar)
- [x] Sistema de notificações: contexto global (NotificationsContext) com persistência
- [x] Badge de contagem de não lidas na tab Perfil e no item de menu
- [x] Tela de notificações funcional com lista, marcar como lida e limpar tudo
- [x] Notificações de boas-vindas na primeira abertura do app

## Correções Status Bar e Sino (27/04)
- [x] Corrigir sino de notificações na Home (adicionado onPress + badge real do NotificationsContext)
- [x] Ajustar status bar para ícones do sistema visíveis sobre fundo branco (style="dark", translucent=false)

## Edição de Serviços Admin (27/04)
- [x] Editar nome dos serviços existentes no gerenciador admin (mock e admin)
- [x] Editar foto dos serviços existentes via galeria no gerenciador admin
- [x] Editar categoria dos serviços existentes no gerenciador admin
- [x] Modal de edição funcional para serviços novos e existentes (dropdown inline, sem Modal aninhado)

## Persistência de Dados Admin (27/04)
- [x] Migrar adminDB (serviços) para AsyncStorage com carregamento na inicialização e resetCache
- [x] adsDB (anúncios) já tinha persistência — verificado e correto
- [x] Dados persistem ao reiniciar o app (AsyncStorage @chamaja_admin_services e @chamaja_ads)

## Correções e Melhorias (28/04)
- [x] Ocultar serviço padrão quando houver versão personalizada no admin (ID override-{mockId})
- [x] Corrigir mapeamento de categoryId no painel admin (upsertServiceWithId com ID correto)
- [x] Persistência global dos prestadores cadastrados (providersDB + AsyncStorage @chamaja_providers)
- [x] Barra de pesquisa funcional para todos os serviços (mock + admin + prestadores reais)
- [x] Listagem de profissionais por categoria inclui prestadores reais do providersDB

## Campo WhatsApp nos Serviços Admin (28/04)
- [ ] Adicionar campo `whatsapp` na interface Service (admin-database.ts)
- [ ] Adicionar input de WhatsApp no formulário de criação/edição do painel admin
- [ ] Exibir botão "Chamar no WhatsApp" na tela de detalhe do serviço quando whatsapp estiver preenchido
- [ ] Abrir WhatsApp com mensagem pré-definida ao tocar no botão
## Campo WhatsApp nos Serviços Admin (28/04)
- [x] Adicionar campo `whatsapp` na interface Service (admin-database.ts)
- [x] Adicionar input de WhatsApp no formulário de criação/edição do painel admin
- [x] Exibir botão "Chamar no WhatsApp" na tela de detalhe do serviço quando whatsapp estiver preenchido
- [x] Abrir WhatsApp com mensagem pré-definida ao tocar no botão

## Modo Edição Admin na Home (28/04)
- [x] Botão discreto de ativação do Modo Edição no header (apenas para admin)
- [x] Banner verde indicando que o Modo Edição está ativo
- [x] Botão "+ Adicionar" serviço visível no Modo Edição
- [x] Modal de criação de serviço com campos: nome, categoria, imagem, WhatsApp, exibir na Home
- [x] Botão de edição (lápis azul) em cada card no Modo Edição
- [x] Botão de exclusão (lixeira vermelha) em cada card com confirmação
- [x] Drag-and-drop para reordenar serviços (segurar e arrastar)
- [x] Persistência da ordem no AsyncStorage via displayOrder
- [x] Botão WhatsApp (ícone verde) em cada card quando número estiver cadastrado
- [x] Cards com borda verde e sombra destacada no Modo Edição
- [x] Campo displayOrder adicionado à interface Service
- [x] Método reorderServices adicionado ao adminDB

## Bug Fix: Serviços admin por categoria (29/04)
- [x] Corrigir tela categories/[section].tsx para buscar serviços do adminDB
- [x] Filtro duplo: por categoryId (exato) + fallback por nome normalizado da categoria
- [x] Serviços admin aparecem antes dos mock na listagem
- [x] Badge verde "verificado" nos cards de serviços admin
- [x] Botão WhatsApp nos cards da tela de categoria
- [x] Contador de serviços com indicação de quantos são do admin
- [x] Estado de loading enquanto busca no adminDB

## Bug Fix + Melhoria: Serviço admin na busca e campos completos (29/04)
- [x] Corrigir bug "Em breve" ao clicar em serviço admin na busca
- [x] Garantir que busca navega para /admin-services/[serviceId] para serviços admin
- [x] Adicionar campo descrição no formulário admin
- [x] Adicionar campo endereço (bairro/cidade) no formulário admin
- [x] Adicionar galeria de fotos (múltiplas imagens) no formulário admin
- [x] Atualizar interface Service com novos campos
- [x] Atualizar tela de detalhe do serviço admin para exibir descrição, endereço e galeria
- [x] Atualizar formulário inline da Home com novos campos

## Sistema de Roles Admin/User (29/04)
- [x] Adicionar campo role ("admin" | "user") na interface User do AuthContext
- [x] Verificar role via admin-database ao fazer login (email match → admin)
- [x] Expor isAdmin no AuthContext para uso em todo o app
- [x] Proteger Modo Edição na Home: ocultar botão para usuários comuns
- [x] Proteger painel admin: redirecionar usuários sem role admin
- [x] Criar hook useIsAdmin para centralizar verificação de permissão
- [x] Verificação backend via adminProcedure no tRPC

## Estrutura 3 Níveis: Categoria → Subcategoria → Serviço (29/04)
- [x] Adicionar tipo Subcategory e mapa subcategoriesByCategory no mock.ts
- [x] Adicionar campo subcategoryId na interface Service do admin-database
- [x] Atualizar createService e upsertServiceWithId para aceitar subcategoryId
- [x] Atualizar formulário admin na Home com dropdown de subcategoria dependente
- [ ] Atualizar formulário admin no dashboard-admin com dropdown de subcategoria
- [x] Atualizar tela de categoria para exibir subcategorias (não serviços diretamente)
- [x] Criar tela de subcategoria para listar serviços dentro da subcategoria
- [x] Corrigir "Em breve" para aparecer apenas quando não há serviços na subcategoria
