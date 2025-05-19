import { OGMap } from "@opengis/map";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxPopup from "devextreme/ui/popup";
import dxSelectBox from "devextreme/ui/select_box";
import dxSlider from "devextreme/ui/slider";

import { OGLayerModel } from "../../models/layer.model";
import { IMapComponent } from "../base-component.abstract";

class OpacityWindowComponent implements IMapComponent {
    container: JQuery<HTMLElement>;
    layerID: number;
    layerSelectBox: dxSelectBox;
    layerStore: CustomStore<OGLayerModel, number>;
    oGMap: OGMap;
    opacitySlider: dxSlider;

    popup: dxPopup;
    constructor(oGMap: OGMap) {
        this.oGMap = oGMap;
        this.onInit();
    }

    private show(): void {
        if (this.popup) {
            this.popup.show();
        }
    }

    public hide(): void {
        if (this.popup) {
            this.popup.hide();
        }
    }

    onInit(): void {
        this.container = $("<div />").appendTo("body");
        this.layerID = -1;
        this.layerStore = new CustomStore({
            key: "id",
            load: () => {
                return new Promise((resolve) => {
                    const data: OGLayerModel[] = [];
                    this.oGMap.getLayers().getArray().map(layer => {
                        if (layer.getVisible() && layer.get("layerInfo")) {
                            data.push(layer.get("layerInfo") as OGLayerModel);
                        }
                    });

                    resolve({
                        data: data,
                        totalCount: data.length
                    });
                });
            }
        });
        this.popup = this.container.dxPopup({
            contentTemplate: (container) => {
                const row = $("<div />").addClass("row").appendTo(container);
                this.layerSelectBox = $("<div />").appendTo($("<div />").appendTo(row).addClass("col-sm-6")).dxSelectBox({
                    dataSource: new DataSource({
                        store: this.layerStore
                    }),
                    deferRendering: true,
                    displayExpr: "name_vn",
                    noDataText: "Đang tải dữ liệu",
                    onSelectionChanged: (e) => {
                        const itemData = e.selectedItem;
                        if (itemData) {
                            const layer = this.oGMap.getLayerById(itemData.id);
                            if (layer) {
                                this.opacitySlider.option("value", layer.getOpacity());
                            }
                        }
                    },
                    stylingMode: "outlined",
                    valueExpr: "id",
                    visible: true,
                }).dxSelectBox("instance");
                this.opacitySlider = new dxSlider($("<div />").appendTo($("<div />").addClass("col-sm-6").appendTo(row)), {
                    max: 1,
                    min: 0,
                    onValueChanged: (e) => {
                        if (this.layerSelectBox.option("value")) {
                            const layer = this.oGMap.getLayerById(this.layerSelectBox.option("value").id);
                            if (layer) {
                                layer.setOpacity(e.value);
                            }
                        }
                    },
                    step: 0.1,
                    tooltip: {
                        enabled: true,
                        format: (value) => {
                            return Math.round(value * 100) + " %";
                        },
                        // showMode: "always",
                        position: "top"
                    },
                    value: 1
                });
            },
            deferRendering: false,
            dragEnabled: true,
            height: "auto",
            hideOnOutsideClick: false,
            onOptionChanged: () => {

            },
            resizeEnabled: false,
            shading: false,
            showTitle: true,
            title: "Thiết lập độ trong suốt của lớp dữ liệu",
            width: 300,
        }).dxPopup("instance");
        //
        this.oGMap.onLayersChange(() => {
            if (this.layerStore && this.layerSelectBox) {
                this.layerStore.load();
            }
        });
    }
}

export { OpacityWindowComponent };