import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get instructor permissions
const [perms] = await connection.query("SELECT * FROM permissions WHERE name LIKE '%instructor%'");
console.log('Instructor Permissions:', perms);

// Add instructors.create permission to user 1
const createPerm = perms.find(p => p.name === 'instructors.create');
if (createPerm) {
  await connection.query("INSERT IGNORE INTO userPermissions (userId, permissionId) VALUES (1, ?)", [createPerm.id]);
  console.log('Added instructors.create permission to user 1');
}

await connection.end();
