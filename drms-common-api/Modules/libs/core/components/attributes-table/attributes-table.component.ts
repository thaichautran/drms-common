
import { OGMap, OGMapUtils } from "@opengis/map";
import axios from "axios";
import { GroupItem, LoadResult, LoadResultObject } from "devextreme/common/data/custom-store";
import { LoadOptions } from "devextreme/data";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/integration/jquery";
import dxButton from "devextreme/ui/button";
import "devextreme/ui/button_group";
import dxDataGrid, { Column, SummaryTotalItem } from "devextreme/ui/data_grid";
import dxDateBox from "devextreme/ui/date_box";
import "devextreme/ui/drop_down_box";
import dxForm from "devextreme/ui/form";
import dxNumberBox from "devextreme/ui/number_box";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/select_box";
import dxSelectBox from "devextreme/ui/select_box";
import dxTextBox from "devextreme/ui/text_box";
import "devextreme/ui/toolbar";
import { dxToolbarOptions } from "devextreme/ui/toolbar_types";
import $ from "jquery";
import { Feature } from "ol";

import { EnumDataType, EnumImportFileType, EnumStatus, EnumsFunction } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestError } from "../../models/base-response.model";
import { OGConfigModel } from "../../models/config.model";
import { OGLayerModel } from "../../models/layer.model";
import { OGTableColumnModel, OGTableModel } from "../../models/table.model";
import { AreaService } from "../../services/area.service";
import { FeatureService } from "../../services/feature.service";
import { LayerService } from "../../services/layer.service";
import { TableColumnService, TableService } from "../../services/table.service";
import { AttributesEditorComponent } from "../attributes-editor/attributes-editor.component";
import { IMapComponent } from "../base-component.abstract";
import { DataImportWindowComponent } from "../data-import-window/data-import-window.component";
import { IdentifyComponent } from "../identify/identify.component";

class AttributeTableOption {
    attributeEditors: AttributesEditorComponent;
    container: JQuery<HTMLElement>;
    identify: IdentifyComponent;
    oGConfig: OGConfigModel;
    showButton: boolean = true;
}

class AttributeTableComponent implements IMapComponent {
    approvedButton: dxButton;
    arguments: { [key: string]: number | object | string; };
    attributesEditor: AttributesEditorComponent;
    attributesGrid: dxDataGrid;
    attributesGridToolbarOptions: dxToolbarOptions;
    attributesStore: CustomStore;
    batchUpdateFeaturePopup: dxPopup;
    batchUpdateForm: dxForm;
    bulkEditButton: dxButton;
    checkQualityPopup: dxPopup;
    columnEditor: dxSelectBox;
    dataDomains: [];
    dataImportWindowComponent: DataImportWindowComponent;
    dataRelations: [];
    dateValueEditor: dxDateBox;
    deleteButton: dxButton;
    editButton: dxButton;
    identifyButton: dxButton;
    identifyComponent: IdentifyComponent;
    identityColumn: OGTableColumnModel;
    keyColumn: OGTableColumnModel;
    numberValueEditor: dxNumberBox;
    oGConfig: OGConfigModel;
    oGISLayer: OGLayerModel;
    oGISLayerID: number;
    oGISTable: OGTableModel;
    oGISTableID: number;
    oGMap: OGMap;
    options: AttributeTableOption;
    selectValueEditor: dxSelectBox;
    sendMailButton: dxButton;
    textValueEditor: dxTextBox;
    userClaims: [];
    zoomInButton: dxButton;
    constructor(oGMap, options: AttributeTableOption) {
        this.options = options;
        this.oGConfig = options?.oGConfig;
        this.oGMap = oGMap;
        this.identifyComponent = options?.identify;
        this.userClaims = [];
        this.attributesEditor = options?.attributeEditors;
        this.dataImportWindowComponent = new DataImportWindowComponent(this.oGMap);
        this.onInit();
    }
    private bindValueField(selectedItem: OGTableColumnModel): void {
        const items = [];
        let itemValue;
        if (selectedItem.lookup_table_id > 0) {
            itemValue = {
                dataField: "value",
                editorOptions: {
                    dataSource: {
                        key: "id",
                        store: new CustomStore({
                            load: () => {
                                return TableService.shortData({ table_id: selectedItem.lookup_table_id });
                            },
                            loadMode: "raw"
                        })
                    },
                    displayExpr: "mo_ta",
                    onContentReady: (e) => {
                        e.element.css("float", "left");
                        $(".dx-list-item-content").each(function () {
                            const $ele = $(this);
                            if (this.offsetWidth < this.scrollWidth) {
                                $ele.attr("title", $ele.text());
                            }
                        });
                        this.selectValueEditor = e.component;
                    },
                    placeholder: "[Chọn...]",
                    searchEnabled: true,
                    valueExpr: "id",
                },
                editorType: "dxSelectBox",
                label: {
                    location: "top",
                    text: "Giá trị chỉnh sửa"
                },
                validationRules: [{
                    message: "Vui lòng chọn giá trị chỉnh sửa",
                    type: "required"
                }]
            };
        } else {
            if (selectedItem.column_name == "province_code") {
                itemValue = {
                    dataField: "value",
                    editorOptions: {
                        dataSource: new DataSource({
                            key: "area_id",
                            store: new CustomStore({
                                load: async () => {
                                    return await AreaService.provinces();
                                },
                                loadMode: "raw"
                            }),
                        }),
                        displayExpr: "name_vn",

                        onContentReady: (e) => {
                            e.element.css("float", "left");
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                if (this.offsetWidth < this.scrollWidth) {
                                    $ele.attr("title", $ele.text());
                                }
                            });
                            this.selectValueEditor = e.component;
                        },
                        placeholder: "[Chọn...]",
                        searchEnabled: true,
                        valueExpr: "area_id",
                        width: "100%",
                    },
                    editorType: "dxSelectBox",
                    label: {
                        location: "top",
                        text: "Giá trị chỉnh sửa"
                    },
                    validationRules: [{
                        message: "Vui lòng chọn giá trị chỉnh sửa",
                        type: "required"
                    }]
                };
            } else if (selectedItem.column_name === "district_code") {
                itemValue = {
                    dataField: "value",
                    editorOptions: {
                        dataSource: new DataSource({
                            key: "area_id",
                            store: new CustomStore({
                                load: () => {
                                    const featureSelected = this.attributesGrid.getSelectedRowsData();
                                    const province_code = featureSelected[0]["province_code"] ? featureSelected[0]["province_code"] : "01";
                                    return AreaService.districts(province_code);
                                },
                                loadMode: "raw"
                            })
                        }),
                        displayExpr: "name_vn",
                        onContentReady: (e) => {
                            e.element.css("float", "left");
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                if (this.offsetWidth < this.scrollWidth) {
                                    $ele.attr("title", $ele.text());
                                }
                            });
                            this.selectValueEditor = e.component;
                        },
                        placeholder: "[Chọn...]",
                        searchEnabled: true,
                        valueExpr: "area_id",
                        width: "100%",
                    },
                    editorType: "dxSelectBox",
                    label: {
                        location: "top",
                        text: "Giá trị chỉnh sửa",
                    },
                    validationRules: [{
                        message: "Vui lòng chọn giá trị chỉnh sửa",
                        type: "required",
                    }]
                };
            } else if (selectedItem.column_name === "commune_code") {
                itemValue = {
                    dataField: "value",
                    editorOptions: {
                        dataSource: new DataSource({
                            key: "area_id",
                            store: new CustomStore({
                                load: () => {
                                    const deferred = $.Deferred();
                                    const featureSelected = this.attributesGrid.getSelectedRowsData();
                                    const district_code = featureSelected[0]["district_code"];
                                    if (district_code) {
                                        AreaService.communes(district_code).then(result => {
                                            if (result) {
                                                deferred.resolve(result);
                                            } else {
                                                deferred.resolve([]);
                                            }
                                        });
                                    } else {
                                        deferred.resolve([]);
                                    }
                                    return deferred.promise();
                                },
                                loadMode: "raw"
                            }),
                        }),
                        displayExpr: "name_vn",
                        onContentReady: (e) => {
                            e.element.css("float", "left");
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                if (this.offsetWidth < this.scrollWidth) {
                                    $ele.attr("title", $ele.text());
                                }
                            });
                            this.selectValueEditor = e.component;
                        },
                        placeholder: "[Chọn...]",
                        searchEnabled: true,
                        valueExpr: "area_id",
                        width: "100%",
                    },
                    editorType: "dxSelectBox",
                    label: {
                        location: "top",
                        text: "Giá trị chỉnh sửa"
                    },
                    validationRules: [{
                        message: "Vui lòng chọn giá trị chỉnh sửa",
                        type: "required"
                    }]
                };
            } else if (selectedItem.data_type == EnumDataType.string) {
                itemValue = {
                    dataField: "value",
                    editorOptions: {

                        onContentReady: (e) => {
                            this.textValueEditor = e.component;
                        },
                        width: "100%",
                    },
                    editorType: "dxTextBox",
                    label: {
                        location: "top",
                        text: "Giá trị chỉnh sửa",
                    },
                    validationRules: [{
                        message: "Vui lòng nhập giá trị chỉnh sửa",
                        type: "required",
                    }],
                };
            } else if (selectedItem.data_type == EnumDataType.smallint || selectedItem.data_type == EnumDataType.integer || selectedItem.data_type == EnumDataType.double) {
                itemValue = {
                    dataField: "value",
                    editorOptions: {
                        format: selectedItem.data_type === EnumDataType.integer ? ",##0" : ",##0.###",
                        onContentReady: (e) => {
                            this.numberValueEditor = e.component;
                        },
                        width: "100%",
                    },
                    editorType: "dxNumberBox",
                    label: {
                        location: "top",
                        text: "Giá trị chỉnh sửa",
                    },
                    validationRules: [{
                        message: "Vui lòng nhập giá trị chỉnh sửa",
                        type: "required",
                    }]
                };
            } else if (selectedItem.data_type == EnumDataType.date || selectedItem.data_type == EnumDataType.dateTime || selectedItem.data_type == EnumDataType.dateTimeTZ) {
                itemValue = {
                    dataField: "value",
                    editorOptions: {

                        onContentReady: (e) => {
                            this.dateValueEditor = e.component;
                        },
                        width: "100%",
                    },
                    editorType: "dxDateBox",
                    label: {
                        location: "top",
                        text: "Giá trị chỉnh sửa",
                    },
                    validationRules: [{
                        message: "Vui lòng nhập giá trị chỉnh sửa",
                        type: "required",
                    }]
                };
            }
        }
        if (itemValue) {
            items.push(itemValue);
            this.batchUpdateForm.option("items", items);
        }
    }
    private buildGridColumns(tableColumns: OGTableColumnModel[]): Column[] {
        const self = this;
        const columnIndex: Column[] = [
            {
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.attributesGrid.pageIndex();
                    const pageSize = this.attributesGrid.pageSize();
                    container.append(((pageSize * pageIndex) + options.rowIndex + 1).toString());
                },
                dataField: "index",
                width: 100,
            }
        ];

        const columnsGrid: Column[] = tableColumns.map(col => {
            if (col.is_identity) {
                // this.keyColumn = col;
            }
            if (col.visible && col.column_name.includes("geom") === false) {
                if (col.lookup_table_id) {
                    return {
                        alignment: "left",
                        allowResizing: true,
                        allowSorting: true,
                        caption: col.name_vn,
                        dataField: col.column_name,
                        filterOperations: ["contains"],
                        lookup: {
                            dataSource: {
                                key: "id",
                                store: new CustomStore({
                                    load: () => {
                                        return TableService.shortData({ table_id: col.lookup_table_id });
                                    }
                                })
                            },
                            displayExpr: "mo_ta",
                            valueExpr: "id",
                        },
                        width: 200
                    };
                } else {
                    if (col.column_name.includes("toado")) {
                        return {
                            alignment: "right",
                            allowResizing: true,
                            allowSorting: true,
                            calculateCellValue: (data) => {
                                if (data[col.column_name]) {
                                    return OGUtils.formatNumber(data[col.column_name], 0, 4);
                                } else {
                                    if (col.column_name.includes("ma") || OGUtils.toLowerCaseNonAccentVietnamese(col.name_vn).includes("ma")) {
                                        return "";
                                    } else {
                                        return "";
                                    }
                                }
                            },
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["="],
                            width: 200
                        };
                    } else if (col.data_type === EnumDataType.date || col.data_type === EnumDataType.dateTime || col.data_type === EnumDataType.dateTimeTZ) {
                        return {
                            alignment: "center",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            dataType: (col.data_type === EnumDataType.date) ? "date" : "datetime",
                            filterOperations: ["="],
                            format: (col.data_type === EnumDataType.date) ? "dd/MM/yyyy" : "dd/MM/yyyy HH:mm:ss",
                            width: 200
                        };
                    } else if (col.column_name === "commune_code") {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["contains"],
                            lookup: {
                                dataSource: {
                                    key: "area_id",
                                    store: new CustomStore({
                                        load: () => {
                                            return new Promise((resolve) => {
                                                let district_code = "-1";
                                                if (self.arguments && self.arguments["district_code"]) {
                                                    district_code = self.arguments["district_code"].toString();
                                                }
                                                AreaService.communes(district_code).then(result => {
                                                    if (result) {
                                                        resolve(result);
                                                    } else {
                                                        resolve([]);
                                                    }
                                                });
                                            });
                                        },
                                    })
                                },
                                displayExpr: "name_vn",
                                valueExpr: "area_id",
                            },
                            width: 200
                        };
                    } else if (col.column_name === "district_code") {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["contains"],
                            lookup: {
                                dataSource: {
                                    key: "area_id",
                                    store: new CustomStore({
                                        load: async () => {
                                            return await AreaService.districts();
                                        }
                                    })
                                },
                                displayExpr: "name_vn",
                                valueExpr: "area_id",
                            },
                            width: 200
                        };
                    } else if (col.column_name === "province_code") {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["contains"],
                            lookup: {
                                dataSource: {
                                    key: "area_id",
                                    store: new CustomStore({
                                        load: async () => {
                                            return await AreaService.provinces();
                                        }
                                    })
                                },
                                displayExpr: "name_vn",
                                valueExpr: "area_id",
                            },
                            width: 200
                        };
                    } else if (col.data_type === EnumDataType.smallint || col.data_type === EnumDataType.integer || col.data_type === EnumDataType.double) {
                        return {
                            alignment: "right",
                            allowResizing: true,
                            allowSorting: true,
                            calculateCellValue: (data) => {
                                if (data[col.column_name]) {
                                    return OGUtils.formatNumber(data[col.column_name], 0, 3);
                                } else {
                                    if (col.column_name.includes("ma") || OGUtils.toLowerCaseNonAccentVietnamese(col.name_vn).includes("ma")) {
                                        return "";
                                    } else {
                                        return "";
                                    }
                                }
                            },
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["="],
                            width: 200
                        };
                    } else {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            cellTemplate: (container, options) => {
                                const data = options.data;
                                if (data[col.column_name]) {
                                    if (data[col.column_name].includes("http://") || data[col.column_name].includes("https://")) {
                                        container.append("<a href= \"" + data[col.column_name] + "\" target=\"_blank\">Xem thông tin</a>");
                                    } else {
                                        container.append(data[col.column_name]);
                                    }
                                } else {
                                    if (col.column_name.includes("ma") || OGUtils.toLowerCaseNonAccentVietnamese(col.name_vn).includes("ma")) {
                                        container.append("");
                                    } else {
                                        container.append("");
                                    }
                                }
                            },
                            dataField: col.column_name,
                            filterOperations: ["contains"],
                            lookup: {
                                dataSource: {
                                    pageSize: 25,
                                    paginate: true,
                                    store: new CustomStore({
                                        load: (options) => {
                                            return new Promise((resolve) => {
                                                TableColumnService.listDistinctValues(col, options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                    resolve({
                                                        data: data.data,
                                                        totalCount: data.recordsTotal
                                                    });
                                                });
                                            });
                                        }
                                    })
                                },
                            },
                            width: 200
                        };
                    }
                }
            }
        });
        return columnIndex.concat(columnsGrid);
    }

    private buildSummaryInfo(tableColumns: OGTableColumnModel[]): SummaryTotalItem[] {
        // const summaries: SummaryTotalItem[] = [{
        //     column: "index",
        //     displayFormat: "{0} bản ghi",
        //     name: "totalCount",
        //     showInColumn: "index",
        //     summaryType: "custom",
        // }];
        const summaries: SummaryTotalItem[] = [];
        tableColumns.forEach(column => {
            if (column.visible === false) {
                return;
            }
            if (column.summary_count) {
                summaries.push({
                    column: column.column_name,
                    customizeText(itemInfo) {
                        return `Khối lượng: ${OGUtils.formatNumber(parseFloat(itemInfo.value?.toString()), 0, 3)} ${column.unit ?? column.name_vn}`;
                    },
                    // valueFormat: "fixedPoint",
                    showInColumn: "index",
                    // displayFormat: `Số lượng: {0} ${column.unit ?? ""}`,
                    summaryType: "count",
                });
            } else if (column.summary_total) {
                summaries.push({
                    column: column.column_name,
                    customizeText(itemInfo) {
                        return `${column.name_vn}: ${OGUtils.formatNumber(parseFloat(itemInfo.value?.toString()), 0, 3)} ${column.unit ?? ""}`;
                    },
                    showInColumn: "index",
                    // displayFormat: `Tổng: {0} ${column.unit ?? ""}`,
                    summaryType: "sum",
                    // valueFormat: "decimal",
                });
            }
        });
        return summaries;
    }

    private initBatchFeatureUpdate(): void {
        let chooseColumnForm: dxForm;
        this.batchUpdateFeaturePopup = $("<div id = \"popupUpdateMultiFeature\"/>").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "10px");
                //
                chooseColumnForm = $("<form />").appendTo(container)
                    .dxForm({
                        colCount: 1,
                        formData: {
                            column_id: 0,
                        },
                        height: 60,
                        items: [{
                            dataField: "column_id",
                            editorOptions: {
                                dataSource: {
                                    store: new CustomStore({
                                        byKey: (key) => {
                                            const deferred = $.Deferred();
                                            if (key) {
                                                $.get("/api/table/column/" + key.toString()).done(xhr => {
                                                    if (xhr && xhr.status === EnumStatus.OK) {
                                                        deferred.resolve(xhr.data);
                                                    } else {
                                                        deferred.resolve({});
                                                    }
                                                });
                                            } else {
                                                deferred.resolve({});
                                            }
                                            return deferred;
                                        },
                                        key: "id",
                                        load: (loadOptions: LoadOptions<OGTableColumnModel[]>) => {
                                            const deferred = $.Deferred();
                                            //
                                            if (this.oGISLayerID) {
                                                $.ajax({
                                                    data: {
                                                        id: this.oGISLayerID,
                                                        keyword: loadOptions.searchValue ? loadOptions.searchValue : ""
                                                    },
                                                    error: () => {
                                                        deferred.reject("Data Loading Error");
                                                    },
                                                    success: (xhr) => {
                                                        if (xhr && xhr.status === EnumStatus.OK) {
                                                            const columns = xhr.data.filter(x => !x.is_identity && x.visible);
                                                            deferred.resolve(columns);
                                                        } else {
                                                            deferred.resolve([]);
                                                        }
                                                    },
                                                    type: "get",
                                                    url: "/api/layer/get-fields",
                                                });
                                            } else {
                                                deferred.resolve([]);
                                            }
                                            return deferred.promise();
                                        },
                                        loadMode: "raw"
                                    }),
                                },
                                displayExpr: "name_vn",
                                onContentReady: (e) => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                    this.columnEditor = e.component;
                                },
                                onSelectionChanged: (e) => {
                                    const selectedItem = e.selectedItem;
                                    if (selectedItem) {
                                        this.bindValueField(selectedItem);
                                    }
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                location: "top",
                                text: "Trường thông tin cần sửa"
                            },
                            validationRules: [{
                                message: "Vui lòng chọn trường thông tin",
                                type: "required"
                            }]
                        },],
                        scrollingEnabled: true,
                    }).dxForm("instance");
                this.batchUpdateForm = $("<form />").appendTo(container)
                    .dxForm({
                        colCount: 1,
                        formData: {
                            value: "",
                        },
                        height: 100,
                        items: [],
                        scrollingEnabled: true,
                    }).dxForm("instance");

                $("<div />")
                    .appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                onClick: () => {
                                    const validate = this.batchUpdateForm.validate();
                                    if (validate && validate.brokenRules.length === 0) {
                                        const data = this.batchUpdateForm.option("formData");
                                        const featureSelected = this.attributesGrid.getSelectedRowsData();
                                        if (featureSelected.length == 0) {
                                            OGUtils.alert("Vui lòng chọn các bản ghi muốn chỉnh sửa");
                                        } else {
                                            data["column_id"] = chooseColumnForm.option("formData")["column_id"];

                                            data["feature_ids"] = featureSelected.map(x => x[this.keyColumn ? this.keyColumn.column_name : "objectid"]);
                                            data["layer_id"] = this.oGISLayerID;
                                            data["table_id"] = this.oGISTableID;
                                            $.ajax({
                                                contentType: "application/json",
                                                data: JSON.stringify(data),
                                                type: "post",
                                                url: "/api/feature/updateFeatures"
                                            }).done(xhr => {
                                                if (xhr.status === EnumStatus.OK) {
                                                    OGUtils.alert("Lưu lớp dữ liệu thành công!").then(() => {
                                                        this.attributesGrid.getDataSource().reload();
                                                        this.batchUpdateFeaturePopup.hide();
                                                    });
                                                } else {
                                                    if (xhr.errors.length) {
                                                        OGUtils.alert(xhr.errors[0].message);
                                                    }
                                                    else {
                                                        OGUtils.alert("Lưu thông tin thất bại!");
                                                    }
                                                }
                                            });
                                        }
                                    }
                                },
                                stylingMode: "contained",
                                text: "Lưu",
                                type: "default",
                            },
                            widget: "dxButton",
                        }, {
                            location: "center",
                            options: {
                                onClick: () => {
                                    this.batchUpdateFeaturePopup.hide();
                                },
                                stylingMode: "contained",
                                text: "Hủy",
                                type: "danger",
                            },
                            widget: "dxButton",
                        }]
                    }).dxToolbar("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: 280,
            hideOnOutsideClick: false,
            minHeight: 280,
            minWidth: 500,
            onHiding: () => {
                chooseColumnForm.option("formData", {});
                this.batchUpdateForm.option("formData", {});
                this.batchUpdateForm.option("items", []);
            },
            resizeEnabled: true,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Cập nhật dữ liệu hàng loạt",
            width: 500
        }).dxPopup("instance");
    }

    private initCheckQuality(): void {
        this.checkQualityPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: () => {
            },
            dragEnabled: false,
            height: 150,
            hideOnOutsideClick: true,
            showCloseButton: true,
            showTitle: true,
            title: "Kiểm tra chất lượng dữ liệu",
            visible: false,
            width: 300,
        }).dxPopup("instance");

    }

    private renderBodyCheckQualityPopup(data): JQuery<HTMLElement> {
        return $("<div>").append(
            $(`<p><b></b>Dữ liệu hợp lệ: <span>${data.validCount}</span></b></p>`),
            $(`<p>Dữ liệu không hợp lệ: <span>${data.inValidCount}</span></b></p>`),
        );
    }

    public for(layerInfo: OGLayerModel, tableInfo: OGTableModel, params?: { [key: string]: number | object | string; }): AttributeTableComponent {
        const self = this;
        OGUtils.showLoading();
        self.arguments = params;

        this.oGISLayer = layerInfo;
        this.oGISTable = tableInfo;
        this.oGISLayerID = layerInfo ? layerInfo.id : 0;
        this.oGISTableID = layerInfo ? layerInfo.table_info_id : tableInfo.id;
        if (!this.oGISLayer && !this.oGISTable) {
            //
        } else {
            this.keyColumn = this.oGISLayer ? (this.oGISLayer.table.key_column || this.oGISLayer.table.identity_column) : (this.oGISTable.key_column || this.oGISTable.identity_column);
            this.identityColumn = this.oGISLayer ? this.oGISLayer.table.identity_column : this.oGISTable.identity_column;
            Promise.all([
                TableColumnService.list(this.oGISTableID),
                TableService.getRelations(this.oGISTableID, false),
            ]).then((values) => {
                OGUtils.hideLoading();
                const columnsResponse = values[0].data;
                const relationResponse = values[1];
                const columns = this.buildGridColumns(columnsResponse);
                const summaryInfo = this.buildSummaryInfo(columnsResponse);

                this.attributesGrid.beginUpdate();
                this.attributesGrid.option("columns", columns);
                this.attributesStore = new CustomStore({
                    key: this.keyColumn ? this.keyColumn.column_name : "id",
                    load: (loadOptions) => {
                        return new Promise((resolve, reject) => {
                            const args: { [key: string]: boolean | number | object | string } = {},
                                params: { [key: string]: number | object | string } = {};
                            // console.log("advanced-search", loadOptions);
                            Object.assign(params, self.arguments);
                            if (this.oGISTableID) {
                                if (loadOptions.sort) {
                                    args.orderby = loadOptions.sort[0].selector;
                                    if (loadOptions.sort[0].desc)
                                        args.orderby += " desc";
                                }
                                if (this.attributesGrid.option("searchPanel.text")) {
                                    params["textSearch"] = this.attributesGrid.option("searchPanel.text") as string;
                                }
                                else if (loadOptions.filter && loadOptions.filter.length) {
                                    if (!(loadOptions.filter[0] instanceof Array)) {
                                        if (loadOptions.filter[0] === "province_code" || loadOptions.filter[0] === "district_code" || loadOptions.filter[0] === "commune_code") {
                                            params[loadOptions.filter[0]] = [loadOptions.filter[2]];
                                        } else {
                                            params[loadOptions.filter[0]] = loadOptions.filter[2];
                                        }
                                    } else {
                                        $.each(loadOptions.filter, function (idx: number, item) {
                                            if (item instanceof Array) {
                                                if (item[0] === "province_code" || item[0] === "district_code" || item[0] === "commune_code") {
                                                    params[item[0]] = [item[2]];
                                                } else {
                                                    params[item[0]] = item[2];
                                                }
                                            }
                                        });
                                    }
                                }
                                args.group = loadOptions.group;
                                args.requireGroupCount = loadOptions.requireGroupCount;
                                args.requireTotalCount = loadOptions.requireTotalCount;
                                args.totalSummary = loadOptions.totalSummary;
                                args.groupSummary = loadOptions.groupSummary;
                                args.layer_id = this.oGISLayerID;
                                args.table_id = this.oGISTableID;
                                args.skip = loadOptions.skip ? loadOptions.skip : 0;
                                args.take = loadOptions.take ? loadOptions.take : 50;

                                args.params = params;
                                if (params["form"]) {
                                    args.form = params["form"];
                                }

                                axios.post("/api/feature/advanced-search", args).then((result) => {
                                    if (result.data.status === EnumStatus.OK) {
                                        this.dataDomains = result.data.data.domains;
                                        this.dataRelations = result.data.data.relations;
                                        if (loadOptions.requireGroupCount) {
                                            resolve({
                                                data: result.data.data.dataSearch.data as GroupItem[],
                                                groupCount: result.data.data.dataSearch.groupCount,
                                                summary: result.data.data.dataSearch.totalSummary,
                                                totalCount: result.data.data.dataSearch.totalCount
                                            } as LoadResultObject);
                                        } else {
                                            resolve({
                                                data: result.data.data.dataSearch.items,
                                                groupCount: result.data.data.dataSearch.groupCount,
                                                summary: result.data.data.dataSearch.totalSummary,
                                                totalCount: result.data.data.dataSearch.totalCount
                                            } as LoadResultObject);
                                        }

                                    } else {
                                        resolve({
                                            data: [],
                                            summary: [],
                                            totalCount: 0,
                                        });
                                    }
                                }).catch(error => {
                                    reject("Data Loading Error: " + error);
                                });
                            } else {
                                resolve({
                                    data: [],
                                    summary: [],
                                    totalCount: 0
                                });
                            }
                        });
                    },
                });
                this.attributesGrid.option("summary", {
                    groupItems: [{
                        column: this.keyColumn?.column_name,
                        summaryType: "count"
                    }],
                    totalItems: summaryInfo
                });
                this.attributesGrid.option("dataSource", {
                    requireTotalCount: true,
                    store: this.attributesStore
                });
                // Xóa items toolbar cũ giữ lại item chọn cột
                if (this.attributesGridToolbarOptions.items.length > 1) {
                    this.attributesGridToolbarOptions.items.splice(0, this.attributesGridToolbarOptions.items.length - 1);
                }
                if (this.oGISLayer) {
                    this.attributesGridToolbarOptions.items.unshift({
                        location: "before",
                        options: {
                            dropDownOptions: {
                                width: "220px",
                            },
                            icon: "icon icon-setting-2",
                            items: [{
                                template: (e) => {
                                    return e.text;
                                },
                                text: "Nhập dữ liệu",
                                visible: (self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD)) && self.options.showButton
                            }, {
                                icon: "icon icon-import-excel",
                                onClick: () => {
                                    this.dataImportWindowComponent.for(self.oGISLayer, undefined, EnumImportFileType.EXCEL, e => {
                                        if (e.status == "OK") {
                                            this.attributesGrid.getDataSource().reload();
                                        }
                                    }).show();
                                },
                                text: "Nhập dữ liệu từ file excel",
                                visible: (self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD)) && self.options.showButton,
                            }, {
                                icon: "icon icon-import-shp",
                                onClick: () => {
                                    this.dataImportWindowComponent.for(self.oGISLayer, undefined, EnumImportFileType.SHAPEFILE, e => {
                                        if (e.status == "OK") {
                                            this.attributesGrid.getDataSource().reload();
                                        }
                                    }).show();
                                },
                                text: "Nhập dữ liệu từ shapefile",
                                visible: (self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD)) && self.options.showButton,
                            }, {
                                icon: "icon icon-import-gdb",
                                onClick: () => {
                                    this.dataImportWindowComponent.for(self.oGISLayer, undefined, EnumImportFileType.GDB, (e) => {
                                        if (e.status == "OK") {
                                            this.attributesGrid.getDataSource().reload();
                                        }
                                    }).show();
                                },
                                text: "Nhập dữ liệu từ gdb",
                                visible: (self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD)) && self.options.showButton,
                            }, {
                                template: (e) => {
                                    return `<hr style="margin: 0 0 5px 0;" />${e.text}`;
                                },
                                text: "Xuất dữ liệu"
                            }, {
                                icon: "icon icon-export-excel",
                                onClick: () => {
                                    OGUtils.postDownload("/api/layer/export/Excel", { layer_id: this.oGISLayer.id }, "application/json");
                                },
                                text: "Xuất excel",
                            }, {
                                icon: "icon icon-export-shp",
                                onClick: () => {
                                    OGUtils.postDownload("/api/layer/export/SHP", { layer_id: this.oGISLayer.id }, "application/json");
                                },
                                text: "Xuất shapefile",
                            }, {
                                icon: "icon icon-export-gdb",
                                onClick: () => {
                                    OGUtils.postDownload("/api/layer/export/GDB", { layer_id: this.oGISLayer.id }, "application/json");
                                },
                                text: "Xuất gdb",
                            }, {
                                icon: "icon icon-export-map-info",
                                onClick: () => {
                                    OGUtils.postDownload("/api/layer/export/MapInfo", { layer_id: this.oGISLayer.id }, "application/json");
                                },
                                text: "Xuất MapInfo",
                            }, {
                                template: (e) => {
                                    return `<hr style="margin: 0 0 5px 0;" />${e.text}`;
                                },
                                text: "Chỉnh sửa dữ liệu",
                                visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE) && self.options.showButton,
                            }, {
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    if (this.attributesGrid.getSelectedRowsData().length > 0) {
                                        this.batchUpdateFeaturePopup.show();
                                    } else {
                                        OGUtils.alert("Vui lòng chọn các bản ghi muốn chỉnh sửa");
                                    }
                                },
                                onContentReady: (e) => {
                                    this.bulkEditButton = e.component;
                                },
                                text: "Chỉnh sửa hàng loạt",
                                visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE) && self.options.showButton,
                            }],
                            stylingMode: "contained",
                            text: "Thao tác với dữ liệu",
                            type: "default",
                        },
                        widget: "dxDropDownButton"
                    }, {
                        locateInMenu: "auto",
                        location: "before",
                        options: {
                            icon: "icon icon-search-zoom-in",
                            onClick: () => {
                                const rows = this.attributesGrid.getSelectedRowsData();
                                if (rows && rows.length > 0) {
                                    FeatureService.queryFeature(this.oGISLayerID, this.oGISTableID, rows[0][this.keyColumn.column_name]).then(response => {
                                        const geom = response.attributes.geom;
                                        if (geom) {
                                            if (this.oGMap) {
                                                this.oGMap.fitBounds(geom.toString());
                                                this.oGMap.highlightIdentifyFeature(geom.toString());
                                            }
                                        }
                                    });
                                }
                            },
                            onContentReady: (e) => {
                                this.zoomInButton = e.component;
                            },
                            text: "Phóng tới",
                            type: "success",
                            visible: self.options.showButton && this.oGMap != null,
                        },
                        widget: "dxButton"
                    }, {
                        locateInMenu: "auto",
                        location: "before",
                        options: {
                            icon: "icon icon-info-circle",
                            onClick: () => {
                                const rows = this.attributesGrid.getSelectedRowsData();
                                if (rows && rows.length > 0) {
                                    this.identifyComponent.identify(this.oGISLayer, rows[0][this.keyColumn.column_name], true);
                                }
                            },
                            onContentReady: (e) => {
                                this.identifyButton = e.component;
                            },
                            text: "Xem thông tin",
                            type: "default",
                            visible: self.options.showButton && (this.oGMap !== null || this.oGMap !== undefined),
                        },
                        widget: "dxButton"
                    }, {
                        location: "before",
                        options: {
                            icon: "icon icon-chart-2",
                            onClick: () => {
                                const rows = this.attributesGrid.getSelectedRowsData();
                                const ids = rows.map(p => p[this.keyColumn.column_name]) ?? [];
                                this.identifyComponent.statisticRelationship.for(ids, this.oGISLayer.table?.id, this.oGISLayer.table?.name_vn).show();
                            },
                            text: "Thống kê tổng",
                            type: "default",
                            visible: (relationResponse && relationResponse.length) ? true : false
                        },
                        widget: "dxButton"
                    }, {
                        locateInMenu: "auto",
                        location: "after",
                        options: {
                            hint: "Kiểm tra chất lượng dữ liệu",
                            icon: "icon icon-tick-circle",
                            onClick: () => {
                                if (this.oGISLayer) {
                                    OGUtils.showLoading();
                                    axios.get("/api/feature/checkValidLayer/" + this.oGISLayer.id).then(xhr => {
                                        OGUtils.hideLoading();
                                        if (xhr.data.status === EnumStatus.OK) {
                                            const data = {
                                                inValidCount: xhr.data.data.filter(x => !x.isValid).length ? xhr.data.data.filter(x => !x.isValid)[0].count : 0,
                                                validCount: xhr.data.data.filter(x => x.isValid).length ? xhr.data.data.filter(x => x.isValid)[0].count : 0
                                            };
                                            this.checkQualityPopup.option("contentTemplate", () => this.renderBodyCheckQualityPopup(data));
                                            this.checkQualityPopup.show();
                                        } else {
                                            OGUtils.error(xhr.data.errors[0].message);
                                        }
                                    });
                                }
                            },
                            type: "success"
                        },
                        widget: "dxButton"
                    }, {
                        locateInMenu: "auto",
                        location: "after",
                        options: {
                            elementAttr: {
                                class: "dx-button-warning"
                            },
                            icon: "icon icon-edit-2",
                            onClick: () => {
                                const rows = this.attributesGrid.getSelectedRowsData();
                                if (rows && rows.length > 0) {
                                    if (this.oGISLayer) {
                                        OGUtils.showLoading();
                                        const id = rows[0][this.keyColumn.column_name];
                                        FeatureService.queryFeature(this.oGISLayer.id, 0, id).then(response => {
                                            OGUtils.hideLoading();
                                            this.attributesEditor.show();
                                            // response.attributes.id = id;
                                            const geom = response.attributes.geom;
                                            let geometry = undefined;
                                            if (geom) {
                                                const f = OGMapUtils.parseGeoJSON(geom.toString())[0] || undefined;
                                                if (f instanceof Feature) {
                                                    geometry = f.getGeometry();
                                                }
                                            }
                                            this.attributesEditor.beginEdit(response.attributes, geometry, this.oGISLayer, undefined, response.files, undefined);
                                        });
                                    }
                                } else {
                                    OGUtils.alert("Vui lòng chọn bản ghi muốn chỉnh sửa!");
                                }
                            },
                            onContentReady: (e) => {
                                this.editButton = e.component;
                            },
                            visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE) && self.options.showButton
                        },
                        widget: "dxButton"
                    }, {
                        locateInMenu: "auto",
                        location: "after",
                        options: {
                            icon: "icon icon-trash",
                            onClick: () => {
                                const rows = this.attributesGrid.getSelectedRowsData();
                                if (rows && rows.length > 0) {
                                    if (this.oGISLayer) {
                                        const data = {
                                            attributes: rows[0],
                                            layer_id: this.oGISLayer.id
                                        };
                                        OGUtils.confirm("Bạn có chắc chắn xóa đối tượng ?", "Xác nhận").then((anws) => {
                                            if (anws) {
                                                OGUtils.showLoading();
                                                $.ajax({
                                                    contentType: "application/json",
                                                    data: JSON.stringify(data),
                                                    error: (xhr) => {
                                                        OGUtils.hideLoading();
                                                        OGUtils.toastError(xhr.responseJSON() as RestError);
                                                    },
                                                    success: (xhr) => {
                                                        OGUtils.hideLoading();
                                                        if (xhr.status === EnumStatus.OK) {
                                                            this.attributesGrid.getDataSource().reload();
                                                            OGUtils.toastSuccess("Xóa đối tượng thành công!");
                                                        } else {
                                                            OGUtils.toastError("Xóa thông tin thất bại. Vui lòng thử lại sau.");
                                                        }
                                                    },
                                                    type: "POST",
                                                    url: "/api/feature/delete",
                                                });
                                            }
                                        });
                                    }
                                } else {
                                    OGUtils.alert("Vui lòng chọn bản ghi muốn xóa!");
                                }
                            },
                            onContentReady: (e) => {
                                this.deleteButton = e.component;
                            },
                            type: "danger",
                            visible: self.oGConfig.canDelete(EnumsFunction.DELETE) && self.options.showButton
                        },
                        widget: "dxButton"
                    }, {
                        locateInMenu: "auto",
                        location: "after",
                        options: {
                            icon: "icon icon-refresh",
                            onClick: function () {
                                self.attributesGrid.refresh();
                            }
                        },
                        widget: "dxButton"
                    }, {
                        locateInMenu: "auto",
                        location: "after",
                        options: {
                            hint: "Phê duyệt",
                            icon: "icon icon-card-tick",
                            onClick: () => {
                                const rows = this.attributesGrid.getSelectedRowsData();
                                if (rows && rows.length > 0) {
                                    if (this.oGISTable) {
                                        const data = {
                                            attributes: rows[0],
                                            table_id: this.oGISTable.id
                                        };
                                        const created_by = rows[0]["created_by"];
                                        OGUtils.confirm("Bạn có chắc chắn phê duyệt đối tượng ?", "Xác nhận").then((anws) => {
                                            if (anws) {
                                                $.ajax({
                                                    contentType: "application/json",
                                                    data: JSON.stringify(data),
                                                    success: (xhr) => {
                                                        if (xhr.status === EnumStatus.OK) {
                                                            this.attributesGrid.getDataSource().reload();
                                                            OGUtils.confirm("Phê duyệt đối tượng thành công! Gửi thông báo cho người đăng ký ?", "Xác nhận")
                                                                .then((res) => {
                                                                    if (res) {
                                                                        OGUtils.showLoading();
                                                                        FeatureService.notify(self.oGISLayer ? self.oGISLayer.id : 0,
                                                                            self.oGISTable ? self.oGISTable.id : 0,
                                                                            rows[0][self.oGISTable.key_column.column_name],
                                                                            created_by ? [created_by] : [])
                                                                            .then(response => {
                                                                                OGUtils.alert("Gửi thông báo thành công!");
                                                                            });
                                                                    }
                                                                });
                                                            // OGUtils.alert("Phê duyệt đối tượng thành công!", "Thông báo");
                                                        } else {
                                                            OGUtils.alert("Phê duyệt thông tin thất bại. Vui lòng thử lại sau.", "Thông báo");
                                                        }
                                                    },
                                                    type: "POST",
                                                    url: "/api/feature/approve",
                                                });
                                            }
                                        });
                                    }
                                } else {
                                    OGUtils.alert("Vui lòng chọn bản ghi muốn phê duyệt!");
                                }
                            },
                            onContentReady: (e) => {
                                this.approvedButton = e.component;
                            },
                            type: "default",
                            visible: self.options.showButton
                        },
                        widget: "dxButton"
                    }, {
                        locateInMenu: "auto",
                        location: "after",
                        options: {
                            icon: "icon icon-send-2",
                            onClick: () => {
                                const rows = this.attributesGrid.getSelectedRowsData();
                                if (rows && rows.length > 0) {
                                    if (this.oGISLayer) {
                                        const data = {
                                            feature_id: rows[0][this.keyColumn.column_name],
                                            layer_id: this.oGISLayer.id
                                        };
                                        OGUtils.confirm(`Xác nhận gửi email thông tin dữ liệu ${this.oGISLayer.name_vn.toLowerCase()}?`, "Xác nhận").then((anws) => {
                                            if (anws) {
                                                OGUtils.showLoading();
                                                $.ajax({
                                                    contentType: "application/json",
                                                    data: JSON.stringify(data),
                                                    success: (xhr) => {
                                                        if (xhr.status === EnumStatus.OK) {
                                                            OGUtils.alert("Gửi mail thành công!", "Thông báo");
                                                        } else {
                                                            OGUtils.alert("Gửi mail thất bại. Vui lòng thử lại sau.", "Thông báo");
                                                        }
                                                    },
                                                    type: "POST",
                                                    url: "/api/feature/send/mail",
                                                });
                                            }
                                        });
                                    }
                                } else {
                                    OGUtils.alert("Vui lòng chọn bản ghi muốn xóa!");
                                }
                            },
                            onContentReady: (e) => {
                                this.sendMailButton = e.component;
                            },
                            type: "default",
                            visible: self.oGISLayer.table.columns.find(x => x.column_name === "email") !== undefined
                        },
                        widget: "dxButton"
                    },);
                    this.attributesGrid.option("toolbar", this.attributesGridToolbarOptions);
                    this.attributesGrid.endUpdate();
                    this.zoomInButton.option("disabled", true);
                    this.identifyButton.option("disabled", true);
                    this.editButton.option("disabled", true);
                    this.deleteButton.option("disabled", true);
                    this.approvedButton.option("disabled", true);
                    this.sendMailButton.option("disabled", true);
                    if (this.bulkEditButton) {
                        this.bulkEditButton.option("disabled", true);
                    }
                } else if (this.oGISTable) {
                    this.attributesGridToolbarOptions.items.unshift({
                        location: "before",
                        options: {
                            dropDownOptions: {
                                width: "220px",
                            },
                            icon: "icon icon-setting-2",
                            items: [{
                                template: (e) => {
                                    return e.text;
                                },
                                text: "Nhập dữ liệu",
                                visible: (self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD)) && self.options.showButton
                            }, {
                                icon: "icon icon-import-excel",
                                onClick: () => {
                                    this.dataImportWindowComponent.for(undefined, self.oGISTable, EnumImportFileType.EXCEL, e => {
                                        if (e.status == "OK") {
                                            this.attributesGrid.getDataSource().reload();
                                        }
                                    }).show();
                                },
                                text: "Nhập dữ liệu từ file excel",
                                visible: (self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD)) && self.options.showButton,
                            }, {
                                icon: "icon icon-export-excel",
                                onClick: () => {
                                    OGUtils.postDownload("/api/layer/export/Excel", { table_id: this.oGISTable.id }, "application/json");
                                },
                                text: "Xuất excel",
                            },],
                            stylingMode: "contained",
                            text: "Thao tác với dữ liệu",
                            type: "default",
                        },
                        widget: "dxDropDownButton"
                    }, {
                        location: "before",
                        options: {
                            icon: "icon icon-info-circle",
                            onClick: () => {
                                const rows = this.attributesGrid.getSelectedRowsData();
                                if (rows && rows.length > 0) {
                                    this.identifyComponent.identifyRowTableFeature(rows[0][this.keyColumn.column_name], this.oGISTable.id, this.oGISTable.name_vn, false);
                                }
                            },
                            onContentReady: (e) => {
                                this.identifyButton = e.component;
                            },
                            text: "Xem thông tin",
                            type: "default",
                            visible: self.options.showButton
                        },
                        widget: "dxButton"
                    }, {
                        location: "before",
                        options: {
                            icon: "icon icon-chart-2",
                            onClick: () => {
                                const rows = this.attributesGrid.getSelectedRowsData();
                                const ids = rows.map(p => p[this.keyColumn.column_name]) ?? [];
                                this.identifyComponent.statisticRelationship.for(ids, this.oGISTable.id, this.oGISTable.name_vn).show();
                            },
                            text: "Thống kê tổng",
                            type: "default",
                            visible: (relationResponse && relationResponse.length) ? true : false
                        },
                        widget: "dxButton"
                    }, {
                        locateInMenu: "auto",
                        location: "after",
                        options: {
                            elementAttr: {
                                class: "dx-button-primary"
                            },
                            icon: "icon icon-add",
                            onClick: () => {
                                this.attributesEditor.show();
                                const geometry = undefined;
                                this.attributesEditor.beginEdit({}, geometry, undefined, this.oGISTable, [], undefined);
                            },
                            onContentReady: (e) => {
                                this.editButton = e.component;
                            },
                            visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE) && self.options.showButton
                        },
                        widget: "dxButton"
                    }, {
                        locateInMenu: "auto",
                        location: "after",
                        options: {
                            elementAttr: {
                                class: "dx-button-warning"
                            },
                            icon: "icon icon-edit-2",
                            onClick: () => {
                                const rows = this.attributesGrid.getSelectedRowsData();
                                if (rows && rows.length > 0) {
                                    if (this.oGISTable) {
                                        OGUtils.showLoading();
                                        const id = rows[0][this.keyColumn.column_name];
                                        FeatureService.queryFeature(0, this.oGISTable.id, id).then(response => {
                                            OGUtils.hideLoading();
                                            this.attributesEditor.show();
                                            // response.attributes.id = id;
                                            const geom = response.attributes.geom;
                                            let geometry = undefined;
                                            if (geom) {
                                                const f = OGMapUtils.parseGeoJSON(geom.toString())[0] || undefined;
                                                if (f instanceof Feature) {
                                                    geometry = f.getGeometry();
                                                }
                                            }
                                            this.attributesEditor.beginEdit(response.attributes, geometry, undefined, this.oGISTable, response.files, undefined);
                                        });
                                    }
                                } else {
                                    OGUtils.alert("Vui lòng chọn bản ghi muốn chỉnh sửa!");
                                }
                            },
                            onContentReady: (e) => {
                                this.editButton = e.component;
                            },
                            visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE) && self.options.showButton
                        },
                        widget: "dxButton"
                    }, {
                        locateInMenu: "auto",
                        location: "after",
                        options: {
                            icon: "icon icon-trash",
                            onClick: () => {
                                const rows = this.attributesGrid.getSelectedRowsData();
                                if (rows && rows.length > 0) {
                                    if (this.oGISTable) {
                                        const data = {
                                            attributes: rows[0],
                                            table_id: this.oGISTable.id
                                        };
                                        OGUtils.confirm("Bạn có chắc chắn xóa đối tượng ?", "Xác nhận").then((anws) => {
                                            if (anws) {
                                                OGUtils.showLoading();
                                                $.ajax({
                                                    contentType: "application/json",
                                                    data: JSON.stringify(data),
                                                    error: (xhr) => {
                                                        OGUtils.hideLoading();
                                                        OGUtils.toastError(xhr.responseJSON() as RestError);
                                                    },
                                                    success: (xhr) => {
                                                        OGUtils.hideLoading();
                                                        if (xhr.status === EnumStatus.OK) {
                                                            this.attributesGrid.getDataSource().reload();
                                                            OGUtils.alert("Xóa đối tượng thành công!");
                                                        } else {
                                                            OGUtils.alert("Xóa thông tin thất bại. Vui lòng thử lại sau.");
                                                        }
                                                    },
                                                    type: "POST",
                                                    url: "/api/feature/delete",
                                                });
                                            }
                                        });
                                    }
                                } else {
                                    OGUtils.alert("Vui lòng chọn bản ghi muốn xóa!");
                                }
                            },
                            onContentReady: (e) => {
                                this.deleteButton = e.component;
                            },
                            type: "danger",
                            visible: self.oGConfig.canDelete(EnumsFunction.DELETE) && self.options.showButton
                        },
                        widget: "dxButton"
                    }, {
                        location: "after",
                        options: {
                            icon: "icon icon-refresh",
                            onClick: () => {
                                this.attributesGrid.getDataSource().reload();
                            }
                        },
                        widget: "dxButton"
                    });
                    this.attributesGrid.option("toolbar", this.attributesGridToolbarOptions);
                    this.attributesGrid.endUpdate();
                    this.identifyButton.option("disabled", true);
                }
                this.attributesGridToolbarOptions.items.unshift("grouping");
            });
            if (this.columnEditor) {
                this.columnEditor.getDataSource().reload();
            }
        }
        // if (!this.oGISLayer && !this.oGISTable) {
        //     //
        // } else if (this.oGISLayer) {
        //     this.popup.option("title", "Dữ liệu " + layerInfo.name_vn);
        //     // this.attributesGrid.option("sumary", {});
        //     this.keyColumn = this.oGISLayer.table.key_column ?? this.oGISLayer.table.identity_column;
        //     this.identityColumn = this.oGISLayer.table.identity_column;
        //     Promise.all([
        //         TableColumnService.list(this.oGISTableID),
        //         TableService.getRelations(this.oGISTableID, false),
        //     ]).then((values) => {
        //         const columnsResponse = values[0].data;
        //         const relationResponse = values[1];
        //         const columns = this.buildGridColumns(columnsResponse);
        //         const summaryInfo = this.buildSummaryInfo(columnsResponse);

        //         this.attributesGrid.beginUpdate();
        //         this.attributesGrid.option("columns", columns);
        //         this.attributesStore = new CustomStore({
        //             key: this.keyColumn ? this.keyColumn.column_name : "id",
        //             load: (loadOptions) => {
        //                 const deferred = $.Deferred(),
        //                     args: { [key: string]: number | object | string } = {},
        //                     params: { [key: string]: number | object | string } = {};
        //                 Object.assign(params, self.arguments);
        //                 if (this.oGISLayerID) {
        //                     if (loadOptions.sort) {
        //                         args.orderby = loadOptions.sort[0].selector;
        //                         if (loadOptions.sort[0].desc)
        //                             args.orderby += " desc";
        //                     }
        //                     if (loadOptions.filter && loadOptions.filter.length) {
        //                         if (!(loadOptions.filter[0] instanceof Array)) {
        //                             if (loadOptions.filter[0] === "province_code" || loadOptions.filter[0] === "district_code" || loadOptions.filter[0] === "commune_code") {
        //                                 params[loadOptions.filter[0]] = [loadOptions.filter[2]];
        //                             } else {
        //                                 params[loadOptions.filter[0]] = loadOptions.filter[2];
        //                             }
        //                         } else {
        //                             $.each(loadOptions.filter, function (idx: number, item) {
        //                                 if (item instanceof Array) {
        //                                     if (item[0] === "province_code" || item[0] === "district_code" || item[0] === "commune_code") {
        //                                         params[item[0]] = [item[2]];
        //                                     } else {
        //                                         params[item[0]] = item[2];
        //                                     }
        //                                 }
        //                             });
        //                         }
        //                     }
        //                     args.totalSummary = loadOptions.totalSummary;
        //                     args.layer_id = this.oGISLayerID;
        //                     args.table_id = this.oGISTableID;
        //                     args.skip = loadOptions.skip ? loadOptions.skip : 0;
        //                     args.take = loadOptions.take ? loadOptions.take : 50;
        //                     args.params = params;

        //                     axios.post("/api/feature/advanced-search", args).then((result) => {
        //                         if (result.data.status === EnumStatus.OK) {
        //                             this.dataDomains = result.data.data.domains;
        //                             this.dataRelations = result.data.data.relations;
        //                             deferred.resolve(result.data.data.dataSearch.items, {
        //                                 summary: result.data.data.dataSearch.totalSummary,
        //                                 totalCount: result.data.data.dataSearch.totalCount
        //                             });
        //                         } else {
        //                             deferred.resolve([], {
        //                                 summary: [],
        //                                 totalCount: 0,
        //                             });
        //                         }
        //                     }).catch(error => {
        //                         deferred.reject("Data Loading Error: " + error);
        //                     });
        //                 } else {
        //                     deferred.resolve([], {
        //                         summary: [],
        //                         totalCount: 0
        //                     });
        //                 }
        //                 return deferred.promise();
        //             },
        //         });
        //         this.attributesGrid.option("summary", {
        //             totalItems: summaryInfo
        //         });
        //         this.attributesGrid.option("dataSource", {
        //             requireTotalCount: true,
        //             store: this.attributesStore
        //         });
        //         // Xóa items toolbar cũ giữ lại item chọn cột
        //         if (this.attributesGridToolbarOptions.items.length > 1) {
        //             this.attributesGridToolbarOptions.items.splice(0, this.attributesGridToolbarOptions.items.length - 1);
        //         }
        //         this.attributesGridToolbarOptions.items.unshift({
        //             location: "before",
        //             options: {
        //                 dropDownOptions: {
        //                     width: "220px",
        //                 },
        //                 icon: "icon icon-setting-2",
        //                 items: [{
        //                     template: (e) => {
        //                         return e.text;
        //                     },
        //                     text: "Nhập dữ liệu",
        //                     visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD)
        //                 }, {
        //                     icon: "icon icon-import-excel",
        //                     onClick: () => {
        //                         this.dataImportWindowComponent.for(self.oGISLayer, undefined, EnumImportFileType.EXCEL, e => {
        //                             if (e.status == "OK") {
        //                                 this.attributesGrid.getDataSource().reload();
        //                             }
        //                         }).show();
        //                     },
        //                     text: "Nhập dữ liệu từ file excel",
        //                     visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD),
        //                 }, {
        //                     icon: "icon icon-import-shp",
        //                     onClick: () => {
        //                         this.dataImportWindowComponent.for(self.oGISLayer, undefined, EnumImportFileType.SHAPEFILE, e => {
        //                             if (e.status == "OK") {
        //                                 this.attributesGrid.getDataSource().reload();
        //                             }
        //                         }).show();
        //                     },
        //                     text: "Nhập dữ liệu từ shapefile",
        //                     visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD),
        //                 }, {
        //                     icon: "icon icon-import-gdb",
        //                     onClick: () => {
        //                         this.dataImportWindowComponent.for(self.oGISLayer, undefined, EnumImportFileType.GDB, (e) => {
        //                             if (e.status == "OK") {
        //                                 this.attributesGrid.getDataSource().reload();
        //                             }
        //                         }).show();
        //                     },
        //                     text: "Nhập dữ liệu từ gdb",
        //                     visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD),
        //                 }, {
        //                     template: (e) => {
        //                         return `<hr style="margin: 0 0 5px 0;" />${e.text}`;
        //                     },
        //                     text: "Xuất dữ liệu"
        //                 }, {
        //                     icon: "icon icon-export-excel",
        //                     onClick: () => {
        //                         OGUtils.postDownload("/api/layer/export/Excel", { layer_id: this.oGISLayer.id });
        //                     },
        //                     text: "Xuất excel",
        //                 }, {
        //                     icon: "icon icon-export-shp",
        //                     onClick: () => {
        //                         OGUtils.postDownload("/api/layer/export/SHP", { layer_id: this.oGISLayer.id });
        //                     },
        //                     text: "Xuất shapefile",
        //                 }, {
        //                     icon: "icon icon-export-gdb",
        //                     onClick: () => {
        //                         OGUtils.postDownload("/api/layer/export/GDB", { layer_id: this.oGISLayer.id });
        //                     },
        //                     text: "Xuất gdb",
        //                 }, {
        //                     icon: "icon icon-export-map-info",
        //                     onClick: () => {
        //                         OGUtils.postDownload("/api/layer/export/MapInfo", { layer_id: this.oGISLayer.id });
        //                     },
        //                     text: "Xuất MapInfo",
        //                 }, {
        //                     template: (e) => {
        //                         return `<hr style="margin: 0 0 5px 0;" />${e.text}`;
        //                     },
        //                     text: "Chỉnh sửa dữ liệu"
        //                 }, {
        //                     icon: "icon icon-edit-2",
        //                     onClick: () => {
        //                         if (this.attributesGrid.getSelectedRowsData().length > 0) {
        //                             this.batchUpdateFeaturePopup.show();
        //                         } else {
        //                             OGUtils.alert("Vui lòng chọn các bản ghi muốn chỉnh sửa");
        //                         }
        //                     },
        //                     onContentReady: (e) => {
        //                         this.bulkEditButton = e.component;
        //                     },
        //                     text: "Chỉnh sửa hàng loạt",
        //                     visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE),
        //                 }],
        //                 stylingMode: "contained",
        //                 text: "Thao tác với dữ liệu",
        //                 type: "default",
        //             },
        //             widget: "dxDropDownButton"
        //         }, {
        //             locateInMenu: "auto",
        //             location: "before",
        //             options: {
        //                 icon: "icon icon-search-zoom-in",
        //                 onClick: () => {
        //                     const rows = this.attributesGrid.getSelectedRowsData();
        //                     if (rows && rows.length > 0) {
        //                         FeatureService.queryFeature(this.oGISLayerID, this.oGISTableID, rows[0][this.keyColumn.column_name]).then(response => {
        //                             const geom = response.attributes.geom;
        //                             if (geom) {
        //                                 this.oGMap.fitBounds(geom.toString());
        //                                 this.oGMap.highlightIdentifyFeature(geom.toString());
        //                             }
        //                         });
        //                     }
        //                 },
        //                 onContentReady: (e) => {
        //                     this.zoomInButton = e.component;
        //                 },
        //                 text: "Phóng tới",
        //                 type: "success",
        //             },
        //             widget: "dxButton"
        //         }, {
        //             locateInMenu: "auto",
        //             location: "before",
        //             options: {
        //                 icon: "icon icon-info-circle",
        //                 onClick: () => {
        //                     const rows = this.attributesGrid.getSelectedRowsData();
        //                     if (rows && rows.length > 0) {
        //                         if (this.oGISLayer) {
        //                             this.identifyComponent.identify(this.oGISLayer, rows[0][this.keyColumn.column_name], true);
        //                         } else if (this.oGISTable) {
        //                             this.identifyComponent.identifyRowTableFeature(rows[0][this.keyColumn.column_name], this.oGISTable.id, this.oGISTable.name_vn);
        //                         }
        //                     }
        //                 },
        //                 onContentReady: (e) => {
        //                     this.identifyButton = e.component;
        //                 },
        //                 text: "Xem thông tin",
        //                 type: "default",
        //             },
        //             widget: "dxButton"
        //         }, {
        //             location: "before",
        //             options: {
        //                 icon: "icon icon-chart-2",
        //                 onClick: () => {
        //                     const rows = this.attributesGrid.getSelectedRowsData();
        //                     const ids = rows.map(p => p[this.keyColumn.column_name]) ?? [];
        //                     if (this.oGISLayer) {
        //                         this.identifyComponent.statisticRelationship.for(ids, this.oGISLayer.table?.id, this.oGISLayer.table?.name_vn).show();
        //                     } else if (this.oGISTable) {
        //                         this.identifyComponent.statisticRelationship.for(ids, this.oGISTable.id, this.oGISTable.name_vn).show();
        //                     }
        //                 },
        //                 text: "Thống kê tổng",
        //                 type: "default",
        //             },
        //             widget: "dxButton"
        //         }, {
        //             locateInMenu: "auto",
        //             location: "after",
        //             options: {
        //                 hint: "Kiểm tra chất lượng dữ liệu",
        //                 icon: "icon icon-tick-circle",
        //                 onClick: () => {
        //                     if (this.oGISLayer) {
        //                         OGUtils.showLoading();
        //                         axios.get("/api/feature/checkValidLayer/" + this.oGISLayer.id).then(xhr => {
        //                             OGUtils.hideLoading();
        //                             if (xhr.data.status === EnumStatus.OK) {
        //                                 const data = {
        //                                     inValidCount: xhr.data.data.filter(x => !x.isValid).length ? xhr.data.data.filter(x => !x.isValid)[0].count : 0,
        //                                     validCount: xhr.data.data.filter(x => x.isValid).length ? xhr.data.data.filter(x => x.isValid)[0].count : 0
        //                                 };
        //                                 this.checkQualityPopup.option("contentTemplate", () => this.renderBodyCheckQualityPopup(data));
        //                                 this.checkQualityPopup.show();
        //                             } else {
        //                                 OGUtils.error(xhr.data.errors[0].message);
        //                             }
        //                         });
        //                     }
        //                 },
        //                 type: "success"
        //             },
        //             widget: "dxButton"
        //         }, {
        //             locateInMenu: "auto",
        //             location: "after",
        //             options: {
        //                 elementAttr: {
        //                     class: "dx-button-warning"
        //                 },
        //                 icon: "icon icon-edit-2",
        //                 onClick: () => {
        //                     const rows = this.attributesGrid.getSelectedRowsData();
        //                     if (rows && rows.length > 0) {
        //                         if (this.oGISLayer) {
        //                             OGUtils.showLoading();
        //                             const id = rows[0][this.keyColumn.column_name];
        //                             FeatureService.queryFeature(this.oGISLayer.id, 0, id).then(response => {
        //                                 OGUtils.hideLoading();
        //                                 this.attributesEditor.show();
        //                                 // response.attributes.id = id;
        //                                 const geom = response.attributes.geom;
        //                                 let geometry = undefined;
        //                                 if (geom) {
        //                                     const f = OGMapUtils.parseGeoJSON(geom.toString())[0] || undefined;
        //                                     if (f instanceof Feature) {
        //                                         geometry = f.getGeometry();
        //                                     }
        //                                 }
        //                                 this.attributesEditor.beginEdit(response.attributes, geometry, this.oGISLayer, undefined, response.files, self);
        //                             });
        //                         }
        //                     } else {
        //                         OGUtils.alert("Vui lòng chọn bản ghi muốn chỉnh sửa!");
        //                     }
        //                 },
        //                 onContentReady: (e) => {
        //                     this.editButton = e.component;
        //                 },
        //                 visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE)
        //             },
        //             widget: "dxButton"
        //         }, {
        //             locateInMenu: "auto",
        //             location: "after",
        //             options: {
        //                 icon: "icon icon-trash",
        //                 onClick: () => {
        //                     const rows = this.attributesGrid.getSelectedRowsData();
        //                     if (rows && rows.length > 0) {
        //                         if (this.oGISLayer) {
        //                             const data = {
        //                                 attributes: rows[0],
        //                                 layer_id: this.oGISLayer.id
        //                             };
        //                             OGUtils.confirm("Bạn có chắc chắn xóa đối tượng ?", "Xác nhận").then((anws) => {
        //                                 if (anws) {
        //                                     $.ajax({
        //                                         contentType: "application/json",
        //                                         data: JSON.stringify(data),
        //                                         success: (xhr) => {
        //                                             if (xhr.status === EnumStatus.OK) {
        //                                                 this.attributesGrid.getDataSource().reload();
        //                                                 OGUtils.alert("Xóa đối tượng thành công!", "Thông báo");
        //                                             } else {
        //                                                 OGUtils.alert("Xóa thông tin thất bại. Vui lòng thử lại sau.", "Thông báo");
        //                                             }
        //                                         },
        //                                         type: "POST",
        //                                         url: "/api/feature/delete",
        //                                     });
        //                                 }
        //                             });
        //                         }
        //                     } else {
        //                         OGUtils.alert("Vui lòng chọn bản ghi muốn xóa!");
        //                     }
        //                 },
        //                 onContentReady: (e) => {
        //                     this.deleteButton = e.component;
        //                 },
        //                 type: "danger",
        //                 visible: self.oGConfig.canDelete(EnumsFunction.DELETE)
        //             },
        //             widget: "dxButton"
        //         }, {
        //             locateInMenu: "auto",
        //             location: "after",
        //             options: {
        //                 icon: "icon icon-refresh",
        //                 onClick: function () {
        //                     self.attributesGrid.refresh();
        //                 }
        //             },
        //             widget: "dxButton"
        //         },);
        //         this.attributesGrid.option("toolbar", this.attributesGridToolbarOptions);
        //         this.attributesGrid.endUpdate();
        //         this.zoomInButton.option("disabled", true);
        //         this.identifyButton.option("disabled", true);
        //         this.editButton.option("disabled", true);
        //         this.deleteButton.option("disabled", true);
        //         if (this.bulkEditButton) {
        //             this.bulkEditButton.option("disabled", true);
        //         }
        //     });
        //     if (this.columnEditor) {
        //         this.columnEditor.getDataSource().reload();
        //     }
        // } else if (this.oGISTable) {
        //     this.keyColumn = this.oGISTable.key_column ?? this.oGISTable.identity_column;
        //     this.identityColumn = this.oGISTable.identity_column;
        //     this.popup.option("title", "Dữ liệu " + this.oGISTable.name_vn);
        //     const columns = this.buildGridColumns(this.oGISTable.columns);
        //     const summaryInfo = this.buildSummaryInfo(this.oGISTable.columns);

        //     this.attributesGrid.beginUpdate();
        //     this.attributesGrid.option("columns", columns);
        //     this.attributesStore = new CustomStore({
        //         key: this.keyColumn ? this.keyColumn.column_name : "id",
        //         load: (loadOptions) => {
        //             const deferred = $.Deferred(),
        //                 args: { [key: string]: number | object | string } = {},
        //                 params: { [key: string]: number | object | string } = {};
        //             Object.assign(params, this.arguments);
        //             if (this.oGISTableID) {
        //                 if (loadOptions.sort) {
        //                     args.orderby = loadOptions.sort[0].selector;
        //                     if (loadOptions.sort[0].desc)
        //                         args.orderby += " desc";
        //                 }
        //                 if (loadOptions.filter && loadOptions.filter.length) {
        //                     if (!(loadOptions.filter[0] instanceof Array)) {
        //                         if (loadOptions.filter[0] === "province_code" || loadOptions.filter[0] === "district_code" || loadOptions.filter[0] === "commune_code") {
        //                             params[loadOptions.filter[0]] = [loadOptions.filter[2]];
        //                         } else {
        //                             params[loadOptions.filter[0]] = loadOptions.filter[2];
        //                         }
        //                     } else {
        //                         $.each(loadOptions.filter, function (idx: number, item) {
        //                             if (item instanceof Array) {
        //                                 if (item[0] === "province_code" || item[0] === "district_code" || item[0] === "commune_code") {
        //                                     params[item[0]] = [item[2]];
        //                                 } else {
        //                                     params[item[0]] = item[2];
        //                                 }
        //                             }
        //                         });
        //                     }
        //                 }
        //                 args.totalSummary = loadOptions.totalSummary;
        //                 args.table_id = this.oGISTableID;
        //                 args.skip = loadOptions.skip ? loadOptions.skip : 0;
        //                 args.take = loadOptions.take ? loadOptions.take : 50;
        //                 args.params = params;

        //                 axios.post("/api/feature/advanced-search", args).then((result) => {
        //                     if (result.data.status === EnumStatus.OK) {
        //                         this.dataDomains = result.data.data.domains;
        //                         this.dataRelations = result.data.data.relations;
        //                         deferred.resolve(result.data.data.dataSearch.items, {
        //                             summary: result.data.data.dataSearch.totalSummary,
        //                             totalCount: result.data.data.dataSearch.totalCount
        //                         });
        //                     } else {
        //                         deferred.resolve([], {
        //                             summary: [],
        //                             totalCount: 0
        //                         });
        //                     }
        //                 }).catch(error => {
        //                     deferred.reject("Data Loading Error: " + error);
        //                 });
        //             } else {
        //                 deferred.resolve([], {
        //                     summary: [],
        //                     totalCount: 0
        //                 });
        //             }
        //             return deferred.promise();
        //         }
        //     });
        //     this.attributesGrid.option("summary", {
        //         totalItems: summaryInfo
        //     });
        //     this.attributesGrid.option("dataSource", new DataSource({
        //         requireTotalCount: true,
        //         store: this.attributesStore
        //     }));
        //     // Xóa items toolbar cũ giữ lại item chọn cột
        //     if (this.attributesGridToolbarOptions.items.length > 1) {
        //         this.attributesGridToolbarOptions.items.splice(0, this.attributesGridToolbarOptions.items.length - 1);
        //     }
        //     this.attributesGridToolbarOptions.items.unshift({
        //         location: "before",
        //         options: {
        //             dropDownOptions: {
        //                 width: "220px",
        //             },
        //             icon: "icon icon-setting-2",
        //             items: [{
        //                 template: (e) => {
        //                     return e.text;
        //                 },
        //                 text: "Nhập dữ liệu",
        //                 visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD)
        //             }, {
        //                 icon: "icon icon-import-excel",
        //                 onClick: () => {
        //                     this.dataImportWindowComponent.for(undefined, self.oGISTable, EnumImportFileType.EXCEL, e => {
        //                         if (e.status == "OK") {
        //                             this.attributesGrid.getDataSource().reload();
        //                         }
        //                     }).show();
        //                 },
        //                 text: "Nhập dữ liệu từ file excel",
        //                 visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE) || self.oGConfig.canCreate(EnumsFunction.ADD),
        //             }, {
        //                 icon: "icon icon-export-excel",
        //                 onClick: () => {
        //                     OGUtils.postDownload("/api/layer/export/Excel", { table_id: this.oGISTable.id });
        //                 },
        //                 text: "Xuất excel",
        //             },],
        //             stylingMode: "contained",
        //             text: "Thao tác với dữ liệu",
        //             type: "default",
        //         },
        //         widget: "dxDropDownButton"
        //     }, {
        //         location: "before",
        //         options: {
        //             icon: "icon icon-info-circle",
        //             onClick: () => {
        //                 const rows = this.attributesGrid.getSelectedRowsData();
        //                 if (rows && rows.length > 0) {
        //                     if (this.oGISLayer) {
        //                         this.identifyComponent.identify(this.oGISLayer, rows[0][this.keyColumn.column_name], true);
        //                     } else if (this.oGISTable) {
        //                         this.identifyComponent.identifyRowTableFeature(rows[0][this.keyColumn.column_name], this.oGISTable.id, this.oGISTable.name_vn, false);
        //                     }
        //                 }
        //             },
        //             onContentReady: (e) => {
        //                 this.identifyButton = e.component;
        //             },
        //             text: "Xem thông tin",
        //             type: "default",
        //         },
        //         widget: "dxButton"
        //     }, {
        //         location: "before",
        //         options: {
        //             icon: "icon icon-chart-2",
        //             onClick: () => {
        //                 const rows = this.attributesGrid.getSelectedRowsData();
        //                 const ids = rows.map(p => p[this.keyColumn.column_name]) ?? [];
        //                 if (this.oGISLayer) {
        //                     this.identifyComponent.statisticRelationship.for(ids, this.oGISLayer.table?.id, this.oGISLayer.table?.name_vn).show();
        //                 } else if (this.oGISTable) {
        //                     this.identifyComponent.statisticRelationship.for(ids, this.oGISTable.id, this.oGISTable.name_vn).show();
        //                 }
        //             },
        //             text: "Thống kê tổng",
        //             type: "default",
        //         },
        //         widget: "dxButton"
        //     }, {
        //         locateInMenu: "auto",
        //         location: "after",
        //         options: {
        //             elementAttr: {
        //                 class: "dx-button-primary"
        //             },
        //             icon: "icon icon-add",
        //             onClick: () => {
        //                 this.attributesEditor.show();
        //                 const geometry = undefined;
        //                 this.attributesEditor.beginEdit({}, geometry, undefined, this.oGISTable, [], self);
        //             },
        //             onContentReady: (e) => {
        //                 this.editButton = e.component;
        //             },
        //             visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE)
        //         },
        //         widget: "dxButton"
        //     }, {
        //         locateInMenu: "auto",
        //         location: "after",
        //         options: {
        //             elementAttr: {
        //                 class: "dx-button-warning"
        //             },
        //             icon: "icon icon-edit-2",
        //             onClick: () => {
        //                 const rows = this.attributesGrid.getSelectedRowsData();
        //                 if (rows && rows.length > 0) {
        //                     if (this.oGISTable) {
        //                         OGUtils.showLoading();
        //                         const id = rows[0][this.keyColumn.column_name];
        //                         FeatureService.queryFeature(0, this.oGISTable.id, id).then(response => {
        //                             OGUtils.hideLoading();
        //                             this.attributesEditor.show();
        //                             // response.attributes.id = id;
        //                             const geom = response.attributes.geom;
        //                             let geometry = undefined;
        //                             if (geom) {
        //                                 const f = OGMapUtils.parseGeoJSON(geom.toString())[0] || undefined;
        //                                 if (f instanceof Feature) {
        //                                     geometry = f.getGeometry();
        //                                 }
        //                             }
        //                             this.attributesEditor.beginEdit(response.attributes, geometry, undefined, this.oGISTable, response.files, self);
        //                         });
        //                     }
        //                 } else {
        //                     OGUtils.alert("Vui lòng chọn bản ghi muốn chỉnh sửa!");
        //                 }
        //             },
        //             onContentReady: (e) => {
        //                 this.editButton = e.component;
        //             },
        //             visible: self.oGConfig.canUpdate(EnumsFunction.UPDATE)
        //         },
        //         widget: "dxButton"
        //     }, {
        //         locateInMenu: "auto",
        //         location: "after",
        //         options: {
        //             icon: "icon icon-trash",
        //             onClick: () => {
        //                 const rows = this.attributesGrid.getSelectedRowsData();
        //                 if (rows && rows.length > 0) {
        //                     if (this.oGISTable) {
        //                         const data = {
        //                             attributes: rows[0],
        //                             table_id: this.oGISTable.id
        //                         };
        //                         OGUtils.confirm("Bạn có chắc chắn xóa đối tượng ?", "Xác nhận").then((anws) => {
        //                             if (anws) {
        //                                 $.ajax({
        //                                     contentType: "application/json",
        //                                     data: JSON.stringify(data),
        //                                     success: (xhr) => {
        //                                         if (xhr.status === EnumStatus.OK) {
        //                                             this.attributesGrid.getDataSource().reload();
        //                                             OGUtils.alert("Xóa đối tượng thành công!", "Thông báo");
        //                                         } else {
        //                                             OGUtils.alert("Xóa thông tin thất bại. Vui lòng thử lại sau.", "Thông báo");
        //                                         }
        //                                     },
        //                                     type: "POST",
        //                                     url: "/api/feature/delete",
        //                                 });
        //                             }
        //                         });
        //                     }
        //                 } else {
        //                     OGUtils.alert("Vui lòng chọn bản ghi muốn xóa!");
        //                 }
        //             },
        //             onContentReady: (e) => {
        //                 this.deleteButton = e.component;
        //             },
        //             type: "danger",
        //             visible: self.oGConfig.canDelete(EnumsFunction.DELETE)
        //         },
        //         widget: "dxButton"
        //     }, {
        //         location: "after",
        //         options: {
        //             icon: "icon icon-refresh",
        //             onClick: () => {
        //                 this.attributesGrid.getDataSource().reload();
        //             }
        //         },
        //         widget: "dxButton"
        //     });
        //     this.attributesGrid.option("toolbar", this.attributesGridToolbarOptions);
        //     this.attributesGrid.endUpdate();
        //     this.identifyButton.option("disabled", true);
        // }
        return this;
    }

    public getAttributesGrid(): dxDataGrid {
        return this.attributesGrid;
    }
    public hideToolbar(): void {
        const self = this;
        if (self.zoomInButton) { self.zoomInButton.option("visible", false); }
        if (self.identifyButton) { self.identifyButton.option("visible", false); }
        if (self.editButton) { self.editButton.option("visible", false); }
        if (self.deleteButton) { self.deleteButton.option("visible", false); }
        if (self.approvedButton) { self.approvedButton.option("visible", false); }
        if (self.bulkEditButton) { self.bulkEditButton.option("visible", false); }
    }
    onInit(): void {
        const self = this;
        this.attributesGrid = $("<div />").appendTo(this.options.container).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnChooser: {
                enabled: true,
                mode: "select",
            },
            errorRowEnabled: true,
            filterRow: {
                visible: true,
            },
            groupPanel: {
                visible: true   // or "auto"
            },
            grouping: {
                autoExpandAll: false,
                contextMenuEnabled: true
            },
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onRowPrepared: (e) => {
                if (e.rowType == "totalFooter") {
                    $(e.rowElement).find("td:eq(1)").attr("colspan", 3);
                    $(e.rowElement).find("td:eq(1)").css("text-align", "left");
                    $(e.rowElement).find("td:eq(1)").children().css("text-align", "left");
                }
            },
            onSelectionChanged: () => {
                const rows = self.attributesGrid.getSelectedRowsData();

                if (rows && rows.length === 1) {
                    const isApproved = rows[0]["is_approved"] === true ? true : false;
                    if (self.zoomInButton) { self.zoomInButton.option("disabled", false); }
                    if (self.identifyButton) { self.identifyButton.option("disabled", false); }
                    if (self.editButton) { self.editButton.option("disabled", false); }
                    if (self.deleteButton) { self.deleteButton.option("disabled", false); }
                    if (self.approvedButton) {
                        self.approvedButton.option("disabled", isApproved);
                    }
                    if (self.bulkEditButton) { self.bulkEditButton.option("disabled", false); }
                    if (self.sendMailButton) { self.sendMailButton.option("disabled", false); }
                } else if (rows && rows.length > 1) {
                    if (self.zoomInButton) { self.zoomInButton.option("disabled", true); }
                    if (self.identifyButton) { self.identifyButton.option("disabled", true); }
                    if (self.editButton) { self.editButton.option("disabled", true); }
                    if (self.deleteButton) { self.deleteButton.option("disabled", true); }
                    if (self.approvedButton) { self.approvedButton.option("disabled", true); }
                    if (self.sendMailButton) { self.sendMailButton.option("disabled", true); }
                    if (self.bulkEditButton) { self.bulkEditButton.option("disabled", false); }
                } else {
                    if (self.zoomInButton) { self.zoomInButton.option("disabled", true); }
                    if (self.identifyButton) { self.identifyButton.option("disabled", true); }
                    if (self.editButton) { self.editButton.option("disabled", true); }
                    if (self.deleteButton) { self.deleteButton.option("disabled", true); }
                    if (self.approvedButton) { self.approvedButton.option("disabled", true); }
                    if (self.sendMailButton) { self.sendMailButton.option("disabled", true); }
                    if (self.bulkEditButton) { self.bulkEditButton.option("disabled", true); }
                }
            },
            onToolbarPreparing: (e) => {
                this.attributesGridToolbarOptions = e.toolbarOptions;
            },
            pager: {
                allowedPageSizes: [50, 100, 200],
                displayMode: "full",
                infoText: "{2} bản ghi",
                showInfo: true,
                showNavigationButtons: true,
                showPageSizeSelector: true,
                visible: true
            },
            paging: {
                pageSize: 50
            },
            remoteOperations: {
                filtering: true,
                groupPaging: true,
                grouping: true,
                paging: true,
                sorting: true,
                summary: true,
            },
            scrolling: {
                showScrollbar: "always"
            },
            searchPanel: { visible: true },
            selection: {
                mode: "multiple",
                showCheckBoxesMode: "onClick"
            },
            showBorders: true,
            showRowLines: true,
            syncLookupFilterValues: false,
            width: "100%"
        }).dxDataGrid("instance");
        this.initBatchFeatureUpdate();
        this.initCheckQuality();
    }
}

export { AttributeTableComponent, AttributeTableOption };
