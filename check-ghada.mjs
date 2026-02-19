import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get user ghada
const [users] = await connection.query("SELECT u.id, u.name, u.email FROM users u WHERE u.email LIKE '%ghada%' OR u.name LIKE '%غادة%'");
console.log('User Ghada:', JSON.stringify(users, null, 2));

if (users.length > 0) {
  const userId = users[0].id;
  
  // Get user permissions
  const [permissions] = await connection.query(`
    SELECT up.permissionId, p.name, p.displayName 
    FROM user_permissions up 
    JOIN permissions p ON up.permissionId = p.id 
    WHERE up.userId = ?
  `, [userId]);
  console.log('User Permissions:', JSON.stringify(permissions, null, 2));
}

await connection.end();
