import { OGMap, OGMapUtils } from "@opengis/map";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/list";
import dxList from "devextreme/ui/list";
import "devextreme/ui/multi_view";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/select_box";
import dxSelectBox from "devextreme/ui/select_box";

import { EnumGeometry, EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { FeatureFile } from "../../models/feature.model";
import { OGLayerClassifyModel, OGLayerModel } from "../../models/layer.model";
import { OGTableColumnModel, OGTableSchemaModel } from "../../models/table.model";
import { IMapComponent } from "../base-component.abstract";
import { StyleEditorComponent } from "../style-editor/style-editor.component";
import { LayerClassifyComponent } from "./layer-classify/layer-classify.component";
import { LayerFieldComponent } from "./layer-field/layer-field.component";
import { LayerIndexComponent } from "./layer-index/layer-index.component";
import "./layers.component.scss";

const FileType = {
    GDB: "GDB",
    GEOJSON: "GeoJson",
    SHAPEFILE: "ShapeFile",
};

class LayerComponent implements IMapComponent {
    container: JQuery<HTMLElement>;
    createLayerFromFilePopup: dxPopup;
    createLayerFromGDBPopup: dxPopup;
    createSchemaFromFilePopup: dxPopup;
    importFileForm: dxForm;
    importFileSchemaForm: dxForm;
    importFileType: Blob | string;
    importFiles: FeatureFile[];
    importFilesList: dxList;
    importGDBForm: dxForm;
    importGDBList: dxList;
    inputFile: JQuery<HTMLElement>;
    layerClassifyFieldSelectBox: dxSelectBox;
    layerClassifyGrid: dxDataGrid;
    layerClassifyGridComponent: LayerClassifyComponent;
    layerClassifyStore: CustomStore<OGLayerClassifyModel, number>;
    layerFieldComponent: LayerFieldComponent;
    layerFieldStore: CustomStore<OGTableColumnModel, number>;
    layerForm: dxForm;
    layerGrid: dxDataGrid;
    layerGroupID: number | string;
    layerGroupSelectBox: dxSelectBox;
    layerIndexComponent: LayerIndexComponent;
    layerIndexesGrid: dxDataGrid;
    layerIndexesStore: CustomStore;
    layerPopup: dxPopup;
    layerStore: CustomStore<OGLayerModel, number>;
    layerViews: dxMultiView;
    mapId: number;
    oGMap: OGMap;
    selectedLayerInfo: OGLayerModel;
    styleEditor: StyleEditorComponent;
    tableSchema: number | string;
    tableSchemaDataSource: DataSource<OGTableSchemaModel, number>;
    tableSchemaFileList: dxList;
    tableSchemaStore: CustomStore<OGTableSchemaModel, number>;
    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.onInit();
    }
    private initLayerGrid(container): void {
        const self = this;
        this.layerPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.layerForm = $("<form />").appendTo(container)
                    .dxForm({
                        colCount: 1,
                        formData: {
                            geometry: "",
                            name_vn: "",
                            schema: ""
                        },
                        items: [{
                            colSpan: 1,
                            dataField: "name_vn",

                            label: {
                                text: "Tên lớp",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên lớp",
                                type: "required"
                            }]
                        }, {
                            dataField: "schema",
                            editorOptions: {
                                dataSource: this.tableSchemaDataSource,
                                displayExpr: "description",
                                onContentReady: (e) => {
                                    e.element.find(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        $ele.attr("title", $ele.text());
                                    });
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                searchExpr: ["schema_name", "description"],
                                searchMode: "contains",
                                value: "",
                                valueExpr: "schema_name"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Schema",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn schema",
                                type: "required"
                            }]
                        }, {
                            dataField: "geometry",
                            editorOptions: {
                                dataSource: [{
                                    text: "Đa điểm",
                                    value: EnumGeometry.MultiPoint
                                }, {
                                    text: "Đa đường",
                                    value: EnumGeometry.MultiLineString
                                }, {
                                    text: "Đa vùng",
                                    value: EnumGeometry.MultiPolygon
                                }, {
                                    text: "Điểm",
                                    value: EnumGeometry.Point
                                }, {
                                    text: "Đường",
                                    value: EnumGeometry.LineString
                                }, {
                                    text: "Vùng",
                                    value: EnumGeometry.Polygon
                                }],
                                displayExpr: "text",
                                placeholder: "[Chọn...]",
                                value: "",
                                valueExpr: "value"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Dạng hình học",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn dạng hình học",
                                type: "required"
                            }]
                        }, {
                            dataField: "layer_group_id",
                            label: {
                                text: "Nhóm lớp dữ liệu",
                            },
                            template: (options, container) => {
                                this.layerGroupSelectBox = $("<div />").appendTo(container).dxSelectBox({
                                    dataSource: [],
                                    disabled: true,
                                    displayExpr: "name_vn",
                                    onContentReady: () => {
                                        $(".dx-list-item-content").each(function () {
                                            const $ele = $(this);
                                            if (this.offsetWidth < this.scrollWidth) {
                                                $ele.attr("title", $ele.text());
                                            }
                                        });
                                    },
                                    placeholder: "[Chọn...]",
                                    searchEnabled: true,
                                    searchExpr: ["name_vn", "name_en"],
                                    searchMode: "contains",
                                    showClearButton: true,
                                    value: 0,
                                    valueExpr: "id"
                                }).dxSelectBox("instance");
                            },
                        }, {
                            colSpan: 1,
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 1,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.layerForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.layerForm.option("formData");
                                                        data.layer_group_id = this.layerGroupSelectBox.option("value");
                                                        /*data.__RequestVerificationToken = token;*/
                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify(data),
                                                            type: "POST",
                                                            url: "/api/layer/" + data.schema + "/save",
                                                        }).done(xhr => {
                                                            if (xhr.status === EnumStatus.OK) {
                                                                OGUtils.alert("Lưu lớp dữ liệu thành công!").then(() => {
                                                                    this.layerGrid.refresh();
                                                                    this.layerPopup.hide();
                                                                });
                                                            } else {
                                                                if (xhr.errors.length) {
                                                                    OGUtils.alert(xhr.errors[0].message);
                                                                }
                                                                else {
                                                                    OGUtils.alert("Thêm lớp dữ liệu thất bại!");
                                                                }
                                                            }
                                                        });
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
                                                    this.layerPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }
                        ],
                        onContentReady: () => {
                        },
                        scrollingEnabled: true,
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onOptionChanged: () => {
            },
            position: {
                at: "center",
                my: "center",
                of: window
            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Thêm lớp dữ liệu",
            width: "25%",
        }).dxPopup("instance");

        this.layerGrid = $("<div />").appendTo(container).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnChooser: {
                enabled: true,
                mode: "select"
            },
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.layerGrid.pageIndex();
                    const pageSize = this.layerGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                visible: true,
                width: 50,
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Biểu tượng",
                cellTemplate: (container, options) => {
                    if (options.value) {
                        OGMapUtils.geoStylerStyleToCanvas(JSON.parse(options.value), 36, $("<canvas />").appendTo($("<center />").appendTo(container)).get(0) as HTMLCanvasElement);
                    }
                },
                dataField: "styles",
                width: "120px"
            }, {
                caption: "Hiển thị?",
                dataField: "is_visible",
                width: "80px",
            }, {
                caption: "Tên lớp",
                dataField: "name_vn",
            }, {
                caption: "Hình dạng",
                dataField: "geometry",
                groupIndex: 1,
                lookup: {
                    dataSource: {
                        store: new ArrayStore({
                            data: [{
                                geometry: EnumGeometry.Point,
                                text: "Điểm"
                            }, {
                                geometry: EnumGeometry.MultiPoint,
                                text: "Đa điểm"
                            }, {
                                geometry: EnumGeometry.LineString,
                                text: "Đường"
                            }, {
                                geometry: EnumGeometry.MultiLineString,
                                text: "Đa đường"
                            }, {
                                geometry: EnumGeometry.Polygon,
                                text: "Vùng"
                            }, {
                                geometry: EnumGeometry.MultiPolygon,
                                text: "Đa vùng"
                            }],
                            key: "geometry"
                        })
                    },
                    displayExpr: "text",
                    valueExpr: "geometry",
                },
                width: "100px"
            }, {
                caption: "Nhóm lớp dữ liệu",
                dataField: "layer_group.name_vn",
                groupCellTemplate: (cellElement, cellInfo) => {
                    cellElement.html(cellInfo.text ? "Nhóm lớp dữ liệu: " + cellInfo.text : "Chưa thuộc nhóm nào");
                },
                groupIndex: 0
            }, {
                caption: "Nhóm lớp dữ liệu",
                dataField: "layer_group_id",
                lookup: {
                    allowClearing: true,
                    dataSource: {
                        store: new CustomStore({
                            byKey: (key) => {
                                const deferred = $.Deferred();
                                if (key) {
                                    $.get("/api/layer/group/" + key.toString()).done(xhr => {
                                        if (xhr && xhr.status === EnumStatus.OK) {
                                            deferred.resolve(xhr.data);
                                        }
                                        deferred.resolve([]);
                                    });
                                } else {
                                    deferred.resolve([]);
                                }
                                return deferred;
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
                                args.table_schema = this.tableSchema;

                                $.ajax({
                                    contentType: "application/json",
                                    dataType: "json",
                                    error: () => {
                                        deferred.reject("Data Loading Error");
                                    },
                                    success: (result) => {
                                        if (result.status === EnumStatus.OK && result.data && result.data.length > 0) {
                                            deferred.resolve({
                                                data: result.data,
                                                totalCount: result.data.length
                                            });
                                        } else {
                                            deferred.resolve({
                                                data: [],
                                                totalCount: 0
                                            });
                                        }
                                    },
                                    type: "get",
                                    url: "/api/layer/groups?table_schema=" + args.table_schema,
                                });

                                return deferred.promise();
                            },
                            loadMode: "raw"
                        }),
                    },
                    displayExpr: "name_vn",
                    valueExpr: "id",
                },
                visible: false
            }, {
                caption: "Trường classify",
                dataField: "classify_column_id",
                lookup: {
                    allowClearing: true,
                    dataSource: {
                        store: this.layerFieldStore,
                    },
                    displayExpr: "name_vn",
                    valueExpr: "id",
                },
                visible: false
            }, {
                caption: "Trường hiển thị tên",
                cellTemplate: (cellElement, cellInfo) => {
                    cellElement.html(cellInfo.data.label_column ? cellInfo.data.label_column.name_vn : "");
                },
                dataField: "label_column_id",
                lookup: {
                    allowClearing: true,
                    dataSource: {
                        store: this.layerFieldStore,
                    },
                    displayExpr: "name_vn",
                    valueExpr: "id",
                },
                width: 150
            }, {
                alignment: "center",
                caption: "Thứ tự",
                dataField: "order",
                width: 80,
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                hint: "Chỉnh sửa",
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    this.selectedLayerInfo = options.data;
                                    this.layerGrid.editRow(options.rowIndex);
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                disabled: options.data.permanent,
                                hint: "Xóa",
                                icon: "icon icon-trash",
                                onClick: () => {
                                    this.selectedLayerInfo = options.data;
                                    if (options.data.permanent === false) {
                                        OGUtils.confirm("Xóa lớp dữ liệu này?").then(value => {
                                            if (value) {
                                                options.component.getDataSource().store().remove(options.data.id).then(() => {
                                                    options.component.getDataSource().reload();
                                                });
                                            }
                                        });
                                    }
                                },
                                type: "danger"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                dropDownOptions: {
                                    width: "150px"
                                },
                                icon: "icon icon-setting-2",
                                items: [{
                                    onClick: () => {
                                        this.selectedLayerInfo = options.data;
                                        this.styleEditor.for(options.data).show();
                                    },
                                    text: "Biểu tượng",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        this.selectedLayerInfo = options.data;
                                        this.layerFieldComponent.for(this.selectedLayerInfo).refresh();
                                        this.layerViews.option("selectedIndex", 1);
                                    },
                                    text: "Trường thông tin",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        this.selectedLayerInfo = options.data;
                                        this.layerClassifyGridComponent.for(this.selectedLayerInfo).refresh();
                                        this.layerViews.option("selectedIndex", 2);
                                    },
                                    text: "Classify",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        this.selectedLayerInfo = options.data;
                                        this.layerIndexComponent.for(this.selectedLayerInfo).refresh();
                                        this.layerViews.option("selectedIndex", 3);
                                    },
                                    text: "Chỉ mục",
                                    type: "default"
                                }],
                                onContentReady: (e) => {
                                    e.element.find(".dx-list-item").each(function () {
                                        const $ele = $(this);
                                        $ele.attr("title", $ele.find(".dx-list-item-content").text());
                                    });
                                },
                                stylingMode: "contained",
                                text: "Thao tác",
                                type: "default"
                            },
                            widget: "dxDropDownButton"
                        }]
                    });
                },
                width: 250,
            }],
            dataSource: {
                store: this.layerStore
            },
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        dataField: "name_vn"
                    }, {
                        dataField: "layer_group_id",
                    }, {
                        dataField: "label_column_id",
                    }, {
                        dataField: "classify_column_id",
                    }, {
                        dataField: "order",
                    }, {
                        dataField: "is_visible",
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin lớp",
                    width: "auto"
                },
                texts: {
                    cancelRowChanges: "Hủy",
                    saveRowChanges: "Lưu",
                },
                useIcons: false
            },
            errorRowEnabled: false,
            filterRow: {
                visible: true,
            },
            groupPanel: {
                visible: true,
            },
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            onEditorPreparing: (e) => {
                if (e.row) {
                    this.selectedLayerInfo = e.row.data;
                }
                //
                // if (e.parentType == "dataRow") {
                //     if (e.dataField === "geom") {
                //         e.editorOptions.disabled = !e.row.inserted;
                //     }
                // }
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                e.toolbarOptions.items.push({
                    location: "before",
                    options: {
                        dataSource: this.tableSchemaDataSource,
                        displayExpr: "description",
                        onContentReady: (e) => {
                            e.element.find(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                $ele.attr("title", $ele.text());
                            });
                        },
                        onSelectionChanged: (e) => {
                            this.tableSchema = e.selectedItem.schema_name;
                            this.layerGrid.refresh(true);
                        },
                        placeholder: "Chọn Schema",
                        searchEnabled: true,
                        searchExpr: ["schema_name", "description"],
                        searchMode: "contains",
                        valueExpr: "schema_name",
                        width: 200
                    },
                    widget: "dxSelectBox"
                }, {
                    location: "before",
                    options: {
                        onClick: () => {
                            if (this.tableSchema) {
                                OGUtils.confirm("Xác nhận đồng bộ lớp dữ liệu?").then((_) => {
                                    if (_) {
                                        OGUtils.showLoading();
                                        $.get("/api/schema/sync?schema=" + this.tableSchema).then((xhr) => {
                                            OGUtils.hideLoading();
                                            if (xhr.status == "OK") {
                                                this.layerGrid.getDataSource().reload();
                                            }
                                            else {
                                                if (xhr.errors && xhr.errors.length > 0) {
                                                    OGUtils.alert(xhr.errors[0].message || "Đồng bộ thất bại!");
                                                } else {
                                                    OGUtils.alert("Đồng bộ thất bại!!");
                                                }
                                            }
                                        });
                                    }
                                });
                            } else {
                                OGUtils.toastError("Vui lòng chọn schema muốn đồng bộ");
                            }
                        },
                        text: "Đồng bộ lớp dữ liệu",
                        type: "success"
                    },
                    widget: "dxButton"
                });
                e.toolbarOptions.items.unshift({
                    location: "after",
                    options: {
                        dropDownOptions: {
                            width: "230px"
                        },
                        icon: "icon icon-setting-2",
                        items: [{
                            icon: "icon icon-add-layer",
                            onClick: () => {
                                this.layerForm.resetValues();
                                this.layerPopup.show();
                            },
                            text: "Tạo lớp dữ liệu",
                            type: "default"
                        }, {
                            icon: "icon icon-import-shp",
                            onClick: () => {
                                this.importFileType = FileType.SHAPEFILE;
                                this.createLayerFromFilePopup.option("title", "Tạo lớp dữ liệu mới từ Shapefile");
                                this.createLayerFromFilePopup.show();
                            },
                            text: "Tạo lớp dữ liệu từ Shapefile",
                            type: "default"
                        }, {
                            icon: "icon icon-geojson",
                            onClick: () => {
                                this.importFileType = FileType.GEOJSON;
                                this.createLayerFromFilePopup.option("title", "Tạo lớp dữ liệu mới từ GEOJSON/KML");
                                this.createLayerFromFilePopup.show();
                            },
                            text: "Tạo lớp dữ liệu từ GEOJSON/KML",
                            type: "default"
                        }, {
                            icon: "icon icon-import-gdb",
                            onClick: () => {
                                this.importFileType = FileType.GDB;
                                this.createLayerFromGDBPopup.option("title", "Tạo lớp dữ liệu mới từ GDB");
                                this.createLayerFromGDBPopup.show();
                            },
                            text: "Tạo lớp dữ liệu từ GDB",
                            type: "default"
                        }, {
                            icon: "icon icon-schema",
                            onClick: () => {
                                this.importFileType = FileType.GDB;
                                this.createSchemaFromFilePopup.option("title", "Tạo schema mới từ GDB");
                                this.createSchemaFromFilePopup.show();
                            },
                            text: "Tạo schema mới từ GDB",
                            type: "default"
                        }],
                        onContentReady: (e) => {
                            e.element.find(".dx-list-item").each(function () {
                                const $ele = $(this);
                                $ele.attr("title", $ele.find(".dx-list-item-content").text());
                            });
                        },
                        stylingMode: "contained",
                        text: "Tạo lớp dữ liệu",
                        type: "default"
                    },
                    widget: "dxDropDownButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới bảng",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            this.layerGrid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                });
            },
            pager: {
                allowedPageSizes: [50, 100, 200],
                infoText: "{2} bản ghi",
                showInfo: true,
                showNavigationButtons: false,
                showPageSizeSelector: true,
                visible: true,
                /*displayMode: 'compact'*/
            },
            paging: {
                enabled: true,
                pageSize: 50
            },
            remoteOperations: {
                filtering: true,
                groupPaging: true,
                grouping: false,
                paging: true,
            },
            scrolling: {
                showScrollbar: "always"
            },
            searchPanel: {
                visible: true
            },
            selection: {
                mode: "single"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",
            wordWrapEnabled: true,
        }).dxDataGrid("instance");

        this.createLayerFromFilePopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.importFileForm = $("<div/>").appendTo(container).dxForm({
                    colCount: 1,
                    formData: {
                    },
                    items: [
                        {
                            dataField: "layer_name",

                            label: {
                                text: "Tên lớp",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên lớp",
                                type: "required"
                            }]
                        }, {
                            dataField: "schema_name",
                            editorOptions: {
                                dataSource: this.tableSchemaDataSource,
                                displayExpr: "description",
                                onContentReady: (e) => {
                                    e.element.find(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        $ele.attr("title", $ele.text());
                                    });
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                searchExpr: ["schema_name", "description"],
                                searchMode: "contains",
                                value: "",
                                valueExpr: "schema_name"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Schema",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn schema",
                                type: "required"
                            }]
                        }, {
                            dataField: "geometry",
                            editorOptions: {
                                dataSource: [{
                                    text: "Đa điểm",
                                    value: EnumGeometry.MultiPoint
                                }, {
                                    text: "Đa đường",
                                    value: EnumGeometry.MultiLineString
                                }, {
                                    text: "Đa vùng",
                                    value: EnumGeometry.MultiPolygon
                                }, {
                                    text: "Điểm",
                                    value: EnumGeometry.Point
                                }, {
                                    text: "Đường",
                                    value: EnumGeometry.LineString
                                }, {
                                    text: "Vùng",
                                    value: EnumGeometry.Polygon
                                }],
                                displayExpr: "text",
                                placeholder: "[Chọn...]",
                                value: "",
                                valueExpr: "value"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Dạng hình học",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn dạng hình học",
                                type: "required"
                            }]
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "before",
                                            options: {
                                                onClick: () => {
                                                    this.inputFile.trigger("click");
                                                },
                                                stylingMode: "contained",
                                                text: "Nhập file",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }, {
                            template: (itemData, itemElement) => {
                                this.importFilesList = $("<div />").appendTo(itemElement).dxList({
                                    itemTemplate(data) {
                                        data.file_name = data.file_name.substring(data.file_name.indexOf(".zip") + 4, 0);
                                        return `<a href=${data.url}>${data.file_name}</a >`;
                                    },
                                    onContentReady() {

                                    },
                                    onSelectionChanged: () => {
                                    },
                                    selectionMode: "single",
                                }).dxList("instance");
                            }
                        }, {
                            colSpan: 1,
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 1,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.importFileForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        OGUtils.showLoading();
                                                        const data = this.importFileForm.option("formData");
                                                        const formData = new FormData();
                                                        formData.append("layer_name", data.layer_name);
                                                        formData.append("schema_name", data.schema_name);
                                                        formData.append("geometry", data.geometry);
                                                        formData.append("file", self.importFiles[0].file);
                                                        formData.append("importType", this.importFileType);
                                                        const xhr = new XMLHttpRequest();
                                                        xhr.open("POST", "/api/layer/createLayerByImportFile", true);
                                                        xhr.responseType = "json";
                                                        xhr.onload = function () {
                                                        };
                                                        xhr.onloadend = () => {
                                                            OGUtils.hideLoading();
                                                            if (xhr.response.status == "OK") {
                                                                OGUtils.alert("Tạo mới lớp dữ liệu thành công");
                                                                this.layerGrid.getDataSource().reload();
                                                                this.createLayerFromFilePopup.hide();
                                                            } else {
                                                                OGUtils.alert(xhr.response.errors[0].message, "Lỗi");
                                                            }
                                                        };
                                                        xhr.send(formData);
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
                                                    this.createLayerFromFilePopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }
                    ],
                    labelLocation: "left",
                    minColWidth: 300,
                    showColonAfterLabel: true,
                    width: "100%",
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onHiding: () => {
                self.importFileForm.option("formData", {});
                self.inputFile.val(null);
                self.importFiles = [];
                self.importFilesList.option("dataSource", self.importFiles);
                self.importGDBList.option("dataSource", self.importFiles);
                self.tableSchemaFileList.option("dataSource", self.importFiles);
            },
            onOptionChanged: () => {
            },
            position: {
                at: "center",
                my: "center",
                of: window
            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Tạo lớp dữ liệu mới từ file",
            width: "25%",
        }).dxPopup("instance");

        this.createLayerFromGDBPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.importGDBForm = $("<div/>").appendTo(container).dxForm({
                    colCount: 1,
                    formData: {
                    },
                    items: [
                        {
                            dataField: "layer_name",

                            label: {
                                text: "Tên lớp",
                            },
                        }, {
                            dataField: "schema_name",
                            editorOptions: {
                                dataSource: this.tableSchemaDataSource,
                                displayExpr: "description",
                                onContentReady: (e) => {
                                    e.element.find(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        $ele.attr("title", $ele.text());
                                    });
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                searchExpr: ["schema_name", "description"],
                                searchMode: "contains",
                                value: "",
                                valueExpr: "schema_name"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Schema",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn schema",
                                type: "required"
                            }]
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "before",
                                            options: {
                                                onClick: () => {
                                                    this.inputFile.trigger("click");
                                                },
                                                stylingMode: "contained",
                                                text: "Nhập file",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }, {
                            template: (itemData, itemElement) => {
                                this.importGDBList = $("<div />").appendTo(itemElement).dxList({
                                    itemTemplate(data) {
                                        data.file_name = data.file_name.substring(data.file_name.indexOf(".zip") + 4, 0);
                                        return `<a href=${data.url}>${data.file_name}</a >`;
                                    },
                                    onContentReady() {

                                    },
                                    onSelectionChanged: () => {
                                    },
                                    selectionMode: "single",
                                }).dxList("instance");
                            }
                        }, {
                            colSpan: 1,
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 1,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.importGDBForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        OGUtils.showLoading();
                                                        const data = this.importGDBForm.option("formData");
                                                        const formData = new FormData();
                                                        formData.append("layer_name", data.layer_name ?? "");
                                                        formData.append("schema_name", data.schema_name);
                                                        formData.append("file", self.importFiles[0].file);
                                                        formData.append("importType", this.importFileType);
                                                        const xhr = new XMLHttpRequest();
                                                        xhr.open("POST", "/api/layer/createLayerByImportFile", true);
                                                        xhr.responseType = "json";
                                                        xhr.onload = function () {
                                                        };
                                                        xhr.onloadend = () => {
                                                            OGUtils.hideLoading();
                                                            if (xhr.response.status == "OK") {
                                                                OGUtils.alert("Tạo mới lớp dữ liệu thành công");
                                                                this.layerGrid.getDataSource().reload();
                                                                this.createLayerFromGDBPopup.hide();
                                                            } else {
                                                                OGUtils.alert(xhr.response.errors[0].message, "Lỗi");
                                                            }
                                                        };
                                                        xhr.send(formData);
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
                                                    this.createLayerFromGDBPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }
                    ],
                    labelLocation: "left",
                    minColWidth: 300,
                    showColonAfterLabel: true,
                    width: "100%",
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onHiding: () => {
                self.importFileForm.option("formData", {});
                self.inputFile.val(null);
                self.importFiles = [];
                self.importFilesList.option("dataSource", self.importFiles);
                self.importGDBList.option("dataSource", self.importFiles);
                self.tableSchemaFileList.option("dataSource", self.importFiles);
            },
            onOptionChanged: () => {
            },
            position: {
                at: "center",
                my: "center",
                of: window
            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Tạo lớp dữ liệu mới từ file",
            width: "25%",
        }).dxPopup("instance");

        this.createSchemaFromFilePopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.importFileSchemaForm = $("<div/>").appendTo(container).dxForm({
                    colCount: 1,
                    formData: {
                    },
                    items: [
                        {
                            dataField: "schema_name",

                            label: {
                                text: "Tên schema",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên schema",
                                type: "required"
                            }]
                        }, {
                            dataField: "description",

                            label: {
                                text: "Mô tả",
                            },
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "before",
                                            options: {
                                                onClick: () => {
                                                    this.inputFile.trigger("click");
                                                },
                                                stylingMode: "contained",
                                                text: "Nhập file",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }, {
                            template: (itemData, itemElement) => {
                                this.tableSchemaFileList = $("<div />").appendTo(itemElement).dxList({
                                    itemTemplate(data) {
                                        data.file_name = data.file_name.substring(data.file_name.indexOf(".zip") + 4, 0);
                                        return `<a href=${data.url}>${data.file_name}</a >`;
                                    },
                                    onContentReady() {

                                    },
                                    onSelectionChanged: () => {
                                    },
                                    selectionMode: "single",
                                }).dxList("instance");
                            }
                        }, {
                            colSpan: 1,
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 1,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.importFileSchemaForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        if (self.importFiles && self.importFiles.length) {
                                                            OGUtils.showLoading();
                                                            const data = this.importFileSchemaForm.option("formData");
                                                            const formData = new FormData();
                                                            formData.append("schema_name", data.schema_name);
                                                            formData.append("description", data.description);
                                                            formData.append("file", self.importFiles[0].file);
                                                            formData.append("importType", this.importFileType);
                                                            const xhr = new XMLHttpRequest();
                                                            xhr.open("POST", "/api/layer/createSchemaByImportFile", true);
                                                            xhr.responseType = "json";
                                                            xhr.onload = function () {
                                                            };
                                                            xhr.onloadend = () => {
                                                                OGUtils.hideLoading();
                                                                if (xhr.response) {
                                                                    this.layerGrid.getDataSource().reload();
                                                                    if (xhr.response.status == "OK") {
                                                                        OGUtils.alert("Tạo mới schema liệu thành công");
                                                                        this.createSchemaFromFilePopup.hide();
                                                                    } else if (xhr.response.errors && xhr.response.errors.length) {
                                                                        OGUtils.alert(xhr.response.errors[0].message, "Lỗi");
                                                                    }
                                                                }
                                                            };
                                                            xhr.send(formData);
                                                        }
                                                        else {
                                                            OGUtils.alert("Vui lòng chọn file", "Lỗi");
                                                        }
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
                                                    this.createSchemaFromFilePopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }
                    ],
                    labelLocation: "left",
                    minColWidth: 300,
                    showColonAfterLabel: true,
                    width: "100%",
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onHiding: () => {
                self.importFileForm.option("formData", {});
                self.inputFile.val(null);
                self.importFiles = [];
                self.importFilesList.option("dataSource", self.importFiles);
                self.importGDBList.option("dataSource", self.importFiles);
                self.tableSchemaFileList.option("dataSource", self.importFiles);
            },
            onOptionChanged: () => {
            },
            position: {
                at: "center",
                my: "center",
                of: window
            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Tạo schema mới từ file",
            width: "25%",
        }).dxPopup("instance");

        this.inputFile = $("<input type=\"file\" accept=\".zip\" style=\"display:none !important\" />")
            .appendTo(container)
            .on("change", (e: JQuery.TriggeredEvent) => {
                for (let i = 0; i < e.target.files.length; i++) {
                    const file = e.target.files[i];
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const url = e.target.result;
                        self.importFiles = [{
                            extension: file.name.substring(file.name.lastIndexOf(".")),
                            file: file,
                            file_name: file.name,
                            mime_type: file.type,
                            size: file.size,
                            uid: OGUtils.uuidv4(),
                            url: url
                        }];
                        self.importFilesList.option("dataSource", self.importFiles);
                        self.importGDBList.option("dataSource", self.importFiles);
                        self.tableSchemaFileList.option("dataSource", self.importFiles);
                    };
                    reader.readAsDataURL(file);
                }
            });
    }
    private initLayerViews(): void {
        this.layerViews = $("<div />").appendTo(this.container).dxMultiView({
            deferRendering: false,
            height: "100%",
            items: [{
                template: (data, index, element) => {
                    this.initLayerGrid(element);
                }
            }, {
                template: (data, index, element) => {
                    this.layerFieldComponent = new LayerFieldComponent(element);
                }
            }, {
                template: (data, index, element) => {
                    this.layerClassifyGridComponent = new LayerClassifyComponent(element);
                }
            }, {
                template: (data, index, element) => {
                    this.layerIndexComponent = new LayerIndexComponent(element);
                }
            }],
            swipeEnabled: false
        }).dxMultiView("instance");
        this.layerFieldComponent.addLayerView(this.layerViews);
        this.layerClassifyGridComponent.addLayerView(this.layerViews);
        this.layerIndexComponent.addLayerView(this.layerViews);
        this.layerViews.element().find(".dx-multiview-wrapper").css("border", "none");
    }

    onInit(): void {
        this.tableSchemaStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                if (key) {
                    $.get("/api/table/schema/" + key.toString()).done(xhr => {
                        if (xhr && xhr.status === EnumStatus.OK) {
                            deferred.resolve(xhr.data);
                        }
                        deferred.resolve({});
                    });
                } else {
                    deferred.resolve({});
                }
                return deferred;
            },
            insert: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            OGUtils.toastSuccess("Tạo schema thành công!");
                        } else {
                            OGUtils.toastError(xhr);
                        }
                    },
                    type: "POST",
                    url: "/api/table/schema/create",
                });
            },
            key: "schema_name",
            load: () => {
                const deferred = $.Deferred();
                $.get("/api/table/schema/list").done(xhr => {
                    if (xhr && xhr.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data);
                    }
                    deferred.resolve([]);
                });
                return deferred;
            },
            loadMode: "raw",
            remove: (key) => {
                return $.ajax({
                    data: { schema_name: key },
                    type: "POST",
                    url: "/api/table/schema/delete",
                });
            },
            update: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            OGUtils.alert("Cập nhật thành công");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
                        }
                    },
                    type: "POST",
                    url: "/api/table/schema/update",
                });
            },
        });
        this.layerStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                if (key) {
                    $.get("/api/layer/get-fields?id=" + key).done(xhr => {
                        if (xhr && xhr.status === EnumStatus.OK) {
                            deferred.resolve(xhr.data);
                        }
                        deferred.resolve({});
                    });
                } else {
                    deferred.resolve({});
                }
                return deferred;
            },
            insert: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            OGUtils.alert("Lưu lớp dữ liệu thành công");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
                        }
                    },
                    type: "POST",
                    url: "/api/layer/" + this.tableSchema + "/save",
                });
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
                args.id = this.layerGroupID;
                args.tableSchema = this.tableSchema;
                args.mapId = this.mapId;
                if (loadOptions.filter && loadOptions.filter.length) {
                    args.keyword = loadOptions.filter[0].filterValue ?? loadOptions.filter.filterValue;
                }
                $.ajax({
                    contentType: "application/json",
                    data: args,
                    dataType: "json",
                    error: () => {
                        deferred.reject("Data Loading Error");
                    },
                    success: (result) => {
                        if (result.status == "OK" && result.data && result.data.length) {
                            deferred.resolve({
                                data: result.data,
                                totalCount: result.recordsFiltered
                            });
                        } else {
                            deferred.resolve({
                                data: [],
                                totalCount: 0
                            });
                        }
                    },
                    type: "get",
                    url: "/api/layer/list-layers",
                });
                return deferred.promise();
            },
            remove: (key) => {
                return $.ajax({
                    data: { id: key },
                    type: "POST",
                    url: "/api/layer/delete",
                });
            },
            update: (key, values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            this.layerGrid.getDataSource().reload();
                            OGUtils.alert("Lưu lớp dữ liệu thành công");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
                        }
                    },
                    type: "POST",
                    url: "/api/layer/saveOrUpdate",
                });
            },
        });
        this.layerFieldStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                if (key) {
                    $.get("/api/table/column/" + key.toString()).done(xhr => {
                        if (xhr && xhr.status === EnumStatus.OK) {
                            deferred.resolve(xhr.data);
                        }
                        deferred.resolve({});
                    });
                } else {
                    deferred.resolve({});
                }
                return deferred;
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
                args.take = loadOptions.take ? loadOptions.take : 99999;

                if (this.selectedLayerInfo && this.selectedLayerInfo.id) {
                    $.ajax({
                        data: {
                            id: this.selectedLayerInfo.id,
                            keyword: loadOptions.searchValue ? loadOptions.searchValue : ""
                        },
                        error: () => {
                            deferred.reject("Data Loading Error");
                        },
                        success: (xhr) => {
                            if (xhr && xhr.status === EnumStatus.OK) {
                                deferred.resolve({
                                    data: xhr.data,
                                    totalCount: xhr.data.length
                                });
                            } else {
                                deferred.resolve({
                                    data: [],
                                    totalCount: 0
                                });
                            }
                        },
                        type: "get",
                        url: "/api/layer/get-fields",
                    });
                } else {
                    deferred.resolve({
                        data: [],
                        totalCount: 0
                    });
                }
                return deferred.promise();
            },
        });
        this.styleEditor = new StyleEditorComponent();
        this.initLayerViews();
    }
    public reload(mapId): void {
        this.mapId = mapId;
        this.layerGrid.getDataSource().reload();
    }
}

export { LayerComponent };
