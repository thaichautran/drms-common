import { OGMapUtils } from "@opengis/map";
import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/select_box";
import dxSelectBox from "devextreme/ui/select_box";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";


class LayerGroupView implements IBaseComponent {
    container: JQuery<HTMLElement>;
    layerGroupGrid: dxDataGrid;
    layerGroupStore: CustomStore;
    tableSchema: string;
    tableSchemaStore: CustomStore;

    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.initLayout();
    }

    private initLayerGroupGrid(container): void {
        this.layerGroupGrid = $("<div />").appendTo(container).dxDataGrid({
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
                    const pageIndex = this.layerGroupGrid.pageIndex();
                    const pageSize = this.layerGroupGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                visible: true,
                width: 50,
            }, {
                caption: "Tên nhóm",
                dataField: "name_vn"
            }, {
                caption: "Tên nhóm (Tiếng Anh)",
                dataField: "name_en"
            }, {
                alignment: "center",
                caption: "Thứ tự",
                dataField: "order",
                dataType: "number",
                width: 80,
            }, {
                caption: "Schema",
                dataField: "table_schema",
                groupIndex: 0,
                lookup: {
                    dataSource: {
                        store: this.tableSchemaStore,
                    },
                    displayExpr: "description",
                    valueExpr: "schema_name"
                }
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            options: {
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    options.component.editRow(options.rowIndex);
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {
                            options: {
                                icon: "icon icon-trash",
                                onClick: () => {
                                    OGUtils.confirm("Xóa nhóm lớp dữ liệu này? Tất cả các lớp dữ liệu thuộc nhóm cũng bị xóa theo!").then(value => {
                                        if (value) {
                                            options.component.getDataSource().store().remove(options.value).then(() => {
                                                options.component.getDataSource().reload();
                                            });
                                        }
                                    });
                                },
                                type: "danger"
                            },
                            widget: "dxButton"
                        }]
                    });
                },
                dataField: "id",
                width: 150,
            }],
            dataSource: new DataSource({
                store: this.layerGroupStore
            }),
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        dataField: "order"
                    },{
                        dataField: "name_vn"
                    }, {
                        dataField: "name_en"
                    }, {
                        dataField: "table_schema"
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin nhóm lớp dữ liệu",
                    width: 500,
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
            onContentReady: () => {
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
                            this.tableSchema = e.selectedItem ? e.selectedItem.schema_name : "";
                            this.layerGroupGrid.getDataSource().reload();
                        },
                        placeholder: "Chọn Schema",
                        searchEnabled: true,
                        searchExpr: ["schema_name", "description"],
                        searchMode: "contains",
                        showClearButton: true,
                        valueExpr: "schema_name",
                        width: 200,
                    },
                    widget: "dxSelectBox"
                });
                e.toolbarOptions.items.unshift({
                    location: "after",
                    options: {
                        onClick: () => {
                            this.layerGroupGrid.addRow();
                        },
                        text: "Thêm nhóm mới",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới bảng",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            this.layerGroupGrid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                });
            },
            pager: {
                allowedPageSizes: [50, 100, 200],
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
    private initLayout() : void {
        this.layerGroupStore = new CustomStore({
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
            insert: (values) => {
                values.name_en = values.name_vn;

                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            OGUtils.alert("Lưu nhóm dữ liệu thành công");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
                        }
                    },
                    type: "POST",
                    url: "/api/layer/group/save",
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
                    url: this.tableSchema ? "/api/layer/groups?table_schema=" + this.tableSchema : "/api/layer/groups",
                });

                return deferred.promise();
            },
            remove: (key) => {
                return $.ajax({
                    data: { id: key },
                    type: "POST",
                    url: "/api/layer/group/delete",
                });
            },
            update: (key, values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            OGUtils.alert("Lưu nhóm dữ liệu thành công");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
                        }
                    },
                    type: "POST",
                    url: "/api/layer/group/save",
                });
            },
        });
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
                            OGUtils.alert("Thêm schema liệu thành công");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
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
        this.initLayerGroupGrid(this.container);
    }

    onInit(): void {
        
    }
}

export { LayerGroupView };
