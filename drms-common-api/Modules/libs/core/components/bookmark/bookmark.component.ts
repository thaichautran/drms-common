import { OGMap } from "@opengis/map";
import CustomStore from "devextreme/data/custom_store";
import "devextreme/ui/button";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/drop_down_box";
import "devextreme/ui/drop_down_button";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/number_box";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/scroll_view";
import "devextreme/ui/select_box";
import "devextreme/ui/tag_box";
import "devextreme/ui/text_box";
import "devextreme/ui/toolbar";
import $ from "jquery";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { BookMarkService } from "../../services/book-mark.service";
import { IMapComponent } from "../base-component.abstract";
import { IdentifyComponent } from "../identify/identify.component";

interface BookMarkOptions {
    identify: IdentifyComponent,
    isGeneralMap: boolean;
    mapId?: number
}
class BookMarkComponent implements IMapComponent {
    bookmarkDatagrid: dxDataGrid;
    bookmarkPopup: dxPopup;
    getLinkPopup: dxPopup;
    isGeneralMap: boolean;
    linkForm: dxForm;
    mapId: number;
    oGMap: OGMap;
    
    constructor(oGMap: OGMap, options: BookMarkOptions) {
        this.oGMap = oGMap;
        this.isGeneralMap = options.isGeneralMap;
        this.mapId = options.mapId;
        this.onInit();
    }

    private _renderBodyLinkArea(popupBody): void {
        const self = this;
        self.linkForm = $("<div />")
            .addClass("link-form").css({ "border": " none", })
            .appendTo(popupBody).dxForm({
                formData: {},
                height: 100,
                items: [{
                    dataField: "link",
                    editorOptions: {
                        disabled: false,
                        elementAttr: {
                            className: "txtLink",
                        },
                    },
                    editorType: "dxTextArea",
                    label: {
                        location: "top",
                        text: "Mã nhúng",
                    },
                },],
                width: 620,
            }).dxForm("instance");
    }

    public hide(): void {
        this.bookmarkPopup.hide();
    }

    onInit(): void {
        const self = this;
        this.bookmarkPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", 0);
                this.bookmarkDatagrid = $("<div />").appendTo(container).dxDataGrid({
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    columnChooser: {
                        enabled: true,
                        mode: "select",
                    },
                    columns: [{
                        caption: "Ghi chú",
                        dataField: "note",
                        width: 150
                    }, {
                        caption: "Đánh dấu",
                        cellTemplate: (container, options) => {
                            const data = options.data;
                            return container.append(`${window.location.origin}${data.url}?r=${data.key}`);
                        },
                        dataField: "key",
                    }, {
                        alignment: "center",
                        allowEditing: false,
                        caption: "Thao tác",
                        cellTemplate: (container, options) => {
                            $("<div>").appendTo(container).dxToolbar({
                                items: [{
                                    location: "center",
                                    options: {
                                        hint: "Sao chép",
                                        icon: "icon icon-copy",
                                        onClick: () => {
                                            const data = options.row.data;
                                            if (navigator.clipboard) {
                                                let path = "";
                                                if (this.isGeneralMap && this.mapId) {
                                                    path = `${window.location.origin}${data.url}?mapId=${this.mapId}&r=${data.key}`;
                                                } else {
                                                    path = `${window.location.origin}${data.url}?r=${data.key}`;
                                                }
                                                navigator.clipboard.writeText(path).then(() => {
                                                    OGUtils.alert("Đã sao chép đánh dấu", "Thông báo");
                                                });
                                            }
                                            else {
                                                console.error("Error");
                                            }
                                        },
                                        type: "default"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "center",
                                    options: {
                                        hint: "Xem vị trí đánh dấu",
                                        icon: "icon icon-search-normal-1",
                                        onClick: () => {
                                            const data = options.row.data;
                                            if (data && data.extent) {
                                                this.oGMap.fitExtentAnimate(JSON.parse(data.extent), undefined);
                                            }
                                        },
                                        type: "success"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "center",
                                    options: {
                                        hint: "Xóa đánh dấu",
                                        icon: "icon icon-trash",
                                        onClick: () => {
                                            const data = options.row.data;
                                            if (data) {
                                                OGUtils.confirm("Xác nhận xoá đánh dấu này?", "Thông báo").then(_ => {
                                                    if (_) {
                                                        BookMarkService.delete(data).then(() => {
                                                            self.bookmarkDatagrid.getDataSource().reload();
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
                        width: 120,
                    }],
                    dataSource: {
                        store: new CustomStore({
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
                                args.take = loadOptions.take ? loadOptions.take : 10;
                                args.path_name = window.location.pathname;

                                BookMarkService.list(args).then(result => {
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
                            }
                        }),
                    },
                    errorRowEnabled: true,
                    filterRow: {
                        visible: true,
                    },
                    grouping: {
                        //autoExpandAll: false
                    },
                    height: "100%",
                    loadPanel: {
                        text: "Đang tải dữ liệu"
                    },
                    noDataText: "Không có dữ liệu",
                    onContentReady: (e) => {
                        e.element.find(".dx-datagrid-header-panel > .dx-toolbar").css("padding", "5px").css("margin", "0");
                    },
                    pager: {
                        allowedPageSizes: [50, 100, 200],
                        infoText: "{2} bản ghi",
                        showInfo: true,
                        showNavigationButtons: true,
                        showPageSizeSelector: true,
                        visible: true,
                    },
                    paging: {
                        enabled: true,
                        pageSize: 50
                    },
                    remoteOperations: {
                        //sorting: true,
                        filtering: true,
                        groupPaging: false,
                        paging: true
                    },
                    scrolling: {
                        showScrollbar: "always"
                    },
                    selection: {
                        mode: "single",
                    },
                    showBorders: true,
                    showRowLines: true,
                    toolbar: {
                        items: [{
                            options: {
                                elementAttr: {
                                    id: "txtBookmarkName",
                                },
                                hint: "Ghi chú",
                                placeholder: "Ghi chú",
                            },
                            widget: "dxTextBox",
                        }, {
                            locateInMenu: "auto",
                            location: "after",
                            options: {
                                elementAttr: {
                                    class: "btnCreateLink",
                                    hint: "Đánh dấu",
                                },
                                icon: "icon icon-add",
                                onClick() {
                                    const olMap = self.oGMap.olMap;
                                    const extent = JSON.stringify(olMap.getView().calculateExtent(olMap.getSize()));
                                    const data = {
                                        extent: extent,
                                        note: $("#txtBookmarkName").dxTextBox("instance").option("value"),
                                        url: window.location.pathname
                                    };
                                    BookMarkService.insert(data).then(() => {
                                        $("#txtBookmarkName").dxTextBox("instance").option("value", "");
                                        self.bookmarkDatagrid.getDataSource().reload();
                                    });
                                },
                                text: "Đánh dấu",
                                type: "default",
                            },
                            widget: "dxButton",
                        },]
                    },
                    width: "100%",
                }).dxDataGrid("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: 300,
            hideOnOutsideClick: false,
            position: {
                at: "right top",
                of: "#map",
                offset: "-310 360"
            },
            resizeEnabled: true,
            shading: false,
            showCloseButton: true,
            showTitle: true,
            title: "Đánh dấu",
            width: 500,
        }).dxPopup("instance");
        
        this.getLinkPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: this._renderBodyLinkArea.bind(this),
            deferRendering: true,
            dragEnabled: true,
            height: 150,
            hideOnOutsideClick: false,
            position: {
                at: "right top",
                of: "body",
                offset: "-500 120"
            },
            shading: false,
            showCloseButton: true,
            showTitle: true,
            title: "Sao lưu mã nhúng",
            width: 620,
        }).dxPopup("instance");
    }
    public show(): void {
        this.bookmarkPopup.show();
    }
    //activate() {
    //    let self = this;
    //    let defArr = [];
    //    this.g_MapCore.controls.forEach(control => {
    //        if (control && control == self) {
    //            if (control.g_ControlName === "FeatureEditor") {
    //                defArr.push(new Promise((resolve, reject) => {
    //                    control.deactivate().then((response) => {
    //                        resolve(response);
    //                    });
    //                }));
    //            } else {
    //                control.deactivate();
    //            }

    //        }
    //    });
    //    Promise.all(defArr).then((response) => {
    //        if (!response[0]) {
    //            this.emit('activated', this);
    //            this.g_isShare = true;
    //        }
    //    })
    //}
    //deactivate() {
    //    this.emit('deactivated', this);
    //    this.g_isShare = false;
    //}
}

export {
    BookMarkComponent
};