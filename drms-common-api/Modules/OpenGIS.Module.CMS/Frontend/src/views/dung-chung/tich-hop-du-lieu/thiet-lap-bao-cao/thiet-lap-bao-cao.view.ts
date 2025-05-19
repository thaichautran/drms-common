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

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumWebOption } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { WebOptionModel } from "../../../../../../../libs/core/models/web-option.model";
import { WebOptionService } from "../../../../../../../libs/core/services/web-option.service";
import "./thiet-lap-bao-cao.style.scss";

class ThietLapBaoCaoView implements IBaseComponent {
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
                allowEditing: false,
                caption: "Thông tin kỳ báo cáo",
                dataField: "option_description",
                sortIndex: 0,
                sortOrder: "asc",
            }, {
                caption: "Cấu hình",
                dataField: "option_value",
            }, {
                alignment: "center",
                allowEditing: false,
                allowFiltering: false,
                allowSearch: false,
                allowSorting: false,
                caption: "Thao tác",
                cellTemplate: (container, options: ColumnCellTemplateData<WebOptionModel, string>) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [
                            {
                                options: {
                                    hint: "Chỉnh sửa",
                                    icon: "icon icon-edit",
                                    onClick: () => {
                                        this.tableGrid.editRow(options.rowIndex);
                                    },
                                    type: "default"
                                },
                                widget: "dxButton"
                            },
                        ]
                    });
                },
                dataField: "option_name",
                width: 100,
            }],
            dataSource: new CustomStore<WebOptionModel, string>({
                byKey: (key: string) => {
                    return WebOptionService.get(key);
                },
                insert: (values) => {
                    return WebOptionService.save(values);
                },
                key: "option_name",
                load: (loadOptions: LoadOptions<WebOptionModel>) => {
                    return new Promise((resolve) => {
                        loadOptions["options"] = [
                            EnumWebOption.REPORT_OTHER,
                            EnumWebOption.REPORT_YEAR,
                            EnumWebOption.REPORT_QUARTER,
                            EnumWebOption.REPORT_SIX_MONTH,
                            EnumWebOption.REPORT_SUDDENLY,
                            EnumWebOption.REPORT_MONTH,
                        ];
                        WebOptionService.list(loadOptions).then(result => {
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
                    return WebOptionService.delete({ option_name: key });
                },
                update: (key: string, values: WebOptionModel) => {
                    return WebOptionService.save(values);
                }
            }),
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        dataField: "option_description",
                    }, {
                        dataField: "option_value",
                    },]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin kỳ báo cáo",
                    width: 500,
                },
                texts: {
                    cancelRowChanges: "Hủy",
                    saveRowChanges: "Lưu",
                },
                useIcons: false
            },
            filterRow: {
                visible: true,
            },
            height: "100%",
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
                            return "<h6>Thiết lập thông tin kỳ báo cáo</h6>";
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
export { ThietLapBaoCaoView };