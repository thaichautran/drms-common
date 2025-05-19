import { OGMap, OGMapUtils } from "@opengis/map";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/form";
import "devextreme/ui/list";
import "devextreme/ui/multi_view";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/popup";
import "devextreme/ui/select_box";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { OGTableColumnModel, OGTableModel } from "../../models/table.model";
import { IMapComponent} from "../base-component.abstract";
import { TableColumnComponent } from "./table-columns/table-columns.component";
import "./tables.component.scss";

class TableComponent implements IMapComponent {
    container: JQuery<HTMLElement>;

    mapId: number;
    mapViews: dxMultiView;
    oGMap: OGMap;
    tableColumnComponent: TableColumnComponent;
    tableColumnStore: CustomStore<OGTableColumnModel, number>;
    tableGrid: dxDataGrid;
    tableInfo: OGTableModel;
    tableStore: CustomStore<OGTableModel, number>;
    tableViews: dxMultiView;
    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.onInit();
    }

    private initTableGrid(container): void {
        this.tableGrid = $("<div />").appendTo(container).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnChooser: {
                enabled: true,
                mode: "select",

            },
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.tableGrid.pageIndex();
                    const pageSize = this.tableGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                visible: true,
                width: 50,
            }, {
                alignment: "center",
                caption: "Thứ tự",
                dataField: "order",
                width: 70
            }, {
                caption: "Tên bảng",
                dataField: "table_name"
            }, {
                caption: "Mô tả",
                dataField: "name_vn"
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{

                            options: {
                                hint: "Chỉnh sửa",
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    this.tableGrid.editRow(options.rowIndex);
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {

                            options: {
                                disabled: options.data.permanent,
                                hint: "Xoá",
                                icon: "icon icon-trash",
                                onClick: () => {
                                    if (options.data.permanent === false) {
                                        OGUtils.confirm("Xóa bảng dữ liệu này?").then(value => {
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

                            options: {
                                onClick: () => {
                                    this.tableInfo = options.data;
                                    this.tableColumnComponent.reload(this.tableInfo);
                                    this.tableViews.option("selectedIndex", 1);
                                },
                                text: "Trường thông tin",
                                type: "default"
                            },
                            widget: "dxButton"
                        }]
                    });
                },
                dataField: "id",
                width: 300,
            }
            ],
            dataSource: {
                store: this.tableStore
            },
            editing: {
                form: {

                    items: [{
                        dataField: "order",
                    }, {
                        dataField: "table_name",
                        validationRules: [{
                            message: "Vui lòng nhập tên bảng",
                            type: "required",
                        }, {
                            message: "Tên bảng không thế có kí tự đặc biệt",
                            type: "custom",
                            validationCallback: (params) => {
                                return OGUtils.isNormalize(params.value);
                            }
                        }]
                    }, {
                        dataField: "name_vn",
                        validationRules: [{
                            message: "Vui lòng nhập mô tả",
                            type: "required",
                        }]
                    }, {
                        dataField: "table_schema",
                        visible: false,
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin bảng",
                    width: 400,
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
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onContentReady: () => {
            },
            onEditorPreparing: (e) => {
                if (e.parentType == "dataRow") {
                    this.tableInfo = e.row.data;
                    if (e.dataField === "geometry") {
                        // e.editorOptions.disabled = !e.row.inserted;
                    } else if (e.dataField === "label_column_id") {
                        e.editorElement.dxSelectBox({
                            dataSource: {
                                store: new CustomStore({
                                    byKey: (key) => {
                                        return $.get("/api/table/column/" + key);
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
                                        
                                        if (e.row.data && e.row.data.id) {
                                            $.ajax({
                                                data: {
                                                    id: e.row.data.id,
                                                    keyword: loadOptions.searchValue
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
                                                timeout: 5000,
                                                type: "get",
                                                url: "/api/layer/get-fields"
                                            });
                                        } else {
                                            deferred.resolve({
                                                data: [],
                                                totalCount: 0
                                            });
                                        }
                                        return deferred.promise();
                                    }
                                })
                            },
                            displayExpr: "name_vn",
                            onValueChanged: function (ea) { e.setValue(ea.value); },
                            searchEnabled: true,
                            value: e.value,
                            valueExpr: "id",
                        });
                        e.cancel = true;
                    }
                }
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;
                e.toolbarOptions.items.unshift({
                    location: "before",
                    options: {
                        hint: "Quay lại",
                        icon: "icon icon-arrow-left",
                        onClick: () => {
                            this.mapViews.option("selectedIndex", 0);
                        },
                        type: "danger"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        onClick: () => {
                            this.tableGrid.addRow();
                        },
                        text: "Tạo bảng dữ liệu",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới bảng",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            dataGrid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                });
            },
            pager: {
                allowedPageSizes: [50, 100, 200],
                infoText: "{2} bản ghi",
                showInfo: true,
                showNavigationButtons: true,
                showPageSizeSelector: true,
                visible: true,
                /*displayMode: 'compact'*/
            },
            paging: {
                enabled: true,
                pageSize: 50
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
            width: "100%",
        }).dxDataGrid("instance");
    }
    private initTableViews(): void {
        this.tableViews = $("<div />").appendTo(this.container).dxMultiView({
            deferRendering: false,
            height: "100%",
            items: [{
                template: (itemData, itemIndex, itemElement) => {
                    this.initTableGrid(itemElement);
                }
            }, {
                template: (itemData, itemIndex, itemElement) => {
                    this.tableColumnComponent = new TableColumnComponent(itemElement);
                }
            }],
            swipeEnabled: false
        }).dxMultiView("instance");
        this.tableViews.element().find(".dx-multiview-wrapper").css("border", "none");
        this.tableColumnComponent.addTableViews(this.tableViews);
    }

    public addMapView(mapViews: dxMultiView): void {
        this.mapViews = mapViews;
    }

    onInit(): void {
        this.tableStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                $.get("/api/table/" + key.toString()).done(xhr => {
                    if (xhr && xhr.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data);
                    }
                    deferred.resolve({});
                });
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
                
                $.ajax({
                    data: {
                        keyword: loadOptions.searchValue,
                        mapId: this.mapId
                    },
                    error: () => {
                        deferred.reject("Data Loading Error");
                    },
                    success: (result) => {
                        deferred.resolve({
                            data: result.data, 
                            totalCount: result.data.length
                        });
                    },
                    type: "get",
                    url: "/api/table/list",
                });
                return deferred.promise();
            },
            loadMode: "raw",
            remove: (key) => {
                return $.ajax({
                    data: {
                        table_id: key,
                    },
                    type: "post",
                    url: "/api/map/table/delete",
                });
            },
            update: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    type: "post",
                    url: "/api/table/update",
                });
            }
        });
        this.tableColumnStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                $.get("/api/table/column/" + key.toString()).done(xhr => {
                    if (xhr && xhr.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            },
            insert: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    type: "POST",
                    url: "/api/table/" + this.tableInfo.id + "/columns/add",
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
                
                if (this.tableInfo && this.tableInfo.id) {
                    $.ajax({
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
                        url: "/api/table/" + this.tableInfo.id + "/columns",
                    });
                } else {
                    deferred.resolve({
                        data: [], 
                        totalCount: 0
                    });
                }
                return deferred.promise();
            },
            remove: (key) => {
                return $.ajax({
                    data: {
                        id: key,
                    },
                    type: "POST",
                    url: "/api/table/" + this.tableInfo.id + "/columns/delete",
                });
            },
            update: (key, values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    type: "post",
                    url: "/api/table/" + values.table_id + "/columns/update",
                });
            }
        });
        this.initTableViews();
    }

    public reload(mapId: number): void {
        this.mapId = mapId;
        if (this.tableGrid) {
            this.tableGrid.getDataSource().reload();
        }
    }
}

export { TableComponent };
