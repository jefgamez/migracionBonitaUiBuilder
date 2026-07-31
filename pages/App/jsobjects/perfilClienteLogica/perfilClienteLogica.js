export default {

	/**
	 * Contrato EXACTO que espera la instanciación del proceso "Perfil del
	 * Cliente" (MB-FOR-23-013). Calcado de buildPerfilClienteContract.ts:
	 * envuelto en perfilClienteInput, fechas serializadas como 'yyyy-MM-dd' o
	 * null (nunca string vacío aquí — a diferencia de Solicitud de Producto,
	 * que sí necesita string vacío), y las secciones opcionales SIEMPRE se
	 * envían (aunque vacías) para que Bonita no rechace el contrato por
	 * sub-propiedades faltantes.
	 */
	buildContract(f) {
		const toIsoDateOrNull = (v) => (v && v.trim() !== "" ? v : null);
		return {
			perfilClienteInput: {
				categoriaCliente: f.categoriaCliente,
				informacionPersonal: {
					...f.informacionPersonal,
					fechaNacimiento: toIsoDateOrNull(f.informacionPersonal.fechaNacimiento),
					fechaVencimientoCedula: toIsoDateOrNull(f.informacionPersonal.fechaVencimientoCedula),
				},
				datosResidencia: f.datosResidencia,
				perfilFinanciero: {
					...f.perfilFinanciero,
					fechaIngresoEmpresa: toIsoDateOrNull(f.perfilFinanciero.fechaIngresoEmpresa),
				},
				referenciasBancarias: f.referenciasBancarias,
				referenciasPersonales: f.referenciasPersonales,
				autocertificacionFiscal: {
					residenciasFiscales: f.residenciasFiscales,
				},
				perfilFATCA: f.perfilFATCA,
				datoPEP: f.datoPEP,
			},
		};
	},

	/** Resuelve el processId de CreacionCuentaAhorros desde los procesos ya
	 * cargados por GetProcesos, en vez de hardcodearlo. */
	resolverProcessId() {
		const procesos = Array.isArray(GetProcesos.data) ? GetProcesos.data : [];
		const proc = procesos.find((p) => p.name === "CreacionCuentaAhorros");
		return proc ? proc.id : null;
	},

	/** Envía el formulario: instancia el proceso con el contrato real y
	 * guarda el resultado (o el error) en appsmith.store para que el widget
	 * de la página lo detecte vía onModelChange. */
	async enviar(formJson) {
		try {
			const form = typeof formJson === "string" ? JSON.parse(formJson) : formJson;
			const processId = this.resolverProcessId();
			if (!processId) throw new Error("No se encontró el proceso CreacionCuentaAhorros habilitado.");
			const contrato = this.buildContract(form);
			const result = await StartProcessPerfilCliente.run({
				processId,
				contrato: JSON.stringify(contrato),
			});
			await storeValue("envioResultado", { caseId: result && result.caseId ? result.caseId : (result && result.id) }, true);
		} catch (e) {
			await storeValue("envioError", "Error al enviar: " + (e && e.message ? e.message : String(e)), true);
		}
	}

}
