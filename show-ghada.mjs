import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [users] = await connection.query("SELECT id, name, email, roleId FROM users WHERE email = 'ghadahassen28@gmail.com'");
console.log('User Ghada:', users);

await connection.end();
