import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'manus_user_rw_4d9c7e',
  password: 'manus_pwd_4d9c7e',
  database: 'manus_db_4d9c7e',
  ssl: { rejectUnauthorized: true }
});

const [rows] = await connection.execute(`
  SELECT id, email, name, status, loginMethod, password IS NOT NULL as has_password 
  FROM users 
  WHERE email = 'mahaccount@gmail.com'
`);

console.log("User data:");
console.log(rows);

await connection.end();
