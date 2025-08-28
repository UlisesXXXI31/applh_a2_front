// app.js

// 1. Seleccionamos elementos del DOM que usaremos para mostrar/ocultar pantallas y contenido
// Variables globales
let leccionSeleccionada = null;
let actividadSeleccionada = null;
let ejercicioActual = 0;
let puntos = 0;
let puntosUltimaSesion = 0;

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
const actividadJuego = document.getElementById('contenido-actividad');

const puntosTexto = document.getElementById("puntos");
const btnReiniciarPuntos = document.getElementById("btn-reiniciar-puntos");

const listaHistorial = document.getElementById("lista-historial");
const btnSalirHistorial = document.getElementById("btn-salir-historial");
const pantallaHistorial = document.getElementById("pantalla-historial");
const contenedorHistorial = document.getElementById("historial-container");
const btnVerHistorial = document.getElementById("btn-ver-historial");

const sonidoCorrecto = new Audio("audio/correct.mp3");
const sonidoIncorrecto= new Audio("audio/incorrect.mp3");

// Ocultar todas las pantallas
function ocultarPantallas() {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("pantalla-activa"));
}

// Mostrar una pantalla específica
function mostrarPantalla(idPantalla) {
  ocultarPantallas();
  document.getElementById(idPantalla).classList.add("pantalla-activa");
}

// Cargar lista de lecciones
function cargarLecciones() {
  leccionesContainer.innerHTML = '';
  datosLecciones.forEach((leccion, index) => {
    const btn = document.createElement('button');
    btn.textContent = leccion.nombre;
    btn.addEventListener('click', () => seleccionarLeccion(index));
    leccionesContainer.appendChild(btn);
  });
}

// Seleccionar lección y mostrar actividades
function seleccionarLeccion(indice) {
  leccionSeleccionada = datosLecciones[indice];
  document.getElementById("titulo-leccion").textContent = leccionSeleccionada.nombre;

  // Mostrar pantalla actividades y asignar eventos
  mostrarPantalla("pantalla-actividades");
}

// Mostrar lista de sub-actividades (para leer o escuchar)
function mostrarListaActividades(tipo) {
  contenidoActividad.innerHTML = "";
  preguntasActividad.innerHTML = "";
  mensajeFeedback.textContent = "";

  const lista = tipo === "lesen" ? leccionSeleccionada.lesen : leccionSeleccionada.horen;

  if (!lista || lista.length === 0) {
    contenidoActividad.textContent = "No hay actividades para esta sección.";
    mostrarPantalla("pantalla-actividad");
    return;
  }

  contenidoActividad.innerHTML = "";

  lista.forEach((actividad, index) => {
    const btn = document.createElement("button");
    btn.textContent = `Teil ${index + 1}: ${actividad.titulo}`;
    btn.addEventListener("click", () => {
      actividadSeleccionada = actividad;
      ejercicioActual = 0;
      iniciarActividad(tipo);
    });
    contenidoActividad.appendChild(btn);
  });

  document.getElementById("titulo-actividad").textContent = tipo === "lesen" ? "Leseverstehen" : "Hörverstehen";
  mostrarPantalla("pantalla-actividad");
}

// Iniciar actividad (mostrar texto o audio y la primera pregunta)
function iniciarActividad(tipo) {
  // Limpiar contenedores
  actividadJuego.innerHTML = "";
  preguntasActividad.innerHTML = "";
  mensajeFeedback.textContent = "";

  // 1. Mostrar ENCABEZADO (título + instrucciones + ejemplo)
  const header = document.createElement("div");
  header.className = "activity-header";

  // Título
  const titulo = document.createElement("h3");
  titulo.textContent = actividadSeleccionada.titulo;
  header.appendChild(titulo);

  // Instrucciones (si existen)
  if (actividadSeleccionada.instrucciones) {
    const instrucciones = document.createElement("p");
    instrucciones.className = "instrucciones";
    instrucciones.textContent = actividadSeleccionada.instrucciones;
    header.appendChild(instrucciones);
  }

  // Ejemplo (si existe)
  if (actividadSeleccionada.ejemplo) {
    const ejemplo = document.createElement("p");
    ejemplo.className = "ejemplo";
    ejemplo.innerHTML = `<strong>Ejemplo:</strong> ${actividadSeleccionada.ejemplo}`;
    header.appendChild(ejemplo);
  }

  actividadJuego.appendChild(header);

  // 2. Mostrar CONTENIDO PRINCIPAL según el tipo
  if (tipo === "lesen" && actividadSeleccionada.texto) {
    // Formatear texto con párrafos
    const texto = document.createElement("div");
    texto.className = "texto-actividad";
    texto.innerHTML = actividadSeleccionada.texto.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
    actividadJuego.appendChild(texto);
  } 
  else if (tipo === "horen" && actividadSeleccionada.audio) {
    const audio = document.createElement("audio");
    audio.src = actividadSeleccionada.audio;
    audio.controls = true;
    audio.className = "audio-player";
    actividadJuego.appendChild(audio);
  }

  // 3. Mostrar INTERACTIVIDAD (preguntas o arrastrable)
  if (tipo === "horen" && actividadSeleccionada.respuestas) {
    mostrarHoerenTeil2(actividadSeleccionada); // Actividad de arrastrar (Teil 2)
  } 
  else if (actividadSeleccionada.preguntas) {
    mostrarEjercicio(); // Preguntas normales
  } else {
    preguntasActividad.textContent = "No hay preguntas en esta actividad.";
  }
}




// Mostrar pregunta actual y opciones
function mostrarEjercicio() {
  preguntasActividad.innerHTML = "";

  if (ejercicioActual >= actividadSeleccionada.preguntas.length) {
    preguntasActividad.textContent = "¡Has completado esta actividad!";
    return;
  }

  const pregunta = actividadSeleccionada.preguntas[ejercicioActual];

const p = document.createElement("h3");
p.innerHTML = pregunta.texto.replace(/\n/g, '<br>');
p.style.textAlign = "justify";
p.style.maxWidth = "600px";
p.style.margin = "0 auto 1rem auto";
preguntasActividad.appendChild(p);

pregunta.opciones.forEach(opcion => {
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

// Verificar respuesta seleccionada
function verificarRespuesta(seleccion) {
  mensajeFeedback.textContent = "";
  const pregunta = actividadSeleccionada.preguntas[ejercicioActual];

  if (seleccion === pregunta.respuesta) {
    mensajeFeedback.textContent = "✅ ¡Correcto!";
    sonidoCorrecto.play();
    puntos++;
    actualizarPuntos();
  } else {
    mensajeFeedback.textContent = `❌ Incorrecto. Respuesta correcta: ${pregunta.respuesta}`;
    sonidoIncorrecto.play();
    puntos = Math.max(0, puntos - 1); // No permitir puntos negativos
    actualizarPuntos();
  }

  ejercicioActual++;

  setTimeout(() => {
    mensajeFeedback.textContent = "";
    mostrarEjercicio();
  }, 1500);
}
  // Actualizar puntos
function actualizarPuntos() {
  puntosTexto.textContent = `Puntos totales: ${puntos}`;
}

function guardarPuntuacionEnHistorial() {
  const puntosSesion = puntos - puntosUltimaSesion;
  if (puntosSesion <= 0) return;

  const historial = JSON.parse(localStorage.getItem("historialPuntos")) || [];
  const correo = localStorage.getItem("correoAlumno") || "Sin correo";

  historial.push({
    fecha: new Date().toLocaleString(),
    puntos: puntosSesion,
    correo: correo
  });

  localStorage.setItem("historialPuntos", JSON.stringify(historial));
  puntosUltimaSesion = puntos;
}
btnVolverLecciones.addEventListener("click", () => {
 guardarPuntuacionEnHistorial();
 // guardarPuntuacion();
  mostrarPantalla("pantalla-lecciones");
  actividadJuego.innerHTML = "";
});


btnVerHistorial.addEventListener("click", () => {
  mostrarHistorial();
  mostrarPantalla("pantalla-historial");
});

btnSalirHistorial.addEventListener("click", () => {
  mostrarPantalla("pantalla-lecciones");
});

// Mostrar historial
function mostrarHistorial() {
  const historialContainer = document.getElementById("historial-container");
  historialContainer.innerHTML = "";

  const historial = JSON.parse(localStorage.getItem("historialPuntos")) || [];

  if (historial.length === 0) {
    historialContainer.textContent = "No hay historial aún.";
    return;
  }

  const lista = document.createElement("ul");

  historial.forEach(entry => {
  const li = document.createElement("li");
  li.textContent = `${entry.fecha} — ${entry.puntos} puntos — ${entry.correo}`;
  lista.appendChild(li);
});

  historialContainer.appendChild(lista);
}

// Reiniciar puntos
btnReiniciarPuntos.addEventListener("click", () => {
  puntos = 0;
  actualizarPuntos();
});

// Eventos botones navegación
btnIniciar.addEventListener('click', () => {
  mostrarPantalla("pantalla-lecciones");
  cargarLecciones();
});

btnVolverInicio.addEventListener('click', () => {
  mostrarPantalla("pantalla-inicio");
});

btnVolverLecciones.addEventListener('click', () => {
  mostrarPantalla("pantalla-lecciones");
  cargarLecciones();
});

btnVolverActividades.addEventListener('click', () => {
  mostrarPantalla("pantalla-actividades");
});

// Botones Hören y Lesen en pantalla actividades
btnHoren.addEventListener("click", () => mostrarListaActividades("horen"));
btnLesen.addEventListener("click", () => mostrarListaActividades("lesen"));

// Al iniciar la app mostramos la pantalla de inicio
mostrarPantalla("pantalla-inicio");

function mostrarHoerenTeil2(actividad) {
  const contenedor = document.getElementById("preguntas-actividad");
  contenedor.innerHTML = "";

  // Crear contenedor principal
  const activityContainer = document.createElement("div");
  activityContainer.className = "drag-drop-activity";
  contenedor.appendChild(activityContainer);

  // 1. Mostrar instrucciones
  const instrucciones = document.createElement("p");
  instrucciones.textContent = actividad.instrucciones;
  instrucciones.style.marginBottom = "20px";
  activityContainer.appendChild(instrucciones);

  // 2. Crear opciones arrastrables
  const optionsContainer = document.createElement("div");
  optionsContainer.className = "draggable-options";

  actividad.opciones.forEach(opcion => {
    const option = document.createElement("div");
    option.className = "draggable-item";
    option.textContent = opcion.texto;
    option.draggable = true;
    option.dataset.value = opcion.texto;

    option.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", opcion.texto);
      option.classList.add("dragging");
    });

    option.addEventListener("dragend", () => {
      option.classList.remove("dragging");
    });

    optionsContainer.appendChild(option);
  });

  activityContainer.appendChild(optionsContainer);

  // 3. Crear zonas de destino con nombre + respuesta en línea
  const dropZonesContainer = document.createElement("div");
  dropZonesContainer.className = "drop-zones";

  actividad.respuestas.forEach((respuesta, index) => {
    const zone = document.createElement("div");
    zone.className = "drop-zone";

    const inlineContainer = document.createElement("div");
    inlineContainer.className = "inline-response";

    // Nombre
    const nameSpan = document.createElement("span");
    nameSpan.className = "person-name";
    nameSpan.textContent = `${index + 1}. ${respuesta.persona}:`;

    // Slot de respuesta
    const answerSlot = document.createElement("span");
    answerSlot.className = "answer-slot empty";
    answerSlot.textContent = "______";
    answerSlot.dataset.correctAnswer = respuesta.solucion;

    answerSlot.addEventListener("dragover", (e) => {
      e.preventDefault();
      answerSlot.classList.add("highlight");
    });

    answerSlot.addEventListener("dragleave", () => {
      answerSlot.classList.remove("highlight");
    });

    answerSlot.addEventListener("drop", (e) => {
      e.preventDefault();
      answerSlot.classList.remove("highlight");

      const draggedText = e.dataTransfer.getData("text/plain");
      answerSlot.textContent = draggedText;
      answerSlot.classList.remove("empty");
      answerSlot.dataset.userAnswer = draggedText;

      // Ocultar la opción arrastrada
      document.querySelectorAll(".draggable-item").forEach(item => {
        if (item.textContent === draggedText) {
          item.style.visibility = "hidden";
        }
      });
    });

    inlineContainer.appendChild(nameSpan);
    inlineContainer.appendChild(answerSlot);
    zone.appendChild(inlineContainer);
    dropZonesContainer.appendChild(zone);
  });

  activityContainer.appendChild(dropZonesContainer);

  // 4. Botón de comprobación
  const checkButton = document.createElement("button");
  checkButton.textContent = "Comprobar Respuestas";
  checkButton.style.marginTop = "20px";
  checkButton.addEventListener("click", () => {
    let correctAnswers = 0;
    document.querySelectorAll(".answer-slot:not(.empty)").forEach(slot => {
      if (slot.dataset.userAnswer === slot.dataset.correctAnswer) {
        slot.parentElement.classList.add("correct");
        correctAnswers++;
      } else {
        slot.parentElement.classList.add("incorrect");
      }
    });

    // Mostrar resultado
    const resultDiv = document.createElement("div");
    resultDiv.style.marginTop = "15px";
    resultDiv.style.fontWeight = "bold";
    resultDiv.textContent = `Respuestas correctas: ${correctAnswers}/${actividad.respuestas.length}`;
    activityContainer.appendChild(resultDiv);
  });

  activityContainer.appendChild(checkButton);
}
