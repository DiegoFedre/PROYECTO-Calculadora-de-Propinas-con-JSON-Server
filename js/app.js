let cliente = {
	mesa: '',
	hora: '',
	pedido: [],
};

const categorias = {
	1: 'Comidas',
	2: 'Bebidas',
	3: 'Postres',
};

const btnGuardarCliente = document.querySelector('#guardar-cliente');
btnGuardarCliente.addEventListener('click', guardarCliente);

function guardarCliente() {
	const mesa = document.querySelector('#mesa').value;
	const hora = document.querySelector('#hora').value;

	//Revisar si hay campos vacios
	// El metodo de arrays .some va a verificar que al menos uno de los elementos del array cumpla con la condicion establecida
	const camposVacios = [mesa, hora].some((campo) => campo === '');

	if (camposVacios) {
		//Verificar si ya hay una alerta
		const existeAlerta = document.querySelector('.invalid-feedback');

		if (!existeAlerta) {
			const alerta = document.createElement('div');
			alerta.classList.add('invalid-feedback', 'd-block', 'text-center');
			alerta.textContent = 'Todos los campos son obligatorios';
			document.querySelector('.modal-body form').appendChild(alerta);

			//Eliminamos la alerta despues de 3 segundos
			setTimeout(() => {
				alerta.remove();
			}, 3000);
		}

		return;
	}

	//Asignar datos del formulario al cliente
	//Primero asigno la copia del objeto (en este caso la primer vez esta vacio) para no poder conservar la hora y la mesa ya que si lo hago al ultimo las borraria al asignar la copia ya que esta vacia
	cliente = { ...cliente, mesa, hora };

	//Ocultar modal(ventana de mesa y hora)
	const modalFormulario = document.querySelector('#formulario');
	const modalBootstrap = bootstrap.Modal.getInstance(modalFormulario);
	modalBootstrap.hide();

	//Mostrar las secciones
	mostrarSecciones();

	//Obtener platillos de la API de json server
	obtenerPlatillos();
}

function mostrarSecciones() {
	const seccionesOcultas = document.querySelectorAll('.d-none');
	seccionesOcultas.forEach((seccion) => seccion.classList.remove('d-none'));
}

function obtenerPlatillos() {
	const url = 'http://localhost:4000/platillos';

	fetch(url)
		.then((respuesta) => respuesta.json())
		.then((resultado) => mostrarPlatillos(resultado))
		.catch((error) => console.log(error));
}

function mostrarPlatillos(platillos) {
	const contenido = document.querySelector('#platillos .contenido');

	platillos.forEach((platillo) => {
		const row = document.createElement('div');
		row.classList.add('row', 'py-3', 'border-top');

		const nombre = document.createElement('div');
		nombre.classList.add('col-md-4');
		nombre.textContent = platillo.nombre;

		const precio = document.createElement('div');
		precio.classList.add('col-md-3', 'fw-bold');
		precio.textContent = `$${platillo.precio}`;

		const categoria = document.createElement('div');
		categoria.classList.add('col-md-3');
		categoria.textContent = categorias[platillo.categoria];

		const inputCantidad = document.createElement('input');
		inputCantidad.type = 'number';
		inputCantidad.min = 0;
		inputCantidad.value = 0;
		inputCantidad.id = `producto-${platillo.id}`;
		inputCantidad.classList.add('form-control');

		//Funcion para detectar la cantidad y el plato que se esta agregando
		//Meto la funcion agregarPlatillo dentro de otra funcion, para que espere al evento de onChange en vez de llamarla directamente, ya que si no, no me agrega los platos que voy marcando con sus cantidades
		inputCantidad.onchange = function () {
			const cantidad = parseInt(inputCantidad.value);
			agregarPlatillo({ ...platillo, cantidad });
		};

		const agregar = document.createElement('div');
		agregar.classList.add('col-md-2');
		agregar.appendChild(inputCantidad);

		row.appendChild(nombre);
		row.appendChild(precio);
		row.appendChild(categoria);
		row.appendChild(agregar);

		contenido.appendChild(row);
	});
}

function agregarPlatillo(producto) {
	//Extraemos el pedido actual
	let { pedido } = cliente;

	// Revisar que la cantidad sea mayor a 0
	if (producto.cantidad > 0) {
		//Con el array method .some() verifica si un elemento ya existe en un array, en caso de que asi sea me devolvera un true y podre saber que no debo agregarlo nuevamente sino modificar su cantidad
		if (pedido.some((articulo) => articulo.id === producto.id)) {
			//El articulo ya existe asique actualizamos la cantidad
			const pedidoActualizado = pedido.map((articulo) => {
				if (articulo.id === producto.id) {
					articulo.cantidad = producto.cantidad;
				}

				return articulo;
			});

			//Se asigna el nuevo array a cliente.pedido
			cliente.pedido = [...pedidoActualizado];
		} else {
			//El articulo NO existe, lo agregamos al array de pedido
			cliente.pedido = [...pedido, producto];
		}
	} else {
		//Eliminar elementos cuando la cantidad sea 0
		//En este caso quiero retornar los elementos que son diferentes al elemento que quiero eliminar
		const resultado = pedido.filter((articulo) => articulo.id !== producto.id);
		cliente.pedido = [...resultado];
	}

	//Limpiar el codigo html previo
	limpiarHtml();

	if (cliente.pedido.length) {
		//Mostrar resumen
		actualizarResumen();
	} else {
		mensajePedidoVacio();
	}
}

function actualizarResumen() {
	const contenido = document.querySelector('#resumen .contenido');

	//Creo el div que va a contener todo el resumen
	const resumen = document.createElement('div');
	resumen.classList.add('col-md-6', 'card', 'py-2', 'px-3', 'shadow');

	//El resumen va a contener la mesa y lo creo como un parrafo
	const mesa = document.createElement('p');
	mesa.textContent = 'Mesa: ';
	mesa.classList.add('fw-bold');

	//Con un spam voy a agregar el contenido de mesa que esta dentro del objeto cliente
	const mesaSpan = document.createElement('span');
	mesaSpan.textContent = cliente.mesa;
	mesaSpan.classList.add('fw-normal');

	//Hago lo mismo con la hora
	const hora = document.createElement('p');
	hora.textContent = 'Hora: ';
	hora.classList.add('fw-bold');

	const horaSpan = document.createElement('span');
	horaSpan.textContent = cliente.hora;
	horaSpan.classList.add('fw-normal');

	//Agregar a los elementos padre
	mesa.appendChild(mesaSpan);
	hora.appendChild(horaSpan);

	//Titulo de la seccion
	const heading = document.createElement('h3');
	heading.textContent = 'Platillos Consumidos';
	heading.classList.add('my-4', 'text-center');

	//Iterar sobre el array de pedidos
	const grupo = document.createElement('ul');
	grupo.classList.add('list-group');

	const { pedido } = cliente;
	pedido.forEach((articulo) => {
		const { nombre, cantidad, precio, id } = articulo;

		const lista = document.createElement('li');
		lista.classList.add('list-group-item');

		const nombreElemento = document.createElement('h4');
		nombreElemento.classList.add('my-4');
		nombreElemento.textContent = nombre;

		//Cantidad del articulo
		const cantidadElemento = document.createElement('p');
		cantidadElemento.classList.add('fw-bold');
		cantidadElemento.textContent = 'Cantidad: ';

		const cantidadElementoValor = document.createElement('span');
		cantidadElementoValor.classList.add('fw-normal');
		cantidadElementoValor.textContent = cantidad;

		//Precio del articulo
		const precioElemento = document.createElement('p');
		precioElemento.classList.add('fw-bold');
		precioElemento.textContent = 'Precio: ';

		const precioElementoValor = document.createElement('span');
		precioElementoValor.classList.add('fw-normal');
		precioElementoValor.textContent = `$${precio}`;

		//subtotal del articulo
		const subtotalElemento = document.createElement('p');
		subtotalElemento.classList.add('fw-bold');
		subtotalElemento.textContent = 'Subtotal: ';

		const subtotalElementoValor = document.createElement('span');
		subtotalElementoValor.classList.add('fw-normal');
		subtotalElementoValor.textContent = calcularSubtotal(precio, cantidad);

		//Boton para eliminar
		const btnEliminar = document.createElement('button');
		btnEliminar.classList.add('btn', 'btn-danger');
		btnEliminar.textContent = 'Eliminar del Pedido';

		//Funcion para eliminar del pedido
		btnEliminar.onclick = function () {
			eliminarProducto(id);
		};

		//Agregar valores a suss contenedores
		cantidadElemento.appendChild(cantidadElementoValor);
		precioElemento.appendChild(precioElementoValor);
		subtotalElemento.appendChild(subtotalElementoValor);

		//Agregar elementos al Li
		lista.appendChild(nombreElemento);
		lista.appendChild(cantidadElemento);
		lista.appendChild(precioElemento);
		lista.appendChild(subtotalElemento);
		lista.appendChild(btnEliminar);

		//Agregar lista al grupo principal
		grupo.appendChild(lista);
	});

	//Agrego el parrafo mesa al contenido para mostrarlo
	resumen.appendChild(heading);
	resumen.appendChild(mesa);
	resumen.appendChild(hora);
	resumen.appendChild(grupo);

	contenido.appendChild(resumen);

	//Mostrar formulario de propinas
	formularioPropinas();
}

function limpiarHtml() {
	const contenido = document.querySelector('#resumen .contenido');

	while (contenido.firstChild) {
		contenido.removeChild(contenido.firstChild);
	}
}

function calcularSubtotal(precio, cantidad) {
	return `$${precio * cantidad}`;
}

function eliminarProducto(id) {
	const { pedido } = cliente;

	const resultado = pedido.filter((articulo) => articulo.id !== id);
	cliente.pedido = [...resultado];

	//Limpiar el codigo html previo
	limpiarHtml();

	if (cliente.pedido.length) {
		//Mostrar resumen
		actualizarResumen();
	} else {
		mensajePedidoVacio();
	}

	//El producto se elimino y volvemos a 0 la cantidad en el formulario
	const productoEliminado = `#producto-${id}`;
	const inputEliminado = document.querySelector(productoEliminado);
	inputEliminado.value = 0;
}

function mensajePedidoVacio() {
	const contenido = document.querySelector('#resumen .contenido');

	const texto = document.createElement('p');
	texto.classList.add('text-center');
	texto.textContent = 'Añade los elementos del pedido';

	contenido.appendChild(texto);
}

function formularioPropinas() {
	const contenido = document.querySelector('#resumen .contenido');

	const formulario = document.createElement('div');
	formulario.classList.add('col-md-6', 'formulario');

	const divFormulario = document.createElement('div');
	divFormulario.classList.add('card', 'py-2', 'px-3', 'shadow');

	const heading = document.createElement('h3');
	heading.classList.add('my-4', 'text-center');
	heading.textContent = 'Propina';

	//Radio button 10% de propina
	const radio10 = document.createElement('input');
	radio10.type = 'radio';
	radio10.name = 'propina';
	radio10.value = '10';
	radio10.classList.add('form-check-input');
	radio10.onclick = calcularPropina;

	const radio10Label = document.createElement('label');
	radio10Label.textContent = '10%';
	radio10Label.classList.add('form-check-label');

	const radio10Div = document.createElement('div');
	radio10Div.classList.add('form-check');

	radio10Div.appendChild(radio10);
	radio10Div.appendChild(radio10Label);

	//Radio button 25% de propina
	const radio25 = document.createElement('input');
	radio25.type = 'radio';
	radio25.name = 'propina';
	radio25.value = '25';
	radio25.classList.add('form-check-input');
	radio25.onclick = calcularPropina;

	const radio25Label = document.createElement('label');
	radio25Label.textContent = '25%';
	radio25Label.classList.add('form-check-label');

	const radio25Div = document.createElement('div');
	radio25Div.classList.add('form-check');

	radio25Div.appendChild(radio25);
	radio25Div.appendChild(radio25Label);

	//Radio button 50% de propina
	const radio50 = document.createElement('input');
	radio50.type = 'radio';
	radio50.name = 'propina';
	radio50.value = '50';
	radio50.classList.add('form-check-input');
	radio50.onclick = calcularPropina;

	const radio50Label = document.createElement('label');
	radio50Label.textContent = '50%';
	radio50Label.classList.add('form-check-label');

	const radio50Div = document.createElement('div');
	radio50Div.classList.add('form-check');

	radio50Div.appendChild(radio50);
	radio50Div.appendChild(radio50Label);

	//Agregar al DIV principal
	divFormulario.appendChild(heading);
	divFormulario.appendChild(radio10Div);
	divFormulario.appendChild(radio25Div);
	divFormulario.appendChild(radio50Div);

	//Agregar el div principal al formulario
	formulario.appendChild(divFormulario);

	//Agrega al foormulario
	contenido.appendChild(formulario);
}

function calcularPropina() {
	const { pedido } = cliente;
	let subtotal = 0;

	//Calcular el subtotal a pagar
	pedido.forEach((articulo) => {
		subtotal += articulo.cantidad * articulo.precio;
	});

	//Seleccionar el radio button con la propina elegida por el cliente
	const propinaSeleccionada = document.querySelector(
		'[name="propina"]:checked'
	).value;

	//Calcular la propina
	const propina = (subtotal * parseInt(propinaSeleccionada)) / 100;

	//Calcular el total a pagar
	const total = subtotal + propina;

	mostrarTotalHTML(subtotal, total, propina);

	function mostrarTotalHTML(subtotal, total, propina) {
		//Div donde voy a colocar todos los totales
		const divTotales = document.createElement('div');
		divTotales.classList.add('total-pagar', 'my-5');

		//Subtotal
		const subtotalParrafo = document.createElement('p');
		subtotalParrafo.classList.add('fs-4', 'fw-bold', 'mt-2');
		subtotalParrafo.textContent = 'Subtotal Consumo: ';

		const subtotalSpan = document.createElement('span');
		subtotalSpan.classList.add('fw-normal');
		subtotalSpan.textContent = `$${subtotal}`;

		subtotalParrafo.appendChild(subtotalSpan);

		//Propina
		const propinaParrafo = document.createElement('p');
		propinaParrafo.classList.add('fs-4', 'fw-bold', 'mt-2');
		propinaParrafo.textContent = 'Propina: ';

		const propinaSpan = document.createElement('span');
		propinaSpan.classList.add('fw-normal');
		propinaSpan.textContent = `$${propina}`;

		propinaParrafo.appendChild(propinaSpan);

		//Total
		const totalParrafo = document.createElement('p');
		totalParrafo.classList.add('fs-4', 'fw-bold', 'mt-2');
		totalParrafo.textContent = 'Total a pagar: ';

		const totalSpan = document.createElement('span');
		totalSpan.classList.add('fw-normal');
		totalSpan.textContent = `$${total}`;

		totalParrafo.appendChild(totalSpan);

		//Eliminar el ultimo resultado
		const totalPagarDiv = document.querySelector('.total-pagar');
		if (totalPagarDiv) {
			totalPagarDiv.remove();
		}

		divTotales.appendChild(subtotalParrafo);
		divTotales.appendChild(propinaParrafo);
		divTotales.appendChild(totalParrafo);

		const formulario = document.querySelector('.formulario > div');
		formulario.appendChild(divTotales);
	}
}
