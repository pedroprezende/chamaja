export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type Subcategory = {
  id: string;
  name: string;
  categoryId: string;
  icon?: string;
  imageUrl?: string;
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

export type ProfessionalType = "FREE" | "PREMIUM";

export type PremiumPlan = {
  id: string;
  name: string;
  price: number;
  period: "monthly" | "annual";
  description: string;
  benefits: string[];
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
  type: ProfessionalType;
  city: string;
  premiumExpiresAt?: string;
};

export type ProfessionalRegistration = {
  name: string;
  category: string;
  city: string;
  neighborhood: string;
  phone: string;
  avatar: string;
  description: string;
};

// ─── SUBCATEGORIAS por categoria ────────────────────────────────────────────
export const subcategoriesByCategory: Record<string, Subcategory[]> = {
  "reformas-reparos": [
    { id: "eletricista",       name: "Eletricista",         categoryId: "reformas-reparos",      icon: "electrical-services", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80" },
    { id: "encanador",         name: "Encanador",           categoryId: "reformas-reparos",      icon: "plumbing",             imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
    { id: "pedreiro",          name: "Pedreiro",            categoryId: "reformas-reparos",      icon: "construction",         imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
    { id: "pintor",            name: "Pintor",              categoryId: "reformas-reparos",      icon: "format-paint",         imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80" },
    { id: "gesseiro",          name: "Gesseiro",            categoryId: "reformas-reparos",      icon: "build",                imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" },
    { id: "vidraceiro",        name: "Vidraceiro",          categoryId: "reformas-reparos",      icon: "window",               imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80" },
    { id: "serralheiro",       name: "Serralheiro",         categoryId: "reformas-reparos",      icon: "hardware",             imageUrl: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80" },
    { id: "marido-aluguel",    name: "Marido de Aluguel",   categoryId: "reformas-reparos",      icon: "handyman",             imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
    { id: "instalador-tv",     name: "Instalador de TV",    categoryId: "reformas-reparos",      icon: "tv",                   imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80" },
    { id: "montador-moveis",   name: "Montador de Móveis",  categoryId: "reformas-reparos",      icon: "chair",                imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80" },
  ],
  "assistencia-tecnica": [
    { id: "conserto-celular",  name: "Conserto de Celular", categoryId: "assistencia-tecnica",   icon: "phone-android",        imageUrl: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80" },
    { id: "tecnico-notebook",  name: "Técnico de Notebook", categoryId: "assistencia-tecnica",   icon: "laptop",               imageUrl: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=400&q=80" },
    { id: "tecnico-geladeira", name: "Técnico de Geladeira",categoryId: "assistencia-tecnica",   icon: "kitchen",              imageUrl: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80" },
    { id: "ar-condicionado",   name: "Ar-condicionado",     categoryId: "assistencia-tecnica",   icon: "ac-unit",              imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80" },
    { id: "maquina-lavar",     name: "Máquina de Lavar",    categoryId: "assistencia-tecnica",   icon: "local-laundry-service",imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80" },
    { id: "tecnico-tv",        name: "Técnico de TV",       categoryId: "assistencia-tecnica",   icon: "tv",                   imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80" },
    { id: "micro-ondas",       name: "Micro-ondas",         categoryId: "assistencia-tecnica",   icon: "microwave",            imageUrl: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&q=80" },
  ],
  "servicos-domesticos": [
    { id: "diarista",          name: "Diarista",            categoryId: "servicos-domesticos",   icon: "cleaning-services",   imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" },
    { id: "faxineira",         name: "Faxineira",           categoryId: "servicos-domesticos",   icon: "cleaning-services",   imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80" },
    { id: "baba",              name: "Babá",                categoryId: "servicos-domesticos",   icon: "child-care",           imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80" },
    { id: "cuidador-idosos",   name: "Cuidador de Idosos",  categoryId: "servicos-domesticos",   icon: "elderly",              imageUrl: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&q=80" },
    { id: "cozinheira",        name: "Cozinheira",          categoryId: "servicos-domesticos",   icon: "restaurant",           imageUrl: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80" },
    { id: "passadeira",        name: "Passadeira",          categoryId: "servicos-domesticos",   icon: "iron",                 imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80" },
  ],
  "servicos-externos": [
    { id: "jardineiro",        name: "Jardineiro",          categoryId: "servicos-externos",     icon: "yard",                 imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
    { id: "piscineiro",        name: "Piscineiro",          categoryId: "servicos-externos",     icon: "pool",                 imageUrl: "https://images.unsplash.com/photo-1572331165267-854da2b021cf?w=400&q=80" },
    { id: "limpeza-caixa-agua",name: "Limpeza de Caixa d'Água",categoryId: "servicos-externos", icon: "water",                imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
    { id: "dedetizacao",       name: "Dedetização",         categoryId: "servicos-externos",     icon: "pest-control",         imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  ],
  "automotivo": [
    { id: "mecanico",          name: "Mecânico",            categoryId: "automotivo",            icon: "build",                imageUrl: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
    { id: "guincho",           name: "Guincho",             categoryId: "automotivo",            icon: "local-shipping",       imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
    { id: "lava-rapido",       name: "Lava Rápido",         categoryId: "automotivo",            icon: "local-car-wash",       imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80" },
    { id: "auto-eletrica",     name: "Auto Elétrica",       categoryId: "automotivo",            icon: "electrical-services",  imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80" },
    { id: "funileiro",         name: "Funileiro",           categoryId: "automotivo",            icon: "car-repair",           imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80" },
  ],
  "beleza-estetica": [
    { id: "barbeiro",          name: "Barbeiro",            categoryId: "beleza-estetica",       icon: "content-cut",          imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80" },
    { id: "cabeleireiro",      name: "Cabeleireiro",        categoryId: "beleza-estetica",       icon: "content-cut",          imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80" },
    { id: "manicure",          name: "Manicure",            categoryId: "beleza-estetica",       icon: "spa",                  imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80" },
    { id: "designer-sobrancelha",name:"Designer de Sobrancelha",categoryId: "beleza-estetica",  icon: "face",                 imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80" },
    { id: "maquiador",         name: "Maquiador",           categoryId: "beleza-estetica",       icon: "brush",                imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80" },
    { id: "tatuador",          name: "Tatuador",            categoryId: "beleza-estetica",       icon: "draw",                 imageUrl: "https://images.unsplash.com/photo-1542856391383-a2f0432c2a6e?w=400&q=80" },
    { id: "esteticista",       name: "Esteticista",         categoryId: "beleza-estetica",       icon: "self-improvement",     imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80" },
    { id: "depilacao",         name: "Depilação",           categoryId: "beleza-estetica",       icon: "spa",                  imageUrl: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=400&q=80" },
  ],
  "servicos-profissionais": [
    { id: "advogado",          name: "Advogado",            categoryId: "servicos-profissionais",icon: "gavel",                imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80" },
    { id: "contador",          name: "Contador",            categoryId: "servicos-profissionais",icon: "calculate",            imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80" },
    { id: "despachante",       name: "Despachante",         categoryId: "servicos-profissionais",icon: "assignment",           imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80" },
    { id: "consultor-financeiro",name:"Consultor Financeiro",categoryId: "servicos-profissionais",icon: "trending-up",         imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80" },
  ],
  "saude": [
    { id: "dentista",          name: "Dentista",            categoryId: "saude",                 icon: "local-hospital",       imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffbb172d4f3?w=400&q=80" },
    { id: "fisioterapeuta",    name: "Fisioterapeuta",      categoryId: "saude",                 icon: "accessibility",        imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80" },
    { id: "psicologo",         name: "Psicólogo",           categoryId: "saude",                 icon: "psychology",           imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80" },
    { id: "nutricionista",     name: "Nutricionista",       categoryId: "saude",                 icon: "restaurant",           imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80" },
  ],
  "eventos": [
    { id: "dj",                name: "DJ",                  categoryId: "eventos",               icon: "music-note",           imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80" },
    { id: "fotografo",         name: "Fotógrafo",           categoryId: "eventos",               icon: "photo-camera",         imageUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&q=80" },
    { id: "garcom",            name: "Garçom",              categoryId: "eventos",               icon: "room-service",         imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80" },
    { id: "buffet",            name: "Buffet",              categoryId: "eventos",               icon: "restaurant",           imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=80" },
    { id: "decorador",         name: "Decorador",           categoryId: "eventos",               icon: "celebration",          imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80" },
  ],
  "logistica": [
    { id: "mudancas",          name: "Mudanças",            categoryId: "logistica",             icon: "local-shipping",       imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
    { id: "carretos",          name: "Carretos",            categoryId: "logistica",             icon: "local-shipping",       imageUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&q=80" },
    { id: "frete",             name: "Frete",               categoryId: "logistica",             icon: "local-shipping",       imageUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&q=80" },
  ],
  "educacao": [
    { id: "professor-particular",name:"Professor Particular",categoryId: "educacao",            icon: "school",               imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80" },
    { id: "aulas-ingles",      name: "Aulas de Inglês",     categoryId: "educacao",              icon: "language",             imageUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&q=80" },
    { id: "reforco-escolar",   name: "Reforço Escolar",     categoryId: "educacao",              icon: "menu-book",            imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80" },
    { id: "personal-trainer",  name: "Personal Trainer",    categoryId: "educacao",              icon: "fitness-center",       imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80" },
  ],
  "comercios": [
    { id: "loja-eletronicos",  name: "Loja de Eletrônicos", categoryId: "comercios",             icon: "devices",              imageUrl: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80" },
    { id: "loja-roupas",       name: "Loja de Roupas",      categoryId: "comercios",             icon: "checkroom",            imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80" },
    { id: "mercado",           name: "Mercado",             categoryId: "comercios",             icon: "local-grocery-store",  imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80" },
    { id: "farmacia",          name: "Farmácia",            categoryId: "comercios",             icon: "local-pharmacy",       imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80" },
    { id: "material-construcao",name:"Material de Construção",categoryId: "comercios",           icon: "hardware",             imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
    { id: "pet-shop",          name: "Pet Shop",            categoryId: "comercios",             icon: "pets",                 imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80" },
    { id: "oficina",           name: "Oficina",             categoryId: "comercios",             icon: "build",                imageUrl: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
    { id: "loja-moveis",       name: "Loja de Móveis",      categoryId: "comercios",             icon: "chair",                imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80" },
    { id: "loja-celular",      name: "Loja de Celular",     categoryId: "comercios",             icon: "phone-android",        imageUrl: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80" },
  ],
  "mobilidade": [
    { id: "motorista-particular",name:"Motorista Particular",categoryId: "mobilidade",           icon: "directions-car",       imageUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80" },
    { id: "transporte-escolar",name: "Transporte Escolar",  categoryId: "mobilidade",            icon: "directions-bus",       imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&q=80" },
    { id: "uber-particular",   name: "Uber Particular",     categoryId: "mobilidade",            icon: "local-taxi",           imageUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80" },
  ],
};

/** Retorna as subcategorias de uma categoria */
export function getSubcategories(categoryId: string): Subcategory[] {
  return subcategoriesByCategory[categoryId] ?? [];
}

/** Retorna uma subcategoria pelo ID */
export function getSubcategoryById(subcategoryId: string): Subcategory | undefined {
  for (const subs of Object.values(subcategoriesByCategory)) {
    const found = subs.find((s) => s.id === subcategoryId);
    if (found) return found;
  }
  return undefined;
}

// ─── CATEGORIAS (13) ────────────────────────────────────────────────────────
export const categories: Category[] = [
  { id: "reformas-reparos",      name: "Reformas e\nReparos",      icon: "build" },
  { id: "assistencia-tecnica",   name: "Assistência\nTécnica",     icon: "settings" },
  { id: "servicos-domesticos",   name: "Serviços\nDomésticos",     icon: "home" },
  { id: "servicos-externos",     name: "Serviços\nExternos",       icon: "yard" },
  { id: "automotivo",            name: "Automotivo",                icon: "directions-car" },
  { id: "beleza-estetica",       name: "Beleza e\nEstética",       icon: "content-cut" },
  { id: "servicos-profissionais",name: "Serviços\nProfissionais",  icon: "business-center" },
  { id: "saude",                 name: "Saúde",                     icon: "local-hospital" },
  { id: "eventos",               name: "Eventos",                   icon: "celebration" },
  { id: "logistica",             name: "Logística",                 icon: "local-shipping" },
  { id: "educacao",              name: "Educação",                  icon: "school" },
  { id: "comercios",             name: "Comércios",                 icon: "storefront" },
  { id: "mobilidade",            name: "Mobilidade",                icon: "commute" },
];

// Seções exibidas na Home (as mais populares)
export const sections = [
  { id: "reformas-reparos",    title: "Reformas e Reparos" },
  { id: "assistencia-tecnica", title: "Assistência Técnica" },
  { id: "servicos-domesticos", title: "Serviços Domésticos" },
  { id: "automotivo",          title: "Automotivo" },
  { id: "beleza-estetica",     title: "Beleza e Estética" },
];

// ─── SERVIÇOS (~80) ──────────────────────────────────────────────────────────
export const services: Service[] = [
  // Reformas e Reparos (10)
  { id: "eletricista",         name: "Eletricista",          categoryId: "reformas-reparos",      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80" },
  { id: "encanador",           name: "Encanador",            categoryId: "reformas-reparos",      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { id: "pedreiro",            name: "Pedreiro",             categoryId: "reformas-reparos",      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
  { id: "pintor",              name: "Pintor",               categoryId: "reformas-reparos",      image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80" },
  { id: "gesseiro",            name: "Gesseiro",             categoryId: "reformas-reparos",      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" },
  { id: "vidraceiro",          name: "Vidraceiro",           categoryId: "reformas-reparos",      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80" },
  { id: "serralheiro",         name: "Serralheiro",          categoryId: "reformas-reparos",      image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80" },
  { id: "marido-aluguel",      name: "Marido de aluguel",    categoryId: "reformas-reparos",      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
  { id: "instalador-tv",       name: "Instalador de TV",     categoryId: "reformas-reparos",      image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80" },
  { id: "montador-moveis",     name: "Montador de móveis",   categoryId: "reformas-reparos",      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80" },

  // Assistência Técnica (7)
  { id: "conserto-celular",    name: "Conserto de celular",  categoryId: "assistencia-tecnica",   image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80" },
  { id: "tecnico-notebook",    name: "Técnico de notebook",  categoryId: "assistencia-tecnica",   image: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=400&q=80" },
  { id: "tecnico-geladeira",   name: "Técnico de geladeira", categoryId: "assistencia-tecnica",   image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80" },
  { id: "ar-condicionado",     name: "Ar-condicionado",      categoryId: "assistencia-tecnica",   image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80" },
  { id: "maquina-lavar",       name: "Máquina de lavar",     categoryId: "assistencia-tecnica",   image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80" },
  { id: "tecnico-tv",          name: "Técnico de TV",        categoryId: "assistencia-tecnica",   image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80" },
  { id: "micro-ondas",         name: "Técnico de micro-ondas",categoryId: "assistencia-tecnica",  image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&q=80" },

  // Serviços Domésticos (6)
  { id: "diarista",            name: "Diarista",             categoryId: "servicos-domesticos",   image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" },
  { id: "faxineira",           name: "Faxineira",            categoryId: "servicos-domesticos",   image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80" },
  { id: "baba",                name: "Babá",                 categoryId: "servicos-domesticos",   image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80" },
  { id: "cuidador-idosos",     name: "Cuidador de idosos",   categoryId: "servicos-domesticos",   image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=400&q=80" },
  { id: "cozinheira",          name: "Cozinheira",           categoryId: "servicos-domesticos",   image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80" },
  { id: "passadeira",          name: "Passadeira",           categoryId: "servicos-domesticos",   image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80" },

  // Serviços Externos (4)
  { id: "jardineiro",          name: "Jardineiro",           categoryId: "servicos-externos",     image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80" },
  { id: "piscineiro",          name: "Piscineiro",           categoryId: "servicos-externos",     image: "https://images.unsplash.com/photo-1572331165267-854da2b021cf?w=400&q=80" },
  { id: "limpeza-caixa-agua",  name: "Limpeza de caixa d'água", categoryId: "servicos-externos", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { id: "dedetizacao",         name: "Dedetização",          categoryId: "servicos-externos",     image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },

  // Automotivo (5)
  { id: "mecanico",            name: "Mecânico",             categoryId: "automotivo",            image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
  { id: "guincho",             name: "Guincho",              categoryId: "automotivo",            image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { id: "lava-rapido",         name: "Lava rápido",          categoryId: "automotivo",            image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80" },
  { id: "auto-eletrica",       name: "Auto elétrica",        categoryId: "automotivo",            image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80" },
  { id: "funileiro",           name: "Funileiro",            categoryId: "automotivo",            image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80" },

  // Beleza e Estética (5)
  { id: "barbeiro",            name: "Barbeiro",             categoryId: "beleza-estetica",       image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80" },
  { id: "cabeleireiro",        name: "Cabeleireiro",         categoryId: "beleza-estetica",       image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80" },
  { id: "manicure",            name: "Manicure",             categoryId: "beleza-estetica",       image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80" },
  { id: "designer-sobrancelha",name: "Designer de sobrancelha", categoryId: "beleza-estetica",   image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80" },
  { id: "maquiador",           name: "Maquiador",            categoryId: "beleza-estetica",       image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80" },

  // Serviços Profissionais (4)
  { id: "advogado",            name: "Advogado",             categoryId: "servicos-profissionais",image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80" },
  { id: "contador",            name: "Contador",             categoryId: "servicos-profissionais",image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80" },
  { id: "despachante",         name: "Despachante",          categoryId: "servicos-profissionais",image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80" },
  { id: "consultor-financeiro",name: "Consultor financeiro", categoryId: "servicos-profissionais",image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80" },

  // Saúde (4)
  { id: "dentista",            name: "Dentista",             categoryId: "saude",                 image: "https://images.unsplash.com/photo-1588776814546-1ffbb172d4f3?w=400&q=80" },
  { id: "fisioterapeuta",      name: "Fisioterapeuta",       categoryId: "saude",                 image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80" },
  { id: "psicologo",           name: "Psicólogo",            categoryId: "saude",                 image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80" },
  { id: "nutricionista",       name: "Nutricionista",        categoryId: "saude",                 image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80" },

  // Eventos (5)
  { id: "dj",                  name: "DJ",                   categoryId: "eventos",               image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80" },
  { id: "fotografo",           name: "Fotógrafo",            categoryId: "eventos",               image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&q=80" },
  { id: "garcom",              name: "Garçom",               categoryId: "eventos",               image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80" },
  { id: "buffet",              name: "Buffet",               categoryId: "eventos",               image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=80" },
  { id: "decorador",           name: "Decorador",            categoryId: "eventos",               image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80" },

  // Logística (3)
  { id: "mudancas",            name: "Mudanças",             categoryId: "logistica",             image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { id: "carretos",            name: "Carretos",             categoryId: "logistica",             image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&q=80" },
  { id: "frete",               name: "Frete",                categoryId: "logistica",             image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&q=80" },

  // Educação (4)
  { id: "professor-particular",name: "Professor particular", categoryId: "educacao",              image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80" },
  { id: "aulas-ingles",        name: "Aulas de inglês",      categoryId: "educacao",              image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&q=80" },
  { id: "reforco-escolar",     name: "Reforço escolar",      categoryId: "educacao",              image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80" },
  { id: "personal-trainer",    name: "Personal trainer",     categoryId: "educacao",              image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80" },

  // Comércios (9)
  { id: "loja-eletronicos",    name: "Loja de eletrônicos",  categoryId: "comercios",             image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80" },
  { id: "loja-roupas",         name: "Loja de roupas",       categoryId: "comercios",             image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80" },
  { id: "mercado",             name: "Mercado",              categoryId: "comercios",             image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80" },
  { id: "farmacia",            name: "Farmácia",             categoryId: "comercios",             image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80" },
  { id: "material-construcao", name: "Material de construção",categoryId: "comercios",            image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
  { id: "pet-shop",            name: "Pet shop",             categoryId: "comercios",             image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80" },
  { id: "oficina",             name: "Oficina",              categoryId: "comercios",             image: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&q=80" },
  { id: "loja-moveis",         name: "Loja de móveis",       categoryId: "comercios",             image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80" },
  { id: "loja-celular",        name: "Loja de celular",      categoryId: "comercios",             image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80" },

  // Mobilidade (3)
  { id: "motorista-particular",name: "Motorista particular", categoryId: "mobilidade",            image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80" },
  { id: "transporte-escolar",  name: "Transporte escolar",   categoryId: "mobilidade",            image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&q=80" },
  { id: "uber-particular",     name: "Uber particular",      categoryId: "mobilidade",            image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80" },
];

// ─── PROFISSIONAIS (exemplos) ────────────────────────────────────────────────
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
    description: "Mais de 20 anos de experiência em serviços elétricos residenciais e comerciais.",
    serviceArea: "Centro, Vila Nova, Jd. América e região",
    schedule: "Segunda a Sábado: 7h às 19h",
    paymentMethods: "Dinheiro, Cartão, PIX",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    type: "PREMIUM",
    city: "São Paulo",
    premiumExpiresAt: "2025-12-31",
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
    description: "Atendimento rápido e eficiente para emergências elétricas. Disponível nos finais de semana.",
    serviceArea: "Jd. São Paulo, Centro e adjacências",
    schedule: "Segunda a Domingo: 8h às 20h",
    paymentMethods: "Dinheiro, PIX",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    type: "FREE",
    city: "São Paulo",
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
    description: "Mais de 15 anos de experiência em instalações elétricas residenciais e comerciais.",
    serviceArea: "Vila Nova, Jd. América, Centro",
    schedule: "Segunda a Sexta: 7h às 18h",
    paymentMethods: "Dinheiro, Cartão, PIX",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    type: "PREMIUM",
    city: "São Paulo",
    premiumExpiresAt: "2025-06-30",
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
    description: "Serviços elétricos com garantia. Orçamento sem compromisso.",
    serviceArea: "Jd. América e região",
    schedule: "Segunda a Sábado: 8h às 18h",
    paymentMethods: "Dinheiro, PIX",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80",
    type: "FREE",
    city: "São Paulo",
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
    description: "Profissional certificado com foco em segurança e qualidade.",
    serviceArea: "Centro e toda a cidade",
    schedule: "Segunda a Sábado: 7h às 17h",
    paymentMethods: "Dinheiro, Cartão, PIX",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
    type: "FREE",
    city: "São Paulo",
  },
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
    description: "Pequenos reparos, instalações e manutenção em geral para sua casa.",
    serviceArea: "Toda a cidade",
    schedule: "Segunda a Sábado: 8h às 18h",
    paymentMethods: "Dinheiro, PIX",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
    type: "FREE",
    city: "São Paulo",
  },
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
    description: "Cuidados especializados para crianças de 0 a 10 anos. Experiência com primeiros socorros.",
    serviceArea: "Jardins, Moema e adjacências",
    schedule: "Segunda a Sexta: 7h às 19h",
    paymentMethods: "Dinheiro, PIX, Transferência",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    type: "PREMIUM",
    city: "São Paulo",
    premiumExpiresAt: "2025-08-15",
  },
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
    description: "Refeições saudáveis e saborosas para sua família. Cardápio personalizado.",
    serviceArea: "Vila Madalena, Pinheiros e região",
    schedule: "Segunda a Sexta: 8h às 17h",
    paymentMethods: "Dinheiro, PIX",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    type: "FREE",
    city: "São Paulo",
  },
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
    description: "Limpeza completa e organização de residências e escritórios.",
    serviceArea: "Brooklin, Santo André e região",
    type: "FREE",
    city: "São Paulo",
    schedule: "Segunda a Sexta: 8h às 17h",
    paymentMethods: "Dinheiro, PIX",
    avatar: "https://images.unsplash.com/photo-1507876466519-514a6da1d4d0?w=200&q=80",
  },
  {
    id: "barbeiro-1",
    name: "Barbearia do João",
    category: "Barbeiro",
    categoryId: "barbeiro",
    rating: 4.9,
    reviewCount: 203,
    neighborhood: "Centro",
    distance: "0,5 km",
    phone: "5511999990010",
    description: "Cortes modernos e clássicos. Barba e bigode com navalha.",
    serviceArea: "Centro e adjacências",
    schedule: "Terça a Domingo: 9h às 20h",
    paymentMethods: "Dinheiro, Cartão, PIX",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    type: "PREMIUM",
    city: "São Paulo",
    premiumExpiresAt: "2025-10-01",
  },
  {
    id: "mecanico-1",
    name: "Oficina do Carlos",
    category: "Mecânico",
    categoryId: "mecanico",
    rating: 4.8,
    reviewCount: 134,
    neighborhood: "Vila Industrial",
    distance: "2,5 km",
    phone: "5511999990011",
    description: "Manutenção preventiva e corretiva para todos os tipos de veículos.",
    serviceArea: "Vila Industrial e região",
    schedule: "Segunda a Sábado: 8h às 18h",
    paymentMethods: "Dinheiro, Cartão, PIX",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
    type: "FREE",
    city: "São Paulo",
  },
  {
    id: "fotografo-1",
    name: "Foto & Arte",
    category: "Fotógrafo",
    categoryId: "fotografo",
    rating: 4.9,
    reviewCount: 89,
    neighborhood: "Pinheiros",
    distance: "3,1 km",
    phone: "5511999990012",
    description: "Fotografia profissional para eventos, casamentos e ensaios.",
    serviceArea: "Grande São Paulo",
    schedule: "Conforme agenda",
    paymentMethods: "Dinheiro, Cartão, PIX",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
    type: "PREMIUM",
    city: "São Paulo",
    premiumExpiresAt: "2025-09-30",
  },
];

export const premiumPlans: PremiumPlan[] = [
  {
    id: "monthly",
    name: "Plano Mensal",
    price: 10,
    period: "monthly",
    description: "Destaque por 1 mês",
    benefits: [
      "Apareça primeiro nos resultados",
      "Selo Premium no perfil",
      "Mais visibilidade nas buscas",
      "Destaque na home",
    ],
  },
  {
    id: "annual",
    name: "Plano Anual",
    price: 99.9,
    period: "annual",
    description: "Destaque por 1 ano (economize 58%)",
    benefits: [
      "Apareça primeiro nos resultados",
      "Selo Premium no perfil",
      "Mais visibilidade nas buscas",
      "Destaque na home",
      "Suporte prioritário",
    ],
  },
];

export function getProfessionalsByRanking(categoryId?: string): Professional[] {
  let filtered = categoryId
    ? professionals.filter((p) => p.categoryId === categoryId)
    : professionals;
  return filtered.sort((a, b) => {
    if (a.type === "PREMIUM" && b.type === "FREE") return -1;
    if (a.type === "FREE" && b.type === "PREMIUM") return 1;
    return b.rating - a.rating;
  });
}

export function createProfessional(registration: ProfessionalRegistration): Professional {
  const newProfessional: Professional = {
    id: `prof-${Date.now()}`,
    ...registration,
    categoryId: registration.category.toLowerCase().replace(/\s+/g, "-"),
    rating: 0,
    reviewCount: 0,
    distance: "0 km",
    serviceArea: registration.city,
    schedule: "Consulte o profissional",
    paymentMethods: "A combinar",
    type: "FREE",
    city: registration.city,
  };
  professionals.push(newProfessional);
  return newProfessional;
}

export function upgradeToPremium(professionalId: string, planId: string): Professional | undefined {
  const professional = getProfessionalById(professionalId);
  if (!professional) return undefined;
  const plan = premiumPlans.find((p) => p.id === planId);
  if (!plan) return undefined;
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (plan.period === "monthly" ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000)
  );
  professional.type = "PREMIUM";
  professional.premiumExpiresAt = expiresAt.toISOString().split("T")[0];
  return professional;
}

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
    professionalId: "barbeiro-1",
    userName: "Rafael Souza",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    rating: 5,
    comment: "Melhor barbearia da cidade! Atendimento impecável.",
    createdAt: "2024-04-22",
  },
];

export function getReviewsByProfessional(professionalId: string): Review[] {
  return reviews.filter((r) => r.professionalId === professionalId);
}

export function addReview(review: Omit<Review, "id">): Review {
  const newReview: Review = {
    ...review,
    id: `review-${Date.now()}`,
  };
  reviews.push(newReview);
  return newReview;
}
