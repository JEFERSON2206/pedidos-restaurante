const NUMERO_WHATSAPP = "573209816813";

let productos = [];
let carrito = [];
let categoriaActual = "Todos";
let textoBusqueda = "";

const contenedorProductos = document.getElementById("productos");
const sinResultados = document.getElementById("sinResultados");
const buscador = document.getElementById("buscador");
const contadorCanasta = document.getElementById("contadorCanasta");
const modalCanasta = document.getElementById("modalCanasta");
const abrirCanasta = document.getElementById("abrirCanasta");
const cerrarCanasta = document.getElementById("cerrarCanasta");
const itemsCanasta = document.getElementById("itemsCanasta");
const totalPedido = document.getElementById("totalPedido");
const vaciarCanasta = document.getElementById("vaciarCanasta");
const enviarWhatsApp = document.getElementById("enviarWhatsApp");
const notificacion = document.getElementById("notificacion");

async function cargarCatalogo() {
    try {
        const respuesta = await fetch("catalogo.json");
        if (!respuesta.ok) throw new Error("No se pudo cargar el catálogo.");
        productos = await respuesta.json();
        mostrarProductos();
    } catch (error) {
        console.error(error);
        contenedorProductos.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px">
                <h3>⚠️ No se pudo cargar el menú.</h3>
                <p style="margin-top:10px;color:#777">
                    Verifica que <strong>catalogo.json</strong> esté en la misma carpeta.
                </p>
            </div>`;
    }
}

function mostrarProductos() {
    contenedorProductos.innerHTML = "";
    const productosFiltrados = productos.filter(producto => {
        const coincideCategoria = categoriaActual === "Todos" || producto.categoria === categoriaActual;
        const texto = textoBusqueda.toLowerCase();
        const coincideBusqueda =
            producto.nombre.toLowerCase().includes(texto) ||
            producto.descripcion.toLowerCase().includes(texto);
        return coincideCategoria && coincideBusqueda;
    });

    if (productosFiltrados.length === 0) {
        sinResultados.style.display = "block";
        return;
    }
    sinResultados.style.display = "none";

    productosFiltrados.forEach(producto => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "producto";
        tarjeta.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-imagen"
                 onerror="this.src='https://via.placeholder.com/500x350?text=Producto'">
            <div class="producto-info">
                <div class="producto-categoria">${producto.categoria}</div>
                <h3>${producto.nombre}</h3>
                <p class="producto-descripcion">${producto.descripcion}</p>
                <div class="producto-precio">${formatearPrecio(producto.precio)}</div>
                <button class="boton-agregar" onclick="agregarAlCarrito(${producto.id})">+ Agregar</button>
            </div>`;
        contenedorProductos.appendChild(tarjeta);
    });
}

function agregarAlCarrito(id) {
    const producto = productos.find(producto => producto.id === id);
    if (!producto) return;

    const existente = carrito.find(item => item.id === id);
    if (existente) existente.cantidad++;
    else carrito.push({...producto, cantidad:1});

    actualizarCarrito();
    mostrarNotificacion("Producto agregado a la canasta 🛒");
}

function actualizarCarrito() {
    mostrarCarrito();
    actualizarContador();
    actualizarTotal();
}

function mostrarCarrito() {
    itemsCanasta.innerHTML = "";

    if (carrito.length === 0) {
        itemsCanasta.innerHTML = `
            <div style="text-align:center;padding:30px 10px;color:#777">
                <div style="font-size:40px;margin-bottom:10px">🛒</div>
                <p>Tu canasta está vacía.</p>
            </div>`;
        return;
    }

    carrito.forEach(item => {
        const elemento = document.createElement("div");
        elemento.className = "item-canasta";
        elemento.innerHTML = `
            <div class="item-info">
                <h4>${item.nombre}</h4>
                <p>${formatearPrecio(item.precio)} × ${item.cantidad}</p>
            </div>
            <div class="item-controles">
                <button class="cantidad-btn" onclick="cambiarCantidad(${item.id},-1)">−</button>
                <strong>${item.cantidad}</strong>
                <button class="cantidad-btn" onclick="cambiarCantidad(${item.id},1)">+</button>
                <button class="eliminar-item" onclick="eliminarProducto(${item.id})">🗑️</button>
            </div>`;
        itemsCanasta.appendChild(elemento);
    });
}

function cambiarCantidad(id, cambio) {
    const producto = carrito.find(item => item.id === id);
    if (!producto) return;
    producto.cantidad += cambio;
    if (producto.cantidad <= 0) carrito = carrito.filter(item => item.id !== id);
    actualizarCarrito();
}

function eliminarProducto(id) {
    carrito = carrito.filter(item => item.id !== id);
    actualizarCarrito();
}

function actualizarContador() {
    contadorCanasta.textContent = carrito.reduce((total,item) => total + item.cantidad,0);
}

function actualizarTotal() {
    const total = carrito.reduce((suma,item) => suma + item.precio * item.cantidad,0);
    totalPedido.textContent = formatearPrecio(total);
}

function formatearPrecio(valor) {
    return new Intl.NumberFormat("es-CO", {
        style:"currency", currency:"COP", maximumFractionDigits:0
    }).format(valor);
}

buscador.addEventListener("input", function() {
    textoBusqueda = this.value.trim();
    mostrarProductos();
});

document.querySelectorAll(".categoria").forEach(boton => {
    boton.addEventListener("click", function() {
        document.querySelectorAll(".categoria").forEach(b => b.classList.remove("activa"));
        this.classList.add("activa");
        categoriaActual = this.dataset.categoria;
        mostrarProductos();
    });
});

abrirCanasta.addEventListener("click", () => modalCanasta.classList.add("visible"));
cerrarCanasta.addEventListener("click", () => modalCanasta.classList.remove("visible"));

modalCanasta.addEventListener("click", event => {
    if (event.target === modalCanasta) modalCanasta.classList.remove("visible");
});

vaciarCanasta.addEventListener("click", () => {
    if (carrito.length === 0) return;
    if (!confirm("¿Quieres vaciar toda la canasta?")) return;
    carrito = [];
    actualizarCarrito();
});

enviarWhatsApp.addEventListener("click", () => {
    if (carrito.length === 0) {
        alert("Agrega al menos un producto a tu pedido.");
        return;
    }

    const nombre = document.getElementById("nombreCliente").value.trim();
    const direccion = document.getElementById("direccionCliente").value.trim();
    const telefono = document.getElementById("telefonoCliente").value.trim();
    const metodoPago = document.getElementById("metodoPago").value;
    const observaciones = document.getElementById("observaciones").value.trim();

    if (!nombre) return alert("Por favor escribe tu nombre.");
    if (!direccion) return alert("Por favor escribe la dirección.");
    if (!telefono) return alert("Por favor escribe tu teléfono.");
    if (!metodoPago) return alert("Selecciona una forma de pago.");

    let mensaje = "🍔 *NUEVO PEDIDO - MERCEDES FAST FOOD*\n\n";
    mensaje += "👤 *Cliente:* " + nombre + "\n";
    mensaje += "📍 *Dirección:* " + direccion + "\n";
    mensaje += "📱 *Teléfono:* " + telefono + "\n\n";
    mensaje += "🛒 *PEDIDO:*\n";

    carrito.forEach(item => {
        mensaje += "• " + item.cantidad + "x " + item.nombre + " - " +
            formatearPrecio(item.precio * item.cantidad) + "\n";
    });

    const total = carrito.reduce((suma,item) => suma + item.precio * item.cantidad,0);
    mensaje += "\n💰 *TOTAL SIN DOMICILIO: " + formatearPrecio(total) + "*\n";
    mensaje += "💳 *Pago:* " + metodoPago + "\n";
    if (observaciones) mensaje += "📝 *Observaciones:* " + observaciones + "\n";
    mensaje += "\n¡Gracias por tu pedido! 🙌";

    const url = "https://wa.me/" + NUMERO_WHATSAPP + "?text=" + encodeURIComponent(mensaje);
    window.open(url, "_blank");
});

function mostrarNotificacion(texto) {
    notificacion.textContent = texto;
    notificacion.classList.add("mostrar");
    setTimeout(() => notificacion.classList.remove("mostrar"),1800);
}

cargarCatalogo();
actualizarCarrito();
