import CustomStore from "devextreme/data/custom_store";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import dxMultiView from "devextreme/ui/multi_view";
import dxPopup from "devextreme/ui/popup";
import dxTreeView from "devextreme/ui/tree_view";

import { IBaseComponent } from "../../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../../libs/core/helpers/utils";
import { OGMapModel } from "../../../../../../../../libs/core/models/map.model";
import { OGTableColumnModel, OGTableModel } from "../../../../../../../../libs/core/models/table.model";
import { MapService } from "../../../../../../../../libs/core/services/map.service";
import { TableColumnService, TableService } from "../../../../../../../../libs/core/services/table.service";
import { TableColumnView } from "./table-columns/table-columns.view";

class MapTableView implements IBaseComponent {
    container: JQuery<HTMLElement>;
    mapId: number;
    mapInfo: OGMapModel;
    mapTablePopup: dxPopup;
    mapTableTree: dxTreeView;
    mapViews: dxMultiView;
    tableColumnStore: CustomStore<OGTableColumnModel, number>;
    tableColumnView: TableColumnView;
    tableGrid: dxDataGrid<OGTableModel, number>;
    tableInfo: OGTableModel;
    tableStore: CustomStore<OGTableModel, number>;
    tableViews: dxMultiView;

    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.initLayout();
    }

    private initLayout(): void {
        this.tableStore = new CustomStore({
            byKey: (key) => {
                return TableService.get(key);
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
                args.keyword = loadOptions.searchValue;
                args.mapId = this.mapId;

                if (this.mapId) {
                    MapService.getTables(this.mapId, args).then(result => {
                        if (result && result.status === EnumStatus.OK) {
                            deferred.resolve({
                                data: result.data,
                                totalCount: result.recordsTotal
                            });
                        } else {
                            deferred.resolve({
                                data: [],
                                totalCount: 0
                            });
                        }
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
                return MapService.deleteTable({ map_id: this.mapId, table_id: key });
            },
            update: (key: number, values: OGTableModel) => {
                return TableService.update(values);
            }
        });
        this.tableColumnStore = new CustomStore({
            byKey: (key) => {
                return TableColumnService.get(key);
            },
            insert: (values) => {
                values.id = this.tableInfo.id;
                return TableColumnService.insert(values);
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
                    TableColumnService.list(this.tableInfo.id).then(result => {
                        if (result) {
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
                    });
                } else {
                    deferred.resolve([], {
                        totalCount: 0
                    });
                }
                return deferred.promise();
            },
            remove: (key) => {
                return TableColumnService.delete({ id: key, table_id: this.tableInfo.id });
            },
            update: (key: number, values: OGTableColumnModel) => {
                return TableColumnService.update(values);
            }
        });
        this.initTableViews();
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
                                        OGUtils.confirm("Xác nhận xóa bảng dữ liệu này khỏi bản đồ?").then(value => {
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
                                    this.tableColumnView.reload(this.tableInfo);
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
                        colSpan: 2,
                        dataField: "order",
                    }, {
                        colSpan: 2,
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
                        colSpan: 2,
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
                                        args.take = loadOptions.take ? loadOptions.take : 9999;

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
                            this.mapTableTree.beginUpdate();
                            this.mapTableTree.option("dataSource.store",
                                new CustomStore({
                                    key: "id",
                                    load: () => {
                                        const def = $.Deferred();
                                        if (this.mapId) {
                                            MapService.getTableTree(this.mapId).then(result => {
                                                if (result) {
                                                    def.resolve(result.data,);
                                                } else {
                                                    def.resolve([]);
                                                }
                                            });
                                        } else {
                                            def.resolve([]);
                                        }
                                        return def;
                                    }
                                })
                            );
                            this.mapTableTree.endUpdate();
                            this.mapTableTree["mapId"] = this.mapId;

                            this.mapTablePopup.show();
                        },
                        text: "Thêm bảng dữ liệu",
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

        this.mapTablePopup = $("<div />").addClass("role-popup").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                this.initTableTree(container);
            },
            deferRendering: false,
            dragEnabled: false,
            height: 500,
            hideOnOutsideClick: false,
            resizeEnabled: false,
            shading: true,
            showTitle: true,
            title: "Bảng dữ liệu",
            toolbarItems: [{
                location: "center",
                options: {
                    onClick: () => {
                        this.mapInfo = {
                            id: this.mapId,
                            mapTables: []
                        };
                        $.each(this.mapTableTree.getDataSource().items(), (idx, item) => {
                            if (item.items) {
                                $.each(item.items, (childIdx, child) => {
                                    if (child.selected && child.raw) {
                                        this.mapInfo.mapTables.push({
                                            table_id: child.raw.id
                                        });
                                    }
                                });
                            }
                        });

                        MapService.saveTable(this.mapInfo).then(result => {
                            if (result) {
                                OGUtils.alert("Lưu dữ liệu thành công!");
                                this.mapTablePopup.hide();
                                this.tableGrid.getDataSource().reload();
                            }
                        });
                    },
                    text: "Lưu thiết lập",
                    type: "default"
                },
                toolbar: "bottom",
                widget: "dxButton",
            }, {
                location: "center",
                options: {
                    onClick: () => {
                        this.mapTablePopup.hide();
                    },
                    text: "Huỷ",
                    type: "danger"
                },
                toolbar: "bottom",
                widget: "dxButton"
            }],
            width: 400
        }).dxPopup("instance");
    }

    private initTableTree(container): void {
        container = container.css("padding", "10px");
        //
        this.mapTableTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
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
                    this.tableColumnView = new TableColumnView(itemElement);
                }
            }],
            swipeEnabled: false
        }).dxMultiView("instance");
        this.tableViews.element().find(".dx-multiview-wrapper").css("border", "none");
        this.tableColumnView.addTableViews(this.tableViews);
    }

    public addMapView(mapViews: dxMultiView): void {
        this.mapViews = mapViews;
    }

    onInit(): void {

    }

    public reload(mapId: number): void {
        this.mapId = mapId;
        if (this.tableGrid) {
            this.tableGrid.getDataSource().reload();
        }
    }
}

export { MapTableView };
