import { OGMap, OGMapProjection, OGMapUtils } from "@opengis/map";
import { ElementWrapper } from "devextreme/core/element";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxContextMenu from "devextreme/ui/context_menu";
import dxTreeView, { ItemSelectionChangedEvent, Item as dxTreeViewItem } from "devextreme/ui/tree_view";
import * as flatgeobuf from "flatgeobuf";
import geobuf from "geobuf";
import { Feature } from "ol";
import { MVT } from "ol/format";
import GeoJSON from "ol/format/GeoJSON";
import {
    Geometry,
    LineString,
    MultiLineString,
    MultiPoint,
    MultiPolygon,
    Point, Polygon, SimpleGeometry
} from "ol/geom";
import {
    Layer,
    Tile as TileLayer,
    Vector as VectorLayer
} from "ol/layer";
import VectorImageLayer from "ol/layer/VectorImage";
import VectorTileLayer from "ol/layer/VectorTile";
import { bbox as bboxStrategy } from "ol/loadingstrategy";
import { transformExtent } from "ol/proj";
import {
    Cluster as ClusterSource,
    TileWMS,
    Vector as VectorSource,
    VectorTile as VectorTileSource,
    XYZ,
} from "ol/source";
import { getArea, getLength } from "ol/sphere";
import {
    Circle, Fill, Icon, RegularShape, Stroke, Style, Text
} from "ol/style";
import AnimatedCluster, { ClusterOptions } from "ol-ext/layer/AnimatedCluster";
import Pbf from "pbf";

import { EnumDataType, EnumDefaultStyle, EnumGeometry } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { OGConfigModel } from "../../models/config.model";
import { OGLayerClassifyModel, OGLayerModel, OGTileLayerModel } from "../../models/layer.model";
import { OGTableModel } from "../../models/table.model";
import { LayerGroupTreeItem, LayerTreeItem } from "../../models/tree-item.model";
import { LayerService } from "../../services/layer.service";
import { AttributesEditorComponent } from "../attributes-editor/attributes-editor.component";
import { AttributesWindowComponent } from "../attributes-window/attributes-window.component";
import { IMapComponent } from "../base-component.abstract";
import { IdentifyComponent } from "../identify/identify.component";
import { OpacityWindowComponent } from "../opacity-window/opacity-window.component";
import { StyleEditorComponent } from "../style-editor/style-editor.component";
import "./layer-tree.component.scss";

interface LayerTreeOption {
    attributesEditor: AttributesEditorComponent;
    cluster: boolean;
    config: OGConfigModel;
    extent?: GeoJSON.BBox;
    identify: IdentifyComponent;
    mapId?: number
    oGMap: OGMap;
    showLayerActions: boolean;
    tableSchema?: string;
}

class LayerTreeComponent implements IMapComponent {
    attributesEditor: AttributesEditorComponent;
    attributesWindowComponent: AttributesWindowComponent;
    cluster: boolean;
    clusterPointLayer: AnimatedCluster;
    clusterPointSource: ClusterSource<Feature>;
    container: JQuery<HTMLElement>;
    contextMenu: dxContextMenu;
    filterGeometry?: string;
    identify: IdentifyComponent;
    isRenderCompositeLayer: boolean = false;
    layerFilterIds: null | string;
    layerTree: dxTreeView;
    lineLayer: VectorLayer<VectorSource<Feature>>;
    lineStringClassifyValues: string[];
    mapId: number;
    multiPointClassifyValues: string[];
    multiPointLayer: VectorLayer<VectorSource<Feature>>;
    multiPointSource: ClusterSource<Feature>;
    oGMap: OGMap;
    opacityWindow: OpacityWindowComponent;
    options: LayerTreeOption;
    params: object;
    pointClassifyValues: string[];
    pointLayer: VectorImageLayer<Feature, VectorSource<Feature>>;
    pointSource: VectorSource<Feature>;
    polygonClassifyValues: string[];
    polygonLayer: VectorImageLayer<Feature, VectorSource<Feature>>;
    styleEditor: StyleEditorComponent;
    tableSchema: string;
    vectorLayer: VectorImageLayer<Feature, VectorSource<Feature>> | VectorLayer<VectorSource<Feature>>;

    constructor(container: JQuery<HTMLElement>, options: LayerTreeOption) {
        this.oGMap = options.oGMap;
        this.container = container;
        this.options = options;
        this.tableSchema = options.tableSchema;
        this.mapId = options.mapId;
        this.identify = options.identify;
        this.attributesEditor = options.attributesEditor;
        this.cluster = options.cluster;
        this.attributesWindowComponent = new AttributesWindowComponent(this.oGMap, {
            attributeEditors: this.attributesEditor,
            identify: this.identify,
            mapId: options.mapId,
            oGConfig: this.options.config,
            showButton: true,
        });
        this.identify.setAttributeWindows(this.attributesWindowComponent);
        this.opacityWindow = new OpacityWindowComponent(this.oGMap);
        this.styleEditor = new StyleEditorComponent();
        this.pointClassifyValues = []; this.multiPointClassifyValues = []; this.lineStringClassifyValues = []; this.polygonClassifyValues = [];
        this.onInit();
    }
    private buildArrowStyles(geometry: LineString | MultiLineString): Style[] {
        const styles = [];
        if (geometry instanceof LineString) {
            geometry.forEachSegment(function (start, end) {
                const dx = end[0] - start[0];
                const dy = end[1] - start[1];
                const rotation = Math.atan2(dy, dx);
                const ls = new LineString([start, end]);
                const lineLength = getLength(ls, {
                    projection: OGMapProjection.getMapProjection()
                });
                // nếu chiều dài segment lớn hơn 20m thì mới hiển thị mũi tên hướng
                if (lineLength >= 5) {
                    styles.push(
                        new Style({
                            geometry: new Point(ls.getFlatMidpoint()),
                            image: new Icon({
                                anchor: [0.75, 0.5],
                                rotateWithView: true,
                                rotation: -rotation,
                                src: "/images/front/arrow.svg",
                            }),
                        }),
                    );
                }
            });
        } else if (geometry instanceof MultiLineString) {
            geometry.getLineStrings().forEach(ls => {
                ls.forEachSegment(function (start, end) {
                    const dx = end[0] - start[0];
                    const dy = end[1] - start[1];
                    const rotation = Math.atan2(dy, dx);
                    const ls = new LineString([start, end]);
                    const lineLength = getLength(ls, {
                        projection: OGMapProjection.getMapProjection()
                    });
                    // nếu chiều dài segment lớn hơn 20m thì mới hiển thị mũi tên hướng
                    if (lineLength >= 5) {
                        styles.push(
                            new Style({
                                geometry: new Point(ls.getFlatMidpoint()),
                                image: new Icon({
                                    anchor: [0.75, 0.5],
                                    rotateWithView: true,
                                    rotation: -rotation,
                                    src: "/images/front/arrow.svg",
                                }),
                            }),
                        );
                    }
                });
            });
        }
        return styles;
    }

    private async compositeLayerHandle(e: ItemSelectionChangedEvent): Promise<boolean> {
        return new Promise((resolve) => {
            if (e.itemData.raw) {
                const raw = e.itemData.raw;
                if (e.itemData.type === "@tilelayer") {
                    const layer = this.oGMap.getLayerById(raw.id);
                    if (layer) {
                        layer.setVisible(e.itemData.selected);
                    }
                }
                else if (e.itemData.raw.layer_type === "wms") {
                    const layer = this.oGMap.getLayerById(raw.id);
                    if (layer) {
                        layer.setVisible(e.itemData.selected);
                    }
                } else if (e.itemData.type === "@layer_classify") {
                    const raw = e.itemData.raw;
                    const layer: OGLayerModel = raw.layer;
                    const multiPointLayers = [], pointLayers = [], lineLayers = [], polygonLayers = [];
                    this.pointClassifyValues = []; this.lineStringClassifyValues = [];
                    this.multiPointClassifyValues = []; this.polygonClassifyValues = [];
                    let isLayerVisible = false;
                    e.component.getNodes().forEach(node => {
                        if (node.children && node.children.length > 0) {
                            node.children.forEach(layerItem => {
                                if (layerItem.itemData.type === "@layer") {
                                    if (layerItem.itemData.raw.geometry === "Point") {
                                        isLayerVisible = false;
                                        //Kiểm tra layer có được chọn hiển thị không
                                        if (layerItem.children.length) {
                                            //Nếu ít nhất 1 classify của layer được chọn thì hiển thị layer
                                            layerItem.children.forEach(classifyItem => {
                                                if (classifyItem.itemData.selected) {
                                                    isLayerVisible = true;
                                                    this.pointClassifyValues.push(classifyItem.itemData.raw.value);
                                                }
                                            });
                                        } else {
                                            if (layerItem.selected) {
                                                isLayerVisible = true;
                                            }
                                        }
                                        if (isLayerVisible) {
                                            pointLayers.push(layerItem.itemData.raw.id);
                                        }
                                    } else if (layerItem.itemData.raw.geometry === "MultiPoint") {
                                        isLayerVisible = false;
                                        if (layerItem.children.length) {
                                            layerItem.children.forEach(classifyItem => {
                                                if (classifyItem.itemData.selected) {
                                                    isLayerVisible = true;
                                                    this.multiPointClassifyValues.push(classifyItem.itemData.raw.value);
                                                }
                                            });
                                        }
                                        else {
                                            if (layerItem.selected) {
                                                isLayerVisible = true;
                                            }
                                        }
                                        if (isLayerVisible) {
                                            multiPointLayers.push(layerItem.itemData.raw.id);
                                        }
                                    } else if (layerItem.itemData.raw.geometry === "LineString" || layerItem.itemData.raw.geometry === "MultiLineString") {
                                        isLayerVisible = false;
                                        if (layerItem.children.length) {
                                            layerItem.children.forEach(classifyItem => {
                                                if (classifyItem.itemData.selected) {
                                                    isLayerVisible = true;
                                                    this.lineStringClassifyValues.push(classifyItem.itemData.raw.value);
                                                }
                                            });
                                        } else {
                                            if (layerItem.selected) {
                                                isLayerVisible = true;
                                            }
                                        }
                                        if (isLayerVisible) {
                                            lineLayers.push(layerItem.itemData.raw.id);
                                        }
                                    } else if (layerItem.itemData.raw.geometry === "Polygon" || layerItem.itemData.raw.geometry === "MultiPolygon") {
                                        isLayerVisible = false;
                                        if (layerItem.children.length) {
                                            layerItem.children.forEach(classifyItem => {
                                                if (classifyItem.itemData.selected) {
                                                    isLayerVisible = true;
                                                    this.polygonClassifyValues.push(classifyItem.itemData.raw.value);
                                                }
                                            });
                                        } else {
                                            if (layerItem.selected) {
                                                isLayerVisible = true;
                                            }
                                        }
                                        if (isLayerVisible) {
                                            polygonLayers.push(layerItem.itemData.raw.id);
                                        }
                                    }
                                }
                            });
                        }
                    });
                    if (layer.geometry === "Point" || layer.geometry === "MultiPoint") {
                        if (this.multiPointLayer) {
                            //Set layerVisibles cho layer hiển thị đa điểm 
                            if ($(this.multiPointLayer.get("layerVisibles")).not(multiPointLayers).length !== 0
                                || $(multiPointLayers).not(this.multiPointLayer.get("layerVisibles")).length !== 0) {
                                this.multiPointLayer.set("layerVisibles", multiPointLayers);
                            }
                            this.multiPointSource.getSource().refresh();
                            this.multiPointLayer.setSource(this.multiPointSource);
                        }
                        if (this.cluster) {
                            if (this.clusterPointLayer) {
                                if ($(this.clusterPointLayer.get("layerVisibles")).not(pointLayers).length !== 0
                                    || $(pointLayers).not(this.clusterPointLayer.get("layerVisibles")).length !== 0) {
                                    this.clusterPointLayer.set("layerVisibles", pointLayers);
                                }
                                this.clusterPointSource.getSource().refresh();
                                this.clusterPointLayer.setSource(this.clusterPointSource);
                            }
                        } else {
                            if (this.pointLayer) {
                                if ($(this.pointLayer.get("layerVisibles")).not(pointLayers).length !== 0
                                    || $(pointLayers).not(this.pointLayer.get("layerVisibles")).length !== 0) {
                                    this.pointLayer.set("layerVisibles", pointLayers);
                                }
                                this.pointLayer.getSource().refresh();
                            }
                        }
                    } else if (layer.geometry === "LineString" || layer.geometry === "MultiLineString") {
                        if (this.lineLayer) {
                            if ($(this.lineLayer.get("layerVisibles")).not(lineLayers).length !== 0
                                || $(lineLayers).not(this.lineLayer.get("layerVisibles")).length !== 0) {
                                this.lineLayer.set("layerVisibles", lineLayers);
                            }
                            this.lineLayer.getSource().refresh();
                        }
                    } else if (layer.geometry === "Polygon" || layer.geometry === "MultiPolygon") {
                        if (this.polygonLayer) {
                            if ($(this.polygonLayer.get("layerVisibles")).not(polygonLayers).length !== 0
                                || $(polygonLayers).not(this.polygonLayer.get("layerVisibles")).length !== 0) {
                                this.polygonLayer.set("layerVisibles", polygonLayers);
                            }
                            this.polygonLayer.getSource().refresh();
                        }
                    }
                }
                // else if (e.itemData.type === "@layergroup") {
                //     if (e.node && e.node.children) {
                //         const multiPointLayers = [], pointLayers = [], lineLayers = [], polygonLayers = [];
                //         e.node.children.forEach(node => {
                //             if (node.children && node.children.length > 0) {
                //                 node.children.forEach(item => {
                //                     if (item.itemData.selected && item.itemData.raw) {
                //                         if (item.itemData.raw.geometry === "Point") {
                //                             pointLayers.push(item.itemData.raw.id);
                //                         } else if (item.itemData.raw.geometry === "MultiPoint") {
                //                             multiPointLayers.push(item.itemData.raw.id);
                //                         } else if (item.itemData.raw.geometry === "LineString" || item.itemData.raw.geometry === "MultiLineString") {
                //                             lineLayers.push(item.itemData.raw.id);
                //                         } else if (item.itemData.raw.geometry === "Polygon" || item.itemData.raw.geometry === "MultiPolygon") {
                //                             polygonLayers.push(item.itemData.raw.id);
                //                         }
                //                     }
                //                 });
                //             }
                //         });
                //     }
                // } 
                else {
                    const raw = e.itemData.raw;
                    const multiPointLayers = [], pointLayers = [], lineLayers = [], polygonLayers = [];
                    e.component.getNodes().forEach(node => {
                        if (node.children && node.children.length > 0) {
                            node.children.forEach(item => {
                                if (item.itemData.selected && item.itemData.raw) {
                                    if (item.itemData.raw.geometry === "Point") {
                                        pointLayers.push(item.itemData.raw.id);
                                    } else if (item.itemData.raw.geometry === "MultiPoint") {
                                        multiPointLayers.push(item.itemData.raw.id);
                                    } else if (item.itemData.raw.geometry === "LineString" || item.itemData.raw.geometry === "MultiLineString") {
                                        lineLayers.push(item.itemData.raw.id);
                                    } else if (item.itemData.raw.geometry === "Polygon" || item.itemData.raw.geometry === "MultiPolygon") {
                                        polygonLayers.push(item.itemData.raw.id);
                                    }
                                }
                            });
                        }
                    });
                    //
                    if (e.itemData.type === "@layergroup") {
                        if (this.cluster) {
                            if (this.clusterPointLayer) {
                                if ($(this.clusterPointLayer.get("layerVisibles")).not(pointLayers).length !== 0
                                    || $(pointLayers).not(this.clusterPointLayer.get("layerVisibles")).length !== 0) {
                                    this.clusterPointLayer.set("layerVisibles", pointLayers);
                                }
                                this.clusterPointSource.getSource().refresh();
                                this.clusterPointLayer.setSource(this.clusterPointSource);
                            }
                        } else {
                            if (this.pointLayer) {
                                if ($(this.pointLayer.get("layerVisibles")).not(pointLayers).length !== 0
                                    || $(pointLayers).not(this.pointLayer.get("layerVisibles")).length !== 0) {
                                    this.pointLayer.set("layerVisibles", pointLayers);
                                }
                                this.pointLayer.getSource().refresh();
                            }
                        }
                        if (this.multiPointLayer) {
                            if ($(this.multiPointLayer.get("layerVisibles")).not(multiPointLayers).length !== 0
                                || $(multiPointLayers).not(this.multiPointLayer.get("layerVisibles")).length !== 0) {
                                this.multiPointLayer.set("layerVisibles", multiPointLayers);
                            }
                            this.multiPointSource.getSource().refresh();
                            this.multiPointLayer.setSource(this.multiPointSource);
                        }
                        if (this.lineLayer) {
                            if ($(this.lineLayer.get("layerVisibles")).not(lineLayers).length !== 0
                                || $(lineLayers).not(this.lineLayer.get("layerVisibles")).length !== 0) {
                                this.lineLayer.set("layerVisibles", lineLayers);
                            }
                            this.lineLayer.getSource().refresh();
                        }
                        if (this.polygonLayer) {
                            if ($(this.polygonLayer.get("layerVisibles")).not(polygonLayers).length !== 0
                                || $(polygonLayers).not(this.polygonLayer.get("layerVisibles")).length !== 0) {
                                this.polygonLayer.set("layerVisibles", polygonLayers);
                            }
                            this.polygonLayer.getSource().refresh();
                        }
                    } else if (raw.geometry === "Point" || raw.geometry === "MultiPoint") {
                        if (this.cluster) {
                            if (this.clusterPointLayer) {
                                if ($(this.clusterPointLayer.get("layerVisibles")).not(pointLayers).length !== 0
                                    || $(pointLayers).not(this.clusterPointLayer.get("layerVisibles")).length !== 0) {
                                    this.clusterPointLayer.set("layerVisibles", pointLayers);
                                }
                                this.clusterPointSource.getSource().refresh();
                                this.clusterPointLayer.setSource(this.clusterPointSource);
                            }
                        } else {
                            if (this.pointLayer) {
                                if ($(this.pointLayer.get("layerVisibles")).not(pointLayers).length !== 0
                                    || $(pointLayers).not(this.pointLayer.get("layerVisibles")).length !== 0) {
                                    this.pointLayer.set("layerVisibles", pointLayers);
                                }
                                this.pointLayer.getSource().refresh();
                            }
                        }
                        if (this.multiPointLayer) {
                            if ($(this.multiPointLayer.get("layerVisibles")).not(multiPointLayers).length !== 0
                                || $(multiPointLayers).not(this.multiPointLayer.get("layerVisibles")).length !== 0) {
                                this.multiPointLayer.set("layerVisibles", multiPointLayers);
                            }
                            this.multiPointSource.getSource().refresh();
                            this.multiPointLayer.setSource(this.multiPointSource);
                        }
                    } else if (raw.geometry === "LineString" || raw.geometry === "MultiLineString") {
                        if (this.lineLayer) {
                            if ($(this.lineLayer.get("layerVisibles")).not(lineLayers).length !== 0
                                || $(lineLayers).not(this.lineLayer.get("layerVisibles")).length !== 0) {
                                this.lineLayer.set("layerVisibles", lineLayers);
                            }
                            this.lineLayer.getSource().refresh();
                        }
                    } else if (raw.geometry === "Polygon" || raw.geometry === "MultiPolygon") {
                        if (this.polygonLayer) {
                            if ($(this.polygonLayer.get("layerVisibles")).not(polygonLayers).length !== 0
                                || $(polygonLayers).not(this.polygonLayer.get("layerVisibles")).length !== 0) {
                                this.polygonLayer.set("layerVisibles", polygonLayers);
                            }
                            this.polygonLayer.getSource().refresh();
                        }
                    }
                }
            } else {
                const data = e.itemData;
                const multiPointLayers = [], pointLayers = [], lineLayers = [], polygonLayers = [];
                if (data.items && data.items.length) {
                    data.items.forEach(item => {
                        if (item.selected && item.raw) {
                            if (item.raw.geometry === "Point") {
                                pointLayers.push(item.raw.id);
                            } else if (item.raw.geometry === "MultiPoint") {
                                multiPointLayers.push(item.raw.id);
                            } else if (item.raw.geometry === "LineString" || item.raw.geometry === "MultiLineString") {
                                lineLayers.push(item.raw.id);
                            } else if (item.raw.geometry === "Polygon" || item.raw.geometry === "MultiPolygon") {
                                polygonLayers.push(item.raw.id);
                            }
                        }
                    });
                }
                if (this.cluster) {
                    if (this.clusterPointLayer) {
                        if ($(this.clusterPointLayer.get("layerVisibles")).not(pointLayers).length !== 0
                            || $(pointLayers).not(this.clusterPointLayer.get("layerVisibles")).length !== 0) {
                            this.clusterPointLayer.set("layerVisibles", pointLayers);
                        }
                        this.clusterPointSource.getSource().refresh();
                        this.clusterPointLayer.setSource(this.clusterPointSource);
                    }
                } else {
                    if (this.pointLayer) {
                        if ($(this.pointLayer.get("layerVisibles")).not(pointLayers).length !== 0
                            || $(pointLayers).not(this.pointLayer.get("layerVisibles")).length !== 0) {
                            this.pointLayer.set("layerVisibles", pointLayers);
                        }
                        this.pointLayer.getSource().refresh();
                    }
                }
                if (this.multiPointLayer) {
                    if ($(this.multiPointLayer.get("layerVisibles")).not(multiPointLayers).length !== 0
                        || $(multiPointLayers).not(this.multiPointLayer.get("layerVisibles")).length !== 0) {
                        this.multiPointLayer.set("layerVisibles", multiPointLayers);
                    }
                    this.multiPointSource.getSource().refresh();
                    this.multiPointLayer.setSource(this.multiPointSource);
                }
                if (this.lineLayer) {
                    if ($(this.lineLayer.get("layerVisibles")).not(lineLayers).length !== 0
                        || $(lineLayers).not(this.lineLayer.get("layerVisibles")).length !== 0) {
                        this.lineLayer.set("layerVisibles", lineLayers);
                    }
                    this.lineLayer.getSource().refresh();
                }
                if (this.polygonLayer) {
                    if ($(this.polygonLayer.get("layerVisibles")).not(polygonLayers).length !== 0
                        || $(polygonLayers).not(this.polygonLayer.get("layerVisibles")).length !== 0) {
                        this.polygonLayer.set("layerVisibles", polygonLayers);
                    }
                    this.polygonLayer.getSource().refresh();
                }
                // if (this.vectorLayer) {
                //     if ($(this.vectorLayer.get("layerVisibles")).not(layers).length !== 0
                //         || $(layers).not(this.vectorLayer.get("layerVisibles")).length !== 0) {
                //         this.vectorLayer.set("layerVisibles", layers, true);
                //     }
                //     this.vectorLayer.getSource().refresh();
                // }
            }
            resolve(true);
        });
    }

    private getClusterStyle(size): Style {
        const color = size > 25 ? "192,0,0" : size > 8 ? "255,128,0" : "0,128,0";
        const radius = Math.max(8, Math.min(size * 0.75, 20));
        // let dash = 2 * Math.PI * radius / 6;
        // dash = [0, dash, dash, dash, dash, dash, dash];
        //
        return new Style({
            image: new Circle({
                fill: new Fill({
                    color: "rgba(" + color + ",0.8)"
                }),
                radius: radius,
                stroke: new Stroke({
                    color: "rgba(" + color + ",0.5)",
                    width: 15,
                    // lineDash: dash,
                    // lineCap: "butt"
                })
            }),
            text: new Text({
                //textBaseline: 'top',
                fill: new Fill({
                    color: "#fff"
                }),
                font: "bold 11px 'Reddit Sans'",
                text: size.toString()
            })
        });
    }
    private handleTreeItem(e): void {

    }

    private async onTreeItemSelectionChange(e: ItemSelectionChangedEvent): Promise<boolean> {
        if (this.isRenderCompositeLayer) {
            return this.compositeLayerHandle(e);
        } else {
            return this.singleLayerHandle(e);
        }

    }

    private renderCompositeLayers(items: LayerGroupTreeItem[]): void {
        const multiPointLayers = [], pointLayers = [], lineLayers = [], polygonLayers = [];
        const visibleMultiPointLayers = [], visiblePointLayers = [], visibleLineLayers = [], visiblePolygonLayers = [];
        const layerInfos: { [key: number]: OGLayerModel } = {}, wmsInfos = [], multiPointLayerInfos = {}, pointLayerInfos = {}, lineLayerInfos = {}, polygonLayerInfos = {}, layerStyles = {}, classifyStyles = {};
        const layerStylesPromises = [];
        const wms = [], visibleWms = [];
        const self = this;

        items.forEach((item) => {
            if (item.items.length === 0) {
                return;
            }
            item.items.forEach((i: LayerTreeItem) => {
                if (i.type === "@tilelayer") {
                    const data: OGTileLayerModel = i.raw as OGTileLayerModel;
                    if (data.type === "xyz") {
                        const tileXyz = new TileLayer({
                            source: new XYZ({
                                crossOrigin: "anonymous",
                                url: data.url,
                            }),
                            visible: data.visible,
                        });
                        tileXyz.set("data", data, true);
                        tileXyz.set("id", data.id, true);
                        tileXyz.set("name", data.name, true);
                        this.oGMap.addLayer(tileXyz);
                    }
                }
                else {
                    if (i.raw) {
                        const layerInfo: OGLayerModel = layerInfos[i.raw.id] = i.raw as OGLayerModel;
                        if (layerInfo.layer_type === "vector") {
                            if (layerInfo.geometry === "Point") {
                                pointLayers.push(layerInfo.id);
                                if (layerInfo.is_visible) {
                                    visiblePointLayers.push(layerInfo.id);
                                }
                            } else if (layerInfo.geometry === "MultiPoint") {
                                multiPointLayers.push(layerInfo.id);
                                if (layerInfo.is_visible) {
                                    visibleMultiPointLayers.push(layerInfo.id);
                                }
                            } else if (layerInfo.geometry === "LineString" || layerInfo.geometry === "MultiLineString") {
                                lineLayers.push(layerInfo.id);
                                if (layerInfo.is_visible) {
                                    visibleLineLayers.push(layerInfo.id);
                                }
                            } else if (layerInfo.geometry === "Polygon" || layerInfo.geometry === "MultiPolygon") {
                                polygonLayers.push(layerInfo.id);
                                if (layerInfo.is_visible) {
                                    visiblePolygonLayers.push(layerInfo.id);
                                }
                            }
                            classifyStyles[layerInfo.id] = {};
                            layerStyles[layerInfo.id] = {};
                            layerStylesPromises.push(new Promise((resolve) => {
                                if (layerInfo["classify_column_id"] && layerInfo["classify_column_id"]) {
                                    $.each(layerInfo["layer_classify"], (idx, classify) => {
                                        try {
                                            if (classify.style) {
                                                OGMapUtils.geoStylerStyleToOlStyle(JSON.parse(classify.style)).then(style => {
                                                    if (style instanceof Style) {
                                                        if (style.getImage() instanceof Icon) {
                                                            (style.getImage() as Icon).setAnchor([layerInfo["styles_anchor_x"], layerInfo["styles_anchor_y"]]);
                                                            // (style.getImage() as Icon).setRotation(this.oGMap.olMap.getView().getRotation() * -1);
                                                        }
                                                    }
                                                    classifyStyles[layerInfo.id][classify.value] = style;
                                                });
                                            }
                                        } catch (e) { console.error(e); }
                                    });
                                }
                                if (layerInfo.styles) {
                                    try {
                                        OGMapUtils.geoStylerStyleToOlStyle(JSON.parse(layerInfo.styles)).then(style => {
                                            if (style instanceof Style) {
                                                if (style.getImage() instanceof Icon) {
                                                    (style.getImage() as Icon).setAnchor([layerInfo["styles_anchor_x"], layerInfo["styles_anchor_y"]]);
                                                }
                                                if (layerInfo.is_label_visible) {
                                                    if (layerInfo["label_styles"]) {
                                                        OGMapUtils.geoStylerStyleToOlStyle(JSON.parse(layerInfo["label_styles"])).then(labelStyle => {
                                                            if (typeof (labelStyle) === "function") {
                                                                const s = labelStyle();
                                                                if (s && s.length > 0) {
                                                                    labelStyle = s[0];
                                                                }
                                                            }
                                                            if (labelStyle) {
                                                                layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = labelStyle;
                                                                layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [labelStyle, style];
                                                            } else {
                                                                layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = EnumDefaultStyle.TextStyle;
                                                                layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [EnumDefaultStyle.TextStyle, style];
                                                            }

                                                            resolve(true);
                                                        });
                                                    } else {
                                                        layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = EnumDefaultStyle.TextStyle;
                                                        layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [EnumDefaultStyle.TextStyle, style];

                                                        resolve(true);
                                                    }
                                                } else {
                                                    layerStyles[layerInfo.id]["stylesObj"] = [style];
                                                    resolve(true);
                                                }

                                                layerStyles[layerInfo.id].symbolStyles = layerInfo["symbolStyles"] = [style];
                                            }
                                        });
                                    }
                                    catch (e) {
                                        console.log("Error parse style: " + layerInfo["name_vn"] + " " + e);
                                    }
                                } else {
                                    if (layerInfo["geometry"] === EnumGeometry.Point || layerInfo["geometry"] === EnumGeometry.MultiPoint) {
                                        layerStyles[layerInfo.id]["stylesObj"] = [EnumDefaultStyle.PointStyle];
                                        layerStyles[layerInfo.id].symbolStyles = layerInfo["symbolStyles"] = [EnumDefaultStyle.PointStyle];
                                    } else if (layerInfo["geometry"] === EnumGeometry.LineString || layerInfo["geometry"] === EnumGeometry.MultiLineString) {
                                        layerStyles[layerInfo.id]["stylesObj"] = [EnumDefaultStyle.LineStyle];
                                        layerStyles[layerInfo.id].symbolStyles = layerInfo["symbolStyles"] = [EnumDefaultStyle.LineStyle];
                                    } else {
                                        layerStyles[layerInfo.id]["stylesObj"] = [EnumDefaultStyle.FillStyle];
                                        layerStyles[layerInfo.id].symbolStyles = layerInfo["symbolStyles"] = [EnumDefaultStyle.FillStyle];
                                    }
                                    if (layerInfo.is_label_visible) {
                                        if (layerInfo["label_styles"]) {
                                            OGMapUtils.geoStylerStyleToOlStyle(JSON.parse(layerInfo["label_styles"])).then(labelStyle => {
                                                if (typeof (labelStyle) === "function") {
                                                    const s = labelStyle();
                                                    if (s && s.length > 0) {
                                                        labelStyle = s[0];
                                                    }
                                                }
                                                if (labelStyle) {
                                                    layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = labelStyle;
                                                    if (layerStyles[layerInfo.id].stylesObj && layerStyles[layerInfo.id].stylesObj.length > 0) {
                                                        layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [labelStyle, layerStyles[layerInfo.id].stylesObj[0]];
                                                    }
                                                } else {
                                                    layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = EnumDefaultStyle.TextStyle;
                                                    layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [EnumDefaultStyle.TextStyle, layerStyles[layerInfo.id].stylesObj[0]];
                                                }

                                                resolve(true);
                                            });
                                        } else {
                                            layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = EnumDefaultStyle.TextStyle;
                                            if (layerStyles[layerInfo.id].stylesObj && layerStyles[layerInfo.id].stylesObj.length > 0) {
                                                layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [EnumDefaultStyle.TextStyle, layerStyles[layerInfo.id].stylesObj[0]];
                                            }
                                            resolve(true);
                                        }
                                    } else {
                                        resolve(true);
                                    }
                                }
                            }));
                        } else if (layerInfo.layer_type === "wms") {
                            wms.push(layerInfo.id);
                            if (layerInfo.is_visible) {
                                visibleWms.push(layerInfo.id);
                            }
                        }
                    }
                }
            });
        });
        Promise.all(layerStylesPromises).then(() => {
            const styleCache = {};
            const getStyle = (feature, resolution): Style | Style[] => {
                const layerId = feature.getProperties().layer_id;
                const geometry = feature.getGeometry();
                const layerInfo: OGLayerModel = layerInfos[layerId];
                const layerStyle = layerStyles[layerId];
                const classifyStyle = classifyStyles[layerId];
                const isArrowVisble = resolution * 100000 < 1 && layerInfo?.show_line_arrow;
                const isLabelVisible = resolution * 100000 < 1;
                const classifyColumn = layerInfo?.classify_column;
                if (geometry instanceof Point || geometry instanceof MultiPoint) {
                    if (feature.get("features")) {
                        const size = feature.get("features").length;
                        let style = styleCache[size];
                        if (!style) {
                            if (size > 1) {
                                style = styleCache[size] = this.getClusterStyle(size);
                            } else {
                                const originalFeature = feature.get("features")[0];
                                const originalStyle = layerStyles[originalFeature.getProperties().layer_id];
                                // classifyStyle = classifyStyles[originalFeature.getProperties().layer_id];
                                // if (classifyStyle && Object.keys(classifyStyle).length > 0) {
                                //     originalStyle = classifyStyle[originalFeature.getProperties().classify_value];
                                // }
                                // else {
                                //     originalStyle = layerStyles[originalFeature.getProperties().layer_id];
                                // }
                                if (originalStyle) {
                                    if (originalStyle.labelStyle) {
                                        if (isLabelVisible) {
                                            const text = (originalFeature.get("label") !== undefined && originalFeature.get("label") !== null) ? originalFeature.get("label").toString() : "";
                                            originalStyle.labelStyle.getText().setText(text);
                                        } else {
                                            originalStyle.labelStyle.getText().setText("");
                                        }
                                    }
                                    style = originalStyle.stylesObj;
                                }
                            }
                        }
                        return style;
                    } else {
                        if (classifyStyle && Object.keys(classifyStyle).length > 0) {
                            let classifiedStyle: Style = classifyStyle[feature.getProperties().classify_value] ?? layerStyle.stylesObj;
                            if (classifyColumn?.data_type === EnumDataType.integer || classifyColumn?.data_type === EnumDataType.smallint) {
                                classifiedStyle = classifyStyle[parseInt(feature.getProperties().classify_value)] ?? layerStyle.stylesObj;
                            } else if (classifyColumn?.data_type === EnumDataType.double) {
                                classifiedStyle = classifyStyle[parseFloat(feature.getProperties().classify_value)] ?? layerStyle.stylesObj;
                            }
                            if (layerStyle.labelStyle) {
                                if (isLabelVisible) {
                                    const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                    layerStyle.labelStyle.getText().setText(text);
                                } else {
                                    layerStyle.labelStyle.getText().setText("");
                                }
                                return [layerStyle.labelStyle, classifiedStyle];
                            } else {
                                return classifiedStyle;
                            }
                        } else {
                            if (layerStyle) {
                                if (layerStyle.labelStyle) {
                                    if (isLabelVisible) {
                                        const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                        layerStyle.labelStyle.getText().setText(text);
                                    } else {
                                        layerStyle.labelStyle.getText().setText("");
                                    }
                                }
                                return layerStyle.stylesObj;
                            } else {
                                console.log(feature);
                            }
                        }
                    }
                } else if (geometry instanceof LineString || geometry instanceof MultiLineString) {
                    if (classifyStyle && Object.keys(classifyStyle).length > 0) {
                        let classifyStyleValue = classifyStyle[feature.getProperties().classify_value] ?? EnumDefaultStyle.LineStyle;
                        if (classifyColumn?.data_type === EnumDataType.integer || classifyColumn?.data_type === EnumDataType.smallint) {
                            classifyStyleValue = classifyStyle[parseInt(feature.getProperties().classify_value)] ?? EnumDefaultStyle.LineStyle;
                        } else if (classifyColumn?.data_type === EnumDataType.double) {
                            classifyStyleValue = classifyStyle[parseFloat(feature.getProperties().classify_value)] ?? EnumDefaultStyle.LineStyle;
                        }
                        const clonedStyles = isArrowVisble ? this.buildArrowStyles(geometry) : [];

                        if (layerStyle.labelStyle) {
                            const textStyle: Text = layerStyle.labelStyle.getText() as Text;
                            if (isLabelVisible) {
                                const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                textStyle.setText(text);
                                textStyle.setRepeat(80);
                            } else {
                                textStyle.setText("");
                            }
                            clonedStyles.push(layerStyle.labelStyle);
                        }

                        if (isArrowVisble) {
                            if (classifyStyleValue) {
                                clonedStyles.push(classifyStyleValue);
                            }
                        } else {
                            clonedStyles.push(classifyStyleValue);
                        }

                        return clonedStyles;
                    } else {
                        if (layerStyle) {
                            const clonedStyles = layerStyle.stylesObj.slice();
                            if (layerStyle.labelStyle) {
                                const textStyle: Text = layerStyle.labelStyle.getText() as Text;
                                if (isLabelVisible) {
                                    const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                    textStyle.setText(text);
                                    textStyle.setRepeat(500);
                                } else {
                                    textStyle.setText("");
                                }
                                clonedStyles.push(layerStyle.labelStyle);
                            }

                            if (isArrowVisble) {
                                return clonedStyles.concat(this.buildArrowStyles(geometry));
                            } else {
                                return clonedStyles;
                            }
                        } else {
                            console.log(feature);
                        }
                    }
                } else if (geometry instanceof Polygon || geometry instanceof MultiPolygon) {
                    if (classifyStyle && Object.keys(classifyStyle).length > 0) {
                        let classifyStyleValue = classifyStyle[feature.getProperties().classify_value] ?? EnumDefaultStyle.FillStyle;
                        if (classifyColumn?.data_type === EnumDataType.integer || classifyColumn?.data_type === EnumDataType.smallint) {
                            classifyStyleValue = classifyStyle[parseInt(feature.getProperties().classify_value)] ?? EnumDefaultStyle.FillStyle;
                        } else if (classifyColumn?.data_type === EnumDataType.double) {
                            classifyStyleValue = classifyStyle[parseFloat(feature.getProperties().classify_value)] ?? EnumDefaultStyle.FillStyle;
                        }
                        if (layerStyle.labelStyle) {
                            if (isLabelVisible) {
                                const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                layerStyle.labelStyle.getText().setText(text);
                            } else {
                                layerStyle.labelStyle.getText().setText("");
                            }
                            return [layerStyle.labelStyle, classifyStyleValue];
                        } else {
                            //
                        }
                    }
                    else {
                        if (layerStyle) {
                            if (layerStyle.labelStyle) {
                                const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                if (isLabelVisible) {
                                    layerStyle.labelStyle.getText().setText(text);
                                } else {
                                    layerStyle.labelStyle.getText().setText("");
                                }
                            }
                            return layerStyle.stylesObj ?? [];
                        } else {
                            console.log(feature);
                        }
                    }
                    console.log(feature);
                }
            };
            Object.entries(layerInfos).forEach(([key, layerInfo]) => {
                if (layerInfo.layer_type === "vector") {
                    if (layerInfo.geometry === "Point") {
                        pointLayerInfos[key] = layerInfo;
                    } else if (layerInfo.geometry === "MultiPoint") {
                        multiPointLayerInfos[key] = layerInfo;
                    } else if (layerInfo.geometry === "LineString" || layerInfo.geometry === "MultiLineString") {
                        lineLayerInfos[key] = layerInfo;
                    } else if (layerInfo.geometry === "Polygon" || layerInfo.geometry === "MultiPolygon") {
                        polygonLayerInfos[key] = layerInfo;
                    }
                } else if (layerInfo.layer_type === "wms") {
                    wmsInfos.push(layerInfo);
                }
            });
            if (wms.length > 0) {
                wmsInfos.sort((a, b) => {
                    const a1 = a.order, b1 = b.order;
                    if (a1 === b1) return 0;
                    return a1 > b1 ? 1 : -1;
                });
                $.each(wmsInfos.reverse(), (idx, wmsInfo) => {
                    const wmsLayer = new TileLayer({
                        source: new TileWMS({
                            crossOrigin: "anonymous",
                            params: JSON.parse(wmsInfo.params) || {},
                            transition: 0,
                            url: wmsInfo.url
                        }),
                        visible: wmsInfo.is_visible
                    });
                    wmsLayer.set("allowIdentify", true, true);
                    wmsLayer.set("id", wmsInfo.id, true);
                    wmsLayer.set("layerInfo", wmsInfo, true);
                    wmsLayer.set("name", wmsInfo.name, true);
                    wmsLayer.set("onIdentifyClick", (feature) => {
                        const keyColumn = wmsInfo.table.key_column ?? wmsInfo.table.identity_column;
                        const id = keyColumn ? feature.get(keyColumn.column_name) : 0;
                        // this.identify.identify(wmsInfo.id, id);
                        this.identify.identifyRowFeature(id, wmsInfo.id, wmsInfo.name_vn, true);
                    }, true);
                    this.oGMap.addLayer(wmsLayer);
                });
            }
            if (polygonLayers.length > 0) {
                let xhr;
                this.polygonLayer = new VectorImageLayer({
                    declutter: false,
                    // maxZoom: 23,
                    // minZoom: 17,
                    source: new VectorSource({
                        format: new GeoJSON(),
                        loader: (extent, resolution, projection, success, failure) => {
                            if (this.polygonLayer.get("layerVisibles") && this.polygonLayer.get("layerVisibles").length > 0) {
                                const proj = projection.getCode();
                                const formData = new FormData();
                                formData.append("geometry", "polygon");
                                formData.append("layers", this.polygonLayer.get("layerVisibles").toString());
                                formData.append("classifies", this.polygonClassifyValues.toString());
                                formData.append("z", this.oGMap.getZoom().toString());
                                formData.append("bbox", OGMapProjection.projectMapGeom(extent).toString());
                                // formData.append("maxFeatures", maxFeatures.toString());
                                if (this.filterGeometry) {
                                    formData.append("filterGeometry", this.filterGeometry);
                                }
                                if (this.params) {
                                    formData.append("params", JSON.stringify(this.params));
                                    if (this.layerFilterIds) {
                                        formData.append("layerFilterIds", this.layerFilterIds);
                                    }
                                }
                                const url = "/api/map/wfsGeoBuf";
                                if (xhr && (xhr.readyState !== 0 || xhr.readFeatures !== 4)) {
                                    xhr.abort();
                                }
                                xhr = new XMLHttpRequest();
                                xhr.responseType = "arraybuffer";
                                xhr.open("POST", url);
                                const onError = (): void => {
                                    this.polygonLayer.getSource().removeLoadedExtent(extent);
                                    failure();
                                };
                                xhr.onerror = onError;
                                xhr.onload = () => {
                                    if (xhr.status === 200) {
                                        // const data = new Uint8Array(xhr.response);
                                        // if (data.length > 0) {
                                        //     const decoded = flatgeobuf.geojson.deserialize(data);
                                        //     const features = OGMapUtils.parseGeoJSON(decoded);
                                        //     this.polygonLayer.getSource().addFeatures(features);
                                        //     success(features);
                                        // } else {
                                        //     onError();
                                        // }
                                        const decoded = geobuf.decode(new Pbf(xhr.response));
                                        const features = OGMapUtils.parseGeoJSON(decoded);
                                        this.polygonLayer.getSource().addFeatures(features);
                                        success(features);
                                    } else {
                                        onError();
                                    }
                                };
                                xhr.send(formData);
                            }
                        },
                        strategy: bboxStrategy,
                    }),
                    style: getStyle,
                });

                this.polygonLayer.set("allowIdentify", true);
                this.polygonLayer.set("layerInfos", polygonLayerInfos);
                this.polygonLayer.set("layerVisibles", visiblePolygonLayers);

                this.polygonLayer.set("onIdentifyClick", (feature) => {
                    this.identify.identifyFeature(feature);
                }, true);
                this.polygonLayer.set("identifyFeatureById", (id) => {
                    const originalFeature = this.polygonLayer.getSource().getFeatureById(id);
                    if (originalFeature) {
                        this.identify.identifyFeature(originalFeature);
                    }
                }, true);
                this.polygonLayer.set("identifyFeature", (feature) => {
                    this.identify.identifyFeature(feature);
                }, true);

                this.oGMap.addLayer(this.polygonLayer);

                $.each(layerInfos, (idx, layerInfo) => {
                    if (layerInfo.geometry === "Polygon" || layerInfo.geometry === "MultiPolygon") {
                        layerInfo.layer = this.polygonLayer;
                    }
                });
            }
            if (lineLayers.length > 0) {
                let xhr;
                this.lineLayer = new VectorLayer({
                    // maxZoom: 23,
                    // minZoom: 16,
                    source: new VectorSource({
                        format: new GeoJSON(),
                        loader: (extent, resolution, projection, success, failure) => {
                            if (this.lineLayer.get("layerVisibles") && this.lineLayer.get("layerVisibles").length > 0) {
                                const proj = projection.getCode();
                                const formData = new FormData();
                                formData.append("geometry", "line_string");
                                formData.append("layers", this.lineLayer.get("layerVisibles").toString());
                                formData.append("classifies", this.lineStringClassifyValues.toString());
                                formData.append("z", this.oGMap.getZoom().toString());
                                formData.append("bbox", OGMapProjection.projectMapGeom(extent).toString());
                                if (this.filterGeometry) {
                                    formData.append("filterGeometry", this.filterGeometry);
                                }
                                if (this.params) {
                                    formData.append("params", JSON.stringify(this.params));
                                    if (this.layerFilterIds) {
                                        formData.append("layerFilterIds", this.layerFilterIds);
                                    }
                                }
                                const url = "/api/map/wfsGeoBuf";
                                if (xhr && (xhr.readyState !== 0 || xhr.readFeatures !== 4)) {
                                    xhr.abort();
                                }
                                xhr = new XMLHttpRequest();
                                xhr.responseType = "arraybuffer";
                                xhr.open("POST", url);
                                const onError = (): void => {
                                    this.lineLayer.getSource().removeLoadedExtent(extent);
                                    failure();
                                };
                                xhr.onerror = onError;
                                xhr.onload = () => {
                                    if (xhr.status === 200) {
                                        // const data = new Uint8Array(xhr.response);
                                        // if (data.length > 0) {
                                        //     const decoded = flatgeobuf.geojson.deserialize(data);
                                        //     const features = OGMapUtils.parseGeoJSON(decoded);
                                        //     this.lineLayer.getSource().addFeatures(features);
                                        //     success(features);
                                        // } else {
                                        //     onError();
                                        // }
                                        const decoded = geobuf.decode(new Pbf(xhr.response));
                                        const features = OGMapUtils.parseGeoJSON(decoded);
                                        this.lineLayer.getSource().addFeatures(features);
                                        success(features);
                                    } else {
                                        onError();
                                    }
                                };
                                xhr.send(formData);
                            }
                        },
                        strategy: bboxStrategy,
                    }),
                    style: getStyle,
                    // zIndex: 500
                });
                this.lineLayer.set("allowIdentify", true);
                this.lineLayer.set("layerInfos", lineLayerInfos);
                this.lineLayer.set("layerVisibles", visibleLineLayers);
                this.lineLayer.set("onIdentifyClick", (feature) => {
                    this.identify.identifyFeature(feature);
                }, true);
                this.lineLayer.set("identifyFeatureById", (id) => {
                    const originalFeature = this.lineLayer.getSource().getFeatureById(id);
                    if (originalFeature) {
                        this.identify.identifyFeature(originalFeature);
                    }
                }, true);
                this.lineLayer.set("identifyFeature", (feature) => {
                    this.identify.identifyFeature(feature);
                }, true);

                this.oGMap.addLayer(this.lineLayer);

                $.each(layerInfos, (idx, layerInfo) => {
                    if (layerInfo.geometry === "LineString" || layerInfo.geometry === "MultiLineString") {
                        layerInfo.layer = this.lineLayer;
                    }
                });
            }
            if (pointLayers.length > 0) {
                let xhr: XMLHttpRequest;
                if (this.cluster) {
                    this.clusterPointSource = new ClusterSource({
                        distance: 20,
                        source: new VectorSource({
                            format: new GeoJSON(),
                            loader: (extent, resolution, projection, success, failure) => {
                                if (this.clusterPointLayer.get("layerVisibles") && this.clusterPointLayer.get("layerVisibles").length > 0) {
                                    const proj = projection.getCode();
                                    const formData = new FormData();
                                    formData.append("geometry", "point");
                                    formData.append("layers", this.clusterPointLayer.get("layerVisibles").toString());
                                    formData.append("classifies", this.pointClassifyValues.toString());
                                    formData.append("z", this.oGMap.getZoom().toString());
                                    formData.append("bbox", OGMapProjection.projectMapGeom(extent).toString());
                                    // formData.append("maxFeatures", "5000");
                                    if (this.filterGeometry) {
                                        formData.append("filterGeometry", this.filterGeometry);
                                    }
                                    if (this.params) {
                                        formData.append("params", JSON.stringify(this.params));
                                        if (this.layerFilterIds) {
                                            formData.append("layerFilterIds", this.layerFilterIds);
                                        }
                                    }
                                    const url = "/api/map/wfsGeoBuf";
                                    if (xhr && (xhr.readyState !== 0 || xhr["readFeatures"] !== 4)) {
                                        xhr.abort();
                                    }
                                    xhr = new XMLHttpRequest();
                                    xhr.responseType = "arraybuffer";
                                    xhr.open("POST", url);
                                    const onError = (): void => {
                                        this.clusterPointLayer.getSource().removeLoadedExtent(extent);
                                        failure();
                                    };
                                    xhr.onerror = onError;
                                    xhr.onload = () => {
                                        if (xhr.status === 200) {
                                            // const data = new Uint8Array(xhr.response);
                                            // if (data.length > 0) {
                                            //     const decoded = flatgeobuf.geojson.deserialize(data);
                                            //     const features = OGMapUtils.parseGeoJSON(decoded);
                                            //     this.clusterPointSource.getSource().addFeatures(features);
                                            //     success(features);
                                            // } else {
                                            //     onError();
                                            // }
                                            const decoded = geobuf.decode(new Pbf(xhr.response));
                                            const features = OGMapUtils.parseGeoJSON(decoded);
                                            this.clusterPointSource.getSource().addFeatures(features);
                                            success(features);
                                        } else {
                                            onError();
                                        }
                                    };
                                    xhr.send(formData);
                                } else {
                                    success([]);
                                }
                            },
                            strategy: bboxStrategy,
                        }),
                    });
                    this.clusterPointLayer = new AnimatedCluster({
                        animationDuration: 300,
                        // source: this.clusterPointSource,
                        // style: getStyle,
                        // zIndex: 999,
                    } as ClusterOptions);
                    this.clusterPointLayer.set("allowIdentify", true);
                    this.clusterPointLayer.set("layerInfos", pointLayerInfos);
                    this.clusterPointLayer.set("layerVisibles", visiblePointLayers);
                    this.clusterPointLayer.set("name", "ClusterPoint");
                    this.clusterPointLayer.set("onIdentifyClusterClick", (feature) => {
                        this.identify.identifyFeature(feature);
                    }, true);
                    this.clusterPointLayer.set("identifyFeatureById", (id) => {
                        const originalFeature = this.clusterPointLayer.getSource().getFeatureById(id);
                        if (originalFeature) {
                            this.identify.identifyFeature(originalFeature);
                        }
                    }, true);
                    this.clusterPointLayer.set("identifyFeature", (feature) => {
                        this.identify.identifyFeature(feature);
                    }, true);

                    this.oGMap.addLayer(this.clusterPointLayer);

                    $.each(layerInfos, (idx, layerInfo) => {
                        if (layerInfo.geometry === "Point" || layerInfo.geometry === "MultiPoint") {
                            layerInfo.layer = this.clusterPointLayer;
                        }
                    });
                } else {
                    this.pointSource = new VectorSource({
                        format: new GeoJSON(),
                        loader: (extent, resolution, projection, success, failure) => {
                            if (this.pointLayer.get("layerVisibles") && this.pointLayer.get("layerVisibles").length > 0) {
                                const proj = projection.getCode();
                                const formData = new FormData();
                                formData.append("geometry", "point");
                                formData.append("layers", this.pointLayer.get("layerVisibles").toString());
                                formData.append("classifies", this.pointClassifyValues.toString());
                                formData.append("z", this.oGMap.getZoom().toString());
                                formData.append("bbox", OGMapProjection.projectMapGeom(extent).toString());
                                if (this.filterGeometry) {
                                    formData.append("filterGeometry", this.filterGeometry);
                                }
                                if (this.params) {
                                    formData.append("params", JSON.stringify(this.params));
                                    if (this.layerFilterIds) {
                                        formData.append("layerFilterIds", this.layerFilterIds);
                                    }
                                }
                                const url = "/api/map/wfsGeoBuf";
                                if (xhr && (xhr.readyState !== 0 || xhr["readFeatures"] !== 4)) {
                                    xhr.abort();
                                }
                                xhr = new XMLHttpRequest();
                                xhr.responseType = "arraybuffer";
                                xhr.open("POST", url);
                                const onError = (): void => {
                                    this.pointLayer.getSource().removeLoadedExtent(extent);
                                    failure();
                                };
                                xhr.onerror = onError;
                                xhr.onload = () => {
                                    if (xhr.status === 200) {
                                        // const data = xhr.response;
                                        // if (data.length) {
                                        //     const decoded = geobuf.decode(data);
                                        //     const features = OGMapUtils.parseGeoJSON(decoded);
                                        //     this.pointLayer.getSource().addFeatures(features);
                                        //     success(features);
                                        // } else {
                                        //     onError();
                                        // }
                                        const decoded = geobuf.decode(new Pbf(xhr.response));
                                        const features = OGMapUtils.parseGeoJSON(decoded);
                                        this.pointLayer.getSource().addFeatures(features);
                                        success(features);
                                    } else {
                                        onError();
                                    }
                                };
                                xhr.send(formData);
                            } else {
                                success([]);
                            }
                        },
                        strategy: bboxStrategy,
                    });

                    this.pointLayer = new VectorImageLayer({
                        // maxZoom: 23,
                        // minZoom: 15,
                        source: this.pointSource,
                        style: getStyle,
                        // zIndex: 999
                    });

                    this.pointLayer.set("allowIdentify", true);
                    this.pointLayer.set("layerInfos", pointLayerInfos);
                    this.pointLayer.set("layerVisibles", visiblePointLayers);
                    this.pointLayer.set("name", "ClusterPoint");
                    this.pointLayer.set("onIdentifyClick", (feature) => {
                        this.identify.identifyFeature(feature, true);
                    }, true);
                    this.pointLayer.set("identifyFeatureById", (id) => {
                        const originalFeature = this.pointSource.getFeatureById(id);
                        if (originalFeature) {
                            this.identify.identifyFeature(originalFeature);
                        }
                    }, true);
                    this.pointLayer.set("identifyFeature", (feature) => {
                        this.identify.identifyFeature(feature);
                    }, true);

                    this.oGMap.addLayer(this.pointLayer);

                    $.each(layerInfos, (idx, layerInfo) => {
                        if (layerInfo.geometry === "Point" || layerInfo.geometry === "MultiPoint") {
                            layerInfo.layer = this.pointLayer;
                        }
                    });
                }
            }
            if (multiPointLayers.length > 0) {
                let xhr;
                this.multiPointSource = new ClusterSource({
                    distance: 40,
                    // geometryFunction: (feature) => {
                    //     return new Point(getCenter(feature.getGeometry().getExtent()));
                    // },
                    source: new VectorSource({
                        format: new GeoJSON(),
                        loader: (extent, resolution, projection, success, failure) => {
                            if (this.multiPointLayer.get("layerVisibles") && this.multiPointLayer.get("layerVisibles").length > 0) {
                                const proj = projection.getCode();
                                const formData = new FormData();
                                formData.append("geometry", "multi_point");
                                formData.append("layers", this.multiPointLayer.get("layerVisibles").toString());
                                formData.append("classifies", this.multiPointClassifyValues.toString());
                                formData.append("z", this.oGMap.getZoom().toString());
                                formData.append("bbox", OGMapProjection.projectMapGeom(extent).toString());
                                formData.append("srid", proj);
                                if (this.filterGeometry) {
                                    formData.append("filterGeometry", this.filterGeometry);
                                }
                                if (this.params) {
                                    formData.append("params", JSON.stringify(this.params));
                                    if (this.layerFilterIds) {
                                        formData.append("layerFilterIds", this.layerFilterIds);
                                    }
                                }
                                const url = "/api/map/wfsGeoBuf";
                                if (xhr && (xhr.readyState !== 0 || xhr.readFeatures !== 4)) {
                                    xhr.abort();
                                }
                                OGUtils.showLoading();
                                xhr = new XMLHttpRequest();
                                xhr.responseType = "arraybuffer";
                                xhr.open("POST", url);
                                const onError = (): void => {
                                    this.multiPointLayer.getSource().removeLoadedExtent(extent);
                                    failure();
                                };
                                xhr.onerror = onError;
                                xhr.onload = () => {
                                    if (xhr.status === 200) {
                                        // const data = new Uint8Array(xhr.response);
                                        // if (data.length > 0) {
                                        //     const decoded = flatgeobuf.geojson.deserialize(data);
                                        //     const features = OGMapUtils.parseGeoJSON(decoded);
                                        //     this.multiPointSource.getSource().addFeatures(features);
                                        //     success(features);
                                        // } else {
                                        //     onError();
                                        // }
                                        const decoded = geobuf.decode(new Pbf(xhr.response));
                                        const features = OGMapUtils.parseGeoJSON(decoded);
                                        this.multiPointSource.getSource().addFeatures(features);
                                        success(features);
                                    } else {
                                        onError();
                                    }
                                    OGUtils.hideLoading();
                                };
                                xhr.send(formData);
                            } else {
                                success([]);
                            }
                        },
                        strategy: bboxStrategy,
                    })
                });
                this.multiPointLayer = new AnimatedCluster({
                    animationDuration: 300,
                    // source: this.multiPointSource,
                    // style: getStyle
                });

                this.multiPointLayer.set("allowIdentify", true);
                this.multiPointLayer.set("layerInfos", pointLayerInfos);
                this.multiPointLayer.set("layerVisibles", visiblePointLayers);
                this.multiPointLayer.set("onIdentifyClusterClick", (feature) => {
                    this.identify.identifyFeature(feature);
                }, true);
                this.multiPointLayer.set("identifyFeatureById", (id) => {
                    const originalFeature = this.multiPointLayer.getSource().getFeatureById(id);
                    if (originalFeature) {
                        this.identify.identifyFeature(originalFeature);
                    }
                }, true);
                this.multiPointLayer.set("identifyFeature", (feature) => {
                    this.identify.identifyFeature(feature);
                }, true);

                this.oGMap.addLayer(this.multiPointLayer);

                $.each(layerInfos, (idx, layerInfo) => {
                    if (layerInfo.geometry === "MultiPoint") {
                        layerInfo.layer = this.multiPointLayer;
                    }
                });
            }
        });
    }
    private renderLayers(items: LayerGroupTreeItem[]): void {
        if (this.isRenderCompositeLayer) {
            this.renderCompositeLayers(items);
        } else {
            this.renderSeparateLayers(items);
        }
    }
    private renderSeparateLayers(items: LayerGroupTreeItem[]): void {
        const multiPointLayers: number[] = [], pointLayers: number[] = [], lineLayers: number[] = [], polygonLayers: number[] = [];
        const visibleMultiPointLayers: number[] = [], visiblePointLayers: number[] = [], visibleLineLayers: number[] = [], visiblePolygonLayers: number[] = [];
        const layerInfos: { [key: number]: OGLayerModel } = {}, wmsInfos = [],
            multiPointLayerInfos = {}, pointLayerInfos = {}, lineLayerInfos = {}, polygonLayerInfos = {},
            layerStyles: { [key: string]: { labelStyle?: Style, stylesObj?: Style[], symbolStyles?: Style[] } } = {}, classifyStyles = {};
        const layerStylesPromises = [];
        const wms = [], visibleWms = [];

        items.forEach((item) => {
            if (item.items.length === 0) {
                return;
            }
            item.items.forEach((i: LayerTreeItem) => {
                if (i.type === "@tilelayer") {
                    const data: OGTileLayerModel = i.raw as OGTileLayerModel;
                    if (data.type === "xyz") {
                        const tileXyz = new TileLayer({
                            source: new XYZ({
                                crossOrigin: "anonymous",
                                url: data.url,
                            }),
                            visible: data.visible,
                        });
                        tileXyz.set("data", data, true);
                        tileXyz.set("id", data.id, true);
                        tileXyz.set("name", data.name, true);
                        this.oGMap.addLayer(tileXyz);
                    }
                }
                else if (i.raw) {
                    const layerInfo: OGLayerModel = layerInfos[i.raw.id] = i.raw as OGLayerModel;
                    if (layerInfo.layer_type === "vector") {
                        if (layerInfo.geometry === "Point") {
                            pointLayers.push(layerInfo.id);
                            if (layerInfo.is_visible) {
                                visiblePointLayers.push(layerInfo.id);
                            }
                        } else if (layerInfo.geometry === "MultiPoint") {
                            multiPointLayers.push(layerInfo.id);
                            if (layerInfo.is_visible) {
                                visibleMultiPointLayers.push(layerInfo.id);
                            }
                        } else if (layerInfo.geometry === "LineString" || layerInfo.geometry === "MultiLineString") {
                            lineLayers.push(layerInfo.id);
                            if (layerInfo.is_visible) {
                                visibleLineLayers.push(layerInfo.id);
                            }
                        } else if (layerInfo.geometry === "Polygon" || layerInfo.geometry === "MultiPolygon") {
                            polygonLayers.push(layerInfo.id);
                            if (layerInfo.is_visible) {
                                visiblePolygonLayers.push(layerInfo.id);
                            }
                        }

                        classifyStyles[layerInfo.id] = {};
                        layerStyles[layerInfo.id] = {};
                        layerStylesPromises.push(new Promise((resolve) => {
                            if (layerInfo["classify_column_id"] && layerInfo["classify_column_id"]) {
                                $.each(layerInfo["layer_classify"], (idx, classify) => {
                                    try {
                                        if (classify.style) {
                                            OGMapUtils.geoStylerStyleToOlStyle(JSON.parse(classify.style)).then(style => {
                                                classifyStyles[layerInfo.id][classify.value] = style;
                                            });
                                        }
                                    } catch (e) { console.error(e); }
                                });
                            }
                            if (layerInfo.styles) {
                                try {
                                    OGMapUtils.geoStylerStyleToOlStyle(JSON.parse(layerInfo.styles)).then(style => {
                                        if (style instanceof Style) {
                                            if (style.getImage() instanceof Icon) {
                                                (style.getImage() as Icon).setAnchor([layerInfo["styles_anchor_x"], layerInfo["styles_anchor_y"]]);
                                            }
                                            if (layerInfo.is_label_visible) {
                                                if (layerInfo["label_styles"]) {
                                                    OGMapUtils.geoStylerStyleToOlStyle(JSON.parse(layerInfo["label_styles"])).then(labelStyle => {
                                                        if (typeof (labelStyle) === "function") {
                                                            const s = labelStyle();
                                                            if (s && s.length > 0) {
                                                                labelStyle = s[0];
                                                            }
                                                        }
                                                        if (labelStyle) {
                                                            layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = labelStyle as Style;
                                                            layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [labelStyle as Style, style];
                                                        } else {
                                                            layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = EnumDefaultStyle.TextStyle;
                                                            layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [EnumDefaultStyle.TextStyle, style];
                                                        }

                                                        resolve(true);
                                                    });
                                                } else {
                                                    layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = EnumDefaultStyle.TextStyle;
                                                    layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [EnumDefaultStyle.TextStyle, style];

                                                    resolve(true);
                                                }
                                            } else {
                                                layerStyles[layerInfo.id]["stylesObj"] = [style];
                                                resolve(true);
                                            }

                                            layerStyles[layerInfo.id].symbolStyles = layerInfo["symbolStyles"] = [style];
                                        }
                                    });
                                }
                                catch (e) {
                                    console.log("Error parse style: " + layerInfo["name_vn"] + " " + e);
                                }
                            } else {
                                if (layerInfo["geometry"] === EnumGeometry.Point || layerInfo["geometry"] === EnumGeometry.MultiPoint) {
                                    layerStyles[layerInfo.id]["stylesObj"] = [EnumDefaultStyle.PointStyle];
                                    layerStyles[layerInfo.id].symbolStyles = layerInfo["symbolStyles"] = [EnumDefaultStyle.PointStyle];
                                } else if (layerInfo["geometry"] === EnumGeometry.LineString || layerInfo["geometry"] === EnumGeometry.MultiLineString) {
                                    layerStyles[layerInfo.id]["stylesObj"] = [EnumDefaultStyle.LineStyle];
                                    layerStyles[layerInfo.id].symbolStyles = layerInfo["symbolStyles"] = [EnumDefaultStyle.LineStyle];
                                } else {
                                    layerStyles[layerInfo.id]["stylesObj"] = [EnumDefaultStyle.FillStyle];
                                    layerStyles[layerInfo.id].symbolStyles = layerInfo["symbolStyles"] = [EnumDefaultStyle.FillStyle];
                                }
                                if (layerInfo.is_label_visible) {
                                    if (layerInfo["label_styles"]) {
                                        OGMapUtils.geoStylerStyleToOlStyle(JSON.parse(layerInfo["label_styles"])).then(labelStyle => {
                                            if (typeof (labelStyle) === "function") {
                                                const s = labelStyle();
                                                if (s && s.length > 0) {
                                                    labelStyle = s[0];
                                                }
                                            }
                                            if (labelStyle) {
                                                layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = labelStyle as Style;
                                                if (layerStyles[layerInfo.id].stylesObj && layerStyles[layerInfo.id].stylesObj.length > 0) {
                                                    layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [labelStyle as Style, layerStyles[layerInfo.id].stylesObj[0]];
                                                }
                                            } else {
                                                layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = EnumDefaultStyle.TextStyle;
                                                layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [EnumDefaultStyle.TextStyle, layerStyles[layerInfo.id].stylesObj[0]];
                                            }

                                            resolve(true);
                                        });
                                    } else {
                                        layerStyles[layerInfo.id].labelStyle = layerInfo["labelStyle"] = EnumDefaultStyle.TextStyle;
                                        if (layerStyles[layerInfo.id].stylesObj && layerStyles[layerInfo.id].stylesObj.length > 0) {
                                            layerStyles[layerInfo.id].stylesObj = layerInfo["stylesObj"] = [EnumDefaultStyle.TextStyle, layerStyles[layerInfo.id].stylesObj[0]];
                                        }
                                        resolve(true);
                                    }
                                } else {
                                    resolve(true);
                                }
                            }
                        }));
                    } else if (layerInfo.layer_type === "wms") {
                        wms.push(layerInfo.id);
                        if (layerInfo.is_visible) {
                            visibleWms.push(layerInfo.id);
                        }
                    }
                }
            });
        });
        Promise.all(layerStylesPromises).then(() => {
            const styleCache = {};
            const getStyle = (feature, resolution, layerId: number): Style | Style[] => {
                const z = this.oGMap.olMap.getView().getZoomForResolution(resolution);
                const geometry = feature.getGeometry();
                const layerInfo = layerInfos[layerId];
                const layerStyle = layerStyles[layerId];
                const classifyStyle = classifyStyles[layerId];
                const isArrowVisible = layerInfo?.show_line_arrow;
                const isLabelVisible = z >= layerInfo.label_min_zoom && z <= layerInfo.label_max_zoom;
                if (geometry instanceof Point || geometry instanceof MultiPoint || geometry.getType() === "Point" || geometry.getType() === "MultiPoint") {
                    if (feature.get("features")) {
                        const size = feature.get("features").length;
                        let style = styleCache[size];
                        if (!style) {
                            if (size > 1) {
                                style = styleCache[size] = this.getClusterStyle(size);
                            } else {
                                const originalFeature = feature.get("features")[0];
                                const originalStyle = layerStyles[originalFeature.getProperties().layer_id];
                                // classifyStyle = classifyStyles[originalFeature.getProperties().layer_id];
                                // if (classifyStyle && Object.keys(classifyStyle).length > 0) {
                                //     originalStyle = classifyStyle[originalFeature.getProperties().classify_value];
                                // }
                                // else {
                                //     originalStyle = layerStyles[originalFeature.getProperties().layer_id];
                                // }
                                if (originalStyle) {
                                    if (originalStyle.labelStyle) {
                                        if (isLabelVisible) {
                                            const text = (originalFeature.get("label") !== undefined && originalFeature.get("label") !== null) ? originalFeature.get("label").toString() : "";
                                            originalStyle.labelStyle.getText().setText(text);
                                        } else {
                                            originalStyle.labelStyle.getText().setText("");
                                        }
                                    }
                                    style = originalStyle.stylesObj;
                                }
                            }
                        }
                        return style;
                    } else {
                        if (classifyStyle && Object.keys(classifyStyle).length > 0) {
                            const classifiedStyle = classifyStyle[feature.get("classify_value")] ?? (layerStyle.symbolStyles ? layerStyle.symbolStyles[0] : undefined) ?? EnumDefaultStyle.PointStyle;
                            if (layerStyle.labelStyle) {
                                if (isLabelVisible) {
                                    const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                    layerStyle.labelStyle.getText().setText(text);
                                } else {
                                    layerStyle.labelStyle.getText().setText("");
                                }
                                return [layerStyle.labelStyle, classifiedStyle];
                            } else {
                                return classifiedStyle;
                            }
                        } else {
                            if (layerStyle) {
                                if (layerStyle.labelStyle) {
                                    if (isLabelVisible) {
                                        const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                        layerStyle.labelStyle.getText().setText(text);
                                    } else {
                                        layerStyle.labelStyle.getText().setText("");
                                    }
                                }
                                return layerStyle.stylesObj;
                            } else {
                                console.log(feature);
                            }
                        }
                    }
                } else if (geometry instanceof LineString || geometry instanceof MultiLineString || geometry.getType() === "LineString" || geometry.getType() === "MultiLineString") {
                    if (classifyStyle && Object.keys(classifyStyle).length > 0) {
                        const classifyStyleValue = classifyStyle[feature.getProperties().classify_value] || (layerStyle.symbolStyles ? layerStyle.symbolStyles[0] : undefined) || EnumDefaultStyle.LineStyle;
                        const clonedStyles = isArrowVisible ? this.buildArrowStyles(geometry) : [];
                        if (layerStyle.labelStyle) {
                            const textStyle: Text = layerStyle.labelStyle.getText() as Text;
                            if (isLabelVisible) {
                                const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                textStyle.setText(text);
                                textStyle.setRepeat(80);
                            } else {
                                textStyle.setText("");
                            }
                            clonedStyles.push(layerStyle.labelStyle);
                        }

                        // if (isArrowVisible) {
                        //     if (classifyStyleValue) {
                        //         clonedStyles.push(classifyStyleValue);
                        //     }
                        // }

                        if (classifyStyleValue) {
                            clonedStyles.push(classifyStyleValue);
                        }

                        return clonedStyles;
                    } else {
                        if (layerStyle) {
                            const clonedStyles = layerStyle.stylesObj.slice();
                            if (layerStyle.labelStyle) {
                                if (isLabelVisible) {
                                    const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                    layerStyle.labelStyle.getText().setText(text);
                                    layerStyle.labelStyle.getText().setRepeat(1000);
                                } else {
                                    layerStyle.labelStyle.getText().setText("");
                                }
                                return clonedStyles.concat(layerStyle.labelStyle);
                            }
                            if (isArrowVisible) {
                                return clonedStyles.concat(this.buildArrowStyles(geometry));
                            } else {
                                return clonedStyles;
                            }
                        } else {
                            console.log(feature);
                        }
                    }
                } else if (geometry instanceof Polygon || geometry instanceof MultiPolygon || geometry.getType() === "Polygon" || geometry.getType() === "MultiPolygon") {
                    if (classifyStyle && Object.keys(classifyStyle).length > 0) {
                        const classifyStyleValue = classifyStyle[feature.getProperties().classify_value] ?? (layerStyle.symbolStyles ? layerStyle.symbolStyles[0] : undefined) ?? EnumDefaultStyle.FillStyle;

                        if (layerStyle.labelStyle) {
                            if (isLabelVisible) {
                                const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                layerStyle.labelStyle.getText().setText(text);
                            } else {
                                layerStyle.labelStyle.getText().setText("");
                            }
                            return [layerStyle.labelStyle, classifyStyleValue];
                        } else {
                            return classifyStyleValue;
                        }
                    }
                    else {
                        if (layerStyle) {
                            if (layerStyle.labelStyle) {
                                const text = (feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "";
                                if (isLabelVisible) {
                                    layerStyle.labelStyle.getText().setText(text);
                                } else {
                                    layerStyle.labelStyle.getText().setText("");
                                }
                            }
                            return layerStyle.stylesObj ?? [];
                        } else {
                            console.log(feature);
                        }
                    }
                } else {
                    console.log(feature);
                }
            };
            Object.entries(layerInfos).forEach(([key, layerInfo]) => {
                if (layerInfo.layer_type === "vector") {
                    if (layerInfo.geometry === "Point") {
                        pointLayerInfos[key] = layerInfo;
                    } else if (layerInfo.geometry === "MultiPoint") {
                        multiPointLayerInfos[key] = layerInfo;
                    } else if (layerInfo.geometry === "LineString" || layerInfo.geometry === "MultiLineString") {
                        lineLayerInfos[key] = layerInfo;
                    } else if (layerInfo.geometry === "Polygon" || layerInfo.geometry === "MultiPolygon") {
                        polygonLayerInfos[key] = layerInfo;
                    }
                } else if (layerInfo.layer_type === "wms") {
                    wmsInfos.push(layerInfo);
                }
            });
            if (wms.length > 0) {
                wmsInfos.sort((a, b) => {
                    const a1 = a.order, b1 = b.order;
                    if (a1 === b1) return 0;
                    return a1 > b1 ? 1 : -1;
                });
                $.each(wmsInfos.reverse(), (idx, wmsInfo) => {
                    const wmsLayer = new TileLayer({
                        source: new TileWMS({
                            crossOrigin: "anonymous",
                            params: JSON.parse(wmsInfo.params) || {},
                            transition: 0,
                            url: wmsInfo.url
                        }),
                        visible: wmsInfo.is_visible
                    });
                    wmsLayer.set("allowIdentify", true, true);
                    wmsLayer.set("id", wmsInfo.id, true);
                    wmsLayer.set("layerInfo", wmsInfo, true);
                    wmsLayer.set("name", wmsInfo.name, true);
                    wmsLayer.set("onIdentifyClick", (feature) => {
                        const keyColumn = wmsInfo.table.key_column ?? wmsInfo.table.identity_column;
                        const id = keyColumn ? feature.get(keyColumn.column_name) : 0;
                        // this.identify.identify(wmsInfo.id, id);
                        this.identify.identifyRowFeature(id, wmsInfo.id, wmsInfo.name_vn, true);
                    }, true);
                    this.oGMap.addLayer(wmsLayer);
                });
            }
            const addLayer = (id): void => {
                let xhr;
                const layerInfo = layerInfos[id];
                let zIndex = 0;
                if (layerInfo.geometry === "Point" || layerInfo.geometry === "MultiPoint") {
                    zIndex = 3;
                } else if (layerInfo.geometry === "LineString" || layerInfo.geometry === "MultiLineString") {
                    zIndex = 2;
                } else if (layerInfo.geometry === "Polygon" || layerInfo.geometry === "MultiPolygon") {
                    zIndex = 1;
                }
                const layer = new VectorImageLayer({
                    declutter: layerInfo.declutter,
                    maxZoom: layerInfo.max_zoom,
                    minZoom: layerInfo.min_zoom,
                    source: new VectorSource({
                        format: new GeoJSON(),
                        loader: (extent, resolution, projection, success, failure) => {
                            const srs = "EPSG:4326";
                            const [minX, minY, maxX, maxY] =
                                srs && projection.getCode() !== srs
                                    ? transformExtent(extent, projection.getCode(), srs)
                                    : extent;
                            const rect = { maxX, maxY, minX, minY };
                            const formData = new FormData();
                            formData.append("geometry", "polygon");
                            formData.append("layers", id);
                            formData.append("classifies", layer.get("classifyValues")?.toString());
                            formData.append("z", this.oGMap.getZoom().toString());
                            formData.append("bbox", this.options.extent ? this.options.extent.toString() : OGMapProjection.projectMapGeom(extent).toString());
                            // formData.append("maxFeatures", maxFeatures.toString());
                            if (this.filterGeometry) {
                                formData.append("filterGeometry", this.filterGeometry);
                            }
                            if (this.params) {
                                formData.append("params", JSON.stringify(this.params));
                                if (this.layerFilterIds) {
                                    formData.append("layerFilterIds", this.layerFilterIds);
                                }
                            }
                            const url = "/api/map/wfsflb";
                            if (xhr && (xhr.readyState !== 0 || xhr.readFeatures !== 4)) {
                                xhr.abort();
                            }
                            xhr = new XMLHttpRequest();
                            xhr.responseType = "arraybuffer";
                            xhr.open("POST", url);
                            const onError = (): void => {
                                layer.getSource().removeLoadedExtent(extent);
                                failure();
                            };
                            xhr.onerror = onError;
                            xhr.onload = () => {
                                if (xhr.status === 200) {
                                    const data = new Uint8Array(xhr.response);
                                    if (data.length > 0) {
                                        const decoded = flatgeobuf.geojson.deserialize(new Uint8Array(xhr.response), rect, null, true);
                                        const features = OGMapUtils.parseGeoJSON(decoded);
                                        features.forEach(f => f.setId(f.get("id")));
                                        layer.getSource().addFeatures(features);
                                        success(features);
                                    } else {
                                        success([]);
                                    }
                                    // const decoded = geobuf.decode(new Pbf(xhr.response));
                                    // const features = OGMapUtils.parseGeoJSON(decoded);
                                    // layer.getSource().addFeatures(features);
                                    // success(features);
                                } else {
                                    // onError();
                                }
                            };
                            xhr.send(formData);
                        },
                        strategy: bboxStrategy,
                    }),
                    style: (feature, resolution) => {
                        return getStyle(feature, resolution, id);
                    },
                    visible: layerInfo.is_visible,
                    zIndex: zIndex,
                });
                layer.set("id", layerInfo.id);
                layer.set("allowIdentify", true);
                layer.set("layerInfo", layerInfo);
                layer.set("onIdentifyClick", (feature) => {
                    const id = feature.get("fid");
                    this.identify.identifyRowFeature(id, layerInfo.id, layerInfo.name_vn, true);
                }, true);
                layer.set("identifyFeatureById", (id) => {
                    const originalFeature = this.lineLayer.getSource().getFeatureById(id);
                    if (originalFeature) {
                        this.identify.identifyFeature(originalFeature);
                    }
                }, true);
                layer.set("identifyFeature", (feature) => {
                    const id = feature.get(layerInfo.table?.identity_column?.column_name);
                    this.identify.identifyRowFeature(id, layerInfo.id, layerInfo.name_vn, true);
                }, true);
                this.oGMap.addLayer(layer);
            };
            if (pointLayers.length > 0) {
                pointLayers.forEach(id => {
                    addLayer(id);
                });
            }
            if (lineLayers.length > 0) {
                lineLayers.forEach(id => {
                    addLayer(id);
                });
            }
            if (polygonLayers.length > 0) {
                polygonLayers.forEach(id => {
                    addLayer(id);
                });
            }
            // if (multiPointLayers.length > 0) {
            //     let xhr;
            //     this.multiPointSource = new ClusterSource({
            //         distance: 40,
            //         // geometryFunction: (feature) => {
            //         //     return new Point(getCenter(feature.getGeometry().getExtent()));
            //         // },
            //         source: new VectorSource({
            //             format: new GeoJSON(),
            //             loader: (extent, resolution, projection) => {
            //                 if (this.multiPointLayer.get("layerVisibles") && this.multiPointLayer.get("layerVisibles").length > 0) {
            //                     const proj = projection.getCode();
            //                     const formData = new FormData();
            //                     formData.append("geometry", "multi_point");
            //                     formData.append("layers", this.multiPointLayer.get("layerVisibles").toString());
            //                     formData.append("classifies", this.multiPointClassifyValues.toString());
            //                     formData.append("z", this.oGMap.getZoom().toString());
            //                     formData.append("bbox", OGMapProjection.projectMapGeom(extent).toString());
            //                     formData.append("srid", proj);
            //                     if (this.params) {
            //                         formData.append("params", JSON.stringify(this.params));
            //                         formData.append("layerFilterIds", this.layerFilterIds);
            //                     }
            //                     const url = "/api/map/wfs";
            //                     if (xhr && (xhr.readyState !== 0 || xhr.readFeatures !== 4)) {
            //                         xhr.abort();
            //                     }
            //                     OGUtils.showLoading();
            //                     xhr = new XMLHttpRequest();
            //                     xhr.open("POST", url);
            //                     const onError = (): void => {
            //                         this.multiPointLayer.getSource().removeLoadedExtent(extent);
            //                     };
            //                     xhr.onerror = onError;
            //                     xhr.onload = () => {
            //                         if (xhr.status === 200) {
            //                             this.multiPointSource.getSource().addFeatures(OGMapUtils.parseGeoJSON(xhr.responseText));
            //                             this.multiPointLayer.setSource(this.multiPointSource);
            //                         } else {
            //                             onError();
            //                         }
            //                         OGUtils.hideLoading();
            //                     };
            //                     xhr.send(formData);
            //                 }
            //             },
            //             strategy: bboxStrategy,
            //         })
            //     });
            //     this.multiPointLayer = new AnimatedCluster({
            //         animationDuration: 300,
            //         source: this.multiPointSource,
            //         style: getStyle
            //     });

            //     this.multiPointLayer.set("allowIdentify", true);
            //     this.multiPointLayer.set("layerInfos", pointLayerInfos);
            //     this.multiPointLayer.set("layerVisibles", visiblePointLayers);
            //     this.multiPointLayer.set("onIdentifyClusterClick", (feature) => {
            //         this.identify.identifyFeature(feature);
            //     }, true);
            //     this.multiPointLayer.set("identifyFeatureById", (id) => {
            //         const originalFeature = this.multiPointLayer.getSource().getFeatureById(id);
            //         if (originalFeature) {
            //             this.identify.identifyFeature(originalFeature);
            //         }
            //     }, true);
            //     this.multiPointLayer.set("identifyFeature", (feature) => {
            //         this.identify.identifyFeature(feature);
            //     }, true);

            //     this.oGMap.addLayer(this.multiPointLayer);

            //     $.each(layerInfos, (idx, layerInfo) => {
            //         if (layerInfo.geometry === "MultiPoint") {
            //             layerInfo.layer = this.multiPointLayer;
            //         }
            //     });
            // }
        });
    }
    private async renderTreeItem(itemData: dxTreeViewItem, index: number, element: ElementWrapper<HTMLElement>): Promise<boolean> {
        return new Promise((resolve) => {
            const rawData = itemData.raw;
            if (itemData.type === "@layer") {
                const canvas = document.createElement("canvas");
                canvas.classList.add("dx-icon");
                element.append(canvas);

                if (rawData.styles) {
                    OGMapUtils.geoStylerStyleToCanvas(JSON.parse(rawData.styles), 24, canvas);
                } else {
                    if (rawData.geometry === EnumGeometry.Point || rawData.geometry === EnumGeometry.MultiPoint) {
                        OGMapUtils.olStyleToCanvas(EnumDefaultStyle.PointStyle, 48, canvas);
                    } else if (rawData.geometry === EnumGeometry.LineString || rawData.geometry === EnumGeometry.MultiLineString) {
                        OGMapUtils.olStyleToCanvas(EnumDefaultStyle.LineStyle, 24, canvas);
                    } else {
                        OGMapUtils.olStyleToCanvas(EnumDefaultStyle.FillStyle, 24, canvas);
                    }
                }
                element.append("<span class=\"layer-item\">" + itemData.text + "</span>");
                if (this.options.showLayerActions) {
                    const floatTools = $("<ul class=\"layer-tools\" />").appendTo(element);
                    $("<li><a class=\"ctx-actions\" title='Thao tác'><i class=\"icon icon-setting-2\"></i></a></li>")
                        .appendTo(floatTools).find("a").data("layerInfo", rawData);
                }
            } else if (itemData.type === "@tilelayer") {
                element.append("<img class=\"dx-icon\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAnwAAAJ8B8Iwk5wAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAATkSURBVEiJpVVtTJNXFH4ub7uW2kJLeS9QPhwEv7bA2g72hsjIxjRmw8kaHegWwWRhbmFiRkQDMZtimcg2zPiBW4xoluGoXURocZE440J0QuLmEi1iwAgonwKuCEJxPfsx0q3Gzao3uX/Ovc/z3HNzznMYESHQxRjbCGCQiE4HigkKgHQdY+wbxhgDoAMQNh9fzBi78EgFInrkBrANwPJ58tj52OcAEh+JDURgnjCBc/77woULb+v1+tKAcYFc0mq1WxMSEkacTiddu3aNNm/e7OacnwPAn0oAgIFzfiE/P/+Pzs5O6unp8e2SkhKvLlQzrVIIbzyRgEajyY+Ojh622WzefxP/Tb6NYg2it+2zJHrdpBszhD1zGIDiYTzswTJljOk557a0tLQUq9UaqlKpfGeTk5MoKtoC2VQvWnZEQy4wAEDdT8Ozuxr6+wbGPblE9Nt/lqlsQUi2LIz3upn8lftgGpfL5Tvr7OyExZKNFXEDaC2L8ZEDQM5yUaFSyOI1KvkvIWp5id+DiQiMMbWgjzwcvMScGVFSE0b3pjDdcRoz55zw3OxGeGgIvO7bsBVxSIs0fhmf75rE2qpurHjJQBnGKNb48w33hSsjl913PRYiGmGQBafLtbp68cOKKHXGm3K/HvHMYuzLLdD2tePX3bFQK/370vrDLRw4NYqC7KWIjVjgi3ffdHvrnF3DdyfnPhAEnX6vyphu0uUWKVmQ4Ls0N3ADQzss2Bg7gJPbovGM7J8vue8FXtvVhYu9HmzNfR76UKWfsE6jYOPuWdnQxHSMEMxoRjYxZJk936KUmzIgqEMx3ebA2L73Yd+kxEerwv3Arv5pmEquYGm8iHdXJUAu88/KPeXBoZZeXB+85yHI98o0Gs1bSUlJQYWFhfj40wKMhkYhZOASrldGQ6+R+YG/PjWMfSdnECTIIT2nx4Orq8+Nlo4JfLK7Cs3NzThz5sw6QRAE9cTERFZHR4fyi4py9LSdxPI4D1ab1ZDNVwoRsLa6D2394fiuvh7t7e1YIJtCRFgwAMBLhB/bR3HjTgh2W/ehsrISV69e9czNzR0KUqlULyYmJnorKipQXl6OrOx1SHj5Payo6Ef30Az6bs9iaXEPDMmr8X1DA3Q6HZJeMOPm6D0AwJ1JDw409WGZtAa57+Rh586dKCsrQ3Jy8n1BEFJBRFCpVGtiYmIGbTYb5eXlkcVioRMnTlDysmcpXB9GR44c8evko0ePknFJBG3NTaZli+PJbrf7cI2NjRQfHz+i1Wo3+VkFgGhRFC9t3759qra2lkwmEx07doyys7Np/fr15HK5fAIul4uUCjmtWvkqORwOSklJoaqqKrJarTOc8y4Aix7qRQAEURS/kiRpzOFwkCRJtGfPHqquriaz2Uytra109uxZkiSJiouLaf/+/WQ2m6mpqYkyMzPHOeff4gFPeqjRKRSKlVFRUYP19fXegoICysrKIofDQampqWQymaixsZFycnJow4YNZLfbKS4ublitVr/9WG4KIEIUxY7CwsLJgwcPktFopOPHj5PT6SSz2Uw1NTVUWlo6zTm/DCDuSedBkCiKe41G45jD4aD09HSSJImam5spLS1tnHNeC0D21BNNqVRmREZG3qqrq/uzoaHBazAYBhUKxf8OmscSmM9GzzlvE0XxIoCoQHF/Abx0A9y5KhT9AAAAAElFTkSuQmCC\"></img>");
                element.append("<span>" + itemData.text + "</span>");
            } else if (itemData.type === "@table") {
                element.append("<img class=\"dx-icon\" src=\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjc0NDEgNS40NjA1OUw5LjA3NzQ1IDIuMTI3MjZDOS4wMDgyMiAxLjk4ODg0IDguOTAxODIgMS44NzI0MyA4Ljc3MDE2IDEuNzkxMDhDOC42Mzg1IDEuNzA5NzMgOC40ODY3OSAxLjY2NjY1IDguMzMyMDMgMS42NjY2N0gxLjY2NTM2QzEuNDQ0MzUgMS42NjY2NyAxLjIzMjM5IDEuNzU0NDcgMS4wNzYxMSAxLjkxMDc1QzAuOTE5ODI5IDIuMDY3MDMgMC44MzIwMzEgMi4yNzg5OSAwLjgzMjAzMSAyLjUwMDAxVjUuODMzMzRDMC44MzIwMzEgNi4wNTQzNSAwLjkxOTgyOSA2LjI2NjMxIDEuMDc2MTEgNi40MjI1OUMxLjIzMjM5IDYuNTc4ODcgMS40NDQzNSA2LjY2NjY3IDEuNjY1MzYgNi42NjY2N0g5Ljk5ODdDMTAuMTQwOCA2LjY2NjY5IDEwLjI4MDUgNi42MzAzOSAxMC40MDQ2IDYuNTYxMjJDMTAuNTI4NiA2LjQ5MjA0IDEwLjYzMyA2LjM5MjMgMTAuNzA3NyA2LjI3MTQ1QzEwLjc4MjQgNi4xNTA2MSAxMC44MjQ5IDYuMDEyNjggMTAuODMxMyA1Ljg3MDc2QzEwLjgzNzcgNS43Mjg4NCAxMC44MDc3IDUuNTg3NjUgMTAuNzQ0MSA1LjQ2MDU5WiIgZmlsbD0iIzgyOEE5NSIvPgo8cGF0aCBkPSJNMTguMzMyIDVIMC44MzIwMzFWMTcuNUMwLjgzMjAzMSAxNy43MjEgMC45MTk4MjkgMTcuOTMzIDEuMDc2MTEgMTguMDg5M0MxLjIzMjM5IDE4LjI0NTUgMS40NDQzNSAxOC4zMzMzIDEuNjY1MzYgMTguMzMzM0gxOC4zMzJDMTguNTUzIDE4LjMzMzMgMTguNzY1IDE4LjI0NTUgMTguOTIxMyAxOC4wODkzQzE5LjA3NzYgMTcuOTMzIDE5LjE2NTQgMTcuNzIxIDE5LjE2NTQgMTcuNVY1LjgzMzMzQzE5LjE2NTQgNS42MTIzMiAxOS4wNzc2IDUuNDAwMzYgMTguOTIxMyA1LjI0NDA4QzE4Ljc2NSA1LjA4NzggMTguNTUzIDUgMTguMzMyIDVaIiBmaWxsPSIjQUZCN0MxIi8+Cjwvc3ZnPgo=\"></img>");
                element.append("<span class=\"table-item\">" + itemData.text + "</span>");

                const floatTools = $("<ul class=\"layer-tools\" />").appendTo(element);
                $("<li><a class=\"ctx-actions\" title='Thao tác'><i class=\"icon icon-setting-2\"></i></a></li>")
                    .appendTo(floatTools).find("a").data("tableInfo", rawData);
            } else if (itemData.type == "@layer_classify") {
                const canvas = document.createElement("canvas");
                canvas.classList.add("dx-icon");
                element.append(canvas);
                if (rawData.style) {
                    try {
                        OGMapUtils.geoStylerStyleToCanvas(JSON.parse(rawData.style), 24, canvas);
                    } catch (e) {
                        console.log("Error parse style: " + rawData.name_vn);
                    }
                } else {
                    if (rawData.geometry === EnumGeometry.Point || rawData.geometry === EnumGeometry.MultiPoint) {
                        OGMapUtils.olStyleToCanvas(EnumDefaultStyle.PointStyle, 48, canvas);
                    } else if (rawData.geometry === EnumGeometry.LineString || rawData.geometry === EnumGeometry.MultiLineString) {
                        OGMapUtils.olStyleToCanvas(EnumDefaultStyle.LineStyle, 24, canvas);
                    } else {
                        OGMapUtils.olStyleToCanvas(EnumDefaultStyle.FillStyle, 24, canvas);
                    }
                }
                element.append("<span class=\"layerClassifyItem\">" + itemData.text + "</span>");
            }
            else {
                element.append("<img class=\"dx-icon\" src=\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjc0NDEgNS40NjA1OUw5LjA3NzQ1IDIuMTI3MjZDOS4wMDgyMiAxLjk4ODg0IDguOTAxODIgMS44NzI0MyA4Ljc3MDE2IDEuNzkxMDhDOC42Mzg1IDEuNzA5NzMgOC40ODY3OSAxLjY2NjY1IDguMzMyMDMgMS42NjY2N0gxLjY2NTM2QzEuNDQ0MzUgMS42NjY2NyAxLjIzMjM5IDEuNzU0NDcgMS4wNzYxMSAxLjkxMDc1QzAuOTE5ODI5IDIuMDY3MDMgMC44MzIwMzEgMi4yNzg5OSAwLjgzMjAzMSAyLjUwMDAxVjUuODMzMzRDMC44MzIwMzEgNi4wNTQzNSAwLjkxOTgyOSA2LjI2NjMxIDEuMDc2MTEgNi40MjI1OUMxLjIzMjM5IDYuNTc4ODcgMS40NDQzNSA2LjY2NjY3IDEuNjY1MzYgNi42NjY2N0g5Ljk5ODdDMTAuMTQwOCA2LjY2NjY5IDEwLjI4MDUgNi42MzAzOSAxMC40MDQ2IDYuNTYxMjJDMTAuNTI4NiA2LjQ5MjA0IDEwLjYzMyA2LjM5MjMgMTAuNzA3NyA2LjI3MTQ1QzEwLjc4MjQgNi4xNTA2MSAxMC44MjQ5IDYuMDEyNjggMTAuODMxMyA1Ljg3MDc2QzEwLjgzNzcgNS43Mjg4NCAxMC44MDc3IDUuNTg3NjUgMTAuNzQ0MSA1LjQ2MDU5WiIgZmlsbD0iIzgyOEE5NSIvPgo8cGF0aCBkPSJNMTguMzMyIDVIMC44MzIwMzFWMTcuNUMwLjgzMjAzMSAxNy43MjEgMC45MTk4MjkgMTcuOTMzIDEuMDc2MTEgMTguMDg5M0MxLjIzMjM5IDE4LjI0NTUgMS40NDQzNSAxOC4zMzMzIDEuNjY1MzYgMTguMzMzM0gxOC4zMzJDMTguNTUzIDE4LjMzMzMgMTguNzY1IDE4LjI0NTUgMTguOTIxMyAxOC4wODkzQzE5LjA3NzYgMTcuOTMzIDE5LjE2NTQgMTcuNzIxIDE5LjE2NTQgMTcuNVY1LjgzMzMzQzE5LjE2NTQgNS42MTIzMiAxOS4wNzc2IDUuNDAwMzYgMTguOTIxMyA1LjI0NDA4QzE4Ljc2NSA1LjA4NzggMTguNTUzIDUgMTguMzMyIDVaIiBmaWxsPSIjQUZCN0MxIi8+Cjwvc3ZnPgo=\"></img>");
                element.append("<span class=\"layer-group-item\">" + itemData.text + "</span>");
            }
            resolve(true);
        });
    }

    private replacer(key, value): object {
        if (!value || !value.geometry) {
            return value;
        }

        let type;
        const rawType = value.type;
        let geometry = value.geometry;
        if (rawType === 1) {
            type = "MultiPoint";
            if (geometry.length == 1) {
                type = "Point";
                geometry = geometry[0];
            }
        } else if (rawType === 2) {
            type = "MultiLineString";
            if (geometry.length == 1) {
                type = "LineString";
                geometry = geometry[0];
            }
        } else if (rawType === 3) {
            type = "Polygon";
            if (geometry.length > 1) {
                type = "MultiPolygon";
                geometry = [geometry];
            }
        }

        return {
            geometry: {
                coordinates: geometry,
                type: type,
            },
            properties: value.tags,
            type: "Feature",
        };
    }
    private singleLayerHandle(e: ItemSelectionChangedEvent): PromiseLike<boolean> | boolean {
        return new Promise((resolve) => {
            if (e.itemData.raw) {
                const raw = e.itemData.raw;
                if (e.itemData.type === "@tilelayer") {
                    const layer
                        = this.oGMap.getLayerById(raw.id);
                    if (layer) {
                        layer.setVisible(e.itemData.selected);
                    }
                } else if (e.itemData.raw.layer_type === "wms") {
                    const layer
                        = this.oGMap.getLayerById(raw.id);
                    if (layer) {
                        layer.setVisible(e.itemData.selected);
                    }
                } else if (e.itemData.type === "@layer_classify") {
                    const layer
                        = this.oGMap.getLayerById(raw.layer_id);
                    const classifyValues = [];
                    e.node.parent.children.forEach(node => {
                        if (node.itemData.selected) {
                            classifyValues.push(node.itemData.raw.value);
                        }
                    });
                    layer.set("classifyValues", classifyValues);
                    if (layer instanceof VectorImageLayer || layer instanceof VectorLayer) {
                        if (classifyValues.length === 0) {
                            e.node.parent.selected = false;
                            layer.setVisible(false);
                        } else {
                            layer.setVisible(true);
                            layer.getSource().refresh();
                        }
                    }
                } else {
                    if (e.itemData.type === "@layergroup") {
                        if (raw.layers && raw.layers.length > 0) {
                            raw.layers.forEach(o => {
                                const layer = this.oGMap.getLayerById(o.id);
                                if (layer instanceof VectorImageLayer || layer instanceof VectorLayer) {
                                    layer.setVisible(e.itemData.selected);
                                }
                            });
                        }
                    } else if (e.itemData.type === "@layer") {
                        const layer = this.oGMap.getLayerById(raw.id);
                        if (layer) {
                            if (e.itemData.selected) {
                                if (layer instanceof VectorImageLayer || layer instanceof VectorLayer) {
                                    const classifyValues = [];
                                    e.node.children.forEach(node => {
                                        if (node.itemData.selected) {
                                            classifyValues.push(node.itemData.raw.value);
                                        }
                                    });
                                    layer.set("classifyValues", classifyValues);
                                    layer.getSource().refresh();
                                }
                            }
                            layer.setVisible(e.itemData.selected);
                        }
                    } else {
                        console.log(e, raw);
                    }
                }
            } else {
                if (e.node && e.node.children.length > 0) {
                    e.node.children.forEach(o => {
                        if (o.itemData.raw) {
                            const raw = o.itemData.raw;
                            //
                            if (o.itemData.type === "@layer") {
                                const layer = this.oGMap.getLayerById(raw.id);
                                if (layer) {
                                    if (e.itemData.selected) {
                                        if (layer instanceof VectorImageLayer || layer instanceof VectorLayer) {
                                            const classifyValues = [];
                                            o.children.forEach(node => {
                                                if (node.itemData.selected) {
                                                    classifyValues.push(node.itemData.raw.value);
                                                }
                                            });
                                            layer.set("classifyValues", classifyValues);
                                            layer.getSource().refresh();
                                        }
                                    }
                                    layer.setVisible(e.itemData.selected);
                                }
                            }
                        }
                    });
                }
            }
            resolve(true);
        });
    }

    private stringDivider(str: string, width: number, spaceReplacer: string): string {
        if (str.length > width) {
            let p = width;
            while (p > 0 && (str[p] != " " && str[p] != "-")) {
                p--;
            }
            if (p > 0) {
                let left;
                if (str.substring(p, p + 1) === "-") {
                    left = str.substring(0, p + 1);
                } else {
                    left = str.substring(0, p);
                }
                const right = str.substring(p + 1);
                return left + spaceReplacer + this.stringDivider(right, width, spaceReplacer);
            }
        }
        return str;
    }
    onInit(): void {
        this.layerTree = $("<div />").addClass("layer-tree").appendTo(this.container)
            .dxTreeView({
                dataSource: new DataSource({
                    key: "id",
                    store: new CustomStore({
                        key: "id",
                        load: () => {
                            const deferred = $.Deferred();
                            if (this.tableSchema !== "" && this.tableSchema !== undefined) {
                                LayerService.getTree(this.tableSchema).then(treeItems => {
                                    this.renderLayers(treeItems);
                                    deferred.resolve({
                                        data: treeItems,
                                        totalCount: treeItems.length
                                    });
                                });

                                return deferred.promise();
                            } else if (this.mapId) {
                                $.get("/api/map/tree-layers", {
                                    mapId: this.mapId
                                }).then(xhr => {
                                    this.renderLayers(xhr.data);
                                    deferred.resolve({
                                        data: xhr.data,
                                        totalCount: xhr.data.length
                                    });
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
                focusStateEnabled: false,
                hoverStateEnabled: false,
                itemTemplate: (itemData, itemIndex, itemElement) => {
                    this.renderTreeItem(itemData, itemIndex, itemElement);
                },
                onContentReady: () => {
                    if (!this.contextMenu) {
                        this.contextMenu = $("<div />").appendTo("body").dxContextMenu({
                            items: [
                                { icon: "icon icon-image", text: "Thiết lập biểu tượng" },
                                { icon: "icon icon-receive-square", text: "Kết xuất dữ liệu lớp", visible: false, },
                                { icon: "icon icon-grid-1", text: "Mở bảng thuộc tính" },
                                { icon: "icon icon-location", text: "Phóng đến lớp dữ liệu" },
                            ],
                            onItemClick: (e) => {
                                const layerInfo: OGLayerModel = e.component["layerInfo"];
                                const tableInfo: OGTableModel = e.component["tableInfo"];
                                if (layerInfo) {
                                    if (e.itemIndex === 0) {
                                        const def = $.Deferred();
                                        const rawData: OGLayerModel = layerInfo;
                                        this.styleEditor.for(rawData, def).show();
                                        def.then(e => {
                                            if (e.type === "label") {
                                                rawData["label_styles"] = JSON.stringify(e.geoStyler);
                                                OGMapUtils.geoStylerStyleToOlStyle(JSON.parse(rawData["styles"])).then((style: Style) => {
                                                    if (style.getImage() instanceof Icon) {
                                                        (style.getImage() as Icon).setAnchor([rawData["styles_anchor_x"], rawData["styles_anchor_y"]]);
                                                    }
                                                    OGMapUtils.geoStylerStyleToOlStyle(e.geoStyler).then(labelStyle => {
                                                        rawData.layer.setStyle((feature) => {
                                                            if (typeof (labelStyle) === "function") {
                                                                const s = labelStyle();
                                                                if (s && s.length > 0) {
                                                                    const ts = s[0];
                                                                    ts.getText().setText((feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "");
                                                                    return [ts, style];
                                                                } else {
                                                                    return [style];
                                                                }
                                                            } else {
                                                                return [labelStyle, style];
                                                            }
                                                        });
                                                    });
                                                });
                                            } else if (e.type === "style") {
                                                // rawData.layerInstance.get('layerInfo').styles = JSON.stringify(e.sld);
                                                OGMapUtils.geoStylerStyleToOlStyle(e.geoStyler).then((style: Style) => {
                                                    if (style.getImage() instanceof Icon) {
                                                        (style.getImage() as Icon).setAnchor([rawData["styles_anchor_x"], rawData["styles_anchor_y"]]);
                                                    }
                                                    if (rawData["label_styles"]) {
                                                        OGMapUtils.geoStylerStyleToOlStyle(JSON.parse(rawData["label_styles"])).then(labelStyle => {
                                                            rawData.layer.setStyle((feature) => {
                                                                if (typeof (labelStyle) === "function") {
                                                                    const s = labelStyle();
                                                                    if (s && s.length > 0) {
                                                                        const ts = s[0];
                                                                        ts.getText().setText((feature.get("label") !== undefined && feature.get("label") !== null) ? feature.get("label").toString() : "");
                                                                        return [ts, style];
                                                                    } else {
                                                                        return [style];
                                                                    }
                                                                } else {
                                                                    return [labelStyle, style];
                                                                }
                                                            });
                                                        });
                                                    } else {
                                                        rawData.layer.setStyle(() => {
                                                            return [style, new Style({
                                                                image: new Circle({
                                                                    fill: new Fill({ color: "#666666" }),
                                                                    radius: 5,
                                                                    stroke: new Stroke({ color: "#bada55", width: 1 })
                                                                })
                                                            })];
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    } else if (e.itemIndex === 1) {
                                        OGUtils.postDownload("/api/layer/export", { layer_id: layerInfo.id }, "application/json");
                                    } else if (e.itemIndex === 2) {
                                        this.attributesWindowComponent.for(layerInfo, undefined).show();
                                    } else if (e.itemIndex === 3) {
                                        $.get(`/api/map/extent/${layerInfo.id}`).done(response => {
                                            this.oGMap.fitBounds(response);
                                        });
                                    }
                                } else if (tableInfo) {
                                    if (e.itemIndex === 0) {
                                        OGUtils.postDownload("/api/layer/export", { table_id: tableInfo.id }, "application/json");
                                    } else if (e.itemIndex === 1) {
                                        this.attributesWindowComponent.for(undefined, tableInfo).show();
                                    }
                                }
                            },
                            onPositioning: (e) => {
                                const target = $(e.event.target).closest("a");
                                const layerInfo = target.data("layerInfo");
                                const tableInfo = target.data("tableInfo");
                                //
                                if (layerInfo) {
                                    e.component["layerInfo"] = layerInfo;
                                    e.component["tableInfo"] = undefined;
                                    const items = [
                                        { icon: "icon icon-image", id: "symbol", text: "Thiết lập biểu tượng" },
                                        { icon: "icon icon-receive-square", id: "export", text: "Kết xuất dữ liệu lớp", visible: false, },
                                        { icon: "icon icon-grid-1", id: "data", text: "Mở bảng thuộc tính" },
                                        { icon: "icon icon-location", id: "location", text: "Phóng đến lớp dữ liệu" },
                                    ];
                                    this.contextMenu.option("items", items);
                                } else if (tableInfo) {
                                    e.component["layerInfo"] = undefined;
                                    e.component["tableInfo"] = tableInfo;
                                    const items = [
                                        { icon: "icon icon-receive-square", id: "export", text: "Kết xuất dữ liệu bảng", visible: false, },
                                        { icon: "icon icon-grid-1", id: "data", text: "Mở bảng thuộc tính" },
                                    ];
                                    this.contextMenu.option("items", items);
                                }
                            },
                            showEvent: "dxcontextmenu click",
                            target: ".ctx-actions"
                        }).dxContextMenu("instance");
                    }
                },
                onItemSelectionChanged: (e: ItemSelectionChangedEvent) => {
                    this.onTreeItemSelectionChange(e);
                },
                searchEditorOptions: {
                    showClearButton: true,
                },
                searchEnabled: true,
                searchMode: "contains",
                showCheckBoxesMode: "normal"
            }).dxTreeView("instance");

    }

    public reload(): void {
        if (this.isRenderCompositeLayer) {
            if (this.cluster) {
                if (this.clusterPointLayer) {
                    this.clusterPointSource.getSource().refresh();
                    this.clusterPointLayer.setSource(this.clusterPointSource);
                }
            } else if (this.pointLayer) {
                this.pointLayer.getSource().refresh();
            }
            if (this.multiPointLayer) {
                this.multiPointSource.getSource().refresh();
                this.multiPointLayer.setSource(this.multiPointSource);
            }
            if (this.lineLayer) {
                this.lineLayer.getSource().refresh();
            }
            if (this.polygonLayer) {
                this.polygonLayer.getSource().refresh();
            }
        } else {
            this.oGMap.getLayers().forEach(o => {
                if (o instanceof VectorImageLayer || o instanceof VectorLayer) {
                    o.getSource().refresh();
                }
            });
        }
    }

    public setParams(params, layerFilterIds?: string, geometry?: string): LayerTreeComponent {
        this.params = params;
        this.layerFilterIds = layerFilterIds;
        this.filterGeometry = geometry;
        return this;
    }
}

export { LayerTreeComponent };
