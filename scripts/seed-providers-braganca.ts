import 'dotenv/config';
import { getDb } from '../server/db';
import { providers } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const SEED_PROVIDERS = [
  {
    id: "prov-eletricista-joao",
    name: "Eletricista João",
    category: "Eletricista",
    categoryId: "reformas-reparos",
    subcategoryId: "eletricista",
    subcategoryName: "Eletricista",
    city: "Bragança Paulista",
    neighborhood: "Centro",
    phone: "5511999990001",
    whatsapp: "11999990001",
    description: "Profissional especializado em elétrica residencial e predial. Instalações, reparos, padrão de entrada, chuveiro, tomadas, iluminação e curtos-circuitos. Atendimento emergencial 24h.",
    rating: 4.9,
    ratingCount: 128,
    // Coordenadas Centro
    latitude: -22.9520,
    longitude: -46.5400,
    avatarUri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    coverUri: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80",
    isVerified: true,
    destaque: true,
    plan: "premium",
    onlineStatus: true,
    isActive: true,
    responseTime: "Responde em até 10 minutos",
    clientsServed: 320,
    foundedYear: 2015,
    topBadge: "Patrocinado",
    services: JSON.stringify([
      { name: "Instalação de Chuveiro", price: 80 },
      { name: "Troca de Fiação Geral", price: 1200 },
      { name: "Instalação de Tomadas e Interruptores", price: 40 },
      { name: "Manutenção de Padrão de Entrada", price: 300 }
    ])
  },
  {
    id: "prov-encanador-carlos",
    name: "Encanador Carlos",
    category: "Encanador",
    categoryId: "reformas-reparos",
    subcategoryId: "encanador",
    subcategoryName: "Encanador",
    city: "Bragança Paulista",
    neighborhood: "Vila Aparecida",
    phone: "5511999990002",
    whatsapp: "11999990002",
    description: "Encanador profissional para caça-vazamento, reparo de vazamentos em canos de PVC e cobre, limpeza de caixa de água, manutenção de torneiras, vasos sanitários e válvulas hydra.",
    rating: 4.8,
    ratingCount: 96,
    // Coordenadas Vila Aparecida
    latitude: -22.9460,
    longitude: -46.5450,
    avatarUri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    coverUri: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80",
    isVerified: true,
    destaque: false,
    plan: "free",
    onlineStatus: true,
    isActive: true,
    responseTime: "Responde em 20 minutos",
    clientsServed: 210,
    foundedYear: 2018,
    topBadge: "Verificado",
    services: JSON.stringify([
      { name: "Caça-Vazamento", price: 150 },
      { name: "Limpeza de Caixa d'Água", price: 120 },
      { name: "Desentupimento de Ralo", price: 90 }
    ])
  },
  {
    id: "prov-diarista-ana",
    name: "Diarista Ana",
    category: "Diarista",
    categoryId: "servicos-domesticos",
    subcategoryId: "diarista",
    subcategoryName: "Diarista",
    city: "Bragança Paulista",
    neighborhood: "Jardim América",
    phone: "5511999990003",
    whatsapp: "11999990003",
    description: "Serviços de limpeza residencial e comercial de alta qualidade. Faxina padrão, faxina pesada, pré/pós mudança, passar roupa e organização de closets. Confiança e capricho garantidos.",
    rating: 4.9,
    ratingCount: 74,
    // Coordenadas Jardim América
    latitude: -22.9440,
    longitude: -46.5360,
    avatarUri: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    coverUri: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80",
    isVerified: true,
    destaque: true,
    plan: "premium",
    onlineStatus: true,
    isActive: true,
    responseTime: "Responde em 15 minutos",
    clientsServed: 180,
    foundedYear: 2019,
    topBadge: "Destaque",
    services: JSON.stringify([
      { name: "Faxina Residencial Diária", price: 160 },
      { name: "Faxina Comercial Diária", price: 200 },
      { name: "Serviço de Passadeira por hora", price: 30 }
    ])
  },
  {
    id: "prov-marido-aluguel",
    name: "Marido de Aluguel",
    category: "Marido de Aluguel",
    categoryId: "reformas-reparos",
    subcategoryId: "marido-aluguel",
    subcategoryName: "Marido de Aluguel",
    city: "Bragança Paulista",
    neighborhood: "Jardim das Palmeiras",
    phone: "5511999990004",
    whatsapp: "11999990004",
    description: "Montagem e desmontagem de móveis, fixação de suportes de TV, cortinas, prateleiras, varais. Troca de lâmpadas, reatores e pequenos reparos elétricos e hidráulicos em geral.",
    rating: 4.7,
    ratingCount: 53,
    // Coordenadas Jardim das Palmeiras
    latitude: -22.9660,
    longitude: -46.5420,
    avatarUri: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    coverUri: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
    isVerified: true,
    destaque: true,
    plan: "premium",
    onlineStatus: true,
    isActive: true,
    responseTime: "Responde em 30 minutos",
    clientsServed: 140,
    foundedYear: 2020,
    topBadge: "Patrocinado",
    services: JSON.stringify([
      { name: "Instalação de Suporte de TV", price: 70 },
      { name: "Montagem de Guarda-Roupa", price: 150 },
      { name: "Troca de Torneira", price: 50 },
      { name: "Fixação de Quadros e Prateleiras", price: 30 }
    ])
  },
  {
    id: "prov-pintor-marcos",
    name: "Pintor Profissional",
    category: "Pintor",
    categoryId: "reformas-reparos",
    subcategoryId: "pintor",
    subcategoryName: "Pintor",
    city: "Bragança Paulista",
    neighborhood: "Santa Luzia",
    phone: "5511999990005",
    whatsapp: "11999990005",
    description: "Pintor experiente para residências, apartamentos e prédios comerciais. Aplicação de massa corrida, massa acrílica, texturas, grafiato e verniz. Tintas premium para acabamento excelente.",
    rating: 4.8,
    ratingCount: 42,
    // Coordenadas Santa Luzia
    latitude: -22.9580,
    longitude: -46.5500,
    avatarUri: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80",
    coverUri: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500&q=80",
    isVerified: true,
    destaque: false,
    plan: "free",
    onlineStatus: true,
    isActive: true,
    responseTime: "Responde em 1 hora",
    clientsServed: 95,
    foundedYear: 2017,
    topBadge: "Verificado",
    services: JSON.stringify([
      { name: "Pintura de Parede Interna (m²)", price: 15 },
      { name: "Aplicação de Massa Corrida (m²)", price: 20 },
      { name: "Aplicação de Grafiato (m²)", price: 25 }
    ])
  },
  {
    id: "prov-com-mercado",
    name: "Mercado Bragantino",
    category: "Mercado",
    categoryId: "comercios",
    subcategoryId: "mercado",
    subcategoryName: "Mercado",
    city: "Bragança Paulista",
    neighborhood: "Jardim Recreio",
    phone: "5511999990006",
    whatsapp: "11999990006",
    description: "Mercado completo no Jardim Recreio. Setor de hortifruti fresco todos os dias, açougue com carnes selecionadas, padaria própria e mercearia completa. Faça seu pedido e receba em casa.",
    rating: 4.6,
    ratingCount: 120,
    // Coordenadas Jardim Recreio
    latitude: -22.9600,
    longitude: -46.5340,
    avatarUri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80",
    coverUri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80",
    isVerified: true,
    destaque: true,
    plan: "premium",
    onlineStatus: true,
    isActive: true,
    responseTime: "Responde em 5 minutos",
    clientsServed: 1250,
    foundedYear: 2012,
    topBadge: "Destaque",
    services: JSON.stringify([
      { name: "Cesta Básica Completa", price: 180 },
      { name: "Entrega em Domicílio", price: 10 }
    ])
  },
  {
    id: "prov-com-farmacia",
    name: "Farmácia São Lucas",
    category: "Farmácia",
    categoryId: "comercios",
    subcategoryId: "farmacia",
    subcategoryName: "Farmácia",
    city: "Bragança Paulista",
    neighborhood: "Centro",
    phone: "5511999990007",
    whatsapp: "11999990007",
    description: "A Farmácia São Lucas é a sua referência em saúde em Bragança Paulista. Grande estoque de medicamentos genéricos e de marca, setor de perfumaria, fraldas, higiene e atendimento 24h.",
    rating: 4.8,
    ratingCount: 85,
    // Coordenadas Centro (próximo à praça)
    latitude: -22.9530,
    longitude: -46.5430,
    avatarUri: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&q=80",
    coverUri: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&q=80",
    isVerified: true,
    destaque: false,
    plan: "free",
    onlineStatus: true,
    isActive: true,
    responseTime: "Responde em 8 minutos",
    clientsServed: 3400,
    foundedYear: 2005,
    topBadge: "Verificado",
    services: JSON.stringify([
      { name: "Aferição de Pressão", price: 0 },
      { name: "Aplicação de Injeção", price: 10 },
      { name: "Tele-entrega Medicamentos", price: 5 }
    ])
  },
  {
    id: "prov-com-pet",
    name: "Pet Shop Amigo Animal",
    category: "Pet Shop",
    categoryId: "comercios",
    subcategoryId: "pet-shop",
    subcategoryName: "Pet Shop",
    city: "Bragança Paulista",
    neighborhood: "Jardim América",
    phone: "5511999990008",
    whatsapp: "11999990008",
    description: "Amigo Animal oferece banho e tosa premium para cães e gatos, rações nacionais e importadas, farmácia veterinária, acessórios de passeio e brinquedos divertidos. Veterinário sob agendamento.",
    rating: 4.9,
    ratingCount: 45,
    // Coordenadas Jardim América
    latitude: -22.9430,
    longitude: -46.5350,
    avatarUri: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&q=80",
    coverUri: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500&q=80",
    isVerified: true,
    destaque: false,
    plan: "free",
    onlineStatus: true,
    isActive: true,
    responseTime: "Responde em 12 minutos",
    clientsServed: 650,
    foundedYear: 2021,
    topBadge: "Verificado",
    services: JSON.stringify([
      { name: "Banho e Tosa (Cão Porte Pequeno)", price: 70 },
      { name: "Banho e Tosa (Cão Porte Médio)", price: 90 },
      { name: "Banho Gato", price: 80 },
      { name: "Consulta Veterinária Geral", price: 120 }
    ])
  }
];

async function main() {
  console.log("Iniciando semeadura de prestadores e comércios em Bragança Paulista...");
  const db = await getDb();
  if (!db) {
    console.error("Erro: Banco de dados não disponível.");
    process.exit(1);
  }

  // Deletar os existentes com IDs semelhantes ou iguais
  console.log("Limpando prestadores antigos do seed...");
  for (const prov of SEED_PROVIDERS) {
    try {
      await db.delete(providers).where(eq(providers.id, prov.id));
    } catch (e) {
      console.warn(`Erro ao limpar prestador ${prov.id}:`, e);
    }
  }

  // Inserir os novos
  console.log("Inserindo novos registros de alta fidelidade...");
  for (const prov of SEED_PROVIDERS) {
    try {
      await db.insert(providers).values({
        id: prov.id,
        name: prov.name,
        category: prov.category,
        categoryId: prov.categoryId,
        subcategoryId: prov.subcategoryId,
        subcategoryName: prov.subcategoryName,
        city: prov.city,
        neighborhood: prov.neighborhood,
        phone: prov.phone,
        whatsapp: prov.whatsapp,
        description: prov.description,
        rating: prov.rating,
        ratingCount: prov.ratingCount,
        latitude: prov.latitude,
        longitude: prov.longitude,
        avatarUri: prov.avatarUri,
        coverUri: prov.coverUri,
        isVerified: prov.isVerified,
        destaque: prov.destaque,
        plan: prov.plan,
        onlineStatus: prov.onlineStatus,
        isActive: prov.isActive,
        responseTime: prov.responseTime,
        clientsServed: prov.clientsServed,
        foundedYear: prov.foundedYear,
        topBadge: prov.topBadge,
        services: prov.services
      });
      console.log(`[SUCESSO] Inserido: ${prov.name} (${prov.neighborhood})`);
    } catch (err) {
      console.error(`Erro ao inserir prestador ${prov.name}:`, err);
    }
  }

  console.log("Semeadura concluída!");
  process.exit(0);
}

main();
