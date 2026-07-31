export default {

	/**
	 * Une las tareas asignadas + las del pool y deduplica por id.
	 * Replica bonitaApiService.getPendingTasks() del dashboard Svelte/React:
	 * Bonita distingue tareas asignadas directamente (assigned_id = userId) de
	 * tareas sin asignar en el pool del actor (assigned_id vacío); ambas listas
	 * se piden por separado y se combinan aquí porque un filtro único
	 * f=assigned_id=X no trae las del pool.
	 */
	tareasUnicas() {
		const asignadas = GetTareasAsignadas.data || [];
		const pool = GetTareasPool.data || [];
		const mapa = new Map();
		[...pool, ...asignadas].forEach((t) => mapa.set(t.id, t));
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

	kpiTotal() {
		return this.tareasUnicas().length;
	},

	kpiPrioridadAlta() {
		return this.tareasUnicas().filter(
			(t) => t.priority === "high" || t.priority === "highest"
		).length;
	},

	async tomar(taskId) {
		await AsignarTarea.run({ taskId });
		await this.recargarBandeja();
	},

	async liberar(taskId) {
		await LiberarTarea.run({ taskId });
		await this.recargarBandeja();
	},

	async recargarBandeja() {
		await Promise.all([GetTareasAsignadas.run(), GetTareasPool.run()]);
	}

}
