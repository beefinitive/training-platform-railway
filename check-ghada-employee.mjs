import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [result] = await connection.query(`
  SELECT e.id, e.name, e.userId, u.name as userName, u.email 
  FROM employees e 
  LEFT JOIN users u ON e.userId = u.id 
  WHERE u.email = 'ghadahassen28@gmail.com' OR e.name LIKE '%غادة حسن%'
`);
console.log('Employee-User Link:', result);

await connection.end();
