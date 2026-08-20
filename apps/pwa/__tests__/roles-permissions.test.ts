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

  describe("User Permissions", () => {
    it("user should have limited permissions", () => {
      const userPerms = ROLE_PERMISSIONS.user;
      expect(userPerms.permissions.length).toBeGreaterThan(0);
      expect(userPerms.role).toBe("user");
    });

    it("user should be able to read commerces", () => {
      const hasReadPerm = hasPermission("user", "comercios", "read");
      expect(hasReadPerm).toBe(true);
    });

    it("user should be able to create reviews", () => {
      const hasCreatePerm = hasPermission("user", "avaliacoes", "create");
      expect(hasCreatePerm).toBe(true);
    });

    it("user should NOT be able to delete users", () => {
      const hasDeletePerm = hasPermission("user", "usuarios", "delete");
      expect(hasDeletePerm).toBe(false);
    });

    it("user should only manage their own commerce", () => {
      const ownCommerceId = "user-123";
      const userId = "user-123";
      const canManage = canManageCommerce("user", ownCommerceId, userId);
      expect(canManage).toBe(true);
    });

    it("user should NOT manage other commerce", () => {
      const otherCommerceId = "commerce-456";
      const userId = "user-123";
      const canManage = canManageCommerce("user", otherCommerceId, userId);
      expect(canManage).toBe(false);
    });

    it("user should only manage their own account", () => {
      const ownId = "user-123";
      const userId = "user-123";
      const canManage = canManageComerciant("user", ownId, userId);
      expect(canManage).toBe(true);
    });

    it("user should NOT manage other account", () => {
      const otherId = "user-456";
      const userId = "user-123";
      const canManage = canManageComerciant("user", otherId, userId);
      expect(canManage).toBe(false);
    });
  });

  describe("Permission Verification", () => {
    it("should correctly identify missing permissions", () => {
      const hasDeletePerm = hasPermission("user", "comercios", "delete");
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
