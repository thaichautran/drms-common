import { OGMap, OGMapProjection, OGMapUtils } from "@opengis/map";
import axios from "axios";
import CustomStore, { ResolvedData } from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxDataGrid from "devextreme/ui/data_grid";
import dxForm, { Item as dxFormItem } from "devextreme/ui/form";
import dxList from "devextreme/ui/list";
import dxPopup from "devextreme/ui/popup";
import dxSelectBox from "devextreme/ui/select_box";
import { ValidationResult } from "devextreme/ui/validator";
import { EventEmitter } from "events";
import $ from "jquery";
import { Coordinate } from "ol/coordinate";
import { xhr } from "ol/featureloader";
import { LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon, SimpleGeometry } from "ol/geom";
import { Layer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import AnimatedCluster from "ol-ext/layer/AnimatedCluster";

import { EnumCustom, EnumDataType, EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestData, RestError } from "../../models/base-response.model";
import { FeatureAttributes, FeatureFile } from "../../models/feature.model";
import { OGLayerDomainModel, OGLayerModel } from "../../models/layer.model";
import { OGTableColumnModel, OGTableModel } from "../../models/table.model";
import { AreaService } from "../../services/area.service";
import { TableService } from "../../services/table.service";
import { IMapComponent } from "../base-component.abstract";
import "./attributes-editor.component.scss";

type CustomRule = {
    greater_col: OGTableColumnModel,
    less_col: OGTableColumnModel,
    type: EnumDataType
};

interface FlatCoordinate {
    idx: number;
    pidx?: number;
    x: number;
    y: number;
    z: number;
}

class AttributesEditorComponent implements IMapComponent {
    attachmentList: dxList;
    attachments: FeatureFile[];
    attributesEditorPopup: dxPopup;
    attributesForm: dxForm;
    cloneGeometry: SimpleGeometry;
    customValidateRules: CustomRule[];
    dataGeomProjection: string;
    deletedAttachments: FeatureFile[];
    editEmitter = new EventEmitter();
    editorDirty: boolean = false;
    fileElement: JQuery;
    geomProjectSelect: dxSelectBox;
    geometryGrid: dxDataGrid;
    identityColumn?: OGTableColumnModel;
    layer: Layer;
    oGISLayer: OGLayerModel;
    oGISLayerDomains: OGLayerDomainModel[];
    oGISTable: OGTableModel;
    oGMap: OGMap;

    originalAttributes: object;
    originalGeometry: SimpleGeometry;
    constructor(oGMap: OGMap) {
        this.oGMap = oGMap;
        this.onInit();
    }

    private _buildAttributeEditor(column: OGTableColumnModel, dataField?: string, labelVisible?: boolean, disabled?: boolean): dxFormItem[] {
        if (column.column_name === "created_at"
            || column.column_name === "updated_at"
            || column.is_identity || column.column_name === "district_code"
            || column.column_name === "commune_code"
            || column.column_name === "province_code"
            || column.column_name === "is_delete") {
            return [];
        }
        if (disabled === undefined || disabled === null)
            disabled = false;
        const editors: dxFormItem[] = [];
        if (column.data_in_radius_of_layer > 0) {
            editors.push({
                cssClass: "attribute-form-item",
                dataField: dataField || column.column_name,
                editorOptions: {
                    dataSource: new DataSource({
                        key: "id",
                        store: new CustomStore({
                            load: () => {
                                return new Promise<ResolvedData>((resolve) => {
                                    return $.get("/api/feature/getFeatureOfLayerInRadius", {
                                        coordinates: this.originalGeometry ? this.originalGeometry.getCoordinates()?.toString() : "",
                                        layer_id: column.data_in_radius_of_layer,
                                        radius: 100
                                    }).done((xhr: RestData<object[]> | RestError) => {
                                        if (xhr.status === EnumStatus.OK) {
                                            resolve({
                                                data: (xhr as RestData<object[]>).data,
                                                totalCount: (xhr as RestData<object[]>).data.length
                                            });
                                        }
                                        else {
                                            resolve({
                                                data: [],
                                                totalCount: 0,
                                            });
                                        }
                                    });
                                });
                            },
                            loadMode: "raw"
                        })
                    }),
                    disabled: disabled,
                    displayExpr: "text",
                    noDataText: "Không có dữ liệu",

                    showClearButton: true,
                    valueExpr: "id",
                },
                editorType: "dxSelectBox",
                label: {
                    text: column.name_vn,
                    visible: labelVisible
                }
            });
        } else if (column.lookup_table_id > 0) {
            editors.push({
                cssClass: "attribute-form-item",
                dataField: dataField || column.column_name,
                editorOptions: {
                    dataSource: {
                        key: "id",
                        store: new CustomStore({
                            load: () => {
                                return TableService.shortData({ table_id: column.lookup_table_id });
                            }
                        })
                    },
                    disabled: disabled,
                    displayExpr: "text",
                    noDataText: "Không có dữ liệu",

                    showClearButton: true,
                    valueExpr: "id",
                },
                editorType: "dxSelectBox",
                label: {
                    text: column.name_vn,
                    visible: labelVisible
                }
            });
        } else if (column.data_type === EnumDataType.integer || column.data_type === EnumDataType.smallint || column.data_type === EnumDataType.double) {
            editors.push({
                cssClass: "attribute-form-item",
                dataField: dataField || column.column_name,
                editorOptions: {
                    disabled: disabled,
                    format: column.data_type === EnumDataType.integer ? "#0" : "",
                    placeholder: column.name_vn,
                    showClearButton: true,
                    showSpinButtons: true,
                },
                editorType: "dxNumberBox",
                label: {
                    text: column.name_vn,
                    visible: labelVisible
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
            editors.push({
                cssClass: "attribute-form-item",
                dataField: dataField || column.column_name,
                editorOptions: {
                    applyButtonText: "Xác nhận",
                    cancelButtonText: "Hủy",
                    disabled: disabled,
                    displayFormat: format,
                    invalidDateMessage: "Vui lòng nhập đúng định dạng: " + format,
                    placeholder: column.name_vn,
                    showAnalogClock: false,
                    showClearButton: true,
                    type: type,
                    width: "100%",
                },
                editorType: "dxDateBox",
                label: {
                    text: column.name_vn,
                    visible: labelVisible
                },
            });
        } else if (column.data_type === EnumDataType.bool) {
            editors.push({
                cssClass: "attribute-form-item",
                dataField: dataField || column.column_name,
                editorOptions: {
                    disabled: disabled,
                    displayExpr: "mo_ta",
                    items: [{
                        "id": true,
                        "mo_ta": "Có"
                    }, {
                        "id": false,
                        "mo_ta": "Không"
                    }],
                    noDataText: "Không có dữ liệu",

                    showClearButton: true,
                    value: false,
                    valueExpr: "id",
                },
                editorType: "dxSelectBox",
                label: {
                    text: column.name_vn,
                    visible: labelVisible
                }
            });
        } else if (column.data_type === EnumDataType.string && column.character_max_length >= EnumCustom.charDefaultLength) {
            editors.push({
                colSpan: 2,
                cssClass: "attribute-form-item",
                dataField: dataField || column.column_name,
                editorOptions: {
                    disabled: disabled,
                    maxLength: column.character_max_length,
                    placeholder: column.name_vn,
                    showClearButton: true,
                },
                editorType: "dxTextBox",
                label: {
                    text: column.name_vn,
                    visible: labelVisible
                },
            });
        } else {
            editors.push({
                cssClass: "attribute-form-item",
                dataField: dataField || column.column_name,
                editorOptions: {
                    disabled: disabled,
                    maxLength: column.character_max_length,
                    placeholder: column.name_vn,
                    showClearButton: true,
                },
                editorType: "dxTextBox",
                label: {
                    text: column.name_vn,
                    visible: labelVisible
                },
            });
        }
        editors.map(item => { item["validationRules"] = []; });
        if (column.require) {
            editors.map(item => {
                item["validationRules"].push({
                    message: `Không được để trống ${column.name_vn}`,
                    type: "required"
                });
            });
        }
        if (column.column_name.toLowerCase().includes("email")) {
            editors.map(item => {
                item["validationRules"].push({
                    message: "Email không chính xác",
                    type: "email"
                });
            });
        }
        return editors;
    }

    //   Toa độ mới sau khi chuyển đổi
    private convertCoordinates(geometry: SimpleGeometry, beforeProjection: string, afterProjection: string): Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] {
        if (geometry) {
            const coordinates = geometry.getCoordinates();
            if (coordinates === null) {
                return [];
            }

            if (geometry instanceof Point || geometry instanceof MultiPoint) {
                return OGMapProjection.projectDataGeom(coordinates, beforeProjection, afterProjection);
            } else if (geometry instanceof LineString) {
                const coordinatesConvert: Coordinate[] = [];
                coordinates.forEach((items) => {
                    coordinatesConvert.push(OGMapProjection.projectDataGeom(items, beforeProjection, afterProjection));
                });
                return coordinatesConvert;
            } else if (geometry instanceof MultiLineString) {
                const coordinatesConvert: Coordinate[][] = [];
                coordinates.forEach((pItems) => {
                    const coordinatesConvertItem: Coordinate[] = [];
                    pItems.forEach((items) => {
                        coordinatesConvertItem.push(OGMapProjection.projectDataGeom(items, beforeProjection, afterProjection));
                    });
                    coordinatesConvert.push(coordinatesConvertItem);
                });
                return coordinatesConvert;
            } else if (geometry instanceof Polygon) {
                const coordinatesConvert: Coordinate[][] = [];
                coordinates.forEach((pItems) => {
                    const coordinatesConvertItem: Coordinate[] = [];
                    pItems.forEach((items) => {
                        coordinatesConvertItem.push(OGMapProjection.projectDataGeom(items, beforeProjection, afterProjection));
                    });
                    coordinatesConvert.push(coordinatesConvertItem);
                });
                return coordinatesConvert;
            } else if (geometry instanceof MultiPolygon) {
                const coordinatesConvert: Coordinate[][][] = [];
                coordinates.forEach((pItems) => {
                    const coordinatesConvertItems: Coordinate[][] = [];
                    pItems.forEach((items) => {
                        const coordinatesConvertItem: Coordinate[] = [];
                        items.forEach((item) => {
                            coordinatesConvertItem.push(OGMapProjection.projectDataGeom(item, beforeProjection, afterProjection));
                        });
                        coordinatesConvertItems.push(coordinatesConvertItem);
                    });
                    coordinatesConvert.push(coordinatesConvertItems);
                });
                return coordinatesConvert;
            }
        }
        return [];
    }

    private initAttachmentManager(container): void {
        const self = this;
        container.css("padding", "5px");
        $("<div >").appendTo(container).dxToolbar({
            items: [{
                location: "after",
                options: {
                    focusStateEnabled: false,
                    hoverStateEnabled: false,
                    icon: "icon icon-add",
                    onClick: () => {
                        self.fileElement.trigger("click");
                    },
                    type: "default"
                },
                toolbar: "top",
                widget: "dxButton",
            }],
        }).dxToolbar("instance");
        this.attachmentList = $("<div >").appendTo(container).dxList({
            activeStateEnabled: false,
            dataSource: {
                store: new CustomStore({
                    load: () => {
                        return new Promise<ResolvedData>((resolve) => {
                            resolve({
                                data: this.attachments,
                                totalCount: this.attachments.length
                            });
                        });
                    },
                })
            },
            focusStateEnabled: false,
            hoverStateEnabled: false,
            itemTemplate: (itemData, itemIndex, itemElement) => {
                const container = $("<div />").appendTo(itemElement).addClass("file-preview");
                const img = $("<img />").appendTo(container)
                    .addClass("file-preview-image")
                    .height(45)
                    .width(80);

                if (itemData.raw && itemData.raw.type.indexOf("image") >= 0) {
                    const reader = new FileReader();

                    reader.onload = function (e) {
                        img.attr("src", e.target?.result?.toString() || "");
                    };

                    reader.readAsDataURL(itemData.raw);
                }

                const infoContainer = $("<div />").appendTo(container).addClass("file-preview-info");
                $("<span>" + itemData.raw.name + "</span>").appendTo(infoContainer);
                $("<span>" + Math.round((itemData.raw.size / 1024)) + " Kb</span>").appendTo(infoContainer);

                const actionContainer = $("<div />").appendTo(container).addClass("file-preview-actions");
                $("<a href=\"javascript:;\"><i class=\"icon icon-close-circle\"></i></a>")
                    .appendTo(actionContainer)
                    .on("click", () => {
                        this.attachments = $.grep(this.attachments, (f) => {
                            return f.uid !== itemData.uid;
                        });
                        this.attachmentList.getDataSource().reload();
                        if (itemData.id && itemData.id > 0) {
                            this.deletedAttachments.push(itemData.store_file);
                        }
                    });
            }
        }).dxList("instance");
    }
    private initAttributesForm(container): void {
        const formContainer = $("<div id= \"masterViewInfoFormContainer\" />").appendTo(container);
        this.attributesForm = $("<div />").appendTo(formContainer)
            .dxForm({
                colCount: 2,
                formData: {},
                height: "100%",
                items: [],
                labelLocation: "top",
                onContentReady: (e) => {
                    e.element.css("padding", "10px");
                },
                onFieldDataChanged: () => {
                    this.editorDirty = true;
                },
                scrollingEnabled: false,
                showColonAfterLabel: true,
                width: "100%",
            }).dxForm("instance");

        formContainer.dxScrollView({
            height: "100%",
            showScrollbar: "always"
        });
    }
    private initGeometryGrid(container): void {
        const self = this;
        this.geometryGrid = $("<div />").appendTo(container).dxDataGrid({
            columns: [{
                dataField: "pidx",
                groupIndex: 0,
                visible: false
            }, {
                caption: "Kinh độ",
                dataField: "x",
                dataType: "number"
            }, {
                caption: "Vĩ độ",
                dataField: "y",
                dataType: "number"
            }, {
                caption: "Cao độ",
                dataField: "z",
                dataType: "number"
            }],
            dataSource: {
                store: new CustomStore({
                    insert: (values) => {
                        const $deferred = $.Deferred();
                        if (this.originalGeometry) {
                            const coordinates = this.originalGeometry.getCoordinates() ?? [];
                            if (this.originalGeometry instanceof Point || this.originalGeometry instanceof MultiPoint) {
                                // fix later
                            } else if (this.originalGeometry instanceof LineString) {
                                coordinates.push([values["x"], values["y"], values["z"]]);
                            } else if (this.originalGeometry instanceof MultiLineString) {
                                coordinates[0].push([values["x"], values["y"], values["z"]]);
                            } else if (this.originalGeometry instanceof Polygon) {
                                coordinates[0].splice(coordinates[0].length - 1, 0, [values["x"], values["y"], values["z"]]);
                            } else if (this.originalGeometry instanceof MultiPolygon) {
                                coordinates[0][0].splice(coordinates[0][0].length - 1, 0, [values["x"], values["y"], values["z"]]);
                            }
                            //
                            this.originalGeometry.setCoordinates(coordinates);
                            const coordinateConvert = this.convertCoordinates(this.originalGeometry, this.dataGeomProjection, OGMapProjection.getMapProjection());
                            this.cloneGeometry.setCoordinates(coordinateConvert);
                        }
                        //
                        $deferred.resolve();
                        //
                        return $deferred.promise();
                    },
                    key: ["pidx", "idx"],
                    load: () => {
                        let latlng: FlatCoordinate[] = [];

                        if (this.originalGeometry) {
                            if (this.originalGeometry instanceof Point || this.originalGeometry instanceof MultiPoint) {
                                const coord: Coordinate = this.originalGeometry.getCoordinates() as Coordinate;
                                latlng.push({
                                    idx: 0,
                                    x: coord[0],
                                    y: coord[1],
                                    z: coord[2]
                                });
                            } else if (this.originalGeometry instanceof LineString) {
                                this.originalGeometry.getCoordinates().forEach((items, ringIdx) => {
                                    latlng.push({
                                        idx: ringIdx,
                                        pidx: 0,
                                        x: items[0],
                                        y: items[1],
                                        z: items[2]
                                    });
                                });
                            } else if (this.originalGeometry instanceof MultiLineString) {
                                this.originalGeometry.getCoordinates().forEach((items, ringIdx) => {
                                    latlng = $.merge(latlng, items.map(
                                        (item, idx) => {
                                            return {
                                                idx: idx,
                                                pidx: ringIdx,
                                                x: item[0],
                                                y: item[1],
                                                z: item[2]
                                            };
                                        })
                                    );
                                });
                            } else if (this.originalGeometry instanceof Polygon) {
                                this.originalGeometry.getCoordinates().forEach((items, ringIdx) => {
                                    latlng = $.merge(latlng, items.map(
                                        (item, idx) => {
                                            return {
                                                idx: idx,
                                                pidx: ringIdx,
                                                x: item[0],
                                                y: item[1],
                                                z: item[2]
                                            };
                                        })
                                    );
                                });
                            } else if (this.originalGeometry instanceof MultiPolygon) {
                                this.originalGeometry.getCoordinates().forEach((pItems, ringIdx) => {
                                    pItems.forEach((items) => {
                                        latlng = $.merge(latlng, items.map(
                                            (item, idx) => {
                                                return {
                                                    idx: idx,
                                                    pidx: ringIdx,
                                                    x: item[0],
                                                    y: item[1],
                                                    z: item[2]
                                                };
                                            })
                                        );
                                    });
                                });
                            }
                        }
                        return latlng;
                    },
                    remove: (key) => {
                        const $deferred = $.Deferred();
                        if (key) {
                            if (this.originalGeometry) {
                                const coordinates = this.originalGeometry.getCoordinates();
                                if (coordinates) {
                                    if (this.originalGeometry instanceof Point || this.originalGeometry instanceof MultiPoint) {
                                        // fix later
                                    } else if (this.originalGeometry instanceof LineString) {
                                        if (key.idx < coordinates.length && coordinates[key.idx]) {
                                            coordinates.splice(key.idx, 1);
                                        }
                                    } else if (this.originalGeometry instanceof MultiLineString) {
                                        if (key.pidx < coordinates.length && coordinates[key.pidx]) {
                                            coordinates[key.pidx].splice(key.idx, 1);
                                        }
                                    } else if (this.originalGeometry instanceof Polygon) {
                                        if (key.pidx < coordinates.length && coordinates[key.pidx]) {
                                            coordinates[key.pidx].splice(key.idx, 1);
                                        }
                                    } else if (this.originalGeometry instanceof MultiPolygon) {
                                        if (key.pidx < coordinates.length && coordinates[key.pidx]) {
                                            coordinates[0][key.pidx].splice(key.idx, 1);
                                        }
                                    }
                                    this.originalGeometry.setCoordinates(coordinates);
                                    const coordinateConvert = this.convertCoordinates(this.originalGeometry, this.dataGeomProjection, OGMapProjection.getMapProjection());
                                    this.cloneGeometry.setCoordinates(coordinateConvert);
                                }
                            }
                        }
                        $deferred.resolve();
                        //
                        return $deferred.promise();
                    },
                    update: (key, values) => {
                        const $deferred = $.Deferred();
                        if (values) {
                            if (this.originalGeometry) {
                                const coordinates = this.originalGeometry.getCoordinates();
                                if (coordinates) {
                                    if (this.originalGeometry instanceof Point || this.originalGeometry instanceof MultiPoint) {
                                        coordinates[0] = values["x"];
                                        coordinates[1] = values["y"];
                                        coordinates[2] = values["z"];
                                    } else if (this.originalGeometry instanceof LineString) {
                                        if (key.idx < coordinates.length && coordinates[key.idx]) {
                                            coordinates[key.idx][0] = values["x"];
                                            coordinates[key.idx][1] = values["y"];
                                            coordinates[key.idx][2] = values["z"];
                                        }
                                    } else if (this.originalGeometry instanceof MultiLineString) {
                                        if (key.pidx < coordinates.length && coordinates[key.pidx]) {
                                            coordinates[key.pidx][key.idx][0] = values["x"];
                                            coordinates[key.pidx][key.idx][1] = values["y"];
                                            coordinates[key.pidx][key.idx][2] = values["z"];
                                        }
                                    } else if (this.originalGeometry instanceof Polygon) {
                                        //let rings = this.originalGeometry.getLinearRings();
                                        //let ring = this.originalGeometry.getLinearRing(key.pidx);
                                        if (key.pidx < coordinates.length && coordinates[key.pidx]) {
                                            coordinates[key.pidx][key.idx][0] = values["x"];
                                            coordinates[key.pidx][key.idx][1] = values["y"];
                                            coordinates[key.pidx][key.idx][2] = values["z"];
                                        }
                                        //ring.setCoordinates(coordinates);
                                        //rings[key.pidx] = ring;
                                        /*this.originalGeometry.setCoordinates(rings);*/
                                    } else if (this.originalGeometry instanceof MultiPolygon) {
                                        if (key.pidx < coordinates.length && coordinates[key.pidx]) {
                                            coordinates[0][key.pidx][key.idx][0] = values["x"];
                                            coordinates[0][key.pidx][key.idx][1] = values["y"];
                                            coordinates[0][key.pidx][key.idx][2] = values["z"];
                                        }
                                    }
                                    this.originalGeometry.setCoordinates(coordinates);
                                    const coordinateConvert = this.convertCoordinates(this.originalGeometry, this.dataGeomProjection, OGMapProjection.getMapProjection());
                                    this.cloneGeometry.setCoordinates(coordinateConvert);
                                }
                            }
                        }
                        $deferred.resolve();
                        //
                        return $deferred.promise();
                    },
                })
            },
            editing: {
                allowAdding: false,
                allowDeleting: true,
                allowUpdating: true,
                mode: "row",
            },
            errorRowEnabled: false,
            height: "100%",
            loadPanel: {
                text: "Đang cập nhật"
            },
            noDataText: "",
            onContentReady: () => {
                /*e.element.find('.dx-datagrid-header-panel > .dx-toolbar').css('padding', '5px').css('margin', '0');*/
            },
            onRowInserting: function () {
                // $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onRowRemoving: function () {
                /*$.extend(options.newData, $.extend({}, options.oldData, options.newData));*/
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            paging: {
                enabled: false,
                pageSize: 15
            },
            scrolling: {
                showScrollbar: "always"
            },
            selection: {
                mode: "single",
                showCheckBoxesMode: "none"
            },
            showBorders: false,
            toolbar: {
                items: [{
                    location: "before",
                    options: {
                        dataSource: [{
                            text: "WGS84",
                            value: "EPSG:4326"
                        }, {
                            text: "VN2000",
                            value: "EPSG:98362"
                        }],
                        displayExpr: "text",
                        onContentReady: (e) => {
                            this.geomProjectSelect = e.component;
                        },
                        onValueChanged(data) {
                            if (self.originalGeometry) {
                                self.dataGeomProjection = data.value;
                                const beforeProjection = OGMapProjection.getDataProjection();
                                self.oGMap.setDataProjection(self.dataGeomProjection);
                                const coordinates = self.convertCoordinates(self.originalGeometry, beforeProjection, self.dataGeomProjection);
                                self.originalGeometry.setCoordinates(coordinates);
                                self.geometryGrid.getDataSource().reload();
                            }
                        },
                        value: OGMapProjection.getDataProjection(),
                        valueExpr: "value",

                    },
                    widget: "dxSelectBox",
                }, {
                    location: "after",
                    options: {
                        focusStateEnabled: true,
                        hint: "Kiểm tra chất lượng",
                        hoverStateEnabled: true,
                        icon: "icon icon-tick-circle",
                        onClick: function () {
                            const geojson = OGMapUtils.writeGeoJSONGeometry(self.cloneGeometry);
                            axios.get("/api/feature/checkValid?geojson=" + geojson).then(xhr => {
                                if (xhr.data.status === EnumStatus.OK) {
                                    if (xhr.data.data === "True") {
                                        OGUtils.alert("Dữ liệu hợp lệ!");
                                    } else {
                                        OGUtils.error("Dữ liệu không hợp lệ!");
                                    }
                                } else {
                                    OGUtils.error(xhr.data.errors[0].message);
                                }
                            });
                        },
                        type: "success",
                    },
                    widget: "dxButton",
                }, {
                    location: "after",
                    options: {
                        focusStateEnabled: true,
                        hint: "Thêm tọa độ",
                        hoverStateEnabled: true,
                        icon: "icon icon-add",
                        onClick: () => {
                            this.geometryGrid.addRow();
                        },
                        type: "default",
                    },
                    widget: "dxButton",
                }, {
                    location: "after",
                    options: {
                        focusStateEnabled: true,
                        hoverStateEnabled: true,
                        icon: "icon icon-refresh",
                        onClick: () => {
                            this.geometryGrid.getDataSource().reload();
                        },
                        type: "normal",
                    },
                    widget: "dxButton",
                }]
            },
            width: "100%",
        }).dxDataGrid("instance");
    }

    public beginEdit(geometry, attributes: FeatureAttributes, oGISLayer?: OGLayerModel, oGISTable?: OGTableModel, files?: FeatureFile[]): void {
        const self = this;
        this.deletedAttachments = [];
        this.attachments = [];
        this.editorDirty = true;
        //
        this.layer = oGISLayer.layer;
        this.oGISLayer = oGISLayer;
        this.oGISLayerDomains = this.oGISLayer.domains;
        //
        this.oGISTable = oGISTable;
        //
        if (oGISLayer) {
            this.oGISTable = this.oGISLayer.table;
            if (geometry) {
                //Sử dụng 2 biến để khi chuyển đổi hệ tòa độ mà không làm thay đổi vị trí của đối tượng trên bản đồ
                this.originalGeometry = geometry.clone(); // Geometry sử dụng để hiển thị dữ liệu trên bảng, lưu dữ liệu
                this.cloneGeometry = geometry; //Geometry sử dụng để hiển thị trên bản đồ
                if (this.originalGeometry) {
                    //Chuyển đổi từ hệ tọa đồ WGS84 sang hệ tọa độ hiện tại
                    const coordinates = this.convertCoordinates(this.originalGeometry, OGMapProjection.getMapProjection(), OGMapProjection.getDataProjection());
                    this.originalGeometry.setCoordinates(coordinates);
                }
                this.originalGeometry.on("change", () => {
                    this.geometryGrid.getDataSource().reload();
                });
                this.geometryGrid.refresh(true);
            }
        } else {
            this.oGISTable = oGISTable;
        }

        this.originalAttributes = attributes;

        this.identityColumn = this.oGISLayer.table.identity_column;

        this.customValidateRules = [];
        //Define validation rules
        this.oGISLayer.table.columns.map(column => {
            if (column.less_col_id && column.visible) {
                const less_col = $.grep(this.oGISLayer.table.columns, less_col => {
                    return less_col.id === column.less_col_id;
                });
                if (less_col && less_col.length > 0) {
                    this.customValidateRules.push({
                        greater_col: column,
                        less_col: less_col[0],
                        type: column.data_type
                    });
                }
            }
        });
        let itemCount = 0;
        const formItems: dxFormItem[] = [];
        let normalItems: dxFormItem[] = [];
        const regionItems: dxFormItem[] = [];
        const timeItems: dxFormItem[] = [];
        // begin editor parse
        this.oGISLayer.table.columns.filter(column => {
            return column.column_name === "district_code" || column.column_name === "commune_code" || column.column_name === "province_code";
        }).forEach((column) => {
            if (column.column_name === "province_code") {
                regionItems.push({
                    colSpan: 2,
                    cssClass: "attribute-form-item",
                    dataField: column.column_name,
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
                        noDataText: "Không có dữ liệu",
                        onContentReady: () => {
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                if (this.offsetWidth < this.scrollWidth) {
                                    $ele.attr("title", $ele.text());
                                }
                            });
                        },
                        onInitialized: function (e) {
                            if (self.originalAttributes["province_code"]) {
                                e.component.option("value", self.originalAttributes["province_code"]);
                            }
                        },
                        onOpened: (e) => {
                            e.component._popup.option("height", e.component.getDataSource().totalCount().length > 6 ? 195 : "auto");
                        },
                        onValueChanged: () => {
                            const districtEditor = this.attributesForm.getEditor("district_code");
                            if (districtEditor && districtEditor instanceof dxSelectBox) {
                                districtEditor.getDataSource().reload();
                                districtEditor.repaint();
                            }
                        },

                        showClearButton: true,
                        valueExpr: "area_id"
                    },
                    editorType: "dxSelectBox",
                    label: {
                        text: column.name_vn,
                    }
                });
            } else if (column.column_name === "district_code") {
                regionItems.push({
                    cssClass: "attribute-form-item",
                    dataField: column.column_name,
                    editorOptions: {
                        dataSource: new DataSource({
                            key: "area_id",
                            store: new CustomStore({
                                load: () => {
                                    const deferred = $.Deferred();
                                    const province_code = this.attributesForm.option("formData").province_code;
                                    AreaService.districts(province_code).then(result => {
                                        if (result) {
                                            deferred.resolve(result);
                                        } else {
                                            deferred.resolve([]);
                                        }
                                    });
                                    return deferred.promise();
                                },
                                loadMode: "raw"
                            })
                        }),
                        deferRendering: false,
                        displayExpr: "name_vn",
                        noDataText: "Không có dữ liệu",
                        onContentReady: () => {
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                if (this.offsetWidth < this.scrollWidth) {
                                    $ele.attr("title", $ele.text());
                                }
                            });
                        },
                        onOpened: (e) => {
                            e.component._popup.option("resizeEnabled", true);
                            e.component._popup.option("height", e.component.getDataSource().totalCount().length > 6 ? 195 : "auto");
                        },
                        onValueChanged: () => {
                            const communeEditor = this.attributesForm.getEditor("commune_code");
                            if (communeEditor && communeEditor instanceof dxSelectBox) {
                                communeEditor.getDataSource().reload();
                                communeEditor.repaint();
                            }
                        },

                        showClearButton: true,
                        valueExpr: "area_id",
                    },
                    editorType: "dxSelectBox",
                    label: {
                        text: column.name_vn,
                    }
                });
            } else if (column.column_name === "commune_code") {
                regionItems.push({
                    cssClass: "attribute-form-item",
                    dataField: column.column_name,
                    editorOptions: {
                        dataSource: new DataSource({
                            key: "area_id",
                            store: new CustomStore({
                                load: () => {
                                    const deferred = $.Deferred();
                                    const district_code = this.attributesForm.option("formData").district_code;
                                    if (district_code) {
                                        AreaService.communes(district_code).then(result => {
                                            if (result) {
                                                deferred.resolve(result);
                                            } else {
                                                deferred.resolve([]);
                                            }
                                        });
                                    } else {
                                        deferred.resolve([]);
                                    }
                                    return deferred.promise();
                                },
                                loadMode: "raw"
                            })
                        }),
                        deferRendering: false,
                        displayExpr: "name_vn",
                        noDataText: "Không có dữ liệu",
                        onContentReady: () => {
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                if (this.offsetWidth < this.scrollWidth) {
                                    $ele.attr("title", $ele.text());
                                }
                            });
                        },
                        onOpened: (e) => {
                            e.component._popup.option("height", e.component.getDataSource().totalCount().length > 6 ? 195 : "auto");
                        },
                        showClearButton: true,
                        valueExpr: "area_id",
                    },
                    editorType: "dxSelectBox",
                    label: {
                        text: column.name_vn,
                    }
                });
            }
        });
        formItems.push({
            caption: "Hành chính",
            colCount: regionItems.length === 1 ? 1 : 2,
            colSpan: 2,
            cssClass: "region-form",
            itemType: "group",
            items: regionItems
        });
        // done region items
        this.oGISLayer.table.columns.filter(column => {
            return column.is_identity === false && column.visible && column.column_name !== "geom";
        }).forEach((column) => {
            if (column.column_name.indexOf("toado") === -1 && column.column_name.indexOf("toa_do") === -1) {
                normalItems = $.merge(normalItems, this._buildAttributeEditor(column));
                if (column.data_type === EnumDataType.string && column.character_max_length >= EnumCustom.charDefaultLength) {
                    if (itemCount % 2 === 0)
                        itemCount += 2;
                    else
                        itemCount += 1;
                } else {
                    itemCount++;
                }
            }
        });
        formItems.push({
            caption: "Thông tin lớp dữ liệu",
            colCount: 2,
            colSpan: 2,
            cssClass: "info-form",
            itemType: "group",
            items: normalItems
        });
        // done normal items
        this.oGISLayer.table.columns.filter(column => {
            return column.column_name === "created_at" || column.column_name === "updated_at";
        }).forEach((column) => {
            timeItems.push({
                cssClass: "attribute-form-item",
                dataField: column.column_name,
                editorOptions: {
                    placeholder: column.name_vn,
                    readOnly: true,
                },
                editorType: "dxTextBox",
                label: {
                    text: column.name_vn
                },
            });
        });
        formItems.push({
            caption: "Thời gian bản ghi trong hệ thống",
            colCount: 2,
            colSpan: 2,
            itemType: "group",
            items: timeItems,
            visible: false
        });
        // done time items
        // this.g_RelationDataPost = [];
        // let idx = 0;
        // if (this.oGISLayer.relations && this.oGISLayer.relations.length > 0) {
        //     this.oGISLayer.relations.forEach(relation => {
        //         this.g_RelationDataPost.push({
        //             column: relation.column.column_name + "_idx_" + idx,
        //             mediate_table: relation.mediate_table.table_name,
        //             relation_column: relation.relation_column.column_name,
        //             relation_table: relation.relation_table.table_name
        //         });
        //         idx++;
        //         if (relation.extra_fields && relation.extra_fields.length > 0) {
        //             const items = [];
        //             relation.relation_data.items.forEach(item => {
        //                 const exItem = {
        //                     colCount: 2,
        //                     itemType: "group",
        //                     items: [{
        //                         colCount: 1,
        //                         cssClass: "attribute-form-item",
        //                         editorOptions: {
        //                             onValueChanged: (e) => {
        //                                 relation.extra_fields.forEach(field => {
        //                                     const editor = this.attributesForm.getEditor(relation.mediate_table.table_name + "_" + item.id + "." + field.column_name);
        //                                     if (editor) {
        //                                         editor.option("disabled", e.value === false);
        //                                         editor.reset();
        //                                     }
        //                                 });
        //                                 if (e.value === false) {
        //                                     const data = this.attributesForm.option("formData");
        //                                     delete data[relation.mediate_table.table_name + "_" + item.id];
        //                                     this.attributesForm.option("formData", data);
        //                                 }
        //                             }
        //                         },
        //                         editorType: "dxCheckBox",
        //                         label: {
        //                             location: "right",
        //                             text: item.text,
        //                         },
        //                         name: relation.mediate_table.table_name + "_check"
        //                     }],
        //                     name: relation.mediate_table.table_name
        //                 };
        //                 relation.extra_fields.forEach(field => {
        //                     exItem.items = $.merge(exItem.items, this._buildAttributeEditor(field, relation.mediate_table.table_name + "_" + item.id + "." + field.column_name, false, true));
        //                 });
        //                 items.push(exItem);
        //             });
        //             if (items.length > 0) {
        //                 formItems.push({
        //                     caption: relation.relation_column.name_vn,
        //                     colSpan: 2,
        //                     itemType: "group",
        //                     items: items
        //                 });
        //             }
        //         } else {
        //             formItems.push({
        //                 colSpan: 2,
        //                 cssClass: "attribute-form-item",
        //                 dataField: relation.mediate_table.table_name,
        //                 editorOptions: {
        //                     displayExpr: "text",
        //                     items: (relation.relation_data && relation.relation_data.items) ? relation.relation_data.items : [],
        //                     maxDisplayedTags: 3,
        //                     multiline: false,
        //                     noDataText: "Không có dữ liệu",
        //                     onMultiTagPreparing: (args) => {
        //                         const selectedItemsLength = args.selectedItems.length,
        //                             totalCount = 3;

        //                         if (selectedItemsLength < totalCount) {
        //                             // args.cancel = true;
        //                         } else {
        //                             args.text = "[" + selectedItemsLength + "] lựa chọn";
        //                         }
        //                     },
        //                     
        //                     showDropDownButton: true,
        //                     valueExpr: "id",
        //                 },
        //                 editorType: "dxTagBox",
        //                 label: {
        //                     text: relation.relation_column ? relation.relation_column.name_vn : "TextField"
        //                 }
        //             });
        //         }
        //     });
        // }
        // this.attributesForm.relationDataPost = relationDataPost;
        this.attributesForm.beginUpdate();
        this.attributesForm.option("formData", attributes);
        this.attributesForm.option("items", formItems);
        this.attributesForm.endUpdate();
        //
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const featureId = this.identityColumn ? this.originalAttributes[this.identityColumn.column_name] : -1;
                // let url = "/api/files/feature/" + oGISLayer.id + "/" + featureId + "/" + file.store_file_name;
                fetch(file.url.toString()).then(response => {
                    response.blob().then(data => {
                        this.attachments.push({
                            extension: file.extension,
                            feature_id: featureId,
                            id: file.id,
                            image_name: file.file_name,
                            layer_id: oGISLayer.id,
                            mime_type: file.mime_type,
                            raw: new File([data], file.file_name, {
                                type: file.mime_type
                            }),
                            size: file.size,
                            uid: OGUtils.uuidv4()
                        });
                        //
                        this.attachmentList.getDataSource().reload();
                    });
                });
            }
        }
        else {
            this.attachmentList.getDataSource().reload();
        }
        //
    }

    //Summary :
    //    Chuyển đổi tọa độ từ hệ tọa độ cũ sang mới
    //Parameters:
    //    geometry: 
    //    beforeProjection: hệ tọa độ cũ
    //Returns : 
    //    afterProjection: hệ tọa độ mới
    endEdit(): void {
        this.attributesForm.option("formData", {});
        this.attributesForm.option("items", []);
        this.attributesForm.endUpdate();
        //
        this.editEmitter.emit("endEdit");
        this.editorDirty = false;
        this.attachments = [];
        this.attachmentList.getDataSource().reload();
        this.attributesEditorPopup.hide();
    }

    hide(): void {
        this.attributesEditorPopup.hide();
    }

    onInit(): void {
        const self = this;
        this.dataGeomProjection = OGMapProjection.getDataProjection();
        this.attachments = [];
        this.deletedAttachments = [];

        const container = $("<div id=\"masterViewInfoPopupContainer\"/>").appendTo("body");

        this.attributesEditorPopup = container.dxPopup({
            contentTemplate: function (container) {
                container.css("padding", "0");
                this.infoTab = $("<div />").appendTo(container).dxTabPanel({
                    animationEnabled: false,
                    deferRendering: false,
                    height: "100%",
                    itemTemplate: (itemData, itemIndex, itemElement) => {
                        if (itemData.id === "Info") {
                            self.initAttributesForm(itemElement);
                        } else if (itemData.id == "Geometry") {
                            self.initGeometryGrid(itemElement);
                        } else {
                            self.initAttachmentManager(itemElement);
                        }
                    },
                    itemTitleTemplate: (itemData) => {
                        return itemData.text;
                    },
                    items: [{
                        id: "Info",
                        text: "Thông tin chung"
                    }, {
                        id: "Geometry",
                        text: "Hình học"
                    }, {
                        id: "File",
                        text: "Tệp đính kèm"
                    }],
                    loop: false,
                    selectedIndex: 0,
                    swipeEnabled: false,
                }).dxTabPanel("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: 600,
            hideOnOutsideClick: false,
            resizeEnabled: true,
            shading: false,
            showCloseButton: true,
            showTitle: true,
            title: "Biên tập dữ liệu",
            toolbarItems: [{
                location: "center",
                options: {
                    onClick: () => {
                        if (this.validate()) {
                            this.save();
                        }
                    },
                    text: "Lưu dữ liệu",
                    type: "default"
                },
                toolbar: "bottom",
                widget: "dxButton"
            }, {
                location: "center",
                options: {
                    onClick: () => {
                        if (this.isDirty) {
                            OGUtils.confirm("Mọi thông tin cập nhật sẽ mất, bạn có muốn hủy thao tác này không?", "Xác nhận").then((value) => {
                                if (value) {
                                    this.endEdit();
                                }
                            });
                        } else {
                            this.endEdit();
                        }
                    },
                    text: "Hủy bỏ",
                    type: "danger"
                },
                toolbar: "bottom",
                widget: "dxButton"
            }],
            width: 500,
        }).dxPopup("instance");
        this.fileElement = $("<input type=\"file\" accept=\"image/*\" style=\"display:none !important\" />")
            .appendTo(container)
            .on("change", (e) => {
                for (let i = 0; i < e.target["files"].length; i++) {
                    const file = e.target["files"][i];
                    this.attachments.push({
                        extension: file.name.substring(file.name.lastIndexOf(".")),
                        feature_id: this.identityColumn ? this.originalAttributes[this.identityColumn.column_name] : -1,
                        image_name: file.name,
                        layer_id: this.oGISLayer.id,
                        mime_type: file.type,
                        raw: file,
                        size: file.size,
                        uid: OGUtils.uuidv4()
                    });
                }
                this.attachmentList.getDataSource().reload();
            });
    }

    save(): void {
        const attributes = this.attributesForm.option("formData");
        let geojson;
        if (this.cloneGeometry) {
            geojson = OGMapUtils.writeGeoJSONGeometry(this.cloneGeometry);
        }
        // let data = new FormData();
        // $.each(attributes, (key, value) => {
        //     if (!key.includes('geom') && !key.includes("relation")) {
        //         let _value = value;
        //         if (this.attributesForm.getEditor(key)) {
        //             _value = this.attributesForm.getEditor(key).option('value');
        //         }
        //         data.append(`attributes[${key}]`, _value);
        //     }
        // });
        // $.each(this.g_RelationDataPost, (key, value) => {
        //     data.append(`relations_column[${value.column}]`, value.relation_column);
        //     data.append(`relations_table[${value.mediate_table}]`, value.relation_table);
        // });
        // $.each(this.attachments, (idx, item) => {
        //     $.each(item, (key, value) => {
        //         data.append('images[' + idx + '][' + key + ']', value);
        //     });
        // });
        // data.append('layer_id', this.oGISLayer.id);
        // data.append('geom', geojson);
        OGUtils.showLoading();
        //
        const id = this.identityColumn ? attributes[this.identityColumn.column_name] : -1;

        $.ajax({
            contentType: "application/json",
            data: JSON.stringify({
                attributes: attributes,
                geom: geojson,
                layer_id: this.oGISLayer.id
            }),
            type: "POST",
            url: id > 0 ? "/api/feature/update" : "/api/feature/add",
        }).done(response => {
            if (response.status === EnumStatus.OK) {
                const id = response.data;
                const def = $.Deferred();
                def.then(() => {
                    OGUtils.hideLoading();
                    //
                    if (this.deletedAttachments && this.deletedAttachments.length > 0) {
                        $.ajax("/api/feature/deleteFiles", {
                            contentType: "application/json",
                            data: JSON.stringify(this.deletedAttachments),
                            type: "post"
                        });
                    }
                    //
                    if (this.layer instanceof AnimatedCluster) {
                        const animatedSource = this.layer.getSource();
                        if (animatedSource && animatedSource instanceof VectorSource) {
                            animatedSource.clear();
                            animatedSource.refresh();
                        }
                    } else {
                        const source = this.layer.getSource();
                        if (source && source instanceof VectorSource) {
                            source.clear();
                            source.refresh();
                        }
                    }
                    OGUtils.toastSuccess("Lưu thành công !", "Thông báo");
                    this.geomProjectSelect.option("value", "WGS84");
                    //
                    this.endEdit();
                });
                //
                if (this.attachments && this.attachments.length > 0) {
                    const fileData = new FormData();
                    fileData.append("layer_id", this.oGISLayer.id.toString());
                    fileData.append("feature_id", id);
                    //
                    $.each(this.attachments, (idx, item) => {
                        if (!item.id || !item.store_file) {
                            fileData.append("files", item.raw);
                        }
                    });
                    //
                    if (fileData.get("files")) {
                        const xhr = new XMLHttpRequest();
                        xhr.open("POST", "/api/feature/upload", true);
                        xhr.responseType = "json";
                        // xhr.setRequestHeader('Content-Type', 'multipart/form-data');
                        xhr.onload = function () {

                        };
                        xhr.onloadend = () => {
                            def.resolve();
                        };
                        xhr.send(fileData);
                    } else {
                        def.resolve();
                    }
                } else {
                    def.resolve();
                }
            } else {
                OGUtils.alert("Lưu thông tin thất bại! Mã lỗi: " + ((response.errors && response.errors.length > 0) ? `(${response.errors[0].code}) ${response.errors[0].message}` : "Không xác định"), "Thông báo");
            }
        });
    }

    show(): void {
        this.attributesEditorPopup.show();
    }

    public validate(): boolean {
        const validate: ValidationResult = this.attributesForm.validate();
        if (validate && validate.brokenRules && validate.brokenRules?.length > 0) {
            // validate.brokenRules[0].validator.focus();
            return false;
        }
        //
        this.customValidateRules.forEach((rule) => {
            const less_editor = this.attributesForm.getEditor(rule.less_col.column_name);
            const greater_editor = this.attributesForm.getEditor(rule.greater_col.column_name);
            if (less_editor && greater_editor) {
                if ((less_editor.option("value") && !greater_editor.option("value"))
                    || !(less_editor.option("value") && greater_editor.option("value"))) {
                    OGUtils.alert(`Giá trị "${rule.less_col.name_vn}" và "${rule.greater_col.name_vn}" không rõ ràng`, "Thông báo");
                    return false;
                } else {
                    if (rule.type === EnumDataType.date || rule.type === EnumDataType.dateTime || rule.type === EnumDataType.dateTimeTZ) {
                        const less_date = new Date(less_editor.option("value"));
                        const greater_date = new Date(greater_editor.option("value"));
                        if (less_date.getTime() > greater_date.getTime()) {
                            OGUtils.alert(`Thời gian "${rule.less_col.name_vn}" phải trước "${rule.greater_col.name_vn}"`, "Thông báo");
                            return false;
                        }
                    }
                }
            }
        });
        //
        return true;
    }

    public get isDirty(): boolean {
        return this.editorDirty;
    }
}

export { AttributesEditorComponent };