sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token",
    'sap/ui/core/Fragment',
    'sap/ui/model/Sorter'
  ],
  function (Controller, MessageToast, MessageBox, Filter, FilterOperator, JSONModel, Token, Fragment, Sorter) {
    "use strict";
    var oRouter, oController, oSelectionScreenModel, oOEBoDataModel, oResourceBundle, UIComponent;
    return Controller.extend("com.sap.lh.cs.zlhfieldmonitoring.controller.FieldMonList", {
      onInit: function () {
        oController = this;
        UIComponent = oController.getOwnerComponent();
        oOEBoDataModel = oController.getOwnerComponent().getModel();
        oRouter = UIComponent.getRouter();
        oResourceBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle();
        oRouter.getRoute("FieldMonList").attachPatternMatched(oController._onRouteMatch, oController);
        oController._mViewSettingsDialogs = {};
      },
      _onRouteMatch: function () {
        var oGlobalModel = oController.getOwnerComponent().getModel("GlobalFieldMonModel");
        var oList = oGlobalModel ? oGlobalModel.getProperty("/FiledMonList") : [];
        var oModel = new JSONModel({
          OEBReportList: [],
          bPageBusy: false,
          bDialogBusy: false,
          sSourceSOFORM: "",
          BPEMList: [],
          oUpdateCustomerConfirm: {
            sSiteReadiness: 'Y',
          },
          oMeterLoc: {
            sSelectedLoc: "S",
            sDesc: ""
          },
          SiteReadiness: {
            sSiteReadinessDate: new Date(),
            SiteRedinessDateError: 'None'
          },
          oSelectedOEB: {},
          Filterparameters: {
            Status: [],
            ORDER_NO: []
          }
        });
        oController.getView().setModel(oModel, "FieldMonitorModel");
        oController.getView().getModel("FieldMonitorModel").setProperty("/aFieldMonList", oList);
      },
      onPressSoResults: function () {
        var oTable = oController.getView().byId("idFieldMonTable");
        var aSelectedIndices = oTable.getSelectedIndices();
        var aSelectedRows = aSelectedIndices.map(iIndex => oTable.getContextByIndex(iIndex).getObject());
        if (aSelectedRows.length) {
          oRouter.navTo("SOForm", {
            OrderID: aSelectedRows[0].ORDER_NO
          });
        } else {
          MessageToast.show(oResourceBundle.getText("selectLineItemMessage"));
        }
      },
      // onPressSoForms: function () {
      //   var oTable = oController.getView().byId("idFieldMonTable");
      //   var aSelectedIndices = oTable.getSelectedIndices();
      //   var aSelectedRows = aSelectedIndices.map(iIndex => oTable.getContextByIndex(iIndex).getObject());
      //   var OrderNumber = aSelectedRows[0].ORDER_NO;//'1000021';
      //   if (!this.oSoFormDialog) {
      //     this.oSoFormDialog = new sap.m.Dialog({
      //       title: oResourceBundle.getText("soFormTitle"),
      //       content: new sap.m.PDFViewer({
      //         source: `/sap/opu/odata/SAP/ZWM_FIELD_COMP_WORK_SRV/SOFormSet('${OrderNumber}')/$value`
      //       }),
      //       buttons: [
      //         new sap.m.Button({
      //           text: oResourceBundle.getText("closeButton"),
      //           type: "Reject",
      //           press: function () {
      //             this.oSoFormDialog.close();
      //           }.bind(this)
      //         })
      //       ]
      //     });
      //     this.getView().addDependent(this.oSoFormDialog);
      //   }
      //   this.oSoFormDialog.open();
      // },
      onSubmitFieldMonList: function () {
        var oView = oController.getView();
        var oModel = oView.getModel("FieldMonitorModel");
        var oList = oModel.getProperty("/aFieldMonList");
        oModel.setProperty("/bPageBusy", true);
        var oValidatedList = oList.filter(oValue => oValue.REVIEW === true && oValue.REVIEW_EDITABLE === true);
        if (oValidatedList.length) {
          var oPayload = {
            "FLAG": "X",
            "Dummy_review_Entity01": oValidatedList.map(function (oValue) {
              return {
                "OrderId": oValue.ORDER_NO,
                "OrderType": oValue.OT,
                "Description": ""//oValue.DESCRIPTION
              };
            })
          };
          oOEBoDataModel.create("/Dummy_review_EntitySet", oPayload, {
            success: function (data) {
              oModel.setProperty("/bPageBusy", false);
              MessageBox.success(oResourceBundle.getText("ordersReviewedMessage"));
              oList.forEach(function (oListItem) {
                if (oValidatedList.some(function (oValidatedItem) {
                  return oValidatedItem.ORDER_NO === oListItem.ORDER_NO;
                })) {
                  oListItem.REVIEW_EDITABLE = false;
                }
              });
              oModel.setProperty("/aFieldMonList", oList);
              oController._fnRefreshFieldMonList();
            },
            error: function (oError) {
              var oMessage;
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
          });
        } else {
          MessageToast.show(oResourceBundle.getText("checkReviewMessage"));
        }
      },
      _fnRefreshFieldMonList: function () {
        var oModel = UIComponent.getModel("GlobalFieldMonModel");
        var aFilter = oModel.getProperty("/SelParameters");
        if (aFilter.length) {
          oController._fnRefreshFieldMon(aFilter);
        }
      },
      _fnRefreshFieldMon: function (aFilter) {
        var oView = oController.getView();
        var oModel = oView.getModel("FieldMonitorModel");
        var sPath = "/Monitoring_FiledWorkSet";
        oModel.setProperty("/bPageBusy", true);
        var oFieldMonDataModel = oController.getOwnerComponent().getModel();
        oFieldMonDataModel.read(sPath, {
          filters: aFilter,
          success: function (oData) {
            var oResults = oData.results;
            if (oResults.length) {
              UIComponent.getModel("GlobalFieldMonModel").setProperty("/FiledMonList", oResults);
            } else {
              MessageBox.error("No results found for selection criteria");
            }
            oModel.setProperty("/bPageBusy", false);
          },
          error: function (oError) {
            var oMessage;
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
        });
      },
      getSelectedOrderNumber() {
        var oTable = oController.getView().byId("idFieldMonTable");
        var aSelectedIndices = oTable.getSelectedIndices();
        var aSelectedRows = aSelectedIndices.map(iIndex => oTable.getContextByIndex(iIndex).getObject());
        var OrderNumber = aSelectedRows[0]?.ORDER_NO;
        return OrderNumber;
      },
      onPressSoForms: function (oEvent, letterId) {
        var sOrderNumber = oController.getSelectedOrderNumber();
        if (!!sOrderNumber) {
          var oSource = "/sap/opu/odata/SAP/ZWM_FIELD_COMP_WORK_SRV/SOFormSet('" + sOrderNumber + "')/$value";
          this.getView().getModel("FieldMonitorModel").setProperty("/sSourceSOFORM", oSource);
          if (!this.oSoFormDialog) {
            this.oSoFormDialog = sap.ui.xmlfragment("com.sap.lh.cs.zlhfieldmonitoring.fragment.SOForm.SOFormPDF", this);
            this.getView().addDependent(this.oSoFormDialog);
          }
          this.oSoFormDialog.open();
        } else {
          MessageToast.show(oResourceBundle.getText("selectLineItemMessage"));
        }
      },
      onCloseDialogPDF: function () {
        this.oSoFormDialog.close();
      },
      handleSortButtonPressed: function () {
        this.getViewSettingsDialog("com.sap.lh.cs.zlhfieldmonitoring.fragment.Filters.SortDialog")
          .then(function (oViewSettingsDialog) {
            oViewSettingsDialog.open();
          });
      },

      handleFilterButtonPressed: function () {
        oController._FilterValuecollect();
        this.getViewSettingsDialog("com.sap.lh.cs.zlhfieldmonitoring.fragment.Filters.FilterDialog")
          .then(function (oViewSettingsDialog) {
            // oViewSettingsDialog.setModel();
            // oViewSettingsDialog.setModel("FieldMonitorModel", new JSONModel();)
            oViewSettingsDialog.open();
          });

      },
      // _FilterValuecollect: function () {
      // debugger;
      // var oTable = oController.getView().byId("idFieldMonTable");
      // oBinding = oTable.getBinding("rows");
      _FilterValuecollect: function () {
        var oTable = oController.getView().byId("idFieldMonTable");
        var oBinding = oTable.getBinding("rows");
        var aStatusValues = oBinding.getCurrentContexts().map(function (oContext) {
          return oContext.getProperty("Status");
        });
        // var aStatusValues = oBinding.getCurrentContexts().map(function (oContext) {
        return aStatusValues;
        // var oFitlerItems = {

        // }
        // oController.getView().getModel("FieldMonitorModel").setProperty("/Filterparameters/Status", aStatusValues)
        // >/Filterparameters/Status
        // aStatusValues
        // console.log(aStatusValues);
      },
      // debugger;
      // },
      getViewSettingsDialog: function (sDialogFragmentName) {
        var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

        if (!pDialog) {
          pDialog = Fragment.load({
            id: this.getView().getId(),
            name: sDialogFragmentName,
            controller: this
          }).then(function (oDialog) {
            // if (Device.system.desktop) {
            //   oDialog.addStyleClass("sapUiSizeCompact");
            // }
            return oDialog;
          });
          oController._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
        }
        return pDialog;
      },
      handleSortDialogConfirm: function (oEvent) {
        var oTable = oController.getView().byId("idFieldMonTable"),
          mParams = oEvent.getParameters(),
          oBinding = oTable.getBinding("rows"),
          sPath,
          bDescending,
          aSorters = [];

        sPath = mParams.sortItem.getKey();
        bDescending = mParams.sortDescending;
        aSorters.push(new Sorter(sPath, bDescending));
        oBinding.sort(aSorters);
      },

      async onPressBPEM() {
        var sOrderNumber = oController.getSelectedOrderNumber();
        if (!!sOrderNumber) {
          oController.oDialog ??= await this.loadFragment({
            name: "com.sap.lh.cs.zlhfieldmonitoring.fragment.BPEM.BPEMList"
          });
          oController.oDialog.open();
          var sSelctedOrderId = sOrderNumber; //'000004000272'; // 
          var aFitler = [new Filter("OrderId", FilterOperator.EQ, sSelctedOrderId)];
          oOEBoDataModel.read("/BPEM_CASESet", {
            filters: aFitler,
            success: function (oData, oRes) {
              oController.getView().getModel("FieldMonitorModel").setProperty("/BPEMList", oData.results)
            }, error: function (oError) {
              debugger;
            }
          })
        }
      },
      onPressCaseId: function (oEvent) {
        var oSource = oEvent.getSource();
        debugger;
        var navigationService = sap.ushell.Container.getService("Navigation");
        var target = {
          target: { semanticObject: "UtilitiesClarificationCase", action: "displayClarificationCase" },
          params: {
            BPEMCase: oSource.getText()
          }
        };
        navigationService.navigate(target, oController.getOwnerComponent());
      },
      _closeDialog: function () {
        oController.oDialog.close();
      }

    });
  }
);
