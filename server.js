const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const multer = require('multer');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const db = require('./models/db');

process.on('uncaughtException', err => {
  console.error('Excepción no capturada:', err);
});
process.on('unhandledRejection', reason => {
  console.error('Promesa rechazada no manejada:', reason);
});


// Servir los archivos estáticos de tu carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pantallaInicio.html'));
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/') // carpeta donde se guardan fotos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

//REGISTRAR USUARIO
app.post('/registro', upload.single('fotoPerfil'), (req, res) => {
  const { nombreUsuario, correo, contra } = req.body;
  const foto = req.file ? req.file.filename : 'default.png';

  const query = "CALL insertarUsuario(?, ?, ?, ?)";
  db.query(query, [nombreUsuario, correo, foto, contra], (err, results) => {
    if(err){
      console.error(err);
      return res.json({ success: false, message: 'Error al registrar usuario' });
    }
    res.json({ success: true, message: 'Usuario registrado correctamente ✅' });
  });
});

//INICIAR SESION
app.post('/login', (req, res) => {
    const { nombreUsuario, contra } = req.body;

    const query = `CALL validarUsuario(?, ?)`;
    db.query(query, [nombreUsuario, contra], (err, result) => {
        if (err) {
            console.error('Error al validar usuario:', err);
            return res.status(500).send('Error al validar usuario');
        }

        if (result[0].length > 0) {
            const usuario = result[0][0]; // { id, username, fotoPerfil }
            res.json(usuario); // ✅ devolvemos JSON
        } else {
            res.status(401).send('Usuario o contraseña incorrectos');
        }
    });
});

//OBTENER TODOS LOS CHATS
app.get('/chats/:miId', (req, res) => {
    const miId = req.params.miId;

    db.query('CALL obtenerChats(?)', [miId], (err, results) => {
        if (err) {
            console.error('Error al obtener chats:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results[0]); // array de chats
    });
});


//OBTENER HISTORIAL DE MENSAJES
app.get('/historial/:miId/:otroId', (req, res) => {
    const { miId, otroId } = req.params;

    if (!miId || !otroId) return res.status(400).json({ error: 'Faltan IDs' });

    db.query('CALL obtenerHistorialMensajes(?, ?)', [miId, otroId], (err, results) => {
        if (err) {
            console.error('Error en query historial:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results[0]); // todos los mensajes
    });
});

//ENVIAR UN MENSAJE
app.post('/enviar-mensaje', (req, res) => {
    const { emisor_id, receptor_id, mensaje } = req.body;

    if (!emisor_id || !receptor_id || !mensaje) {
        return res.status(400).json({ success: false, error: 'Faltan datos' });
    }

    db.query('CALL insertarMensaje(?, ?, ?)', [emisor_id, receptor_id, mensaje], (err, results) => {
        if (err) {
            console.error('Error al insertar mensaje:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true });
    });
});

// Configuración de Socket.io
io.on('connection', (socket) => {
    console.log('🟢 Usuario conectado');

    // Recibir el id del usuario desde el cliente al conectar
    const usuarioId = socket.handshake.query.usuarioId;
    socket.join(`usuario-${usuarioId}`);
    console.log(`Usuario ${usuarioId} unido a room usuario-${usuarioId}`);


    socket.on('enviar-mensaje', (data) => {
        const { emisor_id, receptor_id, mensaje } = data;

        // Guardar en la base de datos
        db.query('CALL insertarMensaje(?, ?, ?)', [emisor_id, receptor_id, mensaje], (err) => {
            if (err) return console.error(err);

            // Emitir solo a los usuarios involucrados
            io.to(`usuario-${emisor_id}`).emit('nuevo-mensaje', data);
            io.to(`usuario-${receptor_id}`).emit('nuevo-mensaje', data);

            // 🔹 Emitir actualización de lista de chats
            io.to(`usuario-${emisor_id}`).emit('actualizar-chats', { usuario_id: emisor_id });
            io.to(`usuario-${receptor_id}`).emit('actualizar-chats', { usuario_id: receptor_id });
        });
    });

    socket.on('disconnect', () => {
        console.log(`Usuario ${usuarioId} desconectado`);
    });
});

// Iniciar el servidor
const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));