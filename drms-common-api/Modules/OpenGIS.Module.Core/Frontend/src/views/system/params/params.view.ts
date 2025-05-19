import CustomStore from "devextreme/data/custom_store";
import "devextreme/integration/jquery";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/file_uploader";
import dxFileUploader from "devextreme/ui/file_uploader";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/toolbar";
import dxToolbar from "devextreme/ui/toolbar";
import $ from "jquery";

import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { BackupHistoyView } from "./backup-history/backup-history.view";
import "./params.view.scss";

@RazorView()
class ParamView extends Layout {
    backgroundSrc: string;
    backupInfoGrid: dxDataGrid;
    displayConfigForm: dxForm;
    displayToolbar: dxToolbar;
    dxBackgroundUpload: dxFileUploader;
    dxLogoUpload: dxFileUploader;
    logoSrc: string;
    constructor() {
        super("child", "Cấu hình sao lưu hệ thống");
        this.logoSrc = "/images/front/logo-kiem-lam.png";
        this.backgroundSrc = "/images/front/bg_home.png";
        new BackupHistoyView($("#backup-history-container"));
    }

    private _initDisplayConfigForm(): void {
        const self = this;
        $("#display-config").css("padding", "5px");
        const container = $("<div />")
            .appendTo("#display-config").css({
                "border": "0.5px solid #e1d5d5",
                "padding": "5px",
            });
        self.displayToolbar = $("<div>").appendTo(container).dxToolbar({
            items: [
                {
                    location: "before",
                    template: () => {
                        return "<h4>CẤU HÌNH SAO LƯU HỆ THỐNG</h4>";
                    }
                },
                {
                    location: "after",
                    options: {
                        icon: "edit",
                        onClick: () => {
                            this.activeDisplayConfigForm(true);
                        },
                        text: "Chỉnh sửa thông tin",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        icon: "save",
                        onClick: () => {
                            const data = OGUtils.jsonToFormData(this.displayConfigForm.option("formData"));
                            if (this.dxLogoUpload.option("value").length) {
                                data.append("logo", this.dxLogoUpload.option("value")[0]);
                            }
                            if (this.dxBackgroundUpload.option("value").length) {
                                data.append("background", this.dxBackgroundUpload.option("value")[0]);
                            }
                            OGUtils.showLoading();
                            setTimeout(() => {
                                $.ajax({
                                    cache: false,
                                    contentType: false,
                                    data: data,
                                    dataType: "json",
                                    processData: false,
                                    type: "POST",
                                    url: "/api/system/webOption/update"
                                }).done(xhr => {
                                    if (xhr.status === "OK") {
                                        OGUtils.hideLoading();
                                        OGUtils.alert("Thao tác thành công!").then(() => {
                                            this.refreshDisplayConfigForm();
                                            this.activeDisplayConfigForm(false);
                                        });
                                    } else {
                                        OGUtils.alert(xhr.errors[0].message);
                                    }
                                });
                            }, 10);

                        },
                        text: "Lưu thông tin",
                        type: "success",
                        visible: false
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        icon: "close",
                        onClick: () => {
                            this.refreshDisplayConfigForm();
                            this.activeDisplayConfigForm(false);
                        },
                        text: "Hủy thao tác",
                        type: "danger",
                        visible: false
                    },
                    widget: "dxButton"
                },]
        }).dxToolbar("instance");
        const displayConfigCon = $("<div />").appendTo(container);
        self.displayConfigForm = $("<div id=\"display_config_form\"/>")
            .appendTo(displayConfigCon)
            .height("100%")
            .dxForm({
                colCount: 2,
                formData: {

                },
                items: [
                    {
                        caption: "Logo",
                        itemType: "group",
                        items: [{
                            dataField: "logoSrc",
                            label: {
                                //text: 'Logo',
                                visible: false
                            },
                            template: (data, element) => {
                                return "<img name=\"logoSrc\" src=\"\" style=\"height: 100px; width: 130px;\"/>";
                            }
                        }, {
                            template: (options, container) => {
                                this.dxLogoUpload = $("<div />").appendTo(container)
                                    .dxFileUploader({
                                        accept: ".png",
                                        allowedFileExtensions: [".png"],
                                        height: "auto",
                                        labelText: "Hoặc kéo thả tệp vào đây",
                                        multiple: false,
                                        name: "files",
                                        readyToUploadMessage: "Đã sẵn sàng tải lên",
                                        selectButtonText: "Chọn tệp",
                                        uploadFailedMessage: "Tải lên thất bại",
                                        uploadMethod: "POST",
                                        uploadMode: "useForm",
                                        uploadedMessage: "Tải lên thành công",
                                    }).dxFileUploader("instance");
                            },
                        }]
                    },
                    {
                        caption: "Ảnh nền",
                        itemType: "group",
                        items: [
                            {
                                dataField: "backgroundSrc",
                                label: {
                                    // text: 'Ảnh nền',
                                    visible: false
                                },
                                template: (data, element) => {
                                    return "<img name=\"backgroundSrc\" src=\"\" style=\"height: 200px;\"/>";
                                }
                            },
                            {
                                template: (options, container) => {
                                    this.dxBackgroundUpload = $("<div />").appendTo(container)
                                        .dxFileUploader({
                                            accept: ".png",
                                            allowedFileExtensions: [".png"],
                                            height: "auto",
                                            labelText: "Hoặc kéo thả tệp vào đây",
                                            multiple: false,
                                            name: "files",
                                            readyToUploadMessage: "Đã sẵn sàng tải lên",
                                            selectButtonText: "Chọn tệp",
                                            uploadFailedMessage: "Tải lên thất bại",
                                            uploadMethod: "POST",
                                            uploadMode: "useForm",
                                            uploadedMessage: "Tải lên thành công",
                                        }).dxFileUploader("instance");
                                },
                            },
                        ]

                    },
                    {
                        colSpan: 2,
                        dataField: "backupFrequency",
                        label: {
                            text: "Tần suất tự động sao lưu"
                        }
                    },
                    {
                        colSpan: 2,
                        dataField: "backupSavePath",
                        label: {
                            text: "Đường dẫn lưu file sao lưu"
                        }
                    },
                    {
                        colSpan: 2,
                        dataField: "siteName",
                        label: {
                            text: "Tên hệ thống"
                        }
                    }, {
                        colSpan: 2,
                        dataField: "siteDescription",
                        editorOptions: {
                            height: 250,
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
                                        acceptedValues: ["8pt", "10pt", "12pt", "14pt", "18pt", "20pt", "24pt", "36pt"],
                                        name: "size",
                                    },
                                    {
                                        acceptedValues: ["Arial", "Courier New", "Georgia", "Impact", "Lucida Console", "Tahoma", "Times New Roman", "Verdana"],
                                        name: "font",
                                    },
                                    "separator", "bold", "italic", "strike", "underline", "separator",
                                    "alignLeft", "alignCenter", "alignRight", "alignJustify", "separator",
                                    "orderedList", "bulletList", "separator",
                                    {
                                        acceptedValues: [false, 1, 2, 3, 4, 5],
                                        name: "header",
                                    }, "separator",
                                    "color", "background", "separator",
                                    "link", "image", "separator",
                                    "clear", "codeBlock", "blockquote", "separator",
                                    "insertTable", "deleteTable",
                                    "insertRowAbove", "insertRowBelow", "deleteRow",
                                    "insertColumnLeft", "insertColumnRight", "deleteColumn",
                                ],
                            },
                        },
                        editorType: "dxHtmlEditor",
                        label: {
                            text: "Giới thiệu hệ thống"
                        }
                    },]
            }).dxForm("instance");
        this.refreshDisplayConfigForm();
        this.activeDisplayConfigForm(false);
        displayConfigCon.dxScrollView({
            height: (window.innerHeight - $("header").outerHeight() - 75 - self.displayToolbar.element().outerHeight()).toString() + "px",
        });
    }

    public activeDisplayConfigForm(isActive): void {
        const self = this;
        self.displayToolbar.option("items[1].options.visible", !isActive);
        self.displayToolbar.option("items[2].options.visible", isActive);
        self.displayToolbar.option("items[3].options.visible", isActive);
        if (self.displayConfigForm) {
            self.displayConfigForm.getEditor("siteName").option("disabled", !isActive);
            self.displayConfigForm.getEditor("siteDescription").option("disabled", !isActive);
            self.displayConfigForm.getEditor("backupFrequency").option("disabled", !isActive);
            self.displayConfigForm.getEditor("backupSavePath").option("disabled", !isActive);
            self.dxBackgroundUpload.option("visible", isActive);
            self.dxLogoUpload.option("visible", isActive);
        }
    }

    onInit(): void {
        $(".back-action").css("display", "").on("click", function () {
            window.location.href = "/system";
        });

        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());

        $("#header .logo ").find("span").html("Cấu hình hệ thống");
        this._initDisplayConfigForm();
    }

    public refreshDisplayConfigForm(): void {
        const self = this;
        self.displayConfigForm.repaint();
        self.dxBackgroundUpload.reset();
        self.dxLogoUpload.reset();
        $.get("/api/system/webOption").done(response => {
            if (response.status == EnumStatus.OK) {
                const formData = response.data;
                this.displayConfigForm.option("formData", formData);
                $("#display_config_form").find("img[name=logoSrc]").attr("src", `${this.logoSrc}?${Date.now()}`);
                $("#display_config_form").find("img[name=backgroundSrc]").attr("src", `${this.backgroundSrc}?${Date.now()}`);
            }
            else {
                OGUtils.error(response.errors ? response.errors[0].message : "Lỗi! Vui lòng thử lại sau", "Lỗi");
            }
        });
    }
}
