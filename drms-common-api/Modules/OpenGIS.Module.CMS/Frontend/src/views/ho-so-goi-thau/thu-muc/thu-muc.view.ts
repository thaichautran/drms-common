import axios from "axios";
import { LoadOptions } from "devextreme/data";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxDataGrid, { EditorPreparingEvent } from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import dxFileUploader from "devextreme/ui/file_uploader";
import "devextreme/ui/file_uploader";
import dxForm from "devextreme/ui/form";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import Handlebars from "handlebars";

import { SwitchModuleWindowComponent } from "../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { RestData } from "../../../../../../libs/core/models/base-response.model";
import { ThuMucDinhKemModel, ThuMucModel } from "../../../../../../libs/core/models/qlhs/thu-muc.model";
import { ThuMucDinhKemService, ThuMucService } from "../../../../../../libs/core/services/thu-muc.service";
import { UploadService } from "../../../../../../libs/core/services/upload.service";
@RazorView()
class ThuMucView extends Layout {
    attachmentGrid: dxDataGrid<ThuMucDinhKemModel, number>;
    attachmentPopup: dxPopup;
    createSchemaForm: dxForm;
    dxAttachmentUpload: dxFileUploader;
    folderGrid: dxDataGrid<ThuMucModel, number>;
    folderId: number = 0;
    moveFolderPopup: dxPopup;
    moveTableForm: dxForm;
    switchModule: SwitchModuleWindowComponent;
    tableSchema: string;
    tableSchemaStore: CustomStore;
    tableViews: dxMultiView;
    tableViewsContainer: JQuery<HTMLElement>;
    constructor() {
        super("child", "Quản lý hồ sơ gói thầu dự án");
    }
    private initGridView(): void {
        this.tableViews = this.tableViewsContainer.dxMultiView({
            deferRendering: false,
            //height: "100%",
            items: [{
                template: (itemData, itemIndex, itemElement) => {
                    this.folderGrid = $("<div />").appendTo(itemElement).dxDataGrid({
                        allowColumnReordering: true,
                        allowColumnResizing: true,
                        columnChooser: {
                            enabled: true,
                            mode: "select",
                        },
                        columns: [{
                            alignment: "center",
                            allowFiltering: false,
                            allowSearch: false,
                            allowSorting: false,
                            caption: "#",
                            cellTemplate: (container, options) => {
                                const pageIndex = this.folderGrid.pageIndex();
                                const pageSize = this.folderGrid.pageSize();
                                container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                            },
                            visible: true,
                            width: 50,
                        }, {
                            caption: "Mô tả",
                            dataField: "mo_ta",
                            sortIndex: 0,
                            sortOrder: "asc",
                        }, {
                            alignment: "center",
                            allowEditing: false,
                            allowFiltering: false,
                            allowSearch: false,
                            allowSorting: false,
                            caption: "Thao tác",
                            cellTemplate: (container, options) => {
                                $("<div>").appendTo(container).dxToolbar({
                                    items: [
                                        // {

                                        //     options: {
                                        //         hint: "Di chuyển",
                                        //         icon: "icon icon-3d-rotate",
                                        //         onClick: () => {
                                        //             this.moveTableForm.option("formData", options.data);
                                        //             this.moveFolderPopup.show();
                                        //         },
                                        //         type: "default"
                                        //     },
                                        //     widget: "dxButton"
                                        // },
                                        {

                                            options: {
                                                hint: "Chỉnh sửa",
                                                icon: "icon icon-edit-2",
                                                onClick: () => {
                                                    this.folderGrid.editRow(options.rowIndex);
                                                },
                                                type: "success"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            options: {
                                                // disabled: options.data.permanent,
                                                hint: "Xoá",
                                                icon: "icon icon-trash",
                                                onClick: () => {
                                                    OGUtils.confirm("Xóa thư mục sẽ xóa các tệp đính kèm của thư mục này. Xác nhận xóa?").then(value => {
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
                                        }, {
                                            options: {
                                                onClick: () => {
                                                    this.folderId = options.data.id;
                                                    this.attachmentGrid.getDataSource().reload();
                                                    this.tableViews.option("selectedIndex", 1);
                                                },
                                                text: "Tệp đính kèm",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }]
                                });
                            },
                            dataField: "id",
                            width: 300,
                        }],
                        dataSource: new CustomStore<ThuMucModel, number>({
                            byKey: (key: number) => {
                                return ThuMucService.get(key);
                            },
                            insert: (values) => {
                                return ThuMucService.insert(values);
                            },
                            key: "id",
                            load: (loadOptions: LoadOptions<ThuMucModel>) => {
                                return new Promise((resolve) => {
                                    ThuMucService.list(loadOptions).then(result => {
                                        if (result) {
                                            resolve({
                                                data: result.data,
                                                totalCount: result.recordsTotal
                                            });
                                        } else {
                                            resolve({
                                                data: [],
                                                totalCount: 0
                                            });
                                        }
                                    });
                                });
                            },
                            remove: (key: number) => {
                                return ThuMucService.delete({ id: key });
                            },
                            update: (key: number, values: ThuMucModel) => {
                                return ThuMucService.update(values);
                            }
                        }),
                        editing: {
                            form: {
                                colCount: 1,
                                items: [{
                                    dataField: "mo_ta",
                                    editorOptions: {
                                        showClearButton: true,
                                    },
                                    validationRules: [{
                                        message: "Vui lòng nhập mô tả",
                                        type: "required",
                                    }]
                                },],
                            },
                            mode: "popup",
                            popup: {
                                height: "auto",
                                showTitle: true,
                                title: "Thông tin thư mục",
                                width: 400,
                            },
                            useIcons: true
                        },
                        // filterRow: {
                        //     visible: true,
                        // },
                        height: "100%",
                        onRowUpdating: function (options) {
                            $.extend(options.newData, $.extend({}, options.oldData, options.newData));
                        },
                        pager: {
                            allowedPageSizes: [50, 100, 200],
                            showInfo: true,
                            showNavigationButtons: true,
                            showPageSizeSelector: true,
                            visible: true
                        },
                        paging: {
                            enabled: true,
                            pageSize: 50
                        },
                        remoteOperations: {
                            filtering: true,
                            groupPaging: false,
                            grouping: false,
                            paging: true,
                            sorting: true,
                            summary: false,
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
                        sorting: {
                            mode: "single",
                        },
                        toolbar: {
                            items: [
                                {
                                    location: "before",
                                    options: {
                                        icon: "icon icon-add",
                                        onClick: () => {
                                            this.folderGrid.addRow();
                                        },
                                        text: "Tạo mới thư mục",
                                        type: "default"
                                    },
                                    widget: "dxButton"
                                },
                                {
                                    location: "after",
                                    options: {
                                        hint: "Làm mới bảng",
                                        icon: "icon icon-refresh",
                                        onClick: () => {
                                            this.folderGrid.getDataSource().reload();
                                        }
                                    },
                                    widget: "dxButton"
                                }, "searchPanel"]
                        },
                        width: "100%"
                    }).dxDataGrid("instance");
                }
            }, {
                template: (itemData, itemIndex, itemElement) => {
                    this.attachmentGrid = $("<div />").appendTo(itemElement).dxDataGrid({
                        allowColumnReordering: true,
                        allowColumnResizing: true,
                        columnChooser: {
                            enabled: true,
                            mode: "select",
                        },
                        columns: [{
                            alignment: "center",
                            allowFiltering: false,
                            allowSearch: false,
                            allowSorting: false,
                            caption: "#",
                            cellTemplate: (container, options) => {
                                const pageIndex = this.attachmentGrid.pageIndex();
                                const pageSize = this.attachmentGrid.pageSize();
                                container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                            },
                            visible: true,
                            width: 50,
                        }, {
                            caption: "Tên tệp",
                            dataField: "file_name",
                            sortIndex: 0,
                            sortOrder: "asc",
                        }, {
                            alignment: "center",
                            allowEditing: false,
                            allowFiltering: false,
                            allowSearch: false,
                            allowSorting: false,
                            caption: "Thao tác",
                            cellTemplate: (container, options) => {
                                $("<div>").appendTo(container).dxToolbar({
                                    items: [
                                        {
                                            options: {
                                                hint: "Di chuyển",
                                                icon: "icon icon-3d-rotate",
                                                onClick: () => {
                                                    this.moveTableForm.option("formData", options.data);
                                                    this.moveFolderPopup.show();
                                                },
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        },
                                        {
                                            options: {
                                                hint: "Chỉnh sửa",
                                                icon: "icon icon-edit-2",
                                                onClick: () => {
                                                    this.attachmentGrid.editRow(options.rowIndex);
                                                },
                                                type: "success"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            options: {
                                                hint: "Xoá",
                                                icon: "icon icon-trash",
                                                onClick: () => {
                                                    OGUtils.confirm("Xác nhận xóa tệp đính kèm này?").then(value => {
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
                            width: 300,
                        }],
                        dataSource: new CustomStore<ThuMucDinhKemModel, number>({
                            byKey: (key: number) => {
                                return ThuMucDinhKemService.get(key);
                            },
                            insert: (values) => {
                                return ThuMucDinhKemService.insert(values);
                            },
                            key: "id",
                            load: (loadOptions: LoadOptions<ThuMucDinhKemModel>) => {
                                return new Promise((resolve) => {
                                    ThuMucDinhKemService.list(Object.assign(loadOptions, {
                                        thuMucId: this.folderId
                                    })).then(result => {
                                        if (result) {
                                            resolve({
                                                data: result.data,
                                                totalCount: result.recordsTotal
                                            });
                                        } else {
                                            resolve({
                                                data: [],
                                                totalCount: 0
                                            });
                                        }
                                    });
                                });
                            },
                            remove: (key: number) => {
                                return ThuMucDinhKemService.delete({ id: key });
                            },
                            update: (key: number, values: ThuMucModel) => {
                                return ThuMucDinhKemService.update(values);
                            }
                        }),
                        editing: {
                            form: {
                                colCount: 1,
                                items: [{
                                    dataField: "file_name",
                                    editorOptions: {
                                        showClearButton: true,
                                    },
                                    validationRules: [{
                                        message: "Vui lòng nhập tên tệp",
                                        type: "required",
                                    }]
                                },],
                            },
                            mode: "popup",
                            popup: {
                                height: "auto",
                                showTitle: true,
                                title: "Thông tin tệp đính kèm",
                                width: 400,
                            },
                            useIcons: true
                        },
                        filterRow: {
                            visible: true,
                        },
                        height: "100%",
                        // onEditorPreparing: (e: EditorPreparingEvent<ThuMucModel, number>) => {
                        //     if (e.parentType == "dataRow") {
                        //         if (!e.row.isNewRow && e.dataField === "table_name") {
                        //             e.editorOptions.readOnly = true;
                        //         }
                        //     }
                        // },
                        onRowUpdating: function (options) {
                            $.extend(options.newData, $.extend({}, options.oldData, options.newData));
                        },
                        pager: {
                            allowedPageSizes: [50, 100, 200],
                            showInfo: true,
                            showNavigationButtons: true,
                            showPageSizeSelector: true,
                            visible: true
                        },
                        paging: {
                            enabled: true,
                            pageSize: 50
                        },
                        remoteOperations: {
                            filtering: true,
                            groupPaging: false,
                            grouping: false,
                            paging: true,
                            sorting: true,
                            summary: false,
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
                        sorting: {
                            mode: "single",
                        },
                        toolbar: {
                            items: [
                                {
                                    location: "before",
                                    options: {
                                        icon: "icon icon-back-square",
                                        onClick: () => {
                                            this.tableViews.option("selectedIndex", 0);
                                        },
                                        text: "Quay lại",
                                        type: "danger"
                                    },
                                    widget: "dxButton"
                                },
                                {
                                    location: "before",
                                    options: {
                                        icon: "icon icon-add",
                                        onClick: () => {
                                            this.attachmentPopup.show();
                                        },
                                        text: "Thêm mới tệp đính kèm",
                                        type: "default"
                                    },
                                    widget: "dxButton"
                                },
                                {
                                    location: "after",
                                    options: {
                                        hint: "Làm mới bảng",
                                        icon: "icon icon-refresh",
                                        onClick: () => {
                                            this.attachmentGrid.getDataSource().reload();
                                        }
                                    },
                                    widget: "dxButton"
                                }, "searchPanel"]
                        },
                        width: "100%"
                    }).dxDataGrid("instance");
                }
            }],
            swipeEnabled: false
        }).dxMultiView("instance");
        this.tableViews.element().find(".dx-multiview-wrapper").css("border", "none");
    }
    private initLayout(): void {
        const self = this;
        this.attachmentPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.createSchemaForm = $("<form />").appendTo(container)
                    .dxForm({
                        formData: {
                            file_name: "",
                        },
                        items: [{
                            dataField: "file_name",
                            label: {
                                text: "Tên tệp",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên tệp",
                                type: "required",
                            },
                                // {
                                //     message: "Tên tệp không thế có kí tự đặc biệt",
                                //     type: "custom",
                                //     validationCallback: (params) => {
                                //         return OGUtils.isNormalize(params.value);
                                //     }
                                // }
                            ]
                        }, {
                            colSpan: 2,
                            dataField: "uploadFile",
                            label: {
                                showColon: false,
                                text: " ",
                            },
                            template: (itemData, itemElement) => {
                                itemElement.css("padding", "unset");
                                this.dxAttachmentUpload = $(itemElement)
                                    .dxFileUploader({
                                        accept: "image/jpeg,image/gif,image/png,application/pdf,image/x-eps,.pdf, .xls, .xlsx, .doc, .docx,.zip, .rar",
                                        height: "auto",
                                        labelText: "Hoặc kéo thả tệp vào đây",
                                        multiple: true,
                                        name: "files",
                                        onValueChanged: function (e) {
                                            const files = e.value;
                                            if (files.length > 0) {
                                                const file = files[0];
                                                self.createSchemaForm.option("formData", { file_name: file.name });
                                            }
                                        },
                                        readyToUploadMessage: "Đã sẵn sàng tải lên",
                                        selectButtonText: "Chọn tệp",
                                        uploadFailedMessage: "Tải lên thất bại",
                                        uploadMethod: "POST",
                                        uploadMode: "useForm",
                                        uploadedMessage: "Tải lên thành công"
                                    }).dxFileUploader("instance");
                            }
                        }, {
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            options: {
                                                onClick: () => {
                                                    const validate = this.createSchemaForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.createSchemaForm.option("formData");
                                                        const files = this.dxAttachmentUpload.option("value") as File[];
                                                        if (files.length) {
                                                            const file = files[0];
                                                            let promise = new Promise((resolve) => {
                                                                resolve(null);
                                                            });
                                                            const formData = new FormData();
                                                            formData.append("chunkContent", file);
                                                            const attachment: ThuMucDinhKemModel = {
                                                                file_name: data.file_name,
                                                                id: 0,
                                                                mime_type: file.type,
                                                                size: file.size,
                                                                thumuc_id: self.folderId,
                                                                url: "/"
                                                            };
                                                            if (file.type.includes("image")) {
                                                                promise = new Promise(function (resolve, reject) {
                                                                    UploadService.images(formData).then(response => {
                                                                        if (response.status === EnumStatus.OK) {
                                                                            attachment.store_file_name = (response as RestData<string[]>).data[0];
                                                                            attachment.url = UploadService.MEDIA_PATH + "/" + attachment.store_file_name;
                                                                            resolve(attachment);
                                                                        }
                                                                        else {
                                                                            reject(null);
                                                                        }
                                                                    });
                                                                });
                                                            }
                                                            else {
                                                                promise = new Promise(function (resolve, reject) {
                                                                    UploadService.documents(formData).then(response => {
                                                                        if (response.status === EnumStatus.OK) {
                                                                            attachment.store_file_name = (response as RestData<string[]>).data[0];
                                                                            attachment.url = UploadService.DOCUMENT_PATH + "/" + attachment.store_file_name;
                                                                            resolve(attachment);
                                                                        }
                                                                        else {
                                                                            reject(null);
                                                                        }
                                                                    });
                                                                });
                                                            }
                                                            promise.then(attachment => {
                                                                if (attachment) {
                                                                    OGUtils.showLoading();
                                                                    ThuMucDinhKemService.insert(attachment).then(() => {
                                                                        OGUtils.alert("Thêm mới thành công");
                                                                        self.attachmentGrid.getDataSource().reload();
                                                                        self.attachmentPopup.hide();
                                                                    });
                                                                }
                                                            });
                                                        }
                                                        else {
                                                            OGUtils.error("Vui lòng chọn ít nhất 1 tệp đính kèm");
                                                        }
                                                    }
                                                },
                                                text: "Lưu",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            options: {
                                                onClick: () => {
                                                    this.attachmentPopup.hide();
                                                },
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }],
                        scrollingEnabled: true
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onHidden: () => {
                self.attachmentPopup.option("formData", {});
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
            title: "Thêm mới tệp đính kèm",
            width: "500px",
        }).dxPopup("instance");

        this.moveFolderPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.moveTableForm = $("<form />").appendTo(container)
                    .dxForm({
                        formData: {
                            file_name: "",
                            id: 0,
                            mime_type: "",
                            size: 0,
                            store_file_name: "",
                            thumuc_id_new: 0,
                            url: "",
                        },
                        items: [{
                            dataField: "thumuc_id_new",
                            editorOptions: {
                                dataSource: new DataSource({
                                    store: new CustomStore({
                                        byKey: (key) => {
                                            const def = $.Deferred();
                                            if (key) {
                                                ThuMucService.get(key).then(folder => {
                                                    def.resolve(folder);
                                                });
                                            } else {
                                                def.resolve({});
                                            }
                                            return def;
                                        },
                                        key: "id",
                                        load: () => {
                                            const def = $.Deferred();
                                            $.get(ThuMucService.BASE_PATH + "?pageSize=-1").done(xhr => {
                                                if (xhr.status === EnumStatus.OK) {
                                                    def.resolve(xhr.data.filter(x => x.id !== self.folderId));
                                                } else {
                                                    def.resolve({});
                                                }
                                            });
                                            return def;
                                        },
                                        // loadMode: "raw"
                                    })
                                }),
                                displayExpr: "mo_ta",
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                searchExpr: ["mo_ta"],
                                searchMode: "contains",
                                valueExpr: "id",
                                width: 250
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Thư mục mới",
                            }
                        }, {
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {

                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{

                                            options: {
                                                onClick: () => {
                                                    const data = this.moveTableForm.option("formData");
                                                    OGUtils.showLoading();
                                                    data.thumuc_id = data.thumuc_id_new;
                                                    ThuMucDinhKemService.update(data).then(() => {
                                                        this.moveFolderPopup.hide();
                                                        OGUtils.hideLoading();
                                                        this.attachmentGrid.getDataSource().reload();
                                                    });
                                                },
                                                text: "Lưu",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {

                                            options: {
                                                onClick: () => {
                                                    this.moveFolderPopup.hide();
                                                },
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }],
                        scrollingEnabled: true
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
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
            title: "Chuyển tệp đính kèm sang thư mục khác",
            width: "400px",
        }).dxPopup("instance");
    }

    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());

        this.tableViewsContainer = $("#ho-so-goi-thau-container");
        this.switchModule = new SwitchModuleWindowComponent("table");
        this.initLayout();
        this.initGridView();
        // this.tableRelationView = new TableRelationsView(this.tableRelationContainer);
    }
}