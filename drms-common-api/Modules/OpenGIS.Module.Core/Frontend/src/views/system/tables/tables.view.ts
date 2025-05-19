import { LoadOptions } from "devextreme/data";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid, { EditorPreparingEvent } from "devextreme/ui/data_grid";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/multi_view";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/select_box";
import "devextreme/ui/tag_box";

import { SwitchModuleWindowComponent } from "../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { RestData, RestError } from "../../../../../../libs/core/models/base-response.model";
import { OGTableModel } from "../../../../../../libs/core/models/table.model";
import { TableColumnService, TableSchemaService, TableService } from "../../../../../../libs/core/services/table.service";
import { TableColumnView } from "./table-columns/table-columns.view";
import { TableRelationsView } from "./table-relations/table-relations.view";

@RazorView()
class TableView extends Layout {
    createSchemaForm: dxForm;
    createSchemaPopup: dxPopup;
    moveTableForm: dxForm;
    moveTablePopup: dxPopup;
    switchModule: SwitchModuleWindowComponent;
    tableColumnView: TableColumnView;
    tableGrid: dxDataGrid;
    tableInfo: OGTableModel;
    tableRelationContainer: JQuery<HTMLElement>;
    tableRelationView: TableRelationsView;
    tableSchema: string;
    tableSchemaContainer: JQuery<HTMLElement>;
    tableSchemaStore: CustomStore;
    tableViews: dxMultiView;
    tableViewsContainer: JQuery<HTMLElement>;

    constructor() {
        super("child", "Quản lý bảng dữ liệu");
    }

    private initLayout(): void {
        this.createSchemaPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.createSchemaForm = $("<form />").appendTo(container)
                    .dxForm({
                        formData: {
                            description: "",
                            schema_name: "",
                        },
                        items: [{
                            dataField: "schema_name",
                            label: {
                                text: "Tên schema",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên schema",
                                type: "required",
                            }, {
                                message: "Tên schema không thế có kí tự đặc biệt",
                                type: "custom",
                                validationCallback: (params) => {
                                    return OGUtils.isNormalize(params.value);
                                }
                            }]
                        }, {
                            dataField: "description",
                            label: {
                                text: "Mô tả",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập mô tả",
                                type: "required",
                            }]
                        }, {
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            options: {
                                                onClick: () => {
                                                    const validate = this.createSchemaForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.createSchemaForm.option("formData");
                                                        OGUtils.showLoading();
                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify(data),
                                                            type: "post",
                                                            url: "/api/table/schema/create",
                                                        }).done(() => {
                                                            OGUtils.hideLoading();
                                                            location.reload();
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
                                                    this.createSchemaPopup.hide();
                                                },
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }],
                        scrollingEnabled: true
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onOptionChanged: () => {
            },
            position: {
                at: "center",
                my: "center",
                of: window
            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Tạo schema",
            width: "400px",
        }).dxPopup("instance");

        this.moveTablePopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.moveTableForm = $("<form />").appendTo(container)
                    .dxForm({

                        formData: {
                            id: 0,
                            table_schema: "",
                        },
                        items: [{
                            dataField: "table_schema",
                            editorOptions: {
                                dataSource: new DataSource({
                                    store: this.tableSchemaStore
                                }),
                                displayExpr: "description",
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
                                searchExpr: ["schema_name", "description"],
                                searchMode: "contains",
                                valueExpr: "schema_name",
                                width: 250
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Schema mới",
                            }
                        }, {
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {

                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{

                                            options: {
                                                onClick: () => {
                                                    const data = this.moveTableForm.option("formData");
                                                    OGUtils.showLoading();
                                                    $.ajax({
                                                        contentType: "application/json",
                                                        data: JSON.stringify({
                                                            table_id: data.id,
                                                            table_schema: data.table_schema
                                                        }),
                                                        type: "post",
                                                        url: "/api/table/move",
                                                    }).done(() => {
                                                        this.moveTablePopup.hide();
                                                        OGUtils.hideLoading();
                                                        this.tableGrid.getDataSource().reload();
                                                    });
                                                },
                                                text: "Lưu",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {

                                            options: {
                                                onClick: () => {
                                                    this.moveTablePopup.hide();
                                                },

                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }],
                        scrollingEnabled: true
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onOptionChanged: () => {
            },
            position: {
                at: "center",
                my: "center",
                of: window
            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Chuyển bảng sang schema khác",
            width: "400px",
        }).dxPopup("instance");
    }

    private initTableGrid(): void {
        this.tableViews = this.tableViewsContainer.dxMultiView({
            deferRendering: false,
            //height: "100%",
            items: [
                {
                    template: (itemData, itemIndex, itemElement) => {
                        this.tableGrid = $("<div />").appendTo(itemElement).dxDataGrid({
                            allowColumnReordering: true,
                            allowColumnResizing: true,
                            columnChooser: {
                                enabled: true,
                                mode: "select",
                            },
                            columns: [
                                {
                                    alignment: "center",
                                    allowFiltering: false,
                                    allowSearch: false,
                                    allowSorting: false,
                                    caption: "#",
                                    cellTemplate: (container, options) => {
                                        const pageIndex = this.tableGrid.pageIndex();
                                        const pageSize = this.tableGrid.pageSize();
                                        container.append(`${(pageSize * pageIndex) + options.row.rowIndex}`);
                                    },
                                    visible: true,
                                    width: 50,
                                }, {
                                    caption: "Schema",
                                    dataField: "table_schema",
                                    groupIndex: 0,
                                    lookup: {
                                        dataSource: {
                                            store: this.tableSchemaStore
                                        },
                                        displayExpr: "description",
                                        valueExpr: "schema_name",
                                    },
                                }, {
                                    alignment: "center",
                                    allowFiltering: false,
                                    allowSearch: false,
                                    caption: "TT",
                                    dataField: "order",
                                    sortIndex: 0,
                                    sortOrder: "asc",
                                    width: 70,
                                }, {
                                    caption: "Tên bảng",
                                    dataField: "table_name"
                                }, {
                                    caption: "Mô tả (Vn)",
                                    dataField: "name_vn"
                                }, {
                                    caption: "Mô tả (En)",
                                    dataField: "name_en"
                                }, {
                                    alignment: "center",
                                    allowEditing: false,
                                    allowFiltering: false,
                                    allowSearch: false,
                                    allowSorting: false,
                                    caption: "Thao tác",
                                    cellTemplate: (container, options) => {
                                        $("<div>").appendTo(container).dxToolbar({
                                            items: [{

                                                options: {
                                                    hint: "Di chuyển",
                                                    icon: "icon icon-3d-rotate",
                                                    onClick: () => {
                                                        this.moveTableForm.option("formData", options.data);
                                                        this.moveTablePopup.show();
                                                    },
                                                    type: "default"
                                                },
                                                widget: "dxButton"
                                            }, {

                                                options: {
                                                    hint: "Chỉnh sửa",
                                                    icon: "icon icon-edit-2",
                                                    onClick: () => {
                                                        this.tableGrid.editRow(options.rowIndex);
                                                    },
                                                    type: "success"
                                                },
                                                widget: "dxButton"
                                            }, {

                                                options: {
                                                    disabled: options.data.permanent,
                                                    hint: "Xoá",
                                                    icon: "icon icon-trash",
                                                    onClick: () => {
                                                        if (options.data.permanent === false) {
                                                            OGUtils.confirm("Xóa bảng dữ liệu này?").then(value => {
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
                                                    onClick: () => {
                                                        this.tableInfo = options.data;
                                                        this.tableColumnView.reload(this.tableInfo);
                                                        this.tableViews.option("selectedIndex", 1);
                                                    },
                                                    text: "Trường thông tin",
                                                    type: "default"
                                                },
                                                widget: "dxButton"
                                            }]
                                        });
                                    },
                                    dataField: "id",
                                    width: 300,
                                }],
                            dataSource: new CustomStore<OGTableModel, number>({
                                byKey: (key: number) => {
                                    console.log(key);
                                    return TableService.get(key);
                                },
                                insert: (values) => {
                                    values.name_en = values.name_vn;
                                    return TableService.insert(values);
                                    // if (this.tableSchema) {
                                    //     values.table_schema = this.tableSchema;
                                    //     return TableService.insert(values);
                                    // } else {
                                    //     OGUtils.alert("Vui lòng chọn schema muốn thêm bảng!");
                                    // }
                                },
                                key: "id",
                                load: (loadOptions: LoadOptions<OGTableModel>) => {
                                    return new Promise((resolve) => {
                                        if (this.tableSchema) {
                                            Object.assign(loadOptions, {
                                                tableSchema: [this.tableSchema]
                                            });
                                        }
                                        if (loadOptions.filter && loadOptions.filter.length) {
                                            Object.assign(loadOptions, {
                                                searchValue: loadOptions.filter[0].filterValue ?? loadOptions.filter.filterValue
                                            });
                                        }
                                        TableService.list(loadOptions).then(result => {
                                            if (result) {
                                                resolve({
                                                    data: result.data,
                                                    totalCount: result.recordsTotal
                                                });
                                            } else {
                                                resolve({
                                                    data: [],
                                                    totalCount: 0
                                                });
                                            }
                                        });
                                    });
                                },
                                remove: (key: number) => {
                                    return TableService.drop(key);
                                },
                                update: (key: number, values: OGTableModel) => {
                                    return TableService.update(values);
                                }
                            }),
                            editing: {
                                form: {
                                    colCount: 1,
                                    items: [{
                                        colSpan: 2,
                                        dataField: "order",
                                        label: {
                                            text: "Thứ tự"
                                        }
                                    }, {
                                        colSpan: 2,
                                        dataField: "table_schema",
                                        editorOptions: {
                                            showClearButton: true,
                                        },
                                        validationRules: [{
                                            message: "Vui lòng chọn schema",
                                            type: "required",
                                        }],
                                    }, {
                                        colSpan: 2,
                                        dataField: "table_name",
                                        editorOptions: {
                                            showClearButton: true,
                                        },
                                        validationRules: [{
                                            message: "Vui lòng nhập tên bảng",
                                            type: "required",
                                        }, {
                                            message: "Tên bảng không thế có kí tự đặc biệt",
                                            type: "custom",
                                            validationCallback: (params) => {
                                                return OGUtils.isNormalize(params.value);
                                            }
                                        }],
                                    }, {
                                        colSpan: 2,
                                        dataField: "name_vn",
                                        editorOptions: {
                                            showClearButton: true,
                                        },
                                        validationRules: [{
                                            message: "Vui lòng nhập mô tả",
                                            type: "required",
                                        }]
                                    }, {
                                        dataField: "name_en",
                                        editorOptions: {
                                            showClearButton: true,
                                        },
                                        validationRules: [{
                                            message: "Vui lòng nhập mô tả",
                                            type: "required",
                                        }]
                                    }, {
                                        dataField: "table_schema",
                                        visible: false,
                                    }],
                                },
                                mode: "popup",
                                popup: {
                                    height: "auto",
                                    showTitle: true,
                                    title: "Thông tin bảng",
                                    width: 400,
                                },
                                useIcons: true
                            },
                            filterRow: {
                                visible: true,
                            },
                            height: "100%",
                            onEditorPreparing: (e: EditorPreparingEvent<OGTableModel, number>) => {
                                if (e.parentType == "dataRow") {
                                    if (!e.row.isNewRow && e.dataField === "table_name") {
                                        e.editorOptions.readOnly = true;
                                    }
                                }
                            },
                            onRowUpdating: function (options) {
                                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
                            },
                            pager: {
                                allowedPageSizes: [50, 100, 200],
                                showInfo: true,
                                showNavigationButtons: true,
                                showPageSizeSelector: true,
                                visible: true
                            },
                            paging: {
                                enabled: true,
                                pageSize: 50
                            },
                            remoteOperations: {
                                filtering: true,
                                groupPaging: false,
                                grouping: false,
                                paging: true,
                                sorting: true,
                                summary: false,
                            },
                            scrolling: {
                                showScrollbar: "always"
                            },
                            searchPanel: { visible: true },
                            selection: {
                                mode: "single",
                                showCheckBoxesMode: "none"
                            },
                            showBorders: true,
                            showRowLines: true,
                            sorting: {
                                mode: "single",
                            },
                            toolbar: {
                                items: [{
                                    location: "before",
                                    options: {
                                        dataSource: new DataSource({
                                            store: this.tableSchemaStore,
                                        }),
                                        displayExpr: "description",
                                        onSelectionChanged: (e) => {
                                            this.tableSchema = e.selectedItem ? e.selectedItem.schema_name : "";
                                            this.tableGrid.filter([
                                                ["table_schema", "=", this.tableSchema],
                                            ]);

                                        },
                                        placeholder: "Chọn Schema",
                                        searchEnabled: true,
                                        searchExprv: ["schema_name", "description"],
                                        searchMode: "contains",
                                        showClearButton: true,
                                        valueExpr: "schema_name",
                                        width: 200
                                    },
                                    widget: "dxSelectBox"
                                }, {
                                    location: "before",
                                    options: {
                                        onClick: () => {
                                            this.createSchemaPopup.show();
                                        },
                                        text: "Tạo schema mới",
                                        type: "default"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "after",
                                    options: {
                                        onClick: async () => {
                                            const items = this.tableGrid.getDataSource().items();
                                            if (this.tableSchema) {
                                                await TableSchemaService.sync(this.tableSchema);
                                                OGUtils.toastSuccess("Đồng bộ thành công!");
                                                this.tableGrid.getDataSource().reload();
                                            } else {
                                                OGUtils.toastError("Vui lòng chọn schema!");
                                            }
                                        },
                                        text: "Đồng bộ bảng",
                                        type: "warning"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "after",
                                    options: {
                                        onClick: async () => {
                                            OGUtils.showLoading();
                                            const response: RestData<boolean> | RestError = await TableColumnService.syncAllColumns(this.tableSchema);
                                            OGUtils.hideLoading();
                                            OGUtils.toastSuccess("Đồng bộ thành công!");
                                        },
                                        text: "Đồng bộ trường thông tin",
                                        type: "warning"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "after",
                                    options: {
                                        onClick: () => {
                                            this.tableGrid.addRow();
                                        },
                                        text: "Tạo bảng dữ liệu",
                                        type: "default"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "after",
                                    options: {
                                        hint: "Làm mới bảng",
                                        icon: "icon icon-refresh",
                                        onClick: () => {
                                            this.tableGrid.getDataSource().reload();
                                        }
                                    },
                                    widget: "dxButton"
                                }, "searchPanel", "groupPanel"]
                            },
                            width: "100%"
                        }).dxDataGrid("instance");
                    }
                }, {
                    template: (itemData, itemIndex, itemElement) => {
                        this.tableColumnView = new TableColumnView(itemElement, () => this.tableViews.option("selectedIndex", 0));
                    }
                }],
            swipeEnabled: false
        }).dxMultiView("instance");
        this.tableViews.element().find(".dx-multiview-wrapper").css("border", "none");
    }

    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());

        this.tableViewsContainer = $("#table-container");
        this.tableRelationContainer = $("#relation-container");
        this.switchModule = new SwitchModuleWindowComponent("table");
        this.tableSchemaStore = new CustomStore({
            byKey: (key) => {
                const def = $.Deferred();
                if (key) {
                    $.get("/api/table/schema/" + key).done(xhr => {
                        if (xhr.status === EnumStatus.OK) {
                            def.resolve(xhr.data);
                        } else {
                            def.resolve({});
                        }
                    });
                } else {
                    def.resolve({});
                }
                return def;
            },
            key: "schema_name",
            load: () => {
                const def = $.Deferred();
                $.get("/api/table/schema/list").done(xhr => {
                    if (xhr.status === EnumStatus.OK) {
                        def.resolve(xhr.data);
                    } else {
                        def.resolve({});
                    }
                });
                return def;
            },
            // loadMode: "raw"
        });
        this.initLayout();
        this.initTableGrid();
        this.tableRelationView = new TableRelationsView(this.tableRelationContainer);
    }
}