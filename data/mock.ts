export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type Service = {
  id: string;
  name: string;
  categoryId: string;
  image: string;
};

export type Review = {
  id: string;
  professionalId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Professional = {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  rating: number;
  reviewCount: number;
  neighborhood: string;
  distance: string;
  phone: string;
  description: string;
  serviceArea: string;
  schedule: string;
  paymentMethods: string;
  avatar: string;
};

export const categories: Category[] = [
  { id: "assistencia-tecnica", name: "Assistência\nTécnica", icon: "settings" },
  { id: "reformas-reparos", name: "Reformas e\nReparos", icon: "build" },
  { id: "eventos", name: "Eventos", icon: "celebration" },
  { id: "servicos-domesticos", name: "Serviços\nDomésticos", icon: "home" },
  { id: "aulas", name: "Aulas", icon: "school" },
];

export const sections = [
  { id: "reformas-reparos", title: "Reformas e Reparos" },
  { id: "assistencia-tecnica", title: "Assistência Técnica" },
  { id: "servicos-domesticos", title: "Serviços Domésticos" },
];

export const services: Service[] = [
  // Reformas e Reparos
  {
    id: "eletricista",
    name: "Eletricista",
    categoryId: "reformas-reparos",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80",
  },
  {
    id: "marido-aluguel",
    name: "Marido de aluguel",
    categoryId: "reformas-reparos",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  },
  {
    id: "mudancas-carretos",
    name: "Mudanças\nCarretos",
    categoryId: "reformas-reparos",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  },
  // Assistência Técnica
  {
    id: "ar-condicionado",
    name: "Ar condicionado",
    categoryId: "assistencia-tecnica",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80",
  },
  {
    id: "celular",
    name: "Celular",
    categoryId: "assistencia-tecnica",
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80",
  },
  {
    id: "geladeira-freezer",
    name: "Geladeira\ne freezer",
    categoryId: "assistencia-tecnica",
    image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80",
  },
  // Serviços Domésticos
  {
    id: "baba",
    name: "Babá",
    categoryId: "servicos-domesticos",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80",
  },
  {
    id: "cozinheira",
    name: "Cozinheira",
    categoryId: "servicos-domesticos",
    image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80",
  },
  {
    id: "diarista",
    name: "Diarista",
    categoryId: "servicos-domesticos",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
  },
  {
    id: "passadeira",
    name: "Passadeira",
    categoryId: "servicos-domesticos",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80",
  },
  {
    id: "lavanderia",
    name: "Lavanderia",
    categoryId: "servicos-domesticos",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80",
  },
  {
    id: "jardineiro",
    name: "Jardineiro",
    categoryId: "servicos-domesticos",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80",
  },
];

export const professionals: Professional[] = [
  {
    id: "eletrica-ze",
    name: "Elétrica do Zé",
    category: "Eletricista",
    categoryId: "eletricista",
    rating: 4.9,
    reviewCount: 128,
    neighborhood: "Centro",
    distance: "1,2 km",
    phone: "5511999990001",
    description:
      "Serviços elétricos em geral. Residencial, comercial e predial. Instalações, manutenção e reparos com qualidade e segurança.",
    serviceArea: "Centro, Vila Nova, Jd. América e regiões",
    schedule: "Segunda a Sábado: 7h às 19h",
    paymentMethods: "Dinheiro, Cartão, PIX",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  },
  {
    id: "eletricista-rapido",
    name: "Eletricista Rápido",
    category: "Eletricista",
    categoryId: "eletricista",
    rating: 4.8,
    reviewCount: 93,
    neighborhood: "Jd. São Paulo",
    distance: "2,1 km",
    phone: "5511999990002",
    description:
      "Atendimento rápido e eficiente para emergências elétricas. Disponível nos finais de semana.",
    serviceArea: "Jd. São Paulo, Centro e adjacências",
    schedule: "Segunda a Domingo: 8h às 20h",
    paymentMethods: "Dinheiro, PIX",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  },
  {
    id: "mestre-eletrica",
    name: "Mestre da Elétrica",
    category: "Eletricista",
    categoryId: "eletricista",
    rating: 4.9,
    reviewCount: 156,
    neighborhood: "Vila Nova",
    distance: "2,3 km",
    phone: "5511999990003",
    description:
      "Mais de 15 anos de experiência em instalações elétricas residenciais e comerciais.",
    serviceArea: "Vila Nova, Jd. América, Centro",
    schedule: "Segunda a Sexta: 7h às 18h",
    paymentMethods: "Dinheiro, Cartão, PIX",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
  },
  {
    id: "luz-forte",
    name: "Luz Forte Serviços",
    category: "Eletricista",
    categoryId: "eletricista",
    rating: 4.7,
    reviewCount: 64,
    neighborhood: "Jd. América",
    distance: "3,0 km",
    phone: "5511999990004",
    description:
      "Serviços elétricos com garantia. Orçamento sem compromisso.",
    serviceArea: "Jd. América e região",
    schedule: "Segunda a Sábado: 8h às 18h",
    paymentMethods: "Dinheiro, PIX",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80",
  },
  {
    id: "eletricista-confiavel",
    name: "Eletricista Confiável",
    category: "Eletricista",
    categoryId: "eletricista",
    rating: 4.8,
    reviewCount: 112,
    neighborhood: "Centro",
    distance: "3,2 km",
    phone: "5511999990005",
    description:
      "Profissional certificado com foco em segurança e qualidade.",
    serviceArea: "Centro e toda a cidade",
    schedule: "Segunda a Sábado: 7h às 17h",
    paymentMethods: "Dinheiro, Cartão, PIX",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
  },
  // Marido de aluguel
  {
    id: "marido-aluguel-1",
    name: "Marido de Aluguel Pro",
    category: "Marido de aluguel",
    categoryId: "marido-aluguel",
    rating: 4.8,
    reviewCount: 87,
    neighborhood: "Centro",
    distance: "1,5 km",
    phone: "5511999990006",
    description:
      "Pequenos reparos, instalações e manutenção em geral para sua casa.",
    serviceArea: "Toda a cidade",
    schedule: "Segunda a Sábado: 8h às 18h",
    paymentMethods: "Dinheiro, PIX",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
  },
  // Babá
  {
    id: "baba-1",
    name: "Cuidados com Amor",
    category: "Babá",
    categoryId: "baba",
    rating: 5.0,
    reviewCount: 45,
    neighborhood: "Jardins",
    distance: "0,8 km",
    phone: "5511999990007",
    description:
      "Cuidados especializados para crianças de 0 a 10 anos. Experiência com primeiros socorros.",
    serviceArea: "Jardins, Moema e adjacências",
    schedule: "Segunda a Sexta: 7h às 19h",
    paymentMethods: "Dinheiro, PIX, Transferência",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  },
  // Cozinheira
  {
    id: "cozinheira-1",
    name: "Sabor Caseiro",
    category: "Cozinheira",
    categoryId: "cozinheira",
    rating: 4.9,
    reviewCount: 72,
    neighborhood: "Vila Madalena",
    distance: "2,0 km",
    phone: "5511999990008",
    description:
      "Refeições saudáveis e saborosas para sua família. Cardápio personalizado.",
    serviceArea: "Vila Madalena, Pinheiros e região",
    schedule: "Segunda a Sexta: 8h às 17h",
    paymentMethods: "Dinheiro, PIX",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  },
  // Diarista
  {
    id: "diarista-1",
    name: "Limpeza Total",
    category: "Diarista",
    categoryId: "diarista",
    rating: 4.7,
    reviewCount: 98,
    neighborhood: "Brooklin",
    distance: "1,8 km",
    phone: "5511999990009",
    description:
      "Limpeza completa e organização de residências e escritórios.",
    serviceArea: "Brooklin, Santo André e região",
    schedule: "Segunda a Sábado: 7h às 17h",
    paymentMethods: "Dinheiro, PIX",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&q=80",
  },
];

export function getProfessionalsByService(serviceId: string): Professional[] {
  return professionals.filter((p) => p.categoryId === serviceId);
}

export function getServicesByCategory(categoryId: string): Service[] {
  return services.filter((s) => s.categoryId === categoryId);
}

export function getProfessionalById(id: string): Professional | undefined {
  return professionals.find((p) => p.id === id);
}

export function getSectionServices(sectionId: string): Service[] {
  return services.filter((s) => s.categoryId === sectionId).slice(0, 3);
}

export const reviews: Review[] = [
  {
    id: "review-1",
    professionalId: "eletrica-ze",
    userName: "Maria Silva",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    rating: 5,
    comment: "Excelente profissional! Resolveu o problema rápido e com qualidade. Recomendo!",
    createdAt: "2024-04-20",
  },
  {
    id: "review-2",
    professionalId: "eletrica-ze",
    userName: "João Santos",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    rating: 5,
    comment: "Muito profissional e educado. Fez um ótimo trabalho na instalação.",
    createdAt: "2024-04-18",
  },
  {
    id: "review-3",
    professionalId: "eletrica-ze",
    userName: "Ana Costa",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    rating: 4,
    comment: "Bom profissional, mas chegou um pouco atrasado.",
    createdAt: "2024-04-15",
  },
  {
    id: "review-4",
    professionalId: "eletrica-ze",
    userName: "Pedro Oliveira",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    rating: 5,
    comment: "Serviço impecável! Voltaria a contratar com certeza.",
    createdAt: "2024-04-12",
  },
  {
    id: "review-5",
    professionalId: "eletricista-rapido",
    userName: "Carla Mendes",
    userAvatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&q=80",
    rating: 5,
    comment: "Chegou super rápido! Resolveu meu problema em minutos.",
    createdAt: "2024-04-19",
  },
  {
    id: "review-6",
    professionalId: "eletricista-rapido",
    userName: "Lucas Ferreira",
    userAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80",
    rating: 4,
    comment: "Bom atendimento, preço justo.",
    createdAt: "2024-04-17",
  },
  {
    id: "review-7",
    professionalId: "cozinheira-1",
    userName: "Beatriz Lima",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    rating: 5,
    comment: "As refeições são deliciosas! Minha família adora. Muito recomendado!",
    createdAt: "2024-04-21",
  },
  {
    id: "review-8",
    professionalId: "cozinheira-1",
    userName: "Roberto Alves",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    rating: 5,
    comment: "Profissional muito atenciosa. Respeita as preferências e restrições alimentares.",
    createdAt: "2024-04-19",
  },
  {
    id: "review-9",
    professionalId: "baba-1",
    userName: "Fernanda Gomes",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    rating: 5,
    comment: "Confio completamente nela com meus filhos. Muito responsável e carinhosa!",
    createdAt: "2024-04-20",
  },
  {
    id: "review-10",
    professionalId: "baba-1",
    userName: "Thiago Rocha",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    rating: 5,
    comment: "Excelente cuidadora. Meu filho pede por ela todos os dias!",
    createdAt: "2024-04-18",
  },
];

export function getReviewsByProfessional(professionalId: string): Review[] {
  return reviews.filter((r) => r.professionalId === professionalId);
}

export function getAverageRating(professionalId: string): number {
  const professionalReviews = getReviewsByProfessional(professionalId);
  if (professionalReviews.length === 0) return 0;
  const sum = professionalReviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / professionalReviews.length) * 10) / 10;
}

export function addReview(review: Omit<Review, "id" | "createdAt">): Review {
  const newReview: Review = {
    ...review,
    id: `review-${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  reviews.push(newReview);
  return newReview;
}
