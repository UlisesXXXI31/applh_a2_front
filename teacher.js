// teacher.js
document.addEventListener('DOMContentLoaded', async () => {
    // Verificación de sesión (opcional pero recomendado)
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    if (!token || userRole !== 'teacher') {
        // Redirigir si no es un profesor logueado
        window.location.href = 'login.html'; // CORREGIDO: Redirigir al login
        return;
    }

    // Referencias a los elementos del formulario
    const form = document.getElementById('form-add-student');
    const studentNameInput = document.getElementById('student-name');
    const studentEmailInput = document.getElementById('student-email');
    const statusMessage = document.getElementById('status-message');
    
    // Referencia al contenedor de la lista de alumnos
    const studentListContainer = document.getElementById('student-list');
    
    // Referencia a los elementos del progreso del alumno
    const studentProgressSection = document.getElementById('student-progress');
    const studentNameTitle = document.getElementById('student-name-title');
    const progressHistoryContainer = document.getElementById('progress-history-container');
    const btnBackToList = document.getElementById('btn-back-to-list');

    // Lógica para cerrar sesión (NUEVA)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userData');
            window.location.href = 'login.html'; // CORREGIDO: Redirigir al login
        });
    }

    // Función para obtener y mostrar la lista de alumnos (ACTUALIZADA)
    async function fetchAndDisplayStudents() {
        try {
            studentListContainer.innerHTML = '<p>Cargando lista de alumnos...</p>';
            const response = await fetch('http://localhost:3000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}` // Añadir token de autenticación
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar alumnos');
            }

            const data = await response.json();
            studentListContainer.innerHTML = '';

            if (data.users.length === 0) {
                studentListContainer.innerHTML = '<p>No hay alumnos registrados aún.</p>';
                return;
            }

            data.users.forEach(user => {
                const studentCard = document.createElement('div');
                studentCard.className = 'student-card';
                studentCard.innerHTML = `
                    <h2>${user.name}</h2>
                    <ul>
                        <li><strong>Email:</strong> ${user.email}</li>
                    </ul>
                `;
                studentCard.style.cursor = 'pointer';
                studentCard.addEventListener('click', () => showStudentProgress(user._id, user.name));
                studentListContainer.appendChild(studentCard);
            });

        } catch (error) {
            studentListContainer.innerHTML = `<p style="color:red;">Error al cargar alumnos: ${error.message}. Asegúrate de que el servidor está funcionando.</p>`;
            console.error("Error:", error);
        }
    }

    // Función para mostrar el progreso de un alumno
    async function showStudentProgress(userId, studentName) {
        studentListContainer.style.display = 'none';
        studentProgressSection.style.display = 'block';
        studentNameTitle.textContent = studentName;
        progressHistoryContainer.innerHTML = '<p>Cargando historial de progreso...</p>';
        
        try {
            const response = await fetch(`http://localhost:3000/api/progress/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Añadir token de autenticación
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al obtener el historial de progreso.');
            }
            
            const data = await response.json();
            progressHistoryContainer.innerHTML = '';

            if (data.progress.length === 0) {
                progressHistoryContainer.innerHTML = '<p>No hay historial de progreso para este alumno.</p>';
                return;
            }

            const ul = document.createElement('ul');
            data.progress.forEach(entry => {
                const li = document.createElement('li');
                const date = new Date(entry.timestamp).toLocaleString();
                li.textContent = `Fecha: ${date}, Lección: ${entry.lessonName}, Tarea: ${entry.taskName}, Puntos: ${entry.score}`;
                ul.appendChild(li);
            });
            progressHistoryContainer.appendChild(ul);
            
        } catch (error) {
            progressHistoryContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
            console.error("Error:", error);
        }
    }

    // Evento del botón para volver a la lista
    btnBackToList.addEventListener('click', () => {
        studentProgressSection.style.display = 'none';
        studentListContainer.style.display = 'block';
    });

    // Evento para añadir un nuevo alumno al enviar el formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = studentNameInput.value;
        const email = studentEmailInput.value;
        const password = 'password123';
        statusMessage.textContent = "Añadiendo alumno...";
        statusMessage.style.color = "black";
        if (!email.endsWith('@europaschool.org')) {
            statusMessage.textContent = "Error: El correo debe terminar en @europaschool.org";
            statusMessage.style.color = "red";
            return;
        }
        try {
            const response = await fetch('http://localhost:3000/api/users', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Añadir token de autenticación
                },
                body: JSON.stringify({ name, email, password, role: 'student' })
            });
            const data = await response.json();
            if (response.ok) {
                statusMessage.textContent = `¡Alumno ${data.user.name} añadido con éxito!`;
                statusMessage.style.color = "green";
                form.reset();
                await fetchAndDisplayStudents();
            } else {
                statusMessage.textContent = `Error al añadir alumno: ${data.message}`;
                statusMessage.style.color = "red";
            }
        } catch (error) {
            statusMessage.textContent = "Error de red. Intenta de nuevo más tarde.";
            statusMessage.style.color = "red";
            console.error("Error:", error);
        }
    });

    fetchAndDisplayStudents();
});