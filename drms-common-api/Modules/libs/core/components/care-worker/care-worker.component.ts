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

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { OGNhanVienModel } from "../../models/nhan-vien.model";
import { NhanVienService } from "../../services/nhan-vien.service";
import { IBaseComponent } from "../base-component.abstract";


class CareWorkerComponent implements IBaseComponent {
    container: JQuery<HTMLElement>;

    form: dxForm;
    grid: dxDataGrid;
    loaiNhanVienId: number;
    popup: dxPopup;
    constructor(container: JQuery<HTMLElement>, loaiNhanVienId: number) {
        this.container = container;
        this.loaiNhanVienId = loaiNhanVienId;
        this.initLayout();
    }


    private initCareWorker(container): void {
        const self = this;
        let keyword = "";
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
                dataField: "tennhanvien",
                width: 200,
            }, {
                caption: "Địa chỉ",
                dataField: "diachi",
                width: 300,
            }, {
                caption: "Số điện thoại",
                dataField: "sodienthoai",
                width: 150,
            }, {
                caption: "Chức vụ",
                dataField: "chucvu",
            }, {
                caption: "Đơn vị công tác",
                dataField: "donvicongtac",
            }, {
                caption: "Email",
                dataField: "email",
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
                                        self.form.option("formData", options.row.data);
                                        self.popup.show();
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
                                        OGUtils.confirm("Bạn có muốn xóa nhân viên này?").then(value => {
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
                        values.loainhanvien_id = this.loaiNhanVienId;
                        return NhanVienService.insert(values);
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

                        NhanVienService.list(args).then(result => {
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
                        return axios.delete("/api/worker/" + key);
                    },
                    update: (key, values) => {
                        values.loainhanvien_id = this.loaiNhanVienId;
                        return NhanVienService.insert(values);
                    }
                }),
            },
            editing: {
                form: {
                    colCount: 1,
                    items: [{
                        dataField: "tennhanvien",
                        validationRules: [{
                            message: "Vui lòng nhập tên nhân viên",
                            type: "required"
                        }],
                    }, {
                        dataField: "diachi",
                    }, {
                        dataField: "sodienthoai",
                    }, {
                        dataField: "chucvu",
                    }, {
                        dataField: "donvicongtac",
                    }, {
                        dataField: "email",
                        validationRules: [{
                            type: "email",
                        },],
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin nhân viên sửa chữa, bảo trì hệ thống",
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
                        return "<h6>QUẢN LÝ NHÂN VIÊN SỬA CHỮA, BẢO TRÌ HỆ THỐNG</h6>";
                    }
                }, {
                    location: "after",
                    options: {
                        hint: "Thêm nhân viên",
                        icon: "add",
                        onClick: (e) => {
                            self.form.option("formData", {});
                            self.form.resetValues();
                            this.popup.show();
                        },
                        text: "Thêm nhân viên",
                        type: "default",
                    },
                    widget: "dxButton"
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
                            dataField: "tennhanvien",
                            label: {
                                text: "Tên nhân viên"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên nhân viên",
                                type: "required"
                            }],
                        }, {
                            colSpan: 2,
                            dataField: "diachi",
                            label: {
                                text: "Địa chỉ"
                            },
                        }, {
                            colSpan: 2,
                            dataField: "sodienthoai",
                            label: {
                                text: "Số điện thoại"
                            },
                        }, {
                            colSpan: 2,
                            dataField: "chucvu",
                            label: {
                                text: "Chức vụ"
                            },
                        }, {
                            colSpan: 2,
                            dataField: "donvicongtac",
                            label: {
                                text: "Đơn vị công tác"
                            },
                        }, {
                            colSpan: 2,
                            dataField: "email",
                            label: {
                                text: "Email"
                            },
                            validationRules: [{
                                type: "email",
                            },],
                        }],
                        labelLocation: "left",
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
                self.form.option("readOnly", false);
            },
            shading: false,
            showTitle: true,
            title: "Thông tin nhân viên",
            toolbarItems: [{
                location: "after",
                options: {
                    icon: "icon icon-save-2",
                    onClick: function (e) {
                        const validate = self.form.validate();
                        if (validate && validate.brokenRules.length === 0) {
                            OGUtils.showLoading();
                            setTimeout(() => {
                                const data: OGNhanVienModel = self.form.option("formData");
                                data.loainhanvien_id = self.loaiNhanVienId;
                                NhanVienService.insert(data).then(result => {
                                    OGUtils.hideLoading();
                                    if (result) {
                                        OGUtils.alert("Lưu nhân viên thành công!");
                                        self.popup.hide();
                                        self.grid.getDataSource().reload();
                                    } else {
                                        OGUtils.error("Lưu nhân viên thất bại!", "Lỗi");
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

    private initLayout(): void {
        this.initCareWorker(this.container);
    }
    onInit(): void {

    }
}

export { CareWorkerComponent };
