import { OGMap, OGMapUtils } from "@opengis/map";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxDataGrid from "devextreme/ui/data_grid";
import dxMultiView from "devextreme/ui/multi_view";
import dxSelectBox from "devextreme/ui/select_box";

import { EnumGeometry, EnumStatus } from "../../../enums/enums";
import { OGUtils } from "../../../helpers/utils";
import { OGLayerClassifyModel, OGLayerModel } from "../../../models/layer.model";
import { OGTableColumnModel } from "../../../models/table.model";
import { IMapComponent } from "../../base-component.abstract";
import { StyleEditorComponent } from "../../style-editor/style-editor.component";

class LayerClassifyComponent implements IMapComponent {
    private layerFieldGrid: dxDataGrid;
    container: HTMLElement;
    layerClassifyFieldSelectBox: dxSelectBox;
    layerClassifyGrid: dxDataGrid;
    layerClassifyStore: CustomStore<OGLayerClassifyModel, number>;
    layerFieldStore: CustomStore<OGTableColumnModel, number>;
    layerViews: dxMultiView;
    oGMap: OGMap;
    selectedLayerInfo: OGLayerModel;
    styleEditor: StyleEditorComponent;
    constructor(container: HTMLElement) {
        this.container = container;
        this.onInit();
    }

    private initLayout(container): void {
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
            insert: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            // this.layerFieldGrid.getDataSource().reload();
                        }
                        else {
                            if (xhr.errors && xhr.errors.length > 0) {
                                OGUtils.alert(xhr.errors[0].message || "Cập nhật trường dữ liệu thất bại!");
                            } else {
                                OGUtils.alert("Cập nhật trường dữ liệu thất bại!");
                            }
                        }
                    },
                    type: "POST",
                    url: "/api/table/" + this.selectedLayerInfo.table_info_id + "/columns/add",
                });
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
                //
                if (this.selectedLayerInfo && this.selectedLayerInfo.id) {
                    $.ajax({
                        data: {
                            id: this.selectedLayerInfo.id,
                            keyword: loadOptions.searchValue ? loadOptions.searchValue : ""
                        },
                        error: () => {
                            deferred.reject("Data Loading Error");
                        },
                        success: (xhr) => {
                            if (xhr && xhr.status === EnumStatus.OK) {
                                deferred.resolve({
                                    data: xhr.data,
                                    totalCount: xhr.data.length
                                });
                            } else {
                                deferred.resolve({
                                    data: [], 
                                    totalCount: 0
                                });
                            }
                        },
                        type: "get",
                        url: "/api/layer/get-fields",
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
                return $.ajax({
                    data: { id: key },
                    type: "POST",
                    url: "/api/table/" + this.selectedLayerInfo.table_info_id + "/columns/delete",
                });
            },
            update: (key, values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            // this.layerFieldGrid.getDataSource().reload();
                        }
                        else {
                            if (xhr.errors && xhr.errors.length > 0) {
                                OGUtils.alert(xhr.errors[0].message || "Cập nhật trường dữ liệu thất bại!");
                            } else {
                                OGUtils.alert("Cập nhật trường dữ liệu thất bại!");
                            }
                        }
                    },
                    type: "post",
                    url: "/api/table/" + values.table_id + "/columns/update",
                });
            },
        });
        this.layerClassifyStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                if (key) {
                    $.get("/api/layer/classify/" + key.toString()).done(xhr => {
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
            insert: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            this.layerClassifyGrid.getDataSource().reload();
                        }
                        else {
                            if (xhr.errors && xhr.errors.length > 0) {
                                OGUtils.alert(xhr.errors[0].message || "Thêm classify thất bại!");
                            } else {
                                OGUtils.alert("Thêm classify thất bại!");
                            }
                        }
                    },
                    type: "post",
                    url: "/api/layer/" + this.selectedLayerInfo.id + "/filterClassifyValue",
                });
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
                args.take = loadOptions.take ? loadOptions.take : 15;
                
                if (this.selectedLayerInfo && this.selectedLayerInfo.id) {
                    $.get("/api/layer/" + this.selectedLayerInfo.id + "/filterClassifyValue", {
                        column_id: this.layerClassifyFieldSelectBox ? this.layerClassifyFieldSelectBox.option("value") : 0
                    }).done(xhr => {
                        if (xhr && xhr.status === EnumStatus.OK) {
                            deferred.resolve({
                                data: xhr.data, 
                                totalCount: xhr.data.length
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
                return $.ajax({
                    data: { id: key },
                    type: "POST",
                    url: "/api/table/" + this.selectedLayerInfo.table_info_id + "/columns/delete",
                });
            },
            update: (key, values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            this.layerClassifyGrid.getDataSource().reload();
                        }
                        else {
                            if (xhr.errors && xhr.errors.length > 0) {
                                OGUtils.alert(xhr.errors[0].message || "Cập nhật classify thất bại!");
                            } else {
                                OGUtils.alert("Cập nhật classify thất bại!");
                            }
                        }
                    },
                    type: "post",
                    url: "/api/table/" + values.table_id + "/columns/update",
                });
            },
        });
        this.styleEditor = new StyleEditorComponent();
        this.layerClassifyGrid = $("<div />").appendTo(container).dxDataGrid({
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
                    const pageIndex = this.layerClassifyGrid.pageIndex();
                    const pageSize = this.layerClassifyGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                width: 50,
            }, {
                alignment: "center",
                caption: "Biểu tượng",
                cellTemplate: (container, options) => {
                    const canvas = $("<canvas />").width(36).height(36).appendTo($("<center />").appendTo(container));
                    if (options.value) {
                        OGMapUtils.geoStylerStyleToCanvas(JSON.parse(options.value), 36, canvas.get(0) as HTMLCanvasElement);
                    }
                },
                dataField: "style",
                width: 120
            }, {
                caption: "Giá trị",
                dataField: "value",
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    const def = $.Deferred();
                                    this.styleEditor.for(this.selectedLayerInfo, def).show();
                                    def.then((e) => {
                                        if (e.type === "style") {
                                            $.post("/api/layer/classify/" + options.data.id + "/setStyle", {
                                                style: JSON.stringify(e.sld)
                                            }).then(() => {
                                                this.layerClassifyGrid.refresh(true);
                                            });
                                        }
                                    });
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                disabled: options.data.permanent,
                                icon: "icon icon-trash",
                                onClick: () => {
                                    if (options.data.permanent === false) {
                                        OGUtils.confirm("Xóa trường thông tin này?").then(value => {
                                            if (value) {
                                                options.component.getDataSource().store().remove(options.value).then(() => {
                                                    options.component.getDataSource().reload();
                                                });
                                            }
                                        });
                                    }
                                },
                                type: "danger"
                            },
                            widget: "dxButton"
                        }]
                    });
                },
                dataField: "id",
                width: 200,
            }],
            dataSource: new DataSource({
                store: this.layerClassifyStore
            }),
            editing: {
                form: {
                    colCount: 3,
                    items: [{
                        dataField: "order",
                        editorOptions: {},
                        editorType: "dxNumberBox"
                    }, {
                        dataField: "column_name"
                    }, {
                        dataField: "name_vn",
                    }, {
                        dataField: "data_type",
                    }, {
                        dataField: "is_identity",
                    }, {
                        dataField: "is_nullable",
                    }, {
                        dataField: "is_searchable",
                    }, {
                        dataField: "require",
                    }, {
                        dataField: "visible",
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin classify",
                    width: 400
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
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onContentReady: () => {
                this.layerClassifyFieldSelectBox = $("#layer_classify_field_selectbox").dxSelectBox("instance");
            },
            onEditorPreparing: (e) => {
                if (e.dataField == "geometry" && e.parentType == "dataRow") {
                    // e.editorOptions.disabled = !e.row.inserted;
                }
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;

                e.toolbarOptions.items.unshift({
                    location: "before",
                    options: {
                        hint: "Quay lại",
                        icon: "icon icon-arrow-left",
                        onClick: () => {
                            this.layerViews.option("selectedIndex", 0);
                            if (this.layerClassifyFieldSelectBox) {
                                this.layerClassifyFieldSelectBox.option("selectedItem", null);
                            }
                        },
                        type: "danger"
                    },
                    widget: "dxButton"
                }, {
                    location: "before",
                    options: {
                        dataSource: {
                            store: this.layerFieldStore,
                        },
                        displayExpr: "name_vn",
                        dropDownOptions: {
                            minWidth: 200,
                        },
                        elementAttr: { id: "layer_classify_field_selectbox" },
                        onContentReady: (e) => {
                            e.element.find(".dx-list-item-content").each(function () {
                                $(this).attr("title", $(this).text());
                            });
                        },
                        onSelectionChanged: (e) => {
                            if (e.selectedItem) {
                                $.get("/api/layer/" + this.selectedLayerInfo.id + "/filterClassifyValue", {
                                    column_id: e.selectedItem.id
                                }).done(xhr => {
                                    if (xhr && xhr.data.length > 0) {
                                        this.layerClassifyGrid.refresh(true);
                                    } else {
                                        OGUtils.confirm("Trường thông tin này chưa có giá trị classify, bạn có muốn tạo không?").then(_ => {
                                            if (_) {
                                                $.post("/api/layer/" + this.selectedLayerInfo.id + "/initial-classify-values", {
                                                    column_id: e.selectedItem.id
                                                }).done(() => {
                                                    this.layerClassifyGrid.refresh(true);
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        },
                        searchEnabled: true,
                        searchExpr: ["name_vn", "name_en"],
                        searchMode: "contains",
                        value: this.selectedLayerInfo ? this.selectedLayerInfo.classify_column_id : 0,
                        valueExpr: "id",
                        width: 200
                    },
                    widget: "dxSelectBox"
                }, {
                    location: "after",
                    options: {
                        onClick: () => {
                            $.each(this.layerClassifyGrid.getDataSource().items(), (idx, item) => {
                                let style;
                                setTimeout(() => {
                                    if (this.selectedLayerInfo.geometry === EnumGeometry.Point || this.selectedLayerInfo.geometry === EnumGeometry.MultiPoint) {
                                        style = JSON.stringify(OGUtils.getRandomPointStyle());
                                    } else if (this.selectedLayerInfo.geometry === EnumGeometry.LineString || this.selectedLayerInfo.geometry === EnumGeometry.MultiLineString) {
                                        style = JSON.stringify(OGUtils.getRandomLineStringStyle());
                                    } else if (this.selectedLayerInfo.geometry === EnumGeometry.Polygon || this.selectedLayerInfo.geometry === EnumGeometry.MultiPolygon) {
                                        style = JSON.stringify(OGUtils.getRandomPolygonStyle());
                                    }
                                    if (style) {
                                        $.post("/api/layer/classify/" + item.id + "/setStyle", {
                                            style: style
                                        }).then(() => {
                                            this.layerClassifyGrid.refresh(true);
                                        });
                                    }
                                }, 250);
                            });
                        },
                        text: "Tự tạo style",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới bảng",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            dataGrid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                });
            },
            pager: {
                allowedPageSizes: [50, 100, 100],
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
            scrolling: {
                showScrollbar: "always"
            },
            searchPanel: { visible: true },
            selection: {
                mode: "single"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",
        }).dxDataGrid("instance");
    }

    public addLayerView(layerViews: dxMultiView): void {
        this.layerViews = layerViews;
    }

    public for(layer: OGLayerModel): LayerClassifyComponent {
        this.selectedLayerInfo = layer;
        return this;
    }

    onInit (): void {
        this.initLayout(this.container);
    }
    
    public refresh(): void {
        this.layerClassifyGrid.getDataSource().reload();
        if (this.layerClassifyFieldSelectBox) {
            this.layerClassifyFieldSelectBox.getDataSource().reload();
        }
        this.layerClassifyFieldSelectBox.option("value", this.selectedLayerInfo.classify_column_id);
    }
}

export { LayerClassifyComponent };