/*global QUnit*/

sap.ui.define([
	"comsaplhcs/zlh_field_monitoring/controller/Selection.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Selection Controller");

	QUnit.test("I should test the Selection controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
