import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import dxForm from "devextreme/ui/form";
import dxMultiView from "devextreme/ui/multi_view";
import dxPopup from "devextreme/ui/popup";
import dxTreeView from "devextreme/ui/tree_view";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { OGBaseLayerModel} from "../../../../../../../libs/core/models/layer.model";
import { OGMapModel } from "../../../../../../../libs/core/models/map.model";
import { BaseLayerService } from "../../../../../../../libs/core/services/base-layer.service";
import { MapService } from "../../../../../../../libs/core/services/map.service";


class MapBaseLayerView implements IBaseComponent {
    baseLayerForm: dxForm;
    baseLayerGrid: dxDataGrid;
    baseLayerStore: CustomStore<OGBaseLayerModel, number>;
    container: JQuery<HTMLElement>;
    createBaseLayerPopup: dxPopup;
    mapBaseLayerPopup: dxPopup;
    mapBaseLayerTree: dxTreeView;
    mapId: number;
    mapInfo: OGMapModel;
    mapViews: dxMultiView;
    

    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.initLayout();
    }

    private initBaseLayerTree(container): void {
        container = container.css("padding", "10px");
        //
        this.mapBaseLayerTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
    }

    private initBaseLayerViews(container): void {
        this.mapBaseLayerPopup = $("<div />").addClass("role-popup").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                this.initBaseLayerTree(container);
            },
            deferRendering: false,
            dragEnabled: false,
            height: 500,
            hideOnOutsideClick: false,
            resizeEnabled: false,
            shading: true,
            showTitle: true,
            title: "Lớp bản đồ nền",
            toolbarItems: [{
                location: "center",
                options: {
                    onClick: () => {
                        this.mapInfo = {
                            id: this.mapId,
                            mapBaseLayers: [],
                            mapLayers: []
                        };
                        $.each(this.mapBaseLayerTree.getDataSource().items(), (idx, item) => {
                            if (item.selected && item.raw) {
                                this.mapInfo.mapBaseLayers.push({
                                    base_layer_id: item.raw.id
                                });
                            }
                        });
                        axios({
                            data: this.mapInfo,
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            method: "POST",
                            url: "/api/map/base-layer/save",
                        }).then(response => {
                            if (response.data.status === EnumStatus.OK) {
                                OGUtils.alert("Lưu dữ liệu thành công!");
                                this.mapBaseLayerPopup.hide();
                                this.baseLayerGrid.getDataSource().reload();
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
                        this.mapBaseLayerPopup.hide();
                    },
                    text: "Huỷ",
                    type: "danger"
                },
                toolbar: "bottom",
                widget: "dxButton"
            }],
            width: 400
        }).dxPopup("instance");

        this.baseLayerGrid = $("<div />").appendTo(container)
            .dxDataGrid({
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
                        const pageIndex = this.baseLayerGrid.pageIndex();
                        const pageSize = this.baseLayerGrid.pageSize();
                        container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                    },
                    dataField: "index",
                    width: 50,
                },
                {
                    caption: "Tên",
                    dataField: "name",
                },
                {
                    caption: "Hiển thị",
                    dataField: "visible",
                    dataType: "boolean",
                    width: 100,
                },
                {
                    caption: "Địa chỉ đường dẫn",
                    dataField: "url",
                },
                {
                    caption: "Loại bản đồ",
                    dataField: "type",
                },
                {
                    alignment: "center",
                    allowEditing: false,
                    caption: "Thao tác",
                    cellTemplate: (container, options) => {
                        $("<div>").appendTo(container).dxToolbar({
                            items: [
                                {
                                    location: "center",
                                    options: {
                                        hint: "Chỉnh sửa",
                                        icon: "icon icon-edit-2",
                                        onClick: () => {
                                            this.baseLayerGrid.editRow(options.rowIndex);
                                        },
                                        type: "success"
                                    },
                                    widget: "dxButton"
                                },
                                {
                                    location: "center",
                                    options: {
                                        hint: "Xóa lớp nền bản đồ",
                                        icon: "icon icon-trash",
                                        onClick: () => {
                                            OGUtils.confirm("Xác nhận xóa lớp nền bản đồ này khỏi bản đồ?").then(value => {
                                                if (value) {
                                                    options.component.getDataSource().store().remove(options.value).then(() => {
                                                        options.component.getDataSource().reload().then(() => {
                                                            OGUtils.alert("Xóa thành công!");
                                                        });
                                                    });
                                                }
                                            });
                                        },
                                        type: "danger"
                                    },
                                    widget: "dxButton"
                                },
                            ]
                        });
                    },
                    dataField: "id",
                    width: 150,
                }
                ],
                dataSource: {
                    store: this.baseLayerStore
                },
                editing: {
                    form: {
                        colCount: 1,
                        items: [{
                            dataField: "name",
                        }, {
                            dataField: "visible",
                        }, {
                            dataField: "url",
                        }, {
                            dataField: "type",
                        }]
                    },
                    mode: "popup",
                    popup: {
                        height: "auto",
                        showTitle: true,
                        title: "Thông tin lớp bản đồ",
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
                groupPanel: {
                    allowColumnDragging: false,
                    emptyPanelText: "Kéo tiêu đề cột vào đây để nhóm theo cột đó",
                    visible: true
                },
                height: "100%",
                loadPanel: {
                    text: "Đang tải dữ liệu"
                },
                noDataText: "Không có dữ liệu",
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
                                this.mapViews.option("selectedIndex", 0);
                            },
                            type: "danger"
                        },
                        widget: "dxButton"
                    }, {
                        location: "after",
                        options: {
                            onClick: () => {
                                this.mapBaseLayerTree.beginUpdate();
                                this.mapBaseLayerTree.option("dataSource.store",
                                    new CustomStore({
                                        key: "id",
                                        load: () => {
                                            return new Promise((resolve) => {
                                                MapService.getBaseLayerTree(this.mapId).then(result => {
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
                                this.mapBaseLayerTree.endUpdate();
                                this.mapBaseLayerTree["mapId"] = this.mapId;
                                this.mapBaseLayerPopup.show();
                            },
                            text: "Thêm lớp bản đồ",
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
                scrolling: {
                    showScrollbar: "always"
                },
                searchPanel: { visible: true },
                selection: {
                    mode: "single",
                    showCheckBoxesMode: "none"
                },
                showBorders: true,
                showRowLines: true,
                width: "100%",
            }).dxDataGrid("instance");
    }

    private initLayout(): void {
        this.baseLayerStore = new CustomStore({
            byKey: (key) => {
                return BaseLayerService.get(key);
            },
            insert: (values) => {
                return BaseLayerService.insert(values);
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
                
                if (this.mapId) {
                    MapService.getBaseLayers(this.mapId, args).then(result => {
                        if (result) {
                            deferred.resolve({
                                data: result.data,
                                totalCount : result.recordsTotal
                            });
                        } else {
                            deferred.resolve( {
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
                return MapService.deleteBaseLayer({base_layer_id : key, map_id: this.mapId});
            },
            update: (key, values) => {
                return BaseLayerService.insert(values);
            }
        });
        this.initBaseLayerViews(this.container);
    }

    public addMapView(mapViews: dxMultiView): void {
        this.mapViews = mapViews;
    }

    onInit(): void {

    }

    public reload(mapId: number): void {
        this.mapId = mapId;
        if (this.baseLayerGrid) {
            this.baseLayerGrid.getDataSource().reload();
        }
    }
}

export { MapBaseLayerView };
