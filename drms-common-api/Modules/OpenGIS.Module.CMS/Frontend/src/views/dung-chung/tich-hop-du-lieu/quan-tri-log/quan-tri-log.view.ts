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
import moment from "moment";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";



class QuanTriLogView implements IBaseComponent {
    tableGrid: dxDataGrid;
    tableViewsContainer: JQuery<HTMLElement>;
    constructor(container: JQuery<HTMLElement>) {
        this.tableViewsContainer = container;
        this.onInit();
    }

    private initLayout(): void {

    }

    private initTableGrid(): void {
        let timestamp = null;
        let user_name = null;
        const self = this;
        self.tableGrid = $("<div />").appendTo(this.tableViewsContainer).dxDataGrid({
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
                caption: "Người dùng",
                dataField: "user_name",
                sortIndex: 0,
                sortOrder: "asc",
            }, {
                caption: "Đường dẫn",
                dataField: "url",
            }, {
                caption: "Địa chỉ IP",
                dataField: "ip_address",
            }, {
                caption: "Phương thức",
                dataField: "method",
            }, {
                alignment: "center",
                caption: "Thời gian",
                dataField: "timestamp",
                dataType: "datetime",
                format: "dd/MM/yyyy hh:mm"
            },],
            dataSource: new CustomStore({
                byKey: (key: number) => {
                    return $.get("/api/user/access-log/" + key);
                },
                // insert: (values) => {
                //     return APIShareService.insert(values);
                // },
                key: "user_access_log_id",
                load: (loadOptions: LoadOptions) => {
                    loadOptions["timestamp"] = timestamp;
                    loadOptions["user_name"] = user_name;
                    return new Promise((resolve) => {
                        $.ajax("/api/user/access-log/data-grid", {
                            contentType: "application/json",
                            data: JSON.stringify(loadOptions),
                            type: "post"
                        }).done(result => {
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
                // remove: (key: number) => {
                //     return APIShareService.delete({ id: key });
                // },
                // update: (key: number, values: APIShareModel) => {
                //     return APIShareService.update(values);
                // }
            }),
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
                            return "<h6>Quản trị log</h6>";
                        }
                    }, {
                        location: "after",
                        options: {
                            dataSource: {
                                store: new CustomStore({
                                    key: "id",
                                    load: (loadOptions) => {
                                        const deferred = $.Deferred();
                                        $.ajax({
                                            error: () => {
                                                deferred.reject("Data Loading Error");
                                            },
                                            success: (xhr) => {
                                                if (xhr.status === EnumStatus.OK) {
                                                    deferred.resolve(xhr.data);
                                                }
                                                else {
                                                    deferred.resolve([]);
                                                }
                                            },
                                            type: "get",
                                            url: "/api/group/users",
                                        });
                                        return deferred.promise();
                                    },
                                })
                            },
                            displayExpr: "user_name",
                            onSelectionChanged: function (e) {
                                user_name = e.component.option("value");
                                self.tableGrid.getDataSource().reload();
                            },
                            placeholder: "Chọn người dùng",
                            showClearButton: true,
                            valueExpr: "user_name",
                            width: 200
                        },
                        widget: "dxSelectBox"
                    }, {
                        location: "after",
                        options: {
                            displayFormat: "dd/MM/yyyy",
                            onValueChanged: function (e) {
                                timestamp = e.value ? e.value : null;
                                self.tableGrid.getDataSource().reload();
                            },
                            placeholder: "Chọn ngày",
                            showClearButton: true,
                            type: "date",
                            useMaskBehavior: true,
                            width: 150
                        },
                        widget: "dxDateBox"
                    }, {
                        location: "after",
                        options: {
                            hint: "Xuất dữ liệu",
                            icon: "icon icon-export-1",
                            onClick: () => {
                                OGUtils.postDownload("/api/user/access-log/export", {
                                    timestamp: timestamp,
                                    user_name: user_name
                                }, "application/json; charset=utf-8");
                            },
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
                    },]
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
export { QuanTriLogView };