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
        error.textContent = "La puntuació ha de ser un número de l'1 al 5.";
        return;
    }
    error.textContent = "";

    let respuesta = await fetch(SUPABASE_URL + "/rest/v1/respuestas", {
        method: "POST",
        headers: cabeceras,
        body: JSON.stringify({ grupo: grupo, puntuacion: puntuacion, comentario: comentario })
    });

    if (!respuesta.ok) {
        error.textContent = "Error al guardar. Intenta-ho de nou.";
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
        infoFiltro.textContent = "Mostrant tots els grups";
    } else {
        infoFiltro.textContent = "Mostrant dades del grup seleccionat al formulari: " + filtro;
    }

    mostrarKPIs(datos, filtro);
    mostrarBarras(datos);
    mostrarQuesitos(datos);
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

function mostrarQuesitos(datos) {
    const COLORS_5 = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"];
    const labels5  = ["1/5", "2/5", "3/5", "4/5", "5/5"];
    const total = datos.length;

    let conteo = [0, 0, 0, 0, 0];
    for (let i = 0; i < datos.length; i++) {
        conteo[datos[i].puntuacion - 1]++;
    }

    dibujarQuesito("canvas-puntuacions", conteo, COLORS_5);

    let llegenda1 = document.getElementById("llegenda-puntuacions");
    llegenda1.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        let pct = total > 0 ? ((conteo[i] / total) * 100).toFixed(1) : "0.0";
        llegenda1.innerHTML += `<span><span class="llegenda-color" style="background:${COLORS_5[i]}"></span>${labels5[i]}: ${conteo[i]} (${pct}%)</span>`;
    }

    let positives   = conteo[3] + conteo[4];
    let noPositives = conteo[0] + conteo[1] + conteo[2];
    dibujarQuesito("canvas-positives", [positives, noPositives], ["#2ecc71", "#e67e22"]);

    let pctPos = total > 0 ? ((positives   / total) * 100).toFixed(1) : "0.0";
    let pctNeg = total > 0 ? ((noPositives / total) * 100).toFixed(1) : "0.0";
    let llegenda2 = document.getElementById("llegenda-positives");
    llegenda2.innerHTML = `
        <span><span class="llegenda-color" style="background:#2ecc71"></span>Positives (4-5): ${pctPos}%</span>
        <span><span class="llegenda-color" style="background:#e67e22"></span>No positives (1-3): ${pctNeg}%</span>
    `;
}

function dibujarQuesito(canvasId, valors, colors) {
    let canvas = document.getElementById(canvasId);
    let ctx    = canvas.getContext("2d");
    let total  = valors.reduce(function(a, b) { return a + b; }, 0);
    let cx = canvas.width / 2;
    let cy = canvas.height / 2;
    let r  = 60;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (total === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = "#e8edf2";
        ctx.fill();
        return;
    }

    let angle = -Math.PI / 2;
    for (let i = 0; i < valors.length; i++) {
        if (valors[i] === 0) continue;
        let slice = (valors[i] / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, angle, angle + slice);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        angle += slice;
    }
}

async function mostrarComparativa(filtroActual) {
    let contenedor = document.getElementById("grafico-comparativa");
    contenedor.innerHTML = "";

    let grupos = ["DAW1A", "DAW1B", "ASIX1"];

    let respuesta = await fetch(SUPABASE_URL + "/rest/v1/respuestas", { headers: cabeceras });
    let todas = await respuesta.json();

    for (let i = 0; i < grupos.length; i++) {
        let suma  = 0;
        let total = 0;
        for (let j = 0; j < todas.length; j++) {
            if (todas[j].grupo === grupos[i]) {
                suma  += todas[j].puntuacion;
                total++;
            }
        }
        let media = total > 0 ? suma / total : 0;
        let ancho = Math.round((media / 5) * 100);
        let esSeleccionado = grupos[i] === filtroActual;

        let fila = document.createElement("div");
        fila.className = "comp-fila";
        fila.innerHTML = `
            <p class="${esSeleccionado ? "seleccionado" : ""}">${grupos[i]}${esSeleccionado ? " (seleccionat)" : ""}</p>
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
        contenedor.innerHTML = "<p class='sin-respuestas'>No hi ha respostes per a aquest filtre.</p>";
        return;
    }

    for (let i = 0; i < datos.length; i++) {
        let r   = datos[i];
        let div = document.createElement("div");
        div.className = "respuesta";
        div.innerHTML = `
            <p class="grupo-badge">${r.grupo}</p>
            <p class="puntuacion">Puntuació: ${r.puntuacion}/5</p>
            ${r.comentario ? "<p class='comentario'>Comentari: " + r.comentario + "</p>" : ""}
        `;
        contenedor.appendChild(div);
    }
}

actualizarPanel();