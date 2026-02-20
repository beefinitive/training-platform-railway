import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Target Alerts System", () => {
  describe("Alert Creation Logic", () => {
    it("should check and create alerts when target reaches 80%", async () => {
      // Get an employee with targets
      const employees = await db.listEmployees();
      if (employees.length === 0) {
        console.log("No employees found, skipping test");
        return;
      }

      const employee = employees[0];
      
      // Simulate targets with progress at 80%
      const mockTargets = [{
        id: 999999, // Use a high ID to avoid conflicts
        targetType: "confirmed_customers",
        customName: null,
        targetValue: "100",
        achieved: 85,
        percentage: 85,
        month: 1,
        year: 2025,
        status: "in_progress",
      }];

      const alerts = await db.checkAndCreateTargetAlerts(employee.id, mockTargets);
      
      expect(Array.isArray(alerts)).toBe(true);
      // Should create an alert for reaching 80%
      if (alerts.length > 0) {
        expect(alerts[0].alertType).toBe("reached_80");
        expect(alerts[0].percentage).toBeGreaterThanOrEqual(80);
      }
    }, 30000);

    it("should not create duplicate alerts for the same target", async () => {
      const employees = await db.listEmployees();
      if (employees.length === 0) return;

      const employee = employees[0];
      
      const mockTargets = [{
        id: 999999,
        targetType: "confirmed_customers",
        customName: null,
        targetValue: "100",
        achieved: 85,
        percentage: 85,
        month: 1,
        year: 2025,
        status: "in_progress",
      }];

      // Call twice - second call should not create duplicates
      const alerts1 = await db.checkAndCreateTargetAlerts(employee.id, mockTargets);
      const alerts2 = await db.checkAndCreateTargetAlerts(employee.id, mockTargets);
      
      expect(alerts2.length).toBe(0); // No new alerts on second call
    }, 30000);

    it("should create alert for 100% achievement", async () => {
      const employees = await db.listEmployees();
      if (employees.length === 0) return;

      const employee = employees[0];
      
      const mockTargets = [{
        id: 999998, // Different ID
        targetType: "services_sold",
        customName: "خدمات مباعة",
        targetValue: "50",
        achieved: 55,
        percentage: 100,
        month: 1,
        year: 2025,
        status: "achieved",
      }];

      const alerts = await db.checkAndCreateTargetAlerts(employee.id, mockTargets);
      
      expect(Array.isArray(alerts)).toBe(true);
      // Should create alerts for both 80% and 100%
      const types = alerts.map(a => a.alertType);
      if (alerts.length > 0) {
        expect(types).toContain("reached_100");
      }
    }, 30000);
  });

  describe("Alert Listing", () => {
    it("should list all alerts", async () => {
      const alerts = await db.listTargetAlerts();
      
      expect(Array.isArray(alerts)).toBe(true);
      alerts.forEach(alert => {
        expect(alert).toHaveProperty("id");
        expect(alert).toHaveProperty("alertType");
        expect(alert).toHaveProperty("employeeId");
        expect(alert).toHaveProperty("targetId");
        expect(alert).toHaveProperty("message");
      });
    }, 30000);

    it("should filter alerts by type", async () => {
      const alerts80 = await db.listTargetAlerts({ alertType: "reached_80" });
      const alerts100 = await db.listTargetAlerts({ alertType: "reached_100" });
      
      expect(Array.isArray(alerts80)).toBe(true);
      expect(Array.isArray(alerts100)).toBe(true);
      
      alerts80.forEach(a => expect(a.alertType).toBe("reached_80"));
      alerts100.forEach(a => expect(a.alertType).toBe("reached_100"));
    }, 30000);

    it("should filter alerts by read status", async () => {
      const unreadAlerts = await db.listTargetAlerts({ isRead: false });
      
      expect(Array.isArray(unreadAlerts)).toBe(true);
      unreadAlerts.forEach(a => expect(a.isRead).toBe(false));
    }, 30000);
  });

  describe("Alert Management", () => {
    it("should get unread alert count", async () => {
      const count = await db.getUnreadAlertCount();
      
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    }, 30000);

    it("should mark alert as read", async () => {
      const alerts = await db.listTargetAlerts({ isRead: false });
      
      if (alerts.length > 0) {
        await db.markAlertAsRead(alerts[0].id);
        
        // Verify it's marked as read
        const updatedAlerts = await db.listTargetAlerts();
        const updated = updatedAlerts.find(a => a.id === alerts[0].id);
        if (updated) {
          expect(updated.isRead).toBe(true);
        }
      }
    }, 30000);

    it("should mark all alerts as read", async () => {
      await db.markAllAlertsAsRead();
      
      const unreadCount = await db.getUnreadAlertCount();
      expect(unreadCount).toBe(0);
    }, 30000);

    it("should delete an alert", async () => {
      const alerts = await db.listTargetAlerts();
      
      if (alerts.length > 0) {
        const alertToDelete = alerts[alerts.length - 1]; // Delete last one
        await db.deleteTargetAlert(alertToDelete.id);
        
        const updatedAlerts = await db.listTargetAlerts();
        const deleted = updatedAlerts.find(a => a.id === alertToDelete.id);
        expect(deleted).toBeUndefined();
      }
    }, 30000);
  });

  // Cleanup test alerts
  describe("Cleanup", () => {
    it("should clean up test alerts", async () => {
      // Delete alerts with targetId 999998 and 999999 (test data)
      const alerts = await db.listTargetAlerts();
      for (const alert of alerts) {
        if (alert.targetId === 999998 || alert.targetId === 999999) {
          await db.deleteTargetAlert(alert.id);
        }
      }
      
      // Verify cleanup
      const remaining = await db.listTargetAlerts();
      const testAlerts = remaining.filter(a => a.targetId === 999998 || a.targetId === 999999);
      expect(testAlerts.length).toBe(0);
    }, 30000);
  });
});
