import { describe, it, expect } from "vitest";
import {
  hasPermission,
  canManageCommerce,
  canManageComerciant,
  ROLE_PERMISSIONS,
} from "../lib/roles-permissions";

describe("Roles and Permissions", () => {
  describe("Admin Permissions", () => {
    it("should have all permissions for admin", () => {
      const adminPerms = ROLE_PERMISSIONS.admin;
      expect(adminPerms.permissions.length).toBeGreaterThan(0);
      expect(adminPerms.role).toBe("admin");
    });

    it("admin should be able to create commerces", () => {
      const hasCreatePerm = hasPermission("admin", "comercios", "create");
      expect(hasCreatePerm).toBe(true);
    });

    it("admin should be able to delete commerces", () => {
      const hasDeletePerm = hasPermission("admin", "comercios", "delete");
      expect(hasDeletePerm).toBe(true);
    });

    it("admin should be able to manage any commerce", () => {
      const canManage = canManageCommerce("admin", "commerce-123", "user-456");
      expect(canManage).toBe(true);
    });

    it("admin should be able to manage any comerciant", () => {
      const canManage = canManageComerciant(
        "admin",
        "comerciant-123",
        "user-456",
      );
      expect(canManage).toBe(true);
    });
  });

  describe("Comerciante Permissions", () => {
    it("comerciante should have limited permissions", () => {
      const comerciantePerms = ROLE_PERMISSIONS.comerciante;
      expect(comerciantePerms.permissions.length).toBeGreaterThan(0);
      expect(comerciantePerms.role).toBe("comerciante");
    });

    it("comerciante should be able to read commerces", () => {
      const hasReadPerm = hasPermission("comerciante", "comercios", "read");
      expect(hasReadPerm).toBe(true);
    });

    it("comerciante should be able to create commerces", () => {
      const hasCreatePerm = hasPermission("comerciante", "comercios", "create");
      expect(hasCreatePerm).toBe(true);
    });

    it("comerciante should NOT be able to delete users", () => {
      const hasDeletePerm = hasPermission("comerciante", "usuarios", "delete");
      expect(hasDeletePerm).toBe(false);
    });

    it("comerciante should only manage their own commerce", () => {
      const ownCommerceId = "comerciant-123";
      const userId = "comerciant-123";
      const canManage = canManageCommerce("comerciante", ownCommerceId, userId);
      expect(canManage).toBe(true);
    });

    it("comerciante should NOT manage other commerce", () => {
      const otherCommerceId = "commerce-456";
      const userId = "comerciant-123";
      const canManage = canManageCommerce(
        "comerciante",
        otherCommerceId,
        userId,
      );
      expect(canManage).toBe(false);
    });

    it("comerciante should only manage their own account", () => {
      const ownId = "comerciant-123";
      const userId = "comerciant-123";
      const canManage = canManageComerciant("comerciante", ownId, userId);
      expect(canManage).toBe(true);
    });

    it("comerciante should NOT manage other account", () => {
      const otherId = "comerciant-456";
      const userId = "comerciant-123";
      const canManage = canManageComerciant("comerciante", otherId, userId);
      expect(canManage).toBe(false);
    });
  });

  describe("Cliente Permissions", () => {
    it("cliente should have minimal permissions", () => {
      const clientePerms = ROLE_PERMISSIONS.cliente;
      expect(clientePerms.permissions.length).toBeGreaterThan(0);
      expect(clientePerms.role).toBe("cliente");
    });

    it("cliente should be able to read commerces", () => {
      const hasReadPerm = hasPermission("cliente", "comercios", "read");
      expect(hasReadPerm).toBe(true);
    });

    it("cliente should NOT be able to create commerces", () => {
      const hasCreatePerm = hasPermission("cliente", "comercios", "create");
      expect(hasCreatePerm).toBe(false);
    });

    it("cliente should be able to create reviews", () => {
      const hasCreatePerm = hasPermission("cliente", "avaliacoes", "create");
      expect(hasCreatePerm).toBe(true);
    });

    it("cliente should NOT manage any commerce", () => {
      const canManage = canManageCommerce(
        "cliente",
        "commerce-123",
        "user-456",
      );
      expect(canManage).toBe(false);
    });
  });

  describe("Permission Verification", () => {
    it("should correctly identify missing permissions", () => {
      const hasDeletePerm = hasPermission("cliente", "comercios", "delete");
      expect(hasDeletePerm).toBe(false);
    });

    it("should handle non-existent resources", () => {
      const hasPerm = hasPermission("admin", "nonexistent", "read");
      expect(hasPerm).toBe(false);
    });

    it("should verify all admin permissions exist", () => {
      const adminPerms = ROLE_PERMISSIONS.admin;
      const resources = [
        "comercios",
        "comerciantes",
        "usuarios",
        "pagamentos",
        "relatorios",
      ];

      resources.forEach((resource) => {
        const hasRead = adminPerms.permissions.some(
          (p) => p.resource === resource && p.action === "read",
        );
        expect(hasRead).toBe(true);
      });
    });
  });
});
