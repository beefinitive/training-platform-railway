import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get employees without user accounts
const [employees] = await connection.execute(`
  SELECT e.id, e.name, e.email, e.userId 
  FROM employees e 
  WHERE e.userId IS NULL
  LIMIT 5
`);

console.log("Employees without user accounts:");
console.log(employees);

// Get all users
const [users] = await connection.execute(`
  SELECT id, email, name 
  FROM users
`);

console.log("\nAll users:");
console.log(users);

await connection.end();
