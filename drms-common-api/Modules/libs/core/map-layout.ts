import { OGMap, OGMapProjection, OGMapUtils } from "@opengis/map";
import { OGMapToolbar, OGMapToolbarItem } from "@opengis/map/src/components/toolbar.component";
import * as turf from "@turf/turf";
import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorImageLayer from "ol/layer/VectorImage";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import AnimatedCluster from "ol-ext/layer/AnimatedCluster";
import olMapScreenshot from "ol-map-screenshot";

import { AttributesEditorComponent } from "./components/attributes-editor/attributes-editor.component";
import { BaseLayerTreeComponent } from "./components/base-layer-tree/base-layer-tree.component";
import { BookMarkComponent } from "./components/bookmark/bookmark.component";
import { ExportMapComponent } from "./components/export-map/export-map.component";
import { FeatureEditorComponent } from "./components/feature-editor/feature-editor.component";
import { IdentifyComponent } from "./components/identify/identify.component";
import { LayerTreeComponent } from "./components/layer-tree/layer-tree.component";
import { LegendComponent } from "./components/legend/legend.component";
import { PrintMapComponent } from "./components/print-map/print-map.component";
import { RegionTreeComponent } from "./components/region-tree/region-tree.component";
import { SearchBoxComponent } from "./components/search-box/search-box.component";
import { SwitchModuleWindowComponent } from "./components/switch-module-window/switch-module-window.component";
import { EnumStatus, EnumsFunction } from "./enums/enums";
import { OGUtils } from "./helpers/utils";
import { Layout } from "./layout";
import "./map-layout.scss";
import { RestError } from "./models/base-response.model";
import { OGMapModel } from "./models/map.model";
import { AreaService } from "./services/area.service";
import { BookMarkService } from "./services/book-mark.service";
import { FeatureService } from "./services/feature.service";

interface MapViewOptions {
    allowSimulate?: boolean
    loaiKiemTra?: string;
    mapId?: number,
    tableSchema?: string,
    title?: string;
}
abstract class MapLayout extends Layout {
    allowSimulate: boolean;
    attributeEditor: AttributesEditorComponent;
    bookMark: BookMarkComponent;
    exportMap: ExportMapComponent;
    featureEditor: FeatureEditorComponent;
    identifyComponent: IdentifyComponent;
    layerTreeComponent: LayerTreeComponent;
    legendComponent: LegendComponent;
    loaiKiemTra: string;
    mapConfig: OGMapModel;
    mapId: number;
    mapToolbar: OGMapToolbar;
    oGMap: OGMap;
    printMap: PrintMapComponent;
    searchBox: SearchBoxComponent;
    switchModule: SwitchModuleWindowComponent;
    tableSchema: string;
    title: string;

    constructor(options: MapViewOptions) {
        super("map");
        this.mapId = options.mapId;
        this.loaiKiemTra = options.loaiKiemTra;
        this.tableSchema = options.tableSchema;
        this.title = options.title;
        this.allowSimulate = options.allowSimulate;
    }

    private bindEvents(): void {
        const self = this;
        $(document).on("click", ".switch-module-action", function () {
            self.switchModule.showPopup();
        });
    }
    private getMapId(): number {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("id")) {
            return parseInt(urlParams.get("id"));
        } else {
            return 0;
        }
    }

    private getSchema(): string {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("tableSchema")) {
            return urlParams.get("tableSchema");
        } else {
            return "";
        }
    }

    private initBookmark(): void {
        this.bookMark = new BookMarkComponent(this.oGMap, { identify: this.identifyComponent, isGeneralMap: false });
    }

    private initFeatureEditor(): void {
        this.featureEditor = new FeatureEditorComponent(this.oGMap, {
            identify: this.identifyComponent
        });
        this.featureEditor.onStopEdit(() => {
            this.attributeEditor.endEdit();
        });
        this.featureEditor.onFeatureCreate((e) => {
            const geometry = e.geometry,
                attributes = e.attributes;

            this.attributeEditor.show();
            this.attributeEditor.beginEdit(attributes, geometry, e.layerInfo);
        });
        this.featureEditor.onFeatureEdit((e) => {
            const geometry = e.geometry,
                feature = e.feature;

            OGUtils.showLoading();
            FeatureService.queryFeature(e.layerInfo.id, 0, feature.get("fid")).then(response => {
                OGUtils.hideLoading();

                if (response) {
                    this.attributeEditor.show();
                    response.attributes.id = parseInt(feature.get("fid"));
                    const files = [];

                    if (response.files && response.files.length > 0) {
                        response.files.forEach(x => {
                            files.push(x);
                        });
                    }
                    this.attributeEditor.beginEdit(response.attributes, geometry, e.layerInfo, undefined, files);
                }
            });
        });
        this.featureEditor.onFeatureDelete((e) => {
            const layer = e.layer;
            const attributes = e.attributes;
            delete attributes["geometry"];
            const data = {
                attributes: attributes,
                layer_id: e.layerInfo.id
            };
            OGUtils.confirm("Bạn có chắc chắn xóa đối tượng ?", "Xác nhận").then((anws) => {
                if (anws) {
                    OGUtils.showLoading();
                    $.ajax({
                        contentType: "application/json",
                        data: JSON.stringify(data),
                        error: (xhr) => {
                            OGUtils.hideLoading();
                            OGUtils.toastError(xhr.responseJSON() as RestError);
                        },
                        success: (xhr) => {
                            OGUtils.hideLoading();
                            if (xhr.status === EnumStatus.OK) {
                                if (layer instanceof VectorLayer || layer instanceof VectorImageLayer) {
                                    layer.getSource().clear(true);
                                    layer.getSource().refresh({ force: true });
                                } else if (layer instanceof AnimatedCluster) {
                                    // layer.getSource().clear();
                                    // layer.getSource().refresh();
                                }

                                OGUtils.toastSuccess("Xóa đối tượng thành công!");
                            } else {
                                OGUtils.toastError("Xóa thông tin thất bại. Vui lòng thử lại sau.");
                            }
                        },
                        type: "POST",
                        url: "/api/feature/delete"
                    });
                }
            });
        });
        this.featureEditor.onHidden(() => {
            this.oGMap.clearMap();
            this.oGMap.clearInteractions();
            this.attributeEditor.hide();
        });
        //
        // $('<div />').appendTo($('<div class="fixed-bottom-container" />').appendTo(container))
        //     .css('padding', '12px')
        //     .dxToolbar({
        //         items: [{
        //             location: 'center',
        //             widget: 'dxButton',
        //             options: {
        //                 text: 'Lưu dữ liệu',
        //                 type: 'success',
        //                 onClick: () => {
        //                     if (this.attributeEditor.validate()) {
        //                         this.attributeEditor.save();
        //                     }
        //                 }
        //             }
        //         }, {
        //             location: 'center',
        //             widget: 'dxButton',
        //             options: {
        //                 text: 'Hủy bỏ',
        //                 type: 'danger',
        //                 onClick: () => {
        //                     if (this.attributeEditor.isDirty) {
        //                         OGUtils.confirm("Mọi thông tin cập nhập sẽ mất, bạn có muốn hủy thao tác này không?", "Xác nhận").then((value) => {
        //                             if (value) {
        //                                 this.attributeEditor.endEdit();
        //                             }
        //                         });
        //                     } else {
        //                         this.attributeEditor.endEdit();
        //                     }
        //                 }
        //             }
        //         }]
        //     });
    }

    private initLayerTree(): void {
        const viewContainer = $("<div></div>").appendTo($("#layerTreeContainer"));
        new BaseLayerTreeComponent($("<div></div>").appendTo(viewContainer), {
            mapId: this.mapId,
            oGMap: this.oGMap
        });
        this.layerTreeComponent = new LayerTreeComponent($("<div></div>").appendTo(viewContainer), {
            attributesEditor: this.attributeEditor,
            cluster: this.mapConfig.cluster,
            config: this.config,
            extent: this.mapConfig.boundary ? turf.bbox(JSON.parse(this.mapConfig.boundary)) : null,
            identify: this.identifyComponent,
            mapId: this.mapId,
            oGMap: this.oGMap,
            showLayerActions: true,
            tableSchema: this.tableSchema
        });

        viewContainer.dxScrollView({
            direction: "vertical",
            height: "100%",
            showScrollbar: "always",
            width: "100%"
        });
    }

    private initLayout(): void {
        if (this.title) {
            $(".header-title .title > span").html(this.title).attr("title", this.title);
        } else if (this.mapConfig && this.mapConfig.name) {
            $(".header-title .title > span").html(this.mapConfig?.name).attr("title", this.mapConfig?.name);
        }

        OGMapProjection.setMapProjection("EPSG:4326");
        OGMapProjection.setDataProjection("EPSG:4326");

        const map_projection_key = localStorage.getItem("map_projection") ? localStorage.getItem("map_projection") : "EPSG:4326";
        const coorCenter = this.mapConfig ? this.mapConfig.center.split(",") : undefined;

        this.oGMap = new OGMap({
            autoUpdateMapSize: true,
            center: OGMapProjection.projectDataGeom(coorCenter ? [parseFloat(coorCenter[0]), parseFloat(coorCenter[1])] : [105.8194541, 21.0227387], "EPSG:4326", map_projection_key),
            constrainResolution: false,
            container: document.getElementById("map"),
            defaultZoom: (this.mapConfig && this.mapConfig.defaultzoom) ? this.mapConfig.defaultzoom : 10,
            enableOverviewMap: false,
            extensions: ["location"],
            featureZoom: 16,
            mapPadding: [40, 40, 40, 40],
            maxZoom: (this.mapConfig && this.mapConfig.maxzoom) ? this.mapConfig.maxzoom : 20,
            minZoom: (this.mapConfig && this.mapConfig.minzoom) ? this.mapConfig.minzoom : 0,
            projection: map_projection_key,
            saveLastExtent: true,
            zoom: 6,
        });
        this.oGMap.onLoad(() => {
            this.oGMap.contextMenu.on("open", (evt) => {
                const feature = this.oGMap.olMap.forEachFeatureAtPixel(evt.pixel, (ft) => {
                    return ft;
                });
                if (feature && !feature.get("features")) {
                    this.oGMap.contextMenu.clear();
                    this.oGMap.contextMenu.push({
                        callback: () => {

                        },
                        text: "Xóa đối tượng này",
                    });
                    // this.oGMap.contextMenu.push({
                    //     callback: (e) => {
                    //         // const geometry = feature.getGeometry();
                    //         // OGUtils.showLoading();
                    //         // $.get("/api/feature/query-feature/" + e.layerInfo.id + "/" + feature.get("fid"))
                    //         //     .done(xhr => {
                    //         //         OGUtils.hideLoading();
                    //         //         if (xhr.data) {
                    //         //             this.attributeEditor.show();
                    //         //             xhr.data.feature.id = feature.get("fid");
                    //         //             this.attributeEditor.beginEdit(e.layerInfo, geometry, xhr.data.feature, xhr.data.files);
                    //         //         }
                    //         //     });
                    //     },
                    //     text: "Sửa thông tin",
                    // });
                    // this.oGMap.contextMenu.push({
                    //     callback: () => {

                    //     },
                    //     text: "Xóa đối tượng này",
                    // });
                }
            });
            // Bookmark
            const url = window.location.href;
            if (url.indexOf("?") > -1) {
                const urlParams = url.slice(url.indexOf("?") + 1).split("&");
                for (let i = 0; i < urlParams.length; i++) {
                    if (urlParams[i].indexOf("r") > -1) {
                        const key = urlParams[i].split("=")[1];
                        BookMarkService.get(key).then(result => {
                            if (result) {
                                const extent = JSON.parse(result.extent);
                                this.oGMap.fitExtentAnimate(extent);
                            }
                        });
                    }
                }
            }
            const controls: (OGMapToolbarItem | string)[] = [
                OGMapToolbar.FULL_EXTENT,
                OGMapToolbar.DEFAULT,
                {
                    name: OGMapToolbar.DEFAULT_ZOOM_IN,
                    onSelect: () => {
                        if (this.oGMap.getZoom() < this.mapConfig.maxzoom) {
                            this.oGMap.setZoom(this.oGMap.getZoom() + 1);
                        }
                    },
                    title: "Phóng to",
                    toggle: false
                },
                {
                    name: OGMapToolbar.DEFAULT_ZOOM_OUT,
                    onSelect: () => {
                        if (this.oGMap.getZoom() > this.mapConfig.minzoom) {
                            this.oGMap.setZoom(this.oGMap.getZoom() - 1);
                        }
                    },
                    title: "Thu nhỏ",
                    toggle: false
                },
                OGMapToolbar.ZOOM_IN,
                OGMapToolbar.ZOOM_OUT,
                OGMapToolbar.IDENTIFY,
                OGMapToolbar.REFRESH,
                OGMapToolbar.LEGEND,
                // {
                //     image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1IDIyLjc1SDlDMy41NyAyMi43NSAxLjI1IDIwLjQzIDEuMjUgMTVWOUMxLjI1IDMuNTcgMy41NyAxLjI1IDkgMS4yNUgxNUMyMC40MyAxLjI1IDIyLjc1IDMuNTcgMjIuNzUgOVYxNUMyMi43NSAyMC40MyAyMC40MyAyMi43NSAxNSAyMi43NVpNOSAyLjc1QzQuMzkgMi43NSAyLjc1IDQuMzkgMi43NSA5VjE1QzIuNzUgMTkuNjEgNC4zOSAyMS4yNSA5IDIxLjI1SDE1QzE5LjYxIDIxLjI1IDIxLjI1IDE5LjYxIDIxLjI1IDE1VjlDMjEuMjUgNC4zOSAxOS42MSAyLjc1IDE1IDIuNzVIOVoiIGZpbGw9IiM4MDg2OGIiLz4KPHBhdGggZD0iTTguNjggMTUuMzNDOC4yNiAxNS4zMyA3Ljg3IDE1LjIzIDcuNTMgMTUuMDRDNi43IDE0LjU3IDYuMjUgMTMuNjQgNi4yNSAxMi40MlYyLjQ0QzYuMjUgMi4wMyA2LjU5IDEuNjkgNyAxLjY5QzcuNDEgMS42OSA3Ljc1IDIuMDMgNy43NSAyLjQ0VjEyLjQyQzcuNzUgMTMuMDcgNy45NCAxMy41NSA4LjI3IDEzLjczQzguNjIgMTMuOTMgOS4xNiAxMy44MyA5Ljc1IDEzLjQ4TDExLjA3IDEyLjY5QzExLjYxIDEyLjM3IDEyLjM4IDEyLjM3IDEyLjkyIDEyLjY5TDE0LjI0IDEzLjQ4QzE0Ljg0IDEzLjg0IDE1LjM4IDEzLjkzIDE1LjcyIDEzLjczQzE2LjA1IDEzLjU0IDE2LjI0IDEzLjA2IDE2LjI0IDEyLjQyVjIuNDRDMTYuMjQgMi4wMyAxNi41OCAxLjY5IDE2Ljk5IDEuNjlDMTcuNCAxLjY5IDE3Ljc0IDIuMDMgMTcuNzQgMi40NFYxMi40MkMxNy43NCAxMy42NCAxNy4yOSAxNC41NyAxNi40NiAxNS4wNEMxNS42MyAxNS41MSAxNC41NCAxNS40MSAxMy40NyAxNC43N0wxMi4xNSAxMy45OEMxMi4wOSAxMy45NCAxMS45IDEzLjk0IDExLjg0IDEzLjk4TDEwLjUyIDE0Ljc3QzkuOSAxNS4xNCA5LjI2IDE1LjMzIDguNjggMTUuMzNaIiBmaWxsPSIjODA4NjhiIi8+CjxwYXRoIGQ9Ik0xNSAyMi43NUg5QzMuNTcgMjIuNzUgMS4yNSAyMC40MyAxLjI1IDE1VjlDMS4yNSAzLjU3IDMuNTcgMS4yNSA5IDEuMjVIMTVDMjAuNDMgMS4yNSAyMi43NSAzLjU3IDIyLjc1IDlWMTVDMjIuNzUgMjAuNDMgMjAuNDMgMjIuNzUgMTUgMjIuNzVaTTkgMi43NUM0LjM5IDIuNzUgMi43NSA0LjM5IDIuNzUgOVYxNUMyLjc1IDE5LjYxIDQuMzkgMjEuMjUgOSAyMS4yNUgxNUMxOS42MSAyMS4yNSAyMS4yNSAxOS42MSAyMS4yNSAxNVY5QzIxLjI1IDQuMzkgMTkuNjEgMi43NSAxNSAyLjc1SDlaIiBmaWxsPSIjODA4NjhiIi8+CjxwYXRoIGQ9Ik04LjY4IDE1LjMzQzguMjYgMTUuMzMgNy44NyAxNS4yMyA3LjUzIDE1LjA0QzYuNyAxNC41NyA2LjI1IDEzLjY0IDYuMjUgMTIuNDJWMi40NEM2LjI1IDIuMDMgNi41OSAxLjY5IDcgMS42OUM3LjQxIDEuNjkgNy43NSAyLjAzIDcuNzUgMi40NFYxMi40MkM3Ljc1IDEzLjA3IDcuOTQgMTMuNTUgOC4yNyAxMy43M0M4LjYyIDEzLjkzIDkuMTYgMTMuODMgOS43NSAxMy40OEwxMS4wNyAxMi42OUMxMS42MSAxMi4zNyAxMi4zOCAxMi4zNyAxMi45MiAxMi42OUwxNC4yNCAxMy40OEMxNC44NCAxMy44NCAxNS4zOCAxMy45MyAxNS43MiAxMy43M0MxNi4wNSAxMy41NCAxNi4yNCAxMy4wNiAxNi4yNCAxMi40MlYyLjQ0QzE2LjI0IDIuMDMgMTYuNTggMS42OSAxNi45OSAxLjY5QzE3LjQgMS42OSAxNy43NCAyLjAzIDE3Ljc0IDIuNDRWMTIuNDJDMTcuNzQgMTMuNjQgMTcuMjkgMTQuNTcgMTYuNDYgMTUuMDRDMTUuNjMgMTUuNTEgMTQuNTQgMTUuNDEgMTMuNDcgMTQuNzdMMTIuMTUgMTMuOThDMTIuMDkgMTMuOTQgMTEuOSAxMy45NCAxMS44NCAxMy45OEwxMC41MiAxNC43N0M5LjkgMTUuMTQgOS4yNiAxNS4zMyA4LjY4IDE1LjMzWiIgZmlsbD0iIzgwODY4YiIvPgo8L3N2Zz4K",
                //     name: "LEGEND",
                //     onActivate: () => {
                //         if (this.legendComponent) {
                //             this.legendComponent.show();
                //         }
                //     },
                //     onDeactivate: () => {
                //         if (this.legendComponent) {
                //             this.legendComponent.hide();
                //         }
                //     },
                //     title: "Chú giải",
                //     toggle: true
                // },
                {
                    image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTcuNzUgMTguNUM0LjE3IDE4LjUgMS4yNSAxNS41OCAxLjI1IDEyQzEuMjUgOC40MiA0LjE3IDUuNSA3Ljc1IDUuNUM4LjE2IDUuNSA4LjUgNS44NCA4LjUgNi4yNUM4LjUgNi42NiA4LjE2IDcgNy43NSA3QzQuOTkgNyAyLjc1IDkuMjQgMi43NSAxMkMyLjc1IDE0Ljc2IDQuOTkgMTcgNy43NSAxN0MxMC41MSAxNyAxMi43NSAxNC43NiAxMi43NSAxMkMxMi43NSAxMS41OSAxMy4wOSAxMS4yNSAxMy41IDExLjI1QzEzLjkxIDExLjI1IDE0LjI1IDExLjU5IDE0LjI1IDEyQzE0LjI1IDE1LjU4IDExLjMzIDE4LjUgNy43NSAxOC41WiIgZmlsbD0iIzgwODY4YiIvPgo8cGF0aCBkPSJNMTYgMTguNzVDMTUuNTkgMTguNzUgMTUuMjUgMTguNDEgMTUuMjUgMThDMTUuMjUgMTcuNTkgMTUuNTkgMTcuMjUgMTYgMTcuMjVDMTguODkgMTcuMjUgMjEuMjUgMTQuODkgMjEuMjUgMTJDMjEuMjUgOS4xMSAxOC44OSA2Ljc1IDE2IDYuNzVDMTMuMTEgNi43NSAxMC43NSA5LjExIDEwLjc1IDEyQzEwLjc1IDEyLjQxIDEwLjQxIDEyLjc1IDEwIDEyLjc1QzkuNTkgMTIuNzUgOS4yNSAxMi40MSA5LjI1IDEyQzkuMjUgOC4yOCAxMi4yOCA1LjI1IDE2IDUuMjVDMTkuNzIgNS4yNSAyMi43NSA4LjI4IDIyLjc1IDEyQzIyLjc1IDE1LjcyIDE5LjcyIDE4Ljc1IDE2IDE4Ljc1WiIgZmlsbD0iIzgwODY4YiIvPgo8L3N2Zz4=",
                    name: "BOOKMARK",
                    onActivate: () => {
                        if (this.bookMark) {
                            this.bookMark.show();
                        }
                    },
                    onDeactivate: () => {
                        if (this.bookMark) {
                            this.bookMark.hide();
                        }
                    },
                    title: "Đánh dấu",
                    toggle: true
                },
                OGMapToolbar.MEASUREMENT_LENGTH,
                OGMapToolbar.MEASUREMENT_AREA,
                OGMapToolbar.LOCATION,

                {
                    name: OGMapToolbar.PRINT,
                    onActivate: () => {
                        this.printMap.getPrintControl().print({
                            orientation: "landscape",
                            size: "A4",
                            value: ""
                        });
                    },
                    title: "In bản đồ",
                },
                {
                    image: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTE3LjIzOTcgMjIuNzVINi43NTk2OUMzLjk1OTY5IDIyLjc1IDIuMTc5NjkgMjEuMDggMi4wMTk2OSAxOC4yOUwxLjQ5OTY5IDEwLjA0QzEuNDE5NjkgOC43OSAxLjg0OTY5IDcuNTkgMi43MDk2OSA2LjY4QzMuNTU5NjkgNS43NyA0Ljc1OTY5IDUuMjUgNS45OTk2OSA1LjI1QzYuMzE5NjkgNS4yNSA2LjYyOTY5IDUuMDYgNi43Nzk2OSA0Ljc2TDcuNDk5NjkgMy4zM0M4LjA4OTY5IDIuMTYgOS41Njk2OCAxLjI1IDEwLjg1OTcgMS4yNUgxMy4xNDk3QzE0LjQzOTcgMS4yNSAxNS45MDk3IDIuMTYgMTYuNDk5NyAzLjMyTDE3LjIxOTcgNC43OEMxNy4zNjk3IDUuMDYgMTcuNjY5NyA1LjI1IDE3Ljk5OTcgNS4yNUMxOS4yMzk3IDUuMjUgMjAuNDM5NyA1Ljc3IDIxLjI4OTcgNi42OEMyMi4xNDk3IDcuNiAyMi41Nzk3IDguNzkgMjIuNDk5NyAxMC4wNEwyMS45Nzk3IDE4LjNDMjEuNzk5NyAyMS4xMyAyMC4wNjk3IDIyLjc1IDE3LjIzOTcgMjIuNzVaTTEwLjg1OTcgMi43NUMxMC4xMTk3IDIuNzUgOS4xNzk2OSAzLjMzIDguODM5NjkgNEw4LjExOTY5IDUuNDRDNy42OTk2OSA2LjI1IDYuODg5NjkgNi43NSA1Ljk5OTY5IDYuNzVDNS4xNTk2OSA2Ljc1IDQuMzc5NjggNy4wOSAzLjc5OTY5IDcuN0MzLjIyOTY5IDguMzEgMi45Mzk2OSA5LjExIDIuOTk5NjkgOS45NEwzLjUxOTY5IDE4LjJDMy42Mzk2OSAyMC4yMiA0LjcyOTY5IDIxLjI1IDYuNzU5NjkgMjEuMjVIMTcuMjM5N0MxOS4yNTk3IDIxLjI1IDIwLjM0OTcgMjAuMjIgMjAuNDc5NyAxOC4yTDIwLjk5OTcgOS45NEMyMS4wNDk3IDkuMTEgMjAuNzY5NyA4LjMxIDIwLjE5OTcgNy43QzE5LjYxOTcgNy4wOSAxOC44Mzk3IDYuNzUgMTcuOTk5NyA2Ljc1QzE3LjEwOTcgNi43NSAxNi4yOTk3IDYuMjUgMTUuODc5NyA1LjQ2TDE1LjE0OTcgNEMxNC44MTk3IDMuMzQgMTMuODc5NyAyLjc2IDEzLjEzOTcgMi43NkgxMC44NTk3VjIuNzVaIiBmaWxsPSIjODA4NjhiIi8+CjxwYXRoIGQ9Ik0xMy41IDguNzVIMTAuNUMxMC4wOSA4Ljc1IDkuNzUgOC40MSA5Ljc1IDhDOS43NSA3LjU5IDEwLjA5IDcuMjUgMTAuNSA3LjI1SDEzLjVDMTMuOTEgNy4yNSAxNC4yNSA3LjU5IDE0LjI1IDhDMTQuMjUgOC40MSAxMy45MSA4Ljc1IDEzLjUgOC43NVoiIGZpbGw9IiM4MDg2OGIiLz4KPHBhdGggZD0iTTEyIDE4Ljc1QzkuNzkgMTguNzUgOCAxNi45NiA4IDE0Ljc1QzggMTIuNTQgOS43OSAxMC43NSAxMiAxMC43NUMxNC4yMSAxMC43NSAxNiAxMi41NCAxNiAxNC43NUMxNiAxNi45NiAxNC4yMSAxOC43NSAxMiAxOC43NVpNMTIgMTIuMjVDMTAuNjIgMTIuMjUgOS41IDEzLjM3IDkuNSAxNC43NUM5LjUgMTYuMTMgMTAuNjIgMTcuMjUgMTIgMTcuMjVDMTMuMzggMTcuMjUgMTQuNSAxNi4xMyAxNC41IDE0Ljc1QzE0LjUgMTMuMzcgMTMuMzggMTIuMjUgMTIgMTIuMjVaIiBmaWxsPSIjODA4NjhiIi8+Cjwvc3ZnPg==",
                    name: "SCREENSHOT",
                    onSelect: async () => {
                        const response = await olMapScreenshot.getScreenshot(this.oGMap.olMap, {
                            format: "png"
                        });
                        const element = document.createElement("a");
                        element.setAttribute("href", response.img);
                        element.setAttribute("download", "map");
                        element.style.display = "none";
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                    },
                    title: "Chụp ảnh khung nhìn bản đồ",
                    toggle: false
                }
            ];
            if (this.oGConfig.canCreate() || this.oGConfig.canUpdate() || this.oGConfig.canDelete()) {
                controls.push({
                    name: OGMapToolbar.EDITOR,
                    onActivate: () => {
                        if (this.featureEditor) {
                            this.featureEditor.show();
                        }
                    },
                    onDeactivate: () => {
                        if (this.featureEditor) {
                            this.featureEditor.hide();
                        }
                    },
                    title: "Biên tập"
                } as OGMapToolbarItem);
            }
            this.mapToolbar = new OGMapToolbar(this.oGMap, {
                controls: controls,
                defaultControl: OGMapToolbar.IDENTIFY,
                direction: "vertical",
                onChange: () => { },
                onSelect: (e) => {
                    if (this.attributeEditor.isDirty) {
                        if (e.newTool.toggle) {
                            e.target.preventDefault();
                            //
                            OGUtils.confirm("Lưu thông tin trước khi chuyển thao tác mới?", "Xác nhận").then((value) => {
                                if (value) {
                                    if (this.attributeEditor.validate()) {
                                        this.attributeEditor.save();
                                    }
                                } else {
                                    this.attributeEditor.endEdit();
                                    e.sender.activate(e.newTool.name);
                                }
                            });
                        }
                    }
                },
                position: "top-right",
            });
        });
        const boundaryLayer = new VectorImageLayer({
            source: new VectorSource(),
            style: new Style({
                fill: new Fill({
                    color: "transparent",
                }),
                stroke: new Stroke({
                    color: "rgba(255, 100, 0, 1)",
                    width: 3
                })
            })
        });
        if (this.mapConfig.boundary) {
            boundaryLayer.getSource().addFeatures(OGMapUtils.parseGeoJSON(this.mapConfig.boundary));
        }
        this.oGMap.addLayer(boundaryLayer);
        this.oGMap.fitBounds(this.mapConfig.boundary, [10, 10, 10, 10]);
        this.exportMap = new ExportMapComponent(this.oGMap);
        this.printMap = new PrintMapComponent(this.oGMap);

        this.attributeEditor = new AttributesEditorComponent(this.oGMap);
        this.identifyComponent = new IdentifyComponent(this.oGMap, {
            allowDelete: this.oGConfig.hasPermission(EnumsFunction.DELETE),
            allowEditing: this.oGConfig.hasPermission(EnumsFunction.UPDATE),
            allowSimulate: this.allowSimulate,
            attributeEditors: this.attributeEditor,
            loaiKiemTra: this.loaiKiemTra,
            oGConfig: this.oGConfig
        });
        this.initRegionTree($("#regionContainer"));
        this.initLayerTree();
        this.initSearchBox($("#search-box-container"));
        // this.initLegend($("#legendContainer"));
        this.initFeatureEditor();
        this.initBookmark();
        this.bindEvents();
    }

    // private initLegend(container): void {
    //     this.legendComponent = new LegendComponent(this.oGMap);
    // }
    private initRegionTree(container): void {
        new RegionTreeComponent({
            container: container,
            mapId: this.mapId,
            oGMap: this.oGMap,
        });
    }
    private initSearchBox(container: JQuery<HTMLElement>): void {
        this.searchBox = new SearchBoxComponent(container, {
            identify: this.identifyComponent,
            layerTreeComponent: this.layerTreeComponent,
            mapId: this.mapId,
            oGMap: this.oGMap,
            tableSchema: this.tableSchema
        });
    }

    protected onInit(): void {
        if (this.mapId) {
            $.get("/api/map/" + this.mapId).then(xhr => {
                if (xhr && xhr.status === EnumStatus.OK && xhr.data) {
                    this.mapConfig = xhr.data;
                }
                this.initLayout();
                if (this.onInitMap) {
                    this.onInitMap();
                }
            });
        }
    }

    protected abstract onInitMap(): void;
}

export { MapLayout };
