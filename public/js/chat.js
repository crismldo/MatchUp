
const inputMensaje = document.getElementById('inputMensaje');

let chatActivoId = null; // aquí guardamos el id del chat seleccionado
const usuario = JSON.parse(localStorage.getItem('usuario'));
const miId = Number(usuario.id);

const chatMenu = document.getElementById('chatMenu');
const contenedor = document.getElementById('contenedorMensajes');
const headerUsuario = document.getElementById('datos-usuario-H');

const SERVER_URL = "https://matchup-production.up.railway.app";

// Conectar al servidor y enviar miId
const socket = io(SERVER_URL, { 
  query: { usuarioId: miId }
});

//ESCUCHAR MENSAJES EN TIEMPO REAL
socket.on('nuevo-mensaje', (data) => {
    if (!chatActivoId) return; //si no hay chat seleccionado, no mostrar nada

    // Si el mensaje pertenece al chat abierto, lo mostramos
    const esChatActual =
        (data.emisor_id === chatActivoId && data.receptor_id === miId) ||
        (data.emisor_id === miId && data.receptor_id === chatActivoId);

    if (!esChatActual) return; // ❌ si el mensaje no corresponde al chat activo, ignorar

    // ✅ Mostrar solo si pertenece al chat activo
    if (data.receptor_id === miId) {
        agregarMensajeRecibido(data.mensaje);
    } else if (data.emisor_id === miId) {
        agregarMensajeEnviado(data.mensaje);
    }
});

socket.on('actualizar-chats', (data) => {
    // Verifica que el evento sea para este usuario
    if (data.usuario_id === miId) {
        actualizarListaDeChats(miId);
    }
});

//CARGAR LOS CHATS
document.addEventListener('DOMContentLoaded', () => {
    actualizarListaDeChats(miId);
});

//ENVIAR UN MENSAJE
inputMensaje.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const mensaje = inputMensaje.value.trim();
        if (!mensaje || !chatActivoId) return;

        // Enviar al servidor via Socket.io
        socket.emit('enviar-mensaje', {
            emisor_id: miId,
            receptor_id: chatActivoId,
            mensaje
        });

        inputMensaje.value = '';
    }
});

function agregarMensajeRecibido(mensaje) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'recived';
    msgDiv.innerHTML = `
        <span>${mensaje}</span>
        <p>${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
    `;
    contenedor.appendChild(msgDiv);
    contenedor.scrollTop = contenedor.scrollHeight; // siempre baja al último mensaje
}

function agregarMensajeEnviado(mensaje) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'sent';
    msgDiv.innerHTML = `
        <span>${mensaje}</span>
        <p>${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
    `;
    contenedor.appendChild(msgDiv);
    contenedor.scrollTop = contenedor.scrollHeight;
}

function actualizarListaDeChats(miId) {
    fetch(`/chats/${miId}`)
        .then(res => res.json())
        .then(data => {
            chatMenu.innerHTML = '';

            data.forEach(chat => {
                const div = document.createElement('div');
                div.className = 'chat-individual';
                div.dataset.id = chat.usuario_id;
                div.innerHTML = `
                    <img src="uploads/${chat.foto_perfil || 'uploads/default.png'}">
                    <span>
                        <h1>${chat.nombre_usuario}</h1>
                        <p>${chat.ultimo_mensaje}</p>
                    </span>
                `;
                
                // Evento click para seleccionar chat
                div.addEventListener('click', () => {

                    // quitar clase selected-chat de otros
                    document.querySelectorAll('.chat-individual').forEach(c => c.classList.remove('selected-chat'));
                    div.classList.add('selected-chat');

                    chatActivoId = chat.usuario_id;

                    inputMensaje.disabled = false;

                    headerUsuario.innerHTML = `
                    <img src="uploads/${chat.foto_perfil || 'uploads/default.png'}">
                        <span>
                            <h1>${chat.nombre_usuario}</h1>
                            <p>En linea</p>
                        </span>
                    `;
                    // Limpiar contenedor de mensajes
                    contenedor.innerHTML = '';

                    // Traer historial de mensajes
                    fetch(`/historial/${miId}/${chatActivoId}`)
                        .then(res => res.json())
                        .then(mensajes => {
                            mensajes.forEach(msg => {
                                const msgDiv = document.createElement('div');
                                msgDiv.className = (msg.emisor_id === miId) ? 'sent' : 'recived';
                                msgDiv.innerHTML = `
                                    <span>${msg.mensaje}</span>
                                    <p>${new Date(msg.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                `;
                                contenedor.appendChild(msgDiv);
                            });
                            contenedor.scrollTop = contenedor.scrollHeight;
                        });
                });

                chatMenu.appendChild(div);
            });
        })
        .catch(err => console.error('Error al actualizar chats:', err));
}

