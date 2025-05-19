import { LoadOptions } from "devextreme/data";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid, { ColumnCellTemplateData, EditorPreparingEvent } from "devextreme/ui/data_grid";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/multi_view";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/select_box";
import "devextreme/ui/tag_box";

import { AttributesEditorComponent } from "../../../../../../../libs/core/components/attributes-editor/attributes-editor.component";
import { AttributesWindowComponent, AttributesWindowOption } from "../../../../../../../libs/core/components/attributes-window/attributes-window.component";
import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { SwitchModuleWindowComponent } from "../../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { OGConfigModel } from "../../../../../../../libs/core/models/config.model";
import { OGTableModel } from "../../../../../../../libs/core/models/table.model";
import { TableService } from "../../../../../../../libs/core/services/table.service";
import { TableColumnView } from "./table-columns/table-columns.view";

class DuLieuHeThongView implements IBaseComponent {
    attributesWindowComponent: AttributesWindowComponent;
    config: OGConfigModel;
    showButton: boolean = false;
    switchModule: SwitchModuleWindowComponent;
    tableColumnView: TableColumnView;
    tableGrid: dxDataGrid;
    tableInfo: OGTableModel;
    tableSchema: string;
    tableSchemaStore: CustomStore;
    tableViews: dxMultiView;
    tableViewsContainer: JQuery<HTMLElement>;
    constructor(container: JQuery<HTMLElement>, config: OGConfigModel, showButton: boolean = false) {
        this.tableViewsContainer = container;
        this.showButton = showButton;
        this.config = config;
        this.onInit();
    }

    private initLayout(): void {

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
                            columns: [{
                                alignment: "center",
                                allowFiltering: false,
                                allowSearch: false,
                                allowSorting: false,
                                caption: "#",
                                cellTemplate: (container, options) => {
                                    const pageIndex = this.tableGrid.pageIndex();
                                    const pageSize = this.tableGrid.pageSize();
                                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
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
                                cellTemplate: (container, options: ColumnCellTemplateData<OGTableModel, number>) => {
                                    $("<div>").appendTo(container).dxToolbar({
                                        items: [
                                            {
                                                options: {
                                                    hint: "Thông tin dữ liệu",
                                                    icon: "icon icon-book",
                                                    onClick: () => {
                                                        this.attributesWindowComponent.for(undefined, options.data).show();
                                                    },
                                                    type: "default"
                                                },
                                                widget: "dxButton"
                                            },
                                            {

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
                                            }
                                        ]
                                    });
                                },
                                dataField: "id",
                                width: 300,
                            }],
                            dataSource: new CustomStore<OGTableModel, number>({
                                byKey: (key: number) => {
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
                                            this.tableGrid.refresh(true);
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
                },
                {
                    template: (itemData, itemIndex, itemElement) => {
                        this.tableColumnView = new TableColumnView(itemElement, () => this.tableViews.option("selectedIndex", 0));
                    }
                }
            ],
            swipeEnabled: false
        }).dxMultiView("instance");
    }

    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());
        this.attributesWindowComponent = new AttributesWindowComponent(null, {
            attributeEditors: new AttributesEditorComponent(null),
            oGConfig: this.config,
            showButton: this.showButton
        } as AttributesWindowOption);
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
    }
}
export { DuLieuHeThongView };