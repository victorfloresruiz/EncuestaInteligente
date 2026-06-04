// Array donde guardamos todas las respuestas (empieza vacío)
let respuestas = [];
let siguienteId = 1;

// Guardar una nueva respuesta
function guardarRespuesta() {
    let grupo     = document.getElementById("grupo").value;
    let puntuacion = parseInt(document.getElementById("puntuacion").value);
    let comentario = document.getElementById("comentario").value;
    let error      = document.getElementById("error");
    let mensajeOk  = document.getElementById("mensaje-ok");

    // Validación
    if (isNaN(puntuacion) || puntuacion < 1 || puntuacion > 5) {
        error.textContent = "La puntuación tiene que ser un número del 1 al 5.";
        return;
    }
    error.textContent = "";

    // Añadir la nueva respuesta al array
    let nueva = {
        id: siguienteId,
        grupo: grupo,
        puntuacion: puntuacion,
        comentario: comentario,
        fecha: new Date().toLocaleDateString()
    };
    respuestas.push(nueva);
    siguienteId++;

    // Limpiar el formulario
    document.getElementById("puntuacion").value = "";
    document.getElementById("comentario").value = "";

    // Mostrar mensaje de éxito
    mensajeOk.style.display = "block";
    setTimeout(function() {
        mensajeOk.style.display = "none";
    }, 2000);

    // Cambiar el filtro al grupo guardado y actualizar el panel
    document.getElementById("filtro").value = grupo;
    actualizarPanel();
}

// Actualizar todo el panel de analítica
function actualizarPanel() {
    let filtro = document.getElementById("filtro").value;

    // Filtrar las respuestas según el grupo seleccionado
    let datos = [];
    if (filtro === "TODOS") {
        datos = respuestas;
    } else {
        for (let i = 0; i < respuestas.length; i++) {
            if (respuestas[i].grupo === filtro) {
                datos.push(respuestas[i]);
            }
        }
    }

    // Actualizar el texto informativo del filtro
    let infoFiltro = document.getElementById("info-filtro");
    if (filtro === "TODOS") {
        infoFiltro.textContent = "Mostrando todos los grupos";
    } else {
        infoFiltro.textContent = "Mostrando datos del grupo: " + filtro;
    }

    mostrarKPIs(datos, filtro);
    mostrarBarras(datos);
    mostrarComparativa(filtro);
    mostrarRespuestas(datos);
}

// Calcular y mostrar los KPIs
function mostrarKPIs(datos, filtro) {
    let total = datos.length;

    let suma = 0;
    for (let i = 0; i < datos.length; i++) {
        suma += datos[i].puntuacion;
    }
    let media = total > 0 ? (suma / total).toFixed(2) : "-";

    let positivas = 0;
    for (let i = 0; i < datos.length; i++) {
        if (datos[i].puntuacion >= 4) positivas++;
    }
    let porcentaje = total > 0 ? Math.round((positivas / total) * 100) + "%" : "-";

    document.getElementById("kpi-total").textContent    = total;
    document.getElementById("kpi-media").textContent    = media;
    document.getElementById("kpi-positivas").textContent = porcentaje;
    document.getElementById("kpi-grupo").textContent    = filtro;
}

// Mostrar el gráfico de barras de distribución
function mostrarBarras(datos) {
    let contenedor = document.getElementById("grafico-barras");
    contenedor.innerHTML = "";

    // Contar cuántas respuestas hay de cada puntuación (1 al 5)
    let conteo = [0, 0, 0, 0, 0];
    for (let i = 0; i < datos.length; i++) {
        conteo[datos[i].puntuacion - 1]++;
    }

    let maximo = Math.max(...conteo, 1);

    for (let i = 0; i < 5; i++) {
        let ancho = Math.round((conteo[i] / maximo) * 100);
        let fila = document.createElement("div");
        fila.className = "barra-fila";
        fila.innerHTML = `
            <p>${i + 1} estrella${i > 0 ? "s" : ""}</p>
            <div class="barra-fondo">
                <div class="barra-relleno" style="width: ${ancho}%"></div>
            </div>
            <span>${conteo[i]}</span>
        `;
        contenedor.appendChild(fila);
    }
}

// Mostrar la comparativa de media por grupo
function mostrarComparativa(filtroActual) {
    let contenedor = document.getElementById("grafico-comparativa");
    contenedor.innerHTML = "";

    let grupos = ["DAW1A", "DAW1B", "ASIX1"];

    // Calcular la media de cada grupo
    let medias = [];
    for (let i = 0; i < grupos.length; i++) {
        let suma = 0;
        let total = 0;
        for (let j = 0; j < respuestas.length; j++) {
            if (respuestas[j].grupo === grupos[i]) {
                suma += respuestas[j].puntuacion;
                total++;
            }
        }
        medias.push(total > 0 ? suma / total : 0);
    }

    for (let i = 0; i < grupos.length; i++) {
        let ancho = Math.round((medias[i] / 5) * 100);
        let esSeleccionado = grupos[i] === filtroActual;

        let fila = document.createElement("div");
        fila.className = "comp-fila";
        fila.innerHTML = `
            <p class="${esSeleccionado ? "seleccionado" : ""}">${grupos[i]}${esSeleccionado ? " (seleccionado)" : ""}</p>
            <div class="comp-fondo">
                <div class="comp-relleno" style="width: ${ancho}%"></div>
            </div>
            <span>${medias[i].toFixed(2)}/5</span>
        `;
        contenedor.appendChild(fila);
    }
}

// Mostrar la lista de respuestas
function mostrarRespuestas(datos) {
    let contenedor = document.getElementById("lista-respuestas");
    contenedor.innerHTML = "";

    if (datos.length === 0) {
        contenedor.innerHTML = "<p class='sin-respuestas'>No hay respuestas para este filtro.</p>";
        return;
    }

    // Mostrar las más recientes primero
    let ordenadas = datos.slice().reverse();

    for (let i = 0; i < ordenadas.length; i++) {
        let r = ordenadas[i];
        let div = document.createElement("div");
        div.className = "respuesta";
        div.innerHTML = `
            <p class="grupo-badge">${r.grupo}</p>
            <p class="puntuacion">Puntuación: ${r.puntuacion}/5</p>
            ${r.comentario ? "<p class='comentario'>Comentario: " + r.comentario + "</p>" : ""}
        `;
        contenedor.appendChild(div);
    }
}

// Inicializar el panel al cargar la página
actualizarPanel();