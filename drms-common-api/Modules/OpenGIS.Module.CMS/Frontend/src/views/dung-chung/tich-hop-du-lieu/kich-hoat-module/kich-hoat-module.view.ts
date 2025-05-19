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

import { AttributesWindowComponent, AttributesWindowOption } from "../../../../../../../libs/core/components/attributes-window/attributes-window.component";
import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { SwitchModuleWindowComponent } from "../../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { OGConfigModel } from "../../../../../../../libs/core/models/config.model";
import { CustomSchemaModel } from "../../../../../../../libs/core/models/table.model";
import { CustomSchemaService } from "../../../../../../../libs/core/services/custom-schema.service";
import "./kich-hoat-module.style.scss";

class KichHoatModuleView implements IBaseComponent {
    switchModule: SwitchModuleWindowComponent;
    tableGrid: dxDataGrid;
    tableViewsContainer: JQuery<HTMLElement>;
    constructor(container: JQuery<HTMLElement>) {
        this.tableViewsContainer = container;
        this.onInit();
    }

    private initLayout(): void {

    }

    private initTableGrid(): void {
        this.tableGrid = $("<div />").appendTo(this.tableViewsContainer).dxDataGrid({
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
                caption: "Thông tin chức năng",
                dataField: "description",
                sortIndex: 0,
                sortOrder: "asc",
            }, {
                alignment: "center",
                allowFiltering: false,
                allowSearch: false,
                caption: "Kích hoạt",
                dataField: "is_active",
            }, {
                alignment: "center",
                allowFiltering: false,
                allowSearch: false,
                caption: "Khóa",
                dataField: "is_locked",
            }, {
                alignment: "center",
                allowEditing: false,
                allowFiltering: false,
                allowSearch: false,
                allowSorting: false,
                caption: "Thao tác",
                cellTemplate: (container, options: ColumnCellTemplateData<CustomSchemaModel, number>) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [
                            {
                                options: {
                                    hint: options.data.is_active ? "Bỏ kích hoạt" : "Kích hoạt",
                                    icon: options.data.is_active ? "icon icon-close-square" : "icon icon-tick-square",
                                    onClick: () => {
                                        OGUtils.confirm((options.data.is_active ? "Bỏ kích hoạt" : "Kích hoạt") + " module này?").then(value => {
                                            if (value) {
                                                options.data.is_active = !options.data.is_active;
                                                CustomSchemaService.update(options.data).then(() => {
                                                    this.tableGrid.getDataSource().reload();
                                                });
                                            }
                                        });
                                    },
                                    type: options.data.is_active ? "danger" : "success"
                                },
                                widget: "dxButton"
                            },
                            {
                                options: {
                                    hint: options.data.is_locked ? "Mở khóa" : "Khóa",
                                    icon: options.data.is_locked ? "icon icon-unlock" : "icon icon-lock",
                                    onClick: () => {
                                        OGUtils.confirm((options.data.is_locked ? "Mở khóa" : "Khóa") + " module này?").then(value => {
                                            if (value) {
                                                options.data.is_locked = !options.data.is_locked;
                                                CustomSchemaService.update(options.data).then(() => {
                                                    this.tableGrid.getDataSource().reload();
                                                });
                                            }
                                        });
                                    },
                                    type: options.data.is_locked ? "success" : "danger"
                                },
                                widget: "dxButton"
                            },
                        ]
                    });
                },
                dataField: "schema_name",
                width: 100,
            }],
            dataSource: new CustomStore<CustomSchemaModel, string>({
                byKey: (key: string) => {
                    return CustomSchemaService.get(key);
                },
                insert: (values) => {
                    return CustomSchemaService.insert(values);
                },
                key: "schema_name",
                load: (loadOptions: LoadOptions<CustomSchemaModel>) => {
                    return new Promise((resolve) => {
                        CustomSchemaService.list(loadOptions).then(result => {
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
                remove: (key: string) => {
                    return CustomSchemaService.delete({ schema_name: key });
                },
                update: (key: string, values: CustomSchemaModel) => {
                    return CustomSchemaService.update(values);
                }
            }),
            filterRow: {
                visible: true,
            },
            height: "100%",
            onEditorPreparing: (e: EditorPreparingEvent<CustomSchemaModel, number>) => {
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
                items: [
                    {
                        location: "before",
                        template: () => {
                            return "<h6>Kích hoạt module</h6>";
                        }
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
                    }, "searchPanel"]
            },
            width: "100%"
        }).dxDataGrid("instance");
    }

    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());
        this.initLayout();
        this.initTableGrid();
    }
}
export { KichHoatModuleView };