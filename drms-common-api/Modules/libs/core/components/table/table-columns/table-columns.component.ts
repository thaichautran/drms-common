import { OGMap } from "@opengis/map";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import dxMultiView from "devextreme/ui/multi_view";

import { EnumStatus } from "../../../enums/enums";
import { OGUtils } from "../../../helpers/utils";
import { OGTableModel } from "../../../models/table.model";
import { TableColumnService, TableService } from "../../../services/table.service";
import { IMapComponent } from "../../base-component.abstract";

class TableColumnComponent implements IMapComponent {
    container: HTMLElement;
    oGMap: OGMap;
    tableColumnGrid: dxDataGrid;
    tableInfo: OGTableModel;
    tableViews: dxMultiView;
    constructor(container: HTMLElement) {
        this.container = container;
    }

    private initTableColumnGrid(): void {
        this.tableColumnGrid = $("<div />").appendTo(this.container).dxDataGrid({
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
                    const pageIndex = this.tableColumnGrid.pageIndex();
                    const pageSize = this.tableColumnGrid.pageSize();
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
                                    $.ajax({
                                        contentType: "application/json",
                                        data: JSON.stringify(options.value),
                                        type: "post",
                                        url: "/api/table/" + options.data.table_id + "/columns/moveUp"
                                    }).then(() => {
                                        options.component.getDataSource().reload();
                                    });
                                }
                            },
                            widget: "dxButton"
                        }, {
                            options: {
                                icon: "icon icon-arrow-down",
                                onClick: () => {
                                    $.ajax({
                                        contentType: "application/json",
                                        data: JSON.stringify(options.value),
                                        type: "post",
                                        url: "/api/table/" + options.data.table_id + "/columns/moveDown"
                                    }).then(() => {
                                        options.component.getDataSource().reload();
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
                mode: "virtual",
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
                        onClick: async () => {
                            await TableColumnService.syncColumns(this.tableInfo?.id);
                            OGUtils.alert("Đồng bộ thành công!");
                        },
                        text: "Đồng bộ trường thông tin",
                        type: "warning"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        onClick: () => {
                            this.tableColumnGrid.addRow();
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
                            this.tableColumnGrid.getDataSource().reload();
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
        this.initTableColumnGrid();
    }
    public reload(tableInfo: OGTableModel): void {
        this.tableInfo = tableInfo;
        this.tableColumnGrid.getDataSource().reload();
        $(this.tableColumnGrid.element()).find(".table-name-label").html(`Bảng: ${this.tableInfo?.name_vn}`);
    }
}

export { TableColumnComponent };