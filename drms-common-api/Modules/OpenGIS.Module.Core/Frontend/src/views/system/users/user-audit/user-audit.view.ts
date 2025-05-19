import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import moment from "moment";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
class UserAuditView implements IBaseComponent {
    container: JQuery<HTMLElement>;
    grid: dxDataGrid;
    constructor(container: JQuery<HTMLElement>) {
        this.container = container; 
        this.initLayout();
    }
    private initLayout(): void {
        const self = this;
        let audit_event = 0;
        let user_id = "";
        let start_date: string = moment(new Date()).format("YYYY-MM-DD");
        let end_date: string = moment(new Date()).format("YYYY-MM-DD");

        this.grid = $("<div />").appendTo(this.container).dxDataGrid({
            allowColumnResizing: true,
            columnAutoWidth: true,
            columns: [
                {
                    alignment: "center",
                    caption: "STT",
                    cellTemplate: (container, options) => {
                        const pageIndex = this.grid.pageIndex();
                        const pageSize = this.grid.pageSize();
                        container.append(((pageSize * pageIndex) + options.row.rowIndex + 1).toString());
                    },
                    dataField: "index",
                    width: 50,
                },
                {
                    caption: "Tài khoản",
                    cellTemplate: (container, options) => {
                        if (options.value) {
                            container.html(options.value.user_name);
                        }
                    },
                    dataField: "user"
                },
                {
                    caption: "Thao tác",
                    dataField: "event_name",
                },
                {
                    caption: "Địa chỉ IP",
                    dataField: "ip_address",
                },
                {
                    alignment: "center",
                    caption: "Thời gian",
                    dataField: "timestamp",
                    dataType: "date",
                    format: "dd/MM/yyyy HH:mm:ss",
                    width: 250,
                },
            ],
            dataSource: {
                store: new CustomStore({
                    key: "user_audit_id",
                    load: (loadOptions) => {
                        const deferred = $.Deferred(),
                            args: { [key: string]: number | string } = {};
                        if (loadOptions.sort) {
                            args.orderby = loadOptions.sort[0].selector;
                            if (loadOptions.sort[0].desc)
                                args.orderby += " desc";
                        }
                        args.user_id = user_id;
                        args.audit_event = audit_event;
                        args.start_date = start_date;
                        args.end_date = end_date;
                        args.skip = loadOptions.skip ? loadOptions.skip : 0;
                        args.take = loadOptions.take ? loadOptions.take : 50;
                        
                        $.ajax({
                            data: args,
                            error: () => {
                                deferred.reject("Data Loading Error");
                            },
                            success: (xhr) => {
                                if (xhr && xhr.status === EnumStatus.OK) {
                                    deferred.resolve({
                                        data: xhr.data, 
                                        totalCount: xhr.recordsTotal
                                    });
                                } else {
                                    deferred.resolve({
                                        data: [], 
                                        totalCount: 0
                                    });
                                }
                            },
                            type: "post",
                            url: "/api/user-audit/list",
                        });
                        return deferred.promise();
                    }
                }),
            },
            errorRowEnabled: false,
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onContentReady: (e) => {
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            pager: {
                allowedPageSizes: [50, 100, 150],
                infoText: "{2} bản ghi",
                showInfo: true,
                showNavigationButtons: true,
                showPageSizeSelector: true,
                visible: true
            },
            paging: {
                enabled: true,
                pageSize: 50
            },
            remoteOperations: true,
            scrolling: {
                showScrollbar: "always"
            },
            selection: {
                mode: "single"
            },
            showBorders: true,
            showRowLines: true,
            toolbar: {
                items: [{
                    location: "before",
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
                                            if(xhr.status === EnumStatus.OK) {
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
                            user_id = e.component.option("value");
                            self.grid.getDataSource().reload();
                        },
                        placeholder: "Chọn người dùng",
                        showClearButton: true,
                        valueExpr: "id",
                        width: 200
                    },
                    widget: "dxSelectBox"
                }, {
                    location: "before",
                    options: {
                        dataSource: [{
                            "id": 1,
                            "value": "Đăng nhập"
                        }, {
                            "id": 2,
                            "value": "Đăng nhập thất bại"
                        }, {
                            "id": 3,
                            "value": "Đăng xuất"
                        },],
                        displayExpr: "value",
                        onSelectionChanged: function (e) {
                            audit_event = e.component.option("value");
                            self.grid.getDataSource().reload();
                        },
                        placeholder: "Chọn thao tác",
                        showClearButton: true,
                        valueExpr: "id",
                        width: 200
                    },
                    widget: "dxSelectBox"
                }, {
                    location: "before",
                    options: {
                        displayFormat: "dd/MM/yyyy",
                        onValueChanged: function (e) {
                            start_date = moment(e.value).format("YYYY-MM-DD");
                            self.grid.getDataSource().reload();
                        },
                        placeholder: "Từ ngày",
                        showClearButton: true,
                        type: "date",
                        useMaskBehavior: true,
                        width: 150
                    },
                    widget: "dxDateBox"
                }, {
                    location: "before",
                    options: {
                        displayFormat: "dd/MM/yyyy",
                        onValueChanged: function (e) {
                            end_date = moment(e.value).format("YYYY-MM-DD");
                            self.grid.getDataSource().reload();
                        },
                        placeholder: "Đến ngày",
                        showClearButton: true,
                        type: "date",
                        useMaskBehavior: true,
                        width: 150
                    },
                    widget: "dxDateBox"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới",
                        icon: "refresh",
                        onClick: (e) => {
                            self.grid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                }]
            },
            width: "100%"
        }).dxDataGrid("instance");
    }
    onInit(): void {
        
    }
}

export { UserAuditView };