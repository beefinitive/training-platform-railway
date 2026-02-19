import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get user ghada with roleId
const [users] = await connection.query("SELECT id, name, email, roleId FROM users WHERE email LIKE '%ghada%' OR name LIKE '%غادة%'");
console.log('User Ghada:', JSON.stringify(users, null, 2));

// Get all roles
const [roles] = await connection.query("SELECT * FROM roles");
console.log('All Roles:', JSON.stringify(roles, null, 2));

await connection.end();
