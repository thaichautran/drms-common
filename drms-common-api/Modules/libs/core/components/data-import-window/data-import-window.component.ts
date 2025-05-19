import { OGMap } from "@opengis/map";
import dxForm, { Item as dxFormItem } from "devextreme/ui/form";
import dxList from "devextreme/ui/list";
import dxPopup from "devextreme/ui/popup";

import { EnumImportFileType } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { FeatureFile } from "../../models/feature.model";
import { OGLayerModel } from "../../models/layer.model";
import { OGTableModel } from "../../models/table.model";
import { IMapComponent } from "../base-component.abstract";

class DataImportWindowComponent implements IMapComponent {
    container: JQuery<HTMLElement>;
    excelInputElement: JQuery<HTMLElement>;
    fileList: dxList;
    fileType: EnumImportFileType;
    files: FeatureFile[];
    gDBInputElement: JQuery<HTMLElement>;
    importForm: dxForm;
    importPopup: dxPopup;
    oGISLayerID: number;
    oGISTableID: number;
    oGMap: OGMap;

    promise: (e) => void;
    shapeFileInputElement: JQuery<HTMLElement>;
    constructor(oGMap: OGMap) {
        this.oGMap = oGMap;
        this.onInit();
    }
    public for(layerInfo: OGLayerModel, tableInfo: OGTableModel, fileType: EnumImportFileType, callback: (e) => void): DataImportWindowComponent {
        const self = this;
        this.oGISLayerID = layerInfo ? layerInfo.id : 0;
        this.oGISTableID = tableInfo ? tableInfo.id : 0;
        this.fileType = fileType;
        this.promise = callback;

        let items: dxFormItem[] = [{
            template: (itemData, itemElement) => {
                $("<div />").appendTo(itemElement)
                    .dxToolbar({
                        items: [{
                            location: "before",
                            options: {
                                onClick: () => {
                                    if (this.fileType == EnumImportFileType.SHAPEFILE) {
                                        this.shapeFileInputElement.trigger("click");
                                    } else if (this.fileType == EnumImportFileType.EXCEL) {
                                        this.excelInputElement.trigger("click");
                                    } else {
                                        this.gDBInputElement.trigger("click");
                                    }
                                },
                                stylingMode: "contained",
                                text: "Nhập file dữ liệu",
                                type: "default"
                            },
                            widget: "dxButton"
                        }]
                    });
            }
        }];
        if (this.fileType == EnumImportFileType.SHAPEFILE) {
            this.importPopup.option("title", "Nhập dữ liệu từ Shapefile");
        } else if (this.fileType == EnumImportFileType.EXCEL) {
            this.importPopup.option("title", "Nhập dữ liệu từ file Excel");
            items = [{
                template: (itemData, itemElement) => {
                    $("<div />").appendTo(itemElement)
                        .dxToolbar({
                            items: [{
                                location: "before",
                                options: {
                                    onClick: () => {
                                        if (this.fileType == EnumImportFileType.SHAPEFILE) {
                                            this.shapeFileInputElement.trigger("click");
                                        } else if (this.fileType == EnumImportFileType.EXCEL) {
                                            this.excelInputElement.trigger("click");
                                        } else {
                                            this.gDBInputElement.trigger("click");
                                        }
                                    },
                                    stylingMode: "contained",
                                    text: "Nhập file dữ liệu",
                                    type: "default"
                                },
                                widget: "dxButton"
                            }, {
                                location: "after",
                                options: {
                                    onClick: () => {
                                        OGUtils.postDownload("/api/layer/export/templates/" + this.fileType, { layer_id: this.oGISLayerID }, "application/json");
                                    },
                                    stylingMode: "contained",
                                    text: "Tải mẫu nhập",
                                    type: "success"
                                },
                                widget: "dxButton"
                            }]
                        });
                }
            }];
        } else {
            this.importPopup.option("title", "Nhập dữ liệu từ file GDB");
        }
        if ((!layerInfo || layerInfo.id === 0) && (!tableInfo || tableInfo.id === 0)) {
            OGUtils.warning("Lỗi! Không tìm thấy lớp dữ liệu!");
        }
        items.push({
            template: (itemData, itemElement) => {
                this.fileList = $("<div />").appendTo(itemElement).dxList({
                    itemTemplate(data) {
                        return `<a href=${data.url}>${data.file_name}</a >`;
                    },
                    onContentReady() {

                    },
                    onSelectionChanged: () => {
                    },
                    selectionMode: "single",
                }).dxList("instance");
            }
        }, {
            dataField: "truncateData",
            editorOptions: {
            },
            editorType: "dxCheckBox",
            label: {
                text: "Xóa dữ liệu"
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
                            location: "center",
                            options: {
                                onClick: () => {
                                    const validate = this.importForm.validate();
                                    if (validate && validate.brokenRules.length === 0) {
                                        OGUtils.showLoading();
                                        const formData = new FormData();
                                        formData.append("file", self.files[0].raw);
                                        formData.append("layerId", self.oGISLayerID.toString());
                                        formData.append("tableId", self.oGISTableID.toString());
                                        formData.append("truncateData", this.importForm.option("formData")?.truncateData || false);
                                        const xhr = new XMLHttpRequest();
                                        if (this.fileType == EnumImportFileType.SHAPEFILE) {
                                            formData.append("type", "SHP");
                                            xhr.open("POST", "/api/layer/import", true);
                                        } else if (this.fileType == EnumImportFileType.EXCEL) {
                                            formData.append("type", "Excel");
                                            xhr.open("POST", "/api/layer/import", true);
                                        } else {
                                            formData.append("type", "GDB");
                                            xhr.open("POST", "/api/layer/import", true);
                                        }
                                        xhr.responseType = "json";
                                        xhr.onload = function () {
                                        };
                                        xhr.onloadend = () => {
                                            OGUtils.hideLoading();
                                            if (this.promise) {
                                                this.promise.call(this, xhr.response);
                                            }
                                            if (xhr.response) {
                                                if (xhr.response.status == "OK") {
                                                    OGUtils.toastSuccess("Nhập dữ liệu thành công");
                                                    this.importPopup.hide();
                                                } else if (xhr) {
                                                    OGUtils.toastError(xhr.response);
                                                }
                                            }
                                        };
                                        xhr.send(formData);
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
                                    this.importPopup.hide();
                                },
                                stylingMode: "contained",
                                text: "Hủy",
                                type: "danger"
                            },
                            widget: "dxButton"
                        }]
                    });
            }
        });
        this.importForm.option("items", items);
        this.importForm.option("formData", {
            truncateData: false,
        });
        return this;
    }

    public hide(): void {
        if (this.importPopup) {
            this.excelInputElement.val("");
            this.shapeFileInputElement.val("");
            this.gDBInputElement.val("");
            this.files = [];
            this.fileList.getDataSource().reload();
            this.importPopup.hide();
        }
    }
    onInit(): void {
        const self = this;
        //
        this.container = $("<div />").appendTo("body");

        this.importPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.importForm = $("<div/>").appendTo(container).dxForm({
                    colCount: 1,
                    items: [],
                    // items: [
                    //     {
                    //         template: (itemData, itemElement) => {
                    //             $("<div />").appendTo(itemElement)
                    //                 .dxToolbar({
                    //                     items: [{
                    //                         location: "before",
                    //                         options: {
                    //                             onClick: () => {
                    //                                 if (this.fileType == EnumImportFileType.SHAPEFILE) {
                    //                                     this.shapeFileInputElement.trigger("click");
                    //                                 }
                    //                                 else if (this.fileType == EnumImportFileType.EXCEL) {
                    //                                     this.excelInputElement.trigger("click");
                    //                                 } else {
                    //                                     this.gDBInputElement.trigger("click");
                    //                                 }
                    //                             },
                    //                             stylingMode: "contained",
                    //                             text: "Nhập file dữ liệu",
                    //                             type: "default"
                    //                         },
                    //                         widget: "dxButton"
                    //                     }]
                    //                 });
                    //         }
                    //     }, {
                    //         template: (itemData, itemElement) => {
                    //             this.fileList = $("<div />").appendTo(itemElement).dxList({
                    //                 itemTemplate(data) {
                    //                     /*data.file_name = data.file_name.substring(data.file_name.indexOf('.zip') + 4, 0);*/
                    //                     return `<a href=${data.url}>${data.file_name}</a >`;
                    //                 },
                    //                 onContentReady() {

                    //                 },
                    //                 onSelectionChanged: () => {
                    //                 },
                    //                 selectionMode: "single",
                    //             }).dxList("instance");
                    //         }
                    //     }, {
                    //         colSpan: 1,
                    //         template: () => {
                    //             return "<hr style=\"margin: 5px 0;\" />";
                    //         }
                    //     }, {
                    //         colSpan: 1,
                    //         template: (itemData, itemElement) => {
                    //             $("<div />").appendTo(itemElement)
                    //                 .dxToolbar({
                    //                     items: [{
                    //                         location: "center",
                    //                         options: {
                    //                             onClick: () => {
                    //                                 const validate = this.importForm.validate();
                    //                                 if (validate && validate.brokenRules.length === 0) {
                    //                                     OGUtils.showLoading();
                    //                                     const formData = new FormData();
                    //                                     formData.append("file", self.files[0].raw);
                    //                                     const xhr = new XMLHttpRequest();
                    //                                     if (this.fileType == EnumImportFileType.SHAPEFILE) {
                    //                                         xhr.open("POST", `/api/layer/${self.oGISLayerID}/import/SHP`, true);
                    //                                     } else if (this.fileType == EnumImportFileType.EXCEL) {
                    //                                         xhr.open("POST", `/api/layer/${self.oGISLayerID}/import/Excel`, true);
                    //                                     } else {
                    //                                         xhr.open("POST", `/api/layer/${self.oGISLayerID}/import/GDB`, true);
                    //                                     }
                    //                                     xhr.responseType = "json";
                    //                                     xhr.onload = function () {
                    //                                     };
                    //                                     xhr.onloadend = () => {
                    //                                         OGUtils.hideLoading();
                    //                                         if (this.promise) {
                    //                                             this.promise.call(this, xhr.response);
                    //                                         }
                    //                                         if (xhr.response) {
                    //                                             if (xhr.response.status == "OK") {
                    //                                                 OGUtils.alert("Nhập dữ liệu thành công");
                    //                                                 this.importPopup.hide();
                    //                                             } else if (xhr.response.errors && xhr.response.errors.length) {
                    //                                                 OGUtils.alert(xhr.response.errors[0].message, "Lỗi");
                    //                                             }
                    //                                         }
                    //                                     };
                    //                                     xhr.send(formData);
                    //                                 }
                    //                             },
                    //                             stylingMode: "contained",
                    //                             text: "Lưu",
                    //                             type: "default"
                    //                         },
                    //                         widget: "dxButton"
                    //                     }, {
                    //                         location: "center",
                    //                         options: {
                    //                             onClick: () => {
                    //                                 this.importPopup.hide();
                    //                             },
                    //                             stylingMode: "contained",
                    //                             text: "Hủy",
                    //                             type: "danger"
                    //                         },
                    //                         widget: "dxButton"
                    //                     }]
                    //                 });
                    //         }
                    //     }
                    // ],
                    labelLocation: "left",
                    minColWidth: 300,
                    showColonAfterLabel: true,
                    width: "100%",
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onHiding: () => {
                self.importForm.option("formData", {
                    truncateData: false,
                });
                self.excelInputElement.val(null);
                self.shapeFileInputElement.val(null);
                self.gDBInputElement.val(null);
                self.files = [];
                self.fileList.option("dataSource", self.files);
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
            showCloseButton: false,
            showTitle: true,
            title: "Nhập dữ liệu từ shapefile",
            width: "25%",
        }).dxPopup("instance");

        this.shapeFileInputElement = $("<input type=\"file\" accept=\".zip,.rar\" style=\"display:none !important\" />")
            .appendTo(this.container)
            .on("change", (e: JQuery.TriggeredEvent) => {
                for (let i = 0; i < e.target.files.length; i++) {
                    const file = e.target.files[i];
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const url = e.target.result;
                        self.files = [{
                            extension: file.name.substring(file.name.lastIndexOf(".")),
                            file_name: file.name,
                            mime_type: file.type,
                            raw: file,
                            size: file.size,
                            uid: OGUtils.uuidv4(),
                            url: url
                        }];
                        self.fileList.option("dataSource", self.files);
                    };
                    reader.readAsDataURL(file);
                }
            });

        this.excelInputElement = $("<input type=\"file\" accept=\".xlsx\" style=\"display:none !important\" />")
            .appendTo(this.container)
            .on("change", (e: JQuery.TriggeredEvent) => {
                for (let i = 0; i < e.target.files.length; i++) {
                    const file = e.target.files[i];
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const url = e.target.result;
                        self.files = [{
                            extension: file.name.substring(file.name.lastIndexOf(".")),
                            file_name: file.name,
                            mime_type: file.type,
                            raw: file,
                            size: file.size,
                            uid: OGUtils.uuidv4(),
                            url: url
                        }];
                        self.fileList.option("dataSource", self.files);
                    };
                    reader.readAsDataURL(file);
                }
            });

        this.gDBInputElement = $("<input type=\"file\" accept=\".zip,.rar\" style=\"display:none !important\" />")
            .appendTo(this.container)
            .on("change", (e: JQuery.TriggeredEvent) => {
                for (let i = 0; i < e.target.files.length; i++) {
                    const file = e.target.files[i];
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const url = e.target.result;
                        self.files = [{
                            extension: file.name.substring(file.name.lastIndexOf(".")),
                            file_name: file.name,
                            mime_type: file.type,
                            raw: file,
                            size: file.size,
                            uid: OGUtils.uuidv4(),
                            url: url
                        }];
                        self.fileList.option("dataSource", self.files);
                    };
                    reader.readAsDataURL(file);
                }
            });
    }

    public show(): void {
        if (this.importPopup) {
            this.importPopup.show();
        }
    }
}

export { DataImportWindowComponent, EnumImportFileType };