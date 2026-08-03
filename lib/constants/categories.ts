export type BusinessType = "alimentacao" | "servicos" | "produtos" | "comercios";

export interface CategoryItem {
  id: string;
  label: string;
  icon: string;
}

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
  servicos: [
    { id: "clinicas", label: "Clínicas", icon: "local-hospital" },
    { id: "dentistas", label: "Dentistas", icon: "medical-services" },
    { id: "medicos", label: "Médicos", icon: "medical-information" },
    { id: "psicologos", label: "Psicólogos", icon: "psychology" },
    { id: "academias", label: "Academias", icon: "fitness-center" },
    { id: "saloes-de-beleza", label: "Salões de Beleza", icon: "face-retouching-natural" },
    { id: "barbearias", label: "Barbearias", icon: "content-cut" },
    { id: "estetica", label: "Estética", icon: "spa" },
    { id: "massoterapia", label: "Massoterapia", icon: "healing" },
    { id: "auto-center", label: "Auto Center", icon: "directions-car" },
    { id: "mecanicos", label: "Mecânicos", icon: "car-repair" },
    { id: "lava-rapido", label: "Lava Rápido", icon: "local-car-wash" },
    { id: "borracharias", label: "Borracharias", icon: "tire-repair" },
    { id: "funilaria", label: "Funilaria", icon: "handyman" },
    { id: "assistencia-tecnica", label: "Assistência Técnica", icon: "build" },
    { id: "eletricistas", label: "Eletricistas", icon: "electrical-services" },
    { id: "encanadores", label: "Encanadores", icon: "plumbing" },
    { id: "pintores", label: "Pintores", icon: "format-paint" },
    { id: "pedreiros", label: "Pedreiros", icon: "construction" },
    { id: "jardineiros", label: "Jardineiros", icon: "yard" },
    { id: "marceneiros", label: "Marceneiros", icon: "carpenter" },
    { id: "serralheiros", label: "Serralheiros", icon: "handyman" },
    { id: "chaveiros", label: "Chaveiros", icon: "vpn-key" },
    { id: "contadores", label: "Contadores", icon: "calculate" },
    { id: "advogados", label: "Advogados", icon: "gavel" },
    { id: "corretores", label: "Corretores", icon: "real-estate-agent" },
    { id: "fotografos", label: "Fotógrafos", icon: "photo-camera" },
    { id: "eventos", label: "Eventos", icon: "event" },
    { id: "turismo", label: "Turismo", icon: "flight" },
    { id: "educacao", label: "Educação", icon: "school" },
    { id: "cursos", label: "Cursos", icon: "menu-book" },
    { id: "outros", label: "Outros", icon: "more-horiz" },
  ],
  produtos: [
    { id: "produtos-artesanais", label: "Produtos Artesanais", icon: "brush" },
    { id: "produtos-naturais", label: "Produtos Naturais", icon: "eco" },
    { id: "outros-produtos", label: "Outros Produtos", icon: "shopping-bag" },
  ]
};

export const ALL_CATEGORIES = Object.values(CATEGORIES_BY_TYPE).flat();

export const getCategoryById = (id: string) => {
  return ALL_CATEGORIES.find(c => c.id === id) || { id, label: id, icon: "label" };
};
