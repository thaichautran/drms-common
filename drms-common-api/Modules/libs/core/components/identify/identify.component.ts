import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { OGMap, OGMapProjection, OGMapUtils } from "@opengis/map";
import axios from "axios";
import dxGallery from "devextreme/ui/gallery";
import "devextreme/ui/gallery";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import { EventEmitter } from "events";
import Handlebars from "handlebars";
import { param } from "jquery";
import moment from "moment";
import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorImageLayer from "ol/layer/VectorImage";

import { EnumDataType, EnumGeometry, EnumStatus, NO_DATA } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { OGConfigModel } from "../../models/config.model";
import { FeatureAttributes } from "../../models/feature.model";
import { OGKeHoachKiemTraModel } from "../../models/kiem-tra/ke-hoach-kiem-tra.model";
import { OGPhieuKiemTraModel } from "../../models/kiem-tra/kiem-tra.model";
import { OGLayerModel } from "../../models/layer.model";
import { OGTableColumnModel, OGTableModel, OGTableRelationModel } from "../../models/table.model";
import { FeatureService } from "../../services/feature.service";
import { LayerService } from "../../services/layer.service";
import { TableColumnService, TableService } from "../../services/table.service";
import { AttributesEditorComponent } from "../attributes-editor/attributes-editor.component";
import { AttributesWindowComponent } from "../attributes-window/attributes-window.component";
import { IMapComponent } from "../base-component.abstract";
import { FeatureMaintenanceComponent } from "../feature-maintenance/feature-maintenance.component";
import { FeatureMaintenancePlanComponent } from "../feature-maintenance-plan/feature-maintenance-plan.component";
import { FeatureRelationshipComponent } from "../feature-relationship/feature-relationship.component";
import { SearchBoxComponent } from "../search-box/search-box.component";
import { SimulationComponent } from "../simulation/simulation.component";
import { StatisticRelationshipComponent } from "../statistic-relationship/statistic-relationship.component";
import "./identify.component.scss";
import IdentifyTemplate from "./templates/identify.hbs";
import IdentifyDetailTemplate from "./templates/identify_detail.hbs";
import RelationDetailTemplate from "./templates/relation_detail.hbs";

const IdentifyFunc = Handlebars.compile(IdentifyTemplate);

interface IdentifyOption {
    allowDelete?: boolean,
    allowEditing?: boolean,
    allowSimulate?: boolean,
    attributeEditors: AttributesEditorComponent,
    layers?: number[],
    loaiKiemTra?: string,
    oGConfig: OGConfigModel,
}

class IdentifyComponent implements IMapComponent {
    attributeEditors: AttributesEditorComponent;
    attributeWindowComponent: AttributesWindowComponent;
    attributes: FeatureAttributes;
    data: Feature[];
    editEmitter: EventEmitter;
    featureID: number | string;
    featureMaintenanceComponent: FeatureMaintenanceComponent;
    featureMaintenancePlanComponent: FeatureMaintenancePlanComponent;
    featureRelationship: FeatureRelationshipComponent;
    gallery: dxGallery;
    imagePopup: dxPopup;
    oGISLayer: OGLayerModel;
    oGISTable: OGTableModel;
    oGMap: OGMap;
    options: IdentifyOption;
    relationTables: OGTableModel[];
    relations: OGTableRelationModel[];
    searchBoxComponent: SearchBoxComponent;
    simulationComponent: SimulationComponent;
    statisticRelationship: StatisticRelationshipComponent;

    constructor(oGMap, options: IdentifyOption) {
        this.oGMap = oGMap;
        this.options = options;
        this.featureRelationship = new FeatureRelationshipComponent({
            identify: this,
            oGMap: this.oGMap
        });
        this.statisticRelationship = new StatisticRelationshipComponent({
            identify: this,
            oGMap: this.oGMap
        });
        this.simulationComponent = new SimulationComponent({
            identify: this,
            oGMap: this.oGMap
        });
        this.featureMaintenanceComponent = new FeatureMaintenanceComponent({
            oGMap: this.oGMap
        });
        this.featureMaintenancePlanComponent = new FeatureMaintenancePlanComponent({
            oGMap: this.oGMap
        });
        this.attributeEditors = options.attributeEditors;
        // this.attributeWindowComponent = new AttributesWindowComponent(this.oGMap, {
        //     attributeEditors: this.attributeEditors,
        //     identify: this,
        //     oGConfig: options.oGConfig
        // });
        this.onInit();
    }

    private initImagePopup(): void {
        const self = this;
        this.imagePopup = $("<div />").appendTo($("body")).dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                this.gallery = $("<div />").appendTo(container).dxGallery({
                    dataSource: [],
                    height: "90%",
                    itemTemplate(item) {
                        const result = $("<div>");
                        $("<img>").attr("alt", item.file_name).attr("src", item.path).appendTo(result);
                        return result;
                    },
                    loop: false,
                    showIndicator: false,
                    width: "100%",
                }).dxGallery("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            dragOutsideBoundary: true,
            height: 500,
            hideOnOutsideClick: false,
            onHidden: () => {
            },
            onOptionChanged: () => {
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
                            self.imagePopup.option("height", 500);
                            self.imagePopup.option("width", 900);
                            e.component.option("icon", "chevronup");
                            e.component.option("hint", "Thu nhỏ");
                        } else {
                            self.imagePopup.option("height", 90);
                            self.imagePopup.option("width", 900);
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
                            self.imagePopup.option("height", "100vh");
                            self.imagePopup.option("width", "100vw");
                            e.component.option("icon", "fullscreen");
                            e.component.option("hint", "Mặc định");
                        } else {
                            self.imagePopup.option("height", 500);
                            self.imagePopup.option("width", 900);
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

    private onToggleClick(): void {

    }

    private renderToHTML(layerInfo: OGLayerModel, feature_id: number | string, properties: FeatureAttributes, domains, columns: OGTableColumnModel[], files, img, relations, hsq, maintenancePlans?: OGKeHoachKiemTraModel[], maintenances?: OGPhieuKiemTraModel[]): Promise<string | void> {
        const views = {};
        const visibleViews = {};
        const domainKeys = Object.keys(domains);
        const dataInRadiusLayerPromises = [];
        columns.sort((a, b) => {
            if (a.order === b.order)
                return 0;
            else if (a.order > b.order)
                return 1;
            else return -1;
        }).forEach((column, idx) => {
            if (column && column.column_name !== "id" && column.column_name !== "geom" && column.visible) {
                const value = properties[column.column_name];
                const has_child_data = column.data_in_radius_of_layer > 0 ? true : false;

                if (value || has_child_data) {
                    views[column.name_vn] = {
                        column: column,
                        count_data: 0,
                        has_child_data: has_child_data,
                        has_data: value ? true : false, // Check null
                        is_column_code: (column.column_name.includes("ma") || OGUtils.toLowerCaseNonAccentVietnamese(column.name_vn).includes("ma")) ? true : false,
                        is_link: (value && (value.toString().includes("http://") || value.toString().includes("https://"))) ? true : false
                    };
                    if (column.data_in_radius_of_layer > 0) {
                        // const params = {};
                        // if (relations && relations.length) {
                        //     const relation = relations.filter(x => x.table_id === column.data_in_radius_of_layer || x.relation_table_id === column.data_in_radius_of_layer)[0];
                        //     if (relation) {
                        //         if (relation.table_id === column.data_in_radius_of_layer) {
                        //             params[relation.table_column?.column_name] = properties[relation.relation_column?.column_name];
                        //         }
                        //         else {
                        //             params[relation.relation_column?.column_name] = properties[relation.table_column?.column_name];
                        //         }
                        //     }
                        // }
                        // const args = {
                        //     onlyReturnCount: true,
                        //     params: params,
                        //     table_id: column.data_in_radius_of_layer,
                        // };
                        // dataInRadiusLayerPromises.push(new Promise((resolve) => {
                        //     axios.post("/api/feature/advanced-search", args).then((result) => {
                        //         if (result.data.status === EnumStatus.OK && result.data.data) {
                        //             views[column.name_vn]["count_data"] = result.data.data.dataSearch.totalCount;
                        //         }
                        //         resolve(true);
                        //     }).catch(e => {
                        //         console.error(e);
                        //         resolve(false);
                        //     });
                        // }));
                    } else if (column.lookup_table_id > 0 && domainKeys.includes(column.column_name)) {
                        const domain = domains[column.column_name].filter(x => x.id == value)[0];
                        if (domain) {
                            views[column.name_vn]["value"] = domain.mo_ta;
                        } else {
                            views[column.name_vn]["value"] = value;
                        }
                    } else if (column.column_name.includes("toado")) {
                        views[column.name_vn]["value"] = value ? OGUtils.formatNumber(parseFloat(value.toString()), 0, 4) : NO_DATA;
                    } else {
                        switch (column.data_type) {
                            case EnumDataType.date:
                                views[column.name_vn]["value"] = value ? moment(new Date(value)).format("DD/MM/YYYY") : NO_DATA;
                                break;
                            case EnumDataType.dateTime:
                                views[column.name_vn]["value"] = value ? moment(new Date(value)).format("DD/MM/YYYY HH:mm:ss") : NO_DATA;
                                break;
                            case EnumDataType.string:
                            case EnumDataType.text:
                            default:
                                if (column.column_name == "province_code") {
                                    views[column.name_vn]["value"] = properties["province_name"];
                                } else if (column.column_name == "district_code") {
                                    views[column.name_vn]["value"] = properties["district_name"];
                                } else if (column.column_name == "commune_code") {
                                    views[column.name_vn]["value"] = properties["commune_name"];
                                } else {
                                    views[column.name_vn]["value"] = value || NO_DATA;
                                }
                                break;
                            case EnumDataType.bool:
                                views[column.name_vn]["value"] = value ? "Có" : "Không";
                                break;
                            case EnumDataType.smallint:
                            case EnumDataType.integer:
                            case EnumDataType.double:
                                views[column.name_vn]["value"] = value ? OGUtils.formatNumber(parseFloat(value.toString()), 0, 3) : NO_DATA;
                                break;
                        }
                        // if (idx <= 4) {
                        //     visibleViews[column.name_vn] = views[column.name_vn];
                        // }
                    }
                } else {
                    // views[column.name_vn]["value"] = NO_DATA;
                }
            }
        });

        return Promise.all(dataInRadiusLayerPromises).then(() => {
            let images = [];
            let documents = [];
            if (files && files.length > 0) {
                images = $.grep(files, img => {
                    img.path = img.url || img.path;
                    return img.mime_type.indexOf("image") >= 0;
                });
                let counter = 1;
                documents = $.grep(files, document => {
                    img.path = img.url || img.path;
                    document.counter = counter++;
                    return document.mime_type.indexOf("image") === -1;
                });
            }
            let relationFiles = [];
            if (hsq && hsq.length > 0) {
                relationFiles = $.grep(hsq, file => {
                    return file.mime_type.indexOf("image") === -1;
                });
            }
            return Handlebars.compile(IdentifyDetailTemplate)({
                documents: documents,
                feature_id: feature_id,
                files: files,
                hasThumbnail: images.length > 0,
                images: images,
                isPolygon: layerInfo.geometry === EnumGeometry.Polygon || layerInfo.geometry === EnumGeometry.MultiPolygon,
                layer_files: relationFiles,
                layer_id: layerInfo.id,
                layer_name: layerInfo.name_vn,
                maintenances: maintenances,
                plans: maintenancePlans,
                thumbnail: images.length > 0 ? images[0].path : "#",
                views: views,
                visibleViews: visibleViews
            });
        }).catch(e => {

        });
    }

    public bindDetailRelation(layerInfo, relations): void {
        const self = this;
        if (relations && relations.length) {
            $(".relation-result-tab").css("display", "flex");
            self.relationTables = [];
            $.each(relations, function (idx, relation) {
                if (relation.table_id === layerInfo.table_info_id) {
                    self.relationTables.push(relation.relation_table);
                } else {
                    self.relationTables.push(relation.table);
                }
            });
            $("#detail-relation-content").html(Handlebars.compile(RelationDetailTemplate)(this.relationTables));
            $(".detail-relation").text("Thông tin " + layerInfo.name_vn);
        } else {
            $(".relation-result-tab").css("display", "none");
        }
    }

    public hide(): void {
        this.oGMap.clearMap();
        $(".identify-popup").css("z-index", 0);
        $(".identify-popup").css("display", "none");
    }

    public identify(layerInfo: OGLayerModel, id: number | string, highlight?: boolean): void {
        this.identifyRowFeature(id, layerInfo.id, layerInfo.name_vn, highlight);
        $(".identify-result-tab").css("display", "none");
    }

    public identifyFeature(feature: Feature, highlight?: boolean): void {
        const self = this;
        self.oGISLayer = undefined;
        self.featureID = undefined;
        if (!highlight) {
            highlight = true;
        }

        if (feature.get && feature.get("features")) {
            const size = feature.get("features").length;
            if (size > 1) {
                const data: Feature[] = feature.get("features").map((f) => {
                    return Object.assign({
                        feature: f,
                        id: f.getId(),
                        // layer: this.g_ClusterPointLayer
                    }, f.getProperties());
                });
                //
                if (this.options.layers && this.options.layers.length > 0) {
                    this.data = [];
                    $.each(data, (idx, item) => {
                        if (this.options.layers.indexOf(item["layer_id"]) >= 0) {
                            this.data.push(item);
                        }
                    });
                } else {
                    this.data = data;
                }
                const items = {};
                let key: string;
                $.each(this.data, function (index, feature) {
                    key = feature["layer_name"];
                    if (key) {
                        if (!items[key]) {
                            items[key] = [];
                        }
                        items[key].push(feature);
                    }
                });
                $(".identify-popup").html(IdentifyFunc({
                    grouped: items,
                    total: this.data.length,
                }));
                $(".identify-result-tab").css("display", "block");
                $("#viewRelation").css("display", "none");
                if (this.options.allowSimulate) {
                    $("#viewSimulation").css("display", "inline-block");
                } else {
                    $("#viewSimulation").css("display", "none");
                }
                if (this.options.allowEditing) {
                    $("#editFeature").css("display", "inline-block");
                } else {
                    $("#editFeature").css("display", "none");
                }
                if (this.options.allowDelete) {
                    $("#deleteFeature").css("display", "inline-block");
                } else {
                    $("#deleteFeature").css("display", "none");
                }
                this.show();
            } else {
                const originalFeature = feature.get("features")[0];
                if (originalFeature) {
                    this.identifySingleFeature(originalFeature, highlight);
                }
            }
        } else {
            this.identifySingleFeature(feature, highlight);
        }
    }

    public identifyRowFeature(featureId: number | string, layerId: number, layerName?: string, highlight?: boolean): void {
        OGUtils.showLoading();

        Promise.all([
            FeatureService.queryFeature(layerId, 0, featureId),
            LayerService.get(layerId),
            FeatureService.getFeatureFiles(layerId, 0, featureId),
            LayerService.getFiles(layerId),
            FeatureService.getMaintenancePlans({
                feature_id: featureId,
                layer_id: layerId,
                loaikiemtra: this.options.loaiKiemTra,
                skip: 0,
                take: 5
            }),
            FeatureService.getMaintenances({
                feature_id: featureId,
                layer_id: layerId,
                loaikiemtra: this.options.loaiKiemTra,
                skip: 0,
                take: 5
            }),
        ]).then((values) => {
            const featureResponse = values[0];
            const layerResponse = values[1];
            const filesResponse = values[2]["featureFiles"].concat(values[2]["tableFiles"]);
            const layerFileResponse = values[3];
            const maintenancePlanResponse = values[4]?.data;
            const maintenanceResponse = values[5]?.data;

            OGUtils.hideLoading();

            const columnsResponse = layerResponse.table.columns;
            const attributes = featureResponse.attributes;
            const domain = featureResponse.domain_values;
            const relationResponse = featureResponse.relations;

            $(".identify-result-tab").css("display", "none");
            $("#zoomTo").css("display", "inline-block");

            const childRelation = relationResponse.filter(x => x.table_id === layerResponse.table_info_id);
            if (childRelation && childRelation.length) {
                $("#viewRelation").css("display", "inline-block");
            } else {
                $("#viewRelation").css("display", "none");
            }
            if (this.options.allowSimulate) {
                $("#viewSimulation").css("display", "inline-block");
            } else {
                $("#viewSimulation").css("display", "none");
            }
            if (this.options.allowEditing) {
                $("#editFeature").css("display", "inline-block");
            } else {
                $("#editFeature").css("display", "none");
            }
            if (this.options.allowDelete) {
                $("#deleteFeature").css("display", "inline-block");
            } else {
                $("#deleteFeature").css("display", "none");
            }

            this.attributes = featureResponse.attributes;
            this.oGISTable = undefined;
            this.oGISLayer = layerResponse;
            this.featureID = featureId;
            this.relations = featureResponse.relations;
            this.bindDetailRelation(layerResponse, relationResponse);
            this.renderToHTML(layerResponse, featureId, attributes, domain, columnsResponse, filesResponse, [], featureResponse.relations, layerFileResponse, maintenancePlanResponse, maintenanceResponse).then(result => {
                if (result) {
                    this.showIdentifyPopup(result);
                }
            });
            //this.showIdentifyPopup(this.renderToHTML(layerResponse, featureId, attributes, domain, columnsResponse, filesResponse, [], [], layerFileResponse, maintenancePlanResponse, maintenanceResponse));
            if (featureResponse.attributes.geom && highlight) {
                this.oGMap.highlightIdentifyFeature(featureResponse.attributes.geom.toString());
            }
            $(document).off("click", "#identify-toggle", this.onToggleClick);
            $(document).on("click", "#identify-toggle", this.onToggleClick);
        });
    }

    public identifyRowTableFeature(featureId: number | string, tableId: number, tableName?: string, highlight?: boolean, fitBounds?: boolean): void {
        OGUtils.showLoading();
        Promise.all([
            FeatureService.queryFeature(0, tableId, featureId),
            TableService.get(tableId),
            FeatureService.getFeatureFiles(0, tableId, featureId),
            LayerService.getFiles(tableId),
            FeatureService.getMaintenancePlans({
                feature_id: featureId,
                loaikiemtra: this.options.loaiKiemTra,
                skip: 0,
                table_id: tableId,
                take: 5
            }),
            FeatureService.getMaintenances({
                feature_id: featureId,
                loaikiemtra: this.options.loaiKiemTra,
                skip: 0,
                table_id: tableId,
                take: 5
            }),
        ]).then((values) => {
            const featureResponse = values[0];
            const tableResponse = values[1];
            const filesResponse = values[2]["featureFiles"].concat(values[2]["tableFiles"]);
            const layerFileResponse = values[3];
            const maintenancePlanResponse = values[4]?.data;
            const maintenanceResponse = values[5]?.data;
            OGUtils.hideLoading();

            const columnsResponse = tableResponse.columns;
            const attributes = featureResponse.attributes;
            const domain = featureResponse.domain_values;
            const relationResponse = featureResponse.relations;

            const childRelation = relationResponse.filter(x => x.table_id === tableResponse.id);
            if (childRelation && childRelation.length) {
                $("#viewRelation").css("display", "inline-block");
            } else {
                $("#viewRelation").css("display", "none");
            }

            $("#viewSimulation").css("display", "none");
            $(".identify-result-tab").css("display", "none");

            const layerInfo: OGLayerModel = {
                id: tableId,
                name_vn: tableName,
                table_info_id: tableId
            };

            this.attributes = featureResponse.attributes;
            this.oGISLayer = undefined;
            this.oGISTable = tableResponse;
            this.featureID = featureId;
            this.relations = featureResponse.relations;
            this.bindDetailRelation(layerInfo, relationResponse);
            this.renderToHTML(layerInfo, featureId, attributes, domain, columnsResponse, filesResponse, [], featureResponse.relations, layerFileResponse, maintenancePlanResponse, maintenanceResponse).then(result => {
                if (result) {
                    this.showIdentifyPopup(result);
                }
            });
            if (featureResponse.attributes.geom) {
                if (highlight) {
                    this.oGMap.highlightIdentifyFeature(featureResponse.attributes.geom.toString());
                }
                if (fitBounds) {
                    this.oGMap.fitBounds(featureResponse.attributes.geom.toString());
                }
            }
            $(document).off("click", "#identify-toggle", this.onToggleClick);
            $(document).on("click", "#identify-toggle", this.onToggleClick);
        });
    }

    public identifySingleFeature(feature: Feature, highlight?: boolean): void {
        const layerId = feature.get("layer_id"),
            layername = feature.get("layer_name"),
            featureId = feature.get("fid");
        this.identifyRowFeature(featureId, layerId, layername, highlight);

        $(".identify-result-tab").css("display", "none");
        $(document).off("click", "#identify-toggle", this.onToggleClick);
        $(document).on("click", "#identify-toggle", this.onToggleClick);
        // if (highlight) {
        // this.oGMap.highlightFeature(feature);
        // }
        OGUtils.showLoading();
    }

    onInit(): void {
        const self = this;
        if (this.oGMap && this.oGMap.mapContainer) {
            $("<div class=\"identify-popup\"></div>").appendTo(this.oGMap.mapContainer);
            this.hide();
        }
        $(".identify-popup").html(IdentifyFunc({}));
        this.initImagePopup();
        Fancybox.bind("[data-fancybox]", {
            //
        });
        $(document).on("click", "#zoomTo", function () {
            if ((self.oGISLayer || self.oGISTable) && self.featureID) {
                FeatureService.queryFeature(self.oGISLayer?.id, self.oGISTable?.id, self.featureID).then(response => {
                    const geom = response.attributes.geom;
                    if (geom) {
                        self.oGMap.fitGeoJSON(geom.toString());
                        self.oGMap.highlightIdentifyFeature(geom.toString());
                    }
                });
            }
        });
        $(document).on("click", "#viewRelation", function () {
            if ((self.oGISLayer || self.oGISTable) && self.featureID) {
                const table_id = self.oGISLayer ? self.oGISLayer.table_info_id : self.oGISTable.id;
                self.statisticRelationship.for([self.featureID], table_id).show();
            }
        });
        $(document).on("click", "#viewSimulation", function () {
            if (self.oGISLayer && self.featureID) {
                self.simulationComponent.for(self.featureID, self.oGISLayer.id).show();
            }
        });
        $(document).on("click", "#viewMaintenances", function () {
            if ((self.oGISLayer || self.oGISTable) && self.featureID && self.options.loaiKiemTra) {
                const table_id = self.oGISLayer ? self.oGISLayer.table_info_id : self.oGISTable.id;
                self.featureMaintenanceComponent.for(self.featureID, table_id, self.options.loaiKiemTra).show();
            }
        });
        $(document).on("click", "#viewMaintenancePlans", function () {
            if ((self.oGISLayer || self.oGISTable) && self.featureID && self.options.loaiKiemTra) {
                const table_id = self.oGISLayer ? self.oGISLayer.table_info_id : self.oGISTable.id;
                self.featureMaintenancePlanComponent.for(self.featureID, table_id, self.options.loaiKiemTra).show();
            }
        });
        $(document).on("click", "#notifyBtn", function () {
            if (self.featureID) {
                if (self.oGISLayer || self.oGISTable) {
                    OGUtils.showLoading();
                    FeatureService.notify(self.oGISLayer ? self.oGISLayer.id : 0, self.oGISTable ? self.oGISTable.id : 0, self.featureID).then(response => {
                        OGUtils.toastSuccess("Gửi thông báo thành công!");
                    });
                }
            }
        });
        $(document).on("click", "#editFeature", function () {
            if (self.featureID) {
                if (self.oGISLayer || self.oGISTable) {
                    FeatureService.queryFeature(self.oGISLayer ? self.oGISLayer.id : 0, self.oGISTable ? self.oGISTable.id : 0, self.featureID).then(response => {
                        OGUtils.hideLoading();
                        self.attributeEditors.show();
                        // response.attributes.id = self.featureID;
                        const geom = response.attributes.geom;
                        let geometry = undefined;
                        if (geom) {
                            const f = OGMapUtils.parseGeoJSON(geom.toString())[0] || undefined;
                            if (f instanceof Feature) {
                                geometry = f.getGeometry();
                            }
                        }
                        self.attributeEditors.beginEdit(response.attributes, geometry, self.oGISLayer, self.oGISTable, response.files);
                    });
                }
            }
        });
        $(document).on("click", "#deleteFeature", function () {
            if (self.oGISLayer && self.featureID) {
                const attributes = {};
                const tableInfo = self.oGISLayer ? self.oGISLayer.table : self.oGISTable;
                const keyColumn = tableInfo.key_column ? tableInfo.key_column : tableInfo.identity_column;
                attributes[keyColumn.column_name] = self.featureID;
                const data = {
                    attributes: attributes,
                    layer_id: self.oGISLayer ? self.oGISLayer.id : 0,
                    table_id: self.oGISTable ? self.oGISTable.id : 0
                };
                OGUtils.confirm("Bạn có chắc chắn xóa đối tượng này?", "Xác nhận").then((anws) => {
                    if (anws) {
                        $.ajax({
                            contentType: "application/json",
                            data: JSON.stringify(data),
                            success: (xhr) => {
                                if (xhr.status === EnumStatus.OK) {
                                    OGUtils.toastSuccess("Xóa đối tượng thành công!", "Thông báo");
                                    if (self.oGISLayer) {
                                        const layer = self.oGISLayer.layer || self.oGMap.getLayerById(self.oGISLayer.id);
                                        if (layer && (layer instanceof VectorImageLayer || layer instanceof VectorLayer)) {
                                            layer.getSource().refresh();
                                        }
                                    }
                                    self.hide();
                                } else {
                                    OGUtils.toastError("Xóa thông tin thất bại. Vui lòng thử lại sau.", "Thông báo");
                                }
                            },
                            type: "POST",
                            url: "/api/feature/delete",
                        });
                    }
                });
            }
        });
        $(document).on("click", "#polygonFilter", () => {
            if (this.searchBoxComponent) {
                if (this.attributes && this.attributes.geom) {
                    this.searchBoxComponent.updateFilterGeometry(this.attributes.geom.toString());
                }
                this.searchBoxComponent.selectAllLayers();
                this.searchBoxComponent.doSearch();
            }
        });
        $(document).on("click", ".nav-item-identify", function () {
            $("#tabs-identify").find("li").removeClass("active");
            $(this).parent().addClass("active");
        });
        $(document).on("click", ".view-detail-identify", function () {
            const feature_id = $(this).find("a").data("id");
            const layer_id = $(this).find("a").data("layer-id");
            const layer_name = $(this).find("a").data("layer-name");
            $("#identify-result-table").find("tr").removeClass("active");
            $(this).parent().addClass("active");
            self.identifyRowFeature(feature_id, layer_id, layer_name);
        });

        $(document).on("click", ".view-detail-relation", async function () {
            const table_id = $(this).data("id");
            const relations: OGTableRelationModel[] = self.relations.filter(x => x.table_id === table_id || x.relation_table_id === table_id);
            if (self.featureID && relations && relations.length > 0) {
                const params = {};
                const relation = relations[0];
                const tableInfo = await TableService.get(table_id);
                if (relation.table_id === table_id) {
                    params[relation.table_column?.column_name] = self.attributes[relation.relation_column?.column_name];
                }
                else {
                    params[relation.relation_column?.column_name] = self.attributes[relation.table_column?.column_name];
                }
                self.attributeWindowComponent.for(undefined, tableInfo, params).show();
            }
        });

        $(document).on("click", ".view-document", function () {
            const url = $(this).data("url");
            window.open(url, "_blank");
        });

        $(document).on("click", ".close-identify-btn", function () {
            self.hide();
        });

        $(document).on("click", ".fancybox-link", function () {
            // const dataSource = [{
            //     file_name: $(this).data("name"),
            //     id: $(this).data("id"),
            //     path: $(this).data("path")
            // }];
            // self.gallery.option("dataSource", dataSource);
            // self.imagePopup.show();
        });
    }

    public setAttributeWindows(attributeWindowComponent: AttributesWindowComponent): this {
        this.attributeWindowComponent = attributeWindowComponent;
        return this;
    }
    public setSearchBox(component: SearchBoxComponent): void {
        this.searchBoxComponent = component;
    }

    public show(): void {
        $(".identify-popup").css("z-index", 2);
        $(".identify-popup").css("display", "block");
    }

    public showIdentifyPopup(html: string): void {
        if (this.oGMap.mapContainer) {
            const views = this.oGMap.mapContainer.getElementsByClassName("ol-viewport");
            if (views.length > 0) {
                (views[0] as HTMLElement).style.zIndex = "1";
            }
        }
        this.show();
        $("#detail-result-content").html(html);
        $(".detail-result").trigger("click");
    }
}

export { IdentifyComponent };