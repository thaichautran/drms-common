import { OGMap, OGMapUtils } from "@opengis/map";
import dxPopup from "devextreme/ui/popup";
import VectorLayer from "ol/layer/Vector";
import { Style } from "ol/style";

import { OGLayerModel } from "../../models/layer.model";
import { IMapComponent } from "../base-component.abstract";
import "./legend.component.scss";

class LegendComponent implements IMapComponent {
    container: HTMLElement;
    liContainer: JQuery<HTMLElement>;
    list: JQuery<HTMLElement>;
    oGMap: OGMap;
    popup: dxPopup;
    constructor(oGMap: OGMap) {
        this.oGMap = oGMap;
        this.onInit();
    }

    private draw(li, collection): void {
        const layers = collection.getArray(),
            featureLayers = [];
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (layer.getLayers) {
                // if (layer.get('groupId').indexOf('wfs') >= 0 && $.isNullOrEmpty(layer.get('layerGroupInfo')) === false) {
                //     let layerGroupInfo = layer.get('layerGroupInfo');
                //     let gid = layer.get('groupId');
                //     let gLi = m_List.find('li[data-gid=' + gid + ']');
                //     if (gLi.length === 0) {
                //         gLi = $('<li data-gid="' + layer.get('groupId') + '" />').appendTo(m_List);
                //     }
                //     gLi.empty();
                // let ul = $('<ul />').html('<span style="margin-left:-20px">' + layerGroupInfo.ModuleName + '</span>').appendTo(gLi);
                // }
                //
                this.liContainer.empty();
                // let ul = $('<ul />').html('<span class="layer-group-name">' + layer.get('title') + '</span>').appendTo(this.liContainer);
                const ul = $("<ul />").appendTo(this.liContainer);
                this.draw($("<li />").appendTo(ul), layer.getLayers());
            } else if (layer.get("layerInfo") || layer.get("layerInfos")) {
                featureLayers.push(layer);
            }
        }
        if (featureLayers.length > 0) {
            this.render(li, featureLayers);
        }
    }

    private render($li, layers): void {
        layers.map((layer) => {
            if (layer.getVisible() === false)
                return;
            if (layer.get("layerInfo")) {
                this.renderTable(layer.get("layerInfo"));
            } else if (layer.get("layerInfos")) {
                const layerInfos = layer.get("layerInfos");
                Object.keys(layerInfos).forEach((key) => {
                    this.renderTable(layerInfos[key]);
                });
            }
        });
    }

    private renderTable(layerInfo: OGLayerModel): void {
        const $li = $("<li />").appendTo(this.liContainer);
        const $table = $("<table />").appendTo($li).addClass("legend-table");
        $table.append("<tr><td colspan=\"2\"><span class=\"layer-name\">" + layerInfo.name_vn + "</span></td></tr>");
        if (layerInfo.classify_column_id > 0 && layerInfo.layer_classify) {
            $.each(layerInfo.layer_classify, (idx, classify) => {
                const tr = $("<tr />").appendTo($table);
                const canvas = $("<canvas />").appendTo($("<td />").addClass("symbol").appendTo(tr)).height(20).width(20);
                $("<span class=\"legend-name\" />").appendTo($("<td />").appendTo(tr)).html(classify.value);
                if (classify.style) {
                    OGMapUtils.geoStylerStyleToCanvas(JSON.parse(classify.style), 20, canvas.get(0) as HTMLCanvasElement);
                }
            });
        } else if (layerInfo.styles) {
            const tr = $("<tr />").appendTo($table);
            const canvas = $("<canvas />").appendTo($("<td />").addClass("symbol").appendTo(tr)).height(20).width(20);
            $("<span class=\"legend-name\" />").appendTo($("<td />").appendTo(tr)).html("Khác");
            if (layerInfo.styles) {
                OGMapUtils.geoStylerStyleToCanvas(JSON.parse(layerInfo.styles), 20, canvas.get(0) as HTMLCanvasElement);
            }
        } else if (layerInfo.symbolStyles && layerInfo.symbolStyles.length) {
            const tr = $("<tr />").appendTo($table);
            const canvas = $("<canvas />").appendTo($("<td />").addClass("symbol").appendTo(tr)).height(20).width(20);
            $("<span class=\"legend-name\" />").appendTo($("<td />").appendTo(tr)).html("Khác");
            OGMapUtils.olStyleToCanvas(layerInfo.symbolStyles[0], 20, canvas.get(0) as HTMLCanvasElement);
        }
        else {
            const tr = $("<tr />").appendTo($table);
            const canvas = $("<canvas />").appendTo($("<td />").addClass("symbol").appendTo(tr)).height(20).width(20);
            $("<span class=\"legend-name\" />").appendTo($("<td />").appendTo(tr)).html("Khác");
            const layer = this.oGMap.getLayerById(layerInfo.id);
            let style: Style;
            if (layer instanceof VectorLayer && layer.getStyle) {
                style = layer.getStyle() as Style;
            }
            if (style) {
                OGMapUtils.olStyleToCanvas(style, 20, canvas.get(0) as HTMLCanvasElement);
            }
        }
    }

    public hide(): void {
        this.popup.hide();
    }

    onInit(): void {
        this.popup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "10px");
                this.list = $("<ul />").appendTo(container).addClass("legends");
            },
            deferRendering: false,
            dragEnabled: false,
            height: 520,
            hideOnOutsideClick: false,
            position: {
                at: "right top",
                of: "#map",
                offset: "-220 280"
            },
            resizeEnabled: true,
            shading: false,
            showCloseButton: true,
            showTitle: true,
            title: "Chú giải",
            width: 320,
        }).dxPopup("instance");
        this.liContainer = $("<li />").appendTo(this.list);
        let timeoutHandler: NodeJS.Timeout;
        this.oGMap.onLayersChange(() => {
            if (timeoutHandler) {
                clearTimeout(timeoutHandler);
            }
            timeoutHandler = setTimeout(() => {
                this.draw(this.liContainer, this.oGMap.olMap.getLayers());
            }, 250);
        });
    }

    public show(): void {
        this.popup.show();
    }
}

export { LegendComponent };
