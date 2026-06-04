const SUPABASE_URL = "https://zjvnuhqpokifvycysswk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpqdm51aHFwb2tpZnZ5Y3lzc3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjM2NjMsImV4cCI6MjA5NjEzOTY2M30.vVC4Ri_bJfGT9_Id8udDDCTVY_a1MHExOWs51yWlzMI";

const cabeceras = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY
};


async function guardarRespuesta() {
    let grupo      = document.getElementById("grupo").value;
    let puntuacion = parseInt(document.getElementById("puntuacion").value);
    let comentario = document.getElementById("comentario").value;
    let error      = document.getElementById("error");
    let mensajeOk  = document.getElementById("mensaje-ok");

    if (isNaN(puntuacion) || puntuacion < 1 || puntuacion > 5) {
        error.textContent = "La puntuación tiene que ser un número del 1 al 5.";
        return;
    }
    error.textContent = "";

    let respuesta = await fetch(SUPABASE_URL + "/rest/v1/respuestas", {
        method: "POST",
        headers: cabeceras,
        body: JSON.stringify({ grupo: grupo, puntuacion: puntuacion, comentario: comentario })
    });

    if (!respuesta.ok) {
        error.textContent = "Error al guardar. Inténtalo de nuevo.";
        return;
    }

    document.getElementById("puntuacion").value = "";
    document.getElementById("comentario").value = "";

    mensajeOk.style.display = "block";
    setTimeout(function() {
        mensajeOk.style.display = "none";
    }, 2000);

    document.getElementById("filtro").value = grupo;
    actualizarPanel();
}

async function actualizarPanel() {
    let filtro = document.getElementById("filtro").value;

    let url = SUPABASE_URL + "/rest/v1/respuestas?order=fecha.desc";
    if (filtro !== "TODOS") {
        url += "&grupo=eq." + filtro;
    }

    let respuesta = await fetch(url, { headers: cabeceras });
    let datos = await respuesta.json();

    let infoFiltro = document.getElementById("info-filtro");
    if (filtro === "TODOS") {
        infoFiltro.textContent = "Mostrando todos los grupos";
    } else {
        infoFiltro.textContent = "Mostrando datos del grupo: " + filtro;
    }

    mostrarKPIs(datos, filtro);
    mostrarBarras(datos);
    await mostrarComparativa(filtro);
    mostrarRespuestas(datos);
}

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

    document.getElementById("kpi-total").textContent     = total;
    document.getElementById("kpi-media").textContent     = media;
    document.getElementById("kpi-positivas").textContent = porcentaje;
    document.getElementById("kpi-grupo").textContent     = filtro;
}

function mostrarBarras(datos) {
    let contenedor = document.getElementById("grafico-barras");
    contenedor.innerHTML = "";

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

async function mostrarComparativa(filtroActual) {
    let contenedor = document.getElementById("grafico-comparativa");
    contenedor.innerHTML = "";

    let grupos = ["DAW1A", "DAW1B", "ASIX1"];

    let respuesta = await fetch(SUPABASE_URL + "/rest/v1/respuestas", { headers: cabeceras });
    let todas = await respuesta.json();

    for (let i = 0; i < grupos.length; i++) {
        let suma = 0;
        let total = 0;
        for (let j = 0; j < todas.length; j++) {
            if (todas[j].grupo === grupos[i]) {
                suma += todas[j].puntuacion;
                total++;
            }
        }
        let media = total > 0 ? suma / total : 0;
        let ancho = Math.round((media / 5) * 100);
        let esSeleccionado = grupos[i] === filtroActual;

        let fila = document.createElement("div");
        fila.className = "comp-fila";
        fila.innerHTML = `
            <p class="${esSeleccionado ? "seleccionado" : ""}">${grupos[i]}${esSeleccionado ? " (seleccionado)" : ""}</p>
            <div class="comp-fondo">
                <div class="comp-relleno" style="width: ${ancho}%"></div>
            </div>
            <span>${media.toFixed(2)}/5</span>
        `;
        contenedor.appendChild(fila);
    }
}

function mostrarRespuestas(datos) {
    let contenedor = document.getElementById("lista-respuestas");
    contenedor.innerHTML = "";

    if (datos.length === 0) {
        contenedor.innerHTML = "<p class='sin-respuestas'>No hay respuestas para este filtro.</p>";
        return;
    }

    for (let i = 0; i < datos.length; i++) {
        let r = datos[i];
        let fecha = new Date(r.fecha).toLocaleDateString();
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

actualizarPanel();