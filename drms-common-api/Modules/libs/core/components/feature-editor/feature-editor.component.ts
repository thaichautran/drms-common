import { OGMap, OGMapUtils } from "@opengis/map";
import { ElementWrapper } from "devextreme/core/element";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxButtonGroup from "devextreme/ui/button_group";
import dxPopup from "devextreme/ui/popup";
import dxSelectBox from "devextreme/ui/select_box";
import dxToolbar from "devextreme/ui/toolbar";
import dxTreeView, { Node as dxTreeViewNode } from "devextreme/ui/tree_view";
import { Feature, MapBrowserEvent } from "ol";
import { Geometry } from "ol/geom";
import {
    Modify,
    Select,
} from "ol/interaction";
import { Layer } from "ol/layer";
import VectorLayer from "ol/layer/Vector";
import VectorImageLayer from "ol/layer/VectorImage";
import VectorSource from "ol/source/Vector";
import Hover from "ol-ext/interaction/Hover";

import { EnumDefaultStyle, EnumGeometry, EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { FeatureAttributes } from "../../models/feature.model";
import { OGLayerClassifyModel, OGLayerGroupModel, OGLayerModel } from "../../models/layer.model";
import { OGTileLayer } from "../../models/ol/layer-vector.model";
import { LayerClassifyTreeItem, LayerGroupTreeItem, LayerTreeItem } from "../../models/tree-item.model";
import { EventDispatcher, Handler, IMapComponent } from "../base-component.abstract";
import { FeaturesWindowComponent } from "../feature-window/features-window.component";
import { IdentifyComponent } from "../identify/identify.component";
import "./feature-editor.component.scss";

interface FeatureEditorOptions {
    identify: IdentifyComponent,
}

interface StopEditEvent { }
interface FeatureEditEvent {
    attributes: FeatureAttributes,
    feature: Feature,
    geometry: Geometry,
    layer: Layer,
    layerInfo: OGLayerModel,
}
interface FeatureCreateEvent {
    attributes: FeatureAttributes,
    geometry: Geometry,
    layer: Layer,
    layerInfo: OGLayerModel,
}
interface FeatureDeleteEvent {
    attributes: FeatureAttributes,
    feature: Feature,
    layer: Layer,
    layerInfo: OGLayerModel,
}
interface HiddenEvent { }

class FeatureEditorComponent implements IMapComponent {
    private actionsButtonGroup: dxButtonGroup;
    private actionsToolbar: dxToolbar;
    private featureCreateEventDispatcher = new EventDispatcher<FeatureCreateEvent>();
    private featureDeleteEventDispatcher = new EventDispatcher<FeatureDeleteEvent>();
    private featureEditEventDispatcher = new EventDispatcher<FeatureEditEvent>();
    private featuresWindow: FeaturesWindowComponent;
    private hiddenEventDispatcher = new EventDispatcher<HiddenEvent>();
    private hoverInteraction: Hover;
    private isSnapping: boolean = false;
    private lastAction: string;
    private layersTree: dxTreeView;
    private modifyInteraction: Modify;
    private popup: dxPopup;
    private selectInteraction: Select;
    private snapActionsButtonGroup: dxButtonGroup;
    private snapEnabled: boolean;
    private snapLayers: Array<VectorImageLayer | VectorLayer<VectorSource<Feature>>>;
    private snapLayersSelectBox: dxSelectBox;
    private snapPopup: dxPopup;
    private snapSelectedNodes: dxTreeViewNode[];
    private snapTreeView: dxTreeView;
    private stopEditEventDispatcher = new EventDispatcher<StopEditEvent>();
    private userClaims: string[];
    private visibleLayersID: number[] = [];
    oGMap: OGMap;
    constructor(oGMap: OGMap, options: FeatureEditorOptions) {
        this.oGMap = oGMap;
        this.featuresWindow = new FeaturesWindowComponent(this.oGMap, {
            allowDelete: true,
            allowEditing: true,
            identify: options.identify,
            layers: []
        });
        this.featuresWindow.onFeatureEdit((d) => {
            const f = d.feature;
            const attributes = f.getProperties();
            const layerInfo = d.layerInfo;
            const layer = d.layer;
            const keyColumn = layerInfo.table.key_column ? layerInfo.table.key_column : layerInfo.table.identity_column;
            if (keyColumn) {
                attributes[keyColumn.column_name] = f.get("fid");
            } else {
                attributes["id"] = f.get("fid");
            }
            this.featureEditEventDispatcher.fire({
                attributes: attributes,
                feature: f,
                geometry: f.getGeometry(),
                layer: layer,
                layerInfo: layerInfo
            });
        });
        this.featuresWindow.onFeatureDelete((d) => {
            const f = d.feature;
            const attributes = f.getProperties();
            const layerInfo = d.layerInfo;
            const layer = d.layer;
            const keyColumn = layerInfo.table.key_column ? layerInfo.table.key_column : layerInfo.table.identity_column;
            if (keyColumn) {
                attributes[keyColumn.column_name] = f.get("fid");
            } else {
                attributes["id"] = f.get("fid");
            }
            this.featureDeleteEventDispatcher.fire({
                attributes: attributes,
                feature: f,
                layer: layer,
                layerInfo: layerInfo,
            });
        });
        this.selectInteraction = undefined;
        this.modifyInteraction = undefined;
        this.userClaims = [];

        this.onStopEdit(() => {
            if (this.selectInteraction) {
                this.selectInteraction.getFeatures().clear();
                this.selectInteraction = undefined;
            }
        });
        this.onInit();
    }
    private _initSnap(): void {
        this.snapPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: this._renderBodySnap.bind(this),
            deferRendering: true,
            dragEnabled: true,
            height: "auto",
            hideOnOutsideClick: false,
            onHiding: () => {
                this.hiddenEventDispatcher.fire({});
            },
            onShowing: () => {
            },
            position: {
                at: "right bottom",
                of: "body",
                offset: "-280 -520"
            },
            shading: false,
            showCloseButton: false,
            showTitle: true,
            title: "Snapping",
            width: 300
        }).dxPopup("instance");
    }
    private _renderBody(popupBody): void {
        const self = this;
        // const popupHeight = $(popupBody).innerHeight();
        const popupBodyHeight = parseInt(this.popup.option("height").toString()) - 40;
        $(popupBody).css("padding", 0);
        $(popupBody).css("display", "flex");
        $(popupBody).css("flex-direction", "column");

        this.lastAction = undefined;
        this.actionsToolbar = $("<div />")
            .addClass("feature-editor-toolbar")
            .appendTo(popupBody).dxToolbar({
                itemTemplate: (itemData, itemIndex, itemElement) => {
                    if (itemIndex == 0) {
                        this.actionsButtonGroup = $("<div />").appendTo(itemElement).dxButtonGroup({
                            focusStateEnabled: false,
                            hoverStateEnabled: false,
                            items: [{
                                elementAttr: {
                                    action: "create",
                                    hint: "Thêm"
                                },
                                icon: "mdi mdi-plus",
                            }, {
                                elementAttr: {
                                    action: "edit",
                                    hint: "Sửa"
                                },
                                icon: "mdi mdi-pencil",
                            }, {
                                elementAttr: {
                                    action: "split",
                                    hint: "Cắt đường"
                                },
                                icon: "mdi mdi-content-cut",
                            }, {
                                elementAttr: {
                                    action: "delete",
                                    hint: "Xóa"
                                },
                                icon: "mdi mdi-delete",
                            }],
                            keyExpr: "elementAttr",
                            onItemClick: (e) => {
                                if (e.itemData.elementAttr.action === this.lastAction) {
                                    this.actionsButtonGroup.option("selectedItemKeys", []);

                                    this.oGMap.clearInteractions();
                                    this.oGMap.clearMap();

                                    this.stopEditEventDispatcher.fire({});

                                    this.lastAction = undefined;
                                    return;
                                }

                                this._setAction(e.itemData.elementAttr.action);
                            },
                            selectedItemKeys: [],
                            stylingMode: "text"
                        }).dxButtonGroup("instance");
                    } else {
                        this.snapActionsButtonGroup = $("<div />").appendTo(itemElement).dxButtonGroup({
                            items: [{
                                elementAttr: {
                                    action: "setSnap",
                                    class: "btnSnap",
                                    hint: "Snap",
                                },
                                template: () => {
                                    return $("<i>").addClass("icon icon-record");
                                },
                            }],
                            keyExpr: "action",
                            onItemClick: (e) => {
                                if (e.itemData.action == "setSnap") {
                                    if (self.isSnapping === false) {
                                        self.isSnapping = true;
                                        self.snapPopup.show();
                                    }
                                    else {
                                        this.snapActionsButtonGroup.option("selectedItemKeys", []);
                                        this.stopEditEventDispatcher.fire({});
                                        self.snapPopup.hide();
                                        self.isSnapping = false;
                                    }
                                }
                            },
                            selectedItemKeys: [],
                            stylingMode: "text"
                        }).dxButtonGroup("instance");
                    }
                },
                items: [{
                    id: "btnGroup",
                    location: "before"
                }, {
                    id: "btnSnap",
                    location: "after"
                }]
            }).dxToolbar("instance");

        this.layersTree = $("<div />")
            .addClass("feature-editor-layer-list")
            .css("flex-grow", "1")
            .css("min-height", "0")
            .appendTo(popupBody).dxTreeView({
                dataSource: new DataSource({
                    key: "id",
                    store: new CustomStore({
                        load: () => {
                            return new Promise((resolve, reject) => {
                                const dataSource = this.buildLayersTree();
                                resolve({
                                    data: dataSource,
                                    totalCount: dataSource.length
                                });
                            });
                        }
                    })
                }),
                height: popupBodyHeight - $(this.actionsToolbar.element()).outerHeight(),
                itemTemplate: (itemData, itemIndex, itemElement: ElementWrapper<HTMLElement>) => {
                    if (itemData.type == "@layergroup") {
                        itemElement.css("padding-left", "10px").append("<span class=\"layerGroupItem\">" + itemData.text + "</span>");
                    } else if (itemData.type == "@layer") {
                        const layerInfo = itemData.layerInfo;
                        const canvas: HTMLCanvasElement = document.createElement("canvas");
                        canvas.classList.add("dx-icon");
                        itemElement.append(canvas);
                        if (layerInfo.styles) {
                            OGMapUtils.geoStylerStyleToCanvas(JSON.parse(layerInfo.styles), 24, canvas);
                        } else {
                            if (layerInfo.geometry === EnumGeometry.Point || layerInfo.geometry === EnumGeometry.MultiPoint) {
                                OGMapUtils.olStyleToCanvas(EnumDefaultStyle.PointStyle, 24, canvas);
                            } else if (layerInfo.geometry === EnumGeometry.LineString || layerInfo.geometry === EnumGeometry.MultiLineString) {
                                OGMapUtils.olStyleToCanvas(EnumDefaultStyle.LineStyle, 24, canvas);
                            } else {
                                OGMapUtils.olStyleToCanvas(EnumDefaultStyle.FillStyle, 24, canvas);
                            }
                        }
                        itemElement.css("padding-left", "10px").append("<span>" + itemData.text + "</span>");
                    } else if (itemData.type == "@layerClassify") {
                        const layerClassify: OGLayerClassifyModel = itemData.raw;
                        const layerInfo: OGLayerModel = layerClassify.layer;
                        const canvas: HTMLCanvasElement = document.createElement("canvas");
                        canvas.classList.add("dx-icon");
                        itemElement.append(canvas);
                        if (layerClassify.style) {
                            OGMapUtils.geoStylerStyleToCanvas(JSON.parse(layerClassify.style), 24, canvas);
                        } else {
                            if (layerInfo.geometry === EnumGeometry.Point || layerInfo.geometry === EnumGeometry.MultiPoint) {
                                OGMapUtils.olStyleToCanvas(EnumDefaultStyle.PointStyle, 24, canvas);
                            } else if (layerInfo.geometry === EnumGeometry.LineString || layerInfo.geometry === EnumGeometry.MultiLineString) {
                                OGMapUtils.olStyleToCanvas(EnumDefaultStyle.LineStyle, 24, canvas);
                            } else {
                                OGMapUtils.olStyleToCanvas(EnumDefaultStyle.FillStyle, 24, canvas);
                            }
                        }
                        itemElement.css("padding-left", "20px").append("<span>" + itemData.text + "</span>");
                    }
                },
                onSelectionChanged: () => {
                    const items = this.actionsButtonGroup.option("selectedItems");
                    if (items && items.length > 0) {
                        const item = items[0];
                        //
                        this._setAction(item.elementAttr.action);
                    }
                },
                searchEnabled: true,
                searchMode: "contains",
                selectByClick: true,
                selectionMode: "single"
            }).dxTreeView("instance");

        this.layersTree.getNodes().forEach(node => {
            if (node.itemData.type == "@layer") {
                const layer = node.itemData.layerInstance;
                if (layer.get("layerInfos")) {
                    // layer.on('change:visible', (e) => {
                    //     node.itemData.disabled = layer.getVisible() === false;
                    //     let nodeElement = this.layersTree.element().find("[data-item-id='" + node.key + "'] > .dx-treeview-item").get(0);
                    //     if (layer.getVisible()) {
                    //         $(nodeElement).removeClass('dx-state-disabled');
                    //     } else {
                    //         $(nodeElement).addClass('dx-state-disabled');
                    //     }
                    // });
                } else if (layer.get("layerInfo")) {
                    layer.on("change:visible", () => {
                        node.itemData.disabled = layer.getVisible() === false;
                        const nodeElement = this.layersTree.element().find("[data-item-id='" + node.key + "'] > .dx-treeview-item").get(0);
                        if (layer.getVisible()) {
                            $(nodeElement).removeClass("dx-state-disabled");
                        } else {
                            $(nodeElement).addClass("dx-state-disabled");
                        }
                    });
                }
            }
        });

    }

    private _renderBodySnap(popupBody): void {
        const self = this;
        $("<div />")
            .addClass("snap-toolbar")
            .appendTo(popupBody)
            .dxForm({
                formData: {
                    snapEnabled: false,
                },
                items: [{
                    dataField: "snapEnabled",
                    editorOptions: {
                        onValueChanged(data) {
                            self.snapEnabled = data.value;
                            self.snapLayers = [];
                            if (self.snapEnabled) {
                                if (self.snapSelectedNodes) {
                                    self.snapSelectedNodes.forEach((node, i) => {
                                        if (node.itemData.type == "@layer") {
                                            const layer = node.itemData.layerInstance;
                                            const existLayer = self.snapLayers.filter(x => x.get("ol_uid") === layer.ol_uid);
                                            if (existLayer.length == 0) {
                                                self.snapLayers.push(layer);
                                            }
                                        }
                                    });
                                }
                            }
                            self.oGMap.setSnapToLayers(self.snapLayers, self.snapEnabled);
                        },
                        text: "Bật/tắt snap",
                    },
                    editorType: "dxCheckBox",
                    label: {
                        visible: false,
                    }
                }, {
                    editorOptions: {
                        contentTemplate(e) {
                            self.snapLayersSelectBox = e.component;
                            const value = e.component.option("value");
                            const $treeView = $("<div>").dxTreeView({
                                dataSource: e.component.getDataSource(),
                                //dataStructure: 'tree',
                                //keyExpr: 'id',
                                //displayExpr: 'text',
                                onContentReady(args) {
                                    if (!value) {
                                        args.component.unselectAll();
                                        return;
                                    } else {
                                        value.forEach((key) => {
                                            args.component.selectItem(key);
                                        });
                                    }
                                },
                                onItemSelectionChanged(args) {
                                    const selectedKeys = args.component.getSelectedNodeKeys();
                                    self.snapSelectedNodes = args.component.getSelectedNodes();
                                    e.component.option("value", selectedKeys);
                                },
                                searchEnabled: true,
                                searchMode: "contains",
                                selectByClick: true,
                                //parentIdExpr: 'parent_id',
                                selectionMode: "multiple",
                                showCheckBoxesMode: "normal"
                            });
                            self.snapTreeView = $treeView.dxTreeView("instance");
                            e.component.on("valueChanged", (args) => {
                                if (!args.value) {
                                    self.snapTreeView.unselectAll();
                                    return;
                                } else {
                                    args.value.forEach((key) => {
                                        self.snapTreeView.selectItem(key);
                                    });
                                }
                            });
                            return $treeView;
                        },
                        dataSource: new DataSource({
                            store: new CustomStore({
                                key: "id",
                                load: () => {
                                    return new Promise((resolve, reject) => {
                                        const dataSource = this.buildLayersTree();
                                        resolve(dataSource);
                                    });
                                },
                                loadMode: "raw"
                            })
                        }),
                        displayExpr: "text",
                        displayValueFormatter: () => {
                            if (self.snapSelectedNodes) {
                                if (self.snapSelectedNodes.length) {
                                    if (self.snapSelectedNodes.length == 1) {
                                        const value = self.snapSelectedNodes[0].itemData.text;
                                        return value;
                                    }
                                    //else if (self.snapSelectedNodes.length == 2) {
                                    //    return self.snapSelectedNodes[0].itemData.text + "; " + self.snapSelectedNodes[1].itemData.text;
                                    //}
                                    else if (self.snapSelectedNodes.length > 2) {
                                        const count = self.snapSelectedNodes.filter(x => x.itemData.type == "@layer");
                                        return `Đã chọn ${count.length} lớp dữ liệu`;
                                    }
                                } else {
                                    return "Chọn các lớp dữ liệu muốn snap";
                                }
                            }
                        },
                        elementAttr: {
                            id: "snapSelectBox"
                        },
                        onValueChanged: () => {
                            self.snapLayers = [];
                            if (self.snapEnabled) {
                                if (self.snapSelectedNodes) {
                                    $.each(self.snapSelectedNodes, function (i, node) {
                                        if (node.itemData.type == "@layer") {
                                            const layer = node.itemData.layerInstance;
                                            const existLayer = self.snapLayers.filter(x => x.get("ol_uid") === layer.ol_uid);
                                            if (existLayer.length == 0) {
                                                self.snapLayers.push(layer);
                                            }
                                        }
                                    });
                                }
                            }
                            self.oGMap.setSnapToLayers(self.snapLayers, self.snapEnabled);
                        },
                        placeholder: "Chọn các lớp muốn snap",
                        valueExpr: "id",
                    },
                    editorType: "dxDropDownBox",
                },],
            }).dxForm("instance");
    }
    private _setAction(action: string): void {
        this.lastAction = action;
        let selectedLayerNode, selectedClassifyNode;
        const selectedNode = this.layersTree.getSelectedNodes()[0];
        if (selectedNode) {
            if (selectedNode.itemData.type == "@layer") {
                selectedLayerNode = selectedNode;
            } else if (selectedNode.itemData.type == "@layerClassify") {
                selectedClassifyNode = selectedNode;
                selectedLayerNode = selectedNode.parent;
            }
        }

        if (selectedLayerNode) {
            const layerInfo: OGLayerModel = selectedLayerNode.itemData.layerInfo;
            const layer: VectorImageLayer | VectorLayer = selectedLayerNode.itemData.layerInstance;
            let layerGeometry;
            if (layerInfo && layer) {
                if (layerInfo.geometry === EnumGeometry.MultiPoint) {
                    layerGeometry = EnumGeometry.Point;
                } else if (layerInfo.geometry === EnumGeometry.MultiLineString) {
                    layerGeometry = EnumGeometry.LineString;
                } else if (layerInfo.geometry === EnumGeometry.MultiPolygon) {
                    layerGeometry = EnumGeometry.Polygon;
                } else {
                    layerGeometry = layerInfo.geometry;
                }
                switch (action) {
                    case "create":
                        this.stopEditEventDispatcher.fire({});
                        //
                        this.oGMap.clearMap();
                        this.oGMap.clearInteractions();

                        this.oGMap.draw(layerGeometry, true, true, layerInfo.symbolStyles, (drawFeature) => {
                            const feature = drawFeature;
                            const attributes = {};
                            layerInfo.table.columns.forEach(column => {
                                attributes[column.column_name] = null;
                            });

                            const geojson = OGMapUtils.writeGeoJSONGeometry(feature.getGeometry());
                            $.post("/api/region/check-geometry", { geojson: geojson, snap_table_id: layerInfo.id }).done(xhr => {
                                if (xhr.status === EnumStatus.OK && xhr.data.checkOut && xhr.data.checkOut.id > 0) {
                                    Object.assign(attributes, {
                                        commune_code: xhr.data.region ? xhr.data.region.area_id : "",
                                        district_code: (xhr.data.region && xhr.data.region.district) ? xhr.data.region.district.area_id : "",
                                        province_code: (xhr.data.region && xhr.data.region.district) ? xhr.data.region.district.parent_id : "",
                                    });
                                } else {
                                    this.oGMap.clearMap();
                                    OGUtils.alert("Đối tượng hình học không nằm trong phạm vi cho phép!");
                                }
                                this.featureCreateEventDispatcher.fire({
                                    attributes: attributes,
                                    geometry: feature.getGeometry(),
                                    layer: layer,
                                    layerInfo: layerInfo
                                });
                            });
                        });
                        break;
                    case "edit":
                    case "split":
                        this.stopEditEventDispatcher.fire({});
                        //
                        this.oGMap.clearMap();
                        this.oGMap.clearInteractions();
                        this.selectInteraction = new Select({
                            filter: (feature) => {
                                if (feature.get("features")) {
                                    const items = feature.get("features").filter((item) => {
                                        return item.get("layer_id") === layerInfo.id;
                                    });
                                    return items.length > 0;
                                } else {
                                    return feature.get("layer_id") === layerInfo.id;
                                }
                                //
                            },
                            layers: [layer]
                            // style: function (feature) {
                            // 	return feature.getStyle();
                            // }
                        });
                        this.selectInteraction.on("select", (e) => {
                            let attributes = {};
                            let feature = e.selected[0];
                            if (feature) {
                                if (feature.get("features")) {
                                    const features = feature.get("features");
                                    if (features.length > 1) {
                                        //this.featuresWindow.option('layers', [layerInfo.id])
                                        this.featuresWindow.show();
                                        this.featuresWindow.setData(features.map((f) => {
                                            return Object.assign({
                                                feature: f,
                                                id: f.getId(),
                                                layer: layer,
                                                layerInfo
                                            }, f.getProperties());
                                        }));
                                        this.selectInteraction.getFeatures().clear();
                                        return;
                                    } else {
                                        feature = feature.get("features")[0];
                                    }
                                }
                                attributes = feature.getProperties();
                                const keyColumn = layerInfo.table.key_column ?? layerInfo.table.identity_column;
                                if (keyColumn) {
                                    attributes[keyColumn.column_name] = feature.get("fid");
                                } else {
                                    attributes["id"] = feature.get("fid");
                                }

                                const cloned = feature.clone();
                                cloned.setStyle(undefined);

                                this.featureEditEventDispatcher.fire({
                                    attributes: attributes,
                                    feature: cloned,
                                    geometry: cloned.getGeometry(),
                                    layer: layer,
                                    layerInfo: layerInfo
                                });

                                layer.getSource().removeFeature(feature);

                                this.oGMap.clearInteractions();
                                this.oGMap.getEditorLayer().getSource().clear();
                                this.oGMap.getEditorLayer().getSource().addFeature(cloned);
                                if (action === "edit") {
                                    this.oGMap.modify({
                                        source: this.oGMap.getEditorLayer().getSource()
                                    });
                                } else if (action === "split") {
                                    this.oGMap.modify({
                                        source: this.oGMap.getEditorLayer().getSource()
                                    });
                                    // this.oGMap.split({
                                    //     source: this.oGMap.getEditorLayer().getSource()
                                    // });
                                }
                            }
                        });
                        this.hoverInteraction = new Hover({
                            cursor: "pointer",
                            featureFilter: (feature, hoverLayer) => {
                                if (hoverLayer === layer) {
                                    if (feature.get("features")) {
                                        const items = feature.get("features").filter((item) => {
                                            return item.get("layer_id") === layerInfo.id;
                                        });
                                        return items.length > 0;
                                    } else {
                                        return feature.get("layer_id") === layerInfo.id;
                                    }
                                }
                                return false;
                            },
                            handleEvent: () => {
                                return true;
                            }
                        });
                        this.oGMap.addInteraction(this.hoverInteraction);
                        this.oGMap.addInteraction(this.selectInteraction);

                        this.oGMap.setMapTooltip("Di chuyển và lựa chọn đối tượng muốn cập nhật");
                        this.oGMap.showMapTooltip();
                        break;
                    case "delete":
                        this.stopEditEventDispatcher.fire({});
                        //
                        this.oGMap.clearMap();
                        this.oGMap.clearInteractions();
                        this.selectInteraction = new Select({
                            filter: (feature) => {
                                if (feature.get("features")) {
                                    const items = feature.get("features").filter((item) => {
                                        return item.get("layer_id") === layerInfo.id;
                                    });
                                    return items.length > 0;
                                } else {
                                    return feature.get("layer_id") === layerInfo.id;
                                }
                                //
                            },
                            layers: [layer]
                            // style: function (feature) {
                            // 	return feature.getStyle();
                            // }
                        });
                        this.selectInteraction.on("select", (e) => {
                            let attributes = {};
                            let feature = e.selected[0];
                            if (feature) {
                                if (feature.get("features")) {
                                    const features = feature.get("features");
                                    if (features.length > 1) {
                                        //this.featuresWindow.option('layers', [layerInfo.id])
                                        this.featuresWindow.show();
                                        this.featuresWindow.setData(features.map((f) => {
                                            return Object.assign({
                                                feature: f,
                                                id: f.getId(),
                                                layer: layer,
                                                layerInfo
                                            }, f.getProperties());
                                        }));
                                        this.selectInteraction.getFeatures().clear();
                                        return;
                                    } else {
                                        feature = feature.get("features")[0];
                                    }
                                }
                                attributes = feature.getProperties();
                                const keyColumn = layerInfo.table.key_column ?? layerInfo.table.identity_column;
                                if (keyColumn) {
                                    attributes[keyColumn.column_name] = feature.get("fid");
                                } else {
                                    attributes["id"] = feature.get("fid");
                                }

                                this.featureDeleteEventDispatcher.fire({
                                    attributes: attributes,
                                    feature: feature,
                                    layer: layer,
                                    layerInfo: layerInfo
                                });
                            }
                        });
                        this.hoverInteraction = new Hover({
                            cursor: "pointer",
                            featureFilter: (feature, hoverLayer) => {
                                if (hoverLayer === layer) {
                                    if (feature.get("features")) {
                                        const items = feature.get("features").filter((item) => {
                                            return item.get("layer_id") === layerInfo.id;
                                        });
                                        return items.length > 0;
                                    } else {
                                        return feature.get("layer_id") === layerInfo.id;
                                    }
                                }
                                return false;
                            },
                            handleEvent: () => {
                                return true;
                            }
                        });
                        this.oGMap.addInteraction(this.hoverInteraction);
                        this.oGMap.addInteraction(this.selectInteraction);
                        this.oGMap.setMapTooltip("Di chuyển và lựa chọn đối tượng muốn xóa");
                        this.oGMap.showMapTooltip();
                        break;
                }
            }
        }
    }
    private buildLayersTree(): LayerGroupTreeItem[] {
        const layers = this.oGMap.getLayers().getArray();
        const groups: LayerGroupTreeItem[] = [];
        layers.forEach((layer) => {
            const layerInfos: OGLayerModel[] = layer.get("layerInfo") ? [layer.get("layerInfo")] : layer.get("layerInfos");
            if (!layerInfos || layerInfos.length === 0) {
                return;
            }
            Object.keys(layerInfos).forEach(key => {
                const layerInfo: OGLayerModel = layerInfos[key];
                if (!layerInfo) {
                    return;
                }
                const layerClassify: OGLayerClassifyModel[] = layerInfo.layer_classify;
                const classifyItems: LayerClassifyTreeItem[] = [];
                layerClassify.forEach(function (item) {
                    item.layer = layerInfo;
                    classifyItems.push({
                        disabled: item.selected === false,
                        id: item.id,
                        raw: item,
                        text: item.description,
                        type: "@layerClassify"
                    });
                });
                const layerItem: LayerTreeItem = {
                    disabled: layer.getVisible() === false, // layerInfo?.layer?.get("layerVisibles") ? layerInfo.layer.get("layerVisibles").indexOf(layerInfo.id) < 0 : true,
                    id: "l_" + layerInfo.id,
                    items: classifyItems,
                    layerClassify: layerClassify,
                    layerInfo: layerInfo,
                    layerInstance: layer,
                    raw: layerInfo,
                    text: layerInfo.name_vn,
                    type: "@layer"
                };
                let treeItem: LayerGroupTreeItem;
                const groupItems = groups.filter(x => x.id === ("g_" + (layerInfo.layer_group_id || 0).toString()));
                if (groupItems.length === 0) {
                    if (layerInfo.layer_group_id) {
                        treeItem = {
                            expanded: true,
                            id: "g_" + layerInfo.layer_group_id.toString(),
                            items: [],
                            raw: layerInfo.layer_group,
                            text: layerInfo.layer_group.name_vn,
                            type: "@layergroup"
                        };
                    } else {
                        treeItem = {
                            expanded: true,
                            id: "g_" + (layerInfo.layer_group_id || 0),
                            items: [],
                            raw: { id: 0 } as OGLayerGroupModel,
                            text: "Nhóm dữ liệu khác",
                            type: "@layergroup"
                        };
                    }
                    groups.push(treeItem);
                } else {
                    treeItem = groupItems[0];
                }
                if (layerInfo.layer_group_id === treeItem.raw.id) {
                    if (treeItem.items.filter(x => x.id == `l_${layerInfo.id}`).length === 0) {
                        treeItem.items.push(layerItem);
                    }
                } else {
                    treeItem.items.push(layerItem);
                }
            });
        });
        groups.sort((a, b) => {
            return a.raw.order_id - b.raw.order_id;
        });
        groups.forEach(group => {
            if (group.items && group.items.length) {
                group.items.sort(function (a, b) {
                    if ((a.raw.order - b.raw.order) < 0) {
                        return -1;
                    } else if ((a.raw.order - b.raw.order) > 0) {
                        return 1;
                    } else {
                        if (a.raw["name_vn"] < b.raw["name_vn"]) {
                            return -1;
                        } else if (a.raw["name_vn"] > b.raw["name_vn"]) {
                            return 1;
                        } else
                            return 0;
                    }
                });
            }
        });
        return groups;
    }
    public destroy(): void {

    }
    public hide(): void {
        if (this.popup) {
            this.popup.hide();
        }
        if (this.snapPopup) {
            this.snapPopup.hide();
        }
        //
        this.oGMap.clearInteractions();
        this.oGMap.clearInteractionModify();
        //
        this.stopEditEventDispatcher.fire({});
        //
        this.actionsButtonGroup.option("selectedItems", []);
        if (this.layersTree) {
            this.layersTree.unselectAll();
        }
    }

    public onFeatureCreate(handler: Handler<FeatureCreateEvent>): void {
        this.featureCreateEventDispatcher.register(handler);
    }

    public onFeatureDelete(handler: Handler<FeatureDeleteEvent>): void {
        this.featureDeleteEventDispatcher.register(handler);
    }

    public onFeatureEdit(handler: Handler<FeatureEditEvent>): void {
        this.featureEditEventDispatcher.register(handler);
    }

    public onHidden(handler: Handler<HiddenEvent>): void {
        this.hiddenEventDispatcher.register(handler);
    }

    onInit(): void {
        this.popup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: this._renderBody.bind(this),
            deferRendering: true,
            dragEnabled: true,
            height: 400,
            hideOnOutsideClick: false,
            onHiding: () => {
                this.hiddenEventDispatcher.fire({});
            },
            onShowing: () => {
            },
            position: {
                at: "right bottom",
                // of: "body",
                offset: "-230 -330",
            },
            shading: false,
            showCloseButton: false,
            showTitle: true,
            title: "Biên tập dữ liệu",
            width: 300
        }).dxPopup("instance");

        this._initSnap();

        let timeoutHandler: NodeJS.Timeout;

        this.oGMap.onLayersChange((e) => {
            this.oGMap.onLayersChange(() => {
                if (this.layersTree) {
                    if (timeoutHandler) {
                        clearTimeout(timeoutHandler);
                    }
                    timeoutHandler = setTimeout(() => {
                        this.layersTree.getDataSource().reload();
                    }, 250);
                }
            });
        });
    }

    public onStopEdit(handler: Handler<StopEditEvent>): void {
        this.stopEditEventDispatcher.register(handler);
    }

    public show(): void {
        if (this.popup) {
            this.popup.show();
        }
        if (this.snapPopup) {
            this.snapPopup.show();
        }
    }

    public updateLayerVisible(layerVisibleIds: number[]): void {
        this.visibleLayersID = layerVisibleIds;
        if (this.snapLayersSelectBox) {
            this.snapLayersSelectBox.getDataSource().reload();
            this.snapLayersSelectBox.option("value", this.visibleLayersID);
        }
        if (this.layersTree) {
            this.layersTree.getDataSource().reload();
        }
    }
}

export { FeatureEditorComponent };
