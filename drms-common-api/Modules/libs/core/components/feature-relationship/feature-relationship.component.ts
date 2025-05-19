import { OGMap } from "@opengis/map";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid, { Column, dxDataGridColumn } from "devextreme/ui/data_grid";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import dxTabPanel from "devextreme/ui/tab_panel";
import dxChart from "devextreme/viz/chart";
import "devextreme/viz/chart";
import { data } from "jquery";

import { EnumDataType, EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { OGLayerModel } from "../../models/layer.model";
import { OGTableColumnModel, OGTableModel } from "../../models/table.model";
import { AreaService } from "../../services/area.service";
import { FeatureService } from "../../services/feature.service";
import { TableColumnService, TableService } from "../../services/table.service";
import { IMapComponent } from "../base-component.abstract";
import { IdentifyComponent } from "../identify/identify.component";
import "./feature-relationship.component.scss";

interface FeatureRelationshipOptions {
    identify: IdentifyComponent;
    oGMap: OGMap;
}
class FeatureRelationshipComponent implements IMapComponent {
    arguments: object;
    chart: dxChart;
    dataGrid: dxDataGrid;
    featureID: number | string;
    identify: IdentifyComponent;
    identityColumn: OGTableColumnModel;
    oGISTable: OGTableModel;
    oGMap: OGMap;
    popup: dxPopup;
    relationTable: OGTableModel;
    tabPanel: dxTabPanel;
    tableId: number;
    constructor(options: FeatureRelationshipOptions) {
        this.oGMap = options.oGMap;
        this.identify = options.identify;
        this.onInit();
    }
    private buildGridColumns(tableColumns: OGTableColumnModel[]): void {
        const columnIndex: Column[] = [
            {
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.dataGrid.pageIndex();
                    const pageSize = this.dataGrid.pageSize();
                    container.append(((pageSize * pageIndex) + options.rowIndex + 1).toString());
                },
                dataField: "index",
                width: 50,
            }
        ];
        const columnsGrid: Column[] = tableColumns.map(col => {
            if (col.is_identity) {
                this.identityColumn = col;
            }
            if (col.visible && col.column_name.includes("geom") === false) {
                if (col.lookup_table_id) {
                    return {
                        alignment: "left",
                        allowResizing: true,
                        allowSorting: true,
                        caption: col.name_vn,
                        dataField: col.column_name,
                        filterOperations: ["contains"],
                        lookup: {
                            dataSource: {
                                key: "id",
                                store: new CustomStore({
                                    load: () => {
                                        return TableService.shortData({ table_id: col.lookup_table_id });
                                    }
                                })
                            },
                            displayExpr: "mo_ta",
                            valueExpr: "id",
                        },
                        width: 200
                    };
                } else {
                    if (col.column_name.includes("toado")) {
                        return {
                            alignment: "right",
                            allowResizing: true,
                            allowSorting: true,
                            calculateCellValue: (data) => {
                                return data[col.column_name] ? OGUtils.formatNumber(data[col.column_name], 0, 4) : "";
                            },
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["="],
                            width: 200
                        };
                    } else if (col.data_type === EnumDataType.date || col.data_type === EnumDataType.dateTime || col.data_type === EnumDataType.dateTimeTZ) {
                        return {
                            alignment: "center",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            dataType: (col.data_type === EnumDataType.date) ? "date" : "datetime",
                            filterOperations: ["="],
                            format: (col.data_type === EnumDataType.date) ? "dd/MM/yyyy" : "dd/MM/yyyy HH:mm:ss",
                            width: 200
                        };
                    } else if (col.column_name === "commune_code") {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["contains"],
                            lookup: {
                                dataSource: {
                                    key: "area_id",
                                    store: new CustomStore({
                                        load: () => {
                                            return new Promise((resolve) => {
                                                let district_code = "";
                                                if (this.arguments && this.arguments["district_code"]) {
                                                    district_code = this.arguments["district_code"].toString();
                                                }
                                                if (district_code) {
                                                    AreaService.communes(district_code).then(result => {
                                                        if (result) {
                                                            resolve(result);
                                                        } else {
                                                            resolve([]);
                                                        }
                                                    });
                                                } else {
                                                    resolve([]);
                                                }
                                            });
                                        }
                                    })
                                },
                                displayExpr: "name_vn",
                                valueExpr: "area_id",
                            },
                            width: 200
                        };
                    } else if (col.column_name === "district_code") {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["contains"],
                            lookup: {
                                dataSource: {
                                    key: "area_id",
                                    store: new CustomStore({
                                        load: async () => {
                                            return await AreaService.districts();
                                        }
                                    })
                                },
                                displayExpr: "name_vn",
                                valueExpr: "area_id",
                            },
                            width: 200
                        };
                    } else if (col.column_name === "province_code") {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["contains"],
                            lookup: {
                                dataSource: {
                                    key: "area_id",
                                    store: new CustomStore({
                                        load: async () => {
                                            return await AreaService.provinces();
                                        }
                                    })
                                },
                                displayExpr: "name_vn",
                                valueExpr: "area_id",
                            },
                            width: 200
                        };
                    } else if (col.data_type === EnumDataType.smallint || col.data_type === EnumDataType.integer || col.data_type === EnumDataType.double) {
                        return {
                            alignment: "right",
                            allowResizing: true,
                            allowSorting: true,
                            calculateCellValue: (data) => {
                                return data[col.column_name] ? OGUtils.formatNumber(data[col.column_name], 0, 3) : "";
                            },
                            caption: col.name_vn,
                            dataField: col.column_name,
                            dataType: "number",
                            filterOperations: ["="],
                            width: 200
                        };
                    } else {
                        return {
                            alignment: "left",
                            allowResizing: true,
                            allowSorting: true,
                            caption: col.name_vn,
                            dataField: col.column_name,
                            filterOperations: ["contains"],
                            lookup: {
                                dataSource: {
                                    pageSize: 25,
                                    paginate: true,
                                    store: new CustomStore({
                                        load: (options) => {
                                            return new Promise((resolve) => {
                                                TableColumnService.listDistinctValues(col, options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                    resolve({
                                                        data: data.data,
                                                        totalCount: data.recordsTotal
                                                    });
                                                });
                                            });
                                        }
                                    })
                                },
                            },
                            width: 200
                        };
                    }
                }
            }
        });
        const columns = columnIndex.concat(columnsGrid);
        this.dataGrid.beginUpdate();
        this.dataGrid.option("columns", columns);
        this.dataGrid.endUpdate();
    }

    private initChart(container): void {
        const self = this;
        this.chart = $("<div />").appendTo(container).dxChart({
            argumentAxis: {
                discreteAxisDivisionMode: "crossLabels",
                grid: {
                    visible: true,
                },
                valueMarginsEnabled: false,
            },
            commonSeriesSettings: {
                argumentField: "thuytri",
                point: {
                    hoverMode: "allArgumentPoints",
                },
                type: "spline",
            },
            crosshair: {
                color: "#949494",
                dashStyle: "dot",
                enabled: true,
                label: {
                    backgroundColor: "#949494",
                    font: {
                        color: "#fff",
                        size: 12,
                    },
                    visible: true,
                },
                width: 3,
            },
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
                        if (self.tableId && self.featureID && self.relationTable) {
                            Object.assign(args, {
                                featureId: self.featureID,
                                relationTableId: self.relationTable.id,
                                skip: loadOptions.skip ? loadOptions.skip : 0,
                                tableId: self.tableId,
                                take: loadOptions.take ? loadOptions.take : 9999
                            });
                            $.ajax({
                                contentType: "application/json",
                                data: JSON.stringify(args),
                                dataType: "json",
                                error: () => {
                                    deferred.reject("Data Loading Error");
                                },
                                success: (result) => {
                                    if (result.status == "OK") {
                                        deferred.resolve({
                                            data: result.data.data,
                                            totalCount: result.data.totalCount
                                        });
                                    } else {
                                        deferred.resolve({
                                            data: [],
                                            totalCount: 0
                                        });
                                        self.buildGridColumns([]);
                                    }
                                },
                                type: "post",
                                url: "/api/feature/relationships",
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
            export: {
                enabled: true,
            },
            legend: {
                // equalColumnWidth: true,
                horizontalAlignment: "center",
                itemTextPosition: "bottom",
                verticalAlignment: "bottom",
            },
            series: [
                // { name: "Thủy trí", valueField: "thuytri" },
                { name: "Dung tích hồ (m3)", valueField: "dungtichhieudung" },
            ],
            title: {
                text: "Biểu đồ dung tích hồ chứa theo thủy trí",
            },
            tooltip: {
                enabled: true,
            },
            // valueAxis: [{
            //     grid: {
            //         visible: true,
            //     },
            //     name: "thuytri",
            //     position: "left",
            //     title: {
            //         text: "Thủy trí (m)",
            //     },
            // }, {
            //     grid: {
            //         visible: true,
            //     },
            //     name: "dungtichhieudung",
            //     position: "right",
            //     title: {
            //         text: "Dung tích hồ (m3)",
            //     },
            // }],
        }).dxChart("instance");
    }
    private initFeatureRelationGrid(container): void {
        const self = this;
        this.dataGrid = $("<div />").appendTo(container).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnChooser: {
                enabled: true,
                mode: "select",
            },
            columns: [],
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
                        if (self.tableId && self.featureID && self.relationTable) {
                            Object.assign(args, {
                                featureId: self.featureID,
                                relationTableId: self.relationTable.id,
                                skip: loadOptions.skip ? loadOptions.skip : 0,
                                tableId: self.tableId,
                                take: loadOptions.take ? loadOptions.take : 50
                            });
                            $.ajax({
                                contentType: "application/json",
                                data: JSON.stringify(args),
                                dataType: "json",
                                error: () => {
                                    deferred.reject("Data Loading Error");
                                },
                                success: (result) => {
                                    if (result.status == "OK") {
                                        const fields = result.data.selectedFields;
                                        deferred.resolve({
                                            data: result.data.data,
                                            totalCount: result.data.totalCount
                                        });
                                        self.oGISTable = result.data.tableInfo;
                                        self.buildGridColumns(fields);
                                    } else {
                                        deferred.resolve({
                                            data: [],
                                            totalCount: 0
                                        });
                                        self.buildGridColumns([]);
                                    }
                                },
                                type: "post",
                                url: "/api/feature/relationships",
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
                autoExpandAll: false
            },
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onRowClick: (e) => {
                if (e.rowType === "data") {
                    if (self.oGISTable && self.identityColumn) {
                        self.identify.identifyRowTableFeature(e.data[self.identityColumn.column_name], self.oGISTable.id, self.oGISTable.name_vn, false);
                    }
                }
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
                paging: true
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
            toolbar: {
                items: [{
                    location: "after",
                    options: {
                        hint: "Làm mới",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            this.dataGrid.getDataSource().reload();
                        },
                    },
                    widget: "dxButton"
                }]
            }
        }).dxDataGrid("instance");
    }

    private initTabPanel(container): void {
        const self = this;
        this.tabPanel = $("<div />").appendTo(container).dxTabPanel({
            animationEnabled: false,
            deferRendering: false,
            height: "100%",
            itemTemplate: (itemData, itemIndex, itemElement) => {
                if (itemData.id === "Table") {
                    self.initFeatureRelationGrid(itemElement);
                } else if (itemData.id == "Chart") {
                    self.initChart(itemElement);
                }
            },
            itemTitleTemplate: (itemData) => {
                return itemData.text;
            },
            items: [{
                id: "Table",
                text: "Bảng thông tin"
            }, {
                id: "Chart",
                text: "Biểu đồ"
            }],
            loop: false,
            selectedIndex: 0,
            swipeEnabled: false,
        }).dxTabPanel("instance");
    }
    public for(featureId: number | string, ogTableId: number, relationTable?: OGTableModel): this {
        this.featureID = featureId;
        this.tableId = ogTableId;
        this.relationTable = relationTable;
        // const items = [];
        // if (relationTable.table_name === "tn_dungtichhochuatheothuytri") {
        //     items = [{
        //         id: "Table",
        //         text: "Bảng thông tin"
        //     }, {
        //         id: "Chart",
        //         text: "Biểu đồ"
        //     }];
        // } else {
        //     items = [{
        //         id: "Table",
        //         text: "Bảng thông tin"
        //     }];
        // }
        // this.tabPanel.option("items", items);
        this.dataGrid.getDataSource().reload();
        // this.chart.getDataSource().reload();
        this.popup.option("title", "Thông tin " + relationTable.name_vn);
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

                this.initFeatureRelationGrid(container);
            },
            deferRendering: false,
            dragEnabled: true,
            height: 500,
            hideOnOutsideClick: false,
            maxWidth: 900,
            onOptionChanged: () => {
            },
            resizeEnabled: false,
            shading: false,
            showTitle: true,
            title: "Thông tin",
            width: "auto",
        }).dxPopup("instance");
    }

    public show(): void {
        this.popup.show();
    }
}

export { FeatureRelationshipComponent };