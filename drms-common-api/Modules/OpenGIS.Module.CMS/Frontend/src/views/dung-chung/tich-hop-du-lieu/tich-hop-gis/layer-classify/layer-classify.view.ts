import { OGMapUtils } from "@opengis/map";
import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/select_box";
import dxSelectBox from "devextreme/ui/select_box";

import { IBaseComponent } from "../../../../../../../../libs/core/components/base-component.abstract";
import { StyleEditorComponent } from "../../../../../../../../libs/core/components/style-editor/style-editor.component";
import { EnumGeometry, EnumStatus } from "../../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../../libs/core/helpers/utils";
import { OGLayerClassifyModel, OGLayerModel } from "../../../../../../../../libs/core/models/layer.model";
import { OGTableColumnModel } from "../../../../../../../../libs/core/models/table.model";


class LayerClassifyView implements IBaseComponent {
    container: JQuery<HTMLElement>;
    fieldSelector: dxSelectBox;
    layerClassifyFieldSelectBox: dxSelectBox;
    layerClassifyGrid: dxDataGrid;
    layerClassifyStore: CustomStore<OGLayerClassifyModel, number>;
    layerFieldStore: CustomStore<OGTableColumnModel, number>;
    layerViews: dxMultiView;
    oGLayer: OGLayerModel;
    styleEditor: StyleEditorComponent;

    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.initLayout();
    }

    private initLayerClassifyGrid(container): void {
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
                caption: "Thứ tự",
                dataField: "order",
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
                caption: "Mô tả",
                dataField: "description",
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
                                    this.styleEditor.for(this.oGLayer, def).show();
                                    def.then((e) => {
                                        if (e.type === "style") {
                                            $.post("/api/layer/classify/" + options.data.id + "/setStyle", {
                                                style: JSON.stringify(e.geoStyler)
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
                            if (this.layerClassifyFieldSelectBox) {
                                this.layerClassifyFieldSelectBox.option("selectedItem", null);
                            }
                            this.layerViews.option("selectedIndex", 0);
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
                        onContentReady: (e) => {
                            e.element.find(".dx-list-item-content").each(function () {
                                $(this).attr("title", $(this).text());
                            });
                            this.layerClassifyFieldSelectBox = e.component;
                        },
                        onSelectionChanged: (e) => {
                            if (e.selectedItem) {
                                $.get("/api/layer/" + this.oGLayer.id + "/filterClassifyValue", {
                                    column_id: e.selectedItem.id
                                }).done(xhr => {
                                    if (xhr && xhr.data.length > 0) {
                                        this.layerClassifyGrid.refresh(true);
                                    } else {
                                        OGUtils.confirm("Trường thông tin này chưa có giá trị classify, bạn có muốn tạo không?").then(_ => {
                                            if (_) {
                                                $.post("/api/layer/" + this.oGLayer.id + "/initial-classify-values", {
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
                        value: this.oGLayer ? this.oGLayer.classify_column_id : 0,
                        valueExpr: "id",
                        width: 200
                    },
                    widget: "dxSelectBox"
                }, {
                    location: "after",
                    options: {
                        onClick: () => {
                            const selectedItem = this.layerClassifyFieldSelectBox.option("selectedItem");
                            $.post("/api/layer/" + this.oGLayer.id + "/initial-classify-values", {
                                column_id: selectedItem.id
                            }).done(() => {
                                this.layerClassifyGrid.refresh(true);
                            });
                        },
                        text: "Tạo classify"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        onClick: () => {
                            $.each(this.layerClassifyGrid.getDataSource().items(), (idx, item) => {
                                let style;
                                if (this.oGLayer.geometry === EnumGeometry.Point || this.oGLayer.geometry === EnumGeometry.MultiPoint) {
                                    style = JSON.stringify(OGUtils.getRandomPointStyle());
                                } else if (this.oGLayer.geometry === EnumGeometry.LineString || this.oGLayer.geometry === EnumGeometry.MultiLineString) {
                                    style = JSON.stringify(OGUtils.getRandomLineStringStyle());
                                } else if (this.oGLayer.geometry === EnumGeometry.Polygon || this.oGLayer.geometry === EnumGeometry.MultiPolygon) {
                                    style = JSON.stringify(OGUtils.getRandomPolygonStyle());
                                }
                                if (style) {
                                    $.post("/api/layer/classify/" + item.id + "/setStyle", {
                                        style: style
                                    }).then(() => {
                                        this.layerClassifyGrid.refresh(true);
                                    });
                                }
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

    private initLayout(): void {
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
                args.take = loadOptions.take ? loadOptions.take : 9999;

                if (this.oGLayer && this.oGLayer.id) {
                    $.ajax({
                        data: {
                            id: this.oGLayer.id,
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
                    deferred.resolve([], {
                        totalCount: 0
                    });
                }

                return deferred.promise();
            },
        });
        this.layerClassifyStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                if (key) {
                    axios.get("/api/layer/classify/" + key.toString()).then(xhr => {
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
                args.take = loadOptions.take ? loadOptions.take : 15;

                if (this.oGLayer && this.oGLayer.id) {
                    $.get("/api/layer/" + this.oGLayer.id + "/filterClassifyValue", {
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
                    url: "/api/table/" + this.oGLayer.id + "/columns/delete",
                });
            },
        });
        this.styleEditor = new StyleEditorComponent();
        this.initLayerClassifyGrid(this.container);
    }

    public addLayerView(layerViews: dxMultiView): void {
        this.layerViews = layerViews;
    }

    onInit(): void {

    }
    public reload(layerInfo: OGLayerModel): void {
        this.oGLayer = layerInfo;
        this.layerClassifyGrid.getDataSource().reload();
        if (this.layerClassifyFieldSelectBox) {
            this.layerClassifyFieldSelectBox.getDataSource().reload();
        }
        this.layerClassifyFieldSelectBox.option("value", this.oGLayer.classify_column_id);
    }
}

export { LayerClassifyView };
