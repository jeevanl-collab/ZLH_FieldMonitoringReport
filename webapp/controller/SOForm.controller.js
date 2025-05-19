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
        var oCTPTModelData = new JSONModel({
          CTPT: [],
          SoForm: []
        });
        oController.getView().setModel(oCTPTModelData, "CTPTModel");
        // oOEBoDataModel.attachBatchRequestSent(function () {
        //   oController.getView().byId("idIconTabBarMeterDetails").setBusy(true);
        // });
        // oOEBoDataModel.attachBatchRequestCompleted(function () {
        //   oController.getView().byId("idIconTabBarMeterDetails").setBusy(false);
        // });
        // oOEBoDataModel.attachBatchRequestFailed(function (oError) {
        //   oController.getView().byId("idIconTabBarMeterDetails").setBusy(false);
        //   // MessageBox
        //   var oTableCTPT = oController.getView().byId("idTableCTPT");
        //   var oTableMeterDetails = oController.getView().byId("meterDetailsTable");
        //   oTableCTPT.setNoDataText("No CT/PT data found");
        //   oTableMeterDetails.setNoDataText("No Meter Details data found");
        // });
      },
      _onRouteMatch: function (oEvent) {
        var sOrderNum = oEvent.getParameter("arguments").OrderID;
        var oModel = oController.getView().getModel("CTPTModel");
        if (sOrderNum) {
          // oController.getView().byId("idTableCTPT").bindRows({
          //   path: "/Ctpt_Dataset",
          //   filters: new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.EQ, sOrderNum) //"6051817"
          // });
          debugger;
          var aFilter = [];
          aFilter.push(new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.EQ, sOrderNum));
          oOEBoDataModel.read("/Ctpt_Dataset", {
            filters: aFilter,
            success: function (oData) {
              debugger;
              oModel.setProperty("/CTPT", oData.results);
            }, error: function (oError) {
              var oMessage;
              debugger;
              oModel.setProperty("/bPageBusy", false);
              if (oError.responseText.startsWith("<")) {
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
                oMessage = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
              } else {
                var oResponseText = oError.responseText;
                var sParsedResponse = JSON.parse(oResponseText);
                oMessage = sParsedResponse.error.message.value;
              }
              MessageBox.error(oMessage);
            }
          })

          // oController.getView().byId("meterDetailsTable").bindRows({
          //   path: "/Meter_DataSet",
          //   filters: new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.EQ, sOrderNum)
          // });
          // var aFilter = [];
          // aFilter.push(new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.EQ, sOrderNum));
          oOEBoDataModel.read("/Meter_DataSet", {
            filters: aFilter,
            success: function (oData) {
              oModel.setProperty("/SoForm", oData.results);
              debugger;
            }, error: function (oError) {
              var oMessage;
              debugger;
              oModel.setProperty("/bPageBusy", false);
              if (oError.responseText.startsWith("<")) {
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
                oMessage = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
              } else {
                var oResponseText = oError.responseText;
                var sParsedResponse = JSON.parse(oResponseText);
                oMessage = sParsedResponse.error.message.value;
              }
              MessageBox.error(oMessage);
            }
          })
        }
      },
      onSubmitFieldMonList: function (oEvent) {
        debugger;
      }
    });
  }
);
