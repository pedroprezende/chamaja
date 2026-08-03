/**
 * Gerador inteligente e dinâmico de mensagens de WhatsApp para o XamaJá.
 * Ajusta o tom e formato da mensagem de acordo com o segmento:
 * 1. Alimentação (Pedidos de comida)
 * 2. Comércios / Produtos (Consultar produtos e pagamento)
 * 3. Prestadores de Serviços (Orçamentos, Agendamentos, Atendimento Domicílio/Estabelecimento/Online)
 */

export interface WhatsAppProviderInfo {
  name?: string | null;
  category?: string | null;
  categoryId?: string | null;
  subcategoryName?: string | null;
  businessType?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  description?: string | null;
  tags?: string | string[] | null;
  services?: any;
}

export interface WhatsAppItemInfo {
  name: string;
  price?: number;
  quantity?: number;
}

export interface WhatsAppOptions {
  provider: WhatsAppProviderInfo;
  items?: WhatsAppItemInfo[];
  selectedItemName?: string;
  notes?: string;
  deliveryAddress?: string;
}

function cleanText(text?: string | null): string {
  return (text || "").toLowerCase().trim();
}

/**
 * Detecta se o parceiro pertence ao segmento de Alimentação
 */
export function isFoodSegment(provider: WhatsAppProviderInfo): boolean {
  const bt = cleanText(provider.businessType);
  if (bt === "alimentacao") return true;

  const cat = cleanText(provider.category) + " " + cleanText(provider.categoryId) + " " + cleanText(provider.subcategoryName);
  const foodKeywords = [
    "pizzaria", "pizza", "burger", "hamburg", "lanchonete", "restaurante", 
    "marmita", "comida", "açai", "açaí", "doce", "padaria", "sorvete", "churrasco", "bar"
  ];

  return foodKeywords.some(kw => cat.includes(kw));
}

/**
 * Detecta se o parceiro é Comércio / Venda de Produtos
 */
export function isProductSegment(provider: WhatsAppProviderInfo): boolean {
  if (isFoodSegment(provider)) return false;
  const bt = cleanText(provider.businessType);
  if (bt === "produtos" || bt === "comercios" || bt === "comercio") return true;

  const cat = cleanText(provider.category) + " " + cleanText(provider.categoryId);
  return cat.includes("loja") || cat.includes("mercado") || cat.includes("compras") || cat.includes("comercio");
}

/**
 * Detecta modalidades de atendimento para Prestadores de Serviços
 */
export function detectModalities(provider: WhatsAppProviderInfo, itemName?: string) {
  const fullContent = [
    provider.category,
    provider.subcategoryName,
    provider.description,
    Array.isArray(provider.tags) ? provider.tags.join(" ") : provider.tags,
    itemName
  ].map(cleanText).join(" ");

  const hasOnline = 
    fullContent.includes("online") || 
    fullContent.includes("remoto") || 
    fullContent.includes("consultoria") || 
    fullContent.includes("telemedicina") || 
    fullContent.includes("digital") ||
    fullContent.includes("ead");

  const hasDomicilio = 
    fullContent.includes("domicílio") || 
    fullContent.includes("domicilio") || 
    fullContent.includes("em casa") || 
    fullContent.includes("visita") ||
    fullContent.includes("encanador") ||
    fullContent.includes("eletricista") ||
    fullContent.includes("pintor") ||
    fullContent.includes("pedreiro") ||
    fullContent.includes("limpeza") ||
    fullContent.includes("diarista") ||
    fullContent.includes("guincho");

  const hasEstabelecimento = 
    !!provider.address || 
    !!provider.neighborhood || 
    fullContent.includes("estabelecimento") || 
    fullContent.includes("consultório") || 
    fullContent.includes("salão") || 
    fullContent.includes("oficina") || 
    fullContent.includes("estúdio") || 
    fullContent.includes("academia") || 
    fullContent.includes("clínica") || 
    fullContent.includes("barbearia");

  return {
    hasDomicilio,
    hasEstabelecimento,
    hasOnline,
    count: (hasDomicilio ? 1 : 0) + (hasEstabelecimento ? 1 : 0) + (hasOnline ? 1 : 0),
  };
}

/**
 * Função principal: Gera a mensagem formatada para o WhatsApp
 */
export function generateWhatsAppMessage(options: WhatsAppOptions): string {
  const { provider, items = [], selectedItemName, notes, deliveryAddress } = options;
  const providerName = provider.name || "parceiro";

  // 1. REGRAS DE ALIMENTAÇÃO
  if (isFoodSegment(provider)) {
    let msg = `Olá! Gostaria de fazer um pedido.`;
    if (items.length > 0) {
      msg += `\n\nPedido:`;
      let total = 0;
      items.forEach(item => {
        const qty = item.quantity || 1;
        const price = item.price || 0;
        total += price * qty;
        msg += `\n• ${qty}x ${item.name}`;
      });
      if (total > 0) {
        msg += `\n\nTotal: R$ ${total.toFixed(2).replace(".", ",")}`;
      }
    } else if (selectedItemName) {
      msg += `\n\nItem de interesse:\n• ${selectedItemName}`;
    }
    if (deliveryAddress) {
      msg += `\n\n📍 Entrega: ${deliveryAddress}`;
    }
    if (notes && notes.trim()) {
      msg += `\n📝 Obs: ${notes.trim()}`;
    }
    return msg;
  }

  // 2. REGRAS DE COMÉRCIO / PRODUTOS
  if (isProductSegment(provider)) {
    let msg = `Olá! Encontrei sua loja no XamaJá.`;
    if (items.length > 0) {
      msg += `\n\nTenho interesse no(s) produto(s):`;
      items.forEach(item => {
        msg += `\n• ${item.name}`;
      });
    } else if (selectedItemName) {
      msg += `\n\nTenho interesse no produto:\n${selectedItemName}`;
    } else {
      msg += `\n\nGostaria de consultar os produtos disponíveis na loja.`;
    }
    msg += `\n\nGostaria de saber disponibilidade, valor atualizado e formas de pagamento.`;
    return msg;
  }

  // 3. REGRAS DE PRESTADORES DE SERVIÇOS
  const serviceName = selectedItemName || (items.length > 0 ? items.map(i => i.name).join(", ") : null);
  const modalities = detectModalities(provider, serviceName || undefined);

  // REGRA 6: Múltiplas formas de atendimento (2 ou 3 modalidades ativas)
  if (modalities.count >= 2) {
    const list: string[] = [];
    if (modalities.hasDomicilio) list.push("em domicílio");
    if (modalities.hasEstabelecimento) list.push("no estabelecimento");
    if (modalities.hasOnline) list.push("também online");

    let modesStr = "";
    if (list.length === 3) {
      modesStr = "em domicílio, no estabelecimento e também online";
    } else {
      modesStr = list.join(" e ");
    }

    let msg = `Olá! Encontrei seu perfil no XamaJá.`;
    if (serviceName) {
      msg += `\n\nTenho interesse no serviço de ${serviceName}.`;
    } else {
      msg += `\n\nTenho interesse em um dos seus serviços.`;
    }
    msg += `\n\nVi que você atende ${modesStr}.`;
    msg += `\n\nGostaria de saber qual modalidade é mais indicada para mim e solicitar um orçamento.`;
    return msg;
  }

  // REGRA 3: Atendimento exclusivamente em domicílio
  if (modalities.hasDomicilio && !modalities.hasEstabelecimento && !modalities.hasOnline) {
    let msg = `Olá! Encontrei seu perfil no XamaJá.`;
    if (serviceName) {
      msg += `\n\nTenho interesse no serviço de ${serviceName}.`;
    } else {
      msg += `\n\nTenho interesse nos seus serviços.`;
    }
    msg += `\n\nVi que você atende em domicílio.`;
    msg += `\n\nGostaria de solicitar um orçamento.`;
    return msg;
  }

  // REGRA 4: Atendimento no estabelecimento
  if (modalities.hasEstabelecimento && !modalities.hasDomicilio && !modalities.hasOnline) {
    let msg = `Olá! Encontrei seu perfil no XamaJá.`;
    if (serviceName) {
      msg += `\n\nTenho interesse em ${serviceName}.`;
    } else {
      msg += `\n\nTenho interesse nos seus serviços.`;
    }
    msg += `\n\nGostaria de agendar um horário e saber os valores.`;
    return msg;
  }

  // REGRA 5: Atendimento Online
  if (modalities.hasOnline && !modalities.hasDomicilio && !modalities.hasEstabelecimento) {
    let msg = `Olá! Encontrei seu perfil no XamaJá.`;
    if (serviceName) {
      msg += `\n\nTenho interesse no seu atendimento online (${serviceName}).`;
    } else {
      msg += `\n\nTenho interesse no seu atendimento online.`;
    }
    msg += `\n\nGostaria de saber como funciona o atendimento e os valores.`;
    return msg;
  }

  // REGRA 2: Orçamento Geral Padrão para Prestadores de Serviços
  let msg = `Olá! Encontrei seu perfil no XamaJá e gostaria de solicitar um orçamento.`;
  if (serviceName) {
    msg += `\n\nServiço de interesse:\n${serviceName}`;
  }
  msg += `\n\nGostaria de saber disponibilidade.`;
  return msg;
}
