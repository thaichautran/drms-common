import { OGMap } from "@opengis/map";
import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import dxFileUploader from "devextreme/ui/file_uploader";
import "devextreme/ui/file_uploader";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxList from "devextreme/ui/list";
import "devextreme/ui/list";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/multi_view";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import * as docx from "docx-preview";
import ExcelViewer from "excel-viewer";
import { data } from "jquery";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { OGAttachmentModel } from "../../models/document.model";
import { OGDuToanCongViecSuaChua } from "../../models/kiem-tra/kiem-tra.model";
import { OGWorderModel } from "../../models/maintenance.model";
import { EstimationService } from "../../services/estimation.service";
import { IMapComponent } from "../base-component.abstract";
const allowedView = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];
class OGEstimationOptions {
    loaiKiemTra?: string;
    phieuGiamSatId? : number;
}

class EstimationComponent implements IMapComponent {
    container: HTMLElement;
    docPreviewPopup: dxPopup;
    duToanFiles: OGAttachmentModel[];
    dxAttachmentUpload: dxFileUploader;
    estimationForm: dxForm;
    estimationGrid: dxDataGrid;
    estimationPopup: dxPopup;
    fileList: dxList;
    loaiKiemTra: string;
    maintenanceView: dxMultiView;
    oGMap: OGMap;
    phieuGiamSatId: number;
    previewContainer: JQuery<HTMLElement>;
    constructor(container: HTMLElement, options: OGEstimationOptions) {
        this.container = container;
        this.loaiKiemTra = options.loaiKiemTra;
        this.phieuGiamSatId = options.phieuGiamSatId;
        this.initLayout(this.container);
    }
    private initLayout(container): void {
        const self = this;
        self.duToanFiles = [];
        this.estimationGrid = $("<div />").appendTo(container).dxDataGrid({
            allowColumnResizing: true,
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.estimationGrid.pageIndex();
                    const pageSize = this.estimationGrid.pageSize();
                    container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                },
                dataField: "index",
                visible: true,
                width: 50,
            }, {
                caption: "Mã dự toán",
                dataField: "madutoan",
                width: 200
            }, {
                caption: "Tên dự toán",
                dataField: "tendutoan",
            }, {
                caption: "Người lập dự toán",
                dataField: "nguoilapdutoan",
                width: 200
            }, {
                alignment: "center",
                caption: "Ngày lập dự toán",
                dataField: "ngaylapdutoan",
                dataType: "date",
                format: "dd/MM/yyyy" ,
                width: 150
            }, {
                caption: "Ghi chú",
                dataField: "ghichu",
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
                                    hint: "Chỉnh sửa",
                                    icon: "edit",
                                    onClick: () => {
                                        const data = options.row.data;
                                        if (data.attachments && data.attachments.length) {
                                            self.duToanFiles = options.row.data.attachments.map(x => {
                                                x.allowedDelete = true;
                                                return x;
                                            });
                                        }
                                        self.fileList.getDataSource().reload();
                                        self.estimationForm.option("formData", options.row.data);
                                        self.estimationPopup.show();
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
                                        OGUtils.confirm("Bạn có muốn xóa dự toán này?").then(value => {
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
                            },]
                    });
                },
                dataField: "id",
                width: 200,
            }],
            dataSource: {
                store: new CustomStore({
                    insert: (values) => {
                        return EstimationService.insert(values);
                    },
                    key: "id",
                    load: (loadOptions) => {
                        const def = $.Deferred();
                        const args = {};
                        if (loadOptions.sort) {
                            args["orderby"] = loadOptions.sort[0].selector;
                            if (loadOptions.sort[0].desc)
                                args["orderby"] += " desc";
                        }
                        args["skip"] = loadOptions.skip ? loadOptions.skip : 0;
                        args["take"] = loadOptions.take ? loadOptions.take : 50;
                        if (self.phieuGiamSatId) {
                            args["phieugiamsat_id"] = self.phieuGiamSatId;
                            args["loaikiemtra"] = self.loaiKiemTra;
                            EstimationService.list(args).then(result => {
                                if(result && result.status === EnumStatus.OK) {
                                    def.resolve({
                                        data: result.data,
                                        totalCount: result.recordsTotal
                                    });
                                } else {
                                    def.resolve({
                                        data: [],
                                        totalCount: 0
                                    });
                                }
                            });
                        } else {
                            def.resolve({
                                data: [],
                                totalCount: 0
                            });
                            
                        } 
                        return def.promise();
                    },
                    remove: (key) => {
                        return axios.delete("/api/du-toan/" + key);
                    },
                    update: (key, values) => {
                        return EstimationService.insert(values);
                    }
                }),
            },
            editing: {
                form: {
                    colCount: 1,
                    items: []
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin dự toán công việc",
                    width: "500",
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
                    location: "before",
                    options: {
                        hint: "Quay lại",
                        icon: "icon icon-arrow-left",
                        onClick: () => {
                            this.maintenanceView.option("selectedIndex", 0);
                        },
                        type: "danger"
                    },
                    widget: "dxButton"
                }, {
                    location: "before",
                    template: () => {
                        return "<h6>DỰ TOÁN CÔNG VIỆC</h6>";
                    }
                }, {
                    location: "after",
                    options: {
                        hint: "Thêm dự toán",
                        icon: "add",
                        onClick: (e) => {
                            self.duToanFiles = [];
                            self.fileList.getDataSource().reload();
                            self.estimationForm.option("formData", {});
                            self.estimationForm.resetValues();
                            self.estimationPopup.show();
                        },
                        text: "Thêm dự toán",
                        type: "default",
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        onValueChanged: function (e) {
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

        this.estimationPopup = $("<div class='info-popup' />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.estimationForm = $("<div />").appendTo(container)
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
                            dataField: "madutoan",
                            label: {
                                text: "Mã dự toán"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập mã dự toán",
                                type: "required"
                            }],
                        }, {
                            colSpan: 2,
                            dataField: "tendutoan",
                            label: {
                                text: "Tên dự toán"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên dự toán",
                                type: "required"
                            }],
                        },{
                            colSpan: 2,
                            dataField: "nguoilapdutoan",
                            label: {
                                text: "Tên người lập dự toán"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên người lập dự toán",
                                type: "required"
                            }],
                        }, {
                            colSpan: 2,
                            dataField: "ngaylapdutoan",
                            editorOptions: {
                                dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                displayFormat: "dd/MM/yyyy",
                                height: 30,
                                invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Ngày lập dự toán"
                            },
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
                                                        id: 0,
                                                        mime_type: file.type,
                                                        raw: file,
                                                        size: file.size,
                                                        url: "/"
                                                    };
                                                    self.duToanFiles.push(attachment);
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
                                                    return self.duToanFiles;
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
                                                                        if (itemIndex < self.duToanFiles.length) {
                                                                            self.duToanFiles.splice(itemIndex, 1);
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
            },
            deferRendering: false,
            dragEnabled: true,
            height: "auto",
            hideOnOutsideClick: false,
            onHidden: () => {
                self.duToanFiles = [];
                self.fileList.getDataSource().reload();

                self.estimationForm.option("readOnly", false);
                self.dxAttachmentUpload.option("visible", true);

                self.estimationPopup.option("toolbarItems[0].visible", true);
                self.estimationPopup.option("toolbarItems[1].visible", false);
                self.estimationPopup.option("toolbarItems[2].visible", false);
            },
            shading: false,
            showTitle: true,
            title: "Dự toán công việc",
            toolbarItems: [{
                location: "after",
                options: {
                    icon: "icon icon-save-2",
                    onClick: function (e) {
                        const validate = self.estimationForm.validate();
                        if (validate && validate.brokenRules.length === 0) {
                            OGUtils.showLoading();
                            setTimeout(() => {
                                const data: OGDuToanCongViecSuaChua = self.estimationForm.option("formData");
                                data.phieugiamsat_id = self.phieuGiamSatId;
                                data.loaikiemtra = self.loaiKiemTra;
                                data.attachments = self.duToanFiles.filter(x => x.id > 0);
                                const formData = OGUtils.jsonToFormData(data);
                                self.duToanFiles.filter(x => x.raw != null).forEach(file => {
                                    formData.append("files", file.raw);
                                });
                                EstimationService.insert(formData).then(result => {
                                    OGUtils.hideLoading();
                                    if (result) {
                                        OGUtils.alert("Lưu dự toán thành công!");
                                        self.estimationPopup.hide();
                                        self.estimationGrid.getDataSource().reload();
                                    } else {
                                        OGUtils.error("Lưu dự toán thất bại!", "Lỗi");
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
                location: "after",
                options: {
                    icon: "icon icon-close-square",
                    onClick: function (e) {
                        self.estimationPopup.hide();
                    },
                    text: "Hủy",
                    type: "danger"
                },
                toolbar: "bottom",
                widget: "dxButton"
            },],
            width: 600
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

    public addMaintenanceViews(maintenanceView: dxMultiView): void {
        this.maintenanceView = maintenanceView;
    }

    onInit(): void {
    }
    public reload(maintenanceInfo: OGWorderModel): void {
        this.phieuGiamSatId = maintenanceInfo.worder_id;
        this.estimationGrid.getDataSource().reload();
    }
}

export { EstimationComponent };