import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('WPForms Webhook Integration', () => {
  // Test getEmployeeByCode function
  describe('getEmployeeByCode', () => {
    it('should return null for non-existent employee code', async () => {
      const employee = await db.getEmployeeByCode('NON_EXISTENT_CODE_12345');
      expect(employee).toBeNull();
    });
  });

  // Test incrementRegisteredClientsFromWebhook function
  describe('incrementRegisteredClientsFromWebhook', () => {
    let testEmployeeId: number;
    const testCode = `WEBHOOK_TEST_${Date.now()}`;

    beforeAll(async () => {
      // Create a test employee with code
      const testEmployee = await db.createEmployee({
        name: 'Webhook Test Employee',
        email: `webhook-test-${Date.now()}@example.com`,
        phone: '0500000001',
        specialization: 'customer_service',
        hireDate: new Date(),
        salary: '5000',
        workType: 'remote',
        status: 'active',
        employeeCode: testCode,
      });
      testEmployeeId = testEmployee.id;
    });

    afterAll(async () => {
      // Cleanup test employee
      if (testEmployeeId) {
        try {
          await db.deleteEmployee(testEmployeeId);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    it('should throw error for non-existent employee code', async () => {
      await expect(
        db.incrementRegisteredClientsFromWebhook('INVALID_CODE_XYZ_999')
      ).rejects.toThrow('Employee with code INVALID_CODE_XYZ_999 not found');
    });

    it('should increment registered clients for valid employee code', async () => {
      const result = await db.incrementRegisteredClientsFromWebhook(testCode, 1);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.employeeId).toBe(testEmployeeId);
      expect(result.employeeName).toBe('Webhook Test Employee');
      expect(result.newRegisteredClients).toBeGreaterThanOrEqual(1);
    });

    it('should increment by custom amount', async () => {
      const result = await db.incrementRegisteredClientsFromWebhook(testCode, 5);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.newRegisteredClients).toBeGreaterThanOrEqual(5);
    });
  });

  // Test logWebhookCall function
  describe('logWebhookCall', () => {
    it('should log webhook call successfully', async () => {
      const logResult = await db.logWebhookCall({
        source: 'wpforms',
        employeeCode: 'TEST_CODE',
        payload: { test: 'data' },
        result: { success: true }
      });

      expect(logResult).toBeDefined();
      expect(logResult.success).toBe(true);
    });

    it('should log webhook call with error', async () => {
      const logResult = await db.logWebhookCall({
        source: 'wpforms',
        employeeCode: 'TEST_CODE',
        payload: { test: 'data' },
        result: null,
        error: 'Test error message'
      });

      expect(logResult).toBeDefined();
      expect(logResult.success).toBe(true);
    });
  });
});
