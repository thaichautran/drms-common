import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxList from "devextreme/ui/list";
import "devextreme/ui/list";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import "devextreme/ui/text_area";
import moment from "moment";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { OGFileModel } from "../../models/base.model";
import { OGChamCongModel, OGNhanVienModel } from "../../models/nhan-vien.model";
import { ChamCongService } from "../../services/cham-cong.service";
import { IBaseComponent } from "../base-component.abstract";


class TimeKeepingReportComponent implements IBaseComponent {
    container: JQuery<HTMLElement>;
    exportForm: dxForm;
    exportPopup: dxPopup;
    form: dxForm;
    grid: dxDataGrid;
    importFiles: OGFileModel[];
    importFilesList: dxList;
    importForm: dxForm;
    importPopup: dxPopup;
    inputFile: JQuery<HTMLElement>;
    loaiNhanVienId: number;
    popup: dxPopup;
    workerStore: CustomStore<OGNhanVienModel, number>;
    constructor(container: JQuery<HTMLElement>, loaiNhanVienId: number) {
        this.container = container;
        this.loaiNhanVienId = loaiNhanVienId;
        this.initLayout();
    }

    private initExport(): void {
        const self = this;
        this.exportPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.exportForm = $("<div/>").appendTo(container).dxForm({
                    colCount: 2,
                    formData: {
                    },
                    items: [
                        {
                            colSpan: 2,
                            dataField: "thoigian",
                            editorOptions: {
                                calendarOptions: {
                                    maxZoomLevel: "year",
                                    minZoomLevel: "century",
                                },
                                displayFormat: "monthAndYear",
                                placeholder: "Tháng",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Tháng",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tháng muốn xuất báo cáo chấm công",
                                type: "required"
                            }],
                        }, {
                            colSpan: 2,
                            dataField: "nhanvien_id",
                            editorOptions: {
                                dataSource: {
                                    store: this.workerStore
                                },
                                displayExpr: "tennhanvien",
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "Nhân viên",
                                searchEnabled: true,
                                showClearButton: true,
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhân viên",
                            }
                        }, {
                            colSpan: 2,
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 2,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.exportForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.exportForm.option("formData");
                                                        data.loainhanvien_id = this.loaiNhanVienId;
                                                        data.thoigian = moment(data.thoigian).format("YYYY-MM-DD");
                                                        OGUtils.postDownload("/api/cham-cong/export", data);
                                                    }
                                                },
                                                stylingMode: "contained",
                                                text: "Xuất báo cáo",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    this.exportPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }
                    ],
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
                self.exportForm.option("formData", {});
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
            title: "Xuất báo cáo chấm công theo tháng",
            width: "25%",
        }).dxPopup("instance");
    }

    private initImport(): void {
        const self = this;
        let thoigian: Date | string;
        this.importPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.importForm = $("<div/>").appendTo(container).dxForm({
                    colCount: 2,
                    formData: {
                    },
                    items: [
                        {
                            colSpan: 2,
                            dataField: "thoigian",
                            editorOptions: {
                                calendarOptions: {
                                    maxZoomLevel: "year",
                                    minZoomLevel: "century",
                                },
                                displayFormat: "monthAndYear",
                                onValueChanged: function (e) {
                                    thoigian = moment(e.value).format("YYYY-MM-DD");
                                },
                                placeholder: "Tháng chấm công",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Tháng",
                            }
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
                                                text: "Nhập file",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "before",
                                            options: {
                                                onClick: () => {
                                                    OGUtils.postDownload("/api/nhan-vien/cham-cong/export/template", { loainhanvien_id: self.loaiNhanVienId, thoigian: thoigian });
                                                },
                                                stylingMode: "contained",
                                                text: "Tải mẫu chấm công",
                                                type: "success"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }, {
                            colSpan: 2,
                            template: (itemData, itemElement) => {
                                this.importFilesList = $("<div />").appendTo(itemElement).dxList({
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
                            colSpan: 2,
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 2,
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
                                                        const data = this.importForm.option("formData");
                                                        data.thoigian = thoigian;
                                                        const formData = OGUtils.jsonToFormData(data);
                                                        formData.append("file", self.importFiles[0].file);
                                                        const xhr = new XMLHttpRequest();
                                                        xhr.open("POST", "/api/cham-cong/import", true);
                                                        xhr.responseType = "json";
                                                        xhr.onload = function () {
                                                        };
                                                        xhr.onloadend = () => {
                                                            OGUtils.hideLoading();
                                                            if (xhr.response.status == "OK") {
                                                                OGUtils.alert("Thao tác thành công!");
                                                                this.grid.getDataSource().reload();
                                                                this.importPopup.hide();
                                                            } else {
                                                                OGUtils.alert(xhr.response.errors[0].message, "Lỗi");
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
                        }
                    ],
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
                self.importForm.option("formData", {});
                self.inputFile.val(null);
                self.importFiles = [];
                self.importFilesList.option("dataSource", self.importFiles);
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
            title: "Nhập chấm công từ file excel",
            width: "25%",
        }).dxPopup("instance");

        this.inputFile = $("<input type=\"file\" accept=\".xlsx\" style=\"display:none !important\" />")
            .appendTo("body")
            .on("change", (e: JQuery.TriggeredEvent) => {
                for (let i = 0; i < e.target.files.length; i++) {
                    const file = e.target.files[i];
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const url = e.target.result;
                        self.importFiles = [{
                            extension: file.name.substring(file.name.lastIndexOf(".")),
                            file: file,
                            file_name: file.name,
                            mime_type: file.type,
                            size: file.size,
                            uid: OGUtils.uuidv4(),
                            url: url
                        }];
                        self.importFilesList.option("dataSource", self.importFiles);
                    };
                    reader.readAsDataURL(file);
                }
            });
    }

    private initLayout(): void {
        this.workerStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios({
                    data: { loainhanvien_id: this.loaiNhanVienId },
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    method: "POST",
                    url: "/api/nhan-vien/list",
                }).then(result => {
                    const data = result.data.data;
                    if (result.data.status === EnumStatus.OK && data && data.length > 0) {
                        deferred.resolve(data);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.initReport(this.container);
        this.initImport();
        this.initExport();
    }

    private initReport(container): void {
        const self = this;
        let keyword = "";
        let nhanvien_id = 0;
        let thoigian: Date | string;
        //let thoigian: Date | string = moment(new Date()).format("YYYY-MM-DD");
        this.grid = $("<div />").appendTo(container).dxDataGrid({
            allowColumnResizing: true,
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.grid.pageIndex();
                    const pageSize = this.grid.pageSize();
                    container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                },
                dataField: "index",
                visible: true,
                width: 50,
            }, {
                caption: "Tên nhân viên",
                dataField: "nhanvien_id",
                groupIndex: 1,
                lookup: {
                    dataSource: {
                        store: this.workerStore,
                    },
                    displayExpr: "tennhanvien",
                    valueExpr: "id",
                },
            }, {
                caption: "Tháng",
                dataField: "month",
                groupIndex: 0,
            }, {
                alignment: "center",
                caption: "Ngày chấm công",
                dataField: "ngay",
                dataType: "date",
                width: 200
            }, {
                caption: "Có chấm công",
                dataField: "chamcong",
                dataType: "boolean",
                width: 150,
            }, {
                caption: "Nghỉ có phép",
                dataField: "nghicophep",
                dataType: "boolean",
                width: 150,
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
                                    // disabled: true,
                                    hint: "Chỉnh sửa",
                                    icon: "edit",
                                    onClick: () => {
                                        self.form.option("formData", options.row.data);
                                        self.popup.show();
                                    },
                                    type: "success"
                                },
                                widget: "dxButton",
                            }, {
                                location: "center",
                                options: {
                                    // disabled: true,
                                    hint: "Xóa",
                                    icon: "trash",
                                    onClick: () => {
                                        OGUtils.confirm("Bạn có muốn xóa bản chấm công này?").then(value => {
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
                        return ChamCongService.insert(values);
                    },
                    key: "id",
                    load: (loadOptions) => {
                        const deferred = $.Deferred();
                        const args = {};
                        if (loadOptions.sort) {
                            args["orderby"] = loadOptions.sort[0].selector;
                            if (loadOptions.sort[0].desc)
                                args["orderby"] += " desc";
                        }
                        args["skip"] = loadOptions.skip ? loadOptions.skip : 0;
                        args["take"] = loadOptions.take ? loadOptions.take : 50;
                        args["keyword"] = keyword;
                        args["loainhanvien_id"] = this.loaiNhanVienId;
                        args["nhanvien_id"] = nhanvien_id;
                        args["thoigian"] = thoigian;
                        ChamCongService.list(args).then(result => {
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
                        return axios.delete("/api/cham-cong/" + key);
                    },
                    update: (key, values) => {
                        return ChamCongService.insert(values);
                    }
                }),
            },
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        dataField: "nhanvien_id",
                        validationRules: [{
                            message: "Vui lòng chọn nhân viên",
                            type: "required"
                        }],
                    }, {
                        dataField: "ngay",
                        validationRules: [{
                            message: "Vui lòng chọn ngày chấm công",
                            type: "required"
                        }],
                    }, {
                        dataField: "chamcong",
                    }, {
                        dataField: "nghicophep",
                    }, {
                        dataField: "ghichu",
                    },]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin chấm công của nhân viên",
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
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;

                e.toolbarOptions.items.unshift({
                    location: "before",
                    template: () => {
                        return "<h6>BÁO CÁO CHẤM CÔNG</h6>";
                    }
                }, {
                    location: "after",
                    options: {
                        hint: "Nhập file chấm công",
                        icon: "icon icon-note-favorite",
                        onClick: (e) => {
                            this.importPopup.show();
                        },
                        text: "Nhập file chấm công",
                        type: "success",
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Xuất báo cáo chấm công",
                        icon: "icon icon-ram",
                        onClick: (e) => {
                            this.exportPopup.show();
                        },
                        text: "Xuất báo cáo",
                        type: "success",
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Thêm mới bản ghi chấm công",
                        icon: "add",
                        onClick: (e) => {
                            self.form.option("formData", {});
                            self.form.resetValues();
                            this.popup.show();
                        },
                        type: "default",
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        calendarOptions: {
                            maxZoomLevel: "year",
                            minZoomLevel: "century",
                        },
                        displayFormat: "monthAndYear",
                        onValueChanged: function (e) {
                            if (e.value) {
                                thoigian = moment(e.value).format("YYYY-MM-DD");
                            } else {
                                thoigian = undefined;
                            }
                            dataGrid.getDataSource().reload();
                        },
                        placeholder: "Thời gian chấm công",
                        showClearButton: true,
                        type: "date",
                    },
                    widget: "dxDateBox"
                }, {
                    location: "after",
                    options: {
                        dataSource: {
                            store: this.workerStore
                        },
                        displayExpr: "tennhanvien",
                        onContentReady: () => {
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                if (this.offsetWidth < this.scrollWidth) {
                                    $ele.attr("title", $ele.text());
                                }
                            });
                        },
                        onSelectionChanged: function (e) {
                            nhanvien_id = e.component.option("value");
                            dataGrid.getDataSource().reload();
                        },
                        placeholder: "Nhân viên",
                        searchEnabled: true,
                        showClearButton: true,
                        valueExpr: "id",
                    },
                    widget: "dxSelectBox"
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

        this.popup = $("<div class='info-popup' />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.form = $("<div />").appendTo(container)
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
                            dataField: "nhanvien_id",
                            editorOptions: {
                                dataSource: {
                                    store: this.workerStore
                                },
                                displayExpr: "tennhanvien",
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "Chọn nhân viên",
                                searchEnabled: true,
                                showClearButton: true,
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Tên nhân viên"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên nhân viên",
                                type: "required"
                            }],
                        }, {
                            colSpan: 2,
                            dataField: "ngay",
                            editorType: "dxDateBox",
                            label: {
                                text: "Ngày chấm công"
                            },
                            validationRules: [{
                                message: "Vui lòng chọn ngày chấm công",
                                type: "required"
                            }],
                        }, {
                            colSpan: 1,
                            dataField: "chamcong",
                            editorType: "dxCheckBox",
                            label: {
                                text: "Chấm công"
                            },
                            validationRules: [{
                                message: "Chỉ được chấm công khi trường nghỉ có phép không được chọn",
                                type: "custom",
                                validationCallback: function (e) {
                                    const chamcong = e.value;
                                    const nghicophep = self.form.getEditor("nghicophep").option("value");
                                    if (chamcong && nghicophep) {
                                        return false;
                                    } else {
                                        return true;
                                    }
                                }
                            }]
                        }, {
                            colSpan: 1,
                            dataField: "nghicophep",
                            editorType: "dxCheckBox",
                            label: {
                                text: "Nghỉ có phép"
                            },
                            validationRules: [{
                                message: "Chỉ được chọn nghỉ có phép khi không chấm công",
                                type: "custom",
                                validationCallback: function (e) {
                                    const nghicophep = e.value;
                                    const chamcong = self.form.getEditor("chamcong").option("value");
                                    if (chamcong && nghicophep) {
                                        return false;
                                    } else {
                                        return true;
                                    }
                                }
                            }]
                        }, {
                            colSpan: 2,
                            dataField: "ghichu",
                            editorType: "dxTextArea",
                            label: {
                                text: "Ghi chú"
                            }
                        }],
                        labelLocation: "left",
                        minColWidth: 300,
                        showColonAfterLabel: true,
                        width: "100%"
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: 350,
            hideOnOutsideClick: false,
            onHidden: () => {
                self.form.option("readOnly", false);
            },
            shading: false,
            showTitle: true,
            title: "Thông tin chấm công của nhân viên",
            toolbarItems: [{
                location: "after",
                options: {
                    icon: "icon icon-save-2",
                    onClick: function (e) {
                        const validate = self.form.validate();
                        if (validate && validate.brokenRules.length === 0) {
                            OGUtils.showLoading();
                            setTimeout(() => {
                                const data: OGChamCongModel = self.form.option("formData");
                                ChamCongService.insert(data).then(result => {
                                    OGUtils.hideLoading();
                                    if (result.status === EnumStatus.OK) {
                                        OGUtils.alert("Lưu bản ghi chấm công thành công!");
                                        self.popup.hide();
                                        self.grid.getDataSource().reload();
                                    } else {
                                        OGUtils.error(result["errors"][0].message, "Lỗi");
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
                        self.popup.hide();
                    },
                    text: "Hủy",
                    type: "danger"
                },
                toolbar: "bottom",
                widget: "dxButton"
            },],
            width: 700
        }).dxPopup("instance");
    }
    onInit(): void {

    }
}

export { TimeKeepingReportComponent };
