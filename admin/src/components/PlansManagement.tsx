import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  X,
  CreditCard,
  Eye,
  Star,
  Activity
} from "lucide-react";

const AVAILABLE_BENEFITS = [
  { key: "verified_badge", label: "Selo Verificado" },
  { key: "premium_badge", label: "Selo Premium" },
  { key: "featured_search", label: "Destaque na Busca" },
  { key: "featured_map", label: "Destaque no Mapa" },
  { key: "homepage_highlight", label: "Destaque na Página Inicial" },
  { key: "analytics_basic", label: "Estatísticas Básicas" },
  { key: "analytics_advanced", label: "Estatísticas Avançadas" },
  { key: "unlimited_photos", label: "Fotos Ilimitadas" },
  { key: "priority_support", label: "Suporte Prioritário" },
  { key: "reports", label: "Relatórios" },
  { key: "favorites_statistics", label: "Estatísticas de Favoritos" },
  { key: "real_time_statistics", label: "Estatísticas em Tempo Real" },
];

export function PlansManagement() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [showPreview, setShowPreview] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      // Fetch plans and join their benefits
      const { data, error } = await supabase
        .from("plans")
        .select(`
          *,
          benefits:plan_benefits(*)
        `)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error("Erro ao buscar planos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (plan: any) => {
    setCurrentPlan(JSON.parse(JSON.stringify(plan))); // Deep copy
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setCurrentPlan({
      name: "",
      description: "",
      monthlyPrice: 0,
      quarterlyPrice: 0,
      semiannualPrice: 0,
      annualPrice: 0,
      isActive: true,
      displayOrder: plans ? plans.length : 0,
      isFeatured: false,
      badgeColor: "#10b981",
      applyOnlyToNew: false,
      benefits: []
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentPlan.name || currentPlan.monthlyPrice < 0) return;
    setSaving(true);
    
    try {
      const planPayload = {
        name: currentPlan.name,
        description: currentPlan.description,
        monthly_price: currentPlan.monthlyPrice,
        quarterly_price: currentPlan.quarterlyPrice,
        semiannual_price: currentPlan.semiannualPrice,
        annual_price: currentPlan.annualPrice,
        is_active: currentPlan.isActive,
        display_order: currentPlan.displayOrder,
        is_featured: currentPlan.isFeatured,
        badge_color: currentPlan.badgeColor,
        apply_only_to_new: currentPlan.applyOnlyToNew,
        updated_at: new Date()
      };

      let planId = currentPlan.id;

      if (planId) {
        // Update plan
        const { error } = await supabase
          .from("plans")
          .update(planPayload)
          .eq("id", planId);
        if (error) throw error;
      } else {
        // Create plan
        const { data, error } = await supabase
          .from("plans")
          .insert({
            ...planPayload,
            created_at: new Date()
          })
          .select()
          .single();
        if (error) throw error;
        planId = data.id;
      }

      // Sync benefits
      // 1. Delete existing benefits for this plan
      const { error: delError } = await supabase
        .from("plan_benefits")
        .delete()
        .eq("plan_id", planId);
      if (delError) throw delError;

      // 2. Insert new benefits
      if (currentPlan.benefits && currentPlan.benefits.length > 0) {
        const benefitsPayload = currentPlan.benefits.map((b: any, index: number) => ({
          plan_id: planId,
          key: b.key,
          name: b.name,
          display_order: index
        }));

        const { error: insError } = await supabase
          .from("plan_benefits")
          .insert(benefitsPayload);
        if (insError) throw insError;
      }

      await fetchPlans();
      setIsEditing(false);
      setCurrentPlan(null);
    } catch (err) {
      console.error("Erro ao salvar plano:", err);
      alert("Erro ao salvar plano. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja inativar este plano?")) return;
    
    try {
      // Soft delete: set isActive to false
      const { error } = await supabase
        .from("plans")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
      await fetchPlans();
    } catch (err) {
      console.error("Erro ao inativar plano:", err);
    }
  };

  const handleAddBenefit = () => {
    const usedKeys = currentPlan.benefits?.map((b: any) => b.key) || [];
    const availableKey = AVAILABLE_BENEFITS.find(b => !usedKeys.includes(b.key));
    setCurrentPlan({
      ...currentPlan,
      benefits: [
        ...currentPlan.benefits,
        { key: availableKey?.key || "", name: availableKey?.label || "", display_order: currentPlan.benefits.length }
      ]
    });
  };

  const handleBenefitChange = (index: number, field: string, value: string) => {
    const updated = [...currentPlan.benefits];
    updated[index][field] = value;
    // Auto-fill name when key changes
    if (field === "key") {
      const benefit = AVAILABLE_BENEFITS.find(b => b.key === value);
      if (benefit) updated[index].name = benefit.label;
    }
    setCurrentPlan({ ...currentPlan, benefits: updated });
  };

  const handleRemoveBenefit = (index: number) => {
    const updated = [...currentPlan.benefits];
    updated.splice(index, 1);
    setCurrentPlan({ ...currentPlan, benefits: updated });
  };

  // Convert snake_case from DB to camelCase for the UI
  const getMappedPlan = (p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    monthlyPrice: p.monthly_price || 0,
    quarterlyPrice: p.quarterly_price || 0,
    semiannualPrice: p.semiannual_price || 0,
    annualPrice: p.annual_price || 0,
    isActive: p.is_active,
    displayOrder: p.display_order || 0,
    isFeatured: p.is_featured,
    badgeColor: p.badge_color || "#10b981",
    applyOnlyToNew: p.apply_only_to_new,
    benefits: p.benefits || []
  });

  return (
    <div className="section-container" style={{ padding: "1.5rem" }}>
      <div className="section-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Gestão de Planos e Assinaturas</h2>
          <p style={{ color: "#6b7280" }}>Crie, edite e acompanhe os planos oferecidos aos prestadores.</p>
        </div>
        {!isEditing && (
          <button 
            className="btn-action btn-action-reactivate" 
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "40px" }}
            onClick={handleCreateNew}
          >
            <Plus size={18} /> Novo Plano
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="plan-editor" style={{ background: "#1f2937", padding: "2rem", borderRadius: "8px" }}>
          <h3 style={{ marginBottom: "1.5rem", borderBottom: "1px solid #374151", paddingBottom: "1rem" }}>
            {currentPlan.id ? "Editar Plano" : "Novo Plano"}
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div className="form-group">
              <label>Nome do Plano</label>
              <input 
                type="text" 
                value={currentPlan.name} 
                onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})}
                placeholder="Ex: Premium"
                className="input-field"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", background: "#374151", border: "1px solid #4b5563", color: "white" }}
              />
            </div>
            <div className="form-group">
              <label>Cor / Etiqueta</label>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <input 
                  type="color" 
                  value={currentPlan.badgeColor || "#10b981"} 
                  onChange={e => setCurrentPlan({...currentPlan, badgeColor: e.target.value})}
                  style={{ height: "38px", width: "50px", padding: 0, background: "transparent", border: "none" }}
                />
                <input 
                  type="text" 
                  value={currentPlan.badgeColor || ""} 
                  onChange={e => setCurrentPlan({...currentPlan, badgeColor: e.target.value})}
                  className="input-field"
                  style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", background: "#374151", border: "1px solid #4b5563", color: "white" }}
                />
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Descrição Opcional</label>
              <textarea 
                value={currentPlan.description || ""} 
                onChange={e => setCurrentPlan({...currentPlan, description: e.target.value})}
                placeholder="Ex: Ideal para profissionais que desejam máximo destaque"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", background: "#374151", border: "1px solid #4b5563", color: "white", minHeight: "80px" }}
              />
            </div>
          </div>

          <h4 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Preços</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            <div className="form-group">
              <label>Mensal (R$)</label>
              <input 
                type="number" 
                value={currentPlan.monthlyPrice} 
                onChange={e => setCurrentPlan({...currentPlan, monthlyPrice: parseFloat(e.target.value) || 0})}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", background: "#374151", border: "1px solid #4b5563", color: "white" }}
              />
            </div>
            <div className="form-group">
              <label>Trimestral (R$)</label>
              <input 
                type="number" 
                value={currentPlan.quarterlyPrice} 
                onChange={e => setCurrentPlan({...currentPlan, quarterlyPrice: parseFloat(e.target.value) || 0})}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", background: "#374151", border: "1px solid #4b5563", color: "white" }}
              />
            </div>
            <div className="form-group">
              <label>Semestral (R$)</label>
              <input 
                type="number" 
                value={currentPlan.semiannualPrice} 
                onChange={e => setCurrentPlan({...currentPlan, semiannualPrice: parseFloat(e.target.value) || 0})}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", background: "#374151", border: "1px solid #4b5563", color: "white" }}
              />
            </div>
            <div className="form-group">
              <label>Anual (R$)</label>
              <input 
                type="number" 
                value={currentPlan.annualPrice} 
                onChange={e => setCurrentPlan({...currentPlan, annualPrice: parseFloat(e.target.value) || 0})}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", background: "#374151", border: "1px solid #4b5563", color: "white" }}
              />
            </div>
          </div>

          <h4 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Benefícios ({currentPlan.benefits?.length || 0})</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
            {currentPlan.benefits?.map((b: any, idx: number) => (
              <div key={idx} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <CheckCircle2 size={18} color="#10b981" />
                <select
                  value={b.key}
                  onChange={e => handleBenefitChange(idx, "key", e.target.value)}
                  style={{ width: "200px", padding: "0.5rem", borderRadius: "4px", background: "#374151", border: "1px solid #4b5563", color: "white" }}
                >
                  <option value="">Selecione...</option>
                  {AVAILABLE_BENEFITS.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={b.name}
                  onChange={e => handleBenefitChange(idx, "name", e.target.value)}
                  placeholder="Label de exibição"
                  style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", background: "#374151", border: "1px solid #4b5563", color: "white" }}
                />
                <button
                  onClick={() => handleRemoveBenefit(idx)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.5rem" }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddBenefit}
              style={{ alignSelf: "flex-start", background: "none", border: "1px dashed #6b7280", color: "#9ca3af", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer", display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem" }}
            >
              <Plus size={16} /> Adicionar Benefício
            </button>
          </div>

          <h4 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Configurações</h4>
          <div style={{ display: "flex", gap: "2rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={currentPlan.isActive} 
                onChange={e => setCurrentPlan({...currentPlan, isActive: e.target.checked})}
                style={{ width: "18px", height: "18px" }}
              />
              Plano Ativo (Disponível para venda)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={currentPlan.isFeatured} 
                onChange={e => setCurrentPlan({...currentPlan, isFeatured: e.target.checked})}
                style={{ width: "18px", height: "18px" }}
              />
              Destaque (Recomendado)
            </label>
          </div>
          
          <div style={{ marginTop: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: "#fbbf24" }}>
              <input 
                type="checkbox" 
                checked={currentPlan.applyOnlyToNew} 
                onChange={e => setCurrentPlan({...currentPlan, applyOnlyToNew: e.target.checked})}
                style={{ width: "18px", height: "18px" }}
              />
              Aplicar preço apenas para novos assinantes (usuários antigos mantêm o valor)
            </label>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", justifyContent: "flex-end" }}>
            <button 
              onClick={() => setIsEditing(false)}
              className="btn-logout"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.5rem" }}
            >
              <X size={18} /> Cancelar
            </button>
            <button 
              onClick={() => setShowPreview(currentPlan)}
              style={{ background: "#4f46e5", color: "white", border: "none", borderRadius: "4px", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.5rem", cursor: "pointer" }}
            >
              <Eye size={18} /> Prévia
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              style={{ background: "#10b981", color: "white", border: "none", borderRadius: "4px", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.5rem", cursor: "pointer" }}
            >
              {saving ? <Activity className="spin" size={18} /> : <Save size={18} />} 
              Salvar Plano
            </button>
          </div>
        </div>
      ) : (
        <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {isLoading ? (
            <p>Carregando planos...</p>
          ) : plans?.length === 0 ? (
            <p style={{ color: "#9ca3af", gridColumn: "1 / -1", textAlign: "center", padding: "3rem", background: "#1f2937", borderRadius: "8px" }}>Nenhum plano configurado. Crie o primeiro plano!</p>
          ) : (
            plans?.map((rawPlan: any) => {
              const plan = getMappedPlan(rawPlan);
              return (
                <div key={plan.id} style={{ 
                  background: "#1f2937", 
                  borderRadius: "12px", 
                  padding: "1.5rem",
                  border: plan.isFeatured ? `2px solid ${plan.badgeColor}` : "1px solid #374151",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column"
                }}>
                  {!plan.isActive && (
                    <div style={{ position: "absolute", top: 12, right: 12, background: "#ef4444", color: "white", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>INATIVO</div>
                  )}
                  {plan.isFeatured && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.badgeColor, color: "white", fontSize: "0.75rem", padding: "4px 12px", borderRadius: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Star size={12} fill="white" /> Recomendado
                    </div>
                  )}
                  
                  <h3 style={{ fontSize: "1.25rem", margin: "1rem 0 0.5rem", color: "white" }}>{plan.name}</h3>
                  <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white", marginBottom: "1rem" }}>
                    R$ {plan.monthlyPrice.toFixed(2)}<span style={{ fontSize: "1rem", color: "#9ca3af", fontWeight: "normal" }}>/mês</span>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.5rem", background: "#111827", padding: "1rem", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Trimestral:<br/><strong style={{ color: "white" }}>R$ {plan.quarterlyPrice.toFixed(2)}</strong></div>
                    <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Semestral:<br/><strong style={{ color: "white" }}>R$ {plan.semiannualPrice.toFixed(2)}</strong></div>
                    <div style={{ fontSize: "0.8rem", color: "#9ca3af", gridColumn: "1 / -1", borderTop: "1px solid #374151", paddingTop: "0.5rem", marginTop: "0.2rem" }}>
                      Anual: <strong style={{ color: plan.badgeColor, fontSize: "1rem" }}>R$ {plan.annualPrice.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.9rem", color: "#d1d5db", marginBottom: "1rem", fontWeight: "bold" }}>Benefícios:</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {plan.benefits?.slice(0, 5).map((b: any, i: number) => (
                        <li key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem", color: "#9ca3af" }}>
                          <CheckCircle2 size={14} color={plan.badgeColor} /> {b.name}
                        </li>
                      ))}
                      {plan.benefits?.length > 5 && (
                        <li style={{ fontSize: "0.8rem", color: "#6b7280", fontStyle: "italic", marginLeft: "1.5rem" }}>
                          + {plan.benefits.length - 5} outros benefícios...
                        </li>
                      )}
                    </ul>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                    <button 
                      onClick={() => handleEdit(plan)}
                      style={{ flex: 1, background: "#374151", color: "white", border: "none", borderRadius: "4px", padding: "0.5rem", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
                    >
                      <Edit2 size={16} /> Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(plan.id)}
                      style={{ background: "#451a1a", color: "#fca5a5", border: "none", borderRadius: "4px", padding: "0.5rem", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}
                      title="Inativar plano"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
          <div style={{ background: "#111827", width: "100%", maxWidth: "400px", borderRadius: "16px", padding: "2rem", position: "relative", border: `2px solid ${showPreview.badgeColor || '#10b981'}` }}>
            <button 
              onClick={() => setShowPreview(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}
            >
              <X size={24} />
            </button>
            
            {showPreview.isFeatured && (
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: showPreview.badgeColor || "#10b981", color: "white", fontSize: "0.8rem", padding: "4px 16px", borderRadius: "20px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                <Star size={14} fill="white" /> MAIS POPULAR
              </div>
            )}
            
            <h2 style={{ textAlign: "center", color: "white", fontSize: "1.8rem", marginTop: "1rem" }}>{showPreview.name}</h2>
            {showPreview.description && (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "0.9rem", margin: "0.5rem 0 1.5rem" }}>{showPreview.description}</p>
            )}
            
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <span style={{ fontSize: "3rem", fontWeight: "800", color: "white" }}>R$ {showPreview.monthlyPrice.toFixed(2)}</span>
              <span style={{ color: "#9ca3af" }}>/mês</span>
            </div>
            
            <button style={{ width: "100%", padding: "1rem", background: showPreview.badgeColor || "#10b981", color: "white", border: "none", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer", marginBottom: "2rem" }}>
              Assinar Agora
            </button>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {showPreview.benefits?.map((b: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <CheckCircle2 size={20} color={showPreview.badgeColor || "#10b981"} />
                  <span style={{ color: "#d1d5db", fontSize: "0.95rem" }}>{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
