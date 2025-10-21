document.addEventListener('DOMContentLoaded', () => {
    const navbarContainer = document.querySelector('.navbar');

    // Intenta recuperar el usuario guardado
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    if (!navbarContainer) return; // evita error si no hay navbar

    if (usuario) {
        //Usuario logeado
        navbarContainer.innerHTML = `
            <div class="logo">
                <img src="assets/iconos/logo.png"/>
                <a href="pantallaInicio.html"><h2>MatchUp</h2></a>
            </div>
            <div class="usuario-navbar">
                <span class="nombre-usuario">
                    <a href="perfil-usuario.html"><h1>${usuario.username}</h1></a>
                </span>
                <a href="perfil-usuario.html">
                    <img src="uploads/${usuario.foto || 'uploads/default.png'}" alt="Foto de perfil">
                </a>
            </div>
        `;
    } else {
        //Sin sesión
        navbarContainer.innerHTML = `
            <div class="logo">
                <img src="assets/iconos/logo.png" />
                <h2>MatchUp</h2>
            </div>
            <div class="UsuarioNombre">
                <a href="inicioSesion.html" class="login">INICIAR SESION</a>
                <a href="registro.html" class="RegistroButton">REGISTRARSE</a>
            </div>
        `;
    }

});