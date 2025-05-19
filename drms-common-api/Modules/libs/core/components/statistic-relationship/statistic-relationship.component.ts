import { OGMap } from "@opengis/map";
import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxContextMenu from "devextreme/ui/context_menu";
import "devextreme/ui/data_grid";
import dxDataGrid, { dxDataGridColumn } from "devextreme/ui/data_grid";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/tree_list";
import dxTreeList from "devextreme/ui/tree_list";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { OGLayerModel } from "../../models/layer.model";
import { FeatureService } from "../../services/feature.service";
import { IMapComponent } from "../base-component.abstract";
import { IdentifyComponent } from "../identify/identify.component";
import "./statistic-relationship.component.scss";

interface StatisticRelationshipOptions {
    identify: IdentifyComponent;
    oGMap: OGMap;
}

interface OGLevelOptions {
    featureId: number | string;
    layerId?: number;
    layerInfo?: OGLayerModel;
    name?: string;
    tableId?: number;
    tableName?: string;
}

const TableGroupByPhanLoai = ["tn_tuyen"];
class StatisticRelationshipComponent implements IMapComponent {
    arguments: object;
    contextMenu: dxContextMenu;
    dataGrid: dxDataGrid;
    featureID: (number | string)[];
    featureRelationGrid: dxDataGrid;
    featureRelationPopup: dxPopup;
    featureRelationTree: dxTreeList;
    identify: IdentifyComponent;
    layerID: number;
    levels: OGLevelOptions[];
    oGMap: OGMap;
    popup: dxPopup;
    tableId: number;
    constructor(options: StatisticRelationshipOptions) {
        this.oGMap = options.oGMap;
        this.identify = options.identify;
        this.levels = [];
        this.onInit();
    }
    private buildBreadcrumb(): void {
        let text = "";
        if (this.levels && this.levels.length > 0) {
            this.levels.forEach((item, idx) => {
                if (item["name"]) {
                    text += "<li>" + item["name"] + "</li>";
                }
            });
        }
        $("#backButton").dxButton("instance").option("visible", this.levels.length > 1);
        $("#breadCrumb").html(text);
    }

    private refreshColumn(levels: OGLevelOptions[]): void {
        const table_name = levels[levels.length - 1].tableName;
        const columns: dxDataGridColumn[] = [{
            caption: "Tên lớp",
            dataField: "layer_name",
            groupIndex: 0,
        }, {
            alignment: "center",
            caption: "STT",
            cellTemplate: (container, options) => {
                const pageIndex = this.dataGrid.pageIndex();
                const pageSize = this.dataGrid.pageSize();
                container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
            },
            dataField: "index",
            width: 50
        }, {
            caption: "Tên đối tượng",
            dataField: "name"
        },];
        if (TableGroupByPhanLoai.includes(table_name)) {
            columns.push({
                caption: "Phân loại",
                dataField: "phanloai",
                groupIndex: 1,
            });
        }
        columns.push({
            alignment: "center",
            caption: "Thao tác",
            cellTemplate: (container, options) => {
                $("<div>").appendTo(container).dxToolbar({
                    items: [{
                        location: "center",
                        options: {
                            hint: "Phóng tới đối tượng",
                            icon: "icon icon-search-zoom-in",
                            onClick: (e) => {
                                const data = options.data;
                                if (data) {
                                    FeatureService.queryFeature(data.layer_id, 0, data.id).then(response => {
                                        const geom = response.attributes.geom;
                                        if (geom) {
                                            this.oGMap.fitBounds(geom.toString());
                                        }
                                    });
                                }
                            },
                            type: "success"
                        },
                        widget: "dxButton"
                    }, {
                        location: "center",
                        options: {
                            hint: "Xem thông tin đối tượng",
                            icon: "icon icon-info-circle",
                            onClick: (e) => {
                                const data = options.data;
                                if (data) {
                                    const layerInfo: OGLayerModel = {
                                        id: data.layer_id,
                                        name_vn: data.layer_name
                                    };
                                    this.identify.identify(layerInfo, data.id);
                                }
                            },
                            type: "default"
                        },
                        widget: "dxButton"
                    }]
                });
            },
            dataField: "id",
            width: 120
        });
        this.dataGrid.beginUpdate();
        this.dataGrid.option("columns", columns);
        this.dataGrid.endUpdate();
    }

    public for(featureId: (number | string)[], tableId: number, tableName?: string, name?: string): this {
        this.featureID = featureId;
        this.tableId = tableId;
        this.featureRelationTree.getDataSource().reload();
        return this;
    }
    public hide(): void {
        this.popup.hide();
    }

    onInit(): void {
        const self = this;
        this.popup = $("<div/>").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                $(container).css("padding", "0");
                this.featureRelationTree = $("<div />").addClass("relation-feature-tree").appendTo(container).dxTreeList({
                    columnAutoWidth: false,
                    columns: [{
                        alignment: "left",
                        caption: "Nội dung",
                        cellTemplate: (cellElement, cellInfo) => {
                            if (cellInfo.data) {
                                if (cellInfo.data.type === "@layer") {
                                    cellElement.html(`<span><i class="icon icon-layer mr-2"></i>${cellInfo.value}</span>`);
                                } else if (cellInfo.data.type === "@table") {
                                    cellElement.html(`<span><i class="icon icon-grid-1 mr-2"></i>${cellInfo.value}</span>`);
                                } else if (cellInfo.data.type === "@feature") {
                                    cellElement.html(`<span><i class="icon icon-location mr-2"></i>${cellInfo.value}</span>`);
                                } else if (cellInfo.data.type === "@classify") {
                                    cellElement.html(`<span><i class="icon icon-hierarchy mr-2"></i>${cellInfo.value}</span>`);
                                } else {
                                    cellElement.html(cellInfo.value);
                                }
                            } else {
                                cellElement.html(cellInfo.value);
                            }
                        },
                        dataField: "text",
                    }, {
                        alignment: "center",
                        caption: "Đơn vị",
                        dataField: "unit",
                        width: 100
                    }, {
                        caption: "Khối lượng",
                        cellTemplate: (cellElement, cellInfo) => {
                            $(cellElement).html(cellInfo.value ? OGUtils.formatNumber(cellInfo.value, 0, 3) : "-");
                        },
                        dataField: "countTotal",
                        width: 120
                    }],
                    dataSource: new DataSource({
                        key: "id",
                        store: new CustomStore({
                            load: (loadOptions) => {
                                const deferred = $.Deferred();
                                if (this.tableId) {
                                    axios.post("/api/feature/get-feature-relation-trees", {
                                        feature_id: this.featureID ? this.featureID : [],
                                        table_id: this.tableId
                                    }).then(xhr => {
                                        if (xhr.data && xhr.data.status === EnumStatus.OK) {
                                            deferred.resolve(xhr.data.data);
                                        } else {
                                            deferred.resolve([]);
                                        }
                                    });
                                } else {
                                    deferred.resolve([]);
                                }
                                return deferred.promise();
                            },
                            loadMode: "processed"
                        })
                    }),
                    dataStructure: "tree",
                    height: "100%",
                    itemsExpr: "items",
                    keyExpr: "id",
                    noDataText: "Không có dữ liệu",
                    onSelectionChanged: (e) => {
                        const selectedRows = e.selectedRowsData;
                        if (selectedRows && selectedRows.length > 0) {
                            const selectedRow = selectedRows[0];
                            if (selectedRow.where) {
                                const params = {
                                    foreignValue: selectedRow.foreignValue,
                                    where: selectedRow.where
                                };
                                this.arguments = {
                                    layer_id: selectedRow.layer_id,
                                    params: params,
                                    table_id: selectedRow.table_id
                                };
                                this.featureRelationGrid.getDataSource().reload();
                                this.featureRelationGrid.columnOption(1, "caption", selectedRow.raw.label_column?.name_vn ?? selectedRow.raw.identity_column?.name_vn);
                                this.featureRelationPopup.option("title", "Danh sách " + selectedRow.raw.name_vn);
                                this.featureRelationPopup.show();
                            }
                        }
                    },
                    scrolling: {
                        mode: "standard"
                    },
                    selection: {
                        mode: "single",
                    },
                    showBorders: true,
                    showRowLines: true,
                    width: "100%"
                }).dxTreeList("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: 300,
            hideOnOutsideClick: false,
            onOptionChanged: () => {
            },
            resizeEnabled: true,
            shading: false,
            showTitle: true,
            title: "Thống kê tài sản",
            toolbarItems: [{
                location: "after",
                options: {
                    hint: "Thu nhỏ",
                    icon: "chevronup",
                    onClick: function (e) {
                        if (e.component.option("icon") == "chevrondown") {
                            self.popup.option("height", 500);
                            e.component.option("icon", "chevronup");
                            e.component.option("hint", "Thu nhỏ");
                        } else {
                            self.popup.option("height", 90);
                            e.component.option("icon", "chevrondown");
                            e.component.option("hint", "Mở rộng");
                        }
                    },
                    stylingMode: "text",
                    type: "normal",
                },
                widget: "dxButton",
            }, {
                location: "after",
                options: {
                    hint: "Toàn màn hình",
                    icon: "expandform",
                    onClick: function (e) {
                        if (e.component.option("icon") == "expandform") {
                            self.popup.option("position", { at: "center", my: "center", of: window });
                            self.popup.option("height", "100vh");
                            self.popup.option("width", "100vw");
                            e.component.option("icon", "fullscreen");
                            e.component.option("hint", "Mặc định");
                        } else {
                            self.popup.option("position", { boundaryOffset: { x: 0, y: 0 } });
                            self.popup.option("height", 500);
                            self.popup.option("width", 900);
                            e.component.option("icon", "expandform");
                            e.component.option("hint", "Toàn màn hình");
                        }
                    },
                    stylingMode: "text",
                    type: "normal"
                },
                widget: "dxButton"
            }],
            width: 700,
        }).dxPopup("instance");

        this.featureRelationPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                this.featureRelationGrid = $("<div />").appendTo(container).dxDataGrid({
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
                            const pageIndex = this.featureRelationGrid.pageIndex();
                            const pageSize = this.featureRelationGrid.pageSize();
                            container.append(`${pageSize * pageIndex + options.row.rowIndex + 1}`);
                        },
                        dataField: "index",
                        width: 50
                    }, {
                        caption: "Tên đối tượng",
                        dataField: "name"
                    }, {
                        alignment: "center",
                        allowEditing: false,
                        caption: "Thao tác",
                        cellTemplate: (container, options) => {
                            $("<div>").appendTo(container).dxToolbar({
                                items: [{
                                    location: "center",
                                    options: {
                                        hint: "Phóng tới đối tượng",
                                        icon: "icon icon-search-zoom-in",
                                        onClick: (e) => {
                                            const data = options.data;
                                            if (data) {
                                                FeatureService.queryFeature(data.layer_id, data.table_id, data.id).then(response => {
                                                    const geom = response.attributes.geom;
                                                    if (geom) {
                                                        this.oGMap.fitBounds(geom.toString());
                                                        this.oGMap.highlightIdentifyFeature(geom.toString());
                                                    }
                                                });
                                            }
                                        },
                                        type: "success"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "center",
                                    options: {
                                        hint: "Xem thông tin đối tượng",
                                        icon: "icon icon-info-circle",
                                        onClick: (e) => {
                                            const data = options.data;
                                            if (data) {
                                                this.identify.identifyRowTableFeature(data.id, data.table_id, data.table_name, false);
                                            }
                                        },
                                        type: "default"
                                    },
                                    widget: "dxButton"
                                }]
                            });
                        },
                        dataField: "id",
                        width: 120
                    }],
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
                                if (this.arguments) {
                                    $.ajax({
                                        contentType: "application/json",
                                        data: JSON.stringify(this.arguments),
                                        dataType: "json",
                                        error: () => {
                                            deferred.reject("Data Loading Error");
                                        },
                                        success: (result) => {
                                            if (result.status == "OK" && result.data && result.data.length) {
                                                deferred.resolve({
                                                    data: result.data,
                                                    totalCount: result.data.length
                                                });
                                            } else {
                                                deferred.resolve({
                                                    data: [],
                                                    totalCount: 0
                                                });
                                            }
                                        },
                                        type: "post",
                                        url: "/api/feature/get-feature-relation",
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
                    toolbar: {
                        items: [{
                            location: "after",
                            options: {
                                hint: "Làm mới",
                                icon: "icon icon-refresh",
                                onClick: () => {
                                    this.featureRelationGrid.getDataSource().reload();
                                },
                            },
                            widget: "dxButton"
                        }]
                    }
                }).dxDataGrid("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: 500,
            hideOnOutsideClick: false,
            onOptionChanged: () => {
            },
            resizeEnabled: true,
            shading: false,
            showTitle: true,
            title: "Danh sách đối tượng",
            width: 600,
        }).dxPopup("instance");
    }

    public show(): void {
        this.popup.show();
    }
}

export { StatisticRelationshipComponent };