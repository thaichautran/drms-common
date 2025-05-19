
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/button_group";
import "devextreme/ui/color_box";
import "devextreme/ui/date_box";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/multi_view";
import "devextreme/ui/number_box";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import "devextreme/ui/radio_group";
import dxSelectBox from "devextreme/ui/select_box";
import "devextreme/ui/select_box";
import "devextreme/ui/tag_box";
import "devextreme/ui/text_area";
import "devextreme/ui/text_box";
import dxToolbar from "devextreme/ui/toolbar";
import "devextreme/ui/toolbar";
import Handlebars from "handlebars";

import { EnumDataType, EnumStatus, EnumTypeOf } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { AreaModel } from "../../models/area.model";
import { OGTableColumnModel } from "../../models/table.model";
import { AreaService } from "../../services/area.service";
import { TableColumnService, TableService } from "../../services/table.service";
import { IBaseComponent } from "../base-component.abstract";
import BaoCaoTuyChonTemplate from "./templates/baocao_tuychon.hbs";
import "./thematic-report.component.scss";

interface ThematicReportOption {
    mapId?: number,
    onExportChartClick: (ThematicReportComponent) => void,
    onQueryReportClick: (ThematicReportComponent) => void,
    schema?: string,
}
interface ChartResponseViewModel {
    chart_type: string,
    colors: string[],
    data: object,
    legend: string,
    series: string[],
    title: string
}
export default class ThematicReportComponent implements IBaseComponent {
    chartToolbar: dxToolbar;
    colorToolbar: dxToolbar;
    container: JQuery<HTMLElement>;
    formChartType: dxForm;
    formColor: dxForm;
    formCreateReport: dxForm;
    mapId: number;
    options: ThematicReportOption;
    popupColor: dxPopup;
    popupSaveReport: dxPopup;
    reportFilterForm: dxForm;
    reportForm: dxForm;
    reportFormMultiview: dxMultiView;
    reportToolbar: dxToolbar;
    schema: string;
    constructor(container: JQuery<HTMLElement>, opts: ThematicReportOption) {
        this.schema = opts.schema;
        this.mapId = opts.mapId;
        this.options = opts;
        this.container = container;
        this.onInit();
    }
    private _initLayout(container: JQuery<HTMLElement>): void {
        $(document).on("click", ".undo-map", function () {
            const pathname = window.location.pathname;
            const url = pathname.substr(0, pathname.lastIndexOf("/")) + "/data";
            window.location.assign(url);
        });
        $("<div />").addClass("report-toolbar-title").appendTo(container);
        $(".report-toolbar-title").css("border-bottom", "1px solid rgb(153, 153, 153,0.3)");

        this.popupColor = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (element) => {
                this.formColor = $("<div />").appendTo(element).dxForm({
                    colCount: 1,
                    formData: {},
                    items: [],
                    labelLocation: "left",
                    minColWidth: 300,
                    scrollingEnabled: true,
                    showColonAfterLabel: true,
                    width: "100%"
                }).dxForm("instance");
                this.colorToolbar = $("<div />").css("padding-top", "10px").appendTo(element)
                    .dxToolbar({
                        items: [{
                            options: {
                                onClick: () => {
                                    this.popupColor.hide();
                                },
                                stylingMode: "contained",
                                text: "Xác nhận",
                                type: "default",
                                visible: true,
                            },
                            widget: "dxButton"
                        }, {
                            options: {
                                onClick: () => {
                                    this.popupColor.hide();
                                },
                                styleMode: "success",
                                text: "Hủy bỏ"
                            },
                            widget: "dxButton"
                        }]
                    }).dxToolbar("instance");
                setInterval(() => {
                    this.formColor.element().height(element.height() - this.colorToolbar.element().outerHeight());
                    this.formColor.option("height", (element.height() - this.colorToolbar.element().outerHeight()) + "px");
                }, 500);
            },
            deferRendering: false,
            dragEnabled: true,
            height: 300,
            hideOnOutsideClick: false,
            onHidden: () => {
            },
            onShown: () => {

            },
            shading: true,
            showCloseButton: false,
            showTitle: true,
            title: "Thiết lập màu sắc biểu đồ",
            visible: false,
            width: 300,

        }).dxPopup("instance");

        $(".dx-toolbar-items-container").find(".dx-toolbar-before").css("font-size", "17px");
        const reportFormContainer = $("<div />").addClass("report-form").appendTo(container);
        const reportFormMultiviewContainer = $("<div />").addClass("report-form-multi-view").appendTo(container);
        //
        this.reportForm = $("<div />").appendTo(reportFormContainer).css("padding", "10px").dxForm({
            formData: {
                chartGroupBy: "",
                layer_id: 0,
                mode: "table",
                tableColumns: "",
            },
            items: [
                {
                    colSpan: 2,
                    itemType: "group",
                    items: [{
                        template: () => {

                        }
                    }]
                }, {
                    colSpan: 2,
                    itemType: "group",
                    items: [{
                        dataField: "layer_id",
                        editorOptions: {
                            dataSource: {
                                store: new CustomStore({
                                    key: "id",
                                    load: (loadOptions) => {
                                        let layerName = "";
                                        if (loadOptions.filter != undefined) {
                                            layerName = loadOptions.filter[0][2];
                                        }
                                        const deferred = $.Deferred();

                                        $.get("/api/layer/getLayers", {
                                            keyword: layerName,
                                            mapId: this.mapId,
                                            schema: this.schema
                                        }).done((result) => {
                                            if (result.status == "OK") {
                                                const data = result.data;
                                                deferred.resolve(data);
                                            } else {
                                                deferred.resolve({});
                                            }
                                        });
                                        return deferred.promise();
                                    },
                                    loadMode: "raw",
                                }),
                            },
                            displayExpr: "name_vn",
                            onContentReady: () => {
                                $(".dx-list-item-content").each(function () {
                                    const $ele = $(this);
                                    $ele.attr("title", $ele.text());
                                });
                            },
                            onValueChanged: (e) => {
                                OGUtils.showLoading();

                                const items_category = [];
                                const columnSelectBox = this.reportForm.getEditor("tableColumns");
                                if (columnSelectBox && columnSelectBox instanceof dxSelectBox) {
                                    columnSelectBox.reset();
                                    if (columnSelectBox.getDataSource()) {
                                        columnSelectBox.getDataSource().reload();
                                    }
                                }
                                const layer = e.component.option("selectedItem");
                                if (layer) {
                                    let formItems = [];
                                    layer.table.columns.sort((a, b) => {
                                        if (a.order < b.order) {
                                            return -1;
                                        }
                                        if (a.order > b.order) {
                                            return 1;
                                        }
                                        return 0;
                                    }).forEach((column) => {
                                        const filterFormItems = [];
                                        if (column.is_identity == false && column.is_searchable && column.visible) {
                                            if (column.column_name === "province_code") {
                                                filterFormItems.push({
                                                    dataField: column.column_name,
                                                    editorOptions: {
                                                        dataSource: new DataSource({
                                                            key: "area_id",
                                                            store: new CustomStore({
                                                                load: async () => {
                                                                    return await AreaService.provinces();
                                                                },
                                                                loadMode: "raw"
                                                            })
                                                        }),
                                                        deferRendering: false,
                                                        displayExpr: "name_vn",
                                                        maxDisplayedTags: 1,
                                                        multiline: false,
                                                        noDataText: "Không có dữ liệu",
                                                        onContentReady: () => {
                                                            $(".dx-list-item-content").each(function () {
                                                                const $ele = $(this);
                                                                $ele.attr("title", $ele.text());
                                                            });
                                                        },
                                                        onMultiTagPreparing: function (args) {
                                                            const selectedItemsLength = args.selectedItems.length,
                                                                totalCount = 1;

                                                            if (selectedItemsLength < totalCount) {
                                                                args.cancel = true;
                                                            } else {
                                                                args.text = "[" + selectedItemsLength + "] lựa chọn";
                                                            }
                                                        },
                                                        onOpened: (e) => {
                                                            const component = e.component;
                                                            const _list = component._listItemElements();
                                                            if (_list.length > 6) {
                                                                component._popup.option("height", 195);
                                                            } else {
                                                                component._popup.option("height", "auto");
                                                            }
                                                        },
                                                        onSelectionChanged: () => {
                                                            const districtEditor = this.reportFilterForm.getEditor("district_code");
                                                            if (districtEditor && districtEditor instanceof dxSelectBox) {
                                                                districtEditor.getDataSource().reload();
                                                            }
                                                        },
                                                        placeholder: "[Chọn...]",
                                                        searchEnabled: true,
                                                        searchExpr: "name_vn",
                                                        searchMode: "contains",
                                                        showDropDownButton: true,
                                                        showSelectionControls: true,
                                                        valueExpr: "area_id"
                                                    },
                                                    editorType: "dxTagBox",
                                                    label: {
                                                        text: column.name_vn
                                                    }
                                                });
                                                items_category.push(column);
                                            } else if (column.column_name === "district_code") {
                                                filterFormItems.push({
                                                    dataField: column.column_name,
                                                    editorOptions: {
                                                        dataSource: new DataSource({
                                                            key: "area_id",
                                                            store: new CustomStore({
                                                                load: async () => {
                                                                    return await AreaService.districts("01");
                                                                },
                                                                loadMode: "raw"
                                                            })
                                                        }),
                                                        deferRendering: false,
                                                        displayExpr: "name_vn",
                                                        maxDisplayedTags: 1,
                                                        multiline: false,
                                                        noDataText: "Không có dữ liệu",
                                                        onContentReady: () => {
                                                            $(".dx-list-item-content").each(function () {
                                                                const $ele = $(this);
                                                                $ele.attr("title", $ele.text());
                                                            });
                                                        },
                                                        onMultiTagPreparing: function (args) {
                                                            const selectedItemsLength = args.selectedItems.length,
                                                                totalCount = 1;

                                                            if (selectedItemsLength < totalCount) {
                                                                args.cancel = true;
                                                            } else {
                                                                args.text = "[" + selectedItemsLength + "] lựa chọn";
                                                            }
                                                        },
                                                        onOpened: (e) => {
                                                            const component = e.component;
                                                            const _list = component._listItemElements();
                                                            if (_list.length > 6) {
                                                                component._popup.option("height", 195);
                                                            } else {
                                                                component._popup.option("height", "auto");
                                                            }
                                                        },
                                                        onSelectionChanged: () => {
                                                            const communeEditor = this.reportFilterForm.getEditor("commune_code");
                                                            if (communeEditor && communeEditor instanceof dxSelectBox) {
                                                                communeEditor.getDataSource().reload();
                                                            }
                                                        },
                                                        placeholder: "[Chọn...]",
                                                        searchEnabled: true,
                                                        searchExpr: "name_vn",
                                                        searchMode: "contains",
                                                        showDropDownButton: true,
                                                        showSelectionControls: true,
                                                        valueExpr: "area_id"
                                                    },
                                                    editorType: "dxTagBox",
                                                    label: {
                                                        text: column.name_vn
                                                    }
                                                });
                                                items_category.push(column);
                                            } else if (column.column_name === "commune_code") {
                                                filterFormItems.push({
                                                    dataField: column.column_name,
                                                    editorOptions: {
                                                        dataSource: new DataSource({
                                                            key: "area_id",
                                                            pageSize: 999,
                                                            store: new CustomStore({
                                                                byKey: function () {
                                                                    const deferred = $.Deferred();
                                                                    let district = [0];
                                                                    if (this.g_ReportFilterForm && this.g_ReportFilterForm.getEditor("district_code")) {
                                                                        district = this.g_ReportFilterForm.getEditor("district_code").option("value");
                                                                    }
                                                                    return AreaService.communes(district.join(","));
                                                                },
                                                                load: () => {
                                                                    const deferred = $.Deferred();
                                                                    let district = [0];
                                                                    if (this.reportFilterForm && this.reportFilterForm.getEditor("district_code")) {
                                                                        district = this.reportFilterForm.getEditor("district_code").option("value");
                                                                    }
                                                                    AreaService.communes(district.join(",")).then(result => {
                                                                        if (result) {
                                                                            deferred.resolve(result);
                                                                            if (this.reportFilterForm.getEditor("commune_code")) {
                                                                                const value = [];
                                                                                const area_ids = result.map(item => item.area_id);
                                                                                this.reportFilterForm.getEditor("commune_code").option("value").forEach(id => {
                                                                                    if (area_ids.indexOf(id) > -1) {
                                                                                        value.push(id);
                                                                                    }
                                                                                });
                                                                                this.reportFilterForm.getEditor("commune_code").option("value", value);
                                                                            }
                                                                        } else {
                                                                            deferred.resolve([]);
                                                                        }
                                                                    });
                                                                    return deferred.promise();
                                                                },
                                                                loadMode: "raw"
                                                            })
                                                        }),
                                                        deferRendering: false,
                                                        displayExpr: "name_vn",
                                                        maxDisplayedTags: 1,
                                                        multiline: false,
                                                        noDataText: "Không có dữ liệu",
                                                        onContentReady: () => {
                                                            $(".dx-list-item-content").each(function () {
                                                                const $ele = $(this);
                                                                $ele.attr("title", $ele.text());
                                                            });
                                                        },
                                                        onMultiTagPreparing: function (args) {
                                                            const selectedItemsLength = args.selectedItems.length,
                                                                totalCount = 1;

                                                            if (selectedItemsLength < totalCount) {
                                                                args.cancel = true;
                                                            } else {
                                                                args.text = "[" + selectedItemsLength + "] lựa chọn";
                                                            }
                                                        },
                                                        onOpened: (e) => {
                                                            const component = e.component;
                                                            const _list = component._listItemElements();
                                                            if (_list.length > 6) {
                                                                component._popup.option("height", 195);
                                                            } else {
                                                                component._popup.option("height", "auto");
                                                            }
                                                        },
                                                        placeholder: "[Chọn...]",
                                                        searchEnabled: true,
                                                        searchExpr: "name_vn",
                                                        searchMode: "contains",
                                                        showDropDownButton: true,
                                                        showSelectionControls: true,
                                                        valueExpr: "area_id"
                                                    },
                                                    editorType: "dxTagBox",
                                                    label: {
                                                        text: column.name_vn
                                                    }
                                                });
                                                items_category.push(column);
                                            } else if (column.lookup_table_id > 0) {
                                                filterFormItems.push({
                                                    dataField: column.column_name,
                                                    editorOptions: {
                                                        dataSource: {
                                                            key: "id",
                                                            store: new CustomStore({
                                                                load: () => {
                                                                    return TableService.shortData({ table_id: column.lookup_table_id });
                                                                },
                                                                loadMode: "raw"
                                                            })
                                                        },
                                                        displayExpr: "text",
                                                        maxDisplayedTags: 1,
                                                        noDataText: "Không có dữ liệu",
                                                        onContentReady: () => {
                                                            $(".dx-list-item-content").each(function () {
                                                                const $ele = $(this);
                                                                $ele.attr("title", $ele.text());
                                                            });
                                                        },
                                                        onMultiTagPreparing: function (args) {
                                                            const selectedItemsLength = args.selectedItems.length,
                                                                totalCount = 1;

                                                            if (selectedItemsLength < totalCount) {
                                                                args.cancel = true;
                                                            } else {
                                                                args.text = "[" + selectedItemsLength + "] lựa chọn";
                                                            }
                                                        },
                                                        placeholder: "[Chọn...]",
                                                        searchEnabled: true,
                                                        searchExpr: "text",
                                                        searchMode: "contains",
                                                        showDropDownButton: true,
                                                        showSelectionControls: true,
                                                        valueExpr: "id",
                                                    },
                                                    editorType: "dxTagBox",
                                                    label: {
                                                        text: column.name_vn
                                                    },
                                                });
                                                items_category.push(column);
                                            } else if (column.data_type === EnumDataType.integer || column.data_type === EnumDataType.double) {
                                                if (column.column_name != "toado_x" && column.column_name != "toado_y") {
                                                    filterFormItems.push({
                                                        dataField: column.column_name + "_start",
                                                        editorOptions: {
                                                            format: column.data_type === EnumDataType.integer ? "#0" : "",
                                                        },
                                                        editorType: "dxNumberBox",
                                                        label: {
                                                            text: column.name_vn + " Từ"
                                                        }
                                                    });
                                                    filterFormItems.push({
                                                        dataField: column.column_name + "_end",
                                                        editorOptions: {
                                                            format: column.data_type === EnumDataType.integer ? "#0" : "",
                                                        },
                                                        editorType: "dxNumberBox",
                                                        label: {
                                                            text: "Đến"
                                                        }
                                                    });
                                                }
                                            } else if (column.data_type === EnumDataType.date || column.data_type === EnumDataType.dateTime) {
                                                let type, format;
                                                if (column.data_type === EnumDataType.date) {
                                                    type = "date";
                                                    format = "dd/MM/yyyy";
                                                }
                                                else if (column.data_type === EnumDataType.dateTime) {
                                                    type = "datetime";
                                                    format = "dd/MM/yyyy HH:mm";
                                                }
                                                filterFormItems.push({
                                                    dataField: column.column_name + "_dateStart",
                                                    editorOptions: {
                                                        applyButtonText: "Xác nhận",
                                                        cancelButtonText: "Hủy",
                                                        displayFormat: format,
                                                        invalidDateMessage: "Vui lòng nhập đúng định dạng: " + format,
                                                        showAnalogClock: false,
                                                        type: type,
                                                        width: "100%",
                                                    },
                                                    editorType: "dxDateBox",
                                                    label: {
                                                        text: column.name_vn + " Từ",
                                                    },
                                                });
                                                filterFormItems.push({
                                                    dataField: column.column_name + "_dateEnd",
                                                    editorOptions: {
                                                        applyButtonText: "Xác nhận",
                                                        cancelButtonText: "Hủy",
                                                        displayFormat: format,
                                                        invalidDateMessage: "Vui lòng nhập đúng định dạng: " + format,
                                                        showAnalogClock: false,
                                                        type: type,
                                                        width: "100%",
                                                    },
                                                    editorType: "dxDateBox",
                                                    label: {
                                                        text: column.name_vn + " Đến",
                                                    },
                                                });
                                            } else if (column.data_type === EnumDataType.bool) {
                                                filterFormItems.push({
                                                    dataField: column.column_name,
                                                    editorOptions: {
                                                        displayExpr: "mo_ta",
                                                        items: [{
                                                            "id": true,
                                                            "mo_ta": "Có"
                                                        }, {
                                                            "id": false,
                                                            "mo_ta": "Không"
                                                        }],
                                                        noDataText: "Không có dữ liệu",
                                                        valueExpr: "id"
                                                    },
                                                    editorType: "dxRadioGroup",
                                                    label: {
                                                        text: column.name_vn
                                                    }
                                                });
                                            } else if (column.data_type === EnumDataType.string || column.data_type === EnumDataType.text) {
                                                filterFormItems.push({
                                                    dataField: column.column_name,
                                                    editorOptions: {
                                                        dataSource: {
                                                            pageSize: 25,
                                                            paginate: true,
                                                            store: new CustomStore({
                                                                load: (options) => {
                                                                    return new Promise((resolve) => {
                                                                        TableColumnService.listDistinctValues(column, options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                                            resolve({
                                                                                data: data.data,
                                                                                totalCount: data.recordsTotal
                                                                            });
                                                                        });
                                                                    });
                                                                },
                                                            })
                                                        },
                                                        searchEnabled: true,
                                                        showClearButton: true
                                                    },
                                                    editorType: "dxSelectBox",
                                                    label: {
                                                        text: column.name_vn
                                                    },
                                                });
                                                // filterFormItems.push({
                                                //     dataField: column.column_name,
                                                //     editorOptions: {
                                                //     },
                                                //     editorType: "dxTextBox",
                                                //     label: {
                                                //         maxLenght: column.character_max_length,
                                                //         text: column.name_vn
                                                //     },
                                                // });
                                            }
                                        }
                                        formItems = $.merge(formItems, filterFormItems);
                                    });

                                    this.reportToolbar.option("items[0].options.disabled", false);

                                    this.formChartType.beginUpdate();
                                    this.formChartType.getEditor("group_by").option("items", items_category);
                                    this.formChartType.getEditor("group_by").option("value", null);
                                    this.formChartType.endUpdate();

                                    this.reportFilterForm.beginUpdate();
                                    this.reportFilterForm.option("items", formItems);
                                    this.reportFilterForm.endUpdate();
                                } else {
                                    this.reportToolbar.option("items[0].options.disabled", true);
                                }

                                setTimeout(() => OGUtils.hideLoading(), 500);
                            },
                            placeholder: "[Chọn lớp dữ liệu]",
                            searchEnabled: true,
                            searchExpr: "name_vn",
                            searchMode: "contains",
                            valueExpr: "id",
                            width: 220
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Lớp dữ liệu"
                        }
                    }, {
                        dataField: "mode",
                        editorOptions: {
                            displayExpr: "text",
                            items: [{
                                id: "table",
                                text: "Bảng"
                            }, {
                                id: "chart",
                                text: "Biểu đồ"
                            }],
                            layout: "horizontal",
                            onValueChanged: (e) => {
                                if (e.value === "table") {
                                    this.reportForm.itemOption("tableColumns", "visible", true);
                                    const tableColumnEditor = this.reportForm.getEditor("tableColumns");
                                    if (tableColumnEditor && tableColumnEditor instanceof dxSelectBox) {
                                        tableColumnEditor.getDataSource().reload();
                                    }
                                    this.reportFormMultiview.option("selectedIndex", 0);
                                } else if (e.value === "chart") {
                                    this.reportForm.itemOption("tableColumns", "visible", false);
                                    this.reportFormMultiview.option("selectedIndex", 1);
                                }
                            },
                            valueExpr: "id"
                        },
                        editorType: "dxRadioGroup",
                        label: {
                            text: "Kiểu báo cáo"
                        }
                    }, {
                        dataField: "tableColumns",
                        editorOptions: {
                            dataSource: {
                                store: new CustomStore({
                                    byKey: () => {
                                        return null;
                                    },
                                    key: "id",
                                    load: () => {
                                        const deferred = $.Deferred();

                                        const layerEditor = this.reportForm.getEditor("layer_id");
                                        if (layerEditor && layerEditor instanceof dxSelectBox) {
                                            const selectedLayer = layerEditor.option("selectedItem");
                                            if (selectedLayer) {
                                                const layerColumns = selectedLayer.table.columns.filter(s => s.visible);
                                                deferred.resolve(layerColumns);
                                                const tableColumnEditor = this.reportForm.getEditor("tableColumns");
                                                if (tableColumnEditor && tableColumnEditor instanceof dxSelectBox) {
                                                    tableColumnEditor.open();
                                                    tableColumnEditor.close();
                                                }
                                            } else {
                                                deferred.resolve({});
                                            }
                                        } else {
                                            deferred.resolve({});
                                        }

                                        return deferred.promise();
                                    },
                                    loadMode: "raw",
                                })
                            },
                            displayExpr: "name_vn",
                            maxDisplayedTags: 1,
                            multiline: false,
                            noDataText: "Không có dữ liệu",
                            onMultiTagPreparing: function (args) {
                                const selectedItemsLength = args.selectedItems.length,
                                    totalCount = 1;

                                if (selectedItemsLength < totalCount) {
                                    args.cancel = true;
                                } else {
                                    args.text = "[" + selectedItemsLength + "] trường đã chọn";
                                }
                            },
                            placeholder: "[Tất cả]",
                            searchEnabled: true,
                            searchExpr: ["name_vn"],
                            searchMode: "contains",
                            showDropDownButton: true,
                            showSelectionControls: true,
                            valueExpr: "id",
                            width: 220,
                        },
                        editorType: "dxTagBox",
                        label: {
                            text: "Trường thông tin"
                        },
                        visible: true
                    }, {
                        template: () => {
                            return "<hr style=\"margin: 5px 0;\" />";
                        }
                    }]
                }]
        }).dxForm("instance");

        this.reportFormMultiview = $("<div />").appendTo(reportFormMultiviewContainer).dxMultiView({
            deferRendering: false,
            height: container.height() - this.reportForm.element().outerHeight(),
            items: [{
                template: (data, index, element) => {
                    const reportFilterFormContainer = $("<div />").addClass("report-filter-form").appendTo(element);
                    const tbContainer = $("<div />").addClass("report-toolbar").appendTo(element);
                    //
                    this.reportFilterForm = $("<div />").css({ "padding": "10px" })
                        .appendTo(reportFilterFormContainer)
                        .dxForm({
                            colCount: 2,
                            formData: {},
                            items: [],
                            labelLocation: "top",
                            scrollingEnabled: false,
                        }).dxForm("instance");
                    this.reportToolbar = $("<div />").appendTo(tbContainer)
                        .dxToolbar({
                            items: [{
                                location: "center",
                                options: {
                                    onClick: () => {
                                        if (this.options.onQueryReportClick) {
                                            this.options.onQueryReportClick(this);
                                        }
                                    },
                                    stylingMode: "contained",
                                    text: "Xuất báo cáo",
                                    type: "default"
                                },
                                widget: "dxButton"
                            }, {
                                location: "center",
                                options: {
                                    onClick: () => {
                                        this.export();
                                    },
                                    stylingMode: "contained",
                                    text: "Xuất excel",
                                    type: "success"
                                },
                                widget: "dxButton"
                            },]
                        }).css("padding-bottom", "10px").dxToolbar("instance");

                    reportFilterFormContainer.css({
                        "height": element.height() - this.reportToolbar.element().outerHeight() - 10,
                        "overflow-y": "auto",
                    });
                    // reportFilterFormContainer.dxScrollView({
                    //     height: element.height() - this.reportToolbar.element().outerHeight() - 10,
                    // });
                }
            }, {
                template: (data, index, element) => {
                    this.formChartType = $("<div />").css("padding", "10px").appendTo(element).dxForm({
                        colCount: 2,
                        formData: {},
                        items: [{
                            caption: "Tùy chỉnh biểu đồ",
                            colCount: 2,
                            colSpan: 2,
                            itemType: "group",
                            items: [{
                                dataField: "chart_type",
                                editorOptions: {
                                    displayExpr: "text",
                                    items: [{
                                        "id": "bar-chart",
                                        "text": "Biểu đồ cột"
                                    }, {
                                        "id": "pie-chart",
                                        "text": "Biểu đồ tròn"
                                    }, {
                                        "id": "line-chart",
                                        "text": "Biểu đồ đường"
                                    }],
                                    onSelectionChanged: (e) => {
                                        if (this.chartToolbar) {
                                            this.chartToolbar.option("items[1].options.disabled", e.selectedItem.id !== "pie-chart");
                                        }
                                    },
                                    placeholder: "[Chọn loại biểu đồ]",
                                    value: "bar-chart",
                                    valueExpr: "id"
                                },
                                editorType: "dxSelectBox",
                                label: {
                                    text: "Loại biểu đồ"
                                }
                            }, {
                                dataField: "group_by",
                                editorOptions: {
                                    displayExpr: "name_vn",
                                    onSelectionChanged: (e) => {
                                        if (this.formChartType) {
                                            if (!e.selectedItem) {
                                                this.chartToolbar.option("items[0].options.disabled", true);
                                                this.chartToolbar.option("items[1].options.disabled", true);
                                                return;
                                            }
                                            OGUtils.showLoading();

                                            const formItems = [];
                                            const formData = {};

                                            if (e.selectedItem.lookup_table_id > 0) {
                                                TableService.shortData({ table_id: e.selectedItem.lookup_table_id }).then(result => {
                                                    if (result && result.length) {
                                                        this.formColor.beginUpdate();
                                                        result.forEach((record, idx) => {
                                                            formItems.push({
                                                                dataField: record.mo_ta,
                                                                editorOptions: {
                                                                    onValueChanged: () => {
                                                                    }
                                                                },
                                                                editorType: "dxColorBox",
                                                                label: {
                                                                    text: record.mo_ta
                                                                },
                                                            });
                                                            formData[record.mo_ta] = OGUtils.rainbow(result.length, idx);
                                                        });
                                                        this.formColor.option("formData", formData);
                                                        this.formColor.option("items", formItems);
                                                        this.formColor.endUpdate();

                                                        OGUtils.hideLoading();
                                                    }
                                                });
                                            } else if (e.selectedItem.column_name === "commune_code") {
                                                AreaService.communes("-1").then(result => {
                                                    const formItems = [];
                                                    this.formColor.beginUpdate();

                                                    if (result && result.length) {
                                                        result.forEach((record, idx) => {
                                                            formItems.push({
                                                                dataField: record.name_vn,
                                                                editorOptions: {
                                                                    onValueChanged: () => {
                                                                    }
                                                                },
                                                                editorType: "dxColorBox",
                                                                label: {
                                                                    text: record.name_vn
                                                                },
                                                            });
                                                            formData[record.name_vn] = OGUtils.rainbow(result.length, idx);
                                                        });
                                                    }

                                                    this.formColor.option("formData", formData);
                                                    this.formColor.option("items", formItems);
                                                    this.formColor.endUpdate();

                                                    OGUtils.hideLoading();
                                                });
                                            } else if (e.selectedItem.column_name === "district_code") {
                                                AreaService.districts().then(result => {
                                                    const formItems = [];
                                                    this.formColor.beginUpdate();

                                                    if (result && result.length) {
                                                        result.forEach((record, idx) => {
                                                            formItems.push({
                                                                dataField: record.name_vn,
                                                                editorOptions: {
                                                                    onValueChanged: () => {
                                                                    }
                                                                },
                                                                editorType: "dxColorBox",
                                                                label: {
                                                                    text: record.name_vn
                                                                },
                                                            });
                                                            formData[record.name_vn] = OGUtils.rainbow(result.length, idx);
                                                        });
                                                    }

                                                    this.formColor.option("formData", formData);
                                                    this.formColor.option("items", formItems);
                                                    this.formColor.endUpdate();

                                                    OGUtils.hideLoading();
                                                });
                                            } else if (e.selectedItem.column_name === "province_code") {
                                                AreaService.provinces().then(result => {
                                                    const formItems = [];
                                                    this.formColor.beginUpdate();

                                                    if (result && result.length) {
                                                        result.forEach((record, idx) => {
                                                            formItems.push({
                                                                dataField: record.name_vn,
                                                                editorOptions: {
                                                                    onValueChanged: () => {
                                                                    }
                                                                },
                                                                editorType: "dxColorBox",
                                                                label: {
                                                                    text: record.name_vn
                                                                },
                                                            });
                                                            formData[record.name_vn] = OGUtils.rainbow(result.length, idx);
                                                        });
                                                    }

                                                    this.formColor.option("formData", formData);
                                                    this.formColor.option("items", formItems);
                                                    this.formColor.endUpdate();

                                                    OGUtils.hideLoading();
                                                });
                                            }

                                            this.chartToolbar.option("items[0].options.disabled", false);
                                            this.chartToolbar.option("items[1].options.disabled", this.formChartType.option("formData").chart_type !== "pie-chart");
                                        }
                                    },
                                    placeholder: "[Chọn nhóm]",
                                    valueExpr: "id"
                                },
                                editorType: "dxSelectBox",
                                label: {
                                    text: "Nhóm"
                                }
                            }]

                        }],
                        labelLocation: "top",
                        onContentReady: (e) => {
                            e.element.find(".dx-form-group-caption").css("font-size", "16px");
                        },
                        showColonAfterLabel: true
                    }).dxForm("instance");
                    this.chartToolbar = $("<div />").css("padding-bottom", "10px").appendTo(element)
                        .dxToolbar({
                            items: [{
                                location: "center",
                                options: {
                                    disabled: true,
                                    onClick: () => {
                                        if (this.options.onExportChartClick) {
                                            this.options.onExportChartClick(this);
                                        }
                                    },
                                    stylingMode: "contained",
                                    text: "Xuất biểu đồ",
                                    type: "default"
                                },
                                widget: "dxButton"
                            }, {
                                options: {
                                    disabled: true,
                                    onClick: () => {
                                        this.popupColor.show();
                                    },
                                    text: "Thiết lập màu",
                                    type: "success"
                                },
                                widget: "dxButton"
                            },]
                        }).dxToolbar("instance");
                }
            }],
        }).dxMultiView("instance");
    }
    private initPopupSaveReport(): void {
        this.popupSaveReport = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.formCreateReport = $("<div />").appendTo(container).dxForm({
                    colCount: 1,
                    formData: {},
                    items: [{
                        dataField: "report_name",
                        editorType: "dxTextBox",
                        label: {
                            text: "Tên báo cáo",
                        },
                        validationRules: [{
                            message: "Vui lòng nhập tên báo cáo",
                            type: "required"
                        }]
                    }, {
                        editorOptions: {
                            items: [{
                                options: {
                                    onClick: () => {
                                        const validate = this.formCreateReport.validate();
                                        if (validate && validate.brokenRules.length > 0) {
                                            //validate.brokenRules[0].validator.focus();
                                            return false;
                                        }

                                        this.saveReport(this.formCreateReport.getEditor("report_name").option("value")).then((xhr) => {
                                            if (xhr["status"] === EnumStatus.OK) {
                                                OGUtils.alert("Lưu báo cáo thành công !");
                                                this.popupSaveReport.hide();
                                                this.formCreateReport.getEditor("report_name").option("value", "");
                                            } else {
                                                OGUtils.alert("Lưu báo cáo thất bại !");
                                            }
                                        });
                                    },
                                    text: "Lưu",
                                    type: "success",
                                    useSubmitBehavior: true
                                },
                                widget: "dxButton"
                            }]
                        },
                        editorType: "dxTextBox",
                    }],
                    labelLocation: "top",
                    minColWidth: 300,
                    showColonAfterLabel: true
                }).dxForm("instance");
            },
            deferRendering: true,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            resizeEnabled: false,
            shading: true,
            showTitle: true,
            title: "Nhập thông tin: ",
            width: 300
        }).dxPopup("instance");
    }

    private parseDataReport(records: [], columns: OGTableColumnModel[], communes: AreaModel[], districts: AreaModel[], provinces: AreaModel[], domains: Map<number, object>): string[][] {
        const result: string[][] = [];
        records.forEach(item => {
            const items: string[] = [];
            columns.forEach(col => {
                const valueCell = item[col.column_name];
                if (col.data_type == EnumDataType.date || col.data_type == EnumDataType.dateTime) {
                    if (valueCell) {
                        items.push(new Date(valueCell).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                        }));
                    } else {
                        items.push("");
                    }
                }
                else if (col.column_name == "commune_code") {
                    if (valueCell) {
                        const commune = communes.filter(s => s.area_id === item["commune_code"])[0];
                        if (commune) {
                            items.push(commune.name_vn);
                        }
                    }
                    else {
                        items.push("");
                    }
                } else if (col.column_name == "district_code") {
                    if (valueCell) {
                        const district = districts.filter(s => s.area_id === item["district_code"])[0];
                        if (district) {
                            items.push(district.name_vn);
                        }
                    } else {
                        items.push("");
                    }
                } else if (col.column_name == "province_code") {
                    if (valueCell) {
                        const province = provinces.filter(s => s.area_id === item["province_code"])[0];
                        if (province) {
                            items.push(province.name_vn);
                        }
                    } else {
                        items.push("");
                    }
                } else if (col.column_name == "coso_id") {
                    if (valueCell && domains) {
                        const category = domains[col.column_name].filter(s => s.id == item[col.column_name]);
                        if (category) {
                            items.push(category[0].mo_ta);
                        }
                    } else {
                        items.push("");
                    }
                } else if (col.lookup_table_id > 0 && domains) {
                    const category = domains[col.lookup_table_id].filter(s => s.id == item[col.column_name]);
                    if (category.length > 0)
                        items.push(category[0].mo_ta);
                    else
                        items.push("");
                }
                else if (col.data_type === EnumDataType.bool) {
                    if (item[col.column_name] == true) {
                        items.push("Có");
                    } else if (item[col.column_name] == false)
                        items.push("Không");
                    else {
                        items.push("");
                    }
                } else if (col.data_type === EnumDataType.double) {
                    if (valueCell) {
                        items.push(OGUtils.formatNumber(parseFloat(valueCell), 0, 4));
                    } else {
                        items.push("");
                    }
                } else {
                    if (valueCell) {
                        items.push(item[col.column_name]);
                    } else {
                        items.push("");
                    }
                }
            });
            result.push(items);
        });
        return result;
    }

    public export(): void {
        if (!this.reportForm.getEditor("layer_id").option("selectedItem")) {
            OGUtils.alert("Vui lòng chọn lớp báo cáo!");
        }

        const tableColumnEditor = this.reportForm.getEditor("tableColumns") as dxSelectBox;
        const columnSelectBox: OGTableColumnModel[] = tableColumnEditor.option("selectedItems") as OGTableColumnModel[];
        if (columnSelectBox.length == 0) {
            OGUtils.alert("Vui lòng chọn trường thông tin hiển thị!");
        }
        const attr = this.reportFilterForm.option("formData");

        $.each(attr, (key, value) => {
            if (attr[key] === null || attr[key] === undefined) {
                delete attr[key];
            } else if ((typeof (value) === EnumTypeOf.object || typeof (value) === EnumTypeOf.array) && !attr[key].length) {
                delete attr[key];
            }
            this.reportForm.getEditor(key.toString());
        });
        // if (typeof (attr["commune_code"]) === EnumTypeOf.boolean) {
        //     delete attr["commune_code"]
        // }
        // if (typeof (attr["district_code"]) === EnumTypeOf.boolean) {
        //     delete attr["district_code"]
        // }
        const param = this.reportFilterForm.option("formData");

        $.each(columnSelectBox, (idx, col) => {
            if (col.is_searchable) {
                if (col.lookup_table_id > 0) {
                    // if (attr[col.column_name] && typeof (attr[col.column_name]) === EnumTypeOf.array) {
                    //     param[col.column_name] = attr[col.column_name].join(',');
                    //     param[col.column_name] = typeof (attr[col.column_name]) == EnumTypeOf.object ? "" : attr[col.column_name];
                    // }
                }
                else if (col.data_type === EnumDataType.bool && typeof (attr[col.column_name]) === EnumTypeOf.array) {
                    if (attr[col.column_name]) {
                        param[col.column_name] = attr[col.column_name].join(",");
                        param[col.column_name] = typeof (attr[col.column_name]) == EnumTypeOf.array ? "" : attr[col.column_name];
                    }
                }
            }
        });

        OGUtils.postDownload("/api/report/exportSearchByLogic", {
            layer_id: this.reportForm.getEditor("layer_id").option("selectedItem")["id"],
            params: param,
            selectedFields: columnSelectBox
        }, "application/json; charset=utf-8");
    }

    public exportChart(): Promise<ChartResponseViewModel | string> {
        return new Promise((resolve, reject) => {
            OGUtils.showLoading();

            const column_id: number = this.formChartType.getEditor("group_by").option("value") ? this.formChartType.getEditor("group_by").option("value") : 0;
            const layer_id: number = this.reportForm.getEditor("layer_id").option("value") ? this.reportForm.getEditor("layer_id").option("value") : 0;
            const args = {
                param: {}
            };
            let layer_name: string = "";
            let group_name: string = "";

            const layerEditor = this.reportForm.getEditor("layer_id");
            if (layerEditor instanceof dxSelectBox) {
                layer_name = layerEditor.option("selectedItem").name_vn.toLowerCase();
            }
            const groupByEditor = this.formChartType.getEditor("group_by");
            if (groupByEditor instanceof dxSelectBox) {
                group_name = groupByEditor.option("selectedItem").name_vn.toLowerCase();
            }
            const colors = this.formColor.option("formData");
            const series = [];

            $.ajax({
                contentType: "application/json",
                data: JSON.stringify(args),
                dataType: "json",
                error: () => {
                    OGUtils.hideLoading();
                    reject("Data Loading Error");
                },
                success: (xhr) => {
                    $.each(colors, (key, value) => {
                        if ($.grep(xhr.data, (d) => d["category_name"] === key).length > 0) {
                            series.push({
                                argumentField: "category_name",
                                color: value,
                                label: {
                                    connector: {
                                        visible: true,
                                        width: 1
                                    },
                                    visible: true,
                                },
                                name: key,
                                valueField: "count"
                            });
                        }
                    });
                    resolve({
                        chart_type: this.formChartType.option("formData").chart_type,
                        colors: colors,
                        data: xhr.data,
                        legend: `Số lượng ${layer_name}`,
                        series: series,
                        title: `Biểu đồ số lượng ${layer_name} theo ${group_name}`
                    });
                    OGUtils.hideLoading();
                },
                type: "post",
                url: `/api/report/getChartData/${layer_id}/${column_id}`,
            });
        });
    }

    onInit(): void {
        this._initLayout(this.container);
        this.initPopupSaveReport();
    }

    public query(pageIndex: number, pageSize: number): Promise<unknown> {
        return new Promise((resolve, reject) => {
            if (!this.reportForm.getEditor("layer_id").option("selectedItem")) {
                OGUtils.alert("Vui lòng chọn lớp báo cáo!");
                resolve({});
            } else {
                const columnSelectBox: OGTableColumnModel[] = this.reportForm.getEditor("tableColumns").option("selectedItems") as OGTableColumnModel[];
                if (columnSelectBox.length == 0) {
                    OGUtils.alert("Vui lòng chọn trường thông tin hiển thị!");
                    resolve({});
                } else {
                    const attr = this.reportFilterForm.option("formData");

                    $.each(attr, (key, value) => {
                        if (attr[key] === null || attr[key] === undefined) {
                            delete attr[key];
                        } else if ((typeof (value) === EnumTypeOf.object || typeof (value) === EnumTypeOf.array) && !attr[key].length) {
                            delete attr[key];
                        }
                        this.reportForm.getEditor(key.toString());
                    });
                    // if (typeof (attr["commune_code"]) === EnumTypeOf.boolean) {
                    //     delete attr["commune_code"]
                    // }
                    // if (typeof (attr["district_code"]) === EnumTypeOf.boolean) {
                    //     delete attr["district_code"]
                    // }
                    const param = this.reportFilterForm.option("formData");

                    $.each(columnSelectBox, (idx, col: OGTableColumnModel) => {
                        if (col.is_searchable) {
                            if (col.lookup_table_id > 0) {
                                // if (attr[col.column_name] && typeof (attr[col.column_name]) === EnumTypeOf.array) {
                                //     param[col.column_name] = attr[col.column_name].join(',');
                                //     param[col.column_name] = typeof (attr[col.column_name]) == EnumTypeOf.object ? "" : attr[col.column_name];
                                // }
                            }
                            else if (col.data_type === EnumDataType.bool && typeof (attr[col.column_name]) === EnumTypeOf.array) {
                                if (attr[col.column_name]) {
                                    param[col.column_name] = attr[col.column_name].join(",");
                                    param[col.column_name] = typeof (attr[col.column_name]) == EnumTypeOf.array ? "" : attr[col.column_name];
                                }
                            }
                        }
                    });

                    OGUtils.showLoading();
                    $.ajax({
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify({
                            layer_id: this.reportForm.getEditor("layer_id").option("selectedItem")["id"],
                            pageIndex: pageIndex,
                            pageSize: pageSize,
                            params: param,
                            selectedFields: columnSelectBox
                        }),
                        dataType: "json",
                        type: "POST",
                        url: "/api/report/searchByLogic",
                    }).done((xhr) => {
                        if (xhr.status === EnumStatus.OK) {
                            let counter = pageSize * (pageIndex - 1) + 1;
                            // xhr.data.counter = function () {
                            //     return function (text, render) {
                            //         return counter++;
                            //     }
                            // }
                            xhr.data.result = this.parseDataReport(xhr.data.records, xhr.data.selectedColumns, xhr.data.communes, xhr.data.districts, xhr.data.provinces, xhr.data.domains);
                            xhr.data.result.forEach(x => {
                                x.counter = counter++;
                            });
                            resolve({
                                content: Handlebars.compile(BaoCaoTuyChonTemplate)(xhr.data),
                                pageCount: xhr.data.pageCount,
                                totalCount: xhr.data.totalCount
                            });
                        }
                        OGUtils.hideLoading();
                    });
                }


            }

        });
    }

    public saveReport(name: string): Promise<unknown> {
        return new Promise((resolve, reject) => {
            OGUtils.showLoading();
            const tableColumnEditor = this.reportForm.getEditor("tableColumns") as dxSelectBox;
            const tableColumns = tableColumnEditor.option("selectedItems") as OGTableColumnModel[];
            $.ajax({
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    columns: tableColumns.map(item => {
                        return { column_id: item.id, report_id: 0 };
                    }),
                    layer_id: this.reportForm.getEditor("layer_id").option("value"),
                    params: JSON.stringify(this.reportFilterForm.option("formData")),
                    report_name: name || "Báo cáo không tên"
                }),
                dataType: "json",
                error: (xhr) => {
                    reject(xhr);
                },
                success: (xhr) => {
                    OGUtils.hideLoading();
                    resolve(xhr);
                },
                type: "POST",
                url: "/api/report/saveReport"
            });
        });
    }

    public showSaveReport(): void {
        this.popupSaveReport.show();
    }
}