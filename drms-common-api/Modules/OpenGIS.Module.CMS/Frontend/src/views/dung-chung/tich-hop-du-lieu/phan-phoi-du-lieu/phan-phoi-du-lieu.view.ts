import { OGMapUtils } from "@opengis/map";
import { LoadOptions } from "devextreme/data";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid, { ColumnCellTemplateData, EditorPreparingEvent } from "devextreme/ui/data_grid";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/multi_view";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/select_box";
import "devextreme/ui/tag_box";

import { AttributesEditorComponent } from "../../../../../../../libs/core/components/attributes-editor/attributes-editor.component";
import { AttributesWindowComponent, AttributesWindowOption } from "../../../../../../../libs/core/components/attributes-window/attributes-window.component";
import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { SwitchModuleWindowComponent } from "../../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { EnumGeometry, EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { OGConfigModel } from "../../../../../../../libs/core/models/config.model";
import { OGLayerModel } from "../../../../../../../libs/core/models/layer.model";
import { TableService } from "../../../../../../../libs/core/services/table.service";

class PhanPhoiDuLieuView implements IBaseComponent {
    attributesWindowComponent: AttributesWindowComponent;
    config: OGConfigModel;
    layerGrid: dxDataGrid;
    switchModule: SwitchModuleWindowComponent;
    tableInfo: OGLayerModel;
    tableSchema: string;
    tableSchemaStore: CustomStore;
    tableViewsContainer: JQuery<HTMLElement>;
    constructor(container: JQuery<HTMLElement>, config: OGConfigModel) {
        this.tableViewsContainer = container;
        this.config = config;
        this.onInit();
    }

    private initLayout(): void {

    }

    private initlayerGrid(): void {
        this.layerGrid = $("<div />").appendTo(this.tableViewsContainer).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnChooser: {
                enabled: true,
                mode: "select",
            },
            columns: [{
                alignment: "center",
                allowFiltering: false,
                allowSearch: false,
                allowSorting: false,
                caption: "#",
                cellTemplate: (container, options) => {
                    const pageIndex = this.layerGrid.pageIndex();
                    const pageSize = this.layerGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
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
                alignment: "center",
                allowEditing: false,
                allowFiltering: false,
                allowSearch: false,
                allowSorting: false,
                caption: "Thao tác",
                cellTemplate: (container, options: ColumnCellTemplateData<OGLayerModel, number>) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [
                            {
                                options: {
                                    hint: "Thông tin dữ liệu",
                                    icon: "icon icon-book",
                                    onClick: () => {
                                        this.attributesWindowComponent.for(options.data, options.data.table).show();
                                    },
                                    type: "default"
                                },
                                widget: "dxButton"
                            },]
                    });
                },
                dataField: "id",
                width: 100,
            }],
            dataSource: new CustomStore({
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
                                OGUtils.alert("Lưu lớp dữ liệu thành công");
                            } else {
                                OGUtils.alert(xhr.errors[0].message, "Lỗi");
                            }
                        },
                        type: "POST",
                        url: "/api/layer/saveOrUpdate",
                    });
                },
            }),
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        colSpan: 2,
                        dataField: "order",
                        label: {
                            text: "Thứ tự"
                        }
                    }, {
                        colSpan: 2,
                        dataField: "table_schema",
                        editorOptions: {
                            showClearButton: true,
                        },
                        validationRules: [{
                            message: "Vui lòng chọn schema",
                            type: "required",
                        }],
                    }, {
                        colSpan: 2,
                        dataField: "table_name",
                        editorOptions: {
                            showClearButton: true,
                        },
                        validationRules: [{
                            message: "Vui lòng nhập tên bảng",
                            type: "required",
                        }, {
                            message: "Tên bảng không thế có kí tự đặc biệt",
                            type: "custom",
                            validationCallback: (params) => {
                                return OGUtils.isNormalize(params.value);
                            }
                        }],
                    }, {
                        colSpan: 2,
                        dataField: "name_vn",
                        editorOptions: {
                            showClearButton: true,
                        },
                        validationRules: [{
                            message: "Vui lòng nhập mô tả",
                            type: "required",
                        }]
                    }, {
                        dataField: "name_en",
                        editorOptions: {
                            showClearButton: true,
                        },
                        validationRules: [{
                            message: "Vui lòng nhập mô tả",
                            type: "required",
                        }]
                    }, {
                        dataField: "table_schema",
                        visible: false,
                    }],
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin bảng",
                    width: 400,
                },
                useIcons: true
            },
            filterRow: {
                visible: true,
            },
            height: "100%",
            onEditorPreparing: (e: EditorPreparingEvent<OGLayerModel, number>) => {
                if (e.parentType == "dataRow") {
                    if (!e.row.isNewRow && e.dataField === "table_name") {
                        e.editorOptions.readOnly = true;
                    }
                }
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            pager: {
                allowedPageSizes: [50, 100, 200],
                showInfo: true,
                showNavigationButtons: true,
                showPageSizeSelector: true,
                visible: true
            },
            paging: {
                enabled: true,
                pageSize: 50
            },
            remoteOperations: {
                filtering: true,
                groupPaging: false,
                grouping: false,
                paging: true,
                sorting: true,
                summary: false,
            },
            scrolling: {
                showScrollbar: "always"
            },
            searchPanel: { visible: true },
            selection: {
                mode: "single",
                showCheckBoxesMode: "none"
            },
            showBorders: true,
            showRowLines: true,
            sorting: {
                mode: "single",
            },
            toolbar: {
                items: [
                    {
                        location: "before",
                        template: () => {
                            return "<h6>Phân phối dữ liệu cấp dữ liệu</h6>";
                        }
                    },
                    {
                        location: "after",
                        options: {
                            dataSource: new DataSource({
                                store: this.tableSchemaStore,
                            }),
                            displayExpr: "description",
                            onSelectionChanged: (e) => {
                                this.tableSchema = e.selectedItem ? e.selectedItem.schema_name : "";
                                this.layerGrid.refresh(true);
                            },
                            placeholder: "Chọn Schema",
                            searchEnabled: true,
                            searchExprv: ["schema_name", "description"],
                            searchMode: "contains",
                            showClearButton: true,
                            valueExpr: "schema_name",
                            width: 200
                        },
                        widget: "dxSelectBox"
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
                    }, "searchPanel", "groupPanel"]
            },
            width: "100%"
        }).dxDataGrid("instance");
    }

    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());
        this.attributesWindowComponent = new AttributesWindowComponent(null, {
            attributeEditors: new AttributesEditorComponent(null),
            oGConfig: this.config,
            showButton: true
        } as AttributesWindowOption);
        this.switchModule = new SwitchModuleWindowComponent("table");
        this.tableSchemaStore = new CustomStore({
            byKey: (key) => {
                const def = $.Deferred();
                if (key) {
                    $.get("/api/table/schema/" + key).done(xhr => {
                        if (xhr.status === EnumStatus.OK) {
                            def.resolve(xhr.data);
                        } else {
                            def.resolve({});
                        }
                    });
                } else {
                    def.resolve({});
                }
                return def;
            },
            key: "schema_name",
            load: () => {
                const def = $.Deferred();
                $.get("/api/table/schema/list").done(xhr => {
                    if (xhr.status === EnumStatus.OK) {
                        def.resolve(xhr.data);
                    } else {
                        def.resolve({});
                    }
                });
                return def;
            },
            // loadMode: "raw"
        });
        this.initLayout();
        this.initlayerGrid();
    }
}
export { PhanPhoiDuLieuView };