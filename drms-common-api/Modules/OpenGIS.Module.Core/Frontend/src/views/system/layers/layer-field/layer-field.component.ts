import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { OGLayerModel } from "../../../../../../../libs/core/models/layer.model";
import { OGTableColumnModel } from "../../../../../../../libs/core/models/table.model";
import { TableColumnService } from "../../../../../../../libs/core/services/table.service";

class LayerFieldComponent implements IBaseComponent {
    private layerFieldGrid: dxDataGrid;
    private oGLayer: OGLayerModel;
    private tableColumnStore: CustomStore<OGTableColumnModel, number>;

    constructor(container: HTMLElement) {
        this.initLayout(container);
    }

    private initLayout(container): void {
        this.tableColumnStore = new CustomStore({
            byKey: (key) => {
                return TableColumnService.get(key);
            },
            insert: (values) => {
                values.table_id = this.oGLayer.table_info_id;
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
                //
                if (this.oGLayer && this.oGLayer.id) {
                    $.ajax({
                        data: {
                            id: this.oGLayer.id,
                            keyword: loadOptions.searchValue ? loadOptions.searchValue : ""
                        },
                        error: () => {
                            deferred.reject("Data Loading Error");
                        },
                        success: (xhr) => {
                            if (xhr && xhr.status === EnumStatus.OK) {
                                deferred.resolve(xhr.data, {
                                    totalCount: xhr.data.length
                                });
                            } else {
                                deferred.resolve([], {
                                    totalCount: 0
                                });
                            }
                        },
                        type: "get",
                        url: "/api/layer/get-fields",
                        // timeout: 5000
                    });
                } else {
                    deferred.resolve([], {
                        totalCount: 0
                    });
                }

                return deferred.promise();
            },
            remove: (key) => {
                return $.ajax({
                    data: { id: key },
                    type: "POST",
                    url: "/api/table/" + this.oGLayer.table_info_id + "/columns/delete",
                });
            },
            update: (key, values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            this.layerFieldGrid.getDataSource().reload();
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
                caption: "Khóa chính?",
                dataField: "is_identity",
                width: 80,
            }, {
                caption: "Cho phép trống?",
                dataField: "is_nullable",
                width: 80
            }, {
                caption: "Cho phép tìm kiếm?",
                dataField: "is_searchable",
                width: 80
            }, {
                caption: "Trường hiển thị tên?",
                dataField: "is_label",
                width: 80
            }, {
                caption: "Bắt buộc nhập?",
                dataField: "require",
                width: 80
            }, {
                caption: "Hiển thị?",
                dataField: "visible",
                width: 80
            }, {
                caption: "Chỉ xem?",
                dataField: "readonly",
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
                    showTitle: true,
                    title: "Thông tin trường",
                    width: 400,
                },
                // allowUpdating: true,
                // allowDeleting: function (e) {
                //     return !isChief(e.row.data.Position);
                texts: {
                    cancelRowChanges: "Hủy",
                    saveRowChanges: "Lưu",
                },
                // },
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
                    options: {
                        hint: "Quay lại",
                        icon: "icon icon-arrow-left",
                        onClick: () => {
                            // this.layerViews.option("selectedIndex", 0);
                        },
                        type: "danger"
                    },
                    widget: "dxButton"
                }, {
                    template: "<span class=\"layer_name\"></span>"
                }, {
                    options: {
                        onClick: () => {
                            dataGrid.addRow();
                        },
                        text: "Tạo trường thông tin",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
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

    onInit (): void {

    }
    
    public refresh(): void {
        
    }
}

export { LayerFieldComponent };