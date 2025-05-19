import axios from "axios";
import { LoadResultObject } from "devextreme/common/data/custom-store";
import CustomStore, { ResolvedData } from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxButton from "devextreme/ui/button";
import "devextreme/ui/data_grid";
import dxDataGrid, { Column } from "devextreme/ui/data_grid";
import "devextreme/ui/form";
import dxForm, { SimpleItem } from "devextreme/ui/form";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import "devextreme/ui/number_box";
import "devextreme/ui/date_box";
import "devextreme/ui/tree_view";
import dxTreeView from "devextreme/ui/tree_view";
import moment from "moment";
import { disable } from "ol/rotationconstraint";

import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumDataType, EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { RestError } from "../../../../../../libs/core/models/base-response.model";
import { OGTableColumnModel, OGTableModel } from "../../../../../../libs/core/models/table.model";
import { AreaService } from "../../../../../../libs/core/services/area.service";
import { CategoryService } from "../../../../../../libs/core/services/category.service";
import { TableService } from "../../../../../../libs/core/services/table.service";
import "./category.view.scss";

@RazorView()
class CategoryView extends Layout {
    arguments: { [key: string]: number | object | string; };
    categoryForm: dxForm;
    categoryPopup: dxPopup;
    categoryStore: CustomStore;
    categoryTypeID: number;
    createButton: dxButton;
    grid: dxDataGrid;
    gridContainer: JQuery<HTMLElement>;
    keyColumn: OGTableColumnModel;
    tree: dxTreeView;
    treeContainer: JQuery<HTMLElement>;
    constructor() {
        super("child");
    }

    private buildGridColumns(tableColumns: OGTableColumnModel[]): Column[] {
        const self = this;
        const columnIndex: Column[] = [
            {
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.grid.pageIndex();
                    const pageSize = this.grid.pageSize();
                    container.append(((pageSize * pageIndex) + options.rowIndex + 1).toString());
                },
                dataField: null,
                width: 100,
            }
        ];

        const columnsGrid: Column[] = tableColumns.map(col => {
            if (col.is_identity) {
                return;
            }
            if (col.visible && col.column_name.includes("geom") === false) {
                if (col.lookup_table_id) {
                    return {
                        alignment: "left",
                        allowResizing: true,
                        allowSorting: true,
                        caption: col.name_vn,
                        dataField: col.column_name,
                        filterOperations: ["contains"],
                        groupCellTemplate: (container, options) => {
                            container.append((options.displayValue || options.value) + " (Khối lượng: " + options.data["count"] + ")");
                        },
                        lookup: {
                            dataSource: {
                                key: "id",
                                pageSize: 25,
                                paginate: true,
                                store: new CustomStore({
                                    byKey: (key) => {
                                        return new Promise<ResolvedData>((resolve) => {
                                            $.get(`/api/table/short-data/${col.lookup_table_id}/${key}`).done(xhr => {
                                                if (xhr.status === EnumStatus.OK) {
                                                    resolve(xhr.data);
                                                }
                                                else {
                                                    resolve({});
                                                }
                                            });
                                        });
                                    },
                                    load: (options) => {
                                        return new Promise((resolve) => {
                                            TableService.shortDataPaged({ q: options.searchValue, skip: options.skip, table_id: col.lookup_table_id, take: options.take }).then(data => {
                                                resolve({
                                                    data: data.data,
                                                    totalCount: data.recordsTotal
                                                });
                                            });
                                        });
                                    }
                                })
                            },
                            displayExpr: "mo_ta",
                            searchEnabled: true,
                            valueExpr: "id",
                        },
                        //width: 200,
                    };
                } else {
                    if (col.column_name.includes("toado")) {
                        return {
                            alignment: "right",
                            allowResizing: true,
                            allowSorting: true,
                            calculateCellValue: (data) => {
                                if (data[col.column_name]) {
                                    return OGUtils.formatNumber(data[col.column_name], 0, 4);
                                } else {
                                    return "";
                                }
                            },
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["="],
                            //width: 200
                        };
                    } else if (col.data_type === EnumDataType.date || col.data_type === EnumDataType.dateTime || col.data_type === EnumDataType.dateTimeTZ) {
                        return {
                            alignment: "center",
                            allowResizing: true,
                            allowSorting: true,
                            calculateCellValue: (data) => {
                                if (data[col.column_name]) {
                                    return (col.data_type === EnumDataType.date) ? moment(data[col.column_name]).format("DD/MM/YYYY") : moment(data[col.column_name]).format("DD/MM/YYYY HH:mm");
                                } else {
                                    return "";
                                }
                            },
                            caption: col.name_vn,
                            dataField: col.column_name,
                            dataType: (col.data_type === EnumDataType.date) ? "date" : "datetime",
                            filterOperations: ["="],
                            // format: (col.data_type === EnumDataType.date) ? "dd/MM/yyyy" : "dd/MM/yyyy HH:mm:ss",
                            //width: 200
                        } as Column;
                    } else if (col.column_name === "commune_code") {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["contains"],
                            lookup: {
                                dataSource: {
                                    key: "area_id",
                                    store: new CustomStore({
                                        load: () => {
                                            return new Promise((resolve) => {
                                                let district_code = "-1";
                                                if (self.arguments && self.arguments["district_code"]) {
                                                    district_code = self.arguments["district_code"].toString();
                                                }
                                                AreaService.communes(district_code).then(result => {
                                                    if (result) {
                                                        resolve(result);
                                                    } else {
                                                        resolve([]);
                                                    }
                                                });
                                            });
                                        },
                                    })
                                },
                                displayExpr: "name_vn",
                                valueExpr: "area_id",
                            },
                            //width: 200
                        };
                    } else if (col.column_name === "district_code") {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["contains"],
                            groupCellTemplate: (container, options) => {
                                container.append((options.displayValue || options.value) + " (Khối lượng: " + options.data["count"] + ")");
                            },
                            groupIndex: 0,
                            lookup: {
                                dataSource: {
                                    key: "area_id",
                                    store: new CustomStore({
                                        load: async () => {
                                            return await AreaService.districts();
                                        }
                                    })
                                },
                                displayExpr: "name_vn",
                                valueExpr: "area_id",
                            },
                            //width: 200,
                        };
                    } else if (col.column_name === "province_code") {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["contains"],
                            lookup: {
                                dataSource: {
                                    key: "area_id",
                                    store: new CustomStore({
                                        load: async () => {
                                            return await AreaService.provinces();
                                        }
                                    })
                                },
                                displayExpr: "name_vn",
                                valueExpr: "area_id",
                            },
                            //width: 200,
                        };
                    } else if (col.data_type === EnumDataType.smallint || col.data_type === EnumDataType.integer || col.data_type === EnumDataType.double) {
                        return {
                            alignment: "right",
                            allowResizing: true,
                            allowSorting: true,
                            // calculateCellValue: (data) => {
                            //     if (data[col.column_name]) {
                            //         return OGUtils.formatNumber(data[col.column_name], 0, 3);
                            //     } else {
                            //         if (col.column_name.includes("ma") || OGUtils.toLowerCaseNonAccentVietnamese(col.name_vn).includes("ma")) {
                            //             return "";
                            //         } else {
                            //             return "";
                            //         }
                            //     }
                            // },
                            caption: col.name_vn,
                            dataField: col.column_name,
                            dataType: "number",
                            filterOperations: ["="],
                            //width: 200
                        };
                    } else if (col.data_type === EnumDataType.bool) {
                        return {
                            alignment: "right",
                            allowResizing: true,
                            allowSorting: true,
                            calculateCellValue: (data) => {
                                if (data[col.column_name] !== null) {
                                    return data[col.column_name] ? "Có" : "Không";
                                } else {
                                    return "";
                                }
                            },
                            caption: col.name_vn,
                            dataField: col.column_name,
                            dataType: "boolean",
                            filterOperations: ["="],
                            //width: 200
                        };
                    } else {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            cellTemplate: (container, options) => {
                                const data = options.data;
                                if (data[col.column_name]) {
                                    if (data[col.column_name].includes("http://") || data[col.column_name].includes("https://")) {
                                        container.append("<a href= \"" + data[col.column_name] + "\" target=\"_blank\">Xem thông tin</a>");
                                    } else {
                                        container.append(data[col.column_name]);
                                    }
                                } else {
                                    if (col.column_name.includes("ma") || OGUtils.toLowerCaseNonAccentVietnamese(col.name_vn).includes("ma")) {
                                        container.append("");
                                    } else {
                                        container.append("");
                                    }
                                }
                            },
                            dataField: col.column_name,
                            //width: 200
                        };
                    }
                }
            }
        });
        return columnIndex.concat(columnsGrid).concat({
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
                                this.grid.editRow(options.rowIndex);
                            },
                            type: "success"
                        },
                        widget: "dxButton"
                    }, {
                        options: {
                            hint: "Xóa",
                            icon: "icon icon-trash",
                            onClick: () => {
                                OGUtils.confirm("Xóa danh mục này?").then(value => {
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
                    },]
                });
            },
            dataField: "id",
            width: 100,
        });
    }

    private initCategory(): void {
        const self = this;
        this.grid = this.gridContainer.dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: false,
            columnChooser: {
                enabled: true,
                mode: "select"
            },
            disabled: false,
            errorRowEnabled: false,
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;
                e.toolbarOptions.items.unshift({
                    location: "after",
                    options: {
                        disabled: true,
                        hint: "Thêm danh mục",
                        icon: "add",
                        onClick: () => {
                            dataGrid.addRow();
                        },
                        onContentReady: (e) => {
                            self.createButton = e.component;
                        },
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        icon: "icon icon-refresh",
                        location: "after",
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
            searchPanel: {
                visible: true
            },
            selection: {
                mode: "single",
                showCheckBoxesMode: "none"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",
        }).dxDataGrid("instance");

        this.tree = $("<div />")
            .appendTo(this.treeContainer)
            .dxTreeView({
                dataSource: {
                    store: new CustomStore({
                        key: "id",
                        load: () => {
                            const def = $.Deferred();
                            axios("/api/table/category/tree").then(xhr => {
                                if (xhr.data.status === EnumStatus.OK) {
                                    def.resolve({
                                        data: xhr.data.data,
                                        totalCount: xhr.data.data.length
                                    });
                                } else {
                                    this.grid.option("disabled", true);
                                    def.resolve({
                                        data: [],
                                        totalCount: 0
                                    });
                                }
                            });
                            return def;
                        }
                    })
                },
                displayExpr: "text",
                height: "100%",
                itemTemplate: (itemData, itemIndex, element) => {
                    element.append("<i class=\"dx-icon icon icon-menu-1\"></i>");
                    element.append("<span>" + itemData.text + "</span>");
                },
                keyExpr: "id",
                noDataText: "Không có danh mục nào",
                onItemClick: (e) => {
                    if (e.itemData && e.itemData.type === "@table") {
                        const table = e.itemData.raw as OGTableModel;
                        if (table.columns) {
                            let type, format;
                            const columns = this.buildGridColumns(table.columns);
                            const edittingItems = table.columns.filter(col =>
                                !col.is_identity && col.visible
                                && col.column_name.includes("geom") === false
                                && col.column_name.includes("updated_at") === false
                                && col.column_name.includes("created_at") === false
                                && col.column_name.includes("search_content") === false
                            ).map(column => {
                                const item = {
                                    dataField: column.column_name,
                                } as SimpleItem;
                                // switch (true) {
                                //     case column.is_identity:
                                //         return;
                                //     case column.data_type === EnumDataType.integer:
                                //     case column.data_type === EnumDataType.double:
                                //     case column.data_type === EnumDataType.smallint:
                                //         item = {
                                //             dataField: column.column_name,
                                //         } as SimpleItem;
                                //         break;
                                //     case column.data_type === EnumDataType.date:
                                //     case column.data_type === EnumDataType.dateTime:
                                //     case column.data_type === EnumDataType.dateTimeTZ:
                                //         if (column.data_type === EnumDataType.date) {
                                //             type = "date";
                                //             format = "dd/MM/yyyy";
                                //         }
                                //         else if (column.data_type === EnumDataType.dateTime || column.data_type === EnumDataType.dateTimeTZ) {
                                //             type = "datetime";
                                //             format = "dd/MM/yyyy HH:mm";
                                //         }
                                //         item = {
                                //             dataField: column.column_name,
                                //             editorOptions: {
                                //                 applyButtonText: "Xác nhận",
                                //                 cancelButtonText: "Hủy",
                                //                 displayFormat: format,
                                //                 invalidDateMessage: "Vui lòng nhập đúng định dạng: " + format,
                                //                 placeholder: column.name_vn,
                                //                 showAnalogClock: false,
                                //                 showClearButton: true,
                                //                 type: type,
                                //                 width: "100%",
                                //             },
                                //             editorType: "dxDateBox",
                                //         } as SimpleItem;
                                //         break;
                                //     case column.data_type === EnumDataType.bool:
                                //         item = {
                                //             dataField: column.column_name,
                                //             editorOptions: {
                                //                 displayExpr: "mo_ta",
                                //                 items: [{
                                //                     "id": true,
                                //                     "mo_ta": "Đúng"
                                //                 }, {
                                //                     "id": false,
                                //                     "mo_ta": "Sai"
                                //                 }],
                                //                 noDataText: "Không có dữ liệu",

                                //                 showClearButton: true,
                                //                 value: false,
                                //                 valueExpr: "id",
                                //             },
                                //             editorType: "dxSelectBox",
                                //         } as SimpleItem;
                                //         break;
                                //     default:
                                //         item = {
                                //             dataField: column.column_name,
                                //         } as SimpleItem;
                                // }
                                if (column.require) {
                                    item.validationRules = [{
                                        message: `Vui lòng ${column.lookup_table_id > 0 ? "chọn" : "nhập"} ${column.name_vn}`,
                                        type: "required"
                                    }];
                                }
                                return item;
                            });
                            self.keyColumn = table.identity_column;
                            self.grid.beginUpdate();
                            self.grid.option("columns", columns);
                            self.categoryStore = new CustomStore<object, number>({
                                byKey: (key) => {
                                    return TableService.record(table.id, key);
                                },
                                insert: (values) => {
                                    return TableService.insertRecord(table.id, values);
                                },
                                key: this.keyColumn ? this.keyColumn.column_name : "id",
                                load: (loadOptions) => {
                                    return new Promise((resolve, reject) => {
                                        const args: { [key: string]: boolean | number | object | string } = {},
                                            params: { [key: string]: number | object | string } = {};
                                        Object.assign(params, self.arguments);
                                        if (table.id) {
                                            if (loadOptions.sort) {
                                                args.orderby = loadOptions.sort[0].selector;
                                                if (loadOptions.sort[0].desc)
                                                    args.orderby += " desc";
                                            }
                                            if (this.grid.option("searchPanel.text")) {
                                                params["textSearch"] = this.grid.option("searchPanel.text") as string;
                                            }
                                            else if (loadOptions.filter && loadOptions.filter.length) {
                                                args.filter = loadOptions.filter;
                                                if (!(loadOptions.filter[0] instanceof Array)) { // xử lý parse sang params bị thiếu nhiều điều kiện nếu filter phức tạp
                                                    if (loadOptions.filter[0] === "province_code" || loadOptions.filter[0] === "district_code" || loadOptions.filter[0] === "commune_code") {
                                                        // params[loadOptions.filter[0]] = [loadOptions.filter[2]];
                                                    } else {
                                                        params[loadOptions.filter[0]] = loadOptions.filter[2];
                                                    }
                                                } else {
                                                    $.each(loadOptions.filter, (idx: number, item) => {
                                                        if (item instanceof Array) {
                                                            if (item[0] === "province_code" || item[0] === "district_code" || item[0] === "commune_code") {
                                                                // params[item[0]] = [item[2]];
                                                            } else {
                                                                params[item[0]] = item[2];
                                                            }
                                                        }
                                                    });
                                                }
                                            }

                                            args.table_id = table.id;
                                            args.skip = loadOptions.skip ? loadOptions.skip : 0;
                                            args.take = loadOptions.take ? loadOptions.take : 50;

                                            axios.post(`/api/table/${table.id}/records`, args).then((result) => {
                                                if (result.data.status === EnumStatus.OK) {
                                                    resolve({
                                                        data: result.data.data.dataSearch.data,
                                                        totalCount: result.data.data.dataSearch.totalCount
                                                    } as LoadResultObject);
                                                } else {
                                                    resolve({
                                                        data: [],
                                                        totalCount: 0,
                                                    });
                                                }
                                            }).catch(error => {
                                                reject("Data Loading Error: " + error);
                                            });
                                        } else {
                                            resolve({
                                                data: [],
                                                summary: [],
                                                totalCount: 0
                                            });
                                        }
                                    });
                                },
                                remove: (key) => {
                                    const $deferred = $.Deferred();
                                    TableService.deleteRecord(table.id, key).then(response => {
                                        if (response.status == EnumStatus.OK) {
                                            OGUtils.toastSuccess("Xóa thành công", "Thành công");
                                        }
                                        else {
                                            OGUtils.toastError((response as RestError)?.errors[0]?.message ?? "Xóa thất bại", "Thất bại");
                                        }
                                        $deferred.resolve();
                                    });

                                    return $deferred;
                                },
                                update: (key, values) => {
                                    return TableService.updateRecord(table.id, values);
                                },
                            });
                            self.grid.option("dataSource", {
                                store: self.categoryStore
                            });
                            self.grid.option("editing", {
                                form: {
                                    colCount: 1,
                                    items: edittingItems
                                },
                                mode: "popup",
                                popup: {
                                    height: "auto",
                                    showTitle: true,
                                    title: "Thông tin danh mục",
                                    width: 400
                                },
                                texts: {
                                    cancelRowChanges: "Hủy",
                                    saveRowChanges: "Lưu",
                                },
                                useIcons: false
                            });
                            self.grid.endUpdate();

                            if (self.createButton) {
                                self.createButton.option("disabled", false);
                            }
                        }
                        // this.grid.getDataSource().reload();
                    }
                },
                searchEnabled: true,
                selectByClick: true,
                selectionMode: "single",
                virtualModeEnabled: true
            }).dxTreeView("instance");


    }
    onInit(): void {
        $("body").removeClass("fit-on");
        $("#header").find(".header-title >span").html("Quản lý danh mục");
        this.gridContainer = $("#category-container");
        this.treeContainer = $("#category-tree-container");

        this.categoryStore = new CustomStore({
            insert: (values) => {
                return CategoryService.insert(values);
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
                if (this.tree) {
                    const selectedNode = this.tree.getSelectedNodes();
                    if (selectedNode && selectedNode.length > 0) {
                        this.categoryTypeID = selectedNode[0].itemData.id as number;
                        CategoryService.list(this.categoryTypeID).then(result => {
                            if (result.status === EnumStatus.OK) {
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
                } else {
                    deferred.resolve({
                        data: [],
                        totalCount: 0
                    });
                }
                return deferred.promise();
            },
            remove: (key) => {
                const data = {
                    id: key,
                    type_id: this.categoryTypeID,
                };
                return CategoryService.delete(data);
            },
            update: (key, values) => {
                return CategoryService.insert(values);
            }
        });

        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight() - 15);
        this.treeContainer = $("<div />").appendTo(this.treeContainer).height("90%").width("100%");
        this.gridContainer = $("<div />").appendTo(this.gridContainer).height("100%").css("border-left", "1px solid #ddd");
        this.initCategory();
    }
}
