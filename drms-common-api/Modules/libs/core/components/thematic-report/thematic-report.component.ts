
import CustomStore, { ResolvedData } from "devextreme/data/custom_store";
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
import dxTagBox from "devextreme/ui/tag_box";
import "devextreme/ui/tag_box";
import "devextreme/ui/text_area";
import "devextreme/ui/text_box";
import dxToolbar from "devextreme/ui/toolbar";
import "devextreme/ui/toolbar";
import Handlebars from "handlebars";

import { EnumDataType, EnumStatus, EnumTypeOf } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { AreaModel } from "../../models/area.model";
import { OGLayerModel } from "../../models/layer.model";
import { OGSynthesisReportModel } from "../../models/report.model";
import { OGTableColumnModel } from "../../models/table.model";
import { AreaService } from "../../services/area.service";
import { ReportService } from "../../services/report.service";
import { TableColumnService, TableService } from "../../services/table.service";
import { IBaseComponent } from "../base-component.abstract";
import SynthesisReportComponent from "../synthesis-report/synthesis-report.component";
import BaoCaoTuyChonTemplate from "./templates/baocao_tuychon.hbs";
import "./thematic-report.component.scss";

interface ThematicReportOption {
    mapId?: number,
    onExportChartClick: (ThematicReportComponent) => void,
    onQueryReportClick: (ThematicReportComponent) => void,
    schema?: string,
    synthesisReportComponent?: SynthesisReportComponent
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
    chartFormContainer: JQuery<HTMLElement>;
    chartToolbar: dxToolbar;
    colorToolbar: dxToolbar;
    container: JQuery<HTMLElement>;
    formChartType: dxForm;
    formColor: dxForm;
    formCreateReport: dxForm;
    labelColumn: OGTableColumnModel;
    layerStore: CustomStore;
    mapId: number;
    options: ThematicReportOption;
    popupColor: dxPopup;
    popupSaveReport: dxPopup;
    reportFilterForm: dxForm;
    reportFilterFormContainer: JQuery<HTMLElement>;
    reportForm: dxForm;
    reportFormMultiview: dxMultiView;
    reportToolbar: dxToolbar;
    schema: string;
    synthesisReportComponent: SynthesisReportComponent;
    constructor(container: JQuery<HTMLElement>, opts: ThematicReportOption) {
        this.schema = opts.schema;
        this.mapId = opts.mapId;
        this.options = opts;
        this.synthesisReportComponent = opts.synthesisReportComponent;
        this.container = container;
        this.onInit();
    }
    private bindCountBySelectBox(): void {
        const layerEditor = this.reportForm.getEditor("layer_id");
        if (layerEditor && layerEditor instanceof dxSelectBox) {
            const selectedLayer = layerEditor.option("selectedItem");
            if (selectedLayer) {
                const items_count = [];
                const layerColumns = selectedLayer.table.columns.filter(s => s.is_identity == false && s.lookup_table_id === 0 && s.is_searchable && s.visible);
                layerColumns.forEach((column) => {
                    if (column.data_type === EnumDataType.integer || column.data_type === EnumDataType.double || column.data_type === EnumDataType.smallint) {
                        items_count.push(column);
                    }
                });
                if (this.formChartType) {
                    this.formChartType.beginUpdate();
                    this.formChartType.getEditor("count_by").option("items", items_count);
                    this.formChartType.getEditor("count_by").option("value", null);
                    this.formChartType.endUpdate();
                }
            }
        }
    }

    private bindFeatureSelectBox(): void {
        const layerEditor = this.reportForm.getEditor("layer_id");
        if (layerEditor && layerEditor instanceof dxSelectBox) {
            const selectedLayer = layerEditor.option("selectedItem");
            if (selectedLayer) {
                this.labelColumn = selectedLayer.table.labelColumn ? selectedLayer.table.labelColumn : selectedLayer.table.identifyColumn;
                const featureSelectBox = this.formChartType.getEditor("feature_id");
                if (featureSelectBox instanceof dxTagBox) {
                    featureSelectBox.getDataSource().reload();
                }
            }
        }
    }

    private bindGroupBySelectBox(): void {
        const layerEditor = this.reportForm.getEditor("layer_id");
        if (layerEditor && layerEditor instanceof dxSelectBox) {
            const selectedLayer = layerEditor.option("selectedItem");
            if (selectedLayer) {
                const items_category = [];
                const layerColumns = selectedLayer.table.columns.filter(s => s.is_identity == false && s.is_searchable && s.visible);
                layerColumns.forEach((column) => {
                    if (column.lookup_table_id > 0 || column.column_name === "province_code" || column.column_name == "district_code" || column.column_name == "commune_code") {
                        items_category.push(column);
                    }
                });
                if (this.formChartType) {
                    this.formChartType.beginUpdate();
                    this.formChartType.getEditor("group_by").option("items", items_category);
                    this.formChartType.getEditor("group_by").option("value", null);
                    this.formChartType.endUpdate();
                }
            }
        }
    }

    private initLayout(container: JQuery<HTMLElement>): void {
        const self = this;
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

        this.reportForm = $("<div />").appendTo(reportFormContainer).css("padding", "10px").dxForm({
            formData: {
                chartGroupBy: "",
                layer_id: 0,
                mode: "table",
                tableColumnFilters: "",
                tableColumnGroups: "",
                tableColumns: ""
            },
            items: [{
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
                            group: "table.table_schema_info.description",
                            store: this.layerStore
                        },
                        displayExpr: "name_vn",
                        grouped: true,
                        onContentReady: () => {
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                $ele.attr("title", $ele.text());
                            });
                        },
                        onValueChanged: (e) => {
                            console.log(e);
                            OGUtils.showLoading();
                            const selectedLayer = e.component.option("selectedItem") as OGLayerModel;
                            const layerColumns = selectedLayer.table.columns.filter(s => s.visible);
                            const columnTagBox = this.reportForm.getEditor("tableColumns");
                            if (columnTagBox && columnTagBox instanceof dxTagBox) {
                                if (columnTagBox.getDataSource()) {
                                    columnTagBox.getDataSource().reload();
                                    columnTagBox.reset();
                                }
                            }
                            const filterColumnTagBox = this.reportForm.getEditor("tableColumnFilters");
                            if (filterColumnTagBox && filterColumnTagBox instanceof dxTagBox) {
                                if (filterColumnTagBox.getDataSource()) {
                                    filterColumnTagBox.getDataSource().reload();
                                    filterColumnTagBox.reset();
                                }
                            }
                            const groupColumnTagBox = this.reportForm.getEditor("tableColumnGroups");
                            if (groupColumnTagBox && groupColumnTagBox instanceof dxTagBox) {
                                if (groupColumnTagBox.getDataSource()) {
                                    groupColumnTagBox.getDataSource().reload();
                                    groupColumnTagBox.reset();
                                    const districtColumns = layerColumns.filter(x => x.column_name === "district_code");
                                    const tuyenColumns = layerColumns.filter(x => x.column_name.includes("matuyen"));
                                    groupColumnTagBox.option("value", $.merge(districtColumns, tuyenColumns));
                                }
                            }
                            self.bindGroupBySelectBox();
                            self.bindCountBySelectBox();
                            self.bindFeatureSelectBox();
                            OGUtils.hideLoading();
                        },
                        placeholder: "[Chọn lớp dữ liệu]",
                        searchEnabled: true,
                        searchExpr: "name_vn",
                        searchMode: "contains",
                        valueExpr: "id",
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
                                this.reportForm.itemOption("tableColumnFilters", "visible", true);
                                const tableColumnEditor = this.reportForm.getEditor("tableColumns");
                                if (tableColumnEditor && tableColumnEditor instanceof dxSelectBox) {
                                    tableColumnEditor.getDataSource().reload();
                                }
                                this.reportFormMultiview.option("selectedIndex", 0);
                            } else if (e.value === "chart") {
                                this.reportForm.itemOption("tableColumns", "visible", false);
                                this.reportForm.itemOption("tableColumnFilters", "visible", false);
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
                                            // const tableColumnEditor = this.reportForm.getEditor("tableColumns");
                                            // if (tableColumnEditor && tableColumnEditor instanceof dxTagBox) {
                                            //     tableColumnEditor.open();
                                            //     tableColumnEditor.close();
                                            // }
                                        } else {
                                            deferred.resolve([]);
                                        }
                                    } else {
                                        deferred.resolve([]);
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
                    },
                    editorType: "dxTagBox",
                    label: {
                        text: "Trường thông tin hiển thị"
                    },
                }, {
                    dataField: "tableColumnGroups",
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
                                            const tableColumnGroupEditor = this.reportForm.getEditor("tableColumnGroups");
                                            if (tableColumnGroupEditor && tableColumnGroupEditor instanceof dxTagBox) {
                                                tableColumnGroupEditor.open();
                                                tableColumnGroupEditor.close();
                                            }
                                        } else {
                                            deferred.resolve([]);
                                        }
                                    } else {
                                        deferred.resolve([]);
                                    }

                                    return deferred.promise();
                                },
                                loadMode: "raw",
                            })
                        },
                        displayExpr: "name_vn",
                        maxDisplayedTags: 2,
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
                        onSelectionChanged: (e) => {
                            const selectedColumns = e.component.option("selectedItems");
                            // self.bindFilterForm(selectedColumns);
                        },
                        placeholder: "[Tất cả]",
                        searchEnabled: true,
                        searchExpr: ["name_vn"],
                        searchMode: "contains",
                        showDropDownButton: true,
                        showSelectionControls: true,
                        valueExpr: "id",
                    },
                    editorType: "dxTagBox",
                    label: {
                        text: "Nhóm theo",
                    },
                    visible: false
                }, {
                    dataField: "tableColumnFilters",
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
                                            // const tableColumnFilterEditor = this.reportForm.getEditor("tableColumnFilters");
                                            // if (tableColumnFilterEditor && tableColumnFilterEditor instanceof dxSelectBox) {
                                            //     tableColumnFilterEditor.open();
                                            //     tableColumnFilterEditor.close();
                                            // }
                                        } else {
                                            deferred.resolve([]);
                                        }
                                    } else {
                                        deferred.resolve([]);
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
                        onSelectionChanged: (e) => {
                            const selectedColumns = e.component.option("selectedItems");
                            self.bindFilterForm(selectedColumns);
                        },
                        placeholder: "[Tất cả]",
                        searchEnabled: true,
                        searchExpr: ["name_vn"],
                        searchMode: "contains",
                        showDropDownButton: true,
                        showSelectionControls: true,
                        valueExpr: "id",
                    },
                    editorType: "dxTagBox",
                    label: {
                        text: "Trường thông tin lọc dữ liệu",
                    },
                }, {
                    template: () => {
                        return "<hr style=\"margin: 5px 0;\" />";
                    }
                }]
            }],
            labelLocation: "top",
        }).dxForm("instance");

        this.reportFormMultiview = $("<div />").appendTo(reportFormMultiviewContainer).dxMultiView({
            deferRendering: false,
            height: container.height() - this.reportForm.element().outerHeight(),
            items: [{
                template: (data, index, element) => {
                    this.reportFilterFormContainer = $("<div />").addClass("report-filter-form").appendTo(element);
                    const tbContainer = $("<div />").addClass("report-toolbar").appendTo(element);

                    this.reportFilterForm = $("<div />").css({ "padding": "10px" })
                        .appendTo(this.reportFilterFormContainer)
                        .dxForm({
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
                            }]
                        }).css("padding-bottom", "10px").dxToolbar("instance");

                    this.reportFilterFormContainer.css({
                        "height": element.height() - this.reportToolbar.element().outerHeight() - 10,
                        "overflow-y": "auto",
                    });
                }
            }, {
                template: (data, index, element) => {
                    this.chartFormContainer = $("<div />").appendTo(element);
                    const tbContainer = $("<div />").appendTo(element);

                    this.formChartType = $("<div />").css("padding", "10px")
                        .appendTo(this.chartFormContainer)
                        .dxForm({
                            formData: {},
                            items: [{
                                caption: "Tùy chỉnh biểu đồ",
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
                                                const formItems = [];
                                                const formData = {};
                                                if (e.selectedItem) {
                                                    OGUtils.showLoading();
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

                                                            }
                                                            OGUtils.hideLoading();
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
                                                    this.chartToolbar.option("items[2].options.disabled", false);
                                                } else {
                                                    const countByEditor = this.formChartType.getEditor("count_by");
                                                    if (countByEditor instanceof dxSelectBox) {
                                                        if (!countByEditor.option("selectedItem") && (!e.selectedItem)) {
                                                            this.chartToolbar.option("items[0].options.disabled", true);
                                                            this.chartToolbar.option("items[1].options.disabled", true);
                                                            this.chartToolbar.option("items[2].options.disabled", true);
                                                            return;
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        placeholder: "[Chọn nhóm]",
                                        showClearButton: true,
                                        valueExpr: "id"
                                    },
                                    editorType: "dxSelectBox",
                                    label: {
                                        text: "Nhóm"
                                    }
                                }, {
                                    dataField: "count_by",
                                    editorOptions: {
                                        displayExpr: "name_vn",
                                        onSelectionChanged: (e) => {
                                            if (e.selectedItem) {
                                                this.chartToolbar.option("items[0].options.disabled", false);
                                                this.chartToolbar.option("items[1].options.disabled", this.formChartType.option("formData").chart_type !== "pie-chart");
                                                this.chartToolbar.option("items[2].options.disabled", false);
                                            } else {
                                                const groupByEditor = this.formChartType.getEditor("group_by");
                                                if (groupByEditor instanceof dxSelectBox) {
                                                    if (!groupByEditor.option("selectedItem") && (!e.selectedItem)) {
                                                        this.chartToolbar.option("items[0].options.disabled", true);
                                                        this.chartToolbar.option("items[1].options.disabled", true);
                                                        this.chartToolbar.option("items[2].options.disabled", true);
                                                        return;
                                                    }
                                                }
                                            }
                                        },
                                        placeholder: "[Chọn tiêu chí]",
                                        showClearButton: true,
                                        valueExpr: "id",
                                    },
                                    editorType: "dxSelectBox",
                                    label: {
                                        text: "Tiêu chí"
                                    }
                                }, {
                                    dataField: "feature_id",
                                    editorOptions: {
                                        dataSource: {
                                            pageSize: 25,
                                            paginate: true,
                                            store: new CustomStore({
                                                load: (options) => {
                                                    return new Promise((resolve) => {
                                                        TableColumnService.listDistinctValues(this.labelColumn, options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                            resolve({
                                                                data: data.data,
                                                                totalCount: data.recordsTotal
                                                            });
                                                        });
                                                    });
                                                },
                                            })
                                        },
                                        onSelectionChanged: (e) => {

                                        },
                                        placeholder: "[Chọn đối tượng]",
                                        showClearButton: true,
                                        valueExpr: "id",
                                    },
                                    editorType: "dxSelectBox",
                                    label: {
                                        text: "Đối tượng"
                                    },
                                    visible: false
                                }]
                            },],
                            labelLocation: "top",
                            onContentReady: (e) => {
                                e.element.find(".dx-form-group-caption").css("font-size", "16px");
                            },
                            showColonAfterLabel: true
                        }).dxForm("instance");

                    this.chartToolbar = $("<div />").appendTo(tbContainer)
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
                        }).css("padding-bottom", "10px").dxToolbar("instance");


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
                        colSpan: 2,
                        template: (itemData, itemElement) => {
                            $("<div />").appendTo(itemElement)
                                .dxToolbar({
                                    items: [{
                                        location: "center",
                                        options: {
                                            onClick: () => {
                                                const validate = this.formCreateReport.validate();
                                                if (validate && validate.brokenRules.length === 0) {
                                                    const data = this.formCreateReport.option("formData");
                                                    this.saveReport(data);
                                                }
                                            },
                                            stylingMode: "contained",
                                            text: "Lưu",
                                            type: "default"
                                        },
                                        widget: "dxButton"
                                    }, {
                                        location: "center",
                                        options: {
                                            onClick: () => {
                                                this.popupSaveReport.hide();
                                            },
                                            stylingMode: "contained",
                                            text: "Hủy",
                                            type: "danger"
                                        },
                                        widget: "dxButton"
                                    }]
                                });
                        }
                    }],
                    labelLocation: "top",
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
            title: "Nhập thông tin báo cáo: ",
            width: 400
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
                } else if (col.lookup_table_id > 0 && domains) {
                    const category = domains[col.column_name].filter(s => s.id == item[col.column_name]);
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
    public bindFilterForm(columns: OGTableColumnModel[]): void {
        let formItems = [];
        if (columns.length) {
            columns.forEach((column) => {
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
                    } else if (column.lookup_table_id > 0) {
                        filterFormItems.push({
                            dataField: column.column_name,
                            editorOptions: {
                                dataSource: {
                                    key: "id",
                                    pageSize: 25,
                                    paginate: true,
                                    store: new CustomStore({
                                        byKey: (key) => {
                                            return new Promise<ResolvedData>((resolve) => {
                                                $.get(`/api/table/short-data/${column.lookup_table_id}/${key}`).done(xhr => {
                                                    if (xhr.status === EnumStatus.OK) {
                                                        resolve(xhr.data);
                                                    }
                                                    else {
                                                        resolve({});
                                                    }
                                                });
                                            });
                                        },
                                        load: (options) => {
                                            return new Promise((resolve) => {
                                                TableService.shortDataPaged({ q: options.searchValue, skip: options.skip, table_id: column.lookup_table_id, take: options.take }).then(data => {
                                                    resolve({
                                                        data: data.data,
                                                        totalCount: data.recordsTotal
                                                    });
                                                });
                                            });
                                        }
                                    })
                                },
                                displayExpr: "mo_ta",
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
                                searchExpr: "mo_ta",
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
                    } else if (column.data_type === EnumDataType.integer || column.data_type === EnumDataType.double) {
                        if (column.column_name != "toado_x" && column.column_name != "toado_y") {
                            filterFormItems.push({
                                dataField: column.column_name + "_start",
                                editorOptions: {
                                    format: column.data_type === EnumDataType.integer ? ",##0" : ",##0.###",
                                },
                                editorType: "dxNumberBox",
                                label: {
                                    text: column.name_vn + " Từ"
                                }
                            });
                            filterFormItems.push({
                                dataField: column.column_name + "_end",
                                editorOptions: {
                                    format: column.data_type === EnumDataType.integer ? ",##0" : ",##0.###",
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
        }
        if (this.reportFilterForm) {
            this.reportFilterForm.beginUpdate();
            this.reportFilterForm.option("items", formItems);
            this.reportFilterForm.endUpdate();
        }
    }
    public export(): void {
        if (!this.reportForm.getEditor("layer_id").option("selectedItem")) {
            OGUtils.alert("Vui lòng chọn lớp báo cáo!");
            return;
        }

        const tableColumnEditor = this.reportForm.getEditor("tableColumns") as dxSelectBox;
        const columnSelectBox: OGTableColumnModel[] = tableColumnEditor.option("selectedItems") as OGTableColumnModel[];
        if (columnSelectBox.length == 0) {
            OGUtils.alert("Vui lòng chọn trường thông tin hiển thị!");
            return;
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
            let table_id: number = 0;
            let group_column_id: number = 0;
            let count_column_id: number = 0;
            let layer_name: string = "";
            let group_name: string = "";
            let count_name: string = "";

            const layerEditor = this.reportForm.getEditor("layer_id");
            if (layerEditor instanceof dxSelectBox) {
                if (!layerEditor.option("selectedItem")) {
                    OGUtils.alert("Vui lòng chọn lớp dữ liệu");

                } else {
                    table_id = layerEditor.option("selectedItem").table_info_id;
                    layer_name = layerEditor.option("selectedItem").name_vn.toLowerCase();
                    const groupByEditor = this.formChartType.getEditor("group_by");
                    if (groupByEditor instanceof dxSelectBox) {
                        if (groupByEditor.option("selectedItem")) {
                            group_column_id = groupByEditor.option("selectedItem").id;
                            group_name = groupByEditor.option("selectedItem").name_vn.toLowerCase();
                        }
                    }
                    const countByEditor = this.formChartType.getEditor("count_by");
                    if (countByEditor instanceof dxSelectBox) {
                        if (countByEditor.option("selectedItem")) {
                            count_column_id = countByEditor.option("selectedItem").id;
                            count_name = countByEditor.option("selectedItem").name_vn.toLowerCase();
                        }
                    }
                    const args = {
                        count_column_id: count_column_id,
                        group_column_id: group_column_id,
                        params: {},
                        table_id: table_id
                    };
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
                            let title = "";
                            let legend = "";
                            if (count_name) {
                                title = "Biểu đồ " + count_name;
                                legend = count_name;
                            } else if (group_name) {
                                title += "Biểu đồ số lượng " + layer_name + " theo " + group_name;
                                legend = "Số lượng " + layer_name;
                            }
                            resolve({
                                chart_type: this.formChartType.option("formData").chart_type,
                                colors: colors,
                                data: xhr.data,
                                legend: legend,
                                series: series,
                                title: title
                            });
                            OGUtils.hideLoading();
                        },
                        type: "post",
                        url: "/api/report/getChartData",
                    });
                }
            }
        });
    }

    onInit(): void {
        this.layerStore = new CustomStore({
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
        });
        this.initLayout(this.container);
        this.initPopupSaveReport();
    }

    public query(pageIndex: number, pageSize: number): Promise<unknown> {
        return new Promise((resolve, reject) => {
            if (!this.reportForm.getEditor("layer_id").option("selectedItem")) {
                OGUtils.alert("Vui lòng chọn lớp báo cáo!");
                resolve({});
            } else {
                const layerInfo = this.reportForm.getEditor("layer_id").option("selectedItem") as OGLayerModel;
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

                    // const groupColumns: OGTableColumnModel[] = this.reportForm.getEditor("tableColumnGroups").option("selectedItems") as OGTableColumnModel[];
                    const disColumn = layerInfo.table.columns.filter(o => o.column_name === "district_code");
                    const tuyenColumn = layerInfo.table.columns.filter(o => o.column_name.includes("matuyen"));
                    const groupFields = $.merge(disColumn, tuyenColumn);

                    OGUtils.showLoading();
                    $.ajax({
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify({
                            groupFields: groupFields,
                            layer_id: layerInfo.id,
                            pageIndex: pageIndex,
                            pageSize: pageSize,
                            params: param,
                            selectedFields: columnSelectBox,
                        }),
                        dataType: "json",
                        type: "POST",
                        url: "/api/report/searchByLogic",
                    }).done((xhr) => {
                        if (xhr.status === EnumStatus.OK) {
                            let counter = pageSize * (pageIndex - 1) + 1;
                            xhr.data.groupFields = groupFields;
                            if (groupFields.length > 0 && xhr.data.records.length > 0) {
                                let disName = xhr.data.districts.filter(x => x.area_id === xhr.data.records[0][groupFields[0].column_name]);
                                disName = disName && disName.length > 0 ? disName[0].name_vn : "";
                                xhr.data.groupCount = [];
                                xhr.data.groupCount.push(disName + " (" + xhr.data.groupSummary
                                    .filter(x => x[groupFields[0].column_name] === xhr.data.records[0][groupFields[0].column_name])
                                    .reduce((psum, o) => psum + o.count, 0) + " " + layerInfo.name_vn + ")");
                                if (groupFields.length === 2) {
                                    let gName = xhr.data.records[0][groupFields[1].column_name];
                                    if (xhr.data.domains[groupFields[1].column_name]) {
                                        gName = xhr.data.domains[groupFields[1].column_name].filter(x => x.id == xhr.data.records[0][groupFields[1].column_name]);
                                        gName = gName && gName.length > 0 ? gName[0].mo_ta : "";
                                    }
                                    xhr.data.groupCount.push(gName + " (" + xhr.data.groupSummary
                                        .filter(x => x[groupFields[0].column_name] === xhr.data.records[0][groupFields[0].column_name] && x[groupFields[1].column_name] === xhr.data.records[0][groupFields[1].column_name])
                                        .reduce((psum, o) => psum + o.count, 0) + " " + layerInfo.name_vn + ")");
                                }
                            }
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


    public saveReport(data: OGSynthesisReportModel): void {
        OGUtils.showLoading();
        data.map_id = this.mapId;
        const tableColumnEditor = this.reportForm.getEditor("tableColumns") as dxTagBox;
        const tableColumnFilterEditor = this.reportForm.getEditor("tableColumnFilters") as dxTagBox;
        if (tableColumnEditor) {
            const tableColumns = tableColumnEditor.option("selectedItems") as OGTableColumnModel[];
            data.visible_columns = tableColumns.map(item => item.id).toString();
        }
        if (tableColumnFilterEditor) {
            const tableColumnFilters = tableColumnFilterEditor.option("selectedItems") as OGTableColumnModel[];
            data.filter_columns = tableColumnFilters.map(item => item.id).toString();
        }
        data.layer_id = this.reportForm.getEditor("layer_id").option("value");
        data.filter_params = JSON.stringify(this.reportFilterForm.option("formData"));
        data.report_name = data.report_name || "Báo cáo không tên";
        ReportService.insert(data).then(result => {
            OGUtils.hideLoading();
            this.popupSaveReport.hide();
            this.formCreateReport.resetValues();
            if (this.synthesisReportComponent) {
                const synthesisReportTree = this.synthesisReportComponent.getSynthesisReportTree();
                synthesisReportTree.getDataSource().reload();
            }
        });
    }

    public showSaveReport(): void {
        const layer_id = this.reportForm.getEditor("layer_id").option("value");
        const tableColumns = this.reportForm.getEditor("tableColumns").option("value");
        if (layer_id && tableColumns && tableColumns.length) {
            this.popupSaveReport.show();
        } else if (!layer_id) {
            OGUtils.alert("Vui lòng chọn lớp dữ liệu!");
        } else {
            OGUtils.alert("Vui lòng chọn trường dữ liệu hiển thị");
        }
    }
}