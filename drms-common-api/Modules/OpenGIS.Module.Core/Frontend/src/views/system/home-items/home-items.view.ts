import axios from "axios";
import CustomStore, { ResolvedData } from "devextreme/data/custom_store";
import dxCheckBox from "devextreme/ui/check_box";
import "devextreme/ui/check_box";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import dxForm from "devextreme/ui/form";
import dxList from "devextreme/ui/list";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";

import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { FeatureFile } from "../../../../../../libs/core/models/feature.model";
import { HomeItemService } from "../../../../../../libs/core/services/hom-item.serivce";
import "./home-items.view.scss";

@RazorView()
class HomeItemView extends Layout {
    attachmentList: dxList;
    attachments: FeatureFile[];
    homeItemContainer: JQuery<HTMLElement>;
    homeItemForm: dxForm;
    homeItemGrid: dxDataGrid;
    homeItemPopup: dxPopup;
    homeItemStore: CustomStore;
    imagePopup: dxPopup;
    inputFile: JQuery<HTMLElement>;
    isVisibleCheckBox: dxCheckBox;
    parentStore: CustomStore;
    constructor() {
        super("child");
        $("#header").find(".header-title >span").html("Quản lý cấu hình");

        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());

        this.attachments = [];
        this.homeItemContainer = $("#home-item-container");
        this.homeItemStore = new CustomStore({
            insert: (values) => {
                return HomeItemService.insert(values);
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
                args.take = loadOptions.take ? loadOptions.take : 25;

                HomeItemService.list(args).then(result => {
                    if (result && result.status === EnumStatus.OK) {
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
                return HomeItemService.delete({ id: key });
            },
            update: (key, values) => {
                return HomeItemService.insert(values);
            }
        });
        this.parentStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios.get("/api/home-items/root-items").then(result => {
                    if (result.data.status === EnumStatus.OK) {
                        deferred.resolve(result.data.data);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.initLayout();
    }

    private initLayout(): void {
        const self = this;

        this.homeItemPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.homeItemForm = $("<form />").appendTo(container)
                    .dxForm({
                        colCount: 1,
                        items: [{
                            colSpan: 1,
                            dataField: "order",
                            editorType: "dxNumberBox",
                            label: {
                                text: "Thứ tự",
                            }
                        }, {
                            colSpan: 1,
                            dataField: "name",
                            label: {
                                text: "Tên chức năng",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên chức năng",
                                type: "required"
                            }]
                        }, {
                            dataField: "url",
                            label: {
                                text: "Đường dẫn",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập đường dẫn",
                                type: "required"
                            }]
                        }, {
                            dataField: "visible",
                            editorType: "dxCheckBox",
                            label: {
                                text: "Hiển thị",
                            }
                        }, {
                            dataField: "parent_id",
                            editorOptions: {
                                dataSource: this.parentStore,
                                displayExpr: "name",
                                onContentReady: (e) => {
                                    e.element.find(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        $ele.attr("title", $ele.text());
                                    });
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                searchMode: "contains",
                                valueExpr: "id"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Chức năng cha",
                            },
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "before",
                                            options: {
                                                onClick: () => {
                                                    this.inputFile.trigger("click");
                                                },
                                                stylingMode: "contained",
                                                text: "Thêm biểu tượng",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }, {
                            template: (itemData, itemElement) => {
                                this.attachmentList = $("<div >").appendTo(itemElement).dxList({
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
                                                this.attachments = [];
                                                this.attachmentList.getDataSource().reload();
                                            });
                                    }
                                }).dxList("instance");
                            }
                        }, {
                            colSpan: 1,
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 1,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.homeItemForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.homeItemForm.option("formData");
                                                        data.icon = $(".file-preview-image").attr("src");
                                                        HomeItemService.insert(data).then((result) => {
                                                            this.homeItemGrid.getDataSource().reload();
                                                            this.homeItemPopup.hide();
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
                                                    this.homeItemPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }],
                        onContentReady: () => {
                        },
                        scrollingEnabled: true,
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onHiding: (e) => {
                this.attachments = [];
                this.attachmentList.getDataSource().reload();
                this.homeItemForm.resetValues();
            },
            onOptionChanged: () => {
            },
            position: {
                at: "center",
                my: "center",
                of: window
            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Thông tin chức năng",
            width: 500,
        }).dxPopup("instance");

        this.inputFile = $("<input type=\"file\" accept=\"image/*\" style=\"display:none !important\" />")
            .appendTo("body")
            .on("change", (e) => {
                for (let i = 0; i < e.target["files"].length; i++) {
                    const file = e.target["files"][i];
                    this.attachments = [];
                    this.attachments.push({
                        extension: file.name.substring(file.name.lastIndexOf(".")),
                        image_name: file.name,
                        mime_type: file.type,
                        raw: file,
                        size: file.size,
                        uid: OGUtils.uuidv4()
                    });
                }
                this.attachmentList.getDataSource().reload();
            });

        this.homeItemGrid = $("<div />").appendTo(this.homeItemContainer).dxDataGrid({
            columnAutoWidth: true,
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.homeItemGrid.pageIndex();
                    const pageSize = this.homeItemGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.rowIndex + 1}`);
                },
                dataField: "index",
                width: 50,
            }, {
                alignment: "center",
                caption: "Thứ tự",
                dataField: "order",
                width: 70,
            }, {
                alignment: "center",
                caption: "Icon",
                cellTemplate: function (container, options) {
                    const srcImg = options.value;
                    $("<div>")
                        .append($("<img>", { "class": "img-responsive", "src": srcImg }))
                        .appendTo(container)
                        .click(function () {
                            self.imagePopup = $("<div />").appendTo(container).dxPopup({
                                contentTemplate: (container) => {
                                    $("<div>")
                                        .append($("<img>", { "src": srcImg }))
                                        .appendTo(container);
                                },
                                deferRendering: false,
                                dragEnabled: false,
                                height: "auto",
                                hideOnOutsideClick: true,
                                onOptionChanged: (e) => {
                                },
                                position: {
                                    at: "center",
                                    my: "center",
                                    of: window
                                },
                                resizeEnabled: false,
                                shading: true,
                                showCloseButton: true,
                                showTitle: false,
                                visible: true,
                                width: "auto"
                            }).dxPopup("instance");
                        });
                },
                dataField: "icon",
                width: 50
            }, {
                caption: "Chức năng cha",
                dataField: "parent_name",
                groupCellTemplate: (element, info) => {
                    if (info.text != null && info.text != "") {
                        element.append("<span>" + info.text + "</span>");
                    } else {
                        element.append("<span>Chức năng gốc</span>");
                    }
                },
                groupIndex: 0,
            }, {
                caption: "Tên chức năng",
                dataField: "name"
            }, {
                caption: "Địa chỉ liên kết",
                cellTemplate: function (element, info) {
                    if (info.text != null && info.text != "") {
                        element.append("<a href='" + info.text + "'>" + info.text + "</a>");
                    }
                },
                dataField: "url"
            }, {
                caption: "Hiển thị",
                cellTemplate: (container, options) => {
                    self.isVisibleCheckBox = $("<div />").appendTo(container).dxCheckBox({
                        disabled: true,
                        value: options.data.visible
                    }).dxCheckBox("instance");
                },
                dataField: "visible",
                width: 100
            }, {
                caption: "Quyền truy cập",
                dataField: "permission",
                width: 100
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div />").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                hint: "Chỉnh sửa",
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    if (options.data.icon) {
                                        $(".file-preview-image").attr("src", options.data.icon);
                                        fetch(options.data.icon.toString()).then(response => {
                                            response.blob().then(data => {
                                                this.attachments.push({
                                                    extension: data.type,
                                                    image_name: options.data.name,
                                                    mime_type: data.type,
                                                    raw: new File([data], options.data.name, {
                                                        type: data.type
                                                    }),
                                                    size: data.size,
                                                    uid: OGUtils.uuidv4()
                                                });
                                                this.attachmentList.getDataSource().reload();
                                            });
                                        });
                                    }
                                    this.homeItemForm.option("formData", options.data);
                                    this.homeItemPopup.show();
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }]
                    });
                },
                dataField: "id",
                width: 100
            }],
            dataSource: {
                store: this.homeItemStore,
            },
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        dataField: "order",
                        editorOptions: {
                            max: 100,
                            min: 1,
                            showSpinButtons: true
                        },
                        editorType: "dxNumberBox"
                    }, {
                        dataField: "name",
                        editorType: "dxTextBox",
                    }, {
                        dataField: "url",
                        editorType: "dxTextBox",
                    }, {
                        dataField: "visible",
                        editorType: "dxCheckBox"
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin cấu hình",
                    width: 400
                },
                texts: {
                    cancelRowChanges: "Hủy",
                    saveRowChanges: "Lưu",
                }
            },
            errorRowEnabled: false,
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onContentReady: (e) => {
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;
                e.toolbarOptions.items.unshift({
                    location: "after",
                    options: {
                        onClick: () => {
                            this.homeItemForm.option("formData", {});
                            this.homeItemPopup.show();
                        },
                        text: "Thêm chức năng",
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
                allowedPageSizes: [25, 50, 100],
                infoText: "{2} bản ghi",
                showInfo: true,
                showNavigationButtons: true,
                showPageSizeSelector: true,
                visible: true
            },
            paging: {
                enabled: true,
                pageSize: 20
            },
            remoteOperations: {
                filtering: true,
                groupPaging: false,
                paging: true,
                sorting: true
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
            width: "100%"
        }).dxDataGrid("instance");
    }
    protected onInit(): void {

    }
}