import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get user
const users = await connection.query("SELECT id, name, email, openId FROM users WHERE name LIKE '%Mohamed%' OR email LIKE '%just2vip%'");
console.log('User:', JSON.stringify(users[0], null, 2));

// Get employees with userId
const employees = await connection.query("SELECT id, name, profileImage, userId FROM employees WHERE userId IS NOT NULL");
console.log('Employees with userId:', JSON.stringify(employees[0], null, 2));

await connection.end();
