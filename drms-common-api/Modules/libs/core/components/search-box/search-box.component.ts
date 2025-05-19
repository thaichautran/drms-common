import { OGMap, OGMapUtils } from "@opengis/map";
import { LocationExtension } from "@opengis/map/src/extensions/location.extension";
import axios from "axios";
import { LoadResultObject, GroupItem as StoreGroupItem } from "devextreme/common/data/custom-store";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxButton from "devextreme/ui/button";
import dxDataGrid, { SummaryTotalItem } from "devextreme/ui/data_grid";
import { Column as dxDataGridColumn } from "devextreme/ui/data_grid_types";
import "devextreme/ui/drop_down_box";
import dxDropDownButton from "devextreme/ui/drop_down_button";
import dxForm, { GroupItem, Item, SimpleItem } from "devextreme/ui/form";
import dxPopup from "devextreme/ui/popup";
import dxScrollView from "devextreme/ui/scroll_view";
import dxSelectBox from "devextreme/ui/select_box";
import dxTabPanel from "devextreme/ui/tab_panel";
import "devextreme/ui/tag_box";
import dxTagBox, { Options as dxTagBoxOptions } from "devextreme/ui/tag_box";
import "devextreme/ui/tag_box";
import dxToolbar from "devextreme/ui/toolbar";
import { options } from "dropzone";
import moment from "moment";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import { Type } from "ol/geom/Geometry";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";

import { EnumDataType, EnumGeometry, EnumStatus, EnumTypeOf } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { OGLayerDomainModel, OGLayerModel } from "../../models/layer.model";
import { OGTableColumnModel, OGTableModel } from "../../models/table.model";
import { AreaService } from "../../services/area.service";
import { DmTuyenService } from "../../services/dm-tuyen.service";
import { FeatureService } from "../../services/feature.service";
import { LayerService } from "../../services/layer.service";
import { TableColumnService, TableService } from "../../services/table.service";
import { IMapComponent } from "../base-component.abstract";
import { IdentifyComponent } from "../identify/identify.component";
import { LayerTreeComponent } from "../layer-tree/layer-tree.component";
import "./search-box.component.scss";

interface SearchBoxOptions {
    identify: IdentifyComponent;
    layerTreeComponent: LayerTreeComponent;
    mapId?: number
    oGMap: OGMap;
    tableSchema?: string;
}

class SearchBoxComponent implements IMapComponent {
    private advancedSearchForm: dxForm;
    private arguments: { [key: string]: boolean | number | object | string } = undefined;
    private btnIdentify: dxButton;
    private btnZoomIn: dxButton;
    private container: JQuery<HTMLElement>;
    private domains: OGLayerDomainModel;
    private drawFeature: Feature;
    private exportGroupButton: dxDropDownButton;
    private grid: dxDataGrid;
    private identifyComponent: IdentifyComponent;
    private key: string[];
    private layerTreeComponent: LayerTreeComponent;
    private mapId: number;
    private popup: dxPopup;
    private relations: [];
    private schema: string;
    private searchCommomFormContainer: JQuery<HTMLElement>;
    private searchCommonForm: dxForm;
    private searchFeatureLayer: VectorLayer<VectorSource<Feature>>;
    private searchForm: dxForm;
    private searchFormContainer: JQuery<HTMLElement>;
    private searchTabs: dxTabPanel;
    private searchToolbar: dxToolbar;
    dvqlSearchForm: dxForm;
    isVisible: boolean = false;
    oGMap: OGMap;
    regionSearchForm: dxForm;
    constructor(container: JQuery<HTMLElement>, options: SearchBoxOptions) {
        this.oGMap = options.oGMap;
        this.schema = options.tableSchema;
        this.container = $("<div/>").addClass("search-box-wrapper").appendTo(container);
        this.mapId = options.mapId;
        this.key = ["uid", "objectid", "id"];
        this.identifyComponent = options.identify;
        this.layerTreeComponent = options.layerTreeComponent;
        this.initLayout();
        this.onInit();
    }
    //Xây dựng form tìm kiếm
    private bindSearchForm(filterSelectedColumns: OGTableColumnModel[]): void {
        if (!this.searchForm)
            return;
        let key = "uid";
        let formItems = [];
        let selectedLayers = [];
        const layerEditor = this.searchCommonForm.getEditor("layer_id");

        if (layerEditor && layerEditor instanceof dxTagBox) {
            selectedLayers = layerEditor.option("selectedItems");
        }
        if (selectedLayers.length > 0) {
            //
        } else if (selectedLayers.length === 1) {
            //
        }

        filterSelectedColumns.forEach((column, idx) => {
            if (idx === filterSelectedColumns.length - 1) {
                formItems = $.merge(formItems, this.initItemSearchForm(column, 2));
            } else {
                if (filterSelectedColumns[idx + 1].data_type === EnumDataType.integer
                    || filterSelectedColumns[idx + 1].data_type === EnumDataType.double
                    || filterSelectedColumns[idx + 1].data_type === EnumDataType.date
                    || filterSelectedColumns[idx + 1].data_type === EnumDataType.dateTime
                    || filterSelectedColumns[idx + 1].data_type === EnumDataType.dateTimeTZ) {
                    formItems = [...formItems, ...this.initItemSearchForm(column, 2)];
                } else {
                    if (filterSelectedColumns[idx].data_type === EnumDataType.integer
                        || filterSelectedColumns[idx].data_type === EnumDataType.double
                        || filterSelectedColumns[idx].data_type === EnumDataType.date
                        || filterSelectedColumns[idx].data_type === EnumDataType.dateTime
                        || filterSelectedColumns[idx].data_type === EnumDataType.dateTimeTZ) {
                        formItems = [...formItems, ...this.initItemSearchForm(column, 2)];
                    } else {
                        formItems = [...formItems, ...this.initItemSearchForm(column, 2)];
                    }
                }
            }
        });
        if (selectedLayers.length > 0) {
            const keyColumn = selectedLayers[0].table.key_column ?? selectedLayers[0].table.identity_column;
            key = keyColumn ? keyColumn.column_name : "uid";
        }

        const items: Item[] = [];
        if (formItems.length) {
            items.push({
                colCount: 2,
                itemType: "group",
                items: formItems
            });
        }

        this.searchForm.beginUpdate();
        this.searchForm.resetValues();
        this.searchForm.option("items", items);
        this.searchForm.option("visible", true);
        this.searchForm.endUpdate();
        // if (selectedLayers.length) {
        //     this.grid.beginUpdate();
        //     this.grid.option("dataSource", {
        //         store: new CustomStore({
        //             key: key,
        //             load: (loadOptions) => {
        //                 return new Promise((resolve, reject) => {
        //                     if (this.arguments) {
        //                         if (loadOptions.sort) {
        //                             this.arguments["orderby"] = loadOptions.sort[0].selector;
        //                             if (loadOptions.sort[0].desc)
        //                                 this.arguments["orderby"] += " desc";
        //                         }

        //                         this.arguments["skip"] = loadOptions.skip ? loadOptions.skip : 0;
        //                         this.arguments["take"] = loadOptions.take ? loadOptions.take : 50;
        //                         this.arguments["totalSummary"] = loadOptions.totalSummary;
        //                         this.arguments.groupSummary = loadOptions.groupSummary;
        //                         this.arguments.group = loadOptions.group;
        //                         this.arguments.requireGroupCount = loadOptions.requireGroupCount;
        //                         this.arguments.requireTotalCount = loadOptions.requireTotalCount;
        //                         this.arguments.filter = {};
        //                         if (loadOptions.filter && loadOptions.filter.length) {
        //                             this.arguments.params = {};
        //                             this.arguments.filter = loadOptions.filter;
        //                             if (!(loadOptions.filter[0] instanceof Array)) {
        //                                 if (loadOptions.filter[0] === "province_code" || loadOptions.filter[0] === "district_code" || loadOptions.filter[0] === "commune_code") {
        //                                     this.arguments.params[loadOptions.filter[0]] = [loadOptions.filter[2]];
        //                                 } else if (loadOptions.filter[0] === "table_name") {
        //                                     this.arguments.params[loadOptions.filter[0]] = loadOptions.filter[2];
        //                                 }
        //                             } else {
        //                                 $.each(loadOptions.filter, (idx: number, item) => {
        //                                     if (item instanceof Array) {
        //                                         if (item[0] === "province_code" || item[0] === "district_code" || item[0] === "commune_code") {
        //                                             this.arguments.params[item[0]] = [item[2]];
        //                                         } else if (item[0] === "table_name") {
        //                                             this.arguments.params[item[0]] = item[2];
        //                                         }
        //                                     }
        //                                 });
        //                             }
        //                         }

        //                         axios.post("/api/feature/quick-search", this.arguments).then((result) => {
        //                             if (result.data.status === EnumStatus.OK) {
        //                                 this.domains = result.data.data.domains;
        //                                 this.relations = result.data.data.relations;
        //                                 if (result.data.data.dataSearch.totalCount === 1 && result.data.data.dataSearch.items && result.data.data.dataSearch.items.length === 1) {
        //                                     const item = result.data.data.dataSearch.items[0];
        //                                     FeatureService.queryFeature(0, item.table_id, item.id).then(response => {
        //                                         if (response.attributes && response.attributes.geom) {
        //                                             this.oGMap.fitBounds(response.attributes.geom?.toString());
        //                                             this.oGMap.highlightIdentifyFeature(response.attributes.geom?.toString());
        //                                         }
        //                                     });
        //                                 } else {
        //                                     if (result.data.data.dataSearch.boundary) {
        //                                         this.oGMap.fitBounds(result.data.data.dataSearch.boundary, [40, 40, 40, 40]);
        //                                     }
        //                                 }
        //                                 if (loadOptions.requireGroupCount) {
        //                                     resolve({
        //                                         data: result.data.data.dataSearch.data,
        //                                         groupCount: result.data.data.dataSearch.groupCount,
        //                                         summary: result.data.data.dataSearch.totalSummary,
        //                                         totalCount: result.data.data.dataSearch.totalCount
        //                                     } as LoadResultObject);
        //                                 } else {
        //                                     resolve({
        //                                         data: result.data.data.dataSearch.items,
        //                                         groupCount: result.data.data.dataSearch.groupCount,
        //                                         summary: result.data.data.dataSearch.totalSummary,
        //                                         totalCount: result.data.data.dataSearch.totalCount
        //                                     } as LoadResultObject);
        //                                 }
        //                             } else {
        //                                 resolve({
        //                                     data: [],
        //                                     groupCount: 0,
        //                                     totalCount: 0,
        //                                 });
        //                             }
        //                         }).catch(error => {
        //                             console.error(error);
        //                             reject("Data Loading Error");
        //                         });
        //                     } else {
        //                         resolve({
        //                             data: [],
        //                             groupCount: 0,
        //                             totalCount: 0,
        //                         });
        //                     }
        //                 });
        //             }
        //         }),
        //     });
        //     this.grid.endUpdate();
        // }
        // else {
        //     this.grid.beginUpdate();
        //     this.grid.option("dataSource", {
        //         store: new CustomStore({
        //             key: key,
        //             load: (loadOptions) => {
        //                 return new Promise((resolve, reject) => {
        //                     if (this.arguments) {
        //                         if (loadOptions.sort) {
        //                             this.arguments["orderby"] = loadOptions.sort[0].selector;
        //                             if (loadOptions.sort[0].desc)
        //                                 this.arguments["orderby"] += " desc";
        //                         }

        //                         this.arguments["skip"] = loadOptions.skip ? loadOptions.skip : 0;
        //                         this.arguments["take"] = loadOptions.take ? loadOptions.take : 50;
        //                         this.arguments["totalSummary"] = loadOptions.totalSummary;
        //                         this.arguments.groupSummary = loadOptions.groupSummary;
        //                         this.arguments.group = loadOptions.group;
        //                         this.arguments.requireGroupCount = loadOptions.requireGroupCount;
        //                         this.arguments.requireTotalCount = loadOptions.requireTotalCount;
        //                         this.arguments.filter = {};
        //                         if (loadOptions.filter && loadOptions.filter.length) {
        //                             this.arguments.params = {};
        //                             this.arguments.filter = loadOptions.filter;
        //                             if (!(loadOptions.filter[0] instanceof Array)) {
        //                                 if (loadOptions.filter[0] === "province_code" || loadOptions.filter[0] === "district_code" || loadOptions.filter[0] === "commune_code") {
        //                                     this.arguments.params[loadOptions.filter[0]] = [loadOptions.filter[2]];
        //                                 } else if (loadOptions.filter[0] === "table_name") {
        //                                     this.arguments.params[loadOptions.filter[0]] = loadOptions.filter[2];
        //                                 }
        //                             } else {
        //                                 $.each(loadOptions.filter, (idx: number, item) => {
        //                                     if (item instanceof Array) {
        //                                         if (item[0] === "province_code" || item[0] === "district_code" || item[0] === "commune_code") {
        //                                             this.arguments.params[item[0]] = [item[2]];
        //                                         } else if (item[0] === "table_name") {
        //                                             this.arguments.params[item[0]] = item[2];
        //                                         }
        //                                     }
        //                                 });
        //                             }
        //                         }

        //                         axios.post("/api/feature/quick-search", this.arguments).then((result) => {
        //                             if (result.data.status === EnumStatus.OK) {
        //                                 this.domains = result.data.data.domains;
        //                                 this.relations = result.data.data.relations;
        //                                 if (result.data.data.dataSearch.totalCount === 1 && result.data.data.dataSearch.items && result.data.data.dataSearch.items.length === 1) {
        //                                     const item = result.data.data.dataSearch.items[0];
        //                                     console.log(item);
        //                                     // FeatureService.queryFeature(0, item.table_id, item.id).then(response => {
        //                                     //     if (response.attributes && response.attributes.geom) {
        //                                     //         // this.oGMap.fitBounds(response.attributes.geom?.toString());
        //                                     //         // this.oGMap.highlightIdentifyFeature(response.attributes.geom?.toString());
        //                                     //         this.identifyComponent.identifyRowFeature(item.id, item.table_id, item.table_name, true);
        //                                     //     }
        //                                     // });
        //                                     this.identifyComponent.identifyRowFeature(item.id, item.table_id, item.table_name, true);
        //                                 } else {
        //                                     if (result.data.data.dataSearch.boundary) {
        //                                         this.oGMap.loadBoundary(result.data.data.dataSearch.boundary);
        //                                     }
        //                                     //
        //                                     this.popup.show();
        //                                 }
        //                                 if (loadOptions.requireGroupCount) {
        //                                     resolve({
        //                                         data: result.data.data.dataSearch.data,
        //                                         groupCount: result.data.data.dataSearch.groupCount,
        //                                         summary: result.data.data.dataSearch.totalSummary,
        //                                         totalCount: result.data.data.dataSearch.totalCount
        //                                     } as LoadResultObject);
        //                                 } else {
        //                                     resolve({
        //                                         data: result.data.data.dataSearch.items,
        //                                         groupCount: result.data.data.dataSearch.groupCount,
        //                                         summary: result.data.data.dataSearch.totalSummary,
        //                                         totalCount: result.data.data.dataSearch.totalCount
        //                                     } as LoadResultObject);
        //                                 }
        //                             } else {
        //                                 resolve({
        //                                     data: [],
        //                                     groupCount: 0,
        //                                     totalCount: 0,
        //                                 });
        //                             }
        //                         }).catch(error => {
        //                             console.error(error);
        //                             reject("Data Loading Error");
        //                         });
        //                     } else {
        //                         resolve({
        //                             data: [],
        //                             groupCount: 0,
        //                             totalCount: 0,
        //                         });
        //                     }
        //                 });
        //             }
        //         }),
        //     });
        //     this.grid.endUpdate();
        // }
        //
        // this.grid.beginUpdate();
        // this.grid.option("dataSource", {
        //     store: new CustomStore({
        //         key: key,
        //         load: (loadOptions) => {
        //             return new Promise((resolve, reject) => {
        //                 if (this.arguments) {
        //                     if (loadOptions.sort) {
        //                         this.arguments["orderby"] = loadOptions.sort[0].selector;
        //                         if (loadOptions.sort[0].desc)
        //                             this.arguments["orderby"] += " desc";
        //                     }

        //                     this.arguments["skip"] = loadOptions.skip ? loadOptions.skip : 0;
        //                     this.arguments["take"] = loadOptions.take ? loadOptions.take : 50;
        //                     this.arguments["totalSummary"] = loadOptions.totalSummary;
        //                     this.arguments.groupSummary = loadOptions.groupSummary;
        //                     this.arguments.group = loadOptions.group;
        //                     this.arguments.requireGroupCount = loadOptions.requireGroupCount;
        //                     this.arguments.requireTotalCount = loadOptions.requireTotalCount;
        //                     this.arguments.filter = {};
        //                     if (loadOptions.filter && loadOptions.filter.length) {
        //                         this.arguments.params = {};
        //                         this.arguments.filter = loadOptions.filter;
        //                         if (!(loadOptions.filter[0] instanceof Array)) {
        //                             if (loadOptions.filter[0] === "province_code" || loadOptions.filter[0] === "district_code" || loadOptions.filter[0] === "commune_code") {
        //                                 this.arguments.params[loadOptions.filter[0]] = [loadOptions.filter[2]];
        //                             } else if (loadOptions.filter[0] === "table_name") {
        //                                 this.arguments.params[loadOptions.filter[0]] = loadOptions.filter[2];
        //                             }
        //                         } else {
        //                             $.each(loadOptions.filter, (idx: number, item) => {
        //                                 if (item instanceof Array) {
        //                                     if (item[0] === "province_code" || item[0] === "district_code" || item[0] === "commune_code") {
        //                                         this.arguments.params[item[0]] = [item[2]];
        //                                     } else if (item[0] === "table_name") {
        //                                         this.arguments.params[item[0]] = item[2];
        //                                     }
        //                                 }
        //                             });
        //                         }
        //                     }

        //                     axios.post("/api/feature/quick-search", this.arguments).then((result) => {
        //                         if (result.data.status === EnumStatus.OK) {
        //                             this.domains = result.data.data.domains;
        //                             this.relations = result.data.data.relations;
        //                             if (result.data.data.dataSearch.totalCount === 1 && result.data.data.dataSearch.items && result.data.data.dataSearch.items.length === 1) {
        //                                 const item = result.data.data.dataSearch.items[0];
        //                                 // console.log(item);
        //                                 // FeatureService.queryFeature(0, item.table_id, item.id).then(response => {
        //                                 //     if (response.attributes && response.attributes.geom) {
        //                                 //         // this.oGMap.fitBounds(response.attributes.geom?.toString());
        //                                 //         // this.oGMap.highlightIdentifyFeature(response.attributes.geom?.toString());
        //                                 //         this.identifyComponent.identifyRowFeature(item.id, item.table_id, item.table_name, true);
        //                                 //     }
        //                                 // });
        //                                 this.identifyComponent.identifyRowTableFeature(item.id, item.table_id, item.table_name, true, true);
        //                             } else {
        //                                 if (result.data.data.dataSearch.boundary) {
        //                                     this.oGMap.loadBoundary(result.data.data.dataSearch.boundary);
        //                                 }
        //                                 //
        //                                 this.popup.show();
        //                             }
        //                             if (loadOptions.requireGroupCount) {
        //                                 resolve({
        //                                     data: result.data.data.dataSearch.data,
        //                                     groupCount: result.data.data.dataSearch.groupCount,
        //                                     summary: result.data.data.dataSearch.totalSummary,
        //                                     totalCount: result.data.data.dataSearch.totalCount
        //                                 } as LoadResultObject);
        //                             } else {
        //                                 resolve({
        //                                     data: result.data.data.dataSearch.items,
        //                                     groupCount: result.data.data.dataSearch.groupCount,
        //                                     summary: result.data.data.dataSearch.totalSummary,
        //                                     totalCount: result.data.data.dataSearch.totalCount
        //                                 } as LoadResultObject);
        //                             }
        //                         } else {
        //                             resolve({
        //                                 data: [],
        //                                 groupCount: 0,
        //                                 totalCount: 0,
        //                             });
        //                         }
        //                     }).catch(error => {
        //                         console.error(error);
        //                         reject("Data Loading Error");
        //                     });
        //                 } else {
        //                     resolve({
        //                         data: [],
        //                         groupCount: 0,
        //                         totalCount: 0,
        //                     });
        //                 }
        //             });
        //         }
        //     }),
        // });
        // this.grid.endUpdate();
    }

    //Vẽ vòng tròn khoanh vùng xung quanh vị trí của tôi 1km
    private drawBuffer(): void {
        const locationExt = this.oGMap.getExtension("location") as LocationExtension;
        if (locationExt) {
            const position = locationExt.getPosition();
            if (position && position[0] * position[1] > 0) {
                const geojson = {
                    coordinates: [position[0], position[1]],
                    type: "Point"
                };
                $.ajax({
                    data: {
                        geom: JSON.stringify(geojson)
                    },
                    method: "post",
                    url: "/api/layer/getGeojsonBuffer/" + 5000,
                }).done(result => {
                    if (result.data) {
                        const f = OGMapUtils.parseGeoJSON(result.data)[0] || undefined;
                        if (f instanceof Feature) {
                            this.searchFeatureLayer.getSource().addFeature(f);
                            this.advancedSearchForm.updateData("geom", result.data);
                            this.advancedSearchForm.updateData("geometry", EnumGeometry.Point);
                        }
                    }
                });
            }
        } else {
            OGUtils.toastError("Vui lòng cho phép truy cập vị trí");
        }
    }

    private filterLayer(items): OGLayerModel[] {
        const layers: OGLayerModel[] = [];
        if (items instanceof Array) {
            items.forEach(item => {
                if (item["items"]) {
                    const ritems = this.filterLayer(item["items"]);
                    ritems.forEach(o => {
                        if (o["id"] && o["layer_type"]) {
                            layers.push(o);
                        }
                    });
                } else if (item["id"] && item["layer_type"]) {
                    layers.push(item);
                }
            });
        } else if (items["id"] && items["layer_type"]) {
            layers.push(items);
        }
        return layers;
    }

    //Xây dựng ô nhập dữ liệu cho trường tìm kiếm
    private initItemSearchForm(column: OGTableColumnModel, colSpan: number): (GroupItem | SimpleItem)[] {
        const items: (GroupItem | SimpleItem)[] = [];
        if (column.column_name === "commune_code" || column.column_name === "district_code" || column.column_name === "province_code") {
            // fix later
        }
        else if (column.lookup_table_id > 0) {
            items.push({
                colSpan: colSpan,
                dataField: column.column_name,
                editorOptions: {
                    dataSource: {
                        key: "id",
                        store: new CustomStore({
                            load: () => {
                                return TableService.shortData({ table_id: column.lookup_table_id });
                            },
                            loadMode: "raw"
                        })
                    },
                    displayExpr: "mo_ta",
                    maxDisplayedTags: 1,
                    noDataText: "Không có dữ liệu",
                    onContentReady: () => {
                        $(".dx-list-item-content").each(function () {
                            const $ele = $(this);
                            $ele.attr("title", $ele.text());
                        });
                    },
                    onMultiTagPreparing: function (args) {
                        const selectedItemsLength = args.selectedItems.length,
                            totalCount = 1;

                        if (selectedItemsLength < totalCount) {
                            args.cancel = true;
                        } else {
                            args.text = "[" + selectedItemsLength + "] lựa chọn";
                        }
                    },
                    placeholder: "[Chọn...]",
                    searchEnabled: true,
                    searchExpr: "mo_ta",
                    searchMode: "contains",
                    showDropDownButton: true,
                    showSelectionControls: true,
                    valueExpr: "id",
                },
                editorType: "dxTagBox",
                label: {
                    text: column.name_vn
                },
            });
        } else if (column.data_type === EnumDataType.integer || column.data_type === EnumDataType.double) {
            items.push({
                colCount: colSpan,
                colSpan: colSpan,
                itemType: "group",
                items: [{
                    dataField: column.column_name + "_start",
                    editorOptions: {
                        format: column.data_type === EnumDataType.integer ? ",##0" : ",##0.###",
                        showClearButton: true,
                    },
                    editorType: "dxNumberBox",
                    label: {
                        text: "Từ"
                    },
                }, {
                    dataField: column.column_name + "_end",
                    editorOptions: {
                        format: column.data_type === EnumDataType.integer ? ",##0" : ",##0.###",
                        showClearButton: true,
                    },
                    editorType: "dxNumberBox",
                    label: {
                        text: "Đến"
                    },
                }],
                label: {
                    text: column.name_vn,
                }
            });
        } else if (column.data_type === EnumDataType.date || column.data_type === EnumDataType.dateTime || column.data_type === EnumDataType.dateTimeTZ) {
            let type, format;
            if (column.data_type === EnumDataType.date) {
                type = "date";
                format = "dd/MM/yyyy";
            }
            else if (column.data_type === EnumDataType.dateTime || column.data_type === EnumDataType.dateTimeTZ) {
                type = "datetime";
                format = "dd/MM/yyyy HH:mm";
            }
            items.push({
                colCount: colSpan,
                colSpan: colSpan,
                itemType: "group",
                items: [{
                    dataField: column.column_name + "_dateStart",
                    editorOptions: {
                        applyButtonText: "Xác nhận",
                        cancelButtonText: "Hủy",
                        displayFormat: format,
                        invalidDateMessage: "Vui lòng nhập đúng định dạng: " + format,
                        showAnalogClock: false,
                        type: type,
                        width: "100%",
                    },
                    editorType: "dxDateBox",
                    label: {
                        text: "Từ",
                    },
                }, {
                    dataField: column.column_name + "_dateEnd",
                    editorOptions: {
                        applyButtonText: "Xác nhận",
                        cancelButtonText: "Hủy",
                        displayFormat: format,
                        invalidDateMessage: "Vui lòng nhập đúng định dạng: " + format,
                        showAnalogClock: false,
                        type: type,
                        width: "100%",
                    },
                    editorType: "dxDateBox",
                    label: {
                        text: "Đến",
                    },
                }],
                label: {
                    text: column.name_vn
                }
            });
        } else if (column.data_type === EnumDataType.bool) {
            items.push({
                dataField: column.column_name,
                editorOptions: {
                    displayExpr: "mo_ta",
                    items: [{
                        "id": true,
                        "mo_ta": "Có"
                    }, {
                        "id": false,
                        "mo_ta": "Không"
                    }],
                    maxDisplayedTags: 2,
                    multiline: false,
                    noDataText: "Không có dữ liệu",
                    placeholder: "[Chọn...]",
                    showDropDownButton: true,
                    showSelectionControls: true,
                    valueExpr: "id",
                },
                editorType: "dxTagBox",
                label: {
                    text: column.name_vn
                }
            });
        } else if (column.data_type === EnumDataType.string || column.data_type === EnumDataType.text) {
            items.push({
                colSpan: colSpan,
                dataField: column.column_name,
                editorOptions: {
                    dataSource: {
                        pageSize: 25,
                        paginate: true,
                        store: new CustomStore({
                            load: (options) => {
                                return new Promise((resolve) => {
                                    TableColumnService.listDistinctValues(column, options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                        resolve({
                                            data: data.data,
                                            totalCount: data.recordsTotal
                                        });
                                    });
                                });
                            },
                        })
                    },
                    searchEnabled: true,
                    showClearButton: true
                },
                editorType: "dxSelectBox",
                label: {
                    text: column.name_vn
                },
            });
        } else {
            items.push({
                colSpan: colSpan,
                dataField: column.column_name,
                editorOptions: {
                    showClearButton: true
                },
                editorType: "dxTextBox",
                label: {
                    text: column.name_vn
                },
            });
        }

        if (column.column_name.toLowerCase().includes("email")) {
            items.map(item => {
                item["validationRules"] = [];
                item["validationRules"].push({
                    message: "Email không chính xác",
                    type: "email"
                });
            });
        }
        return items;
    }

    private initLayout(): void {
        const self = this;
        self.searchTabs = $("<div/>").appendTo(this.container).dxTabPanel({
            deferRendering: false,
            items: [
                {
                    template: (itemData, itemIndex, itemElement) => {
                        this.searchCommomFormContainer = $("<div />");
                        this.searchCommonForm = $("<div />").css("padding", "5px").appendTo(itemElement)
                            .dxForm({
                                formData: {
                                    kw: "",
                                    layer_id: 0,
                                    province_code: "01"
                                },
                                height: "auto",
                                items: [{
                                    dataField: "layer_id",
                                    editorOptions: {
                                        dataSource: {
                                            store: new CustomStore({
                                                key: "id",
                                                load: (loadOptions) => {
                                                    let layerName = loadOptions.searchValue;
                                                    if (loadOptions.filter != undefined) {
                                                        layerName = loadOptions.filter[0][2];
                                                    }
                                                    const deferred = $.Deferred();
                                                    Promise.all([
                                                        LayerService.getLayers(this.mapId, layerName),
                                                        TableService.getTables(this.mapId, layerName),
                                                    ]).then((values) => {
                                                        const layerResponse = values[0] ? values[0].data : [];
                                                        const tableResponse = values[1] ? values[1].data : [];
                                                        const layerGroupBy = OGUtils.groupBy(layerResponse, layer => (layer.table && layer.table.table_schema_info) ? layer.table.table_schema_info.description : "Nhóm dữ liệu khác");
                                                        const tableGroupBy = OGUtils.groupBy(tableResponse, table => "Bảng dữ liệu");
                                                        const dataSource = [];

                                                        Array.from(layerGroupBy).map((items) => {
                                                            items[1].sort(function (a, b) {
                                                                if ((a.order - b.order) < 0) {
                                                                    return -1;
                                                                } else if ((a.order - b.order) > 0) {
                                                                    return 1;
                                                                } else {
                                                                    if (a.name_vn < b.name_vn) {
                                                                        return -1;
                                                                    } else if (a.name_vn > b.name_vn) {
                                                                        return 1;
                                                                    } else
                                                                        return 0;
                                                                }
                                                            });
                                                            dataSource.push({
                                                                items: items[1],
                                                                key: items[0],
                                                            });
                                                        });
                                                        Array.from(tableGroupBy).map((items) => {
                                                            items[1].sort(function (a, b) {
                                                                if ((a.order - b.order) < 0) {
                                                                    return -1;
                                                                } else if ((a.order - b.order) > 0) {
                                                                    return 1;
                                                                } else {
                                                                    if (a.name_vn < b.name_vn) {
                                                                        return -1;
                                                                    } else if (a.name_vn > b.name_vn) {
                                                                        return 1;
                                                                    } else
                                                                        return 0;
                                                                }
                                                            });
                                                            dataSource.push({
                                                                items: items[1],
                                                                key: items[0],
                                                            });
                                                        });
                                                        deferred.resolve(dataSource);
                                                    });
                                                    return deferred.promise();
                                                },
                                                // loadMode: "raw",
                                                // useDefaultSearch: true
                                            }),
                                        },
                                        deferRendering: true,
                                        displayExpr: "name_vn",
                                        grouped: true,
                                        maxDisplayedTags: 2,
                                        multiline: false,
                                        noDataText: "Không có dữ liệu",
                                        onSelectionChanged: (e) => {
                                            const items = e.component.option("selectedItems");
                                            const tableColumnFilterEditor = self.advancedSearchForm.getEditor("tableColumnFilters");

                                            if (items && items.length > 1 || (items.length === 0)) {
                                                if (tableColumnFilterEditor) {
                                                    tableColumnFilterEditor.option("disabled", true);
                                                }
                                                this.bindSearchForm([]);
                                            } else if (items && items.length === 1) {
                                                if (tableColumnFilterEditor) {
                                                    if (tableColumnFilterEditor instanceof dxTagBox) {
                                                        tableColumnFilterEditor.getDataSource().reload();
                                                        tableColumnFilterEditor.reset();
                                                        tableColumnFilterEditor.option("disabled", false);
                                                    }
                                                }
                                            }
                                        },
                                        searchEnabled: true,
                                        searchExpr: ["name_vn"],
                                        searchMode: "contains",
                                        showClearButton: true,
                                        showDropDownButton: true,
                                        showSelectionControls: true,
                                        value: [],
                                        valueExpr: "id"
                                    } as dxTagBoxOptions,
                                    editorType: "dxTagBox",
                                    label: {
                                        text: "Lớp dữ liệu",
                                    },
                                    // validationRules: [{
                                    //     message: "Vui lòng chọn ít nhất một lớp dữ liệu",
                                    //     type: "required"
                                    // }]
                                }, {
                                    dataField: "kw",
                                    editorOptions: {
                                        onEnterKey: function () {
                                            self.doSearch();
                                        },
                                        placeholder: "Nhập nội dung tìm kiếm...",
                                        showClearButton: true,
                                    },
                                    editorType: "dxTextBox",
                                    label: {
                                        text: "Nội dung tìm kiếm",
                                    },
                                }],
                                labelLocation: "top",
                                showColonAfterLabel: true,
                                width: "100%"
                            }).dxForm("instance");
                        this.regionSearchForm = $("<div />").css("padding", "5px").appendTo(itemElement)
                            .dxForm({
                                colCount: 1,
                                height: "auto",
                                items: [{
                                    caption: "Địa phận hành chính",
                                    itemType: "group",
                                    items: [{
                                        dataField: "province_code",
                                        editorOptions: {
                                            dataSource: new DataSource({
                                                key: "area_id",
                                                store: new CustomStore({
                                                    load: async () => {
                                                        return await AreaService.provinces();
                                                    },
                                                    loadMode: "raw"
                                                })
                                            }),
                                            deferRendering: false,
                                            displayExpr: "name_vn",
                                            maxDisplayedTags: 1,
                                            multiline: false,
                                            noDataText: "Không có dữ liệu",
                                            onMultiTagPreparing: function (args) {
                                                const selectedItemsLength = args.selectedItems.length,
                                                    totalCount = 1;

                                                if (selectedItemsLength < totalCount) {
                                                    args.cancel = true;
                                                } else {
                                                    args.text = "[" + selectedItemsLength + "] lựa chọn";
                                                }
                                            },
                                            onSelectionChanged: () => {
                                                const districtEditor = self.searchCommonForm.getEditor("district_code");
                                                if (districtEditor && districtEditor instanceof dxSelectBox) {
                                                    districtEditor.getDataSource().reload();
                                                }
                                            },
                                            placeholder: "[Chọn...]",
                                            showDropDownButton: true,
                                            showSelectionControls: true,
                                            valueExpr: "area_id"
                                        },
                                        editorType: "dxTagBox",
                                        label: {
                                            text: "Tỉnh/TP"
                                        }
                                    }, {
                                        dataField: "district_code",
                                        editorOptions: {
                                            dataSource: new DataSource({
                                                key: "area_id",
                                                store: new CustomStore({
                                                    load: async () => {
                                                        return await AreaService.districts();
                                                    },
                                                    loadMode: "raw"
                                                })
                                            }),
                                            deferRendering: false,
                                            displayExpr: "name_vn",
                                            maxDisplayedTags: 1,
                                            multiline: false,
                                            noDataText: "Không có dữ liệu",
                                            onMultiTagPreparing: function (args) {
                                                const selectedItemsLength = args.selectedItems.length,
                                                    totalCount = 1;

                                                if (selectedItemsLength < totalCount) {
                                                    args.cancel = true;
                                                } else {
                                                    args.text = "[" + selectedItemsLength + "] lựa chọn";
                                                }
                                            },
                                            onSelectionChanged: () => {
                                                const communeEditor = self.searchCommonForm.getEditor("commune_code");
                                                if (communeEditor && communeEditor instanceof dxSelectBox) {
                                                    communeEditor.getDataSource().reload();
                                                }
                                            },
                                            placeholder: "[Chọn...]",
                                            showDropDownButton: true,
                                            showSelectionControls: true,
                                            valueExpr: "area_id"
                                        },
                                        editorType: "dxTagBox",
                                        label: {
                                            text: "Quận/Huyện"
                                        }
                                    }, {
                                        dataField: "commune_code",
                                        editorOptions: {
                                            dataSource: {
                                                store: new CustomStore({
                                                    key: "area_id",
                                                    load: async () => {
                                                        let district = [];
                                                        const result = [];
                                                        if (self.regionSearchForm && self.regionSearchForm.getEditor("district_code")) {
                                                            district = self.regionSearchForm.getEditor("district_code").option("value");
                                                        }
                                                        if (district.length > 0) {
                                                            const communes = await AreaService.communes(district.toString());
                                                            if (self.regionSearchForm.getEditor("commune_code")) {
                                                                const value = [];
                                                                const area_ids = communes.map(item => item.area_id);
                                                                self.regionSearchForm.getEditor("commune_code").option("value").forEach(id => {
                                                                    if (area_ids.indexOf(id) > -1) {
                                                                        value.push(id);
                                                                    }
                                                                });
                                                                self.regionSearchForm.getEditor("commune_code").option("value", value);
                                                            }
                                                            const grouped = communes.reduce((r, a) => {
                                                                r[a.parent_name] = r[a.parent_name] || [];
                                                                r[a.parent_name].push(a);
                                                                return r;
                                                            }, Object.create(null));
                                                            Object.keys(grouped).map(key => {
                                                                result.push({
                                                                    items: grouped[key],
                                                                    key: key
                                                                });
                                                            });
                                                            return result;
                                                        }
                                                        return result;
                                                    },
                                                    loadMode: "raw"
                                                }),
                                            },
                                            deferRendering: false,
                                            displayExpr: "name_vn",
                                            grouped: true,
                                            maxDisplayedTags: 1,
                                            multiline: false,
                                            noDataText: "Không có dữ liệu",
                                            onMultiTagPreparing: function (args) {
                                                const selectedItemsLength = args.selectedItems.length,
                                                    totalCount = 1;

                                                if (selectedItemsLength < totalCount) {
                                                    args.cancel = true;
                                                } else {
                                                    args.text = "[" + selectedItemsLength + "] lựa chọn";
                                                }
                                            },
                                            placeholder: "[Chọn...]",
                                            showDropDownButton: true,
                                            showSelectionControls: true,
                                            valueExpr: "area_id"
                                        },
                                        editorType: "dxTagBox",
                                        label: {
                                            text: "Xã/Phường"
                                        }
                                    }]
                                }],
                                labelLocation: "top",
                                onEditorEnterKey: () => {
                                    this.doSearch();
                                },
                                scrollingEnabled: true,
                                showColonAfterLabel: true,
                            }).dxForm("instance");
                        this.dvqlSearchForm = $("<div />").css("padding", "5px").appendTo(itemElement)
                            .dxForm({
                                colCount: 1,
                                height: "auto",
                                items: [{
                                    caption: "Cấp quản lý",
                                    itemType: "group",
                                    items: [{
                                        dataField: "capQuanLy",
                                        editorOptions: {
                                            dataSource: [{
                                                id: 1,
                                                text: "Sở xây dựng Thành phố Hà Nội"
                                            }, {
                                                id: 9,
                                                text: "Quận/Huyện quản lý"
                                            }],
                                            deferRendering: false,
                                            displayExpr: "text",
                                            noDataText: "Không có dữ liệu",
                                            placeholder: "[Chọn...]",
                                            showClearButton: true,
                                            showDropDownButton: true,
                                            showSelectionControls: true,
                                            valueExpr: "id",
                                        },
                                        editorType: "dxSelectBox",
                                        label: {
                                            text: "Cấp quản lý"
                                        }
                                    }]
                                }],
                                labelLocation: "top",
                                onEditorEnterKey: () => {
                                    this.doSearch();
                                },
                                scrollingEnabled: true,
                                showColonAfterLabel: true,
                            }).dxForm("instance");
                    },
                    title: "Tìm kiếm"
                }, {
                    template: (itemData, itemIndex, itemElement) => {
                        this.advancedSearchForm = $("<div />").css("padding", "5px").appendTo(itemElement)
                            .dxForm({
                                colCount: 1,
                                formData: {},
                                height: "auto",
                                items: [{
                                    dataField: "near_location",
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            this.oGMap.clearInteractions();
                                            this.searchFeatureLayer.getSource().clear();

                                            this.advancedSearchForm.updateData("geometry", EnumGeometry.Point);
                                            if (e.value) {
                                                this.drawBuffer();
                                                this.advancedSearchForm.getEditor("include_geometry").option("value", false);
                                            }
                                        },
                                        value: false
                                    },
                                    editorType: "dxCheckBox",
                                    label: {
                                        location: "left",
                                        showColon: false,
                                        text: "Tìm kiếm tài sản/công trình gần nhất",
                                    }
                                }, {
                                    dataField: "include_geometry",
                                    editorOptions: {
                                        onValueChanged: (e) => {
                                            this.oGMap.clearMap();
                                            this.oGMap.clearInteractions();
                                            this.searchFeatureLayer.getSource().clear();

                                            this.advancedSearchForm.updateData("geometry", EnumGeometry.Point);
                                            if (e.value) {
                                                this.triggerDraw(EnumGeometry.Point);
                                                this.advancedSearchForm.getEditor("near_location").option("value", false);
                                                this.oGMap.deactivateIdentify();
                                            } else {
                                                this.oGMap.activateIdentify();
                                            }
                                            this.advancedSearchForm.getEditor("geometry").option("disabled", !e.value);
                                            this.advancedSearchForm.getEditor("radius").option("disabled", !e.value);
                                        },
                                        value: false
                                    },
                                    editorType: "dxCheckBox",
                                    label: {
                                        location: "left",
                                        showColon: false,
                                        text: "Kết hợp tìm kiếm không gian",
                                    }
                                }, {
                                    colCount: 2,
                                    cssClass: "group-search-common",
                                    itemType: "group",
                                    items: [{
                                        dataField: "geometry",
                                        editorOptions: {
                                            disabled: true,
                                            displayExpr: "mo_ta",
                                            items: [{
                                                "id": EnumGeometry.Point,
                                                "mo_ta": "Điểm"
                                            }, {
                                                "id": EnumGeometry.LineString,
                                                "mo_ta": "Đường"
                                            }, {
                                                "id": EnumGeometry.Polygon,
                                                "mo_ta": "Vùng"
                                            }],
                                            onSelectionChanged: (e) => {
                                                const formData = this.advancedSearchForm.option("formData");
                                                if (formData.include_geometry && this.advancedSearchForm && e.selectedItem) {
                                                    this.triggerDraw(e.selectedItem.id);
                                                }
                                                else {
                                                    this.oGMap.clearMap();
                                                    this.oGMap.clearInteractions();
                                                    this.searchFeatureLayer.getSource().clear();
                                                }
                                            },
                                            showDropDownButton: true,
                                            valueExpr: "id",
                                        },
                                        editorType: "dxSelectBox",
                                        label: {
                                            text: "Loại"
                                        }
                                    }, {
                                        dataField: "radius",
                                        editorOptions: {
                                            disabled: true,
                                            format: ",##0.###",
                                            min: 0,
                                            onValueChanged: (e) => {
                                                if (this.advancedSearchForm) {
                                                    const formData = this.advancedSearchForm.option("formData");
                                                    if (formData.include_geometry) {
                                                        const geometryEditor = this.advancedSearchForm.getEditor("geometry");
                                                        if (geometryEditor.option("value")) {
                                                            this.triggerDraw(geometryEditor.option("value"));
                                                        }
                                                    }
                                                }
                                            },
                                            value: 1,
                                        },
                                        editorType: "dxNumberBox",
                                        label: {
                                            text: "Bán kính (m)"
                                        }
                                    }]
                                }, {
                                    dataField: "tableColumnFilters",
                                    editorOptions: {
                                        dataSource: {
                                            store: new CustomStore({
                                                byKey: () => {
                                                    return null;
                                                },
                                                key: "id",
                                                load: () => {
                                                    const deferred = $.Deferred();
                                                    const layerEditor = this.searchCommonForm.getEditor("layer_id");
                                                    if (layerEditor && layerEditor instanceof dxTagBox) {
                                                        const selectedItem = layerEditor.option("selectedItems")[0];
                                                        if (selectedItem) {
                                                            if (selectedItem.columns) {
                                                                const layerColumns = selectedItem.columns.filter(s => s.visible);
                                                                deferred.resolve(layerColumns);
                                                            } else {
                                                                const layerColumns = selectedItem.table.columns.filter(s => s.visible);
                                                                deferred.resolve(layerColumns);
                                                            }
                                                            const tableColumnFilterEditor = this.advancedSearchForm.getEditor("tableColumnFilters");
                                                            if (tableColumnFilterEditor && tableColumnFilterEditor instanceof dxSelectBox) {
                                                                tableColumnFilterEditor.open();
                                                                tableColumnFilterEditor.close();
                                                            }
                                                        } else {
                                                            deferred.resolve([]);
                                                        }
                                                    } else {
                                                        deferred.resolve([]);
                                                    }

                                                    return deferred.promise();
                                                },
                                                loadMode: "raw",
                                            })
                                        },
                                        displayExpr: "name_vn",
                                        maxDisplayedTags: 1,
                                        multiline: false,
                                        noDataText: "Không có dữ liệu",
                                        onMultiTagPreparing: function (args) {
                                            const selectedItemsLength = args.selectedItems.length,
                                                totalCount = 1;

                                            if (selectedItemsLength < totalCount) {
                                                args.cancel = true;
                                            } else {
                                                args.text = "[" + selectedItemsLength + "] trường đã chọn";
                                            }
                                        },
                                        onSelectionChanged: (e) => {
                                            const selectedColumns = e.component.option("selectedItems");
                                            self.bindSearchForm(selectedColumns);
                                        },
                                        placeholder: "[Tất cả]",
                                        searchEnabled: true,
                                        searchExpr: ["name_vn"],
                                        searchMode: "contains",
                                        showDropDownButton: true,
                                        showSelectionControls: true,
                                        valueExpr: "id",
                                    },
                                    editorType: "dxTagBox",
                                    label: {
                                        text: "Trường thông tin lọc dữ liệu",
                                    },
                                }],
                                labelLocation: "top",
                                scrollingEnabled: true,
                                showColonAfterLabel: true,
                            }).dxForm("instance");
                        this.searchForm = $("<div />").css("padding", "5px").appendTo(itemElement)
                            .dxForm({
                                colCount: 1,
                                formData: {},
                                height: "100%",
                                items: [],
                                labelLocation: "top",
                                onEditorEnterKey: () => {
                                    this.doSearch();
                                },
                                scrollingEnabled: true,
                                showColonAfterLabel: true,
                            }).dxForm("instance");
                    },
                    title: "Tìm kiếm nâng cao"
                }],
            onContentReady: () => {
            },
            width: "100%",
        }).dxTabPanel("instance");

        this.searchToolbar = $("<div />").css({
            "bottom": 0,
            "margin-top": "20px",
            "position": "absolute"
        }).addClass("mt-3").appendTo(this.container)
            .dxToolbar({
                items: [{
                    location: "center",
                    options: {
                        icon: "icon icon-search-normal-1",
                        onClick: () => {
                            this.doSearch();
                        },
                        text: "Tìm kiếm",
                        type: "default",
                        visible: true,
                    },
                    widget: "dxButton"
                }, {
                    location: "center",
                    options: {
                        icon: "icon icon-refresh",
                        onClick: () => {
                            this.arguments = undefined;
                            this.searchCommonForm.resetValues();
                            this.searchForm.resetValues();
                            this.regionSearchForm.resetValues();
                            this.grid.clearFilter();
                            this.grid.clearSelection();
                            this.oGMap.clearMap();
                            this.layerTreeComponent.setParams(undefined, undefined, undefined).reload();
                        },
                        text: "Làm mới",
                        type: "danger",
                        visible: true,
                    },
                    widget: "dxButton"
                }]
            }).dxToolbar("instance");

        this.popup = $("<div />").appendTo($("body")).dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                this.grid = $("<div />").appendTo(container).dxDataGrid({
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    columnChooser: {
                        enabled: false,
                        mode: "select",
                    },
                    columns: [{
                        alignment: "center",
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.grid.pageIndex();
                            const pageSize = this.grid.pageSize();
                            container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                        },
                        dataField: "index",
                        width: 100,
                    }, {
                        caption: "Tên",
                        dataField: "name",
                        dataType: "string",
                    }, {
                        caption: "Quận/Huyện",
                        dataField: "district_code",
                        dataType: "string",
                        filterOperations: ["contains"],
                        groupCellTemplate: (container, options) => {
                            // if (options.data) {
                            //     container.append(options.data.key + " (" + options.data["count"] + ")");
                            // } else {
                            //     container.append("Không xác định");
                            // }
                            container.append(`${options.displayValue || options.value}`);
                            if (options.groupContinuesMessage) {
                                container.append(` (${options.groupContinuesMessage})`);
                            }
                            if (options.groupContinuedMessage) {
                                container.append(` (${options.groupContinuedMessage})`);
                            }
                        },
                        lookup: {
                            dataSource: {
                                store: new CustomStore({
                                    key: "area_id",
                                    load: async () => {
                                        return await AreaService.districts();
                                    },
                                })
                            },
                            displayExpr: "name_vn",
                            valueExpr: "area_id",
                        },
                    }, {
                        caption: "Xã/Phường",
                        dataField: "commune_code",
                        dataType: "string",
                        lookup: {
                            dataSource: {
                                store: new CustomStore({
                                    key: "area_id",
                                    load: async () => {
                                        return await AreaService.communes(undefined);
                                    },
                                    loadMode: "raw"
                                })
                            },
                            displayExpr: "name_vn",
                            valueExpr: "area_id",
                        },
                    }, {
                        caption: "Tuyến",
                        dataField: "matuyen",
                        dataType: "string",
                        filterOperations: ["contains"],
                        // groupCellTemplate: (container, options) => {
                        //     if (options.data) {
                        //         container.append(options.data.key + " (" + options.data["count"] + ")");
                        //     } else {
                        //         container.append("Không xác định");
                        //     }
                        // },
                        groupCellTemplate: (container, options) => {
                            // if (options.data) {
                            //     container.append(options.data.key + " (" + options.data["count"] + ")");
                            // } else {
                            //     container.append("Không xác định");
                            // }
                            container.append(`${options.displayValue || options.value}`);
                            if (options.groupContinuesMessage) {
                                container.append(` (${options.groupContinuesMessage})`);
                            }
                            if (options.groupContinuedMessage) {
                                container.append(` (${options.groupContinuedMessage})`);
                            }
                        },
                        lookup: {
                            dataSource: {
                                store: new CustomStore({
                                    key: "code",
                                    load: async () => {
                                        return await DmTuyenService.list();
                                    },
                                })
                            },
                            displayExpr: "value",
                            valueExpr: "code",
                        },
                    }, {
                        caption: "Bảng dữ liệu",
                        dataField: "table_name",
                        dataType: "string",
                        groupCellTemplate: (container, options) => {
                            container.append(`${options.displayValue || options.value}`);
                            if (options.groupContinuesMessage) {
                                container.append(` (${options.groupContinuesMessage})`);
                            }
                            if (options.groupContinuedMessage) {
                                container.append(` (${options.groupContinuedMessage})`);
                            }
                        }
                    },],
                    dataSource: {
                        store: new CustomStore({
                            key: ["uid", "key"],
                            load: (loadOptions) => {
                                return new Promise((resolve, reject) => {
                                    if (this.arguments) {
                                        if (loadOptions.sort) {
                                            this.arguments["orderby"] = loadOptions.sort[0].selector;
                                            if (loadOptions.sort[0].desc) {
                                                this.arguments["orderby"] += " desc";
                                            }
                                        }

                                        this.arguments["skip"] = loadOptions.skip ? loadOptions.skip : 0;
                                        if (loadOptions.take) {
                                            this.arguments["take"] = loadOptions.take ? loadOptions.take : 50;
                                        }
                                        this.arguments.totalSummary = loadOptions.totalSummary;
                                        this.arguments.groupSummary = loadOptions.groupSummary;
                                        this.arguments.group = loadOptions.group;
                                        this.arguments.sort = loadOptions.sort;
                                        this.arguments.requireGroupCount = loadOptions.requireGroupCount;
                                        this.arguments.requireTotalCount = loadOptions.requireTotalCount;
                                        if (loadOptions.filter && loadOptions.filter.length) {
                                            // if (!this.arguments["params"]) {
                                            //     this.arguments.params = {};
                                            // }
                                            this.arguments.filter = loadOptions.filter;
                                            // if (!(loadOptions.filter[0] instanceof Array)) {
                                            //     if (loadOptions.filter[0] === "province_code" || loadOptions.filter[0] === "district_code" || loadOptions.filter[0] === "commune_code") {
                                            //         this.arguments.params[loadOptions.filter[0]] = [loadOptions.filter[2]];
                                            //     } else if (loadOptions.filter[0] === "table_name") {
                                            //         this.arguments.params[loadOptions.filter[0]] = loadOptions.filter[2];
                                            //     }
                                            // } else {
                                            //     $.each(loadOptions.filter, (idx: number, item) => {
                                            //         if (item instanceof Array) {
                                            //             if (item[0] === "province_code" || item[0] === "district_code" || item[0] === "commune_code") {
                                            //                 this.arguments.params[item[0]] = [item[2]];
                                            //             } else if (item[0] === "table_name") {
                                            //                 this.arguments.params[item[0]] = item[2];
                                            //             }
                                            //         }
                                            //     });
                                            // }
                                        }
                                        if (this.isVisible === false) {
                                            OGUtils.showLoading();
                                        }

                                        axios.post("/api/feature/quick-search", this.arguments).then((result) => {
                                            OGUtils.hideLoading();

                                            if (result.data.status === EnumStatus.OK) {
                                                this.domains = result.data.data.domains;
                                                this.relations = result.data.data.relations;
                                                if (result.data.data.dataSearch.totalCount === 1 && result.data.data.dataSearch.items && result.data.data.dataSearch.items.length === 1) {
                                                    const item = result.data.data.dataSearch.items[0];
                                                    // console.log(item);
                                                    // FeatureService.queryFeature(0, item.table_id, item.id).then(response => {
                                                    //     if (response.attributes && response.attributes.geom) {
                                                    //         // this.oGMap.fitBounds(response.attributes.geom?.toString());
                                                    //         // this.oGMap.highlightIdentifyFeature(response.attributes.geom?.toString());
                                                    //         this.identifyComponent.identifyRowFeature(item.id, item.table_id, item.table_name, true);
                                                    //     }
                                                    // });
                                                    this.identifyComponent.identifyRowTableFeature(item.id, item.table_id, item.table_name, true, true);
                                                } else {
                                                    if (result.data.data.dataSearch.boundary) {
                                                        this.oGMap.loadBoundary(result.data.data.dataSearch.boundary);
                                                    }
                                                    this.popup.show();
                                                }
                                                resolve({
                                                    data: result.data.data.dataSearch.data,
                                                    groupCount: result.data.data.dataSearch.groupCount,
                                                    summary: result.data.data.dataSearch.totalSummary,
                                                    totalCount: result.data.data.dataSearch.totalCount
                                                } as LoadResultObject);
                                            } else {
                                                resolve({
                                                    data: [],
                                                    groupCount: -1,
                                                    totalCount: -1,
                                                });
                                            }
                                        }).catch(error => {
                                            OGUtils.hideLoading();
                                            console.error(error);
                                            reject("Data Loading Error");
                                        });
                                    } else {
                                        resolve({
                                            data: [],
                                            groupCount: -1,
                                            totalCount: -1,
                                        });
                                    }
                                });
                            }
                        }),
                    },
                    errorRowEnabled: true,
                    filterRow: {
                        visible: true,
                    },
                    groupPanel: {
                        visible: true   // or "auto"
                    },
                    grouping: {
                        autoExpandAll: false,
                        contextMenuEnabled: true
                    },
                    height: "100%",
                    loadPanel: {
                        text: "Đang tải dữ liệu"
                    },
                    noDataText: "Không có dữ liệu",
                    onSelectionChanged: () => {
                        const rows = self.grid.getSelectedRowsData();
                        if (rows && rows.length > 0) {
                            self.btnZoomIn.option("disabled", false);
                            self.btnIdentify.option("disabled", false);
                        } else {
                            self.btnZoomIn.option("disabled", true);
                            self.btnIdentify.option("disabled", true);
                        }
                    },
                    onToolbarPreparing: (e) => {
                        e.toolbarOptions.items.unshift({
                            location: "before",
                            options: {
                                dropDownOptions: {
                                    width: "220px",
                                },
                                icon: "icon icon-setting-2",
                                items: [],
                                onContentReady: (e) => {
                                    self.exportGroupButton = e.component;
                                },
                                stylingMode: "contained",
                                text: "Thao tác với dữ liệu",
                                type: "default",
                            },
                            widget: "dxDropDownButton"
                        }, {
                            location: "before",
                            options: {
                                disabled: true,
                                elementAttr: {
                                    class: "btn-zoomto"
                                },
                                icon: "icon icon-search-zoom-in",
                                onClick: () => {
                                    const rows = self.grid.getSelectedRowsData();
                                    if (rows && rows.length > 0) {
                                        const geom = rows[0].geom;
                                        if (geom) {
                                            this.oGMap.loadBoundary(geom);
                                        } else {
                                            const item = rows[0];
                                            FeatureService.queryFeature(0, item.table_id, item.id).then(response => {
                                                if (response.attributes && response.attributes.geom) {
                                                    this.oGMap.fitBounds(response.attributes.geom?.toString());
                                                    this.oGMap.highlightIdentifyFeature(response.attributes.geom?.toString());
                                                }
                                            });
                                        }
                                    }
                                },
                                onContentReady: (e) => {
                                    self.btnZoomIn = e.component;
                                },
                                text: "Phóng tới",
                                type: "success",
                            },
                            widget: "dxButton"
                        }, {
                            location: "before",
                            options: {
                                disabled: true,
                                elementAttr: {
                                    class: "btn-identify"
                                },
                                icon: "icon icon-info-circle",
                                onClick: () => {
                                    const rows = self.grid.getSelectedRowsData();
                                    if (rows && rows.length > 0) {
                                        if (rows[0].table_id && rows[0].id) {
                                            this.identifyComponent.identifyRowTableFeature(rows[0].id, rows[0].table_id, rows[0].table_name);
                                        }
                                    }
                                },
                                onContentReady: (e) => {
                                    self.btnIdentify = e.component;
                                },
                                text: "Xem thông tin",
                                type: "default",
                            },
                            widget: "dxButton"
                        }, {
                            location: "after",
                            options: {
                                icon: "icon icon-refresh",
                                onClick: () => {
                                    this.doSearch();
                                }
                            },
                            widget: "dxButton"
                        });
                    },
                    pager: {
                        allowedPageSizes: [50, 100, 200],
                        infoText: "{2} bản ghi",
                        showInfo: true,
                        showNavigationButtons: true,
                        showPageSizeSelector: true,
                        visible: true,
                        /*displayMode: 'compact'*/
                    },
                    paging: {
                        enabled: true,
                        pageSize: 50
                    },
                    remoteOperations: {
                        filtering: true,
                        groupPaging: true,
                        grouping: true,
                        paging: true,
                        sorting: true,
                        summary: true,
                    },
                    scrolling: {
                        showScrollbar: "always"
                    },
                    selection: {
                        mode: "single",
                        showCheckBoxesMode: "none"
                    },
                    showBorders: true,
                    showRowLines: true,
                    summary: {
                        groupItems: [{
                            column: "matuyen",
                            displayFormat: "{0} tuyến",
                            name: "Tuyến",
                            summaryType: "count"
                        }]
                    },
                    syncLookupFilterValues: false,
                    width: "100%",
                }).dxDataGrid("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            dragOutsideBoundary: false,
            height: 500,
            hideOnOutsideClick: false,
            onHidden: () => {
                this.layerTreeComponent.setParams(undefined, undefined, undefined).reload();
                this.grid.clearFilter();
                this.grid.clearSelection();
                this.isVisible = false;
            },
            onOptionChanged: () => {
            },
            onShown: (e) => {
                this.isVisible = true;
            },
            resizeEnabled: true,
            shading: false,
            showCloseButton: true,
            showTitle: true,
            title: "",
            toolbarItems: [{
                location: "after",
                options: {
                    hint: "Thu nhỏ",
                    icon: "chevronup",
                    onClick: function (e) {
                        if (e.component.option("icon") == "chevrondown") {
                            self.popup.option("height", 500);
                            self.popup.option("width", 900);
                            self.popup.option("position", { at: "center", my: "center", of: window });
                            e.component.option("icon", "chevronup");
                            e.component.option("hint", "Thu nhỏ");
                        } else {
                            self.popup.option("height", 40);
                            // self.popup.option("width", 500);
                            self.popup.option("position", { boundaryOffset: { x: 0, y: $(document).height() } });
                            e.component.option("icon", "chevrondown");
                            e.component.option("hint", "Mở rộng");
                        }
                    },
                    stylingMode: "text",
                    type: "normal"
                },
                widget: "dxButton"
            }, {
                location: "after",
                options: {
                    hint: "Toàn màn hình",
                    icon: "expandform",
                    onClick: function (e) {
                        if (e.component.option("icon") == "expandform") {
                            self.popup.option("height", "100vh");
                            self.popup.option("width", "100vw");
                            self.popup.option("position", { at: "center", my: "center", of: window });
                            e.component.option("icon", "fullscreen");
                            e.component.option("hint", "Mặc định");
                        } else {
                            self.popup.option("height", 500);
                            self.popup.option("width", 900);
                            self.popup.option("position", { boundaryOffset: { x: 0, y: 0 } });
                            e.component.option("icon", "expandform");
                            e.component.option("hint", "Toàn màn hình");
                        }
                    },
                    stylingMode: "text",
                    type: "normal"
                },
                widget: "dxButton"
            }],
            width: 900,
        }).dxPopup("instance");

    }

    //Thực hiện tìm kiếm
    //Kiểm tra thông tin tìm kiếm:
    //--Nếu chưa chọn lớp dữ liệu => Thông báo yêu cầu chọn ít nhất 1 lớp
    //--Nếu chọn 1 lớp dữ liệu => Tìm kiếm như bình thường
    //Vẽ vòng tròn khoanh vùng tìm kiếm (trong trường hợp tích chọn kết hợp tìm kiếm không gian)
    private triggerDraw(geometryType: Type): void {
        const radiusEditor = this.advancedSearchForm.getEditor("radius");
        radiusEditor.option("disabled", (geometryType !== EnumGeometry.Point && geometryType !== EnumGeometry.LineString));
        //
        this.oGMap.clearInteractions();
        this.oGMap.draw(geometryType, false, true, null, (feature: Feature<Geometry>) => {
            this.drawFeature = feature;
            const geometry = feature.getGeometry();
            const geojson = OGMapUtils.writeGeoJSONGeometry(geometry);
            this.advancedSearchForm.updateData("geom", geojson);
            if (geometryType === EnumGeometry.Point || geometryType === EnumGeometry.LineString) {
                if (!radiusEditor.option("value")) {
                    OGUtils.toastError("Vui lòng nhập bán kính");
                    this.searchFeatureLayer.getSource().clear();
                } else {
                    $.ajax({
                        data: {
                            geom: geojson
                        },
                        method: "post",
                        url: "/api/layer/getGeojsonBuffer/" + radiusEditor.option("value"),
                    }).done(result => {
                        if (result.data) {
                            const f = OGMapUtils.parseGeoJSON(result.data)[0] || undefined;
                            if (f instanceof Feature) {
                                this.searchFeatureLayer.getSource().clear();
                                this.searchFeatureLayer.getSource().addFeature(f);
                                this.advancedSearchForm.updateData("geom", result.data);
                            }
                        }
                    });
                }
            }
        });
        // Thay đổi bán kính
        // if (this.drawFeature) {
        //     this.searchFeatureLayer.getSource().clear();
        //     this.searchFeatureLayer.getSource().addFeature(this.drawFeature);
        //     const geojson = OGMapUtils.writeGeoJSONGeometry(this.drawFeature.getGeometry());
        //     this.advancedSearchForm.updateData("geom", geojson);
        //     if (geometryType === EnumGeometry.Point || geometryType === EnumGeometry.LineString) {
        //         if (!radiusEditor.option("value")) {
        //             OGUtils.alert("Vui lòng nhập bán kính").then(() => {
        //                 this.searchFeatureLayer.getSource().clear();
        //             });
        //         } else {
        //             $.ajax({
        //                 data: {
        //                     geom: geojson
        //                 },
        //                 method: "post",
        //                 url: "/api/layer/getGeojsonBuffer/" + radiusEditor.option("value"),
        //             }).done(result => {
        //                 if (result.data) {
        //                     const f = OGMapUtils.parseGeoJSON(result.data)[0] || undefined;
        //                     if (f instanceof Feature) {
        //                         this.searchFeatureLayer.getSource().addFeature(f);
        //                         this.advancedSearchForm.updateData("geom", result.data);
        //                     }
        //                 }
        //             });
        //         }
        //     }
        // }
    }

    //--Nếu chọn nhiều hơn một lớp dữ liệu => Thông báo yêu cầu phải điền từ khóa mới được tìm kiếm
    public doSearch(): boolean {
        if (this.searchCommonForm.validate().isValid === false) {
            return false;
        }

        this.grid.clearFilter();
        this.grid.clearSelection();
        this.grid.collapseAll();

        const layerEditor = this.searchCommonForm.getEditor("layer_id");

        if (!layerEditor) {
            return false;
        }

        this.arguments = {};
        const tableIds: number[] = [];

        if (layerEditor instanceof dxSelectBox) {
            const selectedItems = layerEditor.option("selectedItems");
            selectedItems.forEach((item, x) => {
                if (item.columns) {
                    tableIds.push(item.id);
                } else {
                    tableIds.push(item.table_info_id);
                }
            });
            this.arguments["table_id"] = tableIds;
        }

        const commonConfig = this.searchCommonForm.option("formData");
        const regionConfig = this.regionSearchForm.option("formData");
        const advancedConfig = this.advancedSearchForm.option("formData");
        const attr = this.searchForm.option("formData");

        if (tableIds.length === 1) {
            if (!commonConfig.kw && !advancedConfig.include_geometry
                && !regionConfig.province_code && !regionConfig.district_code && !regionConfig.commune_code && Object.keys(attr).length === 0) {
                OGUtils.toastError("Vui lòng nhập thông thông tin tìm kiếm!");
                this.arguments = undefined;
                return false;
            }
        } else if (tableIds.length === 0 || tableIds.length > 1) {
            if (!commonConfig.kw && !advancedConfig.include_geometry
                && !regionConfig.province_code && !regionConfig.district_code && !regionConfig.commune_code) {
                OGUtils.toastError("Vui lòng nhập thông thông tin tìm kiếm!");
                this.arguments = undefined;
                return false;
            }
        }

        Object.keys(attr).forEach((key) => {
            const value = attr[key];
            if (attr[key] === null || attr[key] === undefined) {
                delete attr[key];
            } else if ((typeof (value) === EnumTypeOf.object || typeof (value) === EnumTypeOf.array) && !attr[key].length) {
                if (!(value instanceof Date)) {
                    delete attr[key];
                }
            }
        });

        const param = JSON.parse(JSON.stringify(attr));

        this.popup.option("title", "Kết quả tìm kiếm");

        this.arguments["keyword"] = commonConfig.kw;
        this.arguments["schema"] = this.schema;
        // this.arguments["layer_id"] = commonConfig.layer_id;
        this.arguments["province_code"] = regionConfig.province_code ? regionConfig.province_code.toString() : undefined;
        this.arguments["district_code"] = regionConfig.district_code ? regionConfig.district_code.toString() : undefined;
        this.arguments["commune_code"] = regionConfig.commune_code ? regionConfig.commune_code.toString() : undefined;
        this.arguments["map_id"] = this.mapId;
        this.arguments["textSearch"] = commonConfig.kw;
        if (this.dvqlSearchForm.option("formData").capQuanLy) {
            this.arguments["capQuanLy"] = this.dvqlSearchForm.option("formData").capQuanLy;
        }

        if (commonConfig.kw) {
            param["textSearch"] = commonConfig.kw;
        }
        this.arguments["params"] = param;
        this.arguments["requireBoundary"] = true;

        if (advancedConfig.include_geometry) {
            this.arguments["geom"] = advancedConfig.geom;
        }

        this.grid.columnOption("district_code", "groupIndex", 0);
        this.grid.columnOption("matuyen", "groupIndex", 1);
        this.grid.columnOption("table_name", "groupIndex", 2);
        this.grid.getDataSource().reload().then(() => {
            delete this.arguments["requireBoundary"];
            const geom = this.advancedSearchForm.option("formData")?.geom;
            const mapParams = Object.assign({}, this.arguments);
            if (!mapParams.params) {
                mapParams.params = {};
            }
            if (mapParams.commune_code) {
                mapParams.params["commune_code"] = mapParams.commune_code;
            }
            if (mapParams.district_code) {
                mapParams.params["district_code"] = mapParams.district_code;
            }
            if (mapParams.province_code) {
                mapParams.params["province_code"] = mapParams.province_code;
            }
            if (mapParams.capQuanLy) {
                mapParams.params["capQuanLy"] = mapParams.capQuanLy;
            }
            this.layerTreeComponent.setParams(mapParams.params, commonConfig.layer_id || null, geom).reload();
        });

        this.exportGroupButton.option("items", [{
            icon: "icon icon-export-excel",
            onClick: () => {
                OGUtils.postDownload("/api/feature/exportQuickSearch/excel", this.arguments, "application/json; charset=utf-8");
            },
            text: "Xuất excel",
        }, {
            icon: "icon icon-export-shp",
            onClick: () => {
                OGUtils.postDownload("/api/feature/exportQuickSearch/shapefile", this.arguments, "application/json; charset=utf-8");
            },
            text: "Xuất shapefile",
        }]);
        this.btnZoomIn.option("disabled", true);
        this.btnIdentify.option("disabled", true);
    }

    onInit(): void {
        this.searchFeatureLayer = new VectorLayer({
            // displayInLayerSwitcher: false,
            source: new VectorSource(),
            zIndex: 999
        });
        // this.searchFeatureLayer.setStyle(new Style({
        //     fill: new Fill({
        //         color: "rgba(255, 255, 255, 0.7)"
        //     }),
        //     stroke: new Stroke({
        //         color: "rgba(4, 59, 92, 1)",
        //         width: 3,
        //     }),
        // }));
        this.oGMap.addLayer(this.searchFeatureLayer);
        this.identifyComponent.setSearchBox(this);
    }

    public selectAllLayers(): void {
        const layerEditor = this.searchCommonForm.getEditor("layer_id") as dxTagBox;
        if (layerEditor) {
            const layers = this.filterLayer(layerEditor.option("items"));
            layerEditor.option("value", layers);
        }
    }

    public updateFilterGeometry(geoJSON: string): void {
        this.advancedSearchForm.updateData("include_geometry", true);
        this.advancedSearchForm.updateData("geom", geoJSON);
    }

    //Thay đổi trạng thái bật/ tắt lớp dữ liêu trên selectbox chọn lớp tìm kiếm
    //sao cho tương ứng với các lớp dữ liêu đang hiển thị trên bản đồ (thay đổi dựa trên sự thay đổi của LayerTree)
    public updateLayerVisible(layerVisibleIds): void {
        const layerEditor = this.searchCommonForm.getEditor("layer_id");
        if (layerEditor) {
            layerEditor.option("value", layerVisibleIds);
        }
    }
}

export { SearchBoxComponent };