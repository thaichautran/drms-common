import { OGMap, OGMapUtils } from "@opengis/map";
import axios from "axios";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import dxForm from "devextreme/ui/form";
import dxMultiView from "devextreme/ui/multi_view";
import dxPopup from "devextreme/ui/popup";
import dxSelectBox from "devextreme/ui/select_box";
import dxTreeView from "devextreme/ui/tree_view";

import { IBaseComponent } from "../../../../../../../../libs/core/components/base-component.abstract";
import { LayerClassifyComponent } from "../../../../../../../../libs/core/components/layer/layer-classify/layer-classify.component";
import { LayerFieldComponent } from "../../../../../../../../libs/core/components/layer/layer-field/layer-field.component";
import { LayerIndexComponent } from "../../../../../../../../libs/core/components/layer/layer-index/layer-index.component";
import { StyleEditorComponent } from "../../../../../../../../libs/core/components/style-editor/style-editor.component";
import { EnumGeometry, EnumStatus } from "../../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../../libs/core/helpers/utils";
import { OGLayerClassifyModel, OGLayerModel } from "../../../../../../../../libs/core/models/layer.model";
import { OGMapModel } from "../../../../../../../../libs/core/models/map.model";
import { OGTableColumnModel } from "../../../../../../../../libs/core/models/table.model";
import { LayerService } from "../../../../../../../../libs/core/services/layer.service";
import { MapService } from "../../../../../../../../libs/core/services/map.service";


class MapLayerView implements IBaseComponent {
    container: JQuery<HTMLElement>;
    layerClassifyFieldSelectBox: dxSelectBox;
    layerClassifyGrid: dxDataGrid;
    layerClassifyGridComponent: LayerClassifyComponent;
    layerClassifyStore: CustomStore<OGLayerClassifyModel, number>;
    layerFieldComponent: LayerFieldComponent;
    layerFieldStore: CustomStore<OGTableColumnModel, number>;
    layerForm: dxForm;
    layerGrid: dxDataGrid;
    layerGroupID: number;
    layerGroupSelectBox: dxSelectBox;
    layerIndexComponent: LayerIndexComponent;
    layerIndexesGrid: dxDataGrid;
    layerIndexesStore: CustomStore;
    layerPopup: dxPopup;
    layerStore: CustomStore<OGLayerModel, number>;
    layerViews: dxMultiView;
    mapId: number;
    mapInfo: OGMapModel;
    mapLayerPopup: dxPopup;
    mapLayerTree: dxTreeView;
    mapViews: dxMultiView;
    oGMap: OGMap;
    selectedLayerInfo: OGLayerModel;
    styleEditor: StyleEditorComponent;

    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.initLayout();
    }
    private initLayerGrid(container): void {
        this.layerGrid = $("<div />").appendTo(container).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnChooser: {
                enabled: true,
                mode: "select"
            },
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.layerGrid.pageIndex();
                    const pageSize = this.layerGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                visible: true,
                width: 50,
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Biểu tượng",
                cellTemplate: (container, options) => {
                    if (options.value) {
                        OGMapUtils.geoStylerStyleToCanvas(JSON.parse(options.value), 36, $("<canvas />").appendTo($("<center />").appendTo(container)).get(0) as HTMLCanvasElement);
                    }
                },
                dataField: "styles",
                width: "120px"
            }, {
                caption: "Hiển thị?",
                dataField: "is_visible",
                width: "80px",
            }, {
                caption: "Tên lớp",
                dataField: "name_vn",
            }, {
                caption: "Hình dạng",
                dataField: "geometry",
                groupIndex: 1,
                lookup: {
                    dataSource: {
                        store: new ArrayStore({
                            data: [{
                                geometry: EnumGeometry.Point,
                                text: "Điểm"
                            }, {
                                geometry: EnumGeometry.MultiPoint,
                                text: "Đa điểm"
                            }, {
                                geometry: EnumGeometry.LineString,
                                text: "Đường"
                            }, {
                                geometry: EnumGeometry.MultiLineString,
                                text: "Đa đường"
                            }, {
                                geometry: EnumGeometry.Polygon,
                                text: "Vùng"
                            }, {
                                geometry: EnumGeometry.MultiPolygon,
                                text: "Đa vùng"
                            }],
                            key: "geometry"
                        })
                    },
                    displayExpr: "text",
                    valueExpr: "geometry",
                },
                width: "100px"
            }, {
                caption: "Nhóm lớp dữ liệu",
                dataField: "layer_group.name_vn",
                groupCellTemplate: (cellElement, cellInfo) => {
                    cellElement.html(cellInfo.text ? "Nhóm lớp dữ liệu: " + cellInfo.text : "Chưa thuộc nhóm nào");
                },
                groupIndex: 0
            }, {
                caption: "Nhóm lớp dữ liệu",
                dataField: "layer_group_id",
                lookup: {
                    allowClearing: true,
                    dataSource: {
                        store: new CustomStore({
                            byKey: (key) => {
                                const deferred = $.Deferred();
                                if (key) {
                                    axios.get("/api/layer/group/" + key.toString()).then(xhr => {
                                        if (xhr.data && xhr.data.status === EnumStatus.OK) {
                                            deferred.resolve(xhr.data.data);
                                        }
                                        deferred.resolve({});
                                    });
                                } else {
                                    deferred.resolve({});
                                }
                                return deferred;
                            },
                            key: "id",
                            load: (loadOptions) => {
                                const deferred = $.Deferred(),
                                    args: { [key: string]: number | string } = {};

                                if (loadOptions.sort) {
                                    args.orderby = loadOptions.sort[0].selector;
                                    if (loadOptions.sort[0].desc)
                                        args.orderby += " desc";
                                }

                                args.skip = loadOptions.skip ? loadOptions.skip : 0;
                                args.take = loadOptions.take ? loadOptions.take : 99999;

                                axios({
                                    headers: {
                                        "Content-Type": "application/x-www-form-urlencoded"
                                    },
                                    method: "GET",
                                    url: "/api/layer/groups"
                                }).then(result => {
                                    if (result.data.status === EnumStatus.OK && result.data.data && result.data.data.length > 0) {
                                        deferred.resolve(result.data.data);
                                    } else {
                                        deferred.resolve({});
                                    }
                                });
                                return deferred.promise();
                            },
                            loadMode: "raw"
                        }),
                    },
                    displayExpr: "name_vn",
                    valueExpr: "id",
                },
                visible: false
            }, {
                caption: "Trường classify",
                dataField: "classify_column_id",
                lookup: {
                    allowClearing: true,
                    dataSource: {
                        store: this.layerFieldStore,
                    },
                    displayExpr: "name_vn",
                    valueExpr: "id",
                },
                visible: false
            }, {
                caption: "Trường hiển thị tên",
                cellTemplate: (cellElement, cellInfo) => {
                    cellElement.html(cellInfo.data.label_column ? cellInfo.data.label_column.name_vn : "");
                },
                dataField: "label_column_id",
                lookup: {
                    allowClearing: true,
                    dataSource: {
                        store: this.layerFieldStore,
                    },
                    displayExpr: "name_vn",
                    valueExpr: "id",
                },
                width: 150
            }, {
                alignment: "center",
                caption: "Thứ tự",
                dataField: "order",
                width: 80,
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                hint: "Chỉnh sửa",
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    this.selectedLayerInfo = options.data;
                                    this.layerGrid.editRow(options.rowIndex);
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                hint: "Xóa lớp dữ liệu khỏi bản đồ",
                                icon: "icon icon-trash",
                                onClick: () => {
                                    OGUtils.confirm("Xác nhận muốn lớp dữ liệu này khỏi bản đồ?").then(value => {
                                        if (value) {
                                            options.component.getDataSource().store().remove(options.data.id).then(() => {
                                                options.component.getDataSource().reload();
                                            });
                                        }
                                    });
                                },
                                type: "danger"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                dropDownOptions: {
                                    width: "150px"
                                },
                                icon: "icon icon-setting-2",
                                items: [{
                                    onClick: () => {
                                        this.selectedLayerInfo = options.data;
                                        this.styleEditor.for(options.data).show();
                                    },
                                    text: "Biểu tượng",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        this.selectedLayerInfo = options.data;
                                        this.layerFieldComponent.for(this.selectedLayerInfo).refresh();
                                        this.layerViews.option("selectedIndex", 1);
                                    },
                                    text: "Trường thông tin",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        this.selectedLayerInfo = options.data;
                                        this.layerClassifyGridComponent.for(this.selectedLayerInfo).refresh();
                                        this.layerViews.option("selectedIndex", 2);
                                    },
                                    text: "Classify",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        this.selectedLayerInfo = options.data;
                                        this.layerIndexComponent.for(this.selectedLayerInfo).refresh();
                                        this.layerViews.option("selectedIndex", 3);
                                    },
                                    text: "Chỉ mục",
                                    type: "default"
                                }],
                                onContentReady: (e) => {
                                    e.element.find(".dx-list-item").each(function () {
                                        const $ele = $(this);
                                        $ele.attr("title", $ele.find(".dx-list-item-content").text());
                                    });
                                },
                                stylingMode: "contained",
                                text: "Thao tác",
                                type: "default"
                            },
                            widget: "dxDropDownButton"
                        }]
                    });
                },
                width: 250,
            }],
            dataSource: {
                store: this.layerStore
            },
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        dataField: "name_vn"
                    }, {
                        dataField: "layer_group_id",
                    }, {
                        dataField: "label_column_id",
                    }, {
                        dataField: "classify_column_id",
                    }, {
                        dataField: "order",
                    }, {
                        dataField: "is_visible",
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin lớp",
                    width: "auto"
                },
                texts: {
                    cancelRowChanges: "Hủy",
                    saveRowChanges: "Lưu",
                },
                useIcons: false
            },
            errorRowEnabled: false,
            filterRow: {
                visible: true,
            },
            groupPanel: {
                visible: true,
            },
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            onEditorPreparing: (e) => {
                if (e.row) {
                    this.selectedLayerInfo = e.row.data;
                }
                //
                // if (e.parentType == "dataRow") {
                //     if (e.dataField === "geom") {
                //         e.editorOptions.disabled = !e.row.inserted;
                //     }
                // }
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                e.toolbarOptions.items.unshift({
                    location: "before",
                    options: {
                        hint: "Quay lại",
                        icon: "icon icon-arrow-left",
                        onClick: () => {
                            this.mapViews.option("selectedIndex", 0);
                        },
                        type: "danger"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        onClick: () => {
                            this.mapLayerTree.beginUpdate();
                            this.mapLayerTree.option("dataSource.store",
                                new CustomStore({
                                    key: "id",
                                    load: () => {
                                        return new Promise((resolve) => {
                                            MapService.getLayerTree(this.mapId).then(result => {
                                                if (result.status == EnumStatus.OK) {
                                                    resolve(result);
                                                } else {
                                                    resolve({
                                                        data: [],
                                                        totalCount: 0
                                                    });
                                                }
                                            });
                                        });
                                    }
                                })
                            );
                            this.mapLayerTree.endUpdate();
                            this.mapLayerTree["mapId"] = this.mapId;

                            this.mapLayerPopup.show();
                        },
                        text: "Thêm lớp dữ liệu",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            this.layerGrid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                });
            },
            pager: {
                allowedPageSizes: [50, 100, 200],
                infoText: "{2} bản ghi",
                showInfo: true,
                showNavigationButtons: false,
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
                grouping: false,
                paging: true,
            },
            scrolling: {
                showScrollbar: "always"
            },
            searchPanel: {
                visible: true
            },
            selection: {
                mode: "single"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",
            wordWrapEnabled: true,
        }).dxDataGrid("instance");

        this.mapLayerPopup = $("<div />").addClass("role-popup").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                this.initLayerTree(container);
            },
            deferRendering: false,
            dragEnabled: false,
            height: 500,
            hideOnOutsideClick: false,
            resizeEnabled: false,
            shading: true,
            showTitle: true,
            title: "Lớp dữ liệu",
            toolbarItems: [{
                location: "center",
                options: {
                    onClick: () => {
                        this.mapInfo = {
                            id: this.mapId,
                            mapBaseLayers: [],
                            mapLayers: [],
                        };
                        $.each(this.mapLayerTree.getDataSource().items(), (idx, item) => {
                            if (item.items) {
                                $.each(item.items, (childIdx, child) => {
                                    if (child.selected && child.raw) {
                                        this.mapInfo.mapLayers.push({
                                            layer_id: child.raw.id
                                        });
                                    }
                                });
                            }
                        });

                        axios({
                            data: this.mapInfo,
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            method: "POST",
                            url: "/api/map/layer/save",
                        }).then(response => {
                            if (response.data.status === EnumStatus.OK) {
                                OGUtils.alert("Lưu dữ liệu thành công!");
                                this.mapLayerPopup.hide();
                                this.layerGrid.getDataSource().reload();
                            }
                        });
                    },
                    text: "Lưu thiết lập",
                    type: "default"
                },
                toolbar: "bottom",
                widget: "dxButton",
            }, {
                location: "center",
                options: {
                    onClick: () => {
                        this.mapLayerPopup.hide();
                    },
                    text: "Huỷ",
                    type: "danger"
                },
                toolbar: "bottom",
                widget: "dxButton"
            }],
            width: 400
        }).dxPopup("instance");
    }

    private initLayerTree(container): void {
        container = container.css("padding", "10px");
        //
        this.mapLayerTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
    }

    private initLayerViews(): void {
        this.layerViews = $("<div />").appendTo(this.container).dxMultiView({
            deferRendering: false,
            height: "100%",
            items: [{
                template: (data, index, element) => {
                    this.initLayerGrid(element);
                }
            }, {
                template: (data, index, element) => {
                    this.layerFieldComponent = new LayerFieldComponent(element);
                }
            }, {
                template: (data, index, element) => {
                    this.layerClassifyGridComponent = new LayerClassifyComponent(element);
                }
            }, {
                template: (data, index, element) => {
                    this.layerIndexComponent = new LayerIndexComponent(element);
                }
            }],
            swipeEnabled: false
        }).dxMultiView("instance");
        this.layerFieldComponent.addLayerView(this.layerViews);
        this.layerClassifyGridComponent.addLayerView(this.layerViews);
        this.layerIndexComponent.addLayerView(this.layerViews);
        this.layerViews.element().find(".dx-multiview-wrapper").css("border", "none");
    }

    private initLayout(): void {
        this.layerStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                if (key) {
                    $.get("/api/layer/get-fields?id=" + key).done(xhr => {
                        if (xhr && xhr.status === EnumStatus.OK) {
                            deferred.resolve(xhr.data);
                        }
                        deferred.resolve({});
                    });
                } else {
                    deferred.resolve({});
                }
                return deferred;
            },
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred(),
                    args: { [key: string]: number | string } = {};

                if (loadOptions.sort) {
                    args.orderby = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        args.orderby += " desc";
                }
                args.skip = loadOptions.skip ? loadOptions.skip : 0;
                args.take = loadOptions.take ? loadOptions.take : 50;
                args.mapId = this.mapId;
                if (loadOptions.filter && loadOptions.filter.length) {
                    args.keyword = loadOptions.filter[0].filterValue ?? loadOptions.filter.filterValue;
                }
                if (this.mapId) {
                    MapService.getLayers(this.mapId, args).then(result => {
                        if (result) {
                            deferred.resolve({
                                data: result.data,
                                totalCount: result.recordsTotal
                            });
                        } else {
                            deferred.resolve({
                                data: [],
                                totalCount: 0
                            });
                        }
                    });
                } else {
                    deferred.resolve({
                        data: [],
                        totalCount: 0
                    });
                }
                return deferred.promise();
            },
            remove: (key) => {
                return MapService.deleteLayer({ layer_id: key, map_id: this.mapId });
            },
            update: (key, values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            this.layerGrid.getDataSource().reload();
                            OGUtils.alert("Lưu lớp dữ liệu thành công");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
                        }
                    },
                    type: "POST",
                    url: "/api/layer/saveOrUpdate",
                });
            },
        });
        this.layerFieldStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                if (key) {
                    $.get("/api/table/column/" + key.toString()).done(xhr => {
                        if (xhr && xhr.status === EnumStatus.OK) {
                            deferred.resolve(xhr.data);
                        }
                        deferred.resolve({});
                    });
                } else {
                    deferred.resolve({});
                }
                return deferred;
            },
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred(),
                    args: { [key: string]: number | string } = {};
                if (loadOptions.sort) {
                    args.orderby = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        args.orderby += " desc";
                }
                args.skip = loadOptions.skip ? loadOptions.skip : 0;
                args.take = loadOptions.take ? loadOptions.take : 99999;

                if (this.selectedLayerInfo && this.selectedLayerInfo.id) {
                    const keyword = loadOptions.searchValue ? loadOptions.searchValue : "";
                    LayerService.getFields(this.selectedLayerInfo.id, keyword).then(result => {
                        if (result) {
                            deferred.resolve({
                                data: result,
                                totalCount: result.length
                            });
                        } else {
                            deferred.resolve({
                                data: [],
                                totalCount: 0
                            });
                        }
                    });
                } else {
                    deferred.resolve({
                        data: [],
                        totalCount: 0
                    });
                }
                return deferred.promise();
            },
        });
        this.styleEditor = new StyleEditorComponent();
        this.initLayerViews();
    }

    public addMapView(mapViews: dxMultiView): void {
        this.mapViews = mapViews;
    }

    onInit(): void {

    }

    public reload(mapId: number): void {
        this.mapId = mapId;
        if (this.layerGrid) {
            this.layerGrid.getDataSource().reload();
        }
    }
}

export { MapLayerView };
