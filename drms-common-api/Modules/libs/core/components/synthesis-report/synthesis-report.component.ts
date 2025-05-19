
import CustomStore, { ResolvedData } from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/button_group";
import "devextreme/ui/color_box";
import dxContextMenu from "devextreme/ui/context_menu";
import "devextreme/ui/context_menu";
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
import "devextreme/ui/text_box";
import dxToolbar from "devextreme/ui/toolbar";
import "devextreme/ui/toolbar";
import "devextreme/ui/tree_list";
import dxTreeList from "devextreme/ui/tree_list";
import "devextreme/ui/tree_view";
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
import "./synthesis-report.component.scss";
import BaoCaoTuyChonTemplate from "./templates/baocao_tuychon.hbs";
interface SynthesisReportOption {
    mapId: number,
    onExportChartClick: (SynthesisReportComponent) => void,
    onQueryReportClick: (SynthesisReportComponent) => void,
    schema?: string,
}
export default class SynthesisReportComponent implements IBaseComponent {
    colorToolbar: dxToolbar;
    commonFilterForm: dxForm;
    container: JQuery<HTMLElement>;
    contextMenu: dxContextMenu;
    createSynthesisPopup: dxPopup;
    currentReport: string;
    filterColumnForm: dxForm;
    formColor: dxForm;
    formCreateReport: dxForm;
    layerID: number;
    layerStore: CustomStore;
    mainAccordionContainer: JQuery<HTMLElement>;
    mapId: number;
    options: SynthesisReportOption;
    pageIndex: number;
    pageSize: number;
    popupSaveReport: dxPopup;
    reportContainer: JQuery<HTMLElement>;
    reportFilterForm: dxForm;
    reportForm: dxForm;
    reportToolbar: dxToolbar;
    reportView: dxMultiView;
    schema: string;
    selectedReport: OGSynthesisReportModel;
    synthesisReportContainer: JQuery<HTMLElement>;
    synthesisReportStore: CustomStore;
    synthesisReportTreeContainer: JQuery<HTMLElement>;
    synthesisReportTreeList: dxTreeList;
    constructor(container: JQuery<HTMLElement>, opts: SynthesisReportOption) {
        this.schema = opts.schema;
        this.mapId = opts.mapId;
        this.options = opts;
        this.container = container;
        this.pageIndex = 1;
        this.pageSize = 10;
        this.onInit();
    }
    private bindAvailableReport(data): void {
        ReportService.get(data.id).then(result => {
            if (result) {
                this.selectedReport = result;
                this.commonFilterForm.option("formData", result);
                const layerEditor = this.commonFilterForm.getEditor("layer_id") as dxSelectBox;
                if (layerEditor) {
                    layerEditor.option("value", result.layer_id);
                }
                const tableColumnEditor = this.commonFilterForm.getEditor("tableColumns") as dxTagBox;
                if (tableColumnEditor && result.visible_columns) {
                    const visible_columns = result.visible_columns.split(",").map(x => parseInt(x));
                    tableColumnEditor.option("value", visible_columns);
                }
                const tableColumnFiltersEditor = this.filterColumnForm.getEditor("tableColumnFilters") as dxTagBox;
                if (tableColumnFiltersEditor && result.filter_columns) {
                    const filter_columns = result.filter_columns.split(",").map(x => parseInt(x));
                    tableColumnFiltersEditor.option("value", filter_columns);
                }
            }
        });
    }
    private initLayout(container: JQuery<HTMLElement>): void {
        const self = this;
        $(document).on("click", ".undo-map", function () {
            const pathname = window.location.pathname;
            const url = pathname.substr(0, pathname.lastIndexOf("/")) + "/data";
            window.location.assign(url);
        });

        this.synthesisReportTreeContainer = $("<div />").addClass("synthesis-report-tree").appendTo(container)
            .height("100%")
            .css("width", "50%")
            .css("padding", "5px")
            .css("float", "left");
        this.synthesisReportContainer = $("<div />").appendTo(container)
            .height(window.innerHeight - $("#header").outerHeight() - 15)
            .css("margin-left", "50%")
            .css("padding", "5px")
            .css("border-left", "1px solid #ddd");

        this.synthesisReportTreeContainer.append("<span class=\"maintenance-title\">THIẾT LẬP BÁO CÁO</span>");

        // this.synthesisReportTreeList = $("<div />").addClass("report-tree-list").appendTo(this.synthesisReportTreeContainer).dxTreeList({
        //     columnAutoWidth: false,
        //     columns: [{
        //         caption: "Tên báo cáo",
        //         dataField: "text"
        //     }, {
        //         caption: "Người tạo",
        //         dataField: "raw.created_by",
        //         width: 100
        //     }, {
        //         alignment: "center",
        //         caption: "Ngày tạo",
        //         dataField: "raw.created_at",
        //         dataType: "date",
        //         width: 120
        //     },{
        //         alignment: "center",
        //         allowEditing: false,
        //         caption: "",
        //         cellTemplate: (container, options) => {
        //             $("<div>").appendTo(container).dxToolbar({
        //                 items: [{
        //                     location: "center",
        //                     options: {
        //                         hint: "Xóa báo cáo",
        //                         icon: "icon icon-trash",
        //                         onClick: (e) => {
        //                             const data = options.data;
        //                             if (data) {
        //                                 OGUtils.confirm("Xác nhận xóa báo cáo này?").then(_ => {
        //                                     if (_) {
        //                                         ReportService.delete(data).then(result => {
        //                                             if (result && result.status === EnumStatus.OK) {
        //                                                 OGUtils.alert("Xóa báo cáo thành công!");
        //                                                 this.synthesisReportTreeList.getDataSource().reload();
        //                                             } else {
        //                                                 OGUtils.error("Đã xảy ra lỗi, vui lòng thử lại!");
        //                                             }
        //                                         });
        //                                     }
        //                                 });
        //                             }
        //                         },
        //                         type: "danger",
        //                         visible: (options.data.type === "@report"),
        //                     },
        //                     widget: "dxButton"
        //                 }]
        //             });
        //         },
        //         dataField: "id",
        //         width: 50
        //     }],
        //     dataSource: new DataSource({
        //         key: "id",
        //         store: new CustomStore({
        //             load: (loadOptions) => {
        //                 const deferred = $.Deferred();
        //                 ReportService.getTree({ map_id: this.mapId }).then(treeItems => {
        //                     deferred.resolve({
        //                         data: treeItems,
        //                         totalCount: treeItems.length
        //                     });
        //                 });
        //                 return deferred.promise();
        //             }
        //         })
        //     }),
        //     dataStructure: "tree",
        //     height: "100%",
        //     itemsExpr: "items",
        //     keyExpr: "id",
        //     noDataText: "Không có dữ liệu",
        //     onSelectionChanged: (e) => {
        //         const selectedRows = e.selectedRowsData;
        //         if (selectedRows && selectedRows.length > 0) {
        //             const selectedRow = selectedRows[0];
        //             if (selectedRow.type === "@report") {
        //                 self.bindAvailableReport(selectedRow.raw);
        //             }
        //         }
        //     },
        //     selection: {
        //         mode: "single",
        //     },
        //     showRowLines: true,
        //     toolbar: {
        //         items: [{
        //             location: "before",
        //             options: {
        //                 hint: "Tạo mới báo cáo",
        //                 icon: "icon icon-add",
        //                 onClick: () => {
        //                     this.synthesisReportTreeList.getDataSource().reload();
        //                 },
        //             },
        //             widget: "dxButton"
        //         }, {
        //             location: "after",
        //             options: {
        //                 hint: "Làm mới",
        //                 icon: "icon icon-refresh",
        //                 onClick: () => {
        //                     this.synthesisReportTreeList.getDataSource().reload();
        //                 },
        //             },
        //             widget: "dxButton"
        //         }]
        //     },
        //     width: "100%"
        // }).dxTreeList("instance");

        this.reportForm = $("<div />").appendTo(this.synthesisReportTreeContainer).css("padding", "10px").dxForm({
            items: [{
                colSpan: 2,
                itemType: "group",
                items: [{
                    template: () => {
                        return "<span class= \"dx-form dx-field-item-label\" >B1. Chọn báo cáo có sẵn</span>";
                    }
                }, {
                    dataField: "report_id",
                    editorOptions: {
                        dataSource: {
                            pageSize: 25,
                            paginate: true,
                            store: new CustomStore({
                                byKey: (key) => {
                                    return key;
                                },
                                load: (options) => {
                                    const args: { [key: string]: number | string } = {};
                                    args.skip = options.skip ? options.skip : 0;
                                    args.take = options.take ? options.take : 25;
                                    args.layer_id = this.layerID;
                                    args.map_id = this.mapId;
                                    return new Promise((resolve) => {
                                        ReportService.list(args).then(result => {
                                            if (result && result.status === EnumStatus.OK) {
                                                resolve(result.data);
                                            } else {
                                                resolve([]);
                                            }
                                        });
                                    });
                                },
                                loadMode: "raw"
                            })
                        },
                        displayExpr: "report_name",
                        onContentReady: () => {
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                $ele.attr("title", $ele.text());
                            });
                        },
                        onSelectionChanged: (e) => {
                            if (e.selectedItem) {
                                self.bindAvailableReport(e.selectedItem);
                            } else {
                                this.selectedReport = undefined;
                                this.commonFilterForm.resetValues();
                                this.filterColumnForm.resetValues();
                                this.formCreateReport.resetValues();
                            }
                        },
                        placeholder: "[Chọn báo cáo có sẵn]",
                        searchEnabled: true,
                        showClearButton: true,
                        valueExpr: "id",
                    },
                    editorType: "dxSelectBox",
                    label: {
                        text: "Báo cáo đã tạo"
                    }
                }]
            }],
            labelLocation: "top",
        }).dxForm("instance");

        this.commonFilterForm = $("<div />").appendTo(this.synthesisReportTreeContainer).css("padding", "10px").dxForm({
            items: [{
                colSpan: 2,
                itemType: "group",
                items: [{
                    template: () => {
                        return "<span class= \"dx-form dx-field-item-label\" >B1a. Hoặc tạo báo cáo mới</span>";
                    }
                }, {
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
                            OGUtils.showLoading();
                            const columnTagBox = this.commonFilterForm.getEditor("tableColumns");
                            if (columnTagBox && columnTagBox instanceof dxTagBox) {
                                columnTagBox.getDataSource().reload();
                                columnTagBox.reset();
                            }
                            const filterColumnTagBox = this.filterColumnForm.getEditor("tableColumnFilters");
                            if (filterColumnTagBox && filterColumnTagBox instanceof dxTagBox) {
                                filterColumnTagBox.getDataSource().reload();
                                filterColumnTagBox.reset();
                            }
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
                                    const layerEditor = this.commonFilterForm.getEditor("layer_id");
                                    if (layerEditor && layerEditor instanceof dxSelectBox) {
                                        const selectedLayer = layerEditor.option("selectedItem");
                                        if (selectedLayer) {
                                            const layerColumns = selectedLayer.table.columns.filter(s => s.visible);
                                            const tableColumnEditor = this.commonFilterForm.getEditor("tableColumns");
                                            if (tableColumnEditor && tableColumnEditor instanceof dxSelectBox) {
                                                tableColumnEditor.open();
                                                tableColumnEditor.close();
                                            }
                                            deferred.resolve(layerColumns);
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
                }]
            }],
            labelLocation: "top",
            // labelMode: "static"
        }).dxForm("instance");

        // this.synthesisReportContainer.append("<p class=\"maintenance-title\">THIẾT LẬP BÁO CÁO</p>");
        this.reportToolbar = $("<div />").appendTo(this.synthesisReportContainer)
            .dxToolbar({
                items: [{
                    location: "after",
                    options: {
                        onClick: () => {
                            if (this.options.onQueryReportClick) {
                                this.options.onQueryReportClick(this);
                            }
                        },
                        stylingMode: "contained",
                        text: "Tạo lập báo cáo",
                        type: "success"
                    },
                    widget: "dxButton"
                }]
            }).css("padding-bottom", "10px").dxToolbar("instance");

        this.initMainAccordion(this.synthesisReportContainer);
    }
    private initMainAccordion(container): void {
        const self = this;
        // $("<div />").addClass("report-toolbar-title").appendTo(container);
        // $(".report-toolbar-title").css("border-bottom", "1px solid rgb(153, 153, 153,0.3)");

        $(".dx-toolbar-items-container").find(".dx-toolbar-before").css("font-size", "17px");
        const filterColumnFormContainer = $("<div />").addClass("report-form").appendTo(container);

        this.filterColumnForm = $("<div />").appendTo(filterColumnFormContainer).css("padding", "0px").dxForm({
            formData: {
                tableColumnFilters: "",
            },
            items: [{
                colSpan: 2,
                itemType: "group",
                items: [{
                    template: () => {
                        return "<span class= \"dx-form dx-field-item-label\" >B2. Chọn điều kiện lọc</span>";
                    }
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
                                    const layerEditor = this.commonFilterForm.getEditor("layer_id");
                                    if (layerEditor && layerEditor instanceof dxSelectBox) {
                                        const selectedLayer: OGLayerModel = layerEditor.option("selectedItem");
                                        if (selectedLayer) {
                                            const layerColumns = selectedLayer.table.columns.filter(s => s.visible && s.is_searchable);
                                            deferred.resolve(layerColumns);
                                            const tableColumnFilterEditor = this.filterColumnForm.getEditor("tableColumnFilters");
                                            if (tableColumnFilterEditor && tableColumnFilterEditor instanceof dxSelectBox) {
                                                tableColumnFilterEditor.open();
                                                tableColumnFilterEditor.close();
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
                            this.bindFilterForm(selectedColumns);
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
                },]
            }],
            labelLocation: "top",
            // labelMode: "static"
        }).dxForm("instance");

        const reportFilterFormContainer = $("<div />").addClass("report-filter-form").appendTo(container);
        this.reportFilterForm = $("<div />").css({ "padding": "10px" })
            .appendTo(reportFilterFormContainer)
            .dxForm({
                colCount: 2,
                formData: {},
                items: [],
                labelLocation: "top",
                scrollingEnabled: false,
            }).dxForm("instance");

        // this.reportToolbar = $("<div />").appendTo(tbContainer)
        //     .dxToolbar({
        //         items: [{
        //             location: "center",
        //             options: {
        //                 onClick: () => {
        //                     if (this.options.onQueryReportClick) {
        //                         this.options.onQueryReportClick(this);
        //                     }
        //                 },
        //                 stylingMode: "contained",
        //                 text: "Xuất báo cáo",
        //                 type: "default"
        //             },
        //             widget: "dxButton"
        //         }, {
        //             location: "center",
        //             options: {
        //                 onClick: () => {
        //                     this.export();
        //                 },
        //                 stylingMode: "contained",
        //                 text: "Xuất excel",
        //                 type: "success"
        //             },
        //             widget: "dxButton"
        //         },]
        //     }).css("padding-bottom", "10px").dxToolbar("instance");

        setInterval(() => {
            reportFilterFormContainer.css({
                "height": container.height() - this.filterColumnForm.element().outerHeight() - this.reportToolbar.element().outerHeight() - 50,
                "overflow-y": "auto",
            });
        }, 500);
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
        const items_category = [];
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
                                    store: new CustomStore({
                                        key: "area_id",
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
                                    store: new CustomStore({
                                        key: "area_id",
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
                                        key: "area_id",
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
                                        byKey: (key) => {
                                            return key;
                                        },
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
                    }
                }
                formItems = $.merge(formItems, filterFormItems);
            });
        }
        if (this.reportFilterForm) {
            this.reportFilterForm.beginUpdate();
            this.reportFilterForm.option("items", formItems);
            this.reportFilterForm.endUpdate();
            if (this.selectedReport && this.selectedReport.filter_params) {
                const params = JSON.parse(this.selectedReport.filter_params);
                this.reportFilterForm.option("formData", params);
                this.selectedReport.filter_params = undefined;
            }
        }
    }

    public export(): void {
        if (!this.commonFilterForm.getEditor("layer_id").option("selectedItem")) {
            OGUtils.alert("Vui lòng chọn lớp báo cáo!");
            return;
        }

        const tableColumnEditor = this.commonFilterForm.getEditor("tableColumns") as dxSelectBox;
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
            this.commonFilterForm.getEditor(key.toString());
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
            layer_id: this.commonFilterForm.getEditor("layer_id").option("selectedItem")["id"],
            params: param,
            selectedFields: columnSelectBox
        }, "application/json; charset=utf-8");
    }

    public getSynthesisReportTree(): dxTreeList {
        return this.synthesisReportTreeList;
    }

    onInit(): void {
        this.synthesisReportStore = new CustomStore({
            byKey: (key) => {
                return ReportService.get(key);
            },
            insert: (values) => {
                const def = $.Deferred();
                values.map_id = this.mapId;
                ReportService.insert(values).then(result => {
                    def.resolve(result);
                });
                return def.promise();
            },
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred(),
                    args: { [key: string]: number | string } = {};

                if (loadOptions.sort) {
                    args.orderby = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        args.orderby += " desc";
                }
                args.skip = loadOptions.skip ? loadOptions.skip : 0;
                args.take = loadOptions.take ? loadOptions.take : 50;
                args.layer_id = this.layerID;
                args.map_id = this.mapId;
                ReportService.list(args).then(result => {
                    if (result && result.status === EnumStatus.OK) {
                        deferred.resolve(result);
                    } else {
                        deferred.resolve({
                            data: [],
                            totalCount: 0
                        });
                    }
                });
                return deferred.promise();
            },
            remove: (key) => {
                const def = $.Deferred();
                ReportService.delete({ id: key }).then(result => {
                    def.resolve(result);
                });
                return def.promise();
            },
            update: (key, values) => {
                return ReportService.insert(values);
            },
        });
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
            if (!this.commonFilterForm.getEditor("layer_id").option("selectedItem")) {
                OGUtils.alert("Vui lòng chọn lớp báo cáo!");
                resolve({});
            } else {
                const columnSelectBox: OGTableColumnModel[] = this.commonFilterForm.getEditor("tableColumns").option("selectedItems") as OGTableColumnModel[];
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
                        this.commonFilterForm.getEditor(key.toString());
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
                            layer_id: this.commonFilterForm.getEditor("layer_id").option("selectedItem")["id"],
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
    public saveReport(data: OGSynthesisReportModel): void {
        OGUtils.showLoading();
        data.map_id = this.mapId;
        const tableColumnEditor = this.commonFilterForm.getEditor("tableColumns") as dxTagBox;
        const tableColumnFilterEditor = this.filterColumnForm.getEditor("tableColumnFilters") as dxTagBox;
        if (tableColumnEditor) {
            const tableColumns = tableColumnEditor.option("selectedItems") as OGTableColumnModel[];
            data.visible_columns = tableColumns.map(item => item.id).toString();
        }
        if (tableColumnFilterEditor) {
            const tableColumnFilters = tableColumnFilterEditor.option("selectedItems") as OGTableColumnModel[];
            data.filter_columns = tableColumnFilters.map(item => item.id).toString();
        }
        data.layer_id = this.commonFilterForm.getEditor("layer_id").option("value");
        data.filter_params = JSON.stringify(this.reportFilterForm.option("formData"));
        data.report_name = data.report_name || "Báo cáo không tên";
        ReportService.insert(data).then(result => {
            OGUtils.hideLoading();
            this.popupSaveReport.hide();
            // this.synthesisReportTreeList.getDataSource().reload();
        });
    }

    public showSaveReport(): void {
        this.popupSaveReport.show();
        if (this.formCreateReport) {
            this.formCreateReport.resetValues();
            this.formCreateReport.option("formData", this.selectedReport);
        }
    }
}