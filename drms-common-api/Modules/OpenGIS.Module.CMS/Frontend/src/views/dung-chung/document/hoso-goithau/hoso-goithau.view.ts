import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import "devextreme/ui/date_box";
import dxFileUploader from "devextreme/ui/file_uploader";
import "devextreme/ui/file_uploader";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxList from "devextreme/ui/list";
import "devextreme/ui/list";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import "devextreme/ui/text_area";
import * as docx from "docx-preview";
import ExcelViewer from "excel-viewer";
import JsBarcode from "jsbarcode";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumDanhMucNhomHoSo, EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { RestData } from "../../../../../../../libs/core/models/base-response.model";
import { HoSoKySo, OGAttachmentModel, OGDanhMucModel, OGDocumentModel } from "../../../../../../../libs/core/models/document.model";
import { DocumentService } from "../../../../../../../libs/core/services/document.service";
import { HoSoKySoService } from "../../../../../../../libs/core/services/ho-so-ky-so.service";
import { UploadService } from "../../../../../../../libs/core/services/upload.service";

const allowedView = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];
class HoSoGoiThauView implements IBaseComponent {
    barCodePopup: dxPopup;
    coQuanBanHanhStore: CustomStore<OGDanhMucModel, number>;
    container: JQuery<HTMLElement>;
    docPreviewPopup: dxPopup;
    dxAttachmentUpload: dxFileUploader;
    fileList: dxList;
    fileUploadName: string;
    files: OGAttachmentModel[];
    hoSoGrid: dxDataGrid;
    infoHoSoForm: dxForm;
    infoPopup: dxPopup;
    kySoUpload: dxFileUploader;
    loaiHoSoStore: CustomStore<OGDanhMucModel, number>;
    nhomHoSoId: number;
    nhomHoSoStore: CustomStore<OGDanhMucModel, number>;
    previewContainer: JQuery<HTMLElement>;
    rowKey: number;
    sendNotifyForm: dxForm;
    sendNotifyPopup: dxPopup;
    statusUpload: boolean;
    taiLieuKySoPopup: dxPopup;
    tinhTrangHoSoStore: CustomStore;

    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.nhomHoSoId = EnumDanhMucNhomHoSo.HOSO_GOITHAU;
        this.initLayout();
    }


    private initHoSoGrid(container): void {
        const self = this;
        let keyword = "";
        let loai_hoso_id = 0;
        let coquan_banhanh_id = 0;
        let start_date = undefined;
        let end_date = undefined;
        self.files = [];
        this.taiLieuKySoPopup = $("<div />").appendTo("body")
            .dxPopup({
                contentTemplate: (container) => {
                    this.kySoUpload = $(container)
                        .dxFileUploader({
                            accept: "image/jpeg,image/gif,image/png,application/pdf,image/x-eps,.pdf, .xls, .xlsx, .doc, .docx,.zip, .rar",
                            height: "auto",
                            labelText: "Hoặc kéo thả tệp vào đây",
                            multiple: false,
                            name: "files",
                            onValueChanged: function (e) {

                            },
                            readyToUploadMessage: "Đã sẵn sàng tải lên",
                            selectButtonText: "Chọn tệp",
                            uploadFailedMessage: "Tải lên thất bại",
                            uploadMethod: "POST",
                            uploadMode: "useForm",
                            uploadedMessage: "Tải lên thành công"
                        }).dxFileUploader("instance");
                },
                deferRendering: false,
                dragEnabled: true,
                height: "auto",
                hideOnOutsideClick: false,
                shading: false,
                showTitle: true,
                title: "Hồ sơ ký số",
                toolbarItems: [{
                    location: "center",
                    options: {
                        onClick: () => {
                            const files = this.kySoUpload.option("value");
                            if (files.length === 0) {
                                OGUtils.alert("Vui lòng chọn file", "Thông báo!");
                                return false;
                            }
                            else {
                                const files = this.kySoUpload.option("value") as File[];
                                if (files.length) {
                                    const file = files[0];
                                    let promise = new Promise((resolve) => {
                                        resolve(null);
                                    });
                                    const formData = new FormData();
                                    formData.append("chunkContent", file);
                                    const attachment: HoSoKySo = {
                                        file_name: file.name,
                                        hoso_id: self.rowKey,
                                        id: 0,
                                        mime_type: file.type,
                                        size: file.size,
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
                                            HoSoKySoService.insert(attachment).then(() => {
                                                setTimeout(() => {
                                                    OGUtils.alert("Thêm tài liệu ký số thành công");
                                                    self.taiLieuKySoPopup.hide();
                                                }, 2000);
                                            });
                                        }
                                    });
                                }
                            }
                        },
                        text: "Tải lên",
                        type: "default"
                    },
                    toolbar: "bottom",
                    widget: "dxButton"
                }, {
                    location: "center",
                    options: {
                        onClick: () => {
                            self.kySoUpload.reset();
                            self.taiLieuKySoPopup.hide();
                        },
                        text: "Hủy bỏ",
                        type: "danger"
                    },
                    toolbar: "bottom",
                    widget: "dxButton"
                }],
                width: 450
            }).dxPopup("instance");
        this.sendNotifyPopup = $("<div />").appendTo("body")
            .dxPopup({
                contentTemplate: (container) => {
                    this.sendNotifyForm = $("<div />").appendTo(container)
                        .dxForm({
                            items: [{
                                dataField: "userId",
                                editorOptions: {
                                    dataSource: {
                                        store: new CustomStore({
                                            byKey: (key) => {
                                                const deferred = $.Deferred();
                                                axios.get("/api/co-quan-ban-hanh/" + key.toString()).then(xhr => {
                                                    if (xhr.data && xhr.data.status === "OK") {
                                                        deferred.resolve(xhr.data.data);
                                                    }
                                                    deferred.resolve({});
                                                });
                                                return deferred;
                                            },
                                            key: "id",
                                            load: () => {
                                                const deferred = $.Deferred();
                                                axios.get("/api/user/list/user-tokens").then(xhr => {
                                                    if (xhr.data && xhr.data.status === EnumStatus.OK) {
                                                        deferred.resolve(xhr.data.data);
                                                    }
                                                    deferred.resolve({});
                                                });
                                                return deferred;
                                            }
                                        })
                                    },
                                    displayExpr: "full_name",
                                    noDataText: "Không có dữ liệu",
                                    placeholder: "[Chọn...]",
                                    valueExpr: "user_id",
                                },
                                editorType: "dxSelectBox",
                                label: {
                                    text: "Người dùng"
                                },
                                validationRules: [{
                                    message: "Vui lòng người dùng",
                                    type: "required"
                                }]
                            },],
                            labelLocation: "left",
                            minColWidth: 300,
                            showColonAfterLabel: true,
                            width: "100%"
                        }).dxForm("instance");
                },
                deferRendering: false,
                dragEnabled: true,
                height: "auto",
                hideOnOutsideClick: false,
                shading: false,
                showTitle: true,
                title: "Gửi thông báo",
                toolbarItems: [{
                    location: "center",
                    options: {
                        onClick: () => {
                            const validate = self.sendNotifyForm.validate();
                            if (validate && validate.brokenRules.length === 0) {
                                OGUtils.showLoading();
                                const data = self.sendNotifyForm.option("formData");
                                DocumentService.notify(self.rowKey, data.userId, data.isSuccess).then(res => {
                                    if (res.status == "OK") {
                                        OGUtils.alert("Gửi thông báo thành công!");
                                        self.sendNotifyForm.resetValues();
                                        self.sendNotifyPopup.hide();
                                    }
                                    else {
                                        OGUtils.alert("Gửi thông báo thất bại!");
                                    }
                                });
                            }
                        },
                        text: "Xác nhận",
                        type: "default"
                    },
                    toolbar: "bottom",
                    widget: "dxButton"
                }, {
                    location: "center",
                    options: {
                        onClick: () => {
                            self.sendNotifyPopup.hide();
                        },
                        text: "Hủy bỏ",
                        type: "danger"
                    },
                    toolbar: "bottom",
                    widget: "dxButton"
                }],
                width: "auto",
            }).dxPopup("instance");
        this.barCodePopup = $("<div />").appendTo("body")
            .dxPopup({
                contentTemplate: (container) => {
                    $("<img id='barcode-container'/>").appendTo(container);
                },
                deferRendering: false,
                dragEnabled: true,
                height: "auto",
                hideOnOutsideClick: false,
                shading: false,
                showTitle: true,
                title: "Barcode",
                width: "auto"
            }).dxPopup("instance");
        this.hoSoGrid = $("<div />").appendTo(container).dxDataGrid({
            allowColumnResizing: true,
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.hoSoGrid.pageIndex();
                    const pageSize = this.hoSoGrid.pageSize();
                    container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                },
                dataField: "index",
                visible: true,
                width: 50,
            }, {
                caption: "Mã",
                dataField: "code",
                width: 100,
            }, {
                caption: "Tiêu đề",
                dataField: "title",
                width: 200,
            }, {
                caption: "Nhóm hồ sơ",
                dataField: "nhom_hoso_id",
                lookup: {
                    dataSource: {
                        store: self.nhomHoSoStore
                    },
                    displayExpr: "mo_ta",
                    valueExpr: "id",
                },
                visible: false
            }, {
                caption: "Loại hồ sơ",
                dataField: "loai_hoso_id",
                lookup: {
                    dataSource: {
                        store: self.loaiHoSoStore
                    },
                    displayExpr: "mo_ta",
                    valueExpr: "id",
                },
                width: 150
            },
            {
                caption: "Cơ quan ban hành",
                dataField: "coquan_banhanh_id",
                lookup: {
                    dataSource: {
                        store: self.coQuanBanHanhStore
                    },
                    displayExpr: "mo_ta",
                    valueExpr: "id",
                },
                width: 150
            },
            {
                caption: "Trạng thái",
                dataField: "trangthai_id",
                lookup: {
                    dataSource: {
                        store: self.tinhTrangHoSoStore
                    },
                    displayExpr: "mo_ta",
                    valueExpr: "id",
                },
                width: 150
            },
            {
                alignment: "center",
                caption: "Ngày ban hành",
                dataField: "ngay_banhanh",
                dataType: "date",
                format: "dd/MM/yyyy",
                width: 150
            }, {
                caption: "Kiểm duyệt",
                dataField: "is_visible",
                // editorType: "dxCheckBox",
                width: 70
            }, {
                caption: "Ghi chú",
                dataField: "ghi_chu",
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {

                    $("<div />").appendTo(container).dxToolbar({
                        items: [
                            {
                                location: "center",
                                options: {
                                    hint: "Thông tin",
                                    icon: "info",
                                    onClick: () => {
                                        self.rowKey = options.data.id;
                                        self.files = options.row.data.attachments.map(x => {
                                            x.allowedDelete = false;
                                            return x;
                                        });

                                        self.fileList.getDataSource().reload();
                                        self.infoHoSoForm.beginUpdate();
                                        self.infoHoSoForm.option("formData", options.row.data);
                                        self.infoHoSoForm.option("readOnly", true);
                                        self.dxAttachmentUpload.option("visible", false);
                                        self.infoHoSoForm.endUpdate();
                                        self.infoPopup.option("toolbarItems[0].visible", false);
                                        self.infoPopup.option("toolbarItems[1].visible", true);
                                        self.infoPopup.option("toolbarItems[2].visible", true);
                                        if (options.row.data.attachments.length) {
                                            self.infoPopup.option("toolbarItems[3].visible", true);
                                        }
                                        self.infoPopup.show();
                                    },
                                    type: "default"
                                },
                                widget: "dxButton",
                            },
                            // {
                            //     location: 'center',
                            //     widget: 'dxButton',
                            //     options: {
                            //         icon: 'detailslayout',
                            //         type: 'default',
                            //         onClick: () => {
                            //             this.rowKey = options.key;
                            //             this.g_AttachmentsGrid.getDataSource().reload();
                            //             this.g_HoSoViews.option('selectedIndex', 1);
                            //         }
                            //     },
                            //     // visible: is_visible
                            // },
                            {
                                disabled: !(options.row.data.attachments.length > 0),
                                location: "center",
                                options: {
                                    hint: "Tải toàn bộ tệp đính kèm",
                                    icon: "download",
                                    onClick: () => {
                                        window.open(`/api/hoSo/${options.data.id}/download`);
                                    },
                                    type: "success"
                                },
                                widget: "dxButton"
                            }, {
                                location: "center",
                                options: {
                                    hint: "Chỉnh sửa",
                                    icon: "edit",
                                    onClick: () => {
                                        self.rowKey = options.data.id;
                                        self.files = options.row.data.attachments.map(x => {
                                            x.allowedDelete = true;
                                            return x;
                                        });

                                        self.fileList.getDataSource().reload();
                                        self.infoHoSoForm.option("formData", options.row.data);

                                        self.infoPopup.show();
                                    },
                                    type: "success"
                                },
                                widget: "dxButton"
                            }, {
                                location: "center",
                                options: {
                                    hint: "Xóa",
                                    icon: "trash",
                                    onClick: () => {
                                        OGUtils.confirm("Bạn có muốn xóa hồ sơ này?").then(value => {
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
                            },
                            {
                                location: "center",
                                options: {
                                    hint: "Mã barcode",
                                    icon: "icon icon-barcode",
                                    onClick: (e) => {
                                        self.rowKey = options.data.id;
                                        JsBarcode("#barcode-container", options.data.code);
                                        self.barCodePopup.show();
                                    },
                                    type: "default"
                                },
                                widget: "dxButton"
                            },
                            {
                                location: "center",
                                options: {
                                    hint: "Tải tài liệu ký số",
                                    icon: "icon icon-designtools",
                                    onClick: (e) => {
                                        self.rowKey = options.data.id;
                                        self.taiLieuKySoPopup.show();
                                    },
                                    type: "default"
                                },
                                widget: "dxButton"
                            },
                        ]
                    });
                },
                dataField: "id",
                width: 250,
            }],
            dataSource: {
                store: new CustomStore({
                    insert: (values) => {
                        if (this.statusUpload) {
                            values.attachment_url = "/" + this.fileUploadName;
                        }
                        values.nhom_hoso_id = this.nhomHoSoId;
                        return DocumentService.insert(values);
                    },
                    key: "id",
                    load: (loadOptions) => {
                        const args = {};
                        if (loadOptions.sort) {
                            args["orderby"] = loadOptions.sort[0].selector;
                            if (loadOptions.sort[0].desc)
                                args["orderby"] += " desc";
                        }
                        args["skip"] = loadOptions.skip ? loadOptions.skip : 0;
                        args["take"] = loadOptions.take ? loadOptions.take : 50;
                        args["keyword"] = keyword;
                        args["loai_hoso_id"] = loai_hoso_id;
                        args["nhom_hoso_id"] = this.nhomHoSoId;
                        args["coquan_banhanh_id"] = coquan_banhanh_id;
                        args["start_date"] = start_date;
                        args["end_date"] = end_date;

                        return DocumentService.list(args);
                    },
                    remove: (key) => {
                        return axios.delete("/api/hoSo/" + key);
                    },
                    update: (key, values) => {
                        if (this.statusUpload) {
                            values.attachment_url = "/" + this.fileUploadName;
                        }
                        return DocumentService.insert(values);
                    }
                }),
            },
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        dataField: "code",
                    }, {
                        dataField: "title",
                        validationRules: [{
                            message: "Vui lòng nhập tiêu đề",
                            type: "required"
                        }],
                    }, {
                        dataField: "is_visible",
                    },
                    {
                        dataField: "loai_hoso_id",
                        validationRules: [{
                            message: "Vui lòng chọn loại hồ sơ",
                            type: "required"
                        }],
                    },
                    {
                        dataField: "coquan_banhanh_id",
                        validationRules: [{
                            message: "Vui lòng chọn cơ quan ban hành",
                            type: "required"
                        }],
                    },
                    {
                        dataField: "nhom_hoso_id",
                        validationRules: [{
                            message: "Vui lòng chọn nhóm hồ sơ",
                            type: "required"
                        }],
                        visible: false
                    },
                    {
                        dataField: "short_description",
                        editorOptions: {
                            height: 50
                        },
                        editorType: "dxTextArea",
                        validationRules: [{
                            message: "Vui lòng nhập trích yếu",
                            type: "required"
                        }],
                    },
                    {
                        dataField: "ghi_chu",
                        editorOptions: {
                            height: 50
                        },
                        editorType: "dxTextArea",
                    },]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin hồ sơ gói thầu, dự án",
                    width: 700,
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
            onSaving: (e) => {
                if (self.statusUpload && !e.changes.length) {
                    e.changes.push({
                        data: {},
                        key: this.rowKey,
                        type: "update"
                    });
                }
            },
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;

                e.toolbarOptions.items.unshift({
                    location: "before",
                    template: () => {
                        return "<h6>QUẢN LÝ HỒ SƠ GÓI THẦU DỰ ÁN</h6>";
                    }
                }, {
                    location: "after",
                    options: {
                        hint: "Thêm mới",
                        icon: "add",
                        onClick: (e) => {
                            self.infoHoSoForm.option("formData", {});
                            self.infoHoSoForm.resetValues();
                            this.infoPopup.show();
                        },
                        type: "default",
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        dataSource: {
                            store: self.coQuanBanHanhStore
                        },
                        displayExpr: "mo_ta",
                        onContentReady: (e) => {
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                if (this.offsetWidth < this.scrollWidth) {
                                    $ele.attr("title", $ele.text());
                                }
                            });
                        },
                        onSelectionChanged: function (e) {
                            coquan_banhanh_id = e.component.option("value");
                            dataGrid.getDataSource().reload();
                        },
                        placeholder: "Chọn cơ quan ban hành",
                        searchEnabled: true,
                        showClearButton: true,
                        valueExpr: "id",
                        width: "auto",
                    },
                    widget: "dxSelectBox"
                }, {
                    location: "after",
                    options: {
                        dataSource: {
                            store: self.loaiHoSoStore
                        },
                        displayExpr: "mo_ta",
                        onContentReady: (e) => {
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                if (this.offsetWidth < this.scrollWidth) {
                                    $ele.attr("title", $ele.text());
                                }
                            });
                        },
                        onSelectionChanged: function (e) {
                            loai_hoso_id = e.component.option("value");
                            dataGrid.getDataSource().reload();
                        },
                        placeholder: "Chọn loại hồ sơ",
                        searchEnabled: true,
                        showClearButton: true,
                        valueExpr: "id",
                        width: "auto",
                    },
                    widget: "dxSelectBox"
                }, {
                    location: "after",
                    options: {
                        dateSerializationFormat: "yyyy-MM-dd",
                        displayFormat: "dd/MM/yyyy",
                        height: 30,
                        invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                        onValueChanged: function (e) {
                            start_date = e.component.option("value");
                            dataGrid.getDataSource().reload();
                        },
                        placeholder: "Từ ngày",
                        showClearButton: true,
                        type: "date",
                    },
                    widget: "dxDateBox",
                }, {
                    location: "after",
                    options: {
                        dateSerializationFormat: "yyyy-MM-dd",
                        displayFormat: "dd/MM/yyyy",
                        height: 30,
                        invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                        onValueChanged: function (e) {
                            end_date = e.component.option("value");
                            dataGrid.getDataSource().reload();
                        },
                        placeholder: "Đến ngày",
                        showClearButton: true,
                        type: "date",
                    },
                    widget: "dxDateBox",
                }, {
                    location: "after",
                    options: {
                        onValueChanged: function (e) {
                            keyword = e.component.option("value");
                            dataGrid.getDataSource().reload();
                        },
                        placeholder: "Từ khóa",
                        showClearButton: true,
                        width: "auto",
                    },
                    widget: "dxTextBox"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới",
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
                pageSize: 25
            },
            remoteOperations: {
                filtering: true,
                groupPaging: false,
                grouping: false,
                paging: true,
                sorting: true,
                summary: false
            },
            scrolling: {
                showScrollbar: "always"
            },
            searchPanel: {
                visible: false
            },
            selection: {
                mode: "single"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",
            wordWrapEnabled: true
        }).dxDataGrid("instance");


        this.infoPopup = $("<div class='info-popup' />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.infoHoSoForm = $("<div />").appendTo(container)
                    .dxForm({
                        colCount: 2,
                        items: [{
                            dataField: "id",
                            editorOptions: {
                                value: 0
                            },
                            visible: false
                        }, {
                            colSpan: 2,
                            dataField: "code",
                            label: {
                                text: "Mã hồ sơ"
                            },
                        }, {
                            colSpan: 2,
                            dataField: "title",
                            editorOptions: {
                                height: 50
                            },
                            editorType: "dxTextArea",
                            label: {
                                text: "Tiêu đề"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tiêu đề",
                                type: "required"
                            }],
                        }, {
                            colSpan: 2,
                            dataField: "ghi_chu",
                            editorOptions: {
                                height: 50
                            },
                            editorType: "dxTextArea",
                            label: {
                                text: "Ghi chú"
                            },
                        }, {
                            dataField: "coquan_banhanh_id",
                            editorOptions: {
                                dataSource: {
                                    store: self.coQuanBanHanhStore
                                },
                                displayExpr: "mo_ta",
                                noDataText: "Không có dữ liệu",
                                placeholder: "[Chọn...]",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Cơ quan ban hành"
                            },
                            validationRules: [{
                                message: "Vui lòng cơ quan ban hành",
                                type: "required"
                            }]
                        }, {
                            dataField: "ngay_banhanh",
                            editorOptions: {
                                dateSerializationFormat: "yyyy-MM-dd",
                                displayFormat: "dd/MM/yyyy",
                                invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Ngày ban hành"
                            },
                            validationRules: [{
                                message: "Vui lòng chọn ngày ban hành",
                                type: "required"
                            }]
                        }, {
                            dataField: "loai_hoso_id",
                            editorOptions: {
                                dataSource: {
                                    store: self.loaiHoSoStore
                                },
                                displayExpr: "mo_ta",
                                noDataText: "Không có dữ liệu",
                                placeholder: "[Chọn...]",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Loại hồ sơ"
                            },
                            validationRules: [{
                                message: "Vui lòng loại nhóm hồ sơ",
                                type: "required"
                            }]
                        }, {
                            dataField: "trangthai_id",
                            editorOptions: {
                                dataSource: {
                                    store: self.tinhTrangHoSoStore
                                },
                                displayExpr: "mo_ta",
                                noDataText: "Không có dữ liệu",
                                placeholder: "[Chọn...]",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Trạng thái hồ sơ"
                            },
                            validationRules: [{
                                message: "Vui lòng trạng thái hồ sơ",
                                type: "required"
                            }]
                        }, {
                            dataField: "is_visible",
                            editorOptions: {
                                value: false
                            },
                            editorType: "dxCheckBox",
                            label: {
                                text: "Phê duyệt"
                            }
                        }, {
                            dataField: "nhom_hoso_id",
                            editorOptions: {
                                dataSource: {
                                    store: self.nhomHoSoStore
                                },
                                displayExpr: "mo_ta",
                                noDataText: "Không có dữ liệu",
                                placeholder: "[Chọn...]",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhóm hồ sơ"
                            },
                            validationRules: [{
                                message: "Vui lòng chọn nhóm hồ sơ",
                                type: "required"
                            }],
                            visible: false
                        },
                        {
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
                                                files.forEach(file => {
                                                    const attachment: OGAttachmentModel = {
                                                        file_name: file.name,
                                                        hoso_id: self.rowKey,
                                                        id: 0,
                                                        mime_type: file.type,
                                                        raw: file,
                                                        size: file.size,
                                                        url: "/"
                                                    };
                                                    self.files.push(attachment);
                                                });
                                                self.fileList.getDataSource().reload();
                                                self.dxAttachmentUpload.reset();
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
                        },
                        {
                            colSpan: 2,
                            cssClass: "attachments-container",
                            label: {
                                text: "Tệp đính kèm",
                            },
                            template: (itemData, itemElement) => {
                                itemElement.css("margin", "auto");
                                this.fileList = $(itemElement)
                                    .dxList({
                                        dataSource: {
                                            store: new CustomStore({
                                                load: (loadOptions) => {
                                                    return self.files;
                                                },
                                            })
                                        },
                                        itemTemplate: (itemData, itemIndex, childElement) => {
                                            let visible = false;
                                            if (itemData.extension) {
                                                visible = allowedView.includes(itemData.extension);
                                            }
                                            const container = $(childElement).css("padding", "0 10px")
                                                .dxToolbar({
                                                    items: [{
                                                        location: "before",
                                                        template: function () {
                                                            return itemData.file_name;
                                                        }
                                                    },
                                                    {
                                                        location: "after",
                                                        options: {
                                                            hint: "Xem tệp đính kèm",
                                                            icon: "icon icon-eye",
                                                            onClick: () => {
                                                                switch (itemData.extension) {
                                                                    case ".pdf":
                                                                        window.open(itemData.url);
                                                                        break;
                                                                    case ".doc":
                                                                    case ".docx":
                                                                        fetch(itemData.url).then(response => {
                                                                            response.blob().then(data => {
                                                                                const file = new File([data], itemData.file_name, {
                                                                                    // size: itemData.size,
                                                                                    type: itemData.mime_type
                                                                                });
                                                                                docx.renderAsync(file, document.getElementById("preview-container"))
                                                                                    .then(x => { });
                                                                                this.docPreviewPopup.show();
                                                                            });

                                                                        });

                                                                        break;
                                                                    case ".xls":
                                                                    case ".xlsx":
                                                                        new ExcelViewer(document.getElementById("preview-container"), itemData.url, {
                                                                            lang: "en",
                                                                            theme: "light"
                                                                        });
                                                                        this.docPreviewPopup.show();
                                                                        break;
                                                                    default:
                                                                        break;
                                                                }

                                                            },
                                                            type: "default",
                                                        },
                                                        visible: visible,
                                                        widget: "dxButton"
                                                    },
                                                    {
                                                        location: "after",
                                                        options: {
                                                            icon: "download",
                                                            onClick: (e) => {
                                                                const link = document.createElement("a");
                                                                link.download = itemData.file_name;
                                                                link.href = itemData.url;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                            },
                                                            type: "success"
                                                        },
                                                        visible: itemData.url != "/",
                                                        widget: "dxButton"
                                                    }, {
                                                        location: "after",
                                                        options: {
                                                            icon: "trash",
                                                            onClick: (e) => {
                                                                OGUtils.confirm("Bạn có muốn xóa tệp đính kèm này").then(value => {
                                                                    if (value) {
                                                                        if (itemIndex < self.files.length) {
                                                                            self.files.splice(itemIndex, 1);
                                                                            self.fileList.getDataSource().reload();
                                                                        }
                                                                    }
                                                                });
                                                            },
                                                            type: "danger"
                                                        },
                                                        visible: itemData.allowedDelete,
                                                        widget: "dxButton"
                                                    },
                                                    ]
                                                }).dxToolbar("instance");
                                            return container;
                                        },
                                        pageLoadMode: "scrollBottom"
                                    })
                                    .dxList("instance");
                            }
                        },
                        ],
                        labelLocation: "left",
                        minColWidth: 300,
                        showColonAfterLabel: true,
                        width: "100%"
                    }).dxForm("instance");

                // container.dxScrollView({});
            },
            deferRendering: false,
            dragEnabled: true,
            height: "80vh",
            hideOnOutsideClick: false,
            onHidden: () => {
                self.files = [];
                // 
                self.fileList.getDataSource().reload();
                self.infoHoSoForm.option("readOnly", false);
                self.dxAttachmentUpload.option("visible", true);
                self.infoPopup.option("toolbarItems[0].visible", true);
                self.infoPopup.option("toolbarItems[1].visible", false);
                self.infoPopup.option("toolbarItems[2].visible", false);
                self.infoPopup.option("toolbarItems[3].visible", false);
            },
            shading: false,
            showTitle: true,
            title: "Thông tin hồ sơ",
            toolbarItems: [{
                location: "after",
                options: {
                    icon: "icon icon-save-2",
                    onClick: function (e) {
                        const validate = self.infoHoSoForm.validate();
                        if (validate && validate.brokenRules.length === 0) {
                            OGUtils.showLoading();
                            setTimeout(() => {
                                const data: OGDocumentModel = self.infoHoSoForm.option("formData");
                                data.nhom_hoso_id = self.nhomHoSoId;
                                data.attachments = self.files.filter(x => x.id > 0);
                                const formData = OGUtils.jsonToFormData(data);
                                self.files.filter(x => x.raw != null).forEach(file => {
                                    formData.append("files", file.raw);
                                });
                                DocumentService.insert(formData).then(result => {
                                    OGUtils.hideLoading();
                                    if (result.status === EnumStatus.OK) {
                                        OGUtils.confirm("Lưu hồ sơ thành công! Bạn có muốn gửi thông báo không?").then(aws => {
                                            if (aws) {
                                                self.rowKey = (result as RestData<OGDocumentModel>).data.id;
                                                self.infoPopup.hide();
                                                self.hoSoGrid.getDataSource().reload();
                                                self.sendNotifyForm.option("formData", {
                                                    isSuccess: true
                                                });
                                                self.sendNotifyPopup.show();
                                            }
                                            else {
                                                self.infoPopup.hide();
                                                self.hoSoGrid.getDataSource().reload();
                                            }
                                        });

                                    } else {
                                        OGUtils.confirm("Lưu hồ sơ không thành công! Bạn có muốn gửi thông báo không?").then(aws => {
                                            if (aws) {
                                                self.rowKey = data.id ?? 0;
                                                self.infoPopup.hide();
                                                self.hoSoGrid.getDataSource().reload();
                                                self.sendNotifyForm.option("formData", {
                                                    isSuccess: false
                                                });
                                                self.sendNotifyPopup.show();
                                            }
                                            else {
                                                self.infoPopup.hide();
                                                self.hoSoGrid.getDataSource().reload();
                                            }
                                        });
                                    }
                                });
                            }, 10);
                        }
                    },
                    text: "Lưu",
                    type: "success"
                },
                toolbar: "bottom",
                widget: "dxButton"
            }, {
                location: "before",
                options: {
                    icon: "icon icon-edit",
                    onClick: function (e) {
                        self.files = self.files.map(x => {
                            x.allowedDelete = true;
                            return x;
                        });
                        self.fileList.getDataSource().reload();
                        self.infoHoSoForm.beginUpdate();
                        self.infoHoSoForm.option("readOnly", false);
                        self.dxAttachmentUpload.option("visible", true);
                        self.infoHoSoForm.endUpdate();
                        self.infoPopup.option("toolbarItems[0].visible", true);
                        self.infoPopup.option("toolbarItems[1].visible", false);
                        self.infoPopup.option("toolbarItems[2].visible", false);
                        self.infoPopup.option("toolbarItems[3].visible", false);
                    },
                    text: "Chỉnh sửa",
                    type: "success"
                },
                toolbar: "bottom",
                visible: false,
                widget: "dxButton"
            }, {
                location: "before",
                options: {
                    icon: "icon icon-trash",
                    onClick: function (e) {
                        OGUtils.confirm("Bạn có muốn xóa hồ sơ này?").then(value => {
                            if (value) {
                                OGUtils.showLoading();
                                setTimeout(() => {
                                    const data = self.infoHoSoForm.option("formData");
                                    if (data && data.id) {
                                        DocumentService.delete(data).then(result => {
                                            OGUtils.hideLoading();
                                            if (result) {
                                                OGUtils.alert("Xóa hồ sơ thành công!");
                                                self.infoPopup.hide();
                                                self.hoSoGrid.getDataSource().reload();
                                            } else {
                                                OGUtils.error("Xóa hồ sơ thất bại!", "Lỗi");
                                            }
                                        });
                                    }
                                }, 10);
                            }
                        });
                    },
                    text: "Xóa",
                    type: "danger"
                },
                toolbar: "bottom",
                visible: false,
                widget: "dxButton"
            }, {
                location: "before",
                options: {
                    icon: "icon icon-export-1",
                    onClick: function (e) {
                        const data = self.infoHoSoForm.option("formData");
                        if (data && data.id) {
                            OGUtils.postDownload(DocumentService.BASE_PATH + "/attachment/export", data);
                        }
                    },
                    text: "Xuất mục lục tài liệu",
                    type: "default"
                },
                toolbar: "bottom",
                widget: "dxButton"
            }, {
                location: "after",
                options: {
                    icon: "icon icon-close-square",
                    onClick: function (e) {
                        self.infoPopup.hide();
                    },
                    text: "Hủy",
                    type: "danger"
                },
                toolbar: "bottom",
                widget: "dxButton"
            },],
            width: 700
        }).dxPopup("instance");

        this.docPreviewPopup = $("<div />").appendTo("body")
            .dxPopup({
                contentTemplate: (container) => {
                    this.previewContainer = $("<div id='preview-container'/>").appendTo(container);
                },
                deferRendering: false,
                dragEnabled: true,
                height: "100%",
                hideOnOutsideClick: false,
                shading: false,
                showTitle: true,
                title: "Xem trước tài liệu",
                width: "100%"
            }).dxPopup("instance");
    }

    private initLayout(): void {
        this.coQuanBanHanhStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                axios.get("/api/co-quan-ban-hanh/" + key.toString()).then(xhr => {
                    if (xhr.data && xhr.data.status === "OK") {
                        deferred.resolve(xhr.data.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            },
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios.get("/api/co-quan-ban-hanh/list").then(xhr => {
                    if (xhr.data && xhr.data.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            }
        });
        this.loaiHoSoStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                axios.get("/api/loaiHoSo/" + key.toString()).then(xhr => {
                    if (xhr.data && xhr.data.status === "OK") {
                        deferred.resolve(xhr.data.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            },
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios.get("/api/loaiHoSo/list").then(xhr => {
                    if (xhr.data && xhr.data.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            }
        });

        this.nhomHoSoStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                axios.get("/api/nhomHoSo/" + key.toString()).then(xhr => {
                    if (xhr.data && xhr.data.status === "OK") {
                        deferred.resolve(xhr.data.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            },
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios("/api/nhomHoSo/list").then(xhr => {
                    if (xhr.data && xhr.data.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            }
        });
        this.tinhTrangHoSoStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                axios.get("/api/tinhTrangHoSo/" + key.toString()).then(xhr => {
                    if (xhr.data && xhr.data.status === "OK") {
                        deferred.resolve(xhr.data.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            },
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios("/api/tinhTrangHoSo/list").then(xhr => {
                    if (xhr.data && xhr.data.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            }
        });

        this.initHoSoGrid(this.container);
    }
    onInit(): void {

    }
}

export { HoSoGoiThauView };
