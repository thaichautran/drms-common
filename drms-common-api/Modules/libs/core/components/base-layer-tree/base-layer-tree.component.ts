import { OGMap } from "@opengis/map";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxTreeView, { ItemRenderedEvent } from "devextreme/ui/tree_view";
import {
    Tile as TileLayer
} from "ol/layer";
import VectorTileLayer from "ol/layer/VectorTile";
import { XYZ } from "ol/source";
import { VectorTile as VectorTileSource } from "ol/source";
import { createXYZ } from "ol/tilegrid";
import { applyBackground, applyStyle } from "ol-mapbox-style";

import { EnumStatus } from "../../enums/enums";
import { BaseLayerGroupTreeItem } from "../../models/tree-item.model";
import { IMapComponent } from "../base-component.abstract";
import "./base-layer-tree.component.scss";

interface BaseLayerTreeOption {
    mapId?: number
    oGMap: OGMap,
}
class BaseLayerTreeComponent implements IMapComponent {
    baseLayerTree: dxTreeView;
    container: JQuery<HTMLElement>;
    mapId: number;
    oGMap: OGMap;

    constructor(container: JQuery<HTMLElement>, options: BaseLayerTreeOption) {
        this.oGMap = options.oGMap;
        this.mapId = options.mapId;
        this.container = container;
        this.onInit();
    }

    private renderBaseLayers(items: BaseLayerGroupTreeItem[]): void {
        items.forEach((item, idx) => {
            if (item.items) {
                item.items.forEach((c, index) => {
                    if (c.raw.type === "xyz") {
                        const tileXyz = new TileLayer({
                            source: new XYZ({
                                crossOrigin: "anonymous",
                                url: c.raw.url,
                            }),
                            visible: c.selected,
                        });
                        tileXyz.set("id", c.raw.id, true);
                        tileXyz.set("name", c.raw.name, true);
                        tileXyz.set("data", c.raw, true);
                        this.oGMap.addBaseLayer(tileXyz);
                    } else if (c.raw.type === "mapbox") {
                        const proj = this.oGMap.olMap.getView().getProjection().getCode();

                        // Match the server resolutions
                        const tileGrid = createXYZ({
                            extent: [-180, -90, 180, 90],
                            maxResolution: 180 / 512,
                            maxZoom: 30,
                            tileSize: 512,
                        });

                        const mapBoxLayer = new VectorTileLayer({
                            declutter: true,
                            source: new VectorTileSource({
                                projection: proj,
                                tileGrid: tileGrid,
                            }),
                            visible: c.selected
                        });
                        mapBoxLayer.set("id", c.raw.id, true);
                        mapBoxLayer.set("name", c.raw.name, true);
                        mapBoxLayer.set("data", c.raw, true);
                        applyStyle(mapBoxLayer, c.raw.url, { projection: proj });
                        applyBackground(mapBoxLayer, c.raw.url);
                        this.oGMap.addBaseLayer(mapBoxLayer);
                    } else if (c.raw.type === "esri") {
                        const proj = this.oGMap.olMap.getView().getProjection().getCode();

                        // Match the server resolutions
                        const tileGrid = createXYZ({
                            extent: [-180, -90, 180, 90],
                            maxResolution: 180 / 512,
                            maxZoom: 30,
                            tileSize: 512,
                        });

                        const esrilayer = new VectorTileLayer({
                            declutter: true,
                            source: new VectorTileSource({
                                projection: proj,
                                tileGrid: tileGrid,
                            }),
                            visible: c.selected
                        });
                        esrilayer.set("id", c.raw.id, true);
                        esrilayer.set("name", c.raw.name, true);
                        esrilayer.set("data", c.raw, true);
                        applyStyle(esrilayer, c.raw.url, {
                            projection: proj,
                            transformRequest(url, type) {
                                if (type === "Source") {
                                    return new Request(
                                        url.replace("/VectorTileServer", "/VectorTileServer?f=json"),
                                    );
                                } else if (type === "Tiles") {
                                    return new Request(
                                        url.replace("/tile", "/VectorTileServer/tile"),
                                    );
                                }
                            },
                        });
                        applyBackground(esrilayer, c.raw.url);
                        this.oGMap.addBaseLayer(esrilayer);
                    }
                });
            }
        });
    }

    onInit(): void {
        this.baseLayerTree = this.container.addClass("base-layer-tree").dxTreeView({
            dataSource: new DataSource({
                key: "id",
                store: new CustomStore({
                    key: "id",
                    load: () => {
                        return new Promise((resolve) => {
                            $.get("/api/map/tree-baselayers", { mapId: this.mapId }).done((result) => {
                                if (result.status === EnumStatus.OK) {
                                    this.renderBaseLayers(result.data);
                                    resolve({
                                        data: result.data,
                                        totalCount: result.data.length
                                    });
                                } else {
                                    this.renderBaseLayers([]);
                                    resolve({
                                        data: [],
                                        totalCount: 0
                                    });
                                }
                            });
                        });
                    }
                })
            }),
            focusStateEnabled: false,
            hoverStateEnabled: false,
            itemTemplate: (itemData, index, element) => {
                if (itemData.type === "@baselayergroup") {
                    element.append("<img class=\"dx-icon\" style=\"height:20px;width:20px;\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAFlUExURQAAAP/IQ/7IQ9+xOgD/AMlWU8hVUABrxAD//wBfrQBfrABgrgBis//IQ//IQ//IQ//IQ//IQ//IQ//IQ//IQ//IQ//IQ//IQ//IQ//IQ//TR//JQ//IQ//IQ+q4PvbBQeCwO+SzPO67P96xOemsQv9ua/9raf1wZtteWvVpZP9taMNVUdBaVuhkX7dOScdUTdNcWQBy1CFrtwBpwABwzABxzgBisgBnuwBZogBeqwBisgBovgBZogBfrQBjtQBqwgBcpwBgrwBluABdqgBhsQBnvABDegBeqwBis//IQ/rEQfK7QfzHQvSEWe6nRvXAQP7IQv9taP9safxzZPKNU+6wQ/jDQfxsZ/9saPl4YO+XTvC3Qe9mYf9tZ/5uZ/d+XW1iispgY/doYgBxzwBxzStqsYlgfNxiYPxqZABtxwBxzgBx0AZwyUFno6NfcOlkYABvyhBuw1hklQBwzABsxQBuyP///6pfPpsAAABJdFJOUwAAAAAAAAAAAAAAAAABQcAiiugRa9cGTb/9AjKi9ELiHI7sOsQRatsxwP0xwP0Rats6xByO7ELiAjKi9AZNv/0Ra9ciiugBQcCJtq8aAAAAAWJLR0R2MWPJQQAAAAlwSFlzAAAWewAAFnsBW+49rQAAAAd0SU1FB+cHDAQPMe4sVhsAAAFMSURBVBjTXcj5VwFhFMbxO1mHRJQliiRLZQ3ZC6HRwmtL2Y2S15bt/2+GOsfp+8t97geAiSAIyZ5UuidhBmxiFiHbl1OUfF9GbJg9ioNDat3hgWLNO4RSpdZQv2nUKiWxA0da3TG11bFOewQneupf+hMwnBqz25Q1nhqAwz0zPT790dOj6YzLAd652fL8ksuzlM+9PFvM5zyw2i5QoVgqVyiqUi4VC+jCZoXLK/srQtW391rt/a2K0Kv96hL4Dqer3kDVZqvVrKJG3eV08EEgdHvanS5ChQJC3U7b4xYK4Nrro3sfn/0vhL76nx892ue9Bv/NAOPhaDyZTifj0RDjwY0fAsFQ+BvTw9l8PhvS+DscCgaAJCPR2O0C00x4cRuLRkiSQZH4Lp5Y9jDuLRPxO7GIQWB5N3mfWq1S98ndDbGRIjKdeXjIpJnB/j/0S1ZvYTazLgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wNy0xMlQwNDoxNTo0NCswMDowMOjH+iIAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjMtMDctMTJUMDQ6MTU6NDQrMDA6MDCZmkKeAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDIzLTA3LTEyVDA0OjE1OjQ5KzAwOjAwr1gCgQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAASUVORK5CYII=\"></img>");
                    element.append("<span class=\"base-layer-group-item\">" + itemData.text + "</span>");
                } else {
                    // element.append('<img class="dx-icon" style="height:20px;width:20px;" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDE4LjA2MjVDNS41NTI1IDE4LjA2MjUgMS45Mzc1IDE0LjQ0NzUgMS45Mzc1IDEwQzEuOTM3NSA1LjU1MjUgNS41NTI1IDEuOTM3NSAxMCAxLjkzNzVDMTQuNDQ3NSAxLjkzNzUgMTguMDYyNSA1LjU1MjUgMTguMDYyNSAxMEMxOC4wNjI1IDE0LjQ0NzUgMTQuNDQ3NSAxOC4wNjI1IDEwIDE4LjA2MjVaTTEwIDMuMDYyNUM2LjE3NSAzLjA2MjUgMy4wNjI1IDYuMTc1IDMuMDYyNSAxMEMzLjA2MjUgMTMuODI1IDYuMTc1IDE2LjkzNzUgMTAgMTYuOTM3NUMxMy44MjUgMTYuOTM3NSAxNi45Mzc1IDEzLjgyNSAxNi45Mzc1IDEwQzE2LjkzNzUgNi4xNzUgMTMuODI1IDMuMDYyNSAxMCAzLjA2MjVaIiBmaWxsPSIjODI4QTk1Ii8+CjxwYXRoIGQ9Ik03Ljc0OTY5IDE3LjMxMjVINi45OTk2OUM2LjY5MjE5IDE3LjMxMjUgNi40MzcxOSAxNy4wNTc1IDYuNDM3MTkgMTYuNzVDNi40MzcxOSAxNi40NDI1IDYuNjc3MTkgMTYuMTk1IDYuOTg0NjkgMTYuMTg3NUM1LjgwNzE5IDEyLjE2NzUgNS44MDcxOSA3LjgzMjUgNi45ODQ2OSAzLjgxMjVDNi42NzcxOSAzLjgwNSA2LjQzNzE5IDMuNTU3NSA2LjQzNzE5IDMuMjVDNi40MzcxOSAyLjk0MjUgNi42OTIxOSAyLjY4NzUgNi45OTk2OSAyLjY4NzVINy43NDk2OUM3LjkyOTY5IDIuNjg3NSA4LjEwMjE5IDIuNzc3NSA4LjIwNzE5IDIuOTJDOC4zMTIxOSAzLjA3IDguMzQyMTkgMy4yNTc1IDguMjgyMTkgMy40M0M2Ljg3MjE5IDcuNjY3NSA2Ljg3MjE5IDEyLjMzMjUgOC4yODIxOSAxNi41Nzc1QzguMzQyMTkgMTYuNzUgOC4zMTIxOSAxNi45Mzc1IDguMjA3MTkgMTcuMDg3NUM4LjEwMjE5IDE3LjIyMjUgNy45Mjk2OSAxNy4zMTI1IDcuNzQ5NjkgMTcuMzEyNVoiIGZpbGw9IiM4MjhBOTUiLz4KPHBhdGggZD0iTTEyLjI0OTggMTcuMzEyNUMxMi4xODk4IDE3LjMxMjUgMTIuMTI5OCAxNy4zMDUgMTIuMDY5OCAxNy4yODI1QzExLjc3NzMgMTcuMTg1IDExLjYxMjMgMTYuODYyNSAxMS43MTczIDE2LjU3QzEzLjEyNzMgMTIuMzMyNSAxMy4xMjczIDcuNjY3NDggMTEuNzE3MyAzLjQyMjQ4QzExLjYxOTggMy4xMjk5OCAxMS43NzczIDIuODA3NDggMTIuMDY5OCAyLjcwOTk4QzEyLjM2OTggMi42MTI0OCAxMi42ODQ4IDIuNzY5OTggMTIuNzgyMyAzLjA2MjQ4QzE0LjI3NDggNy41MzI0OCAxNC4yNzQ4IDEyLjQ1MjUgMTIuNzgyMyAxNi45MTVDMTIuNzA3MyAxNy4xNjI1IDEyLjQ4MjMgMTcuMzEyNSAxMi4yNDk4IDE3LjMxMjVaIiBmaWxsPSIjODI4QTk1Ii8+CjxwYXRoIGQ9Ik0xMCAxMy45QzcuOTA3NSAxMy45IDUuODIyNSAxMy42MDc1IDMuODEyNSAxMy4wMTVDMy44MDUgMTMuMzE1IDMuNTU3NSAxMy41NjI1IDMuMjUgMTMuNTYyNUMyLjk0MjUgMTMuNTYyNSAyLjY4NzUgMTMuMzA3NSAyLjY4NzUgMTNWMTIuMjVDMi42ODc1IDEyLjA3IDIuNzc3NSAxMS44OTc1IDIuOTIgMTEuNzkyNUMzLjA3IDExLjY4NzUgMy4yNTc1IDExLjY1NzUgMy40MyAxMS43MTc1QzcuNjY3NSAxMy4xMjc1IDEyLjM0IDEzLjEyNzUgMTYuNTc3NSAxMS43MTc1QzE2Ljc1IDExLjY1NzUgMTYuOTM3NSAxMS42ODc1IDE3LjA4NzUgMTEuNzkyNUMxNy4yMzc1IDExLjg5NzUgMTcuMzIgMTIuMDcgMTcuMzIgMTIuMjVWMTNDMTcuMzIgMTMuMzA3NSAxNy4wNjUgMTMuNTYyNSAxNi43NTc1IDEzLjU2MjVDMTYuNDUgMTMuNTYyNSAxNi4yMDI1IDEzLjMyMjUgMTYuMTk1IDEzLjAxNUMxNC4xNzc1IDEzLjYwNzUgMTIuMDkyNSAxMy45IDEwIDEzLjlaIiBmaWxsPSIjODI4QTk1Ii8+CjxwYXRoIGQ9Ik0xNi43NDg5IDguMzEyNDlDMTYuNjg4OSA4LjMxMjQ5IDE2LjYyODkgOC4zMDQ5OSAxNi41Njg5IDguMjgyNDlDMTIuMzMxNCA2Ljg3MjQ5IDcuNjU4ODYgNi44NzI0OSAzLjQyMTM2IDguMjgyNDlDMy4xMjEzNiA4LjM3OTk5IDIuODA2MzYgOC4yMjI0OSAyLjcwODg2IDcuOTI5OTlDMi42MTg4NiA3LjYyOTk5IDIuNzc2MzYgNy4zMTQ5OSAzLjA2ODg2IDcuMjE3NDlDNy41Mzg4NiA1LjcyNDk5IDEyLjQ1ODkgNS43MjQ5OSAxNi45MjE0IDcuMjE3NDlDMTcuMjEzOSA3LjMxNDk5IDE3LjM3ODkgNy42Mzc0OSAxNy4yNzM5IDcuOTI5OTlDMTcuMjA2NCA4LjE2MjQ5IDE2Ljk4MTQgOC4zMTI0OSAxNi43NDg5IDguMzEyNDlaIiBmaWxsPSIjODI4QTk1Ii8+Cjwvc3ZnPgo="></img>');
                    element.append("<i class=\"dx-icon icon icon-global\"></i>");
                    element.append("<span class=\"base-layer-item\">" + itemData.text + "</span>");
                }
            },
            onItemRendered: (e: ItemRenderedEvent) => {
                if (e.node.children.length != 0) {
                    e.itemElement.parent().find(".dx-checkbox").hide();
                    e.itemElement.css("margin-left", "-15px");
                }
            },
            onItemSelectionChanged: (e) => {
                const raw = e.itemData.raw;
                e.component.getNodes().forEach(node => {
                    if (node.children && node.children.length > 0) {
                        node.children.forEach(item => {
                            const layer = this.oGMap.getBaseLayerById(item.itemData.id);
                            if (layer) {
                                layer.setVisible(false);
                            }
                        });
                    }
                });
                const layer = this.oGMap.getBaseLayerById(raw.id);
                if (layer) {
                    layer.setVisible(e.itemData.selected);
                }
            },
            selectionMode: "single",
            showCheckBoxesMode: "normal"
        }).dxTreeView("instance");
    }
}

export { BaseLayerTreeComponent };
