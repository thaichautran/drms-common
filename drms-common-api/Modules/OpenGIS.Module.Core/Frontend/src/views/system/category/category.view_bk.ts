import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import "devextreme/ui/tree_view";
import dxTreeView from "devextreme/ui/tree_view";

import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { CategoryService } from "../../../../../../libs/core/services/category.service";
import "./category.view.scss";

@RazorView()
class CategoryView extends Layout {
    categoryForm: dxForm;
    categoryPopup: dxPopup;
    categoryStore: CustomStore;
    categoryTypeID: number;
    grid: dxDataGrid;
    gridContainer: JQuery<HTMLElement>;
    tree: dxTreeView;
    treeContainer: JQuery<HTMLElement>;
    constructor() {
        super("child");
    }

    private initCategory(): void {
        this.tree = $("<div />")
            .appendTo(this.treeContainer)
            .dxTreeView({
                dataSource: {
                    store: new CustomStore({
                        key: "id",
                        load: () => {
                            const def = $.Deferred();
                            axios("/api/category/trees").then(xhr => {
                                if (xhr.data.status === EnumStatus.OK) {
                                    def.resolve({
                                        data: xhr.data.data,
                                        totalCount: xhr.data.data.length
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
                noDataText: "Không có danh mục nào",
                onItemClick: (e) => {
                    if (e.itemData && e.itemData.type === "@table") {
                        this.grid.getDataSource().reload();
                    } 
                },
                searchEnabled: true,
                selectByClick: true,
                selectionMode: "single",
                virtualModeEnabled: true
            }).dxTreeView("instance");

        this.categoryPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.categoryForm = $("<div />").appendTo(container)
                    .dxForm({
                        formData: {
                            ConfirmPassword: "",
                            Email: "",
                            FullName: "",
                            Password: "",
                            PhoneNumber: "",
                            Role: "",
                            UserName: ""
                        },
                        items: [{
                            dataField: "mo_ta",
                            label: {
                                text: "Mô tả (Tiếng Việt)",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập mô tả danh mục",
                                type: "required"
                            }]
                        }, {
                            dataField: "mo_ta_en",
                            label: {
                                text: "Mô tả (Tiếng Anh)",
                            },
                            visible: false
                        }, {
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.categoryForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.categoryForm.option("formData");
                                                        data.type_id = this.categoryTypeID;
                                                        if (data.type_id > 0) {
                                                            CategoryService.insert(data).then(result => {
                                                                if(result.status === EnumStatus.OK){
                                                                    this.grid.getDataSource().reload();
                                                                    this.categoryForm.resetValues();
                                                                }
                                                                this.categoryPopup.hide();
                                                            });
                                                        } else {
                                                            OGUtils.alert("Vui lòng chọn loại danh mục");
                                                        }
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
                                                    this.categoryPopup.hide();
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
                        labelLocation: "top"
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
            toolbarItems: [{
                location: "center",
                text: "Thêm danh mục"
            },],
            width: 400,
        }).dxPopup("instance");

        this.grid = this.gridContainer.dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: false,
            columnChooser: {
                enabled: true,
                mode: "select"
            },
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.grid.pageIndex();
                    const pageSize = this.grid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.rowIndex + 1}`);
                },
                dataField: "index",
                width: 50,
            }, {
                caption: "Mô tả",
                dataField: "mo_ta"
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
                                    OGUtils.confirm("Xóa danh mục này?").then(value => {
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
                store: this.categoryStore
            }),
            disabled: false,
            editing: {
                form: {
                    colCount: 1,
                    items: [
                        {
                            dataField: "mo_ta",
                            validationRules: [{
                                message: "Vui lòng mô tả danh mục",
                                type: "required",
                            }],
                        },]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin danh mục",
                    width: 400
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
            noDataText: "Không có dữ liệu",
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;
                e.toolbarOptions.items.unshift({
                    location: "after",
                    options: {
                        icon: "icon icon-user-add",
                        onClick: () => {
                            this.categoryPopup.show();
                            this.categoryForm.resetValues();
                        },
                        text: "Thêm danh mục",
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
        $("#header").find(".header-title >span").html("Quản lý danh mục");
        this.gridContainer = $("#category-container");
        this.treeContainer = $("#category-tree-container");
        
        this.categoryStore = new CustomStore({
            insert: (values) => {
                return CategoryService.insert(values);
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
                if (this.tree) {
                    const selectedNode = this.tree.getSelectedNodes();
                    if (selectedNode && selectedNode.length > 0) {
                        this.categoryTypeID = selectedNode[0].itemData.id as number;
                        CategoryService.list(this.categoryTypeID).then(result => {
                            if(result.status === EnumStatus.OK) {
                                deferred.resolve({
                                    data: result.data,
                                    totalCount: result.data.length
                                });
                            }
                        });
                    } else {
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
                const data = {
                    id: key,
                    type_id: this.categoryTypeID,
                }; 
                return CategoryService.delete(data);
            },
            update: (key, values) => {
                return CategoryService.insert(values);
            }
        });

        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight() - 15);
        this.treeContainer = $("<div />").appendTo(this.treeContainer).height("90%").width("100%").css("padding-top", "5px");
        this.gridContainer = $("<div />").appendTo(this.gridContainer).height("100%").css("border-left", "1px solid #ddd");
        this.initCategory();
    }
}
