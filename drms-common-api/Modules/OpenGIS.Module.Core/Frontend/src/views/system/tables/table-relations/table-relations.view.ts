import { LoadOptions } from "devextreme/data";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import dxSelectBox from "devextreme/ui/select_box";
import "devextreme/ui/select_box";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { OGTableModel, OGTableRelationModel } from "../../../../../../../libs/core/models/table.model";
import { TableService } from "../../../../../../../libs/core/services/table.service";

class TableRelationsView implements IBaseComponent {
    private container: JQuery<HTMLElement>;
    private mediateTable: OGTableRelationModel;
    private tableColumnSelectBox: dxSelectBox;
    private tableInfo: OGTableModel;
    private tableRelationColumnSelectBox: dxSelectBox;
    private tableRelationForm: dxForm;
    private tableRelationGrid: dxDataGrid;
    private tableRelationPopup: dxPopup;
    private tableRelationSelectBox: dxSelectBox;
    private tableRelationStore: CustomStore;
    private tableSelectBox: dxSelectBox;
    private tableStore: CustomStore<OGTableModel, number>;
    relationStore: CustomStore;
    tableColumnStore: CustomStore;
    tableGroupBySchemaStore: CustomStore;
    tableRelationColumnStore: CustomStore;
    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.registerStore();
        this.onInit();
    }
    private initTableRelationViews(container): void {
        const self = this;
        this.tableRelationPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.tableRelationForm = $("<form />").appendTo(container)
                    .dxForm({
                        colCount: 2,
                        items: [{
                            dataField: "id",
                            visible: false
                        }, {
                            dataField: "table_id",
                            editorOptions: {
                                dataSource: self.tableGroupBySchemaStore,
                                displayExpr: "name_vn",
                                grouped: true,
                                onContentReady: (e) => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                    self.tableSelectBox = e.component;
                                },
                                onSelectionChanged: () => {
                                    if (self.tableColumnSelectBox) {
                                        self.tableColumnSelectBox.getDataSource().reload();
                                        self.tableColumnSelectBox.repaint();
                                    }
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                searchExpr: ["table_name", "name_vn"],
                                searchMode: "contains",
                                value: "",
                                valueExpr: "id"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Bảng quan hệ 1",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn bảng quan hệ 1",
                                type: "required",
                            }]
                        }, {
                            dataField: "table_column_id",
                            editorOptions: {
                                dataSource: new CustomStore({
                                    byKey: (key) => {
                                        const deferred = $.Deferred();
                                        $.get("/api/table/column/" + key.toString()).done(xhr => {
                                            if (xhr && xhr.status === EnumStatus.OK) {
                                                deferred.resolve(xhr.data);
                                            }
                                            deferred.resolve([]);
                                        });
                                        return deferred;
                                    },
                                    key: "id",
                                    load: () => {
                                        const deferred = $.Deferred();
                                        const table_id = self.tableSelectBox.option("selectedItem") ? self.tableSelectBox.option("selectedItem").id : 0;
                                        if (table_id) {
                                            $.ajax({
                                                error: () => {
                                                    deferred.reject("Data Loading Error");
                                                },
                                                success: (xhr) => {
                                                    if (xhr && xhr.status === EnumStatus.OK) {
                                                        deferred.resolve(xhr.data);
                                                    } else {
                                                        deferred.resolve([]);
                                                    }
                                                },
                                                type: "get",
                                                url: "/api/table/" + table_id + "/columns",
                                            });
                                        } else {
                                            deferred.resolve([]);
                                        }
                                        return deferred.promise();
                                    }
                                }),
                                displayExpr: "name_vn",
                                onContentReady: (e) => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });

                                    self.tableColumnSelectBox = e.component;
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                searchExpr: ["column_name", "name_vn"],
                                searchMode: "contains",
                                valueExpr: "id"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Trường quan hệ 1",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn trường quan hệ bảng 1",
                                type: "required",
                            }, {
                                message: "Các trường quan hệ phải có cùng kiểu dữ liệu",
                                type: "custom",
                                validationCallback: () => {
                                    const table_column = self.tableColumnSelectBox.option("selectedItem");
                                    const relation_table_column = self.tableRelationColumnSelectBox.option("selectedItem");
                                    if (table_column && relation_table_column) {
                                        if (relation_table_column.data_type == table_column.data_type) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    } else {
                                        return true;
                                    }
                                }
                            }]
                        }, {
                            dataField: "relation_table_id",
                            editorOptions: {
                                dataSource: self.tableGroupBySchemaStore,
                                displayExpr: "name_vn",
                                grouped: true,
                                onContentReady: (e) => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                    self.tableRelationSelectBox = e.component;
                                },
                                onSelectionChanged: () => {
                                    if (self.tableRelationColumnSelectBox) {
                                        self.tableRelationColumnSelectBox.getDataSource().reload();
                                        self.tableRelationColumnSelectBox.repaint();
                                    }
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                searchExpr: ["table_name", "name_vn"],
                                searchMode: "contains",
                                value: "",
                                valueExpr: "id"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Bảng quan hệ 2",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn bảng quan hệ 2",
                                type: "required",
                            }]
                        }, {
                            dataField: "relation_table_column_id",
                            editorOptions: {
                                dataSource: new CustomStore({
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
                                    key: "id",
                                    load: () => {
                                        const deferred = $.Deferred();
                                        const relation_table_id = self.tableRelationSelectBox.option("selectedItem") ? self.tableRelationSelectBox.option("selectedItem").id : 0;
                                        if (relation_table_id) {
                                            $.ajax({
                                                error: () => {
                                                    deferred.reject("Data Loading Error");
                                                },
                                                success: (xhr) => {
                                                    if (xhr && xhr.status === EnumStatus.OK) {
                                                        deferred.resolve(xhr.data);
                                                    } else {
                                                        deferred.resolve([]);
                                                    }
                                                },
                                                type: "get",
                                                url: "/api/table/" + relation_table_id + "/columns",
                                            });
                                        } else {
                                            deferred.resolve([]);
                                        }
                                        return deferred.promise();
                                    }
                                }),
                                displayExpr: "name_vn",
                                onContentReady: (e) => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                    self.tableRelationColumnSelectBox = e.component;
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                searchExpr: ["column_name", "name_vn"],
                                searchMode: "contains",
                                valueExpr: "id"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Trường quan hệ 2",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn trường quan hệ bảng 2",
                                type: "required",
                            }, {
                                message: "Các trường quan hệ phải có cùng kiểu dữ liệu",
                                type: "custom",
                                validationCallback: () => {
                                    const table_column = self.tableColumnSelectBox.option("selectedItem");
                                    const relation_table_column = self.tableRelationColumnSelectBox.option("selectedItem");
                                    if (table_column && relation_table_column) {
                                        if (relation_table_column.data_type == table_column.data_type) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    } else {
                                        return true;
                                    }
                                }
                            }]
                        }, {
                            dataField: "mediate_table_id",
                            editorOptions: {
                                dataSource: self.tableStore,
                                displayExpr: "name_vn",
                                onChange: () => {

                                },
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                searchExpr: ["table_name", "name_vn"],
                                searchMode: "contains",
                                value: "",
                                valueExpr: "id"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Bảng trung gian",
                            },
                        }, {
                            dataField: "relation_type",
                            editorOptions: {
                                dataSource: [{
                                    text: "Quan hệ 1-1",
                                    value: "oneToOne"
                                }, {
                                    text: "Quan hệ 1-n",
                                    value: "oneToMany"
                                }, {
                                    text: "Quan hệ n-n",
                                    value: "ManyToMany"
                                }],
                                displayExpr: "text",
                                placeholder: "[Chọn...]",
                                value: "",
                                valueExpr: "value"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Kiểu quan hệ",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn loại quan hệ",
                                type: "required",
                            },]
                        }, {
                            colSpan: 2,
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 2,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            options: {
                                                onClick: () => {
                                                    const validate = this.tableRelationForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.tableRelationForm.option("formData");
                                                        if (!data.mediate_table_id) { data.mediate_table_id = 0; }
                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify(data),
                                                            type: "POST",
                                                            url: "/api/table/relation/save",
                                                        }).done(xhr => {
                                                            if (xhr.status === EnumStatus.OK) {
                                                                OGUtils.alert("Lưu quan hệ thành công!").then(() => {
                                                                    self.tableRelationGrid.getDataSource().reload();
                                                                    self.tableRelationPopup.hide();
                                                                });
                                                            } else {
                                                                if (xhr.errors.length) {
                                                                    OGUtils.alert(xhr.errors[0].message);
                                                                }
                                                                else {
                                                                    OGUtils.alert("Lưu thông tin thất bại!");
                                                                }
                                                            }
                                                        });
                                                    }
                                                },

                                                text: "Lưu",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {

                                            options: {
                                                onClick: () => {
                                                    this.tableRelationPopup.hide();
                                                },

                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }],
                        onContentReady: () => {
                        },
                        scrollingEnabled: true,
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onHiding: () => {
                self.tableRelationForm.option("formData", {});
            },
            onOptionChanged: () => {
            },
            position: {
                at: "center",
                my: "center",
                of: window
            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: false,
            showTitle: true,
            title: "Thêm quan hệ",
            width: 700,
        }).dxPopup("instance");

        this.tableRelationGrid = $("<div />").appendTo(container).dxDataGrid({
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
                    const pageIndex = this.tableRelationGrid.pageIndex();
                    const pageSize = this.tableRelationGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                width: 50,
            }, {
                dataField: "id",
                visible: false,
                width: 50
            }, {
                caption: "Bảng trung gian",
                dataField: "mediate_table_id",
                lookup: {
                    dataSource: {
                        store: this.tableStore,
                    },
                    displayExpr: "name_vn",
                    valueExpr: "id",
                }
            }, {
                caption: "Bảng quan hệ 1",
                dataField: "table_id",
                lookup: {
                    dataSource: {
                        store: this.tableStore,
                    },
                    displayExpr: "name_vn",
                    valueExpr: "id",
                }
            }, {
                caption: "Bảng quan hệ 2",
                dataField: "relation_table_id",
                lookup: {
                    dataSource: {
                        store: this.tableStore,
                    },
                    displayExpr: "name_vn",

                    valueExpr: "id",
                }
            }, {
                caption: "Trường quan hệ 1",
                dataField: "table_column.name_vn",
            }, {
                caption: "Trường quan hệ 2",
                dataField: "relation_column.name_vn"
            }, {
                caption: "Kiểu quan hệ",
                dataField: "relation_type",
                lookup: {
                    dataSource: [{
                        text: "Quan hệ 1-1",
                        value: "oneToOne"
                    }, {
                        text: "Quan hệ 1-n",
                        value: "oneToMany"
                    },{
                        text: "Quan hệ n-n",
                        value: "ManyToMany"
                    }],
                    displayExpr: "text",

                    valueExpr: "value",
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
                                    self.tableRelationPopup.show();
                                    self.tableRelationForm.option("formData", options.row.data);
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {

                            options: {
                                icon: "icon icon-trash",
                                onClick: () => {
                                    OGUtils.confirm("Xác nhận xóa quan hệ này?").then(value => {
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
            dataSource: {
                store: this.tableRelationStore
            },
            editing: {
                allowAdding: false,
                allowDeleting: false,
                allowUpdating: false,
            },
            errorRowEnabled: false,
            filterRow: { visible: true },
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;

                e.toolbarOptions.items.unshift({
                    location: "after",
                    options: {
                        onClick: () => {
                            self.tableRelationPopup.show();
                        },
                        text: "Thêm quan hệ",
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
            remoteOperations: {
                paging: true
            },
            scrolling: {
                showScrollbar: "always"
            },
            selection: {
                mode: "single"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",
        }).dxDataGrid("instance");
    }
    private registerStore(): void {
        this.tableColumnStore = new CustomStore({
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
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                if (this.mediateTable) {
                    $.ajax({
                        error: () => {
                            deferred.reject("Data Loading Error");
                        },
                        success: (xhr) => {
                            if (xhr && xhr.status === EnumStatus.OK) {
                                deferred.resolve(xhr.data);
                            } else {
                                deferred.resolve([]);
                            }
                        },
                        type: "get",
                        url: "/api/table/" + this.mediateTable.mediate_table_id + "/columns",
                    });
                } else {
                    $.ajax({
                        error: () => {
                            deferred.reject("Data Loading Error");
                        },
                        success: (xhr) => {
                            if (xhr && xhr.status === EnumStatus.OK) {
                                deferred.resolve(xhr.data);
                            } else {
                                deferred.resolve([]);
                            }
                        },
                        type: "get",
                        url: "/api/table/columns",
                    });
                }

                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.tableStore = new CustomStore({
            byKey: (key) => {
                return TableService.get(key);
            },
            key: "id",
            load: () => {
                const def = $.Deferred();
                TableService.list({}).then(result => {
                    if(result){
                        def.resolve(result.data);
                    }else {
                        def.resolve([]);
                    }
                });
                return def.promise();
            },
            loadMode: "raw"
        });
        this.relationStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();

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
                    url: "/api/table/listRelations",
                });
                return deferred.promise();
            },
            remove: (key) => {
                return $.ajax({
                    data: { id: key },
                    type: "POST",
                    url: "/api/table/deleteRelation",
                });
            },
            update: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    type: "POST",
                    url: "/api/table/update",
                });
            }
        });
        this.tableRelationStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                $.get("/api/table/relation/" + key).done(xhr => {
                    if (xhr && xhr.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            },
            insert: (values) => {
                values.name_en = values.name_vn;
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    type: "POST",
                    url: "/api/table/relation/save",
                });
            },
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred();
                // const args: { [key: string]: number | string } = {};

                // if (loadOptions.sort) {
                //     args.orderby = loadOptions.sort[0].selector;
                //     if (loadOptions.sort[0].desc)
                //         args.orderby += " desc";
                // }

                // args.skip = loadOptions.skip ? loadOptions.skip : 0;
                // args.take = loadOptions.take ? loadOptions.take : 50;

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
                    url: "/api/table/relation/list",
                });
                return deferred.promise();
            },
            remove: (key) => {
                return $.ajax({
                    data: {
                        id: key,
                    },
                    type: "POST",
                    url: "/api/table/relation/delete",
                });
            },
            update: (key, values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    type: "POST",
                    url: "/api/table/relation/save",
                });
            }
        });
        this.tableRelationColumnStore = new CustomStore({
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
            }
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
        this.initTableRelationViews(this.container);
    }
}

export { TableRelationsView };