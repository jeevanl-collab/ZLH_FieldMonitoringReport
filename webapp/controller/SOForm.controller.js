sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token"
  ],
  function (Controller, MessageToast, MessageBox, Filter, FilterOperator, JSONModel, Token) {
    "use strict";
    var oRouter, oController, oSelectionScreenModel, oOEBoDataModel, oResourceBundle, UIComponent;
    return Controller.extend("com.sap.lh.cs.zlhfieldmonitoring.controller.SOForm", {
      onInit: function () {
        oController = this;
        UIComponent = oController.getOwnerComponent();
        oOEBoDataModel = oController.getOwnerComponent().getModel();
        oRouter = UIComponent.getRouter();
        oResourceBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle();
        oRouter.getRoute("SOForm").attachPatternMatched(oController._onRouteMatch, oController);
        oOEBoDataModel.attachBatchRequestSent(function () {
          oController.getView().byId("idIconTabBarMeterDetails").setBusy(true);
        });
        oOEBoDataModel.attachBatchRequestCompleted(function () {
          oController.getView().byId("idIconTabBarMeterDetails").setBusy(false);
        });
        oOEBoDataModel.attachBatchRequestFailed(function (oError) {
          oController.getView().byId("idIconTabBarMeterDetails").setBusy(false);
          // MessageBox
          var oTableCTPT = oController.getView().byId("idTableCTPT");
          var oTableMeterDetails = oController.getView().byId("meterDetailsTable");
          oTableCTPT.setNoDataText("No CT/PT data found");
          oTableMeterDetails.setNoDataText("No Meter Details data found");
        });
      },
      _onRouteMatch: function (oEvent) {
        var sOrderNum = oEvent.getParameter("arguments").OrderID;
        if (sOrderNum) {
          oController.getView().byId("idTableCTPT").bindRows({
            path: "/Ctpt_Dataset",
            filters: new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.EQ, sOrderNum) //"6051817"
          });

          oController.getView().byId("meterDetailsTable").bindRows({
            path: "/Meter_DataSet",
            filters: new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.EQ, sOrderNum)
          });
        }
      },
      onSubmitFieldMonList: function (oEvent) {
        debugger;
      }
    });
  }
);
