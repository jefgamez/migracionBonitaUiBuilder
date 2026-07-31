export default {

	/**
	 * Combina el resultado de las dos queries ya resueltas (arrays, no
	 * queries en curso) y deduplica por id. Recibe los .data como argumentos
	 * en vez de leerlos de las queries directamente — así esta función es
	 * pura y se puede llamar justo después de que ambas .run() resuelven,
	 * sin depender de cuándo Appsmith reevalúa bindings reactivos.
	 */
	combinar(asignadas, pool) {
		const a = Array.isArray(asignadas) ? asignadas : [];
		const p = Array.isArray(pool) ? pool : [];
		const mapa = new Map();
		[...p, ...a].forEach((t) => mapa.set(t.id, t));
		return Array.from(mapa.values());
	},

	esMia(tarea) {
		const userId = GetSesion.data ? String(GetSesion.data.user_id) : null;
		return !!userId && String(tarea.assigned_id) === userId;
	},

	/** Tag visual por tipo de tarea, mismo criterio que tipoTag() en HomePage. */
	tipoTag(nombre) {
		if (!nombre) return "TAREA";
		const n = nombre.toLowerCase();
		if (n.includes("vip") || n.includes("excepci")) return "REVISIÓN VIP";
		if (n.includes("gesti") && n.includes("manual")) return "GESTIÓN MANUAL";
		if (n.includes("solicitud") && n.includes("producto")) return "SOLICITUD DE PRODUCTO";
		if (n.includes("solicitud") && n.includes("informaci")) return "SOLICITUD DE INFORMACIÓN";
		return "TAREA";
	},

	async tomar(taskId) {
		await AsignarTarea.run({ taskId });
		await this.recargarBandeja();
	},

	async liberar(taskId) {
		await LiberarTarea.run({ taskId });
		await this.recargarBandeja();
	},

	/**
	 * Corre GetSesion PRIMERO y espera a que resuelva antes de disparar
	 * GetTareasAsignadas/GetTareasPool — GetTareasAsignadas usa el binding
	 * {{GetSesion.data.user_id}} en su path, y si se ejecuta en paralelo sin
	 * esperar a GetSesion (como hacía antes con Promise.all de las 3), ese
	 * binding se resuelve vacío y Bonita recibe literalmente
	 * "assigned_id=null", lo que hace fallar la búsqueda en el motor con
	 * NumberFormatException (intenta parsear "null" como Long). Luego
	 * combina el resultado YA resuelto y lo guarda en
	 * appsmith.store.tareasUnicas — única fuente de verdad que leen tanto
	 * el sidebar (badge de contador) como el widget de la bandeja (lista +
	 * KPIs), sin duplicar la lógica de merge en dos bindings distintos.
	 */
	async recargarBandeja() {
		await GetSesion.run();
		await Promise.all([GetTareasAsignadas.run(), GetTareasPool.run()]);
		// Se lee .data DESPUÉS del await (no el valor de retorno de .run()) —
		// mismo patrón que pageLoad.js de referencia (getRoleUserName.run()
		// seguido de getRoleUserName.data en la siguiente línea).
		const combinado = this.combinar(GetTareasAsignadas.data, GetTareasPool.data);
		await storeValue("tareasUnicas", combinado, true);
		return combinado;
	}

}
