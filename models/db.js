const mysql = require('mysql2');

// Crear un pool de conexiones
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10, // número máximo de conexiones simultáneas
  queueLimit: 0
});

// Exportar versión con promesas (para usar async/await)
const db = pool.promise();

db.getConnection()
  .then(() => console.log('Conectado a la base de datos MySQL de Railway'))
  .catch(err => console.error('Error al conectar con la DB:', err));

module.exports = db;