import { OGMap } from "@opengis/map";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid, { dxDataGridColumn } from "devextreme/ui/data_grid";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import { data } from "jquery";

import { OGUtils } from "../../helpers/utils";
import { OGLayerModel } from "../../models/layer.model";
import { FeatureService } from "../../services/feature.service";
import { IMapComponent } from "../base-component.abstract";
import { IdentifyComponent } from "../identify/identify.component";
import "./feature-relationship-window.component.scss";

interface FeatureRelationshipWindowOptions {
    identify: IdentifyComponent;
    oGMap: OGMap;
}

interface OGLevelOptions {
    featureId: number | string;
    layerId?: number;
    layerInfo?: OGLayerModel;
    name?: string;
    table_name?: string;
}

const TableGroupByPhanLoai = ["tn_tuyen"];
class FeatureRelationshipWindowComponent implements IMapComponent {
    dataGrid: dxDataGrid;
    featureID: number | string;
    identify: IdentifyComponent;
    layerID: number;
    levels: OGLevelOptions[];
    oGMap: OGMap;
    popup: dxPopup;
    constructor(options: FeatureRelationshipWindowOptions) {
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
        const table_name = levels[levels.length - 1].table_name;
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

    public for(featureId: number | string, ogLayer: OGLayerModel, table_name?: string, name? : string): this {
        this.featureID = featureId;
        this.layerID = ogLayer.id;
        if (!table_name && ogLayer.table) {
            this.levels = [];
            table_name = ogLayer.table.table_name;
        }
        this.levels.push({
            featureId: this.featureID,
            layerId: this.layerID,
            name: name ? name : "",
            table_name: table_name
        });
        this.refreshColumn(this.levels);
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
                        caption: "Tên lớp",
                        dataField: "layer_name",
                        groupIndex: 0,
                    }, {
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
                                if (self.levels && self.levels.length > 0) {
                                    const level = self.levels[self.levels.length - 1];
                                    Object.assign(args, {
                                        featureId: level.featureId,
                                        layerId: level.layerId,
                                        skip: loadOptions.skip ? loadOptions.skip : 0,
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
                    onContentReady: () => {
                        this.buildBreadcrumb();
                    },
                    onRowClick: (e) => {
                        if (e.rowType === "data") {
                            const table_name = e.data.uid.split(".")[1];
                            this.for(e.data.id, { id: e.data.layer_id }, table_name, e.data.name);
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
                                    if (self.levels && self.levels.length) {
                                        const level = self.levels[self.levels.length - 1];
                                        OGUtils.postDownload("/api/feature/exportRelationship", {
                                            featureId: level.featureId,
                                            layerId: level.layerId
                                        });
                                    }
                                },
                                text: "Xuất Excel thống kê",
                            },
                            widget: "dxButton",
                        }, {
                            location: "before",
                            options: {
                                elementAttr: {
                                    id: "backButton",
                                },
                                icon: "back",
                                onClick: () => {
                                    this.levels.pop();
                                    this.refreshColumn(this.levels);
                                    this.dataGrid.getDataSource().reload();
                                },
                            },
                            widget: "dxButton"
                        }, {
                            location: "before",
                            template: () => {
                                return "<div class=\"breadcumb-container\"><ul id=\"breadCrumb\"></ul></div>";
                            }
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
            height: 500,
            hideOnOutsideClick: false,
            onOptionChanged: () => {
            },
            resizeEnabled: true,
            shading: false,
            showTitle: true,
            title: "Thông tin đối tượng liên quan",
            width: 900,
        }).dxPopup("instance");
    }

    public show(): void {
        this.popup.show();
    }
}

export { FeatureRelationshipWindowComponent };