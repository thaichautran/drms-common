import axios from "axios";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
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
import moment from "moment";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { RestError } from "../../../../../../../libs/core/models/base-response.model";
import { AttachmentLGSP, DocumentLGSP } from "../../../../../../../libs/core/models/document-lgsp.model";
import { AuthService } from "../../../../../../../libs/core/services/auth.service";
import { DocumentLGSPService } from "../../../../../../../libs/core/services/document-lgsp.service";

const allowedView = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];
class ChiaSeDuLieuView implements IBaseComponent {
    activeKey: boolean = false;
    changeKeyForm: dxForm;
    changeKeyPopup: dxPopup;
    container: JQuery<HTMLElement>;
    docPreviewPopup: dxPopup;
    dxAttachmentUpload: dxFileUploader;
    fileList: dxList;
    files: AttachmentLGSP[] = [];
    infoHoSoForm: dxForm;
    infoPopup: dxPopup;
    loginLGSPForm: dxForm;
    loginLGSPPopup: dxPopup;
    previewContainer: JQuery<HTMLElement>;
    rowKey: number;
    statusUpload: boolean;
    tableGrid: dxDataGrid;
    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.onInit();
        this.initPopup();
    }
    private initPopup(): void {
        const self = this;
        this.loginLGSPPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.loginLGSPForm = $("<div />").appendTo(container)
                    .dxForm({
                        // colCount: 2,
                        items: [
                            {
                                dataField: "username",
                                label: {
                                    text: "Tên đăng nhập"
                                },
                                validationRules: [{
                                    message: "Vui lòng nhập tên đăng nhập vào trục ESB / LGSP",
                                    type: "required"
                                }],
                            },
                            {
                                dataField: "password",
                                editorOptions: {
                                    mode: "password",
                                },
                                label: {
                                    text: "Mật khẩu"
                                },
                                validationRules: [{
                                    message: "Vui lòng nhập mật khẩu đăng nhập vào trục ESB / LGSP",
                                    type: "required"
                                }],
                            },
                        ],
                        labelLocation: "top",
                        minColWidth: 300,
                        showColonAfterLabel: true,
                        width: "100%"
                    }).dxForm("instance");

                // container.dxScrollView({});
            },
            deferRendering: false,
            dragEnabled: true,
            height: "auto",
            hideOnOutsideClick: false,
            onHidden: () => {
            },
            shading: false,
            showTitle: true,
            title: "Đăng nhập vào hệ thống ESB / LGSP",
            toolbarItems: [{
                location: "center",
                options: {
                    icon: "icon icon-login-1",
                    onClick: function (e) {
                        const validate = self.loginLGSPForm.validate();
                        if (validate && validate.brokenRules.length === 0) {
                            OGUtils.showLoading();
                            setTimeout(() => {
                                OGUtils.alert("Đăng nhập hệ thống thành công").then(() => {
                                    self.loginLGSPPopup.hide();
                                    self.tableGrid.getDataSource().reload();
                                    self.setActive(true);
                                });
                            }, 3000);
                        }
                    },
                    text: "Đăng nhập",
                    type: "success"
                },
                toolbar: "bottom",
                widget: "dxButton"
            }, {
                location: "center",
                options: {
                    icon: "icon icon-close-square",
                    onClick: function (e) {
                        self.changeKeyPopup.hide();
                    },
                    text: "Hủy",
                    type: "danger"
                },
                toolbar: "bottom",
                widget: "dxButton"
            },],
            width: 500
        }).dxPopup("instance");
        this.changeKeyPopup = $("<div class='info-popup' />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.changeKeyForm = $("<div />").appendTo(container)
                    .dxForm({
                        // colCount: 2,
                        items: [
                            {
                                dataField: "key",
                                label: {
                                    text: "Khoá kỹ thuật số vào trục ESB / LGSP"
                                },
                                validationRules: [{
                                    message: "Vui lòng nhập khoá kỹ thuật số vào trục ESB / LGSP",
                                    type: "required"
                                }],
                            },
                        ],
                        labelLocation: "top",
                        minColWidth: 300,
                        showColonAfterLabel: true,
                        width: "100%"
                    }).dxForm("instance");

                // container.dxScrollView({});
            },
            deferRendering: false,
            dragEnabled: true,
            height: "auto",
            hideOnOutsideClick: false,
            onHidden: () => {
            },
            shading: false,
            showTitle: true,
            title: "Thay đổi thông tin khóa",
            toolbarItems: [{
                location: "after",
                options: {
                    icon: "icon icon-save-2",
                    onClick: function (e) {
                        const validate = self.changeKeyForm.validate();
                        if (validate && validate.brokenRules.length === 0) {
                            OGUtils.showLoading();
                            setTimeout(() => {
                                OGUtils.alert("Cập nhật khóa thành công");
                                self.changeKeyPopup.hide();
                                self.tableGrid.getDataSource().reload();
                                self.setActive(true);
                            }, 1000);
                        }
                    },
                    text: "Lưu",
                    type: "success"
                },
                toolbar: "bottom",
                widget: "dxButton"
            }, {
                location: "after",
                options: {
                    icon: "icon icon-close-square",
                    onClick: function (e) {
                        self.changeKeyPopup.hide();
                    },
                    text: "Hủy",
                    type: "danger"
                },
                toolbar: "bottom",
                widget: "dxButton"
            },],
            width: 500
        }).dxPopup("instance");
        this.infoPopup = $("<div class='info-popup' />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.infoHoSoForm = $("<div />").appendTo(container)
                    .dxForm({
                        // colCount: 2,
                        items: [{
                            dataField: "id",
                            editorOptions: {
                                value: 0
                            },
                            visible: false
                        },
                        {
                            dataField: "code",
                            label: {
                                text: "Số ký hiệu văn bản"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập số ký hiệu văn bản",
                                type: "required"
                            }],
                        },
                        {
                            dataField: "document_id",
                            label: {
                                text: "Thông tin mã định danh của văn bản"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập",
                                type: "required"
                            }],
                        },
                        {
                            dataField: "organ_id",
                            label: {
                                text: "Thông tin id cơ quan ban hành"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập",
                                type: "required"
                            }],
                        },
                        {
                            dataField: "promulgation_date",
                            editorOptions: {
                                dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                displayFormat: "dd/MM/yyyy",
                                height: 30,
                                invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                placeholder: "Ngày kết thúc dự báo",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Thời gian ban hành"
                            },
                            validationRules: [{
                                message: "Vui lòng chọn",
                                type: "required"
                            }],
                        },
                        {
                            dataField: "bussiness_doc_reason",
                            editorOptions: {
                                height: 50
                            },
                            editorType: "dxTextArea",
                            label: {
                                text: "Lý do văn bản cần điều chỉnh"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập lý do văn bản cần điều chỉnh",
                                type: "required"
                            }],
                        }, {
                            dataField: "bussiness",
                            editorOptions: {
                                dataSource: {
                                    store: new ArrayStore({
                                        data: [
                                            {
                                                id: 0,
                                                text: "Văn bản mới"
                                            },
                                            {
                                                id: 1,
                                                text: "Thu hồi"
                                            },
                                            {
                                                id: 2,
                                                text: "Cập nhật"
                                            },
                                            {
                                                id: 3,
                                                text: "Thay thế"
                                            },
                                        ],
                                        key: "id"
                                    })
                                },
                                displayExpr: "text",
                                noDataText: "Không có dữ liệu",
                                placeholder: "[Chọn...]",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Loại nghiệp vụ văn bản"
                            },
                            validationRules: [{
                                message: "Vui lòng chọn loại",
                                type: "required"
                            }]
                        },
                        {
                            dataField: "response_for",
                            editorOptions: {
                                height: 50
                            },
                            editorType: "dxTextArea",
                            label: {
                                text: "Văn bản thu hồi"
                            },
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
                                                    const attachment: AttachmentLGSP = {
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
                                                    },]
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
                                const data: DocumentLGSP = self.infoHoSoForm.option("formData");
                                data.attachments = self.files.filter(x => x.id > 0);
                                const formData = OGUtils.jsonToFormData(data);
                                self.files.filter(x => x.raw != null).forEach(file => {
                                    formData.append("files", file.raw);
                                });
                                DocumentLGSPService.insert(formData).then(result => {
                                    OGUtils.hideLoading();
                                    if (result) {
                                        OGUtils.alert("Lưu hồ sơ thành công!");
                                        self.infoPopup.hide();
                                        self.tableGrid.getDataSource().reload();
                                    } else {
                                        OGUtils.error("Lưu hồ sơ thất bại!", "Lỗi");
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
                    hint: "Kiểm tra tính xác thực",
                    icon: "icon icon-tick-square",
                    onClick: function (e) {

                    },
                    type: "danger"
                },
                toolbar: "bottom",
                visible: false,
                widget: "dxButton"
            }, {
                location: "before",
                options: {
                    hint: "Xóa",
                    icon: "icon icon-trash",
                    onClick: function (e) {
                        OGUtils.confirm("Bạn có muốn xóa hồ sơ này?").then(value => {
                            if (value) {
                                OGUtils.showLoading();
                                setTimeout(() => {
                                    const data = self.infoHoSoForm.option("formData");
                                    if (data && data.id) {
                                        DocumentLGSPService.delete(data).then(result => {
                                            OGUtils.hideLoading();
                                            if (result) {
                                                OGUtils.alert("Xóa hồ sơ thành công!");
                                                self.infoPopup.hide();
                                                self.tableGrid.getDataSource().reload();
                                            } else {
                                                OGUtils.error("Xóa hồ sơ thất bại!", "Lỗi");
                                            }
                                        });
                                    }
                                }, 10);
                            }
                        });
                    },
                    type: "danger"
                },
                toolbar: "bottom",
                visible: false,
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
    private setActive(active: boolean): void {
        const self = this;
        self.tableGrid.columnOption(8, "visible", active);
        self.tableGrid.beginUpdate();
        self.tableGrid.option("toolbar", {
            items: [
                {
                    location: "before",
                    template: () => {
                        return "<h6>Kết nối và chia sẻ dữ liệu qua trục liên thông</h6>";
                    }
                },
                {
                    location: "after",
                    options: {
                        hint: "Đăng nhập vào hệ thống ESB / LGSP",
                        icon: "icon icon-login",
                        onClick: () => {
                            self.loginLGSPForm.resetValues();
                            self.loginLGSPPopup.show();
                        },
                        type: "default",
                    },
                    visible: !active,
                    widget: "dxButton"
                },
                {
                    location: "after",
                    options: {
                        hint: "Cập nhật khoá kỹ thuật số ",
                        icon: "icon icon-repeat-circle",
                        onClick: () => {
                            self.changeKeyForm.resetValues();
                            self.changeKeyPopup.show();
                        },
                        type: "success",
                    },
                    visible: active,
                    widget: "dxButton"
                },
                {
                    location: "after",
                    options: {
                        hint: "Đăng xuất khỏi LGSP",
                        icon: "icon icon-logout",
                        onClick: (e) => {
                            OGUtils.confirm("Xác nhận đăng xuất khỏi hệ thống LGSP").then(aws => {
                                if (aws) {
                                    self.tableGrid.repaint();
                                    self.setActive(false);
                                }
                            });
                        },
                        type: "default",
                    },
                    visible: active,
                    widget: "dxButton"
                },
                {
                    location: "after",
                    options: {
                        hint: "Thêm mới",
                        icon: "add",
                        onClick: (e) => {
                            self.infoHoSoForm.option("formData", {});
                            self.infoHoSoForm.resetValues();
                            self.infoPopup.show();
                        },
                        type: "default",
                    },
                    visible: active,
                    widget: "dxButton"
                },
                {
                    location: "after",
                    options: {
                        hint: "Làm mới bảng",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            this.tableGrid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                }, "searchPanel"]
        });
        self.tableGrid.endUpdate();
    }
    onInit(): void {
        const self = this;
        this.tableGrid = $("<div />").appendTo(this.container).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columns: [{
                alignment: "center",
                allowFiltering: false,
                allowSearch: false,
                allowSorting: false,
                caption: "#",
                cellTemplate: (container, options) => {
                    const pageIndex = this.tableGrid.pageIndex();
                    const pageSize = this.tableGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                visible: true,
                width: 50,
            }, {
                caption: "Loại nghiệp vụ văn bản",
                dataField: "bussiness",
                lookup: {
                    dataSource: {
                        store: new ArrayStore({
                            data: [
                                {
                                    id: 0,
                                    text: "Văn bản mới"
                                },
                                {
                                    id: 1,
                                    text: "Thu hồi"
                                },
                                {
                                    id: 2,
                                    text: "Cập nhật"
                                },
                                {
                                    id: 3,
                                    text: "Thay thế"
                                },
                            ],
                            key: "id"
                        })
                    },
                    displayExpr: "text",
                    valueExpr: "id",
                },
            },
            {
                caption: "Lý do văn bản cần điều chỉnh",
                dataField: "bussiness_doc_reason"
            },
            {
                caption: "Văn bản thu hồi",
                dataField: "response_for"
            },
            {
                caption: "Id cơ quan ban hành",
                dataField: "organ_id"
            },
            {
                caption: "Số ký hiệu văn bản",
                dataField: "code"
            },
            {
                caption: "Thời gian ban hành",
                dataField: "promulgation_date",
                dataType: "date",
                format: "dd/MM/yyyy"
            },
            {
                caption: "Thông tin mã định danh của văn bản",
                dataField: "document_id",
            },
            {
                alignment: "center",
                allowEditing: false,
                allowFiltering: false,
                allowSearch: false,
                allowSorting: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    this.rowKey = options.data.id;
                    $("<div />").appendTo(container).dxToolbar({
                        items: [
                            {
                                location: "center",
                                options: {
                                    hint: "Gửi hồ sơ",
                                    icon: "upload",
                                    onClick: () => {
                                        OGUtils.showLoading();
                                        setTimeout(() => {
                                            OGUtils.alert("Gửi thành công");
                                        }, 3000);
                                    },
                                    type: "default"
                                },
                                widget: "dxButton",
                            },
                            {
                                location: "center",
                                options: {
                                    hint: "Thông tin",
                                    icon: "info",
                                    onClick: () => {
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
                                        self.infoPopup.show();
                                    },
                                    type: "default"
                                },
                                widget: "dxButton",
                            },
                            {
                                location: "center",
                                options: {
                                    hint: "Lịch sử di chuyển hồ sơ",
                                    icon: "icon icon-archive-book",
                                    onClick: () => {
                                        OGUtils.alert(`${moment(new Date(options.data.created_at)).format("DD/MM/YYYY")}: Đã gửi yêu cầu.`);
                                    },
                                    type: "success"
                                },
                                widget: "dxButton"
                            },
                            {
                                location: "center",
                                options: {
                                    icon: "edit",
                                    onClick: () => {
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
                            }, {
                                location: "center",
                                options: {
                                    icon: "icon icon-tick-square",
                                    onClick: () => {
                                        const tinhXacThuc = ["Hồ sơ đã xác thực!", "Hồ sơ chưa đã xác thực!"];
                                        OGUtils.alert(tinhXacThuc[Math.floor(Math.random() * tinhXacThuc.length)]);
                                    },
                                    type: "default"
                                },
                                widget: "dxButton"
                            },]
                    });
                },
                dataField: "id",
                visible: this.activeKey,
                width: 300,
            }],
            dataSource: {
                store: new CustomStore({
                    insert: (values) => {
                        return DocumentLGSPService.insert(values);
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
                        return DocumentLGSPService.list(args);
                    },
                    remove: (key) => {
                        return axios.delete("/api/hoso-lgsp/" + key);
                    },
                    update: (key, values) => {
                        return DocumentLGSPService.insert(values);
                    }
                }),
            },
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        colSpan: 2,
                        dataField: "order",
                        label: {
                            text: "Thứ tự"
                        }
                    }, {
                        colSpan: 2,
                        dataField: "table_schema",
                        editorOptions: {
                            showClearButton: true,
                        },
                        validationRules: [{
                            message: "Vui lòng chọn schema",
                            type: "required",
                        }],
                    }, {
                        colSpan: 2,
                        dataField: "table_name",
                        editorOptions: {
                            showClearButton: true,
                        },
                        validationRules: [{
                            message: "Vui lòng nhập tên bảng",
                            type: "required",
                        },],
                    }, {
                        colSpan: 2,
                        dataField: "name_vn",
                        editorOptions: {
                            showClearButton: true,
                        },
                        validationRules: [{
                            message: "Vui lòng nhập mô tả",
                            type: "required",
                        }]
                    }, {
                        dataField: "name_en",
                        editorOptions: {
                            showClearButton: true,
                        },
                        validationRules: [{
                            message: "Vui lòng nhập mô tả",
                            type: "required",
                        }]
                    }, {
                        dataField: "table_schema",
                        visible: false,
                    }],
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin bảng",
                    width: 400,
                },
                useIcons: true
            },
            filterRow: {
                visible: true,
            },
            height: "100%",
            onEditorPreparing: (e) => {
                // if (e.parentType == "dataRow") {
                //     if (!e.row.isNewRow && e.dataField === "table_name") {
                //         e.editorOptions.readOnly = true;
                //     }
                // }
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
                        template: () => {
                            return "<h6>Kết nối và chia sẻ dữ liệu qua trục liên thông</h6>";
                        }
                    },
                    {
                        location: "after",
                        options: {
                            hint: "Đăng nhập vào hệ thống ESB / LGSP",
                            icon: "icon icon-login",
                            onClick: () => {
                                self.loginLGSPForm.resetValues();
                                self.loginLGSPPopup.show();
                            },
                            type: "default",
                        },
                        visible: true,
                        widget: "dxButton"
                    },
                    {
                        location: "after",
                        options: {
                            hint: "Đăng xuất khỏi LGSP",
                            icon: "icon icon-logout",
                            onClick: (e) => {
                                OGUtils.confirm("Xác nhận đăng xuất khỏi hệ thống LGSP").then(aws => {
                                    if (aws) {
                                        self.tableGrid.repaint();
                                        self.setActive(false);
                                    }
                                });
                            },
                            type: "default",
                        },
                        visible: false,
                        widget: "dxButton"
                    },
                    {
                        location: "after",
                        options: {
                            hint: "Thêm mới",
                            icon: "add",
                            onClick: (e) => {
                                self.infoHoSoForm.option("formData", {});
                                self.infoHoSoForm.resetValues();
                                self.infoPopup.show();
                            },
                            type: "default",
                        },
                        visible: self.activeKey,
                        widget: "dxButton"
                    },
                    {
                        location: "after",
                        options: {
                            hint: "Làm mới bảng",
                            icon: "icon icon-refresh",
                            onClick: () => {
                                this.tableGrid.getDataSource().reload();
                            }
                        },
                        widget: "dxButton"
                    }, "searchPanel"]
            },
            width: "100%"
        }).dxDataGrid("instance");
    }
}

export { ChiaSeDuLieuView };