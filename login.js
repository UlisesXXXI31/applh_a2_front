// login.js (VERSIÓN FINAL Y CORREGIDA)

document.addEventListener("DOMContentLoaded", () => {
    
    // --- CONFIGURACIÓN ---
    const API_BASE_URL = 'https://applh-a2.vercel.app'; // URL de tu API
    const dominioPermitido = "@europaschool.org";
    // -------------------

    const btnAcceder = document.getElementById('btn-acceder');
    const inputEmail = document.getElementById('input-email');
    const inputPassword = document.getElementById('input-password');
    const statusMessage = document.getElementById('status-message');

    // Comprobar si el usuario ya está logueado
    if (localStorage.getItem('userId') && localStorage.getItem('role')) {
        const role = localStorage.getItem('role');
        if (role === 'teacher') {
            window.location.href = 'teacher.html';
        } else {
            window.location.href = 'index.html';
        }
        return; // Detener la ejecución si ya está logueado
    }

    if (btnAcceder) {
        btnAcceder.addEventListener('click', async () => {
            const email = inputEmail.value.trim();
            const password = inputPassword.value;

            // --- Validación simple en el frontend ---
            if (!email || !password) {
                statusMessage.textContent = 'Por favor, introduce el correo y la contraseña.';
                statusMessage.style.color = 'red';
                return;
            }
            if (!email.endsWith(dominioPermitido)) {
                statusMessage.textContent = `Correo incorrecto: debe terminar en ${dominioPermitido}`;
                statusMessage.style.color = 'red';
                return;
            }

            statusMessage.textContent = 'Iniciando sesión...';
            statusMessage.style.color = 'black';

            try {
                // --- Petición a la API ---
                // ¡URL CORREGIDA para apuntar a la ruta de login!
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }) // Forma abreviada
                });
                
                const data = await response.json();

                if (!response.ok) {
                    // Si hay un error (ej. 400), la API nos da el mensaje
                    throw new Error(data.message || 'Error en el inicio de sesión');
                }

                // --- Guardado en localStorage y Redirección ---
                if (data.user && data.user.id) {
                    // ¡LÓGICA CORREGIDA! No usamos 'token', usamos el 'id' del usuario.
                    localStorage.setItem('userId', data.user.id);
                    localStorage.setItem('role', data.user.role);
                    localStorage.setItem('userData', JSON.stringify(data.user));

                    if (data.user.role === 'student') {
                        window.location.href = 'index.html';
                    } else if (data.user.role === 'teacher') {
                        window.location.href = 'teacher.html';
                    }
                } else {
                    throw new Error('Respuesta del servidor no válida.');
                }

            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                if (statusMessage) {
                    statusMessage.textContent = error.message;
                    statusMessage.style.color = 'red';
                }
            }
        });
    }
});
