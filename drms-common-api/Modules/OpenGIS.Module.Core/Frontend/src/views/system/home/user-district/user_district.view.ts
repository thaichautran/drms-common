import axios from "axios";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import dxTabPanel from "devextreme/ui/tab_panel";
import "devextreme/ui/tab_panel";
import dxPieChart from "devextreme/viz/pie_chart";
import "devextreme/viz/pie_chart";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { AreaService } from "../../../../../../../libs/core/services/area.service";

class UserDistricView implements IBaseComponent {
    private container: JQuery<HTMLElement>;
    districtStore: CustomStore;
    userDistrictChart: dxPieChart;
    userDistrictGrid: dxDataGrid;
    userDistrictView: dxTabPanel;
    userGroupStore: CustomStore;
    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.onInit();
    }
    private initUserDistrict(container): void {
        const self = this;
        this.userDistrictView = $("<div/>").appendTo(container).dxTabPanel({
            deferRendering: false,
            height: "100%",
            itemTemplate: (itemData, itemIndex, itemElement) => {
                if (itemData.id === "grid") {
                    self.initUserDistrictGrid(itemElement);
                } else if (itemData.id === "chart") {
                    self.initUserDistrictChart(itemElement);
                }
            },
            itemTitleTemplate: (itemData) => {
                return itemData.text;
            },
            items: [{
                id: "grid",
                text: "Danh sách"
            }, {
                id: "chart",
                text: "Biểu đồ"
            }],
            swipeEnabled: false
        }).dxTabPanel("instance");
    }

    private initUserDistrictChart(container): void {
        this.userDistrictChart = $("<div/>").css("padding", "10px").css("height", "100%").appendTo(container).dxPieChart({
            dataSource: new CustomStore({
                key: "id",
                load: (loadOptions) => {
                    const def = $.Deferred();
                    axios("/api/group/getDataChartUser?groupBy=DISTRICT").then(xhr => {
                        if (xhr.data.status === EnumStatus.OK) {
                            def.resolve(xhr.data.data);
                        } else {
                            def.resolve([]);
                        }
                    });
                    return def.promise();
                },
            }),
            series: [{
                argumentField: "key",
                label: {
                    connector: {
                        visible: true,
                        width: 1
                    },
                    customizeText(arg) {
                        return `${arg.valueText} (${arg.percentText})`;
                    },
                    visible: true,
                },
                name: "key",
                valueField: "count"
            }],
            title: {
                font: {
                    family: "'Reddit Sans', Open Sans, Helvetica Neue, Segoe UI, Helvetica, Verdana, sans-serif",
                    size: 20,
                    weight: 400
                },
                text: "Biểu đồ Thống kê tài khoản theo đơn vị hành chính"
            },
            tooltip: {
                contentTemplate: (info, container) => {
                    return $("<b />").text(`${info.valueText} người dùng thuộc ${info.argumentText}`).appendTo(container);
                },
                enabled: true,
                paddingLeftRight: 10,
                paddingTopBottom: 5,
            }
        }).dxPieChart("instance");
    }
    private initUserDistrictGrid(container): void {
        this.userDistrictGrid = $("<div />").appendTo(container).dxDataGrid({
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
                    const pageIndex = this.userDistrictGrid.pageIndex();
                    const pageSize = this.userDistrictGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                width: 50,
            }, {
                caption: "Trạng thái hoạt động",
                customizeText: (e) => {
                    return e.value ? "Đang bị khóa" : "Đang hoạt động";
                },
                dataField: "lockout_enabled",
            }, {
                caption: "Tên đăng nhập",
                dataField: "user_name",
            }, {
                caption: "Quận/huyện",
                customizeText: (e) => {
                    return e.value ? e.value : "Không xác định";
                },
                dataField: "user_info.district_code",
                groupIndex: 0,
                lookup: {
                    allowClearing: true,
                    dataSource: {
                        store: this.districtStore
                    },
                    displayExpr: "name_vn",
                    valueExpr: "area_id",
                },
            }, {
                caption: "Tên đầy đủ",
                dataField: "user_info.full_name",
            }, {
                caption: "Đơn vị công tác",
                dataField: "user_info.unit",
            }, {
                caption: "Địa chỉ",
                dataField: "user_info.address",
            }, {
                caption: "Email",
                dataField: "email",
            }, {
                caption: "Di động",
                dataField: "phone_number",
            }],
            dataSource: new CustomStore({
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
                    $.ajax({
                        error: () => {
                            deferred.reject("Data Loading Error");
                        },
                        success: (xhr) => {
                            deferred.resolve({
                                data: xhr.data,
                                totalCount: xhr.data.length
                            });
                        },
                        type: "get",
                        url: "/api/group/users",
                    });
                    return deferred.promise();
                },
            }),
            filterRow: {
                visible: false,
            },
            height: "100%",
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
                    location: "after",
                    options: {
                        hint: "Làm mới bảng",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            this.userDistrictGrid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                }, "searchPanel", "groupPanel"]
            },
            width: "100%"
        }).dxDataGrid("instance");
    }
    onInit(): void {
        this.userGroupStore = new CustomStore({
            key: "Id",
            load: () => {
                const def = $.Deferred();
                $.get("/api/group/list").done(xhr => {
                    if (xhr.status === EnumStatus.OK && xhr.data.length > 0) {
                        let dataSource = [{
                            Id: "Orphan",
                            Name: "Người dùng không thuộc nhóm nào"
                        }];
                        dataSource = dataSource.concat(xhr.data);
                        def.resolve(dataSource);
                    } else {
                        def.resolve([]);
                    }
                });
                return def.promise();
            },
            loadMode: "raw"
        });
        this.districtStore = new CustomStore({
            load: async () => {
                const province_code = "01";
                return await AreaService.districts(province_code);
            },
            loadMode: "raw"
        });
        this.initUserDistrict(this.container);
    }
}

export { UserDistricView };