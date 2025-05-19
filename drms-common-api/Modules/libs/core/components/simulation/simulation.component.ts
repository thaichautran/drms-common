import { OGMap } from "@opengis/map";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import dxPopup from "devextreme/ui/popup";

import { EnumStatus } from "../../enums/enums";
import { OGLayerModel } from "../../models/layer.model";
import { FeatureService } from "../../services/feature.service";
import { IMapComponent } from "../base-component.abstract";
import { IdentifyComponent } from "../identify/identify.component";
interface FeatureSimulationOptions {
    identify: IdentifyComponent;
    oGMap: OGMap;
}
class SimulationComponent implements IMapComponent {
    featureId: number;
    grid: dxDataGrid;
    identify: IdentifyComponent;
    layerIds: number[];
    oGLayer: OGLayerModel;
    oGMap: OGMap;
    popup: dxPopup;
    constructor(options: FeatureSimulationOptions) {
        this.oGMap = options.oGMap;
        this.identify = options.identify;
        this.initLayout();
    }

    private initLayout(): void {
        const self = this;
        this.popup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                this.grid = $("<div />").appendTo(container).dxDataGrid({
                    columns: [
                        { 
                            caption: "Mã tuyến",
                            dataField: "foreign_value",
                        }, {
                            caption: "Loại công trình",
                            dataField: "layer_name",
                            groupIndex: 0,
                        }, {
                            caption: "Công trình chiếu sáng",
                            dataField: "name",
                        }, {
                            caption: "Trạng thái",
                            dataField: "status",
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
                    dataSource: {
                        store: new CustomStore({
                            key: "id",
                            load: (loadOptions) => {
                                const deferred = $.Deferred(),
                                    args = {};

                                if (self.featureId && self.oGLayer) {
                                    Object.assign(args, {
                                        featureId: self.featureId,
                                        layerId: self.oGLayer,
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
                                                deferred.resolve( {
                                                    data: [],
                                                    totalCount: 0
                                                });
                                            }
                                        },
                                        type: "post",
                                        url: "/api/feature/simulations",
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
                    },
                    errorRowEnabled: false,
                    grouping: {
                        autoExpandAll: true
                    },
                    height: "100%",
                    onContentReady: () => {
                        //this._buildBreadcrumb();
                    },
                    onRowClick: (e) => {
                        if (e.rowType === "data") {
                            const data = e.data;
                        }
                    },
                    pager: {
                        allowedPageSizes: [50, 100, 150],
                        showInfo: true,
                        showNavigationButtons: true,
                        showPageSizeSelector: true,
                        visible: true
                    },
                    paging: {
                        enabled: true,
                        pageSize: 150
                    },
                    remoteOperations: {
                        //paging: true,
                        groupPaging: false
                        //sorting: true,
                        //filtering: true
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
                            location: "after",
                            options: {
                                icon: "icon icon-refresh",
                                onClick: () => {
                                    this.grid.refresh();
                                }
                            },
                            widget: "dxButton"
                        }]
                    },
                    width: "100%",
                }).dxDataGrid("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: 400, 
            hideOnOutsideClick: false,
            onHiding: (e) => {
            },
            onOptionChanged: (e) => {
            },
            resizeEnabled: true,
            shading: false,
            showTitle: true,
            title: "Mô phỏng hiện trạng hoạt động mạng lưới",
            width: 700,
        }).dxPopup("instance");
    }

    public for(featureId, layer): SimulationComponent {
        this.featureId = featureId;
        this.oGLayer = layer;
        this.grid.getDataSource().reload();
        return this;
    }
    public hide(): void {
        this.popup.hide();
    }
    onInit(): void {
        
    }

    public show(): void {
        this.popup.show();
    }
}

export { SimulationComponent };