import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";

import { IBaseComponent } from "../../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../../libs/core/helpers/utils";
import { RestData, RestError } from "../../../../../../../../libs/core/models/base-response.model";
import { OGTableModel } from "../../../../../../../../libs/core/models/table.model";
import { TableColumnService, TableService } from "../../../../../../../../libs/core/services/table.service";

class TableColumnView implements IBaseComponent {
    private container: JQuery<HTMLElement>;
    private grid: dxDataGrid;
    private onBack: () => void;
    private tableInfo?: OGTableModel;
    private tableStore: CustomStore;
    tableGroupBySchemaStore: CustomStore;
    constructor(container: JQuery<HTMLElement>, onBack?: () => void) {
        this.container = container;
        this.onBack = onBack;
        this.registerStore();
        this.onInit();
    }

    private initLayout(): void {
        this.grid = $("<div />").appendTo(this.container).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnChooser: {
                enabled: true,
                mode: "select",
            },
            columns: [{
                alignment: "center",
                allowSearch: false,
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.grid.pageIndex();
                    const pageSize = this.grid.pageSize();
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
                            }, {
                                text: "TsVector",
                                type: "tsvector"
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
            },
            {
                caption: "Bảng danh mục",
                dataField: "lookup_table_id",
                //     allowClearing: true,
                //     dataSource: {
                //         store: new CustomStore({
                //             byKey: async (key) => {
                //                 // return await TableService.get(key);
                //                 return null;
                //             },
                //             key: "id",
                //             load: (loadOptions) => {
                //                 const def = $.Deferred(), args = {};
                //                 if (loadOptions.sort) {
                //                     args["orderby"] = loadOptions.sort[0].selector;
                //                     if (loadOptions.sort[0].desc)
                //                         args["orderby"] += " desc";
                //                 }
                //                 args["skip"] = loadOptions.skip ? loadOptions.skip : 0;
                //                 args["take"] = loadOptions.take ? loadOptions.take : 9999;

                //                 TableService.list(args).then(result => {
                //                     if (result) {
                //                         const tableGroupBySchema = OGUtils.groupBy(result.data, (table: OGTableModel) => table ? table.table_schema : "Khác");
                //                         const dataSource = [];
                //                         Array.from(tableGroupBySchema).map((items) => {
                //                             items[1].sort(function (a, b) {
                //                                 if ((a.order - b.order) < 0) {
                //                                     return -1;
                //                                 } else if ((a.order - b.order) > 0) {
                //                                     return 1;
                //                                 } else {
                //                                     if (a.name_vn < b.name_vn) {
                //                                         return -1;
                //                                     } else if (a.name_vn > b.name_vn) {
                //                                         return 1;
                //                                     } else
                //                                         return 0;
                //                                 }
                //                             });
                //                             dataSource.push({
                //                                 items: items[1],
                //                                 key: items[0],
                //                             });
                //                         });
                //                         def.resolve(dataSource);
                //                     } else {
                //                         def.resolve([]);
                //                     }
                //                 });
                //                 return def.promise();
                //             }, 
                //         })
                //     },
                //     displayExpr: "name_vn",
                //     valueExpr: "id"
                // },
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
                dataType: "boolean",
                width: 80
            }, {
                caption: "Khóa chính?",
                dataField: "is_key",
                dataType: "boolean",
                width: 80
            }, {
                caption: "Trường hiển thị tên?",
                dataField: "is_label",
                dataType: "boolean",
                width: 80
            }, {
                caption: "Hiển thị?",
                dataField: "visible",
                dataType: "boolean",
                width: 80
            }, {
                caption: "Cho phép trống?",
                dataField: "is_nullable",
                dataType: "boolean",
                visible: false,
                width: 80
            }, {
                caption: "Cho phép tìm kiếm?",
                dataField: "is_searchable",
                visible: false,
                width: 80,
            }, {
                caption: "Bắt buộc nhập?",
                dataField: "require",
                visible: false,
                width: 80
            }, {
                caption: "Chỉ xem?",
                dataField: "readonly",
                visible: false,
                width: 80
            }, {
                caption: "Công thức",
                dataField: "formula",
                visible: false,
                width: 80
            }, {
                caption: "Tính tổng",
                dataField: "summary_total",
                dataType: "boolean",
                visible: false,
                width: 80,
            }, {
                caption: "Đếm SL",
                dataField: "summary_count",
                dataType: "boolean",
                visible: false,
                width: 80
            }, {
                caption: "Tính phần trăm",
                dataField: "summary_percent",
                dataType: "boolean",
                visible: false,
                width: 80
            }, {
                caption: "Đơn vị",
                dataField: "unit",
                width: 80
            }, {
                allowEditing: false,
                allowSearch: false,
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
                                        if (result && result.status === EnumStatus.OK) {
                                            options.component.getDataSource().reload();
                                        }
                                    });
                                }
                            },
                            widget: "dxButton"
                        }, {
                            options: {
                                icon: "icon icon-arrow-down",
                                onClick: () => {
                                    TableColumnService.moveDown(options.data).then(result => {
                                        if (result && result.status === EnumStatus.OK) {
                                            options.component.getDataSource().reload();
                                        }
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
                store: new CustomStore({
                    byKey: (key) => {
                        return TableColumnService.get(key);
                    },
                    insert: (values) => {
                        values.table_id = this.tableInfo.id;
                        if (!values.lookup_table_id) values.lookup_table_id = 0;
                        if (!values.data_in_radius_of_layer) values.data_in_radius_of_layer = 0;
                        return TableColumnService.insert(values);
                    },
                    key: "id",
                    load: () => {
                        const deferred = $.Deferred();
                        if (this.tableInfo && this.tableInfo.id) {
                            TableColumnService.list(this.tableInfo.id).then(result => {
                                if (result) {
                                    deferred.resolve(result);
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
                        return TableColumnService.delete({ id: key, table_id: this.tableInfo.id });
                    },
                    update: (key, values) => {
                        if (!values.lookup_table_id) values.lookup_table_id = 0;
                        if (!values.data_in_radius_of_layer) values.data_in_radius_of_layer = 0;
                        return TableColumnService.update(values);
                    }
                })
            },
            editing: {
                form: {
                    colCount: 3,
                    items: [{
                        dataField: "order",
                        editorType: "dxNumberBox",
                    }, {
                        dataField: "column_name",
                        editorOptions: {
                        },
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
                        validationRules: [{
                            message: "Vui lòng chọn kiểu dữ liệu",
                            type: "required",
                        }],
                    }, {
                        dataField: "character_max_length",
                        editorOptions: {
                            value: 255
                        },
                        editorType: "dxNumberBox"
                    }, {
                        dataField: "is_identity",
                    }, {
                        dataField: "is_key",
                    }, {
                        dataField: "lookup_table_id",
                        editorOptions: {
                            dataSource: {
                                store: this.tableGroupBySchemaStore
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
                            onContentReady: () => {
                                $(".dx-list-item-content").each(function () {
                                    const $ele = $(this);
                                    if (this.offsetWidth < this.scrollWidth) {
                                        $ele.attr("title", $ele.text());
                                    }
                                });
                            },
                            searchEnabled: true,
                            showClearButton: true,
                            valueExpr: "id",
                        },
                        editorType: "dxSelectBox"
                    }, {
                        dataField: "is_label"
                    }, {
                        dataField: "is_nullable",
                    }, {
                        dataField: "require",
                    }, {
                        dataField: "visible",
                    }, {
                        dataField: "readonly",
                    }, {
                        dataField: "summary_total",
                    }, {
                        dataField: "summary_count",
                    }, {
                        dataField: "summary_percent",
                    }, {
                        dataField: "formula"
                    }, {
                        dataField: "unit",
                    }],
                    labelLocation: "top"
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin trường",
                    width: 600
                },
                texts: {
                    cancelRowChanges: "Hủy",
                    saveRowChanges: "Lưu",
                },
                useIcons: false
            },
            errorRowEnabled: true,
            filterRow: {
                visible: true,
            },
            height: "100%",
            onEditorPreparing: (e) => {
                if ((e.dataField == "geometry" || e.dataField === "column_name") && e.parentType == "dataRow") {
                    e.editorOptions.disabled = !e.row.isNewRow;
                } else if (e.dataField === "lookup_table_id" || e.dataField === "data_in_radius_of_layer") {
                    e.editorOptions.grouped = true;
                }
            },
            onRowUpdating: function (options) {
                Object.assign(options.newData, Object.assign({}, options.oldData, options.newData));
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
                // mode: "virtual",
                showScrollbar: "always",
            },
            selection: {
                mode: "single",
                showCheckBoxesMode: "none"
            },
            showBorders: true,
            showRowLines: true,
            toolbar: {
                items: [{
                    location: "before",
                    options: {
                        hint: "Quay lại",
                        icon: "icon icon-arrow-left",
                        onClick: () => {
                            if (this.onBack) {
                                this.onBack.call(this);
                            }
                        },
                        type: "danger"
                    },
                    widget: "dxButton"
                }, {
                    location: "before",
                    template: (itemData, itemIndex, itemElement) => {
                        $(`<span class="table-name-label">Bảng: ${this.tableInfo?.name_vn}</span>`).appendTo(itemElement);
                    }
                }, {
                    location: "after",
                    options: {
                        onClick: async () => {
                            OGUtils.showLoading();
                            const response: RestData<boolean> | RestError = await TableColumnService.syncColumns(this.tableInfo?.id);
                            OGUtils.hideLoading();
                            OGUtils.alert("Đồng bộ thành công!").then(result => {
                                this.grid.getDataSource().reload();
                            });
                        },
                        text: "Đồng bộ trường thông tin",
                        type: "warning"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        onClick: () => {
                            this.grid.addRow();
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
                            this.grid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                }]
            },
            width: "100%",
        }).dxDataGrid("instance");
    }

    private registerStore(): void {
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
    }
    onInit(): void {
        this.initLayout();
    }

    public reload(tableInfo: OGTableModel): void {
        this.tableInfo = tableInfo;
        this.grid.getDataSource().reload();
        $(this.grid.element()).find(".table-name-label").html(`Bảng: ${this.tableInfo?.name_vn}`);
    }
}

export { TableColumnView };