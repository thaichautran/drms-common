import { OGMapUtils } from "@opengis/map";
import axios from "axios";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
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
import "devextreme/ui/radio_group";
import "devextreme/ui/select_box";
import dxSelectBox, { dxSelectBoxOptions } from "devextreme/ui/select_box";

import { LayerComponent } from "../../../../../../libs/core/components/layer/layers.component";
import { StyleEditorComponent } from "../../../../../../libs/core/components/style-editor/style-editor.component";
import { SwitchModuleWindowComponent } from "../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumGeometry, EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { RestError } from "../../../../../../libs/core/models/base-response.model";
import { FeatureFile } from "../../../../../../libs/core/models/feature.model";
import { OGLayerGroupModel, OGLayerModel } from "../../../../../../libs/core/models/layer.model";
import { OGTableColumnModel, OGTableSchemaModel } from "../../../../../../libs/core/models/table.model";
import { BaseLayerView } from "./base-layer/base-layer.view";
import { LayerClassifyView } from "./layer-classify/layer-classify.view";
import { LayerFieldView } from "./layer-field/layer-field.view";
import { LayerGroupView } from "./layer-group/layer-group.view";
import { LayerIndexView } from "./layer-index/layer-index.view";
import "./layers.view.scss";
import { PhanPhoiDuLieuView } from "./phan-phoi-du-lieu/phan-phoi-du-lieu.view";
import { TableSchemaView } from "./table-schema/table-schema.view";
import { TichHopDuLieuView } from "./tich-hop-du-lieu/tich-hop-du-lieu.view";
const FileType = {
    GDB: "GDB",
    GEOJSON: "GeoJson",
    SHAPEFILE: "ShapeFile",
};

@RazorView()
class LayerView extends Layout {
    baseLayerViewsContainer: JQuery<HTMLElement>;
    copyLayerForm: dxForm;
    copyLayerPopup: dxPopup;
    createBaseLayerPopup: dxPopup;
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
    layerClassifyView: LayerClassifyView;
    layerComponent: LayerComponent;
    layerFieldStore: CustomStore<OGTableColumnModel, number>;
    layerFieldView: LayerFieldView;
    layerForm: dxForm;
    layerGrid: dxDataGrid;
    layerGroupGrid: dxDataGrid;
    layerGroupGridContainer: JQuery<HTMLElement>;
    layerGroupID: number | string;
    layerGroupSelectBox: dxSelectBox;
    layerGroupStore: CustomStore<OGLayerGroupModel, number>;
    layerIndexView: LayerIndexView;
    layerPopup: dxPopup;
    layerStore: CustomStore<OGLayerModel, number>;
    layerViews: dxMultiView;
    layerViewsContainer: JQuery<HTMLElement>;
    multiFileInput: JQuery<HTMLElement>;
    selectedLayerInfo: OGLayerModel;
    styleEditor: StyleEditorComponent;
    switchModule: SwitchModuleWindowComponent;
    tableSchema: number | string;
    tableSchemaFileList: dxList;
    tableSchemaGrid: dxDataGrid;
    tableSchemaGridContainer: JQuery<HTMLElement>;
    tableSchemaStore: CustomStore<OGTableSchemaModel, number>;
    updateSchemaFileList: dxList;
    updateSchemaForm: dxForm;
    updateSchemaFromFilePopup: dxPopup;

    constructor() {
        super("child", "Quản lý lớp dữ liệu");
    }
    private bindEvents(): void {
        const self = this;
        $(document).on("click", ".switch-module-action", function () {
            self.switchModule.showPopup();
        });
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
                                dataSource: {
                                    store: this.tableSchemaStore,
                                },
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
                                                                this.layerGrid.refresh();
                                                                this.layerPopup.hide();
                                                                OGUtils.toastSuccess("Lưu lớp dữ liệu thành công!");
                                                            } else {
                                                                if (xhr.errors.length) {
                                                                    OGUtils.toastError(xhr);
                                                                }
                                                                else {
                                                                    OGUtils.toastError("Thêm lớp dữ liệu thất bại!");
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
                                if (this.tableSchema) {
                                    args.table_schema = this.tableSchema;
                                }
                                $.ajax({
                                    contentType: "application/json",
                                    dataType: "json",
                                    error: () => {
                                        deferred.reject("Data Loading Error");
                                    },
                                    success: (result) => {
                                        if (result.status === EnumStatus.OK && result.data && result.data.length > 0) {
                                            deferred.resolve(result.data);
                                        } else {
                                            deferred.resolve([]);
                                        }
                                    },
                                    type: "get",
                                    url: this.tableSchema ? "/api/layer/groups?table_schema=" + this.tableSchema : "/api/layer/groups",
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
                caption: "Mức zoom nhỏ nhất",
                dataField: "min_zoom",
                dataType: "number",
                visible: false,
            }, {
                alignment: "center",
                caption: "Mức zoom lớn nhất",
                dataField: "max_zoom",
                dataType: "number",
                visible: false,
            }, {
                alignment: "center",
                caption: "Mức zoom nhỏ nhất cho label",
                dataField: "label_min_zoom",
                dataType: "number",
                visible: false,
            }, {
                alignment: "center",
                caption: "Mức zoom lớn nhất cho label",
                dataField: "label_max_zoom",
                dataType: "number",
                visible: false,
            }, {
                alignment: "center",
                caption: "Hiển thị mũi tên chỉ hướng (Line)",
                dataField: "show_line_arrow",
                dataType: "boolean",
                visible: false,
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
                                    self.selectedLayerInfo = options.data;
                                    options.component.editRow(options.rowIndex);
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
                                    self.selectedLayerInfo = options.data;
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
                                        self.selectedLayerInfo = options.data;
                                        self.styleEditor.for(options.data, undefined, this.layerGrid).show();
                                    },
                                    text: "Biểu tượng",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        self.selectedLayerInfo = options.data;
                                        self.layerFieldView.reload(self.selectedLayerInfo);
                                        self.layerViews.option("selectedIndex", 1);
                                    },
                                    text: "Trường thông tin",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        self.selectedLayerInfo = options.data;
                                        self.layerClassifyView.reload(self.selectedLayerInfo);
                                        self.layerViews.option("selectedIndex", 2);
                                    },
                                    text: "Classify",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        self.selectedLayerInfo = options.data;
                                        self.layerIndexView.reload(self.selectedLayerInfo);
                                        self.layerViews.option("selectedIndex", 3);
                                    },
                                    text: "Chỉ mục",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        self.selectedLayerInfo = options.data;
                                        OGUtils.confirm("Bạn muốn xóa toàn bộ dữ liệu của lớp " + self.selectedLayerInfo.name_vn + "?").then(value => {
                                            if (value) {
                                                OGUtils.confirm("Xác nhận xóa dữ liệu lớp?").then(_ => {
                                                    if (_) {
                                                        axios.post("/api/layer/" + self.selectedLayerInfo.id + "/clear-data").then(result => {
                                                            if (result.data.status === EnumStatus.OK) {
                                                                OGUtils.toastSuccess("Xóa dữ liệu lớp thành công!");
                                                            } else {
                                                                OGUtils.toastError(result.data);
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    },
                                    text: "Xóa dữ liệu lớp",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        self.selectedLayerInfo = options.data;
                                        self.copyLayerPopup.show();
                                    },
                                    text: "Sao chép lớp dữ liệu",
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
                        dataField: "min_zoom",
                    }, {
                        dataField: "max_zoom",
                    }, {
                        dataField: "label_min_zoom",
                    }, {
                        dataField: "label_max_zoom",
                    }, {
                        dataField: "is_visible",
                    }, {
                        dataField: "show_line_arrow",
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
                        dataSource: {
                            store: this.tableSchemaStore,
                        },
                        displayExpr: "description",
                        onContentReady: (e) => {
                            e.element.find(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                $ele.attr("title", $ele.text());
                            });
                        },
                        onSelectionChanged: (e) => {
                            this.tableSchema = e.selectedItem?.schema_name;
                            this.layerGrid.refresh(true);
                        },
                        placeholder: "Chọn Schema",
                        searchEnabled: true,
                        searchExpr: ["schema_name", "description"],
                        searchMode: "contains",
                        showClearButton: true,
                        valueExpr: "schema_name",
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
                                        $.post("/api/layer/sync-layer?tableSchema=" + this.tableSchema).then((xhr) => {
                                            OGUtils.hideLoading();
                                            if (xhr.status == "OK") {
                                                OGUtils.toastSuccess("Đồng bộ thành công!");
                                                this.layerGrid.getDataSource().reload();
                                            }
                                            else {
                                                OGUtils.toastError(xhr);
                                            }
                                        });
                                    }
                                });
                            } else {
                                OGUtils.toastError("Vui lòng chọn schema muốn đồng bộ!");
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
                        onClick: () => {
                            self.importFileType = FileType.GDB;
                            self.updateSchemaFromFilePopup.show();
                        },
                        text: "Cập nhật dữ liệu từ GDB",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
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
                                this.createLayerFromFilePopup.option("title", "Tạo lớp dữ liệu mới từ GEOJSON");
                                this.createLayerFromFilePopup.show();
                            },
                            text: "Tạo lớp dữ liệu từ GEOJSON",
                            type: "default"
                        }, {
                            icon: "icon icon-d-cube-scan",
                            onClick: () => {
                                this.importFileType = FileType.GEOJSON;
                                this.createLayerFromFilePopup.option("title", "Tạo lớp dữ liệu mới từ KML");
                                this.createLayerFromFilePopup.show();
                            },
                            text: "Tạo lớp dữ liệu từ KML",
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

        this.copyLayerPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.copyLayerForm = $("<div/>").appendTo(container).dxForm({
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
                                dataSource: {
                                    store: this.tableSchemaStore,
                                },
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
                            dataField: "copy_type",
                            editorOptions: {
                                dataSource: [
                                    { key: "onlystruct", text: "Chỉ sao chép cấu trúc" },
                                    { key: "fulldata", text: "Sao chép cấu trúc và dữ liệu" },
                                ],
                                displayExpr: "text",
                                valueExpr: "key"
                            },
                            editorType: "dxRadioGroup",
                            label: {
                                text: "Phương pháp sao chép",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn phương pháp sao chép",
                                type: "required"
                            }]
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
                                                    const validate = this.copyLayerForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        OGUtils.showLoading();
                                                        const data = this.copyLayerForm.option("formData");
                                                        if (data.copy_type === "fulldata") {
                                                            data.is_copy_data = true;
                                                        }
                                                        data.layer_id = this.selectedLayerInfo.id;
                                                        axios({
                                                            data: data,
                                                            method: "POST",
                                                            url: "/api/layer/copy-layer"
                                                        }).then(result => {
                                                            if (result.data && result.data.status === EnumStatus.OK) {
                                                                OGUtils.toastSuccess("Sao chép lớp dữ liệu thành công!");
                                                                this.layerGrid.getDataSource().reload();
                                                                this.copyLayerPopup.hide();
                                                            } else {
                                                                OGUtils.toastError(result.data);
                                                            }
                                                        });
                                                    }
                                                },
                                                stylingMode: "contained",
                                                text: "Sao chép",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    this.copyLayerPopup.hide();
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
                self.copyLayerForm.option("formData", {});
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
            title: "Sao chép lớp dữ liệu",
            width: 500,
        }).dxPopup("instance");

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
                                dataSource: {
                                    store: this.tableSchemaStore,
                                },
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
                                                                OGUtils.toastSuccess("Tạo mới lớp dữ liệu thành công");
                                                                this.layerGrid.getDataSource().reload();
                                                                this.createLayerFromFilePopup.hide();
                                                            } else {
                                                                OGUtils.toastError(xhr.response);
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
                self.refreshFileList();
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
                                dataSource: {
                                    store: this.tableSchemaStore,
                                },
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
                                    scrollByContent: true,
                                    selectionMode: "single",
                                }).dxList("instance");
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
                                                                OGUtils.toastSuccess("Tạo mới lớp dữ liệu thành công");
                                                                this.layerGrid.getDataSource().reload();
                                                                this.createLayerFromGDBPopup.hide();
                                                            } else {
                                                                OGUtils.toastError(xhr.response);
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
                self.refreshFileList();
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
                                                                        OGUtils.toastSuccess("Tạo mới schema liệu thành công");
                                                                        this.createSchemaFromFilePopup.hide();
                                                                    } else if (xhr.response.errors && xhr.response.errors.length) {
                                                                        OGUtils.toastError(xhr.response);
                                                                    }
                                                                }
                                                            };
                                                            xhr.send(formData);
                                                        }
                                                        else {
                                                            OGUtils.toastError("Vui lòng chọn tệp!");
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
                self.refreshFileList();
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

        this.updateSchemaFromFilePopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.updateSchemaForm = $("<div/>").appendTo(container).dxForm({
                    colCount: 1,
                    formData: {
                    },
                    items: [
                        {
                            dataField: "schema_name",
                            editorOptions: {
                                dataSource: this.tableSchemaStore,
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
                            dataField: "is_replace_alias",
                            editorType: "dxCheckBox",
                            label: {
                                text: "Cập nhật Alias?",
                            },
                        }, {
                            dataField: "is_clear_data",
                            editorType: "dxCheckBox",
                            label: {
                                text: "Xóa dữ liệu cũ?",
                            },
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "before",
                                            options: {
                                                onClick: () => {
                                                    this.multiFileInput.trigger("click");
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
                                this.updateSchemaFileList = $("<div />").appendTo(itemElement).dxList({
                                    height: 200,
                                    itemTemplate(data) {
                                        data.file_name = data.file_name.substring(data.file_name.indexOf(".zip") + 4, 0);
                                        return `<a href=${data.url}>${data.file_name}</a >`;
                                    },
                                    onContentReady() {

                                    },
                                    onSelectionChanged: () => {
                                    },
                                    scrollByContent: true,
                                    selectionMode: "none",
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
                                                    const validate = this.updateSchemaForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        if (self.importFiles && self.importFiles.length) {
                                                            OGUtils.showLoading();
                                                            const data = this.updateSchemaForm.option("formData");
                                                            const formData = new FormData();
                                                            formData.append("schema_name", data.schema_name);
                                                            formData.append("is_replace_alias", data.is_replace_alias ?? false);
                                                            formData.append("is_clear_data", data.is_clear_data ?? false);
                                                            formData.append("description", data.description);
                                                            self.importFiles.map(o => {
                                                                formData.append("files", o.file);
                                                            });
                                                            formData.append("importType", this.importFileType);
                                                            const xhr = new XMLHttpRequest();
                                                            xhr.open("POST", "/api/layer/createSchemaByImportFileCopy", true);
                                                            xhr.responseType = "json";
                                                            xhr.onload = function () {
                                                            };
                                                            xhr.onloadend = () => {
                                                                OGUtils.hideLoading();
                                                                if (xhr.response) {
                                                                    this.layerGrid.getDataSource().reload();
                                                                    if (xhr.response.status == "OK") {
                                                                        OGUtils.alert("Cập nhật dữ liệu schema thành công");
                                                                        this.updateSchemaFromFilePopup.hide();
                                                                    } else if (xhr.response.errors && xhr.response.errors.length) {
                                                                        OGUtils.alert(xhr.response as RestError);
                                                                    }
                                                                }
                                                            };
                                                            xhr.send(formData);
                                                        }
                                                        else {
                                                            OGUtils.toastError("Vui lòng chọn file", "Lỗi");
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
                                                    this.updateSchemaFromFilePopup.hide();
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
                self.refreshFileList();
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
            title: "Cập nhật dữ liệu schema mới từ GDB",
            width: "25%",
        }).dxPopup("instance");

        this.inputFile = $("<input type=\"file\" accept=\".zip,.rar,.7zip\" style=\"display:none !important\" />")
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
                        self.updateSchemaFileList.option("dataSource", self.importFiles);
                    };
                    reader.readAsDataURL(file);
                }
            });

        this.multiFileInput = $("<input multiple type=\"file\" accept=\".zip\" style=\"display:none !important\" />")
            .appendTo(container)
            .on("change", (e: JQuery.TriggeredEvent) => {
                self.importFiles = [];
                for (let i = 0; i < e.target.files.length; i++) {
                    const file = e.target.files[i];
                    self.importFiles.push({
                        extension: file.name.substring(file.name.lastIndexOf(".")),
                        file: file,
                        file_name: file.name,
                        mime_type: file.type,
                        size: file.size,
                        uid: OGUtils.uuidv4(),
                    });
                    self.importFilesList.option("dataSource", self.importFiles);
                    self.importGDBList.option("dataSource", self.importFiles);
                    self.tableSchemaFileList.option("dataSource", self.importFiles);
                    self.updateSchemaFileList.option("dataSource", self.importFiles);
                }
            });
    }
    private initLayerViews(): void {
        this.layerViews = $("<div />").appendTo(this.layerViewsContainer).dxMultiView({
            deferRendering: false,
            height: "100%",
            items: [{
                template: (data, index, element) => {
                    this.initLayerGrid(element);
                }
            }, {
                template: (data, index, element) => {
                    this.layerFieldView = new LayerFieldView(element);
                }
            }, {
                template: (data, index, element) => {
                    this.layerClassifyView = new LayerClassifyView(element);
                }
            }, {
                template: (data, index, element) => {
                    this.layerIndexView = new LayerIndexView(element);
                }
            }],
            swipeEnabled: false
        }).dxMultiView("instance");
        this.layerFieldView.addLayerView(this.layerViews);
        this.layerClassifyView.addLayerView(this.layerViews);
        this.layerIndexView.addLayerView(this.layerViews);
        this.layerViews.element().find(".dx-multiview-wrapper").css("border", "none");
    }
    // private initTableSchemaGrid(): void {
    //     this.tableSchemaGrid = $("<div />").appendTo(this.tableSchemaGridContainer).dxDataGrid({
    //         allowColumnReordering: true,
    //         allowColumnResizing: true,
    //         columnChooser: {
    //             enabled: true,
    //             mode: "select"
    //         },
    //         columns: [{
    //             alignment: "center",
    //             caption: "STT",
    //             cellTemplate: (container, options) => {
    //                 const pageIndex = this.tableSchemaGrid.pageIndex();
    //                 const pageSize = this.tableSchemaGrid.pageSize();
    //                 container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
    //             },
    //             dataField: "index",
    //             visible: true,
    //             width: 50,
    //         }, {
    //             caption: "Tên schema",
    //             dataField: "schema_name"
    //         }, {
    //             caption: "Mô tả",
    //             dataField: "description"
    //         }, {
    //             alignment: "center",
    //             allowEditing: false,
    //             caption: "Thao tác",
    //             cellTemplate: (container, options) => {
    //                 $("<div>").appendTo(container).dxToolbar({
    //                     items: [{
    //                         location: "center",
    //                         options: {
    //                             icon: "icon icon-edit-2",
    //                             onClick: () => {
    //                                 options.component.editRow(options.rowIndex);
    //                             },
    //                             type: "success"
    //                         },
    //                         widget: "dxButton"
    //                     }, {
    //                         location: "center",
    //                         options: {
    //                             icon: "icon icon-trash",
    //                             onClick: () => {
    //                                 OGUtils.confirm("Xóa schema này? Tất cả các lớp dữ liệu thuộc schema cũng bị xóa theo!").then(value => {
    //                                     if (value) {
    //                                         options.component.getDataSource().store().remove(options.value).then(() => {
    //                                             options.component.getDataSource().reload();
    //                                         });
    //                                     }
    //                                 });
    //                             },
    //                             type: "danger"
    //                         },
    //                         widget: "dxButton"
    //                     }]
    //                 });
    //             },
    //             width: 150,
    //         }],
    //         dataSource: {
    //             store: this.tableSchemaStore
    //         },
    //         editing: {
    //             form: {
    //                 colCount: 1,
    //                 items: [{
    //                     dataField: "description"
    //                 }]
    //             },
    //             mode: "popup",
    //             popup: {
    //                 height: "auto",
    //                 showTitle: true,
    //                 title: "Thông tin schema",
    //                 width: 500,
    //             },
    //             texts: {
    //                 cancelRowChanges: "Hủy",
    //                 saveRowChanges: "Lưu",
    //             },
    //             useIcons: false
    //         },
    //         errorRowEnabled: false,
    //         filterRow: {
    //             visible: true,
    //         },
    //         height: "100%",
    //         onContentReady: () => {
    //         },
    //         onRowUpdating: function (options) {
    //             $.extend(options.newData, $.extend({}, options.oldData, options.newData));
    //         },
    //         onToolbarPreparing: (e) => {
    //             e.toolbarOptions.items.unshift({
    //                 location: "after",
    //                 options: {
    //                     onClick: () => {
    //                         this.tableSchemaGrid.addRow();
    //                     },
    //                     text: "Thêm nhóm mới",
    //                     type: "default"
    //                 },
    //                 widget: "dxButton"
    //             }, {
    //                 location: "after",
    //                 options: {
    //                     hint: "Làm mới bảng",
    //                     icon: "icon icon-refresh",
    //                     onClick: () => {
    //                         this.tableSchemaGrid.getDataSource().reload();
    //                     }
    //                 },
    //                 widget: "dxButton"
    //             });
    //         },
    //         pager: {
    //             allowedPageSizes: [50, 100, 200],
    //             showInfo: true,
    //             showNavigationButtons: true,
    //             showPageSizeSelector: true,
    //             visible: true,
    //             /*displayMode: 'compact'*/
    //         },
    //         paging: {
    //             enabled: true,
    //             pageSize: 50
    //         },
    //         scrolling: {
    //             showScrollbar: "always"
    //         },
    //         searchPanel: { visible: true },
    //         selection: {
    //             mode: "single"
    //         },
    //         showBorders: true,
    //         showRowLines: true,
    //         width: "100%",
    //     }).dxDataGrid("instance");
    // }

    private refreshFileList(): void {
        this.inputFile.val(null);
        this.importFiles = [];
        this.importFilesList.option("dataSource", this.importFiles);
        this.importGDBList.option("dataSource", this.importFiles);
        this.tableSchemaFileList.option("dataSource", this.importFiles);
        this.updateSchemaFileList.option("dataSource", this.importFiles);
    }

    onInit(): void {
        this.tableSchemaGridContainer = $("#table-schema-container");
        this.layerGroupGridContainer = $("#layer-group-container");
        this.layerViewsContainer = $("#layer-container");
        this.baseLayerViewsContainer = $("#base-layer-container");
        this.switchModule = new SwitchModuleWindowComponent("layer");

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
                            OGUtils.toastSuccess("Thêm schema thành công");
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
                    deferred.resolve({});
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
                            OGUtils.toastSuccess("Cập nhật thành công");
                        } else {
                            OGUtils.toastError(xhr);
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
                            OGUtils.toastSuccess("Lưu thông tin thành công!");
                        } else {
                            OGUtils.toastError(xhr);
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
                            OGUtils.toastSuccess("Lưu lớp dữ liệu thành công");
                        } else {
                            OGUtils.toastError(xhr);
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
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight());
        // this.initTableSchemaGrid();
        new LayerGroupView(this.layerGroupGridContainer);
        new BaseLayerView(this.baseLayerViewsContainer);
        new TableSchemaView(this.tableSchemaGridContainer);
        new TichHopDuLieuView($("#tichhop-dulieu-container"));
        // new PhanPhoiDuLieuView($("#phanphoi-dulieu-container"));
        this.initLayerViews();
        this.bindEvents();
    }
}
