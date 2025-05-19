import axios from "axios";
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

class UserAccessView implements IBaseComponent {
    private container: JQuery<HTMLElement>;
    districtStore: CustomStore;
    userAccessChart: dxPieChart;
    userAccessGrid: dxDataGrid;
    userAccessView: dxTabPanel;
    userGroupStore: CustomStore;
    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.onInit();
    }
    private initUserAccess(container): void {
        const self = this;
        this.userAccessView = $("<div/>").appendTo(container).dxTabPanel({
            deferRendering: false,
            height: "100%",
            itemTemplate: (itemData, itemIndex, itemElement) => {
                if (itemData.id === "grid") {
                    self.initUserAccessGrid(itemElement);
                } else if (itemData.id === "chart") {
                    self.initUserAccessChart(itemElement);
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
        this.userAccessView.element().find(".dx-multiview-wrapper").css("border", "none");
    }

    private initUserAccessChart(container): void {
        this.userAccessChart = $("<div />").css("padding", "10px").css("height", "100%").appendTo(container).dxPieChart({
            dataSource: new CustomStore({
                key: "id",
                load: (loadOptions) => {
                    const def = $.Deferred();
                    axios({
                        method: "post",
                        url: "/api/user-audit/countGroupByUser",
                    }).then(xhr => {
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
                text: "Biểu đồ Thống kê số lượt truy cập theo người dùng"
            },
            tooltip: {
                contentTemplate: (info, container) => {
                    return $("<b />").text(`${info.valueText} lượt truy cập thuộc ${info.argumentText}`).appendTo(container);
                },
                enabled: true,
                paddingLeftRight: 10,
                paddingTopBottom: 5,
            }
        }).dxPieChart("instance");
    }
    private initUserAccessGrid(container): void {
        this.userAccessGrid = $("<div />").appendTo(container).dxDataGrid({
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
                    const pageIndex = this.userAccessGrid.pageIndex();
                    const pageSize = this.userAccessGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                visible: true,
                width: 50,
            }, {
                caption: "Tên người dùng",
                dataField: "key",
            }, {
                caption: "Số lần truy cập",
                dataField: "count",
            }],
            dataSource: new CustomStore({
                key: "id",
                load: (loadOptions) => {
                    const def = $.Deferred();
                    axios({
                        method: "post",
                        url: "/api/user-audit/countGroupByUser",
                    }).then(xhr => {
                        if (xhr.data.status === EnumStatus.OK) {
                            def.resolve({
                                data: xhr.data.data,
                                totalCount: xhr.data.data.length
                            });
                        } else {
                            def.resolve({
                                data: [],
                                totalCount: 0
                            });
                        }
                    });
                    return def.promise();
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
                            this.userAccessGrid.getDataSource().reload();
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
        this.initUserAccess(this.container);
    }
}

export { UserAccessView };