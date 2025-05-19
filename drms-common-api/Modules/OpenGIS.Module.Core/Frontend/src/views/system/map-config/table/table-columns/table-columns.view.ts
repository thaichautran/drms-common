import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import dxMultiView from "devextreme/ui/multi_view";

import { IBaseComponent } from "../../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../../libs/core/helpers/utils";
import { OGTableColumnModel, OGTableModel } from "../../../../../../../../libs/core/models/table.model";
import { TableColumnService, TableService } from "../../../../../../../../libs/core/services/table.service";


class TableColumnView implements IBaseComponent {
    container: JQuery<HTMLElement>;
    grid: dxDataGrid;
    tableInfo?: OGTableModel;
    tableViews: dxMultiView;
    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.initLayout();
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
                lookup: {
                    dataSource: {
                        store: new CustomStore({
                            byKey: async (key) => {
                                return await TableService.get(key);
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
                                    },
                                    error: () => {
                                        deferred.reject("Data Loading Error");
                                    },
                                    success: (result) => {
                                        if (result.status === EnumStatus.OK) {
                                            deferred.resolve(result.data);
                                        }
                                        deferred.resolve({});
                                    },
                                    type: "get",
                                    url: "/api/table/list",
                                });

                                return deferred.promise();
                            },
                            loadMode: "raw"
                        }),
                    },
                    displayExpr: "name_vn",
                    valueExpr: "id"
                },
                width: 80
            }, {
                caption: "Khóa chính?",
                dataField: "is_identity",
                dataType: "boolean",
                width: 80
            }, {
                caption: "Có danh mục?",
                dataField: "has_category",
                dataType: "boolean",
                width: 80
            }, {
                caption: "Cho phép trống?",
                dataField: "is_nullable",
                dataType: "boolean",
                width: 80
            }, {
                caption: "Trường hiển thị tên?",
                dataField: "is_label",
                dataType: "boolean",
                width: 80
            }, {
                caption: "Bắt buộc nhập?",
                dataField: "require",
                dataType: "boolean",
                width: 80
            }, {
                caption: "Hiển thị?",
                dataField: "visible",
                dataType: "boolean",
                width: 80
            }, {
                caption: "Chỉ xem?",
                dataField: "readonly",
                dataType: "boolean",
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
                dataField: "id",
                width: 200,
            }],
            dataSource: {
                store: new CustomStore({
                    byKey: (key) => {
                        return TableColumnService.get(key);
                    },
                    insert: (values) => {
                        values.table_id = this.tableInfo.id;
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
                    update: (key: number, values: OGTableColumnModel) => {
                        return TableColumnService.update(values);
                    }
                })
            },
            editing: {
                form: {
                    colCount: 1,
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
                        dataField: "has_category",
                    }, {
                        dataField: "lookup_table_id",
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
                        dataField: "unit",
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
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
            onEditorPreparing: (e) => {
                if ((e.dataField == "geometry" || e.dataField === "column_name") && e.parentType == "dataRow") {
                    e.editorOptions.disabled = !e.row.isNewRow;
                }
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
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
                            this.tableViews.option("selectedIndex", 0);
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

    public addTableViews(tableViews: dxMultiView): void {
        this.tableViews = tableViews;
    }

    onInit(): void {

    }

    public reload(tableInfo: OGTableModel): void {
        this.tableInfo = tableInfo;
        this.grid.getDataSource().reload();
        $(this.grid.element()).find(".table-name-label").html(`Bảng: ${this.tableInfo?.name_vn}`);
    }
}

export { TableColumnView };