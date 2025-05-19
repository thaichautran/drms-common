import { OGMap } from "@opengis/map";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import dxMultiView from "devextreme/ui/multi_view";

import { EnumStatus } from "../../../enums/enums";
import { OGUtils } from "../../../helpers/utils";
import { OGLayerModel } from "../../../models/layer.model";
import { OGTableColumnModel } from "../../../models/table.model";
import { IMapComponent } from "../../base-component.abstract";

class LayerIndexComponent implements IMapComponent {
    private layerFieldGrid: dxDataGrid;
    private selectedLayerInfo: OGLayerModel;
    container: HTMLElement;
    layerFieldStore: CustomStore<OGTableColumnModel, number>;
    layerIndexesGrid: dxDataGrid;
    layerIndexesStore: CustomStore;
    layerViews: dxMultiView;
    oGMap: OGMap;
    constructor(container: HTMLElement) {
        this.container = container;
        this.onInit();
    }

    private initLayout(container): void {

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
            insert: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            // this.layerFieldGrid.getDataSource().reload();
                        }
                        else {
                            if (xhr.errors && xhr.errors.length > 0) {
                                OGUtils.alert(xhr.errors[0].message || "Cập nhật trường dữ liệu thất bại!");
                            } else {
                                OGUtils.alert("Cập nhật trường dữ liệu thất bại!");
                            }
                        }
                    },
                    type: "POST",
                    url: "/api/table/" + this.selectedLayerInfo.table_info_id + "/columns/add",
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
            remove: (key) => {
                return $.ajax({
                    data: { id: key },
                    type: "POST",
                    url: "/api/table/" + this.selectedLayerInfo.table_info_id + "/columns/delete",
                });
            },
            update: (key, values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            // this.layerFieldGrid.getDataSource().reload();
                        }
                        else {
                            if (xhr.errors && xhr.errors.length > 0) {
                                OGUtils.alert(xhr.errors[0].message || "Cập nhật trường dữ liệu thất bại!");
                            } else {
                                OGUtils.alert("Cập nhật trường dữ liệu thất bại!");
                            }
                        }
                    },
                    type: "post",
                    url: "/api/table/" + values.table_id + "/columns/update",
                });
            },
        });
        this.layerIndexesStore = new CustomStore({
            insert: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status === EnumStatus.OK) {
                            this.layerIndexesGrid.getDataSource().reload();
                        }
                        else {
                            if (xhr.errors && xhr.errors.length > 0) {
                                OGUtils.alert(xhr.errors[0].message || "Thêm chỉ mục thất bại!");
                            } else {
                                OGUtils.alert("Thêm chỉ mục thất bại!");
                            }
                        }
                    },
                    type: "post",
                    url: "/api/layer/" + this.selectedLayerInfo.id + "/createIndex",
                });
            },
            load: (loadOptions) => {
                const deferred = $.Deferred(),
                    args: { [key: string]: number | string } = {};

                if (loadOptions.sort) {
                    args.orderby = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        args.orderby += " desc";
                }

                args.skip = loadOptions.skip ? loadOptions.skip : 0;
                args.take = loadOptions.take ? loadOptions.take : 15;
                
                if (this.selectedLayerInfo && this.selectedLayerInfo.id) {
                    $.get("/api/layer/" + this.selectedLayerInfo.id + "/listIndexes", {

                    }).done(xhr => {
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
                    contentType: "application/json",
                    data: JSON.stringify(key),
                    success: (xhr) => {
                        if (xhr.status === EnumStatus.OK) {
                            this.layerIndexesGrid.getDataSource().reload();
                        }
                        else {
                            if (xhr.errors && xhr.errors.length > 0) {
                                OGUtils.alert(xhr.errors[0].message || "Cập nhật chỉ mục thất bại!");
                            } else {
                                OGUtils.alert("Cập nhật chỉ mục thất bại!");
                            }
                        }
                    },
                    type: "post",
                    url: "/api/layer/" + this.selectedLayerInfo.id + "/dropIndex",
                });
            },
        });
        this.layerIndexesGrid = $("<div />").appendTo(container).dxDataGrid({
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
                    const pageIndex = this.layerIndexesGrid.pageIndex();
                    const pageSize = this.layerIndexesGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                width: 50,
            }, {
                caption: "Tên chỉ mục",
                dataField: "index_name"
            }, {
                caption: "Trường chỉ mục",
                dataField: "column_name",
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                disabled: options.data.deletable === false,
                                icon: "icon icon-trash",
                                onClick: () => {
                                    if (options.data.deletable) {
                                        OGUtils.confirm("Xóa chỉ mục này?").then(value => {
                                            if (value) {
                                                options.component.getDataSource().store().remove(options.value).then(() => {
                                                    options.component.getDataSource().reload();
                                                });
                                            }
                                        });
                                    }
                                },
                                type: "danger"
                            },
                            widget: "dxButton"
                        }]
                    });
                },
                width: 80,
            }],
            dataSource: {
                store: this.layerIndexesStore
            },
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        dataField: "index_type",
                        editorOptions: {
                            dataSource: {
                                store: new ArrayStore({
                                    data: [{
                                        text: "BTree",
                                        type: "btree"
                                    }, {
                                        text: "Gin",
                                        type: "gin"
                                    }, {
                                        text: "Gist",
                                        type: "gist"
                                    }, {
                                        text: "Hash",
                                        type: "hash"
                                    }, {
                                        text: "SPGist",
                                        type: "spgist"
                                    }],
                                    key: "type"
                                })
                            },
                            displayExpr: "text",
                            placeholder: "[Chọn ...]",
                            valueExpr: "type",
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Kiểu chỉ mục"
                        }
                    }, {
                        dataField: "column_id",
                        editorOptions: {
                            dataSource: {
                                store: this.layerFieldStore,
                            },
                            displayExpr: "name_vn",
                            onContentReady: () => {
                                $(".dx-list-item-content").each(function () {
                                    const $ele = $(this);
                                    if (this.offsetWidth < this.scrollWidth) {
                                        $ele.attr("title", $ele.text());
                                    }
                                });
                            },
                            placeholder: "[Chọn ...]",
                            searchEnabled: true,
                            searchExpr: ["name_vn", "name_en"],
                            searchMode: "contains",
                            valueExpr: "id",
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Trường chỉ mục"
                        }
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin chỉ mục",
                    width: 400
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
            onEditorPreparing: (e) => {
                if (e.dataField == "geometry" && e.parentType == "dataRow") {
                    // e.editorOptions.disabled = !e.row.inserted;
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
                            this.layerViews.option("selectedIndex", 0);
                        },
                        type: "danger"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        onClick: () => {
                            dataGrid.addRow();
                        },
                        text: "Tạo chỉ mục",
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
                mode: "single"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",
        }).dxDataGrid("instance");
    }

    public addLayerView(layerViews: dxMultiView): void {
        this.layerViews = layerViews;
    }

    public for(layer: OGLayerModel): LayerIndexComponent {
        this.selectedLayerInfo = layer;
        return this;
    }

    onInit (): void {
        this.initLayout(this.container);
    }
    
    public refresh(): void {
        this.layerIndexesGrid.getDataSource().reload();
    }
}

export { LayerIndexComponent };