export type BusinessType = "alimentacao" | "servicos" | "produtos" | "comercios";

export interface CategoryItem {
  id: string;
  label: string;
  name?: string;
  icon: string;
  group?: string;
  description?: string;
}

export interface CategoryGroup {
  id: string;
  title: string;
  icon: string;
  categories: CategoryItem[];
}

export const COMPREHENSIVE_CATEGORIES: CategoryItem[] = [
  // ── 1. Construção, Reparos & Manutenção ──
  { id: "reformas-reparos", label: "Reformas e Reparos", name: "Reformas e Reparos", icon: "build", group: "reparos", description: "Pedreiros, eletricistas, encanadores, pintores" },
  { id: "manutencao", label: "Manutenção", name: "Manutenção", icon: "handyman", group: "reparos", description: "Manutenção predial, residencial e industrial" },

  // ── 2. Casa, Limpeza & Jardinagem ──
  { id: "servicos-domesticos", label: "Serviços Domésticos", name: "Serviços Domésticos", icon: "home", group: "casa", description: "Diaristas, passadeiras, cozinheiras" },
  { id: "limpeza", label: "Limpeza", name: "Limpeza", icon: "cleaning-services", group: "casa", description: "Limpeza pós-obra, estofados, especializada" },
  { id: "jardinagem", label: "Jardinagem", name: "Jardinagem", icon: "yard", group: "casa", description: "Paisagismo, poda, manutenção de jardins" },
  { id: "seguranca", label: "Segurança", name: "Segurança", icon: "security", group: "casa", description: "Câmeras, alarmes, portaria, vigilância" },

  // ── 3. Tecnologia, Informática & Design ──
  { id: "assistencia-tecnica", label: "Assistência Técnica", name: "Assistência Técnica", icon: "settings", group: "tech", description: "Celulares, computadores, eletrodomésticos" },
  { id: "tecnologia", label: "Tecnologia", name: "Tecnologia", icon: "devices", group: "tech", description: "Sistemas, automação, redes e soluções tech" },
  { id: "informatica", label: "Informática", name: "Informática", icon: "computer", group: "tech", description: "Manutenção de PCs, notebooks, impressoras" },
  { id: "design", label: "Design", name: "Design", icon: "brush", group: "tech", description: "Design gráfico, branding, UI/UX e criação" },
  { id: "marketing", label: "Marketing", name: "Marketing", icon: "campaign", group: "tech", description: "Marketing digital, redes sociais, tráfego pago" },

  // ── 4. Saúde, Beleza & Bem-estar ──
  { id: "saude", label: "Saúde", name: "Saúde", icon: "medical-services", group: "saude", description: "Médicos, dentistas, clínicas, fisioterapia" },
  { id: "beleza-estetica", label: "Beleza e Estética", name: "Beleza e Estética", icon: "content-cut", group: "saude", description: "Salões, barbearias, manicures, estética" },
  { id: "academias", label: "Academias e Fitness", name: "Academias e Fitness", icon: "fitness-center", group: "saude", description: "Personal trainers, academias, crossfit, pilates" },

  // ── 5. Pets & Animais ──
  { id: "pets", label: "Pet", name: "Pet", icon: "pets", group: "pets", description: "Pet shops, veterinários, banho e tosa, adestramento" },

  // ── 6. Automotivo, Transporte & Logística ──
  { id: "automotivo", label: "Automotivo", name: "Automotivo", icon: "directions-car", group: "auto", description: "Mecânicas, auto elétricas, lava-rápido, funilaria" },
  { id: "transporte", label: "Transporte", name: "Transporte", icon: "directions-bus", group: "auto", description: "Motoristas particulares, vans, transporte executivo" },
  { id: "entregas", label: "Entregas", name: "Entregas", icon: "local-shipping", group: "auto", description: "Motoboys, carretos, fretes rápidos" },
  { id: "logistica", label: "Logística", name: "Logística", icon: "inventory", group: "auto", description: "Mudanças, armazenagem, fretes pesados" },

  // ── 7. Serviços Profissionais, Jurídico & Finanças ──
  { id: "juridico", label: "Jurídico", name: "Jurídico", icon: "gavel", group: "profissionais", description: "Advogados, consultoria jurídica, contratos" },
  { id: "contabilidade", label: "Contabilidade", name: "Contabilidade", icon: "calculate", group: "profissionais", description: "Contadores, abertura de empresas, impostos" },
  { id: "consultoria", label: "Consultoria", name: "Consultoria", icon: "trending-up", group: "profissionais", description: "Consultoria empresarial, financeira e gestão" },
  { id: "imobiliario", label: "Imobiliário", name: "Imobiliário", icon: "real-estate-agent", group: "profissionais", description: "Corretores, imobiliárias, administração de imóveis" },

  // ── 8. Educação, Música & Eventos ──
  { id: "educacao", label: "Aulas Particulares", name: "Aulas Particulares", icon: "school", group: "educacao", description: "Professores particulares, reforço escolar, idiomas" },
  { id: "musica", label: "Música", name: "Música", icon: "music-note", group: "educacao", description: "Aulas de música, bandas, DJs, instrumentos" },
  { id: "fotografia", label: "Fotografia", name: "Fotografia", icon: "photo-camera", group: "eventos", description: "Fotógrafos, filmagem, ensaios, coberturas" },
  { id: "eventos", label: "Eventos", name: "Eventos", icon: "celebration", group: "eventos", description: "Festas, buffets, decoração, assessoria de eventos" },
  { id: "turismo", label: "Turismo", name: "Turismo", icon: "flight", group: "eventos", description: "Agências de viagem, passeios, guias, hospedagem" },

  // ── 9. Comércio, Moda, Artesanato & Agro ──
  { id: "comercios", label: "Alimentação e Comércios", name: "Alimentação e Comércios", icon: "storefront", group: "comercio", description: "Restaurantes, lanchonetes, mercados, lojas" },
  { id: "moda", label: "Moda", name: "Moda", icon: "checkroom", group: "comercio", description: "Lojas de roupas, calçados, costura, acessórios" },
  { id: "artesanato", label: "Artesanato", name: "Artesanato", icon: "palette", group: "comercio", description: "Produtos artesanais, presentes, decoração manual" },
  { id: "agricultura", label: "Agricultura", name: "Agricultura", icon: "agriculture", group: "agro", description: "Produtos rurais, insumos agrícolas, jardinagem pesada" },
  { id: "outros", label: "Outros", name: "Outros", icon: "more-horiz", group: "outros", description: "Outros serviços e especialidades" },
];

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "reparos",
    title: "Construção & Reparos",
    icon: "build",
    categories: COMPREHENSIVE_CATEGORIES.filter((c) => c.group === "reparos"),
  },
  {
    id: "casa",
    title: "Casa, Limpeza & Segurança",
    icon: "home",
    categories: COMPREHENSIVE_CATEGORIES.filter((c) => c.group === "casa"),
  },
  {
    id: "tech",
    title: "Tecnologia, Informática & Design",
    icon: "devices",
    categories: COMPREHENSIVE_CATEGORIES.filter((c) => c.group === "tech"),
  },
  {
    id: "saude",
    title: "Saúde, Beleza & Fitness",
    icon: "medical-services",
    categories: COMPREHENSIVE_CATEGORIES.filter((c) => c.group === "saude"),
  },
  {
    id: "pets",
    title: "Pets & Animais",
    icon: "pets",
    categories: COMPREHENSIVE_CATEGORIES.filter((c) => c.group === "pets"),
  },
  {
    id: "auto",
    title: "Veículos, Transporte & Entregas",
    icon: "directions-car",
    categories: COMPREHENSIVE_CATEGORIES.filter((c) => c.group === "auto"),
  },
  {
    id: "profissionais",
    title: "Serviços Profissionais & Gestão",
    icon: "business-center",
    categories: COMPREHENSIVE_CATEGORIES.filter((c) => c.group === "profissionais"),
  },
  {
    id: "educacao",
    title: "Aulas, Música & Educação",
    icon: "school",
    categories: COMPREHENSIVE_CATEGORIES.filter((c) => c.group === "educacao"),
  },
  {
    id: "eventos",
    title: "Eventos, Fotografia & Turismo",
    icon: "celebration",
    categories: COMPREHENSIVE_CATEGORIES.filter((c) => c.group === "eventos"),
  },
  {
    id: "comercio",
    title: "Comércios, Moda & Artesanato",
    icon: "storefront",
    categories: COMPREHENSIVE_CATEGORIES.filter((c) => c.group === "comercio"),
  },
  {
    id: "outros",
    title: "Agro & Outras Categorias",
    icon: "more-horiz",
    categories: COMPREHENSIVE_CATEGORIES.filter(
      (c) => c.group === "agro" || c.group === "outros"
    ),
  },
];

export const BUSINESS_TYPES = [
  { id: "alimentacao", label: "Alimentação", icon: "restaurant" },
  { id: "servicos", label: "Serviços", icon: "build" },
  { id: "produtos", label: "Produtos", icon: "shopping-bag" },
  { id: "comercios", label: "Comércios", icon: "storefront" },
] as const;

export const CATEGORIES_BY_TYPE: Record<string, CategoryItem[]> = {
  alimentacao: [
    { id: "restaurantes", label: "Restaurantes", icon: "restaurant" },
    { id: "lanchonetes", label: "Lanchonetes", icon: "fastfood" },
    { id: "pizzarias", label: "Pizzarias", icon: "local-pizza" },
    { id: "hamburguerias", label: "Hamburguerias", icon: "lunch-dining" },
    { id: "padarias", label: "Padarias", icon: "bakery-dining" },
    { id: "docerias", label: "Docerias", icon: "cake" },
    { id: "sorveterias", label: "Sorveterias", icon: "icecream" },
    { id: "cafeterias", label: "Cafeterias", icon: "local-cafe" },
    { id: "bares", label: "Bares", icon: "local-bar" },
    { id: "adegas", label: "Adegas", icon: "wine-bar" },
  ],
  comercios: [
    { id: "tabacarias", label: "Tabacarias", icon: "smoking-rooms" },
    { id: "mercados", label: "Mercados", icon: "store" },
    { id: "conveniencias", label: "Conveniências", icon: "storefront" },
    { id: "farmacias", label: "Farmácias", icon: "local-pharmacy" },
    { id: "pet-shops", label: "Pet Shops", icon: "pets" },
    { id: "lojas-de-roupas", label: "Lojas de Roupas", icon: "checkroom" },
    { id: "calcados", label: "Calçados", icon: "shopping-bag" },
    { id: "eletronicos", label: "Eletrônicos", icon: "devices" },
    { id: "informatica", label: "Informática", icon: "computer" },
    { id: "materiais-de-construcao", label: "Materiais de Construção", icon: "hardware" },
    { id: "moveis", label: "Móveis", icon: "chair" },
  ],
  servicos: COMPREHENSIVE_CATEGORIES,
  produtos: [
    { id: "produtos-artesanais", label: "Produtos Artesanais", icon: "brush" },
    { id: "produtos-naturais", label: "Produtos Naturais", icon: "eco" },
    { id: "outros-produtos", label: "Outros Produtos", icon: "shopping-bag" },
  ],
};

export const ALL_CATEGORIES = COMPREHENSIVE_CATEGORIES;

export const getCategoryById = (id: string): CategoryItem => {
  return (
    COMPREHENSIVE_CATEGORIES.find((c) => c.id === id) || {
      id,
      label: id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      name: id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      icon: "label",
    }
  );
};
