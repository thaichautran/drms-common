import { OGMap } from "@opengis/map";
import CustomStore from "devextreme/data/custom_store";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import EventEmitter from "events";
import $ from "jquery";
import { Feature } from "ol";
import { Layer } from "ol/layer";

import { OGLayerModel } from "../../models/layer.model";
import { EventDispatcher, Handler, IMapComponent } from "../base-component.abstract";
import { IdentifyComponent } from "../identify/identify.component";

interface FeaturesWindowOption {
    allowDelete: boolean,
    allowEditing: boolean,
    identify: IdentifyComponent
    layers: OGLayerModel[],
}

interface FeatureEditEvent {
    feature: Feature;
    layer: Layer;
    layerInfo: OGLayerModel;
}
interface FeatureDeleteEvent {
    feature: Feature;
    layer: Layer;
    layerInfo: OGLayerModel;
}

class FeaturesWindowComponent implements IMapComponent {
    private data: OGLayerModel[];
    private eventEmitter = new EventEmitter();
    private featureDeleteEventDispatcher = new EventDispatcher<FeatureDeleteEvent>();
    private featureEditEventDispatcher = new EventDispatcher<FeatureEditEvent>();
    private grid: dxDataGrid;
    private identifyComponent: IdentifyComponent;
    private options: FeaturesWindowOption;
    private popup: dxPopup;
    oGMap: OGMap;
    constructor(oGMap: OGMap, options: FeaturesWindowOption) {
        this.oGMap = oGMap;
        this.options = options;
        this.data = [];
        this.identifyComponent = options.identify;
        this.onInit();
    }
    public hide(): void {
        if (this.popup) {
            this.popup.hide();
        }
    }
    public onFeatureDelete(handler: Handler<FeatureDeleteEvent>): void {
        this.featureDeleteEventDispatcher.register(handler);
    }

    public onFeatureEdit(handler: Handler<FeatureEditEvent>): void {
        this.featureEditEventDispatcher.register(handler);
    }

    onInit(): void {
        this.popup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                //
                this.grid = $("<div />").appendTo(container).dxDataGrid({
                    columns: [{
                        caption: "Lớp dữ liệu",
                        dataField: "layer_name",
                        groupIndex: 0
                    }, {
                        caption: "Mã đối tượng",
                        dataField: "fid",
                        width: 80,
                    }, {
                        caption: "Tên đối tượng",
                        dataField: "label"
                    }, {
                        allowEditing: false,
                        caption: "Thao tác",
                        cellTemplate: (container, options) => {
                            const items = [{
                                location: "center",
                                options: {
                                    hint: "Phóng tới",
                                    icon: "icon icon-search-zoom-in",
                                    onClick: () => {
                                        this.oGMap.fitExtentAnimate(options.data.feature.getGeometry().getExtent(), undefined);
                                        this.hide();
                                    },
                                    type: "default"
                                },
                                visible: false,
                                widget: "dxButton",
                            }, {
                                location: "center",
                                options: {
                                    hint: "Xem thông tin",
                                    icon: "icon icon-info-circle",
                                    onClick: () => {
                                        this.identifyComponent.identifyFeature(options.data.feature);
                                        this.hide();
                                    },
                                    type: "default"
                                },
                                widget: "dxButton"
                            }];
                            if (this.options.allowEditing) {
                                items.push({
                                    location: "center",
                                    options: {
                                        hint: "Chỉnh sửa",
                                        icon: "icon icon-edit-2",
                                        onClick: () => {
                                            this.eventEmitter.emit("editFeature", options.data);
                                            this.hide();
                                        },
                                        type: "success"
                                    },
                                    widget: "dxButton"
                                });
                            }
                            if (this.options.allowDelete) {
                                items.push({
                                    location: "center",
                                    options: {
                                        hint: "Xóa",
                                        icon: "icon icon-trash",
                                        onClick: () => {
                                            this.eventEmitter.emit("deleteFeature", options.data);
                                            this.hide();
                                        },
                                        type: "danger"
                                    },
                                    widget: "dxButton"
                                });
                            }
                            $("<div>").appendTo(container).dxToolbar({
                                items: items
                            });
                        },
                        width: 200,
                    }],
                    dataSource: {
                        store: new CustomStore({
                            key: "id",
                            load: () => {
                                return this.data;
                            }
                        })
                    },
                    errorRowEnabled: false,
                    grouping: {
                        //autoExpandAll: false
                    },
                    height: "100%",
                    loadPanel: {
                        text: "Đang tải dữ liệu"
                    },
                    noDataText: "Không có dữ liệu",
                    pager: {
                        infoText: "{2} bản ghi",
                        showInfo: true,
                        showNavigationButtons: true,
                        showPageSizeSelector: false,
                        // allowedPageSizes: [15, 25, 50],
                        visible: true
                    },
                    paging: {
                        enabled: true,
                        pageSize: 25
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
                    },
                    showBorders: true,
                    width: "100%"
                }).dxDataGrid("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: 400,
            hideOnOutsideClick: false,
            onOptionChanged: () => {

            },
            resizeEnabled: false,
            shading: true,
            showTitle: true,
            title: "Đối tượng hiển thị",
            width: 600,
        }).dxPopup("instance");
    }

    public option(key: string, value: object): void {
        if (this.options[key]) {
            this.options[key] = value;
        }
    }

    public setData(data): void {
        if (this.options.layers && this.options.layers.length > 0) {
            this.data = [];
            $.each(data, (idx, item) => {
                if (this.options.layers.indexOf(item.layer_id) >= 0) {
                    this.data.push(item);
                }
            });
        } else {
            this.data = data;
        }
        this.grid.getDataSource().reload();
    }

    public show(): void {
        if (this.popup) {
            this.popup.show();
        }
    }
}

export { FeaturesWindowComponent };