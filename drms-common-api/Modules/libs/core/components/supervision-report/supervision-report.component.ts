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
import { data } from "jquery";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { OGNhanVienModel } from "../../models/nhan-vien.model";
import { GiamSatNhanVienService } from "../../services/giam-sat-nhan-vien.service";
import { IBaseComponent } from "../base-component.abstract";

class SupervisionReportComponent implements IBaseComponent {
    container: JQuery<HTMLElement>;
    form: dxForm;
    grid: dxDataGrid;
    loaiNhanVienId: number;
    popup: dxPopup;
    workerStore: CustomStore;
    constructor(container: JQuery<HTMLElement>, loaiNhanVienId: number) {
        this.container = container;
        this.loaiNhanVienId = loaiNhanVienId;
        this.initLayout();
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
                    const data = result.data;
                    if (result.data.status === EnumStatus.OK && data.data && data.data.length > 0) {
                        deferred.resolve(data.data);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.initReport(this.container);
    }

    private initReport(container): void {
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
                dataField: "nhanvien_id",
                lookup: {
                    dataSource: self.workerStore,
                    displayExpr: "tennhanvien",
                    valueExpr: "id"
                },
                width: 200,
            }, {
                caption: "Thời gian thực hiện",
                dataField: "thoigian_thuchien",
                dataType: "date",
                width: 200,
            }, {
                caption: "Thời gian kết thúc",
                dataField: "thoigian_ketthuc",
                dataType: "date",
                width: 200,
            }, {
                caption: "Công việc thực hiện",
                dataField: "congviecthuchien",
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
                                        OGUtils.confirm("Bạn có muốn xóa bản ghi giám sát nhân viên này không?").then(value => {
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
                        return GiamSatNhanVienService.insert(values);
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

                        GiamSatNhanVienService.list(args).then(result => {
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
                        return GiamSatNhanVienService.delete({ id: key });
                    },
                    update: (key, values) => {
                        return GiamSatNhanVienService.insert(values);
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
                        dataField: "thoigian_thuchien",
                    }, {
                        dataField: "thoigian_ketthuc",
                    }, {
                        dataField: "congviecthuchien",
                        validationRules: [{
                            message: "Vui lòng nhập mô tả công việc",
                            type: "required"
                        }],
                    }, {
                        dataField: "ghichu",
                    }]
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin giám sát nhân viên",
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
                        return "<h6>BÁO CÁO GIÁM SÁT NHÂN VIÊN</h6>";
                    }
                }, {
                    location: "after",
                    options: {
                        hint: "Xuất báo cáo giám sát nhân viên",
                        onClick: (e) => {
                            OGUtils.postDownload("/api/nhan-vien/giam-sat/export", { loainhanvien_id: this.loaiNhanVienId });
                        },
                        text: "Xuất báo cáo",
                        type: "success",
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Thêm giám sát nhân viên",
                        icon: "add",
                        onClick: (e) => {
                            self.form.option("formData", {});
                            self.form.resetValues();
                            this.popup.show();
                        },
                        text: "Thêm giám sát",
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
                            dataField: "thoigian_thuchien",
                            editorType: "dxDateBox",
                            label: {
                                text: "Thời gian thực hiện"
                            },
                        }, {
                            colSpan: 2,
                            dataField: "thoigian_ketthuc",
                            editorType: "dxDateBox",
                            label: {
                                text: "Thời gian kết thúc"
                            },
                        }, {
                            colSpan: 2,
                            dataField: "congviecthuchien",
                            editorType: "dxTextArea",
                            label: {
                                text: "Công việc thực hiện"
                            }
                        }, {
                            colSpan: 2,
                            dataField: "ghichu",
                            editorType: "dxTextArea",
                            label: {
                                text: "Ghi chú"
                            },
                        },],
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
            title: "Thông tin giám sát nhân viên",
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
                                GiamSatNhanVienService.insert(data).then(result => {
                                    OGUtils.hideLoading();
                                    self.popup.hide();
                                    self.grid.getDataSource().reload();
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

export { SupervisionReportComponent };
