import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import dxDropDownButton from "devextreme/ui/drop_down_button";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import "devextreme/ui/progress_bar";
import dxProgressBar from "devextreme/ui/progress_bar";
import dxSelectBox from "devextreme/ui/select_box";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { PhanPhoiDuLieuModel } from "../../../../../../../libs/core/models/tichhop-dulieu.model";
import { PhanPhoiDuLieuService } from "../../../../../../../libs/core/services/phanphoi-dulieu.service";
import { TableService } from "../../../../../../../libs/core/services/table.service";
import "./phan-phoi-du-lieu.view.scss";
class PhanPhoiDuLieuView implements IBaseComponent {
    container: JQuery<HTMLElement>;
    ipAddress: string[];
    layerGrid: dxDataGrid;
    layerSelect: dxSelectBox;
    layerStore: CustomStore;
    phanPhoiDuLieuStore: CustomStore<PhanPhoiDuLieuModel, number>;
    progressBar: dxProgressBar;
    progressPopup: dxPopup;
    syncButton: dxDropDownButton;
    syncGrid: dxDataGrid;
    syncPopup: dxPopup;
    syncTimeForm: dxForm;
    syncTimePopup: dxPopup;
    tableSchema: string;
    tableSchemaSelect: dxSelectBox;
    tableSchemaStore: CustomStore;
    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.ipAddress = [
            "192.168.1.23",
            "172.16.254.15",
            "10.0.0.127",
            "131.107.20.19",
            "203.107.25.11",
            "147.238.19.12",
            "185.247.17.23",
            "162.217.16.14",
            "157.235.15.25",
            "173.227.14.18"
        ];
        PhanPhoiDuLieuService.sync().then(() => {
            this.onInit();
            this.initSyncPopup();
        });
    }
    private initSyncPopup(): void {
        const self = this;
        this.syncTimePopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.syncTimeForm = $("<div></div>").appendTo(container).dxForm({
                    colCount: 1,
                    formData: {},
                    items: [{
                        dataField: "sync_time",
                        editorOptions: {
                            applyButtonText: "Xác nhận",
                            cancelButtonText: "Hủy",
                            displayFormat: "dd/MM/yyyy HH:mm",
                            invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy HH:mm",
                            min: new Date(),
                            showAnalogClock: false,
                            showClearButton: true,
                            type: "datetime",
                            width: "100%",
                        },
                        editorType: "dxDateBox",
                        label: {
                            text: "Thời gian",
                        },
                        validationRules: [{
                            message: "Vui lòng chọn ngày giờ sync",
                            type: "required"
                        }]
                    }, {
                        template: (itemData, itemElement) => {
                            $("<div />").appendTo(itemElement)
                                .dxToolbar({
                                    items: [
                                        {
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.syncTimeForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        OGUtils.showLoading();
                                                        if (this.layerGrid.option("dataSource")[0]) {
                                                            const item = this.layerGrid.option("dataSource")[0];
                                                            console.log(item);
                                                            PhanPhoiDuLieuService.insert({
                                                                data_count: item.data_count,
                                                                database_name: item.table.table_schema,
                                                                id: 0,
                                                                ip_address: item.ip_address,
                                                                is_integrated: false,
                                                                layer_id: item.id,
                                                                sync_date: item.sync_date
                                                            }).then(result => {
                                                                OGUtils.alert("Đặt lịch thành công!");
                                                                this.syncTimePopup.hide();
                                                                this.syncGrid.getDataSource().reload();
                                                            });
                                                        }
                                                    }
                                                },
                                                stylingMode: "contained",
                                                text: "Xác nhận",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    this.syncTimeForm.resetValues();
                                                    this.syncTimePopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                }).dxToolbar("instance");
                        }
                    }],
                    labelLocation: "left",
                    minColWidth: 300,
                    showColonAfterLabel: true,
                    width: "100%",
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: true,
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
            title: "Đặt lịch sync dữ liệu",
            width: "auto",
        }).dxPopup("instance");

        this.syncPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.layerGrid = $("<div />").appendTo(container).dxDataGrid({
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    columns: [{
                        alignment: "center",
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.layerGrid.pageIndex();
                            const pageSize = this.layerGrid.pageSize();
                            container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                        },
                        dataField: "index",
                        visible: true,
                        width: 50,
                    }, {
                        alignment: "left",
                        caption: "Địa chỉ IP - Database",
                        cellTemplate: (container, options) => {
                            container.html(`${options.value} - ${options.data.table.table_schema}`);
                        },
                        dataField: "ip_address",
                        width: 400,
                    }, {
                        caption: "Tên lớp",
                        dataField: "name_vn",
                        width: 200
                    }, {
                        caption: "Dữ liệu nguồn (Phần mềm CSDL HTĐT)",
                        columns: [{
                            caption: "Số đối tượng",
                            cellTemplate: (container, options) => {
                                container.html(OGUtils.formatNumber(options.value));
                            },
                            dataField: "data_count",
                        }, {
                            caption: "Trường thông tin",
                            cellTemplate: (container, options) => {
                                if (options.value.length) {
                                    options.value.forEach(item => {
                                        container.append(`<p>${item.name_vn}</p>`);
                                    });
                                }
                            },
                            dataField: "table.columns",
                        }, {
                            caption: "Ngày cập nhật",
                            dataField: "sync_date",
                            format: "dd/MM/yyyy"
                        },]
                    }, {
                        caption: "Dữ liệu đích (Từ hệ thống khác)",
                        columns: [{
                            caption: "Số đối tượng",
                            cellTemplate: (container, options) => {
                                container.html(OGUtils.formatNumber(options.value));
                            },
                            dataField: "data_count",
                        }, {
                            caption: "Trường thông tin",
                            cellTemplate: (container, options) => {
                                if (options.value.length) {
                                    options.value.forEach(item => {
                                        container.append(`<p>${item.name_vn}</p>`);
                                    });
                                }
                            },
                            dataField: "table.columns",
                        }, {
                            caption: "Ngày cập nhật",
                            dataField: "sync_date",
                            format: "dd/MM/yyyy"
                        },]
                    },],
                    dataSource: {
                        store: []
                    },
                    errorRowEnabled: false,
                    // groupPanel: {
                    //     visible: true,
                    // },
                    height: "100%",
                    loadPanel: {
                        text: "Đang tải dữ liệu"
                    },
                    onEditorPreparing: (e) => {
                        if (e.row) {
                            // this.selectedLayerInfo = e.row.data;
                        }
                    },
                    onRowUpdating: function (options) {
                        $.extend(options.newData, $.extend({}, options.oldData, options.newData));
                    },
                    onToolbarPreparing: (e) => {
                        e.toolbarOptions.items.push({
                            location: "before",
                            options: {
                                dataSource: {
                                    store: this.tableSchemaStore,
                                },
                                displayExpr: "description",
                                onContentReady: (e) => {
                                    e.element.find(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        $ele.attr("title", $ele.text());
                                    });
                                },
                                onSelectionChanged: (e) => {
                                    this.tableSchemaSelect = e.component;
                                    if (e.selectedItem) {
                                        this.tableSchema = e.selectedItem.schema_name;
                                    }
                                    this.layerSelect.getDataSource().reload();
                                    this.layerSelect.reset();
                                    this.layerGrid.option("dataSource", []);
                                    this.syncButton.option("disabled", true);
                                },
                                placeholder: "Chọn Schema",
                                searchEnabled: true,
                                searchExpr: ["schema_name", "description"],
                                searchMode: "contains",
                                valueExpr: "schema_name",
                                width: 200
                            },
                            widget: "dxSelectBox"
                        }, {
                            location: "before",
                            options: {
                                dataSource: {
                                    store: this.layerStore,
                                },
                                displayExpr: "name_vn",
                                onContentReady: (e) => {
                                    e.element.find(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        $ele.attr("title", $ele.text());
                                    });
                                    this.layerSelect = e.component;
                                },
                                onSelectionChanged: (e) => {
                                    if (e.selectedItem?.table) {

                                        let seconds = 10;
                                        const ipAddress = OGUtils.randomIpAddress();
                                        // let inProgress = false;
                                        let intervalId = undefined;
                                        self.progressBar.option("statusFormat", (ratio) => {
                                            return `Đang xác định: ${Math.ceil(ratio * 100)}%`;
                                        });
                                        // $("#ip_address").show();

                                        self.progressPopup.show();
                                        $("#progressBar").removeClass("complete");
                                        intervalId = setInterval(() => {
                                            seconds -= 1;
                                            self.progressBar.option("value", (10 - seconds) * 10);
                                            $("#progress_timer").text((`0${seconds}`).slice(-2));

                                            if (seconds <= 4) {
                                                $("#ip_address").text(`Xác định được địa chỉ IP: ${ipAddress} - Database: ${e.selectedItem?.table.table_schema}`);
                                            }
                                            else {
                                                $("#ip_address").text("Đang xác định địa chỉ IP - Database");
                                            }
                                            if (seconds === 0) {
                                                clearInterval(intervalId);
                                                TableService.countData(e.selectedItem.table.id).then(count => {
                                                    e.selectedItem["data_count"] = count;
                                                    e.selectedItem["sync_date"] = new Date();
                                                    e.selectedItem["ip_address"] = ipAddress;
                                                    this.layerGrid.option("dataSource", [e.selectedItem]);
                                                    this.syncButton.option("disabled", false);
                                                });
                                            }
                                        }, 1000);

                                    }
                                    else {
                                        this.layerGrid.option("dataSource", []);
                                        this.syncButton.option("disabled", true);
                                    }

                                },
                                placeholder: "Chọn lớp dữ liệu",
                                searchEnabled: true,
                                searchExpr: ["name_vn"],
                                searchMode: "contains",
                                valueExpr: "id",
                                width: 200
                            },
                            widget: "dxSelectBox"
                        }, {
                            location: "before",
                            options: {
                                disabled: true,
                                dropDownOptions: {
                                    width: "220px",
                                },
                                icon: "icon icon-setting-2",
                                items: [{
                                    icon: "icon icon-import-excel",
                                    onClick: () => {
                                        self.progressBar.option("statusFormat", (ratio) => {
                                            return `Đang phân phối: ${Math.ceil(ratio * 100)}%`;
                                        });

                                        self.progressPopup.show();
                                        const item = this.layerGrid.option("dataSource")[0];
                                        let seconds = item.data_count > 10000 ? 50 : 10;
                                        // let inProgress = false;
                                        let intervalId = undefined;

                                        $("#progressBar").removeClass("complete");
                                        intervalId = setInterval(() => {
                                            seconds -= 1;
                                            self.progressBar.option("value", item.data_count > 10000 ? (50 - seconds) * 2 : (10 - seconds) * 10);
                                            $("#progress_timer").text((`0${seconds}`).slice(-2));
                                            if (seconds === 0) {
                                                clearInterval(intervalId);
                                                PhanPhoiDuLieuService.insert({
                                                    data_count: item.data_count,
                                                    database_name: item.table.table_schema,
                                                    id: 0,
                                                    ip_address: item.ip_address,
                                                    is_integrated: true,
                                                    layer_id: item.id,
                                                    sync_date: new Date()
                                                }).then(() => {
                                                    self.syncPopup.hide();
                                                    OGUtils.alert("Phân phối dữ liệu thành công!");
                                                    this.syncGrid.getDataSource().reload();
                                                });
                                            }
                                        }, 1000);
                                    },
                                    text: "Đồng bộ dữ liệu ngay",
                                }, {
                                    icon: "icon icon-import-shp",
                                    onClick: () => {
                                        this.syncTimePopup.show();
                                    },
                                    text: "Đặt lịch đồng bộ",
                                },],
                                onContentReady: (e) => {
                                    this.syncButton = e.component;
                                },
                                stylingMode: "contained",
                                text: "Đồng bộ dữ liệu",
                                type: "success",
                            },
                            widget: "dxDropDownButton"
                        });
                    },
                    pager: {
                        allowedPageSizes: [50, 100, 200],
                        infoText: "{2} bản ghi",
                        showInfo: true,
                        showNavigationButtons: false,
                        showPageSizeSelector: true,
                        visible: true,
                        /*displayMode: 'compact'*/
                    },
                    paging: {
                        enabled: true,
                        pageSize: 50
                    },
                    remoteOperations: {
                        filtering: true,
                        groupPaging: true,
                        grouping: false,
                        paging: true,
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
                    wordWrapEnabled: true,
                }).dxDataGrid("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: 600,
            hideOnOutsideClick: false,
            onHidden: () => {
                self.tableSchemaSelect.getDataSource().reload();
                self.tableSchemaSelect.reset();
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
            title: "Phân phối dữ liệu hiện trạng htkt",
            width: "auto",
        }).dxPopup("instance");
    }
    onInit(): void {
        const self = this;
        this.tableSchemaStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                if (key) {
                    $.get("/api/table/schema/" + key.toString()).done(xhr => {
                        if (xhr && xhr.status === EnumStatus.OK) {
                            deferred.resolve(xhr.data);
                        }
                        deferred.resolve({});
                    });
                } else {
                    deferred.resolve({});
                }
                return deferred;
            },
            key: "schema_name",
            load: () => {
                const deferred = $.Deferred();
                $.get("/api/table/schema/list").done(xhr => {
                    if (xhr && xhr.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            },
            loadMode: "raw",
        });
        this.phanPhoiDuLieuStore = new CustomStore({
            byKey: (key) => {
                return PhanPhoiDuLieuService.get(key);
            },
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred();
                PhanPhoiDuLieuService.list(loadOptions).then(result => {
                    if (result.status == "OK" && result.data && result.data.length) {
                        deferred.resolve(result.data);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw",
        });

        this.layerStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                if (key) {
                    $.get("/api/layer/get-fields?id=" + key).done(xhr => {
                        if (xhr && xhr.status === EnumStatus.OK) {
                            deferred.resolve(xhr.data);
                        }
                        deferred.resolve({});
                    });
                } else {
                    deferred.resolve({});
                }
                return deferred;
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
                args.tableSchema = this.tableSchema;
                if (loadOptions.filter && loadOptions.filter.length) {
                    args.keyword = loadOptions.filter[0].filterValue ?? loadOptions.filter.filterValue;
                }
                if (this.tableSchema) {
                    $.ajax({
                        contentType: "application/json",
                        data: args,
                        dataType: "json",
                        error: () => {
                            deferred.reject("Data Loading Error");
                        },
                        success: (result) => {
                            if (result.status == "OK" && result.data && result.data.length) {
                                deferred.resolve({
                                    data: result.data,
                                    totalCount: result.recordsFiltered
                                });
                            } else {
                                deferred.resolve({
                                    data: [],
                                    totalCount: 0
                                });
                            }
                        },
                        type: "get",
                        url: "/api/layer/list-layers",
                    });
                }
                else {
                    deferred.resolve({
                        data: [],
                        totalCount: 0
                    });
                }
                return deferred.promise();
            },
        });

        this.progressPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                $("<div class='text-center'><p id='ip_address'>Đang xác định địa chỉ IP - Database</p></div>").appendTo(container);
                $("<div class='text-center'><p>Thời gian còn lại 00:00:<span id='progress_timer'></span></p></div>").appendTo(container);
                this.progressBar = $("<div id='progressBar' />").appendTo(container).dxProgressBar({
                    elementAttr: {
                        "aria-label": "Progress Bar",
                    },
                    max: 100,
                    min: 0,
                    onComplete(e) {
                        e.element.addClass("complete");
                        self.progressPopup.hide();
                    },
                    statusFormat(ratio) {
                        return `Đang đồng bộ: ${Math.ceil(ratio * 100)}%`;
                    },
                    width: "100%",
                }).dxProgressBar("instance");
            },
            deferRendering: false,
            dragEnabled: true,
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
            showCloseButton: false,
            showTitle: true,
            title: "Phân phối dữ liệu",
            width: 500,
        }).dxPopup("instance");

        this.syncGrid = $("<div />").appendTo(this.container).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnChooser: {
                enabled: false,
                mode: "select"
            },
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.syncGrid.pageIndex();
                    const pageSize = this.syncGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                width: 50,
            },
            {
                alignment: "left",
                caption: "IP - Database",
                cellTemplate: (container, options) => {
                    container.html(`${options.value} - ${options.data.database_name}`);
                },
                cssClass: "cell-highlighted-1",
                dataField: "ip_address",
                width: 400,
            },
            {
                alignment: "center",
                caption: "Lớp dữ liệu",
                cssClass: "cell-highlighted-1",
                dataField: "layer.name_vn",
                width: 200,
            },
            {
                caption: "Dữ liệu nguồn (Phần mềm CSDL HTĐT)",
                columns: [{
                    caption: "Số đối tượng",
                    cellTemplate: (container, options) => {
                        container.html(OGUtils.formatNumber(options.value));
                    },
                    cssClass: "cell-highlighted-1",
                    dataField: "data_count",
                }, {
                    caption: "Ngày cập nhật",
                    cssClass: "cell-highlighted-1",
                    dataField: "sync_date",
                    dataType: "datetime",
                    format: "dd/MM/yyyy HH:mm"
                }],
                cssClass: "cell-highlighted-1",
            },
            {
                caption: "Dữ liệu đích (Đến hệ thống khác)",
                columns: [{
                    caption: "Số đối tượng",
                    cellTemplate: (container, options) => {
                        container.html(options.data.is_integrated ? OGUtils.formatNumber(options.value) : "0");
                    },
                    cssClass: "cell-highlighted-1",
                    dataField: "data_count",
                }, {
                    caption: "Ngày cập nhật",
                    cssClass: "cell-highlighted-1",
                    dataField: "sync_date",
                    dataType: "datetime",
                    format: "dd/MM/yyyy HH:mm"
                }],
                cssClass: "cell-highlighted-1",
            },
            {
                caption: "Kết quả tích hợp",
                columns: [{
                    caption: "Số đối tượng thành công",
                    cellTemplate: (container, options) => {
                        container.html(options.data.is_integrated ? OGUtils.formatNumber(options.value) : "0");
                    },
                    cssClass: "cell-highlighted-2",
                    dataField: "data_count",
                },
                {
                    caption: "Số đối tượng lỗi",
                    cssClass: "cell-highlighted-2",
                    dataField: null,
                },
                {
                    caption: "Ngày cập nhật",
                    cssClass: "cell-highlighted-2",
                    dataField: "sync_date",
                    dataType: "datetime",
                    format: "dd/MM/yyyy HH:mm"
                },
                ],
                cssClass: "cell-highlighted-2"
            },
            ],
            dataSource: {
                store: this.phanPhoiDuLieuStore
            },
            errorRowEnabled: false,
            // filterRow: {
            //     visible: true,
            // },
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            // onEditorPreparing: (e) => {
            //     if (e.dataField == "geometry" && e.parentType == "dataRow") {
            //         // e.editorOptions.disabled = !e.row.inserted;
            //     }
            // },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;
                e.toolbarOptions.items.unshift({
                    location: "before",
                    template: () => {
                        return "<h6>PHÂN PHỐI CSDL VỀ HTKT</h6>";
                    }
                }, {
                    location: "after",
                    options: {
                        hint: "Xác định biến động số liệu",
                        icon: "icon icon-programming-arrow",
                        onClick: () => {
                            this.syncPopup.show();
                        },
                        type: "success"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới bảng",
                        icon: "icon icon-refresh",
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
            searchPanel: { visible: false },
            selection: {
                mode: "single"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",
        }).dxDataGrid("instance");
    }
}

export { PhanPhoiDuLieuView };