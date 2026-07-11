/**
 * Mercado Pago Service
 * Handles payment processing with PIX, Credit Card, and Boleto
 */

export interface PaymentMethod {
  id: string;
  name: string;
  type: "pix" | "credit_card" | "boleto";
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  period: "monthly" | "annual" | "quarterly" | "semiannual";
  description: string;
}

export interface PaymentPreference {
  id: string;
  professionalId: string;
  plan: PaymentPlan;
  method: PaymentMethod;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  expiresAt?: string;
  paymentId?: string;
}

// Payment methods available
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pix",
    name: "PIX",
    type: "pix",
  },
  {
    id: "credit_card",
    name: "Cartão de Crédito",
    type: "credit_card",
  },
  {
    id: "boleto",
    name: "Boleto Bancário",
    type: "boleto",
  },
];

// NOTE: PAYMENT_PLANS is now fetched from the database via trpc.plans.list
// This legacy constant is kept as fallback only and should not be used
/** @deprecated Use trpc.plans.list instead */
export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: "premium_monthly",
    name: "Premium Mensal",
    price: 19.9,
    period: "monthly",
    description: "Acesso premium por 1 mês",
  },
  {
    id: "premium_annual",
    name: "Premium Anual",
    price: 99,
    period: "annual",
    description: "Acesso premium por 1 ano (economize 17%)",
  },
];

/**
 * Convert a plan from the database to PaymentPlan format
 */
export function dbPlanToPaymentPlan(dbPlan: any, billingCycle: string = "monthly"): PaymentPlan {
  const priceMap: Record<string, number> = {
    monthly: dbPlan.monthlyPrice || 0,
    quarterly: dbPlan.quarterlyPrice || 0,
    semiannual: dbPlan.semiannualPrice || 0,
    annual: dbPlan.annualPrice || 0,
  };

  return {
    id: dbPlan.id,
    name: dbPlan.name,
    price: priceMap[billingCycle] || dbPlan.monthlyPrice || 0,
    period: billingCycle as any,
    description: dbPlan.description || `${dbPlan.name} - ${billingCycle}`,
  };
}

/**
 * Create a payment preference in Mercado Pago
 * This would call the backend API which communicates with Mercado Pago
 */
export async function createPaymentPreference(
  professionalId: string,
  planId: string,
  methodId: string,
): Promise<PaymentPreference> {
  const plan = PAYMENT_PLANS.find((p) => p.id === planId);
  const method = PAYMENT_METHODS.find((m) => m.id === methodId);

  if (!plan || !method) {
    throw new Error("Invalid plan or payment method");
  }

  // In production, this would call your backend API
  // which would create a preference in Mercado Pago
  const preference: PaymentPreference = {
    id: `pref_${Date.now()}`,
    professionalId,
    plan,
    method,
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  return preference;
}

/**
 * Process payment with Mercado Pago
 * This would be called from the checkout screen
 */
export async function processPayment(
  preference: PaymentPreference,
  paymentData: any,
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  try {
    // In production, this would call your backend API
    // The backend would process the payment with Mercado Pago
    console.log("Processing payment:", {
      preference,
      paymentData,
    });

    // Mock successful payment
    return {
      success: true,
      paymentId: `payment_${Date.now()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment failed",
    };
  }
}

/**
 * Get payment status from Mercado Pago
 */
export async function getPaymentStatus(paymentId: string): Promise<string> {
  try {
    // In production, this would call your backend API
    // which would query Mercado Pago for the payment status
    console.log("Fetching payment status:", paymentId);
    return "approved";
  } catch (error) {
    return "unknown";
  }
}

/**
 * Cancel a payment preference
 */
export async function cancelPaymentPreference(
  preferenceId: string,
): Promise<boolean> {
  try {
    // In production, this would call your backend API
    console.log("Cancelling preference:", preferenceId);
    return true;
  } catch (error) {
    return false;
  }
}
