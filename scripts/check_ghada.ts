import { getDb } from '../server/db';
import { employees, employeeTargets, dailyStats } from '../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }
  
  // Get Ghada's employee record
  const ghada = await db.select().from(employees).where(eq(employees.name, 'غادة حسن بسيوني'));
  console.log('Ghada Employee:', JSON.stringify(ghada, null, 2));
  
  if (ghada.length > 0) {
    const ghadaId = ghada[0].id;
    
    // Get her targets for January 2026
    const targets = await db.select().from(employeeTargets)
      .where(and(
        eq(employeeTargets.employeeId, ghadaId),
        eq(employeeTargets.month, 1),
        eq(employeeTargets.year, 2026)
      ));
    console.log('\nGhada Targets:', JSON.stringify(targets, null, 2));
    
    // Get her daily stats for January 2026
    const startDate = new Date(2026, 0, 1);
    const endDate = new Date(2026, 0, 31);
    const stats = await db.select().from(dailyStats)
      .where(and(
        eq(dailyStats.employeeId, ghadaId),
        gte(dailyStats.date, startDate),
        lte(dailyStats.date, endDate)
      ));
    console.log('\nGhada Daily Stats:', JSON.stringify(stats, null, 2));
    
    // Calculate total revenue from approved stats
    const approvedStats = stats.filter(s => s.status === 'approved');
    const totalRevenue = approvedStats.reduce((sum, s) => sum + parseFloat(s.calculatedRevenue || '0'), 0);
    console.log('\nTotal Revenue from Approved Stats:', totalRevenue);
    
    // Find sales_amount target
    const salesTarget = targets.find(t => t.targetType === 'sales_amount');
    if (salesTarget) {
      console.log('\nSales Amount Target:');
      console.log('  Target Value:', salesTarget.targetValue);
      console.log('  Current Value:', salesTarget.currentValue);
      console.log('  Base Value:', salesTarget.baseValue);
      console.log('  Expected Current Value (baseValue + totalRevenue):', parseFloat(salesTarget.baseValue || '0') + totalRevenue);
    }
  }
  
  process.exit(0);
}

main().catch(console.error);
