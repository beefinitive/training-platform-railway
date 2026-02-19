import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';
import { like } from 'drizzle-orm';

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });
  
  const employees = await db.select().from(schema.employees).where(like(schema.employees.email, '%ghada%'));
  console.log(JSON.stringify(employees, null, 2));
  
  await connection.end();
}

main().catch(console.error);
