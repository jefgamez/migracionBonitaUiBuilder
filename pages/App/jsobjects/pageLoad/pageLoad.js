/**
 * Bootstrap de la página única "App" — mismo patrón que pageLoad.js en
 * backoffice-canales-personas (APAP): fija el tab inicial en el store para
 * que el TABS_WIDGET "mainScreen" (defaultTab = {{appsmith.store.selTab}})
 * arranque en la sección correcta, sin depender de navigateTo().
 */
export default {
	initTabDefaul() {
		storeValue("selTab", "BandejaTareas", true);
	}
}
