import { OGMap } from "@opengis/map";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";

import { FeatureService } from "../../services/feature.service";
import { IMapComponent } from "../base-component.abstract";
import { IdentifyComponent } from "../identify/identify.component";
import "./feature-maintenance-plan.component.scss";

interface FeatureMaintenancePlanOptions {
    oGMap: OGMap;
}

class FeatureMaintenancePlanComponent implements IMapComponent {
    dataGrid: dxDataGrid;
    featureID: number | string;
    identify: IdentifyComponent;
    loaiKiemTra: string;
    oGMap: OGMap;
    popup: dxPopup;
    tableID: number;
    constructor(options: FeatureMaintenancePlanOptions) {
        this.oGMap = options.oGMap;
        this.onInit();
    }
    public for(featureId: number | string, tableId: number, loaiKiemTra: string): this {
        this.featureID = featureId;
        this.tableID = tableId;
        this.loaiKiemTra = loaiKiemTra;
        this.dataGrid.getDataSource().reload();
        return this;
    }

    public hide(): void {
        this.popup.hide();
    }

    onInit(): void {
        const self = this;
        this.popup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                
                this.dataGrid = $("<div />").appendTo(container).dxDataGrid({
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
                            const pageIndex = this.dataGrid.pageIndex();
                            const pageSize = this.dataGrid.pageSize();
                            container.append(`${pageSize * pageIndex + options.row.rowIndex + 1}`);
                        },
                        dataField: "index",
                        width: 50
                    }, {
                        caption: "Tên kế hoạch",
                        dataField: "tenkehoach",
                        width: 200
                    }, {
                        caption: "Nội dung thực hiện",
                        dataField: "noidung",
                        width: 300,
                    }, {
                        caption: "Địa điểm thực hiện",
                        dataField: "diadiemthuchien",
                        width: 200,
                    }, {
                        caption: "Người lập kế hoạch",
                        dataField: "nguoilapkehoach",
                        width: 200,
                    }, {
                        alignment: "center",
                        allowResizing: true,
                        allowSorting: true,
                        caption: "Ngảy bắt đầu",
                        dataField: "ngaybatdau",
                        dataType: "date",
                        filterOperations: ["="],
                        format: "dd/MM/yyyy",
                        width: 200
                    }, {
                        alignment: "center",
                        allowResizing: true,
                        allowSorting: true,
                        caption: "Ngảy kết thúc",
                        dataField: "ngayketthuc",
                        dataType: "date",
                        filterOperations: ["="],
                        format: "dd/MM/yyyy",
                        width: 200
                    }, {
                        caption: "Ghi chú",
                        dataField: "ghichu",
                        width: 200,
                    }, ],
                    dataSource: new DataSource({
                        store: new CustomStore({
                            key: "id",
                            load: (loadOptions) => {
                                const deferred = $.Deferred(),
                                    args = {};
                                if (loadOptions.sort) {
                                    Object.assign(args, {
                                        order_by: loadOptions.sort[0].selector
                                    });
                                    if (loadOptions.sort[0].desc) {
                                        Object.assign(args, {
                                            order_by: loadOptions.sort[0].selector + " desc"
                                        });
                                    }
                                }
                                if (self.tableID && self.featureID) {
                                    Object.assign(args, {
                                        feature_id: self.featureID,
                                        loaikiemtra: self.loaiKiemTra,
                                        skip: loadOptions.skip ? loadOptions.skip : 0,
                                        table_id: self.tableID,
                                        take: loadOptions.take ? loadOptions.take : 50
                                    });
                                    FeatureService.getMaintenancePlans(args).then(result => {
                                        if(result) {
                                            deferred.resolve({
                                                data: result.data,
                                                totalCount: result.recordsTotal
                                            });
                                        } else {
                                            deferred.resolve({
                                                data: [],
                                                totalCount: 0
                                            });
                                        }
                                    });
                                } else {
                                    deferred.resolve({
                                        data: [], 
                                        totalCount: 0
                                    });
                                }
                                return deferred.promise();
                            }
                        })
                    }),
                    errorRowEnabled: false,
                    grouping: {
                        autoExpandAll: true
                    },
                    height: "100%",
                    loadPanel: {
                        text: "Đang tải dữ liệu"
                    },
                    noDataText: "Không có dữ liệu",
                    onRowClick: (e) => {
                    },
                    pager: {
                        allowedPageSizes: [50, 100, 200],
                        showInfo: true,
                        showNavigationButtons: true,
                        showPageSizeSelector: true,
                        visible: true,
                    },
                    paging: {
                        enabled: true,
                        pageSize: 50
                    },
                    remoteOperations: {
                        groupPaging: false
                    },
                    scrolling: {
                        showScrollbar: "always"
                    },
                    selection: {
                        mode: "single",
                        showCheckBoxesMode: "none"
                    },
                    showBorders: true,
                    showColumnHeaders: true,
                    summary: {
                        groupItems: [{
                            column: "id",
                            summaryType: "count",
                        }],
                    },
                    toolbar: {
                        items: [{
                            locateInMenu: "auto",
                            location: "before",
                            options: {
                                elementAttr: {
                                    class: "btn-export-excel dx-button-info"
                                },
                                icon: "icon icon-receive-square",
                                onClick() {
                                    // OGUtils.postDownload("/api/feature/exportRelationship", {
                                    //     featureId: self.featureID,
                                    //     tableId: self.tableID
                                    // });
                                },
                                text: "Kết xuất ra Excel",
                                visible: false
                            },
                            widget: "dxButton",
                        }, {
                            location: "after",
                            options: {
                                hint: "Làm mới",
                                icon: "icon icon-refresh",
                                onClick: () => {
                                    this.dataGrid.refresh();
                                },
                            },
                            widget: "dxButton"
                        }]
                    }
                }).dxDataGrid("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: 400,
            hideOnOutsideClick: false,
            onOptionChanged: () => {
            },
            resizeEnabled: true,
            shading: false,
            showTitle: true,
            title: "Danh sách kế hoạch kiểm tra công trình",
            width: 700,
        }).dxPopup("instance");
    }

    public show(): void {
        this.popup.show();
    }
}

export { FeatureMaintenancePlanComponent };