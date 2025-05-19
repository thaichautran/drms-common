import { OGMap } from "@opengis/map";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";

import { EnumDanhMuc, EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { CategoryService } from "../../services/category.service";
import { FeatureService } from "../../services/feature.service";
import { IMapComponent } from "../base-component.abstract";
import { IdentifyComponent } from "../identify/identify.component";
import "./feature-maintenance.component.scss";

interface FeatureMaintenanceOptions {
    oGMap: OGMap;
}

class FeatureMaintenanceComponent implements IMapComponent {
    congCuKiemTraStore: CustomStore;
    dataGrid: dxDataGrid;
    featureID: number | string;
    identify: IdentifyComponent;
    loaiKiemTra: string;
    oGMap: OGMap;
    phuongThucKiemTraStore: CustomStore;
    popup: dxPopup;
    tableID: number;
    constructor(options: FeatureMaintenanceOptions) {
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
        this.phuongThucKiemTraStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                CategoryService.list(EnumDanhMuc.PHUONGTHUCKIEMTRA).then(result => {
                    if (result.status === EnumStatus.OK) {
                        deferred.resolve(result.data);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.congCuKiemTraStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                CategoryService.list(EnumDanhMuc.CONGCUKIEMTRA).then(result => {
                    if (result.status === EnumStatus.OK) {
                        deferred.resolve(result.data);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
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
                        caption: "Phương thức kiểm tra",
                        dataField: "phuongthuckiemtraid",
                        lookup: {
                            dataSource: this.phuongThucKiemTraStore,
                            displayExpr: "mo_ta",
                            valueExpr: "id"
                        },
                        width: 200
                    }, {
                        caption: "Công cụ kiếm tra",
                        dataField: "congcukiemtraid",
                        lookup: {
                            dataSource: this.congCuKiemTraStore,
                            displayExpr: "mo_ta",
                            valueExpr: "id"
                        },
                        width: 200,
                    }, {
                        caption: "Thời tiết",
                        dataField: "thoitiet",
                        width: 200,
                    }, {
                        caption: "Thiết bị",
                        dataField: "thietbi",
                        width: 200,
                    }, {
                        alignment: "right",
                        allowResizing: true,
                        allowSorting: true,
                        calculateCellValue: (data) => {
                            return data["sonhancong"] ? OGUtils.formatNumber(data["sonhancong"], 0, 0) : "";
                        },
                        caption: "Số nhân công",
                        dataField: "sonhancong",
                        width: 200,
                    }, {
                        caption: "Vị trí",
                        dataField: "vitri",
                        width: 200,
                    }, {
                        caption: "Địa điểm",
                        dataField: "diadiem",
                        width: 200,
                    }, {
                        caption: "Tên công trình",
                        dataField: "tencongtrinh",
                        width: 200,
                    }, {
                        alignment: "right",
                        allowResizing: true,
                        allowSorting: true,
                        calculateCellValue: (data) => {
                            return data["goithauso"] || "";
                        },
                        caption: "Gói thầu số",
                        dataField: "goithauso",
                        width: 200,
                    }, {
                        caption: "Nhà thầu",
                        dataField: "nhathau",
                        width: 200,
                    }, {
                        caption: "Đơn vị thi công",
                        dataField: "donvithicong",
                        width: 200,
                    }, {
                        alignment: "center",
                        allowResizing: true,
                        allowSorting: true,
                        caption: "Ngảy thực hiện",
                        dataField: "ngaythuchien",
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
                        caption: "Kiểm tra công tác an toàn lao động",
                        dataField: "kiemtracongtacatld",
                        width: 200,
                    }, {
                        caption: "Kiểm tra công tác an toàn giao thông",
                        dataField: "kiemtracongtacatgt",
                        width: 200,
                    }, {
                        caption: "Kiểm tra công tác vệ sinh môi trường khu vực thi công",
                        dataField: "kiemtractvsmtkhuvuctc",
                        width: 200,
                    },],
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
                                    FeatureService.getMaintenances(args).then(result => {
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
                                    //     tableID: self.tableID
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
            title: "Danh sách công việc kiểm tra, bảo trì công trình",
            width: 700,
        }).dxPopup("instance");
    }

    public show(): void {
        this.popup.show();
    }
}

export { FeatureMaintenanceComponent };