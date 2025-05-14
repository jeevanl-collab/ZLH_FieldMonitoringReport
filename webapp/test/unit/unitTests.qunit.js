/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comsaplhcs/zlh_field_monitoring/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
