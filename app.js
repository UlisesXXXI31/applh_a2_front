// app.js (VERSIÓN COMPLETA Y CONECTADA A LA API)

document.addEventListener('DOMContentLoaded', () => {

    // ===============================================
    //          CONFIGURACIÓN Y VARIABLES GLOBALES
    // ===============================================
    const API_BASE_URL = 'https://applh-a2.vercel.app'; // <-- URL DE TU API REAL

    // Variables de estado
    let leccionActual = null;       // Almacenará el OBJETO completo de la lección
    let actividadActual = null;     // Almacenará el OBJETO Teil (Lesen o Hören)
    let ejercicioActualIndex = 0;   // Índice de la pregunta actual
    let puntos = 0;
    let puntosUltimaSesion = 0;

    // Elementos del DOM
    const btnIniciar = document.getElementById('btn-iniciar');
    const btnVolverInicio = document.getElementById('btn-volver-inicio');
    const btnVolverLecciones = document.getElementById('btn-volver-lecciones');
    const btnVolverActividades = document.getElementById('btn-volver-actividades');
    const btnHoren = document.getElementById("btn-horen");
    const btnLesen = document.getElementById("btn-lesen");
    
    const leccionesContainer = document.getElementById('lecciones-container');
    const actividadesContainer = document.getElementById('actividades-container');
    const contenidoActividad = document.getElementById('contenido-actividad');
    const preguntasActividad = document.getElementById('preguntas-actividad');
    const mensajeFeedback = document.getElementById('mensaje-feedback');

    const puntosTexto = document.getElementById("puntos");
    const btnReiniciarPuntos = document.getElementById("btn-reiniciar-puntos");
    const btnLogout = document.getElementById('btn-logout');

    // Sonidos
    const sonidoCorrecto = new Audio("audio/correct.mp3");
    const sonidoIncorrecto = new Audio("audio/incorrect.mp3");


    // ===============================================
    //          NAVEGACIÓN ENTRE PANTALLAS
    // ===============================================
    function ocultarPantallas() {
        document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("pantalla-activa"));
    }

    function mostrarPantalla(idPantalla) {
        ocultarPantallas();
        document.getElementById(idPantalla).classList.add("pantalla-activa");
    }


    // ===============================================
    //          LÓGICA DE LA APLICACIÓN (CON API)
    // ===============================================

    /**
     * 1. Pide a la API la lista de lecciones del nivel A2 y las muestra en pantalla.
     */
    async function fetchAndShowLessons() {
        if (!leccionesContainer) return;
        leccionesContainer.innerHTML = "<p>Cargando lecciones...</p>";
        try {
            const response = await fetch(`${API_BASE_URL}/api/lessons?level=A2`);
            if (!response.ok) throw new Error('Error al cargar las lecciones.');
            const lecciones = await response.json();
            
            leccionesContainer.innerHTML = "";
            if (lecciones.length === 0) {
                leccionesContainer.innerHTML = "<p>No hay lecciones disponibles.</p>";
                return;
            }

            lecciones.forEach(leccion => {
                const btn = document.createElement("button");
                btn.textContent = `Lección ${leccion.lessonNumber}: ${leccion.title}`;
                btn.className = "leccion-btn";
                // --> CAMBIO: Al hacer clic, pediremos el contenido completo de la lección
                btn.addEventListener("click", () => fetchLessonContent(leccion._id));
                leccionesContainer.appendChild(btn);
            });
        } catch (error) {
            leccionesContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
        }
    }

    /**
     * 2. Pide a la API el contenido completo de una lección por su ID.
     */
    async function fetchLessonContent(leccionId) {
        try {
            // --> CAMBIO: Muestra un mensaje mientras carga
            const tituloLeccionElem = document.getElementById("titulo-leccion");
            tituloLeccionElem.textContent = "Cargando...";
            mostrarPantalla("pantalla-actividades");

            const response = await fetch(`${API_BASE_URL}/api/lessons/${leccionId}`);
            if (!response.ok) throw new Error('No se pudo cargar el contenido de la lección.');
            
            leccionActual = await response.json(); // <-- Guardamos el OBJETO completo de la lección
            tituloLeccionElem.textContent = leccionActual.title;

        } catch (error) {
            console.error("Error al obtener la lección:", error);
            // Manejar el error, por ejemplo, mostrando un mensaje
        }
    }
    
    /**
     * 3. Muestra los "Teile" (partes) disponibles para Lesen o Hören.
     */
    function mostrarListaActividades(tipo) {
        contenidoActividad.innerHTML = "";
        preguntasActividad.innerHTML = "";
        mensajeFeedback.textContent = "";

        // --> CAMBIO: La lista ahora viene de leccionActual.readings o leccionActual.listenings
        const lista = tipo === "lesen" ? leccionActual.readings : leccionActual.listenings;

        if (!lista || lista.length === 0) {
            contenidoActividad.textContent = "No hay actividades para esta sección.";
            mostrarPantalla("pantalla-actividad");
            return;
        }

        lista.forEach(actividad => {
            const btn = document.createElement("button");
            btn.textContent = actividad.title;
            btn.addEventListener("click", () => {
                actividadActual = actividad; // Guardamos el "Teil" seleccionado
                ejercicioActualIndex = 0;
                iniciarActividad(tipo);
            });
            contenidoActividad.appendChild(btn);
        });

        document.getElementById("titulo-actividad").textContent = tipo === "lesen" ? "Leseverstehen" : "Hörverstehen";
        mostrarPantalla("pantalla-actividad");
    }

    /**
     * 4. Inicia una actividad (muestra texto/audio y la primera pregunta).
     */
    function iniciarActividad(tipo) {
        // --> CAMBIO: Renombrado a `actividadActual` para mayor claridad
        const actividad = actividadActual;
        const actividadJuego = contenidoActividad; // Usamos el mismo contenedor
        
        actividadJuego.innerHTML = "";
        preguntasActividad.innerHTML = "";
        mensajeFeedback.textContent = "";

        const header = document.createElement("div");
        header.className = "activity-header";
        const titulo = document.createElement("h3");
        titulo.textContent = actividad.title;
        header.appendChild(titulo);
        if (actividad.instructions) {
            const instrucciones = document.createElement("p");
            instrucciones.className = "instrucciones";
            instrucciones.textContent = actividad.instructions;
            header.appendChild(instrucciones);
        }
        actividadJuego.appendChild(header);

        if (tipo === "lesen" && actividad.content) {
            const texto = document.createElement("div");
            texto.className = "texto-actividad";
            texto.innerHTML = actividad.content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
            actividadJuego.appendChild(texto);
        } else if (tipo === "horen" && actividad.audioUrl) {
            const audio = document.createElement("audio");
            audio.src = actividad.audioUrl; // --> CAMBIO: Usa audioUrl
            audio.controls = true;
            audio.className = "audio-player";
            actividadJuego.appendChild(audio);
        }

        // ... La lógica de mostrar preguntas (mostrarEjercicio) sigue casi igual
        if (actividad.questions && actividad.questions.length > 0) {
            mostrarEjercicio();
        } else {
            preguntasActividad.textContent = "No hay preguntas en esta actividad.";
        }
    }

    /**
     * 5. Muestra la pregunta actual y sus opciones.
     */
    function mostrarEjercicio() {
        preguntasActividad.innerHTML = "";

        if (ejercicioActualIndex >= actividadActual.questions.length) {
            preguntasActividad.textContent = "¡Has completado esta actividad!";
            // Aquí podrías llamar a guardarPuntuacionEnHistorial()
            return;
        }

        const pregunta = actividadActual.questions[ejercicioActualIndex];
        const p = document.createElement("h3");
        p.innerHTML = pregunta.text.replace(/\n/g, '<br>');
        preguntasActividad.appendChild(p);

        pregunta.options.forEach(opcion => {
            const btn = document.createElement("button");
            btn.textContent = opcion;
            btn.classList.add("btn-opcion");
            btn.addEventListener("click", () => {
                document.querySelectorAll(".btn-opcion").forEach(b => b.disabled = true);
                verificarRespuesta(opcion);
            });
            preguntasActividad.appendChild(btn);
        });
    }

    /**
     * 6. Verifica la respuesta y actualiza los puntos.
     */
    function verificarRespuesta(seleccion) {
        mensajeFeedback.textContent = "";
        const pregunta = actividadActual.questions[ejercicioActualIndex];

        if (seleccion === pregunta.correctAnswer) {
            mensajeFeedback.textContent = "✅ ¡Correcto!";
            sonidoCorrecto.play();
            puntos++;
        } else {
            mensajeFeedback.textContent = `❌ Incorrecto. La respuesta era: ${pregunta.correctAnswer}`;
            sonidoIncorrecto.play();
            puntos = Math.max(0, puntos - 1);
        }
        actualizarPuntos();
        ejercicioActualIndex++;

        setTimeout(() => {
            mensajeFeedback.textContent = "";
            mostrarEjercicio();
        }, 2000);
    }

    function actualizarPuntos() {
        puntosTexto.textContent = `Puntos: ${puntos}`;
    }


    // ===============================================
    //          HISTORIAL Y PUNTUACIÓN
    // ===============================================
    function guardarPuntuacionEnHistorial() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData || !userData.id) {
            console.error("Usuario no autenticado. No se puede guardar progreso en el servidor.");
            // Lógica de respaldo para guardar en localStorage si se desea
            return; 
        }

        const puntosSesion = puntos - puntosUltimaSesion;
        if (puntosSesion <= 0) {
            puntosUltimaSesion = puntos;
            return;
        }

        const progressData = {
            userId: userData.id,
            // --> CAMBIO: Nombres de campos para que coincidan con el modelo de Progress
            lessonName: leccionActual ? leccionActual.title : "Lección desconocida",
            taskName: actividadActual ? actividadActual.title : "Actividad desconocida",
            score: puntosSesion,
            completed: true
        };

        fetch(`${API_BASE_URL}/api/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(progressData)
        })
        .then(response => response.json())
        .then(data => console.log("Progreso guardado en el servidor:", data))
        .catch(error => console.error('Error al guardar progreso:', error));
        
        puntosUltimaSesion = puntos;
    }


    // ===============================================
    //          ASIGNACIÓN DE EVENTOS (Listeners)
    // ===============================================

    if (btnIniciar) {
        btnIniciar.addEventListener('click', () => {
            mostrarPantalla('pantalla-lecciones');
            fetchAndShowLessons(); // <-- Llama a la nueva función
        });
    }
    
    // --> CAMBIO: El botón de volver a lecciones ahora guarda la puntuación
    if (btnVolverLecciones) {
        btnVolverLecciones.addEventListener("click", () => {
            guardarPuntuacionEnHistorial();
            mostrarPantalla("pantalla-lecciones");
            contenidoActividad.innerHTML = ""; // Limpiar vista de actividad
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            guardarPuntuacionEnHistorial(); // Guarda la última puntuación antes de salir
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }
    
    // Asignar el resto de los listeners...
    btnVolverInicio.addEventListener('click', () => mostrarPantalla("pantalla-inicio"));
    btnVolverActividades.addEventListener('click', () => mostrarPantalla("pantalla-actividades"));
    btnHoren.addEventListener("click", () => mostrarListaActividades("horen"));
    btnLesen.addEventListener("click", () => mostrarListaActividades("lesen"));
    btnReiniciarPuntos.addEventListener("click", () => {
        puntos = 0;
        puntosUltimaSesion = 0;
        actualizarPuntos();
    });

    // Estado inicial de la aplicación
    mostrarPantalla("pantalla-inicio");
});
