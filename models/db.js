const mysql = require('mysql2');

// Configuración de la conexión
const connection = mysql.createConnection({
  host: 'localhost',       // usualmente localhost si trabajas local
  user: 'root',            // tu usuario de MySQL
  password: 'Krisantema2012', // tu contraseña de MySQL
  database: 'matchup_db'       // nombre de tu base de datos
});

// Conectar
connection.connect(err => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
    return;
  }
  console.log('✅ Conectado a la base de datos MySQL');
});

// Exportar la conexión para usarla en otros archivos
module.exports = connection;