const mysql = require('mysql2');

// Configuración de la conexión

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect(err => {
  if (err) {
    console.error('Error al conectar con la DB:', err);
  } else {
    console.log('Conectado a la base de datos MySQL de Railway');
  }
});

module.exports = db;