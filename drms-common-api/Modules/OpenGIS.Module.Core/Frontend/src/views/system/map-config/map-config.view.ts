import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import dxSelectBox from "devextreme/ui/select_box";
import "devextreme/ui/tab_panel";
import dxTabPanel from "devextreme/ui/tab_panel";
import "devextreme/ui/tag_box";
import dxTagBox from "devextreme/ui/tag_box";
import "devextreme/ui/tree_view";
import dxTreeView from "devextreme/ui/tree_view";

import { SwitchModuleWindowComponent } from "../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumDanhMucNhomBanDo, EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { OGDanhMucModel } from "../../../../../../libs/core/models/document.model";
import { OGBaseLayerModel, OGLayerModel } from "../../../../../../libs/core/models/layer.model";
import { OGMapModel } from "../../../../../../libs/core/models/map.model";
import { MapService } from "../../../../../../libs/core/services/map.service";
import { MapBaseLayerView } from "./base-layer/base-layers.view";
import { MapLayerView } from "./layer/layers.view";
import "./map-config.view.scss";
import { MapTableView } from "./table/tables.view";

@RazorView()
class MapConfigView extends Layout {
    baseLayerForm: dxForm;
    baseLayerGrid: dxDataGrid;
    baseLayerViewsContainer: JQuery<HTMLElement>;
    container: JQuery<HTMLElement>;
    createBaseLayerPopup: dxPopup;
    createMapFromTemplatesForm: dxForm;
    createMapFromTemplatesPopup: dxPopup;
    layerForm: dxForm;
    layerGrid: dxDataGrid;
    layerGroupID: number | string;
    layerPopup: dxPopup;
    layerViewsContainer: JQuery<HTMLElement>;
    mapBaseLayerTree: dxTreeView;
    mapBaseLayerView: MapBaseLayerView;
    mapGrid: dxDataGrid;
    mapGridContainer: JQuery<HTMLElement>;
    mapGroupDatasource: OGDanhMucModel[];
    mapId: number;
    mapInfo: OGMapModel;
    mapLayerTree: dxTreeView;
    mapLayerView: MapLayerView;
    mapRegionTree: dxTreeView;
    mapRolePopup: dxPopup;
    mapRoleTab: dxTabPanel;
    mapStore: CustomStore<OGMapModel, number>;
    mapTableTree: dxTreeView;
    mapTableView: MapTableView;
    mapViews: dxMultiView;
    mapVisibleTagBox: dxTagBox;
    parentId: number | string;
    selectedLayerInfo: OGLayerModel;
    switchModule: SwitchModuleWindowComponent;
    tableSchema: number | string;

    constructor() {
        super("child");
    }

    private bindEvents(): void {
        const self = this;
        $(document).on("click", ".switch-module-action", function () {
            self.switchModule.showPopup();
        });
    }

    private initBaseLayerTree(container): void {
        container = container.css("padding", "10px");
        //
        this.mapBaseLayerTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                onItemSelectionChanged: (e) => {
                    this.reloadBaseLayerTagBox(this.mapBaseLayerTree.getDataSource().items());
                },
                showCheckBoxesMode: "normal"
            }).dxTreeView("instance");
        $("<hr /><span class='font-weight-bold'>Chọn bản đồ hiển thị</span>").appendTo(container);
        this.mapVisibleTagBox = $("<div />").appendTo(container)
            .dxTagBox({
                displayExpr: "name",
                noDataText: "Không có dữ liệu",
                onMultiTagPreparing: function (args) {
                    const selectedItemsLength = args.selectedItems.length,
                        totalCount = 1;

                    if (selectedItemsLength < totalCount) {
                        args.cancel = true;
                    } else {
                        args.text = "[" + selectedItemsLength + "] bản đồ hiển thị đã chọn";
                    }
                },
                placeholder: "[Tất cả]",
                searchEnabled: true,
                searchExpr: ["name"],
                searchMode: "contains",
                showDropDownButton: true,
                showSelectionControls: true,
                valueExpr: "id",
            }).dxTagBox("instance");
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

    private initMapGrid(container): void {
        this.mapGrid = $("<div />").appendTo(container).dxDataGrid({
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
                    const pageIndex = this.mapGrid.pageIndex();
                    const pageSize = this.mapGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                visible: true,
                width: 50,
            }, {
                caption: "Nhóm bản đồ",
                dataField: "parent_id",
                groupIndex: 0,
                lookup: {
                    dataSource: this.mapGroupDatasource,
                    displayExpr: "mo_ta",
                    valueExpr: "id",
                }
            }, {
                caption: "Tên bản đồ",
                dataField: "name",
                validationRules: [{
                    message: "Vui lòng nhập tên bản đồ",
                    type: "required"
                }]
            }, {
                caption: "Mô tả",
                dataField: "description"
            }, {
                caption: "Tâm bản đồ",
                dataField: "center"
            }, {
                caption: "Mức zoom mặc định",
                dataField: "defaultzoom"
            }, {
                caption: "Mức zoom nhỏ nhất",
                dataField: "minzoom"
            }, {
                caption: "Mức zoom lớn nhất",
                dataField: "maxzoom"
            }, {
                caption: "Hiển thị dữ liệu theo cụm?",
                dataField: "cluster",
            }, {
                alignment: "center",
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                hint: "Mở bản đồ",
                                icon: "icon icon-eye",
                                onClick: () => {
                                    window.open("/cms/map?id=" + options.row.data.id);
                                },
                                type: "default"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                hint: "Nội dung hiển thị",
                                icon: "icon icon-card",
                                onClick: () => {
                                    this.mapInfo = options.data;
                                    ///
                                    this.mapRegionTree.beginUpdate();
                                    this.mapRegionTree.option("dataSource.store",
                                        new CustomStore({
                                            key: "id",
                                            load: () => {
                                                return new Promise((resolve) => {
                                                    MapService.getRegionTree(options.data.id).then(result => {
                                                        if (result.status === EnumStatus.OK) {
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
                                    this.mapRegionTree.endUpdate();
                                    this.mapRegionTree["mapId"] = options.data.id;
                                    ///
                                    this.mapBaseLayerTree.beginUpdate();
                                    this.mapBaseLayerTree.option("dataSource.store",
                                        new CustomStore({
                                            key: "id",
                                            load: () => {
                                                return new Promise((resolve) => {
                                                    MapService.getBaseLayerTree(options.data.id).then(result => {
                                                        if (result.status === EnumStatus.OK) {
                                                            resolve(result);
                                                            this.reloadBaseLayerTagBox(result.data);
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
                                    this.mapBaseLayerTree.endUpdate();
                                    this.mapBaseLayerTree["mapId"] = options.data.id;
                                    ///
                                    this.mapLayerTree.beginUpdate();
                                    this.mapLayerTree.option("dataSource.store",
                                        new CustomStore({
                                            key: "id",
                                            load: () => {
                                                return new Promise((resolve) => {
                                                    MapService.getLayerTree(options.data.id).then(result => {
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
                                    this.mapLayerTree["mapId"] = options.data.id;
                                    ///
                                    this.mapTableTree.beginUpdate();
                                    this.mapTableTree.option("dataSource.store",
                                        new CustomStore({
                                            key: "id",
                                            load: () => {
                                                return new Promise((resolve) => {
                                                    MapService.getTableTree(options.data.id).then(result => {
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
                                    this.mapTableTree.endUpdate();
                                    this.mapTableTree["mapId"] = options.data.id;

                                    this.mapRolePopup.show();
                                },
                                type: "default"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                hint: "Chỉnh sửa",
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    options.component.editRow(options.rowIndex);
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                disabled: options.data.permanent,
                                hint: "Xóa",
                                icon: "icon icon-trash",
                                onClick: () => {
                                    OGUtils.confirm("Bạn muốn xóa bản đồ này?").then(value => {
                                        if (value) {
                                            options.component.getDataSource().store().remove(options.data.id).then(() => {
                                                this.refreshMapGrid();
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
                                    hint: "Sao chép đường dẫn bản đồ",
                                    onClick: () => {
                                        navigator.clipboard.writeText(window.location.origin + "/cms/map?id=" + options.data.id);
                                        OGUtils.alert("Sao chép thành công!");
                                    },
                                    text: "Sao chép đường dẫn bản đồ",
                                    type: "default"
                                }, {
                                    hint: "Lưu cấu hình trình bày bản đồ thành tệp",
                                    onClick: () => {
                                        OGUtils.postDownload("/api/map/export/templates", { id: options.data.id });
                                    },
                                    text: "Lưu cấu hình trình bày bản đồ thành tệp",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        this.mapInfo = options.data;
                                        this.mapBaseLayerView.reload(this.mapInfo.id);
                                        this.mapViews.option("selectedIndex", 1);
                                    },
                                    text: "Lớp nền bản đồ",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        this.mapInfo = options.data;
                                        this.mapLayerView.reload(this.mapInfo.id);
                                        this.mapViews.option("selectedIndex", 2);
                                    },
                                    text: "Lớp dữ liệu",
                                    type: "default"
                                }, {
                                    onClick: () => {
                                        this.mapInfo = options.data;
                                        this.mapTableView.reload(this.mapInfo.id);
                                        this.mapViews.option("selectedIndex", 3);
                                    },
                                    text: "Bảng dữ liệu",
                                    type: "default"
                                },],
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
                dataField: "id",
                width: 350,
            }],
            dataSource: {
                store: this.mapStore
            },
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        dataField: "name"
                    }, {
                        dataField: "description"
                    }, {
                        dataField: "center"
                    }, {
                        dataField: "defaultzoom"
                    }, {
                        dataField: "minzoom"
                    }, {
                        dataField: "maxzoom"
                    }, {
                        dataField: "cluster"
                    }, {
                        dataField: "parent_id"
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin bản đồ",
                    width: 500,
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
            onContentReady: () => {
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                e.toolbarOptions.items.unshift({
                    location: "after",
                    options: {
                        onClick: () => {
                            this.createMapFromTemplatesPopup.show();

                        },
                        text: "Tạo bản đồ mới từ mẫu có sẵn",
                        type: "success"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        onClick: () => {
                            this.mapGrid.addRow();
                        },
                        text: "Thêm bản đồ mới",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            this.refreshMapGrid();
                        }
                    },
                    widget: "dxButton"
                });
            },
            pager: {
                allowedPageSizes: [50, 100, 200],
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

        this.mapRolePopup = $("<div />").addClass("role-popup").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                this.mapRoleTab = $("<div />").appendTo(container)
                    .dxTabPanel({
                        animationEnabled: false,
                        deferRendering: false,
                        height: 380,
                        itemTemplate: (itemData, itemIndex, itemElement) => {
                            const itemScrollView = $("<div/>").appendTo(itemElement);
                            if (itemData.id === "regions") {
                                this.initRegionTree(itemScrollView);
                            } else if (itemData.id === "baseLayers") {
                                this.initBaseLayerTree(itemScrollView);
                            } else if (itemData.id === "layers") {
                                this.initLayerTree(itemScrollView);
                            } else if (itemData.id === "tables") {
                                this.initTableTree(itemScrollView);
                            }
                            itemScrollView.dxScrollView();
                        },
                        itemTitleTemplate: (itemData) => {
                            return itemData.text;
                        },
                        items: [{
                            id: "regions",
                            text: "Hành chính"
                        }, {
                            id: "baseLayers",
                            text: "Nền bản đồ"
                        }, {
                            id: "layers",
                            text: "Lớp dữ liệu"
                        }, {
                            id: "tables",
                            text: "Bảng dữ liệu"
                        }],
                        loop: false,
                        scrollingEnabled: false,
                        selectedIndex: 0,
                        swipeEnabled: false,
                        width: 400
                    }).dxTabPanel("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: 500,
            hideOnOutsideClick: false,
            resizeEnabled: false,
            shading: true,
            showTitle: true,
            title: "Nội dung hiển thị",
            toolbarItems: [{
                location: "center",
                options: {
                    onClick: () => {
                        this.mapInfo.mapBaseLayers = [];
                        this.mapInfo.mapLayers = [];
                        this.mapInfo.mapTables = [];
                        this.mapInfo.mapRegions = [];
                        $.each(this.mapRegionTree.getDataSource().items(), (idx, item) => {
                            if (item.selected && item.raw) {
                                this.mapInfo.mapRegions.push({
                                    area_code: item.raw.area_id,
                                    area_type: 1,
                                });
                            }
                        });
                        const visibleBaseLayer = this.mapVisibleTagBox.option("selectedItems");
                        $.each(this.mapBaseLayerTree.getDataSource().items(), (idx, item) => {
                            if (item.selected && item.raw) {
                                this.mapInfo.mapBaseLayers.push({
                                    base_layer_id: item.raw.id,
                                    visible: visibleBaseLayer.map(x => x.id).includes(item.raw.id)
                                });
                            }
                        });

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
                        $.each(this.mapTableTree.getDataSource().items(), (idx, item) => {
                            if (item.items) {
                                $.each(item.items, (childIdx, child) => {
                                    if (child.selected && child.raw) {
                                        this.mapInfo.mapTables.push({
                                            table_id: child.raw.id
                                        });
                                    }
                                });
                            }
                        });

                        OGUtils.showLoading();

                        const savePromises = [];
                        savePromises.push(MapService.saveRegions(this.mapInfo));
                        savePromises.push(MapService.saveBaseLayer(this.mapInfo));
                        savePromises.push(MapService.saveLayer(this.mapInfo));
                        savePromises.push(MapService.saveTable(this.mapInfo));

                        Promise.all(savePromises).then((response) => {
                            OGUtils.hideLoading();
                            OGUtils.alert("Lưu dữ liệu thành công!");
                            this.mapRolePopup.hide();
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
                        this.mapRolePopup.hide();
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

    private initMapViews(): void {
        this.mapViews = $("<div />").appendTo(this.container).dxMultiView({
            deferRendering: false,
            height: "100%",
            items: [{
                template: (data, index, element) => {
                    this.initMapGrid(element);
                }
            }, {
                template: (data, index, element) => {
                    this.mapBaseLayerView = new MapBaseLayerView(element);
                }
            }, {
                template: (data, index, element) => {
                    this.mapLayerView = new MapLayerView(element);
                }
            }, {
                template: (data, index, element) => {
                    this.mapTableView = new MapTableView(element);
                }
            },],
            swipeEnabled: false
        }).dxMultiView("instance");
        this.mapBaseLayerView.addMapView(this.mapViews);
        this.mapLayerView.addMapView(this.mapViews);
        this.mapTableView.addMapView(this.mapViews);
        this.mapViews.element().find(".dx-multiview-wrapper").css("border", "none");
    }

    private initRegionTree(container): void {
        container = container.css("padding", "10px");
        //
        this.mapRegionTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
    }
    private initTableTree(container): void {
        container = container.css("padding", "10px");
        //
        this.mapTableTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
    }
    private initTemplatesMap(): void {
        this.createMapFromTemplatesPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.createMapFromTemplatesForm = $("<div />").appendTo(container)
                    .dxForm({
                        formData: {},
                        items: [{
                            dataField: "name",
                            label: {
                                text: "Tên bản đồ"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên bản đồ",
                                type: "required"
                            }]
                        }, {
                            dataField: "description",
                            label: {
                                text: "Mô tả"
                            },
                        }, {
                            dataField: "id",
                            editorOptions: {
                                dataSource: new DataSource({
                                    store: new CustomStore({
                                        key: "id",
                                        load: (options) => {
                                            const def = $.Deferred();
                                            MapService.list(options).then(result => {
                                                if (result) {
                                                    def.resolve(result.data);
                                                } else {
                                                    def.resolve([]);
                                                }
                                            });
                                            return def.promise();
                                        },
                                        loadMode: "raw"
                                    })
                                }),
                                displayExpr: "name",
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                valueExpr: "id",
                                width: "100%",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Bản đồ mẫu",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn mẫu từ bản đồ mẫu có sẵn",
                                type: "required"
                            }]
                        }, {
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 2,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.createMapFromTemplatesForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        OGUtils.showLoading();
                                                        const data = this.createMapFromTemplatesForm.option("formData");
                                                        MapService.createMapFromTemplates(data).then(result => {
                                                            OGUtils.hideLoading();
                                                            this.createMapFromTemplatesPopup.hide();
                                                            this.refreshMapGrid();
                                                        });
                                                    }
                                                },
                                                stylingMode: "contained",
                                                text: "Lưu",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    this.createMapFromTemplatesForm.resetValues();
                                                    this.createMapFromTemplatesPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    }).dxToolbar("instance");
                            }

                        }]
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onOptionChanged: () => {

            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: false,
            showTitle: true,
            title: "Tạo bản đồ chuyên đề từ mẫu có sẵn",
            width: 400,
        }).dxPopup("instance");
    }

    private refreshMapGrid(): void {
        this.mapGrid.getDataSource().reload();
        const mapEditor = this.createMapFromTemplatesForm.getEditor("id");
        if (mapEditor && mapEditor instanceof dxSelectBox) {
            mapEditor.getDataSource().reload();
            mapEditor.repaint();
        }
    }
    onInit(): void {
        $("#header").find(".header-title >span").html("Quản lý bản đồ");
        //
        this.container = $("#map-container");
        //
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight());
        //
        const url = window.location.href;
        if (url.indexOf("?") > -1) {
            const urlParams = url.slice(url.indexOf("?") + 1).split("&");
            for (let i = 0; i < urlParams.length; i++) {
                if (urlParams[i].indexOf("parent_id") > -1) {
                    this.parentId = urlParams[i].split("=")[1];
                }
            }
        }
        //
        this.mapStore = new CustomStore({
            byKey: (key) => {
                return MapService.get(key);
            },
            insert: (values) => {
                if (this.parentId) {
                    values.parent_id = parseInt(this.parentId.toString());
                }
                return MapService.save(values);
            },
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred(), args: { [key: string]: number | string } = {};

                if (loadOptions.sort) {
                    args.orderby = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        args.orderby += " desc";
                }
                args.skip = loadOptions.skip ? loadOptions.skip : 0;
                args.take = loadOptions.take ? loadOptions.take : 50;
                args.parent_id = this.parentId;
                MapService.list(args).then(result => {
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
                return deferred.promise();
            },
            remove: (key) => {
                return MapService.delete({ id: key });
            },
            update: (key, values) => {
                return MapService.save(values);
            },
        });

        this.mapGroupDatasource = [
            {
                id: 0,
                mo_ta: "Không thuộc nhóm bản đồ nào"
            },
            {
                id: EnumDanhMucNhomBanDo.CAYXANH.id,
                mo_ta: EnumDanhMucNhomBanDo.CAYXANH.text
            },
            {
                id: EnumDanhMucNhomBanDo.CHIEUSANG.id,
                mo_ta: EnumDanhMucNhomBanDo.CHIEUSANG.text
            },
            {
                id: EnumDanhMucNhomBanDo.CAPNUOC.id,
                mo_ta: EnumDanhMucNhomBanDo.CAPNUOC.text
            },
            {
                id: EnumDanhMucNhomBanDo.THOATNUOC.id,
                mo_ta: EnumDanhMucNhomBanDo.THOATNUOC.text
            },
            {
                id: EnumDanhMucNhomBanDo.KHUCU_KHUDOTHI.id,
                mo_ta: EnumDanhMucNhomBanDo.KHUCU_KHUDOTHI.text
            },
            {
                id: EnumDanhMucNhomBanDo.KHU_NGHIATRANG.id,
                mo_ta: EnumDanhMucNhomBanDo.KHU_NGHIATRANG.text
            },
            {
                id: EnumDanhMucNhomBanDo.TUYNEN.id,
                mo_ta: EnumDanhMucNhomBanDo.TUYNEN.text
            },
            {
                id: EnumDanhMucNhomBanDo.KHU_CONGNGHIEP.id,
                mo_ta: EnumDanhMucNhomBanDo.KHU_CONGNGHIEP.text
            }
        ];

        this.initMapViews();
        this.initTemplatesMap();
        this.bindEvents();
        this.switchModule = new SwitchModuleWindowComponent("config");
    }
    reloadBaseLayerTagBox(baseLayers: Array<object>): void {
        const self = this;
        const selected = baseLayers.filter(x => x["selected"] && x["raw"]).map(x => {
            x["raw"].is_visible = x["is_visible"];
            delete x["raw"].visible;
            return x["raw"];
        });
        this.mapVisibleTagBox.beginUpdate();
        this.mapVisibleTagBox.option("dataSource", selected);
        this.mapVisibleTagBox.option("value", selected.filter(x => x.is_visible).map(x => x.id));
        this.mapVisibleTagBox.endUpdate();
    }
}
