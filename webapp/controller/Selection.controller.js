sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token"
], function (Controller, MessageToast, MessageBox, Filter, FilterOperator, JSONModel, Token) {
    "use strict";
    var oRouter, oController, oSelectionScreenModel, oFieldMonDataModel, oResourceBundle, UIComponent;
    return Controller.extend("com.sap.lh.cs.zlhfieldmonitoring.controller.Selection", {
        onInit: function () {
            oController = this;
            UIComponent = oController.getOwnerComponent();
            oFieldMonDataModel = oController.getOwnerComponent().getModel();
            oRouter = UIComponent.getRouter();
            oResourceBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle();

            var oSelectionModel = new JSONModel({
                bPageBusy: false,
                minDate: new Date(),
                OrderStatusSelected: [],
                bIsSelScreenInvalidate: false,
                oServiceOrderDates: {
                    CompletedOn: {
                        From: oController._fnCurrentMonthStartDate(true),
                        To: oController._fnCurrentMonthStartDate(false)
                    },
                    CreatedOn: {
                        From: "", //oController._fnCurrentMonthStartDate(true)
                        To: "" //oController._fnCurrentMonthStartDate(false)
                    },
                    BasicStart: {
                        From: "",//oController._fnCurrentMonthStartDate(true)
                        To: "" // oController._fnCurrentMonthStartDate(false)
                    }
                },
                oSelected: {
                    sCompletedOnFrom: "",
                    sCompletedOnTo: "",
                    sMainActivity: "",
                    sCreatedOnFrom: "",
                    sCreatedOnTo: "",
                    sBasicStartFrom: "",
                    sBasicStartTo: "",
                    PlanningPlant: [],
                    PlannerGroup: [],
                    WorkCenter: [],
                    MainActType: [],
                    FuncLoc: [],
                    ServOrder: [],
                    OrderType: [],
                    oFilter: {
                        bMobileWorkForce: false,
                        bOnlyOpConfield: false,
                        bShowOnlyMeterTank: false,
                        sLayout: ""
                    },
                    OPerationStatus: []
                },
                OrderStatus: [
                    { Key: 'OUTS', description: 'Outstanding' },
                    { Key: 'INPR', description: 'In Process' },
                    { Key: 'COMP', description: 'Completed' },
                    { Key: 'Hist', description: 'Historical' },
                    { Key: 'OEBE', description: 'OEB Exception' }
                ],
                OperationStatus: [
                    { Key: "HOLD", description: "Hold" },
                    { Key: "SRDE", description: "Site Readiness Date entered" },
                    { Key: "RCC", description: "Ready for Customer Confirm" },
                    { Key: "TRFD", description: "Trenching Ready for Dispatch" },
                    { Key: "ASSN", description: "Assigned" },
                    { Key: "DISP", description: "Dispatched" },
                    { Key: "SINR", description: "Site Not Ready" },
                    { Key: "RSRD", description: "Request Site Readiness Date" },
                    { Key: "CNDI", description: "Cancel Dispatch" },
                    { Key: "TCOM", description: "Trenching Complete" },
                    { Key: "IRFD", description: "Install Ready for Dispatch" },
                    { Key: "MCOM", description: "Meter Install Complete" },
                    { Key: "RVWP", description: "Review Pending" },
                    { Key: "RVWC", description: "Review Complete" }
                ]
            });
            oController.getView().setModel(oSelectionModel, "FieldMonSelModel");
            oController.getOwnerComponent().setModel(new JSONModel({}), "GlobalFieldMonModel");
        },
        // _fnCurrentMonthStartDate : function(){
        _fnCurrentMonthStartDate: function (bIsfromDate) {
            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance();
            if (bIsfromDate) {
                var currentDate = new Date();
                var currentMonth = currentDate.getMonth();
                var currentYear = currentDate.getFullYear();
                var oDate = new Date(currentYear, currentMonth, 1);
            } else {
                var oDate = new Date();
            }
            return dateFormat.format(oDate);
        },
        // },
        onValueHelp: function (oEvent) {
            var sInputId = oEvent.getParameter("id");
            var oInput = sap.ui.getCore().byId(sInputId);
            var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                title: "Value Help",
                supportMultiselect: true,
                supportRanges: false,
                supportRangesOnly: false,
                key: "Key",
                descriptionKey: "description",
                ok: function (oEvent) {
                    var aTokens = oEvent.getParameter("tokens");
                    oInput.setTokens(aTokens);
                    oValueHelpDialog.close();
                },
                cancel: function () {
                    oValueHelpDialog.close();
                }
            });
            var oColModel = new sap.ui.model.json.JSONModel();
            oColModel.setData({
                cols: [
                    { label: "Key", template: "Key" },
                    { label: "Description", template: "description" }
                ]
            });
            oValueHelpDialog.getTable().setModel(oColModel, "columns");
            var oRowsModel = new sap.ui.model.json.JSONModel();
            oRowsModel.setData({ rows: [] });
            oValueHelpDialog.getTable().setModel(oRowsModel);
            oValueHelpDialog.getTable().bindRows("/rows");
            oValueHelpDialog.setRangeKeyFields([]);
            oValueHelpDialog.setTokens(oInput.getTokens());
            oValueHelpDialog.open();
        },

        onPressNext: function () {
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var sPath = "/Monitoring_FiledWorkSet";
            oModel.setProperty("/bPageBusy", true);
            var aFilter = oController._fnReturnFilterparameter();
            oFieldMonDataModel.read(sPath, {
                filters: aFilter,
                success: function (oData) {
                    var oResults = oData.results;
                    if (oResults.length) {
                        UIComponent.getModel("GlobalFieldMonModel").setProperty("/FiledMonList", oResults);
                        UIComponent.getModel("GlobalFieldMonModel").setProperty("/SelParameters", aFilter);
                        oRouter.navTo("FieldMonList");
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
        onSubmitOrderNumber: function (oEvent) {
            var oMultiInput = oEvent.getSource();
            var oModel = oController.getView().getModel("FieldMonSelModel");
            oModel.setProperty("/bPageBusy", true);
            var sPath = "/Monitoring_FiledWorkSet('" + oMultiInput.getValue() + "')";
            oFieldMonDataModel.read(sPath, {
                success: function (oData) {
                    var oToken = new sap.m.Token({
                        key: oData.ORDER_NO,
                        text: oData.ORDER_NO
                    });
                    oMultiInput.addToken(oToken);
                    oMultiInput.setValue("");
                    oModel.setProperty("/bPageBusy", false);
                },
                error: function (oError) {
                    var oMessage;
                    var oModel = oController.getView().getModel("FieldMonSelModel");
                    oMultiInput.setValue("");
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
        onSelectFuncLoc: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedRow");
            var oMultiInput = oController.getView().byId("idFuncLoc");
            oController.onSuggestionItemSelected(oSelectedItem, oMultiInput);
        },
        onPressPlannerGroup: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedRow");
            var oMultiInput = oController.getView().byId("idPlannerGroup");
            oController.onSuggestionItemSelected(oSelectedItem, oMultiInput);
        },
        onWorkCenterSuggestionItemPress: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedRow");
            var oMultiInput = oController.getView().byId("idWorkCenter");
            oController.onSuggestionItemSelected(oSelectedItem, oMultiInput);
        },
        onOrderSuggestionItemPress: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedRow");
            var oMultiInput = oController.getView().byId("idServiceOrder");
            oController.onSuggestionItemSelected(oSelectedItem, oMultiInput);
        },
        onOrderTypeSuggestionItemPress: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedRow");
            var oMultiInput = oController.getView().byId("idOrderType");
            oController.onSuggestionItemSelected(oSelectedItem, oMultiInput);
        },
        onSuggestionItemSelected: function (oSelectedItem, oMultiInput) {
            var oSelectedCells = oSelectedItem.getCells();
            var oToken = new Token({
                key: oSelectedCells[1].getText(),
                text: oSelectedCells[0].getText()
            });
            oMultiInput.addToken(oToken);
            oMultiInput.setValue("");
        },
        _getTokens: function (oSource) {
            var aList = [];
            var aTokens = oSource.getTokens();
            aList = aTokens.map(object => object.getText());
            return aList;
        },
        _fnFormateDate: function (sUnFormatedDate) {
            var parts = sUnFormatedDate.split(".");
            var day = parseInt(parts[0], 10);
            var month = parseInt(parts[1], 10) - 1;
            var year = parseInt(parts[2], 10);
            var date = new Date(year, month, day);
            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "YYYY-MM-dd" });
            return dateFormat.format(date) + "T00:00:00";
        },
        OnChangeCompletedOnDate: function () {
            var oFromDate = oController.getView().byId("idcompletedOnDatePicker");
            var oToDate = oController.getView().byId("idcompletedOnDatePickerTo");
            oController._DateRangeValidation(oFromDate, oToDate);
        },
        onchangeCreatedOn: function () {
            var oFromDate = oController.getView().byId("idcreatedOnDatePicker");
            var oToDate = oController.getView().byId("idcreatedOnDatePickerTo");
            oController._DateRangeValidation(oFromDate, oToDate);
        },
        onChangeBasicStartDate: function () {
            var oFromDate = oController.getView().byId("idbasicStartDatePicker");
            var oToDate = oController.getView().byId("idbasicStartDatePickerTO");
            oController._DateRangeValidation(oFromDate, oToDate);
        },
        _DateRangeValidation: function (oFromDateInput, oToDateInput) {
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var FromDate = oFromDateInput.getValue();
            var ToDate = oToDateInput.getValue();
            if (FromDate && ToDate) {
                var fromDate = new Date(FromDate);
                var toDate = new Date(ToDate);
                if (toDate < fromDate) {
                    oFromDateInput.setValueStateText("Invalid Date Range");
                    oFromDateInput.setValueState(sap.ui.core.ValueState.Error);
                    oToDateInput.setValueStateText("Invalid Date Range");
                    oToDateInput.setValueState(sap.ui.core.ValueState.Error);
                    oModel.setProperty("/bIsSelScreenInvalidate", true);
                } else {
                    oFromDateInput.setValueStateText("");
                    oFromDateInput.setValueState(sap.ui.core.ValueState.None);
                    oToDateInput.setValueStateText("");
                    oToDateInput.setValueState(sap.ui.core.ValueState.None);
                    oModel.setProperty("/bIsSelScreenInvalidate", false);
                }
            }
        },
        _fnReturnFilterparameter: function () {
            var oView = oController.getView();
            var oModel = oView.getModel("FieldMonSelModel");
            var aOrderStatus = oModel.getProperty("/OrderStatusSelected");

            // oView = oController.getView()

            // oView.byId("idcompletedOnDatePickerTo")
            // oView.byId("idcreatedOnDatePicker")
            // oView.byId("idcreatedOnDatePickerTo")
            // oView.byId("idbasicStartDatePicker")
            // oView.byId("idbasicStartDatePickerTo")

            var sCompletedOn = {
                From: oView.byId("idcompletedOnDatePicker").getValue() ? oView.byId("idcompletedOnDatePicker").getValue() + "T00:00:00" : undefined,
                To: oView.byId("idcompletedOnDatePickerTo").getValue() ? oView.byId("idcompletedOnDatePickerTo").getValue() + "T00:00:00" : undefined
            };
            var aMainActivity = oView.byId("idmainActivity").getSelectedKeys();
            var sCreatedOn = {
                From: oView.byId("idcreatedOnDatePicker").getValue() ? oView.byId("idcreatedOnDatePicker").getValue() + "T00:00:00" : undefined,
                To: oView.byId("idcreatedOnDatePickerTo").getValue() ? oView.byId("idcreatedOnDatePickerTo").getValue() + "T00:00:00" : undefined
            };
            var sBasicStart = {
                From: oView.byId("idbasicStartDatePicker").getValue() ? oView.byId("idbasicStartDatePicker").getValue() + "T00:00:00" : undefined,
                To: oView.byId("idbasicStartDatePickerTo").getValue() ? oView.byId("idbasicStartDatePickerTo").getValue() + "T00:00:00" : undefined
            };
            var aPlannerGroup = oController._getTokens(oView.byId("idPlannerGroup"));
            var aWorkCenter = oController._getTokens(oView.byId("idWorkCenter"));
            var aFuncLoc = oController._getTokens(oView.byId("idFuncLoc"));
            var aSerOrder = oController._getTokens(oView.byId("idServiceOrder"));
            var aOrderType = oController._getTokens(oView.byId("idOrderType"));
            var bMobileWorkforce = oModel.getProperty("/oSelected/oFilter/bMobileWorkForce");
            var bOnlyOPconf = oModel.getProperty("/oSelected/oFilter/bOnlyOpConfield");
            var bShowOnlyMTank = oModel.getProperty("/oSelected/oFilter/bShowOnlyMeterTank");
            var sLayout = oModel.getProperty("/sLayout");
            var aOperationStatus = oModel.getProperty("/OperationStatusSelected");

            function createOrFilter(arr, field) {
                if (!arr || arr.length === 0) return null;
                var filters = arr.map(value => new Filter(field, FilterOperator.EQ, value));
                return new Filter(filters, false);
            }
            function createDatesFilter(Obj, oPath) {
                var filters;
                filters = new Filter({
                    filters: [
                        new Filter({
                            path: oPath.From,
                            operator: FilterOperator.GT,
                            value1: Obj.From
                        }),
                        new Filter({
                            path: oPath.To,
                            operator: FilterOperator.LT,
                            value1: Obj.To
                        })
                    ],
                    and: true
                })
                return filters;
            }

            var allFilters = [
                createOrFilter(aOrderStatus, "Status"),
                createOrFilter(aMainActivity, "MAIN_ACTIVITY"),
                createOrFilter(aPlannerGroup, "Planner_Group"),
                createOrFilter(aWorkCenter, "WRKCNTR_ID"),
                createOrFilter(aFuncLoc, "Functional_Loc"),
                createOrFilter(aSerOrder, "ORDER_NO"),
                createOrFilter(aOrderType, "ORDER_TYPE"),
                createOrFilter([bMobileWorkforce], "MOB_WFORCE"),
                createOrFilter([bOnlyOPconf], "OPR_CONF"),
                createOrFilter([bShowOnlyMTank], "CTPT_M_TANK"),
                createOrFilter(aOperationStatus, "OP_STATUS")
            ].filter(f => f !== null);
            var Validatefunction = function (From, To) {
                debugger;
                var isValidateDates = true;
                var dateRegex = /^\d{4}\-\d{2}\-\d{2}T\d{2}:\d{2}:\d{2}$/;
                var isValidFrom = dateRegex.test(From);
                var isValidTo = dateRegex.test(To);
                if (!isValidFrom || !isValidTo) {
                    // Handle invalid date format
                    isValidateDates = false;
                }
                return isValidateDates;
            }
            if (Validatefunction(sCompletedOn.From, sCompletedOn.To)) {
                allFilters.push(createDatesFilter(sCompletedOn, { From: "FINISH_DT_FROM", To: "FINISH_DT_TO" }));
            }
            if (Validatefunction(sCreatedOn.From, sCreatedOn.To)) {
                allFilters.push(createDatesFilter(sCreatedOn, { From: "CREATED_ON_FROM", To: "CREATED_ON_TO" }));
            }
            if (Validatefunction(sBasicStart.From, sBasicStart.To)) {
                allFilters.push(createDatesFilter(sBasicStart, { From: "BASIC_START_DT_FROM", To: "BASIC_START_DT_TO" }));
            }
            return allFilters;
        },

        _fnOnChangeCompletedDate: function () {
            var oView = oController.getView();
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var sFromDate = oModel.getProperty("/sCompletedOnFrom");
            var sToDate = oModel.getProperty("/sCompletedOnTo");
            if (sToDate && !sFromDate) {
                sap.m.MessageToast.show("Please select 'From' date before selecting 'To' date.");
                oView.byId("idcompletedOnDatePicker").setValue("");
                oModel.setProperty("/sCompletedOnTo", "");
            } else if (sFromDate && sToDate && sFromDate > sToDate) {
                sap.m.MessageToast.show("From date cannot be greater than To date");
                oModel.setProperty("/sCompletedOnFrom", "");
                oModel.setProperty("/sCompletedOnTo", "");
            } else {
                // Proceed with the logic
            }
        },

        getRangeOfDates: function () {
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var sFromDate = oModel.getProperty("/sCreatedOnFrom");
            var sToDate = oModel.getProperty("/sCreatedOnTo");
            if (sFromDate && sToDate) {
                var oFilter = new sap.ui.model.Filter("CreatedOn", sap.ui.model.FilterOperator.BT, sFromDate, sToDate);
                return [oFilter];
            } else if (sFromDate && !sToDate) {
                var oFilter = new sap.ui.model.Filter("CreatedOn", sap.ui.model.FilterOperator.EQ, sFromDate);
                return [oFilter];
            }
            return [];
        },

        _fnOnChangeCreatedOn: function () {
            var oView = oController.getView();
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var sFromDate = oModel.getProperty("/sCreatedOnFrom");
            var sToDate = oModel.getProperty("/sCreatedOnTo");
            if (sToDate && !sFromDate) {
                sap.m.MessageToast.show("Please select 'From' date before selecting 'To' date.");
                oView.byId("idcreatedOnDatePicker").setValue("");
                oModel.setProperty("/sCreatedOnTo", "");
            } else if (sFromDate && sToDate && sFromDate > sToDate) {
                sap.m.MessageToast.show("From date cannot be greater than To date");
                oModel.setProperty("/sCreatedOnFrom", "");
                oModel.setProperty("/sCreatedOnTo", "");
            } else {
                // Proceed with the logic
            }
        },

        _fnOnChangeStartDate: function () {
            var oView = oController.getView();
            var oModel = oController.getView().getModel("FieldMonSelModel");
            var sFromDate = oModel.getProperty("/sBasicStartFrom");
            var sToDate = oModel.getProperty("/sBasicStartTo");
            if (sToDate && !sFromDate) {
                sap.m.MessageToast.show("Please select 'From' date before selecting 'To' date.");
                oView.byId("idbasicStartDatePicker").setValue("");
                oModel.setProperty("/sBasicStartTo", "");
            } else if (sFromDate && sToDate && sFromDate > sToDate) {
                sap.m.MessageToast.show("From date cannot be greater than To date");
                oModel.setProperty("/sBasicStartFrom", "");
                oModel.setProperty("/sBasicStartTo", "");
            } else {
                // Proceed with the logic
            }
        }
    });
});
