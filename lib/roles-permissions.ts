/**
 * Sistema de Roles e Permissões
 * Define os tipos de usuários e suas permissões no app
 */

export type UserRole = "admin" | "comerciante" | "cliente";

export interface Permission {
  resource: string;
  action: "create" | "read" | "update" | "delete";
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    role: "admin",
    description: "Administrador do sistema - acesso total",
    permissions: [
      // Comércios
      { resource: "comercios", action: "create" },
      { resource: "comercios", action: "read" },
      { resource: "comercios", action: "update" },
      { resource: "comercios", action: "delete" },
      // Comerciantes
      { resource: "comerciantes", action: "create" },
      { resource: "comerciantes", action: "read" },
      { resource: "comerciantes", action: "update" },
      { resource: "comerciantes", action: "delete" },
      // Usuários
      { resource: "usuarios", action: "create" },
      { resource: "usuarios", action: "read" },
      { resource: "usuarios", action: "update" },
      { resource: "usuarios", action: "delete" },
      // Pagamentos
      { resource: "pagamentos", action: "read" },
      { resource: "pagamentos", action: "update" },
      // Relatórios
      { resource: "relatorios", action: "read" },
    ],
  },
  comerciante: {
    role: "comerciante",
    description: "Comerciante - pode gerenciar apenas suas lojas",
    permissions: [
      // Pode ler suas próprias lojas
      { resource: "comercios", action: "read" },
      // Pode criar novas lojas
      { resource: "comercios", action: "create" },
      // Pode atualizar apenas suas lojas (verificado no backend)
      { resource: "comercios", action: "update" },
      // Pode deletar apenas suas lojas (verificado no backend)
      { resource: "comercios", action: "delete" },
      // Pode ler seu próprio perfil
      { resource: "usuarios", action: "read" },
      // Pode atualizar seu próprio perfil
      { resource: "usuarios", action: "update" },
    ],
  },
  cliente: {
    role: "cliente",
    description: "Cliente - pode visualizar comércios e deixar avaliações",
    permissions: [
      // Pode ler comércios
      { resource: "comercios", action: "read" },
      // Pode ler seu próprio perfil
      { resource: "usuarios", action: "read" },
      // Pode atualizar seu próprio perfil
      { resource: "usuarios", action: "update" },
      // Pode criar avaliações
      { resource: "avaliacoes", action: "create" },
      // Pode ler avaliações
      { resource: "avaliacoes", action: "read" },
    ],
  },
};

export function hasPermission(
  role: UserRole,
  resource: string,
  action: "create" | "read" | "update" | "delete"
): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return rolePerms.permissions.some(
    (p) => p.resource === resource && p.action === action
  );
}

export function canManageCommerce(
  role: UserRole,
  commerceOwnerId: string,
  currentUserId: string
): boolean {
  // Admin pode gerenciar qualquer comércio
  if (role === "admin") {
    return true;
  }

  // Comerciante só pode gerenciar seus próprios comércios
  if (role === "comerciante") {
    return commerceOwnerId === currentUserId;
  }

  // Cliente não pode gerenciar comércios
  return false;
}

export function canManageComerciant(
  role: UserRole,
  comerciantId: string,
  currentUserId: string
): boolean {
  // Admin pode gerenciar qualquer comerciante
  if (role === "admin") {
    return true;
  }

  // Comerciante só pode gerenciar sua própria conta
  if (role === "comerciante") {
    return comerciantId === currentUserId;
  }

  // Cliente não pode gerenciar comerciantes
  return false;
}
