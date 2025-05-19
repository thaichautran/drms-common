import axios, { Axios } from "axios";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxButton from "devextreme/ui/button";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/html_editor";
import DxHtmlEditor from "devextreme/ui/html_editor";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import "devextreme/ui/toolbar";
import "devextreme/ui/tree_view";
import dxTreeView from "devextreme/ui/tree_view";
import { disable } from "ol/rotationconstraint";

import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { HDSDModel } from "../../../../../../libs/core/models/hdsd.model";
import { HDSDService } from "../../../../../../libs/core/services/hdsd.service";
import "./hdsd.view.scss";

@RazorView()
class HDSDView extends Layout {
    HDSDForm: dxForm;
    HDSDPopup: dxPopup;
    HDSDStore: CustomStore;
    createButton: dxButton;
    grid: dxDataGrid;
    gridContainer: JQuery<HTMLElement>;
    parentId: number;
    tree: dxTreeView;
    treeContainer: JQuery<HTMLElement>;
    constructor() {
        super("child");
    }

    private initHDSD(): void {
        this.tree = $("<div />")
            .appendTo(this.treeContainer)
            .dxTreeView({
                dataSource: {
                    store: new CustomStore({
                        key: "id",
                        load: () => {
                            const def = $.Deferred();
                            axios(HDSDService.BASE_URL + "/trees").then(xhr => {
                                if (xhr.data.status === EnumStatus.OK) {
                                    def.resolve({
                                        data: xhr.data.data.filter(x => x.id),
                                        totalCount: xhr.data.data.filter(x => x.id).length
                                    });
                                } else {
                                    this.grid.option("disabled", true);
                                    def.resolve({
                                        data: [],
                                        totalCount: 0
                                    });
                                }
                            });
                            return def;
                        }
                    })
                },
                displayExpr: "text",
                height: "100%",
                itemTemplate: (itemData, itemIndex, element) => {
                    element.append("<i class=\"dx-icon icon icon-menu-1\"></i>");
                    element.append("<span>" + itemData.text + "</span>");
                },
                keyExpr: "id",
                noDataText: "Không có dữ liệu hướng dẫn nào",
                onItemClick: (e) => {
                    this.grid.getDataSource().reload();
                },
                searchEnabled: true,
                selectByClick: true,
                selectionMode: "single",
                virtualModeEnabled: true
            }).dxTreeView("instance");

        // this.HDSDPopup = $("<div />").appendTo("body").dxPopup({
        //     contentTemplate: (container) => {
        //         this.HDSDForm = $("<div />").appendTo(container)
        //             .dxForm({
        //                 formData: {
        //                     ConfirmPassword: "",
        //                     Email: "",
        //                     FullName: "",
        //                     Password: "",
        //                     PhoneNumber: "",
        //                     Role: "",
        //                     UserName: ""
        //                 },
        //                 items: [{
        //                     dataField: "mo_ta",
        //                     label: {
        //                         text: "Mô tả (Tiếng Việt)",
        //                     },
        //                     validationRules: [{
        //                         message: "Vui lòng nhập mô tả hướng dẫn sử dụng",
        //                         type: "required"
        //                     }]
        //                 }, {
        //                     dataField: "mo_ta_en",
        //                     label: {
        //                         text: "Mô tả (Tiếng Anh)",
        //                     },
        //                     visible: false
        //                 }, {
        //                     template: () => {
        //                         return "<hr style=\"margin: 5px 0;\" />";
        //                     }
        //                 }, {
        //                     template: (itemData, itemElement) => {
        //                         $("<div />").appendTo(itemElement)
        //                             .dxToolbar({
        //                                 items: [{
        //                                     location: "center",
        //                                     options: {
        //                                         onClick: () => {
        //                                             const validate = this.HDSDForm.validate();
        //                                             if (validate && validate.brokenRules.length === 0) {
        //                                                 const data = this.HDSDForm.option("formData");
        //                                                 data.type_id = this.parentId;
        //                                                 if (data.type_id > 0) {
        //                                                     HDSDService.insert(data).then(result => {
        //                                                         if (result.status === EnumStatus.OK) {
        //                                                             this.grid.getDataSource().reload();
        //                                                             this.HDSDForm.resetValues();
        //                                                         }
        //                                                         this.HDSDPopup.hide();
        //                                                     });
        //                                                 } else {
        //                                                     OGUtils.alert("Vui lòng chọn loại hướng dẫn sử dụng");
        //                                                 }
        //                                             }
        //                                         },
        //                                         stylingMode: "contained",
        //                                         text: "Lưu",
        //                                         type: "default"
        //                                     },
        //                                     widget: "dxButton"
        //                                 }, {
        //                                     location: "center",
        //                                     options: {
        //                                         onClick: () => {
        //                                             this.HDSDPopup.hide();
        //                                         },
        //                                         stylingMode: "contained",
        //                                         text: "Hủy",
        //                                         type: "danger"
        //                                     },
        //                                     widget: "dxButton"
        //                                 }]
        //                             });
        //                     }

        //                 }],
        //                 labelLocation: "top"
        //             }).dxForm("instance");
        //     },
        //     deferRendering: false,
        //     dragEnabled: false,
        //     height: "auto",
        //     hideOnOutsideClick: false,
        //     onOptionChanged: () => {

        //     },
        //     resizeEnabled: false,
        //     shading: true,
        //     showCloseButton: false,
        //     showTitle: true,
        //     toolbarItems: [{
        //         location: "center",
        //         text: "Thêm hướng dẫn sử dụng"
        //     },],
        //     width: 400,
        // }).dxPopup("instance");

        this.grid = this.gridContainer.dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: false,
            columns: [{
                alignment: "center",
                caption: "Thứ tự",
                dataField: "order_id",
                width: 50,
            }, {
                caption: "Tiêu đề",
                dataField: "tieu_de"
            }, {
                caption: "Cấp",
                dataField: "title_level",
                lookup: {
                    dataSource: {
                        store: new ArrayStore({
                            data: [{
                                text: "Cấp 1",
                                value: 1
                            }, {
                                text: "Cấp 2",
                                value: 2
                            },],
                            key: "value"
                        })
                    },
                    displayExpr: "text",
                    valueExpr: "value"
                }
            }, {
                caption: "Nội dung",
                dataField: "noi_dung",
                encodeHtml: false,
                visible: false,
            }, {
                caption: "HDSD cha",
                dataField: "parent_id",
                lookup: {
                    dataSource: {
                        store: new CustomStore({
                            byKey: (key) => {
                                return HDSDService.get(key);
                            },
                            key: "id",
                            load: async (loadOptions) => {
                                const deferred = $.Deferred(),
                                    args: { [key: string]: number | string } = {};

                                args.length = -1;
                                args.titleLevel = 1;
                                HDSDService.list(args).then(result => {
                                    if (result.status === EnumStatus.OK) {
                                        deferred.resolve({
                                            data: result.data,
                                            totalCount: result.data.length
                                        });
                                    }
                                });
                                return deferred.promise();
                            },
                        })
                    },
                    displayExpr: "tieu_de",
                    valueExpr: "id",
                },
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            options: {
                                hint: "Chỉnh sửa",
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    this.grid.editRow(options.rowIndex);
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {
                            options: {
                                disabled: options.data.permanent,
                                hint: "Xóa",
                                icon: "icon icon-trash",
                                onClick: () => {
                                    OGUtils.confirm("Xóa hướng dẫn sử dụng này?").then(value => {
                                        if (value) {
                                            options.component.getDataSource().store().remove(options.value).then(() => {
                                                options.component.getDataSource().reload();
                                            });
                                        }
                                    });
                                },
                                type: "danger"
                            },
                            widget: "dxButton"
                        },]
                    });
                },
                dataField: "id",
                width: 180,
            }],
            dataSource: new DataSource({
                store: this.HDSDStore
            }),
            disabled: false,
            editing: {
                form: {
                    colCount: 2,
                    items: [
                        {
                            dataField: "order_id",
                            editorType: "dxNumberBox"
                        },
                        {
                            dataField: "tieu_de",
                            validationRules: [{
                                message: "Vui lòng mô tả hướng dẫn sử dụng",
                                type: "required",
                            }],
                        },
                        {
                            dataField: "title_level",
                            // editorOptions: {
                            //     dataSource: [{
                            //         text: "Cấp 1",
                            //         value: 1
                            //     }, {
                            //         text: "Cấp 2",
                            //         value: 2
                            //     },],
                            //     displayExpr: "text",
                            //     placeholder: "[Chọn...]",
                            //     value: "",
                            //     valueExpr: "value"
                            // },
                            // editorType: "dxSelectBox",
                        },
                        {
                            dataField: "parent_id",
                        },
                        {
                            colSpan: 2,
                            dataField: "noi_dung",
                            editorOptions: {
                                height: 500,
                                imageUpload: {
                                    fileUploadMode: "base64",
                                    tabs: ["file", "url"],
                                },
                                mediaResizing: {
                                    enabled: true,
                                },
                                toolbar: {
                                    items: [
                                        "undo", "redo", "separator",
                                        {
                                            acceptedValues: ["8pt", "10pt", "12pt", "14pt", "18pt", "24pt", "36pt"],
                                            name: "size",
                                            options: { inputAttr: { "aria-label": "Font size" } },
                                        },
                                        {
                                            acceptedValues: ["Arial", "Courier New", "Georgia", "Impact", "Lucida Console", "Tahoma", "Times New Roman", "Verdana"],
                                            name: "font",
                                            options: { inputAttr: { "aria-label": "Font family" } },
                                        },
                                        "separator", "bold", "italic", "strike", "underline", "separator",
                                        "alignLeft", "alignCenter", "alignRight", "alignJustify", "separator",
                                        "orderedList", "bulletList", "separator",
                                        {
                                            acceptedValues: [false, 1, 2, 3, 4, 5],
                                            name: "header",
                                            options: { inputAttr: { "aria-label": "Header" } },
                                        }, "separator",
                                        "color", "background", "separator",
                                        "link", "image", "separator",
                                        "clear", "blockquote", "separator",
                                        "insertTable", "deleteTable",
                                        "insertRowAbove", "insertRowBelow", "deleteRow",
                                        "insertColumnLeft", "insertColumnRight", "deleteColumn",
                                    ],
                                },
                                valueType: "markUp",
                            },
                            editorType: "dxHtmlEditor",
                        },
                    ]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin hướng dẫn sử dụng",
                    width: "auto"
                },
                texts: {
                    cancelRowChanges: "Hủy",
                    saveRowChanges: "Lưu",
                },
                useIcons: false
            },
            errorRowEnabled: false,
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            masterDetail: {
                enabled: true,
                template(container, options) {
                    $("<div>")
                        .addClass("master-detail-caption")
                        .text("Nội dung")
                        .appendTo(container);
                    $("<div>")
                        .dxHtmlEditor({
                            readOnly: true,
                            value: options.data.noi_dung,
                            valueType: "html"
                        }).appendTo(container);
                },
            },
            noDataText: "Không có dữ liệu",
            onRowPrepared: function (e) {
                if (e.rowType == "data") {
                    e.rowElement.find(".dx-datagrid-group-closed").append("<i title='Chi tiết nội dung' class='icon icon-add' aria-hidden='true''></i>");
                    e.rowElement.find(".dx-datagrid-group-opened").append("<i title='Đóng' class='icon icon-minus' aria-hidden='true''></i>");
                }
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;
                e.toolbarOptions.items.unshift({
                    location: "after",
                    options: {
                        disabled: true,
                        icon: "icon icon-user-add",
                        onClick: () => {
                            dataGrid.addRow();
                        },
                        onContentReady: (e) => {
                            this.createButton = e.component;
                        },
                        text: "Thêm hướng dẫn sử dụng",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        icon: "icon icon-refresh",
                        location: "after",
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
            searchPanel: {
                visible: true
            },
            selection: {
                mode: "single",
                showCheckBoxesMode: "none"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",
        }).dxDataGrid("instance");
    }
    onInit(): void {
        $("body").removeClass("fit-on");
        $("#header").find(".header-title >span").html("Hướng dẫn sử dụng");
        this.gridContainer = $("#hdsd-container");
        this.treeContainer = $("#hdsd-tree-container");

        this.HDSDStore = new CustomStore<HDSDModel, number>({
            byKey: (key: number) => {
                return HDSDService.get(key);
            },
            insert: (values) => {
                if (!values.parent_id) {
                    values.parent_id = this.parentId;
                }
                return HDSDService.insert(values);
            },
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred(),
                    args: { [key: string]: number | object | string } = {};

                if (loadOptions.sort) {
                    args.sortField = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc) {
                        args.sortOrder = "desc";
                    }
                    else {
                        args.sortOrder = "asc";
                    }
                }
                args.search = {
                    value: loadOptions.searchValue
                };
                args.length = loadOptions.skip ? loadOptions.skip : 0;
                args.start = loadOptions.take ? loadOptions.take : 50;
                if (this.tree) {
                    const selectedNode = this.tree.getSelectedNodes();
                    if (selectedNode && selectedNode.length > 0) {
                        this.parentId = selectedNode[0].itemData.id as number;
                        args.parentId = this.parentId;
                        if (this.createButton) {
                            this.createButton.option("disabled", false);
                        }
                        HDSDService.list(args).then(result => {
                            if (result.status === EnumStatus.OK) {
                                deferred.resolve({
                                    data: result.data,
                                    totalCount: result.data.length
                                });
                            }
                        });
                    } else {
                        if (this.createButton) {
                            this.createButton.option("disabled", true);
                        }
                        deferred.resolve({
                            data: [],
                            totalCount: 0
                        });
                    }
                } else {
                    deferred.resolve({
                        data: [],
                        totalCount: 0
                    });
                }
                return deferred.promise();
            },
            remove: (key) => {
                return HDSDService.delete({ id: key });
            },
            update: (key, values) => {
                return HDSDService.update(values);
            }
        });

        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight() - 15);
        this.treeContainer = $("<div />").appendTo(this.treeContainer).height("90%").width("100%").css("padding-top", "5px");
        this.gridContainer = $("<div />").appendTo(this.gridContainer).height("100%").css("border-left", "1px solid #ddd");
        this.initHDSD();
    }
}
