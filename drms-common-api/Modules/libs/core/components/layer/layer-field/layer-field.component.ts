import { OGMap } from "@opengis/map";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import dxMultiView from "devextreme/ui/multi_view";

import { OGUtils } from "../../../helpers/utils";
import { OGLayerModel } from "../../../models/layer.model";
import { OGTableColumnModel } from "../../../models/table.model";
import { LayerService } from "../../../services/layer.service";
import { TableColumnService } from "../../../services/table.service";
import { IMapComponent } from "../../base-component.abstract";

class LayerFieldComponent implements IMapComponent {
    private layerFieldGrid: dxDataGrid;
    private selectedLayerInfo: OGLayerModel;
    private tableColumnStore: CustomStore<OGTableColumnModel, number>;
    container: HTMLElement;
    layerViews: dxMultiView;
    oGMap: OGMap;
    constructor(container: HTMLElement) {
        this.container = container;
        this.onInit();
    }

    private initLayout(container): void {
        this.tableColumnStore = new CustomStore({
            byKey: (key) => {
                return TableColumnService.get(key);
            },
            insert: (values) => {
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
                
                if (this.selectedLayerInfo && this.selectedLayerInfo.id) {
                    const keyword = loadOptions.searchValue ? loadOptions.searchValue : "";
                    LayerService.getFields(this.selectedLayerInfo.id, keyword).then(result => {
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
                return TableColumnService.delete({ id: key, table_id: this.selectedLayerInfo.table_info_id });
            },
            update: (key, values) => {
                return TableColumnService.update(values);
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

    public addLayerView(layerViews: dxMultiView): void {
        this.layerViews = layerViews;
    }

    public for(layer: OGLayerModel): LayerFieldComponent {
        this.selectedLayerInfo = layer;
        $(".layer_name").html("Lớp dữ liệu: " + this.selectedLayerInfo.name_vn);
        return this;
    }

    onInit (): void {
        this.initLayout(this.container);
    }
    
    public refresh(): void {
        this.layerFieldGrid.getDataSource().reload();
    }
}

export { LayerFieldComponent };