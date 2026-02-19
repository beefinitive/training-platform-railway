import { updateEmployeeTargetsFromDailyStats } from '../server/db';

async function main() {
  const ghadaId = 300001;
  
  console.log('Updating targets for Ghada (ID:', ghadaId, ')...');
  await updateEmployeeTargetsFromDailyStats(ghadaId);
  console.log('Done!');
  
  process.exit(0);
}

main().catch(console.error);
