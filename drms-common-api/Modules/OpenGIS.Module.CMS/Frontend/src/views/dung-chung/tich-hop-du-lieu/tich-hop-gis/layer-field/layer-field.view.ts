import axios from "axios";
import { Tab } from "bootstrap";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import dxMultiView from "devextreme/ui/multi_view";

import { IBaseComponent } from "../../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../../libs/core/helpers/utils";
import { OGLayerModel } from "../../../../../../../../libs/core/models/layer.model";
import { OGTableColumnModel, OGTableModel } from "../../../../../../../../libs/core/models/table.model";
import { LayerService } from "../../../../../../../../libs/core/services/layer.service";
import { TableColumnService, TableService } from "../../../../../../../../libs/core/services/table.service";


class LayerFieldView implements IBaseComponent {
    container: JQuery<HTMLElement>;
    layerFieldGrid: dxDataGrid;
    layerFieldStore: CustomStore<OGTableColumnModel, number>;
    layerViews: dxMultiView;
    oGLayer: OGLayerModel;
    tableColumnStore: CustomStore<OGTableColumnModel, number>;
    tableGroupBySchemaStore: CustomStore;
    tableStore: CustomStore;

    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.initLayout();
    }
    private initLayerField(container): void {
        this.layerFieldGrid = $("<div />").appendTo(container).dxDataGrid({
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
                    const pageIndex = this.layerFieldGrid.pageIndex();
                    const pageSize = this.layerFieldGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                width: 50,
            }, {
                alignment: "center",
                caption: "Thứ tự",
                dataField: "order",
                width: 70
            }, {
                caption: "Tên trường",
                dataField: "column_name"
            }, {
                caption: "Mô tả",
                dataField: "name_vn"
            }, {
                caption: "Kiểu dữ liệu",
                dataField: "data_type",
                lookup: {
                    dataSource: {
                        store: new ArrayStore({
                            data: [{
                                text: "Tự tăng",
                                type: "serial"
                            }, {
                                text: "Số nguyên nhỏ",
                                type: "smallint"
                            }, {
                                text: "Số nguyên",
                                type: "integer"
                            }, {
                                text: "Chuỗi ký tự",
                                type: "character varying"
                            }, {
                                text: "Văn bản",
                                type: "text"
                            }, {
                                text: "Ngày tháng",
                                type: "date"
                            }, {
                                text: "Ngày tháng kèm thời gian",
                                type: "timestamp without time zone"
                            }, {
                                text: "Số thập phân",
                                type: "double precision"
                            }, {
                                text: "Số thực",
                                type: "real"
                            }, {
                                text: "Boolean",
                                type: "boolean"
                            }, {
                                text: "Tự định nghĩa",
                                type: "USER-DEFINED"
                            }],
                            key: "type"
                        })
                    },
                    displayExpr: "text",
                    valueExpr: "type"
                },
                width: 100
            }, {
                caption: "Độ dài",
                dataField: "character_max_length",
                width: 80
            }, {
                caption: "Bảng danh mục",
                dataField: "lookup_table_id",
                lookup: {
                    dataSource: {
                        store: this.tableStore,
                    },
                    displayExpr: "name_vn",
                    valueExpr: "id",
                },
                width: 150
            }, {
                caption: "Bảng dữ liệu đối chiếu",
                dataField: "data_in_radius_of_layer",
                lookup: {
                    dataSource: {
                        store: this.tableStore,
                    },
                    displayExpr: "name_vn",
                    valueExpr: "id",
                },
                width: 150
            }, {
                caption: "Tự tăng?",
                dataField: "is_identity",
                width: 80,
            }, {
                caption: "Trường danh mục?",
                dataField: "has_domain",
                width: 80
            }, {
                caption: "Khóa chính?",
                dataField: "is_key",
                width: 80
            }, {
                caption: "Cho phép trống?",
                dataField: "is_nullable",
                visible: false,
                width: 80
            }, {
                caption: "Cho phép tìm kiếm?",
                dataField: "is_searchable",
                visible: false,
                width: 80
            }, {
                caption: "Trường hiển thị tên?",
                dataField: "is_label",
                width: 80
            }, {
                caption: "Bắt buộc nhập?",
                dataField: "require",
                visible: false,
                width: 80
            }, {
                caption: "Hiển thị?",
                dataField: "visible",
                width: 80
            }, {
                caption: "Chỉ xem?",
                dataField: "readonly",
                visible: false,
                width: 80
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
                                disabled: options.data.permanent,
                                icon: "icon icon-trash",
                                onClick: () => {
                                    if (options.data.permanent === false) {
                                        OGUtils.confirm("Xóa trường thông tin này?").then(value => {
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
                                icon: "icon icon-arrow-up-3",
                                onClick: () => {
                                    TableColumnService.moveUp(options.data).then(result => {
                                        options.component.getDataSource().reload();
                                    });
                                }
                            },
                            widget: "dxButton"
                        }, {
                            options: {
                                icon: "icon icon-arrow-down",
                                onClick: () => {
                                    TableColumnService.moveDown(options.data).then(result => {
                                        options.component.getDataSource().reload();
                                    });
                                }
                            },
                            widget: "dxButton"
                        }]
                    });
                },
                width: 200,
            }],
            dataSource: {
                store: this.tableColumnStore
            },
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        dataField: "order",
                        editorOptions: {},
                        editorType: "dxNumberBox"
                    }, {
                        dataField: "column_name",
                        validationRules: [{
                            message: "Vui lòng nhập tên cột",
                            type: "required",
                        }, {
                            message: "Tên cột không thế có kí tự đặc biệt",
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
                        dataField: "data_type",
                        editorOptions: {
                            onSelectionChanged: () => {

                            }
                        },
                        validationRules: [{
                            message: "Vui lòng chọn kiểu dữ liệu",
                            type: "required",
                        }]
                    }, {
                        dataField: "character_max_length",
                        editorOptions: {
                            value: 255
                        },
                        editorType: "dxNumberBox"
                    }, {
                        dataField: "lookup_table_id",
                        editorOptions: {
                            dataSource: {
                                store: this.tableGroupBySchemaStore
                            },
                            displayExpr: "name_vn",
                            searchEnabled: true,
                            showClearButton: true,
                            valueExpr: "id"
                        },
                        editorType: "dxSelectBox"
                    }, {
                        dataField: "data_in_radius_of_layer",
                        editorOptions: {
                            dataSource: {
                                store: this.tableGroupBySchemaStore
                            },
                            displayExpr: "name_vn",
                            searchEnabled: true,
                            showClearButton: true,
                            valueExpr: "id"
                        },
                        editorType: "dxSelectBox"
                    }, {
                        dataField: "is_identity",
                    }, {
                        dataField: "is_label"
                    }, {
                        dataField: "is_nullable",
                    }, {
                        dataField: "is_searchable",
                    }, {
                        dataField: "require",
                    }, {
                        dataField: "visible",
                    }, {
                        dataField: "readonly",
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    maxHeight: "90vh",
                    showTitle: true,
                    title: "Thông tin trường",
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
                if ((e.dataField == "geometry" || e.dataField === "column_name") && e.parentType == "dataRow") {
                    e.editorOptions.disabled = !e.row.isNewRow;
                } else if (e.dataField === "lookup_table_id" || e.dataField === "data_in_radius_of_layer") {
                    e.editorOptions.grouped = true;
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
                    location: "before",
                    template: "<span class=\"layer_name\"></span>"
                }, {
                    location: "after",
                    options: {
                        onClick: () => {
                            dataGrid.addRow();
                        },
                        text: "Tạo trường thông tin",
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

    private initLayout(): void {
        this.tableStore = new CustomStore({
            byKey: (key) => {
                return TableService.get(key);
            },
            key: "id",
            load: () => {
                const def = $.Deferred();
                TableService.list({}).then(result => {
                    if (result) {
                        def.resolve(result.data);
                    } else {
                        def.resolve([]);
                    }
                });
                return def.promise();
            },
            loadMode: "raw"
        });
        this.tableColumnStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                if (key) {
                    axios.get("/api/table/column/" + key.toString()).then(xhr => {
                        if (xhr.data && xhr.data.status === EnumStatus.OK) {
                            deferred.resolve(xhr.data.data);
                        }
                        deferred.resolve({});
                    });
                } else {
                    deferred.resolve({});
                }
                return deferred;
            },
            insert: (values) => {
                values.table_id = this.oGLayer.table_info_id;
                if (!values.lookup_table_id) values.lookup_table_id = 0;
                if (!values.data_in_radius_of_layer) values.data_in_radius_of_layer = 0;
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
                args.take = loadOptions.take ? loadOptions.take : 99999;

                if (this.oGLayer && this.oGLayer.id) {
                    const keyword = loadOptions.searchValue ? loadOptions.searchValue : "";
                    LayerService.getFields(this.oGLayer.id, keyword).then(result => {
                        if (result) {
                            deferred.resolve({
                                data: result,
                                totalCount: result.length
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
                return TableColumnService.delete({ id: key, table_id: this.oGLayer.table_info_id });
            },
            update: (key, values) => {
                if (!values.lookup_table_id) values.lookup_table_id = 0;
                if (!values.data_in_radius_of_layer) values.data_in_radius_of_layer = 0;
                return TableColumnService.update(values);
            },
        });
        this.tableGroupBySchemaStore = new CustomStore({
            byKey: async (key) => {
                return await TableService.get(key);
            },
            key: "id",
            load: (loadOptions) => {
                const def = $.Deferred(), args = {};
                if (loadOptions.sort) {
                    args["orderby"] = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        args["orderby"] += " desc";
                }
                args["skip"] = loadOptions.skip ? loadOptions.skip : 0;
                args["take"] = loadOptions.take ? loadOptions.take : 9999;
                args["searchValue"] = loadOptions.searchValue ? loadOptions.searchValue : "";
                TableService.list(args).then(result => {
                    if (result) {
                        const tableGroupBySchema = OGUtils.groupBy(result.data, (table: OGTableModel) => (table && table.table_schema_info) ? table.table_schema_info.description : "Khác");
                        const dataSource = [];
                        Array.from(tableGroupBySchema).map((items) => {
                            items[1].sort(function (a, b) {
                                if ((a.order - b.order) < 0) {
                                    return -1;
                                } else if ((a.order - b.order) > 0) {
                                    return 1;
                                } else {
                                    if (a.name_vn < b.name_vn) {
                                        return -1;
                                    } else if (a.name_vn > b.name_vn) {
                                        return 1;
                                    } else
                                        return 0;
                                }
                            });
                            dataSource.push({
                                items: items[1],
                                key: items[0],
                            });
                        });
                        def.resolve(dataSource);
                    } else {
                        def.resolve([]);
                    }
                });
                return def.promise();
            },
        });
        this.initLayerField(this.container);
    }

    public addLayerView(layerViews: dxMultiView): void {
        this.layerViews = layerViews;
    }

    onInit(): void {

    }

    public reload(layerInfo: OGLayerModel): void {
        this.oGLayer = layerInfo;
        if (this.layerFieldGrid) {
            this.layerFieldGrid.getDataSource().reload();
        }

        $(".layer_name").html("Lớp dữ liệu: " + this.oGLayer.name_vn);
    }
}

export { LayerFieldView };
