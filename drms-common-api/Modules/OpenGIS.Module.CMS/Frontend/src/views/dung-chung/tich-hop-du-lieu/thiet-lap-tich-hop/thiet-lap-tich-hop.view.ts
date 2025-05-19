import { LoadOptions } from "devextreme/data";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid, { ColumnCellTemplateData, EditorPreparingEvent } from "devextreme/ui/data_grid";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/multi_view";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/select_box";
import "devextreme/ui/tag_box";

import { AttributesEditorComponent } from "../../../../../../../libs/core/components/attributes-editor/attributes-editor.component";
import { AttributesWindowComponent, AttributesWindowOption } from "../../../../../../../libs/core/components/attributes-window/attributes-window.component";
import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { OGConfigModel } from "../../../../../../../libs/core/models/config.model";
import { HeThongTichHopModel, HeThongTichHopThoiGianModel } from "../../../../../../../libs/core/models/hethong-tichhop.model";
import { OGTableSchemaModel } from "../../../../../../../libs/core/models/table.model";
import { HeThongTichHopService, HeThongTichHopThoiGianService } from "../../../../../../../libs/core/services/hethong-tichhop.service";

class ThietLapThoiGianTichHopView implements IBaseComponent {
    attributesWindowComponent: AttributesWindowComponent;
    config: OGConfigModel;
    container: JQuery<HTMLElement>;
    heThongId: number;
    heThongTichHopGrid: dxDataGrid<HeThongTichHopModel, number>;
    historyPopup: dxPopup;
    layerStore: CustomStore;
    newDataPopup: dxPopup;
    tableSchema: string;
    tableSchemaStore: CustomStore<OGTableSchemaModel, string>;
    tableViews: dxMultiView;
    thoiGianGrid: dxDataGrid<HeThongTichHopThoiGianModel, number>;
    constructor(container: JQuery<HTMLElement>, config: OGConfigModel) {
        this.config = config;
        this.container = container;
        this.onInit();
    }
    private initGridView(): void {
        const self = this;
        this.tableViews = this.container.dxMultiView({
            deferRendering: false,
            //height: "100%",
            items: [{
                template: (itemData, itemIndex, itemElement) => {
                    this.heThongTichHopGrid = $("<div />").appendTo(itemElement).dxDataGrid({
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
                                const pageIndex = this.heThongTichHopGrid.pageIndex();
                                const pageSize = this.heThongTichHopGrid.pageSize();
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
                            caption: "Đường dẫn",
                            dataField: "url",
                        }, {
                            allowEditing: false,
                            allowFiltering: false,
                            allowSearch: false,
                            allowSorting: false,
                            caption: "Trạng thái thiết lập",
                            cellTemplate: (container, options) => {
                                container.append(`${options.row.data.is_integrated ? "Đã thiết lập" : "Chưa thiết lập"}`);
                            },
                            dataField: null,
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
                                                hint: "Chỉnh sửa",
                                                icon: "icon icon-edit-2",
                                                onClick: () => {
                                                    this.heThongTichHopGrid.editRow(options.rowIndex);
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
                                                    OGUtils.confirm("Xác nhận xóa thông tin hệ thống này  ?").then(value => {
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
                                                    this.heThongId = options.data.id;
                                                    this.thoiGianGrid.getDataSource().reload();
                                                    this.tableViews.option("selectedIndex", 1);
                                                },
                                                text: "Thiết lập thời gian",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }]
                                });
                            },
                            dataField: "id",
                            width: 300,
                        }],
                        dataSource: new CustomStore<HeThongTichHopModel, number>({
                            byKey: (key: number) => {
                                return HeThongTichHopService.get(key);
                            },
                            insert: (values) => {
                                return HeThongTichHopService.insert(values);
                            },
                            key: "id",
                            load: (loadOptions: LoadOptions<HeThongTichHopModel>) => {
                                return new Promise((resolve) => {
                                    HeThongTichHopService.list(loadOptions).then(result => {
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
                                return HeThongTichHopService.delete({ id: key });
                            },
                            update: (key: number, values: HeThongTichHopModel) => {
                                return HeThongTichHopService.update(values);
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
                                }, {
                                    dataField: "url",
                                    editorOptions: {
                                        showClearButton: true,
                                    },
                                    validationRules: [{
                                        message: "Vui lòng nhập url",
                                        type: "required",
                                    }]
                                },],
                            },
                            mode: "popup",
                            popup: {
                                height: "auto",
                                showTitle: true,
                                title: "Thông tin hệ thống",
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
                                    template: () => {
                                        return "<h6>THIẾT LẬP THỜI GIAN TÍCH HỢP</h6>";
                                    }
                                }, {
                                    location: "after",
                                    options: {
                                        hint: "Thêm mới",
                                        icon: "add",
                                        onClick: (e) => {
                                            this.heThongTichHopGrid.addRow();
                                        },
                                        type: "default",
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "after",
                                    options: {
                                        hint: "Làm mới bảng",
                                        icon: "icon icon-refresh",
                                        onClick: () => {
                                            this.heThongTichHopGrid.getDataSource().reload();
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
                    this.thoiGianGrid = $("<div />").appendTo(itemElement).dxDataGrid({
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
                                const pageIndex = this.thoiGianGrid.pageIndex();
                                const pageSize = this.thoiGianGrid.pageSize();
                                container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                            },
                            visible: true,
                            width: 50,
                        }, {
                            caption: "Phân hệ",
                            dataField: "schema_name",
                            lookup: {
                                dataSource: {
                                    store: this.tableSchemaStore
                                },
                                displayExpr: "description",
                                valueExpr: "schema_name"
                            },
                            sortIndex: 0,
                            sortOrder: "asc",
                        }, {
                            caption: "Lớp dữ liệu",
                            dataField: "layer_id",
                            lookup: {
                                dataSource: function (options) {
                                    return {
                                        // filter: options.data ? ["table.table_schema", "=", options.data.table_schema] : null,
                                        store: new CustomStore({
                                            byKey: (key) => {
                                                const deferred = $.Deferred();
                                                if (key) {
                                                    $.get("/api/layer/" + key).done(xhr => {
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
                                                args.tableSchema = options.data?.table_schema ?? "";
                                                if (loadOptions.filter && loadOptions.filter.length) {
                                                    args.keyword = loadOptions.filter[0].filterValue ?? loadOptions.filter.filterValue;
                                                }
                                                $.ajax({
                                                    contentType: "application/json",
                                                    data: args,
                                                    dataType: "json",
                                                    error: () => {
                                                        deferred.reject("Data Loading Error");
                                                    },
                                                    success: (result) => {
                                                        if (result.status == "OK" && result.data && result.data.length) {
                                                            deferred.resolve(result.data, {
                                                                totalCount: result.recordsFiltered
                                                            });
                                                        } else {
                                                            deferred.resolve([], {
                                                                totalCount: 0
                                                            });
                                                        }
                                                    },
                                                    type: "get",
                                                    url: "/api/layer/getLayers",
                                                });
                                                return deferred.promise();
                                            },
                                        })
                                    };
                                },
                                displayExpr: "name_vn",
                                valueExpr: "id",

                            },
                            sortIndex: 0,
                            sortOrder: "asc",
                        }, {
                            caption: "Thời gian",
                            dataField: "thoigian_thietlap",
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
                                                hint: "Chỉnh sửa",
                                                icon: "icon icon-edit-2",
                                                onClick: () => {
                                                    this.thoiGianGrid.editRow(options.rowIndex);
                                                },
                                                type: "success"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            options: {
                                                hint: "Xem lịch sử tích hợp",
                                                icon: "icon icon-activity",
                                                onClick: () => {
                                                    OGUtils.showLoading();
                                                    $.get("/api/layer/" + options.data.layer_id).done(xhr => {
                                                        OGUtils.hideLoading();
                                                        if (xhr && xhr.status === EnumStatus.OK) {
                                                            this.attributesWindowComponent.setTitle("Lịch sử tích hợp").setVisibleButton(false).for(xhr.data, xhr.data.table).show();
                                                        }
                                                    });
                                                },
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            options: {
                                                hint: "Xem danh sách dữ liệu tích hợp",
                                                icon: "icon icon-archive-book",
                                                onClick: () => {
                                                    OGUtils.showLoading();
                                                    $.get("/api/layer/" + options.data.layer_id).done(xhr => {
                                                        OGUtils.hideLoading();
                                                        if (xhr && xhr.status === EnumStatus.OK) {
                                                            this.attributesWindowComponent.setTitle("Danh sách dữ liệu tích hợp").for(xhr.data, xhr.data.table).show();
                                                        }
                                                    });

                                                },
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            options: {
                                                hint: "Xoá",
                                                icon: "icon icon-trash",
                                                onClick: () => {
                                                    OGUtils.confirm("Xác nhận xóa thời gian tích hợp phân hệ này?").then(value => {
                                                        if (value) {
                                                            options.component.getDataSource().store().remove(options.value).then(() => {
                                                                options.component.getDataSource().reload();
                                                                this.heThongTichHopGrid.getDataSource().reload();
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
                        dataSource: new CustomStore<HeThongTichHopThoiGianModel, number>({
                            byKey: (key: number) => {
                                return HeThongTichHopThoiGianService.get(key);
                            },
                            insert: (values) => {
                                if (this.heThongId) {
                                    values.hethong_id = this.heThongId;
                                }
                                return HeThongTichHopThoiGianService.insert(values);
                            },
                            key: "id",
                            load: (loadOptions: LoadOptions<HeThongTichHopThoiGianModel>) => {
                                return new Promise((resolve) => {
                                    HeThongTichHopThoiGianService.list(Object.assign(loadOptions, {
                                        heThongId: this.heThongId
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
                                return HeThongTichHopThoiGianService.delete({ id: key });
                            },
                            update: (key: number, values: HeThongTichHopThoiGianModel) => {
                                if (this.heThongId) {
                                    values.hethong_id = this.heThongId;
                                }
                                return HeThongTichHopThoiGianService.update(values);
                            }
                        }),
                        editing: {
                            form: {
                                colCount: 1,
                                items: [{
                                    dataField: "schema_name",
                                    editorOptions: {
                                        showClearButton: true,
                                    },
                                    validationRules: [{
                                        message: "Vui lòng chọn phân hệ",
                                        type: "required",
                                    }],
                                }, {
                                    dataField: "thoigian_thietlap",
                                    editorOptions: {
                                        showClearButton: true,
                                    },
                                    validationRules: [{
                                        message: "Vui lòng nhập thời gian",
                                        type: "required",
                                    }],
                                }, {
                                    dataField: "layer_id",
                                    editorOptions: {
                                        showClearButton: true,
                                    },
                                    validationRules: [{
                                        message: "Vui lòng chọn lớp",
                                        type: "required",
                                    }],
                                },],
                            },
                            mode: "popup",
                            popup: {
                                height: "auto",
                                showTitle: true,
                                title: "Thông tin thời gian tích hợp của phân hệ",
                                width: 400,
                            },
                            useIcons: true
                        },
                        filterRow: {
                            visible: true,
                        },
                        height: "100%",
                        onEditorPrepared: function (options) {
                            if (options.parentType == "dataRow" && options.dataField == "schema_name") {
                                options.editorElement.dxSelectBox("instance").option("onValueChanged", function (e) {
                                    this.tableSchema = e.value;
                                    // this.layerStore.load();
                                    // console.log(this.tableSchema);
                                });
                            }
                        },
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
                                    template: () => {
                                        return "<h6>QUẢN LÝ THỜI GIAN TÍCH HỢP</h6>";
                                    }
                                },
                                {
                                    location: "after",
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
                                    location: "after",
                                    options: {
                                        hint: "Thêm mới thời gian tích hợp phân hệ",
                                        icon: "icon icon-add",
                                        onClick: () => {
                                            this.thoiGianGrid.addRow();
                                        },
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
                                            this.thoiGianGrid.getDataSource().reload();
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

    private initPopup(): void {
        this.historyPopup = $("<div />").appendTo("body")
            .dxPopup({
                contentTemplate: (container) => {
                    $("<div />").appendTo(container).dxDataGrid({
                        allowColumnReordering: true,
                        allowColumnResizing: true,
                        columns: [{
                            alignment: "center",
                            allowFiltering: false,
                            allowSearch: false,
                            allowSorting: false,
                            caption: "#",
                            cellTemplate: (container, options) => {
                                const pageIndex = this.thoiGianGrid.pageIndex();
                                const pageSize = this.thoiGianGrid.pageSize();
                                container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                            },
                            visible: true,
                            width: 50,
                        }, {
                            caption: "Thời gian",
                            dataField: null
                        }, {
                            caption: "Số bản ghi cập nhật",
                            dataField: null
                        }, {
                            caption: "Số bản ghi thành công",
                            dataField: null
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
                                                hint: "Danh sách dữ lie",
                                                icon: "icon icon-edit-2",
                                                onClick: () => {
                                                },
                                                type: "success"
                                            },
                                            widget: "dxButton"
                                        },]
                                });
                            },
                            dataField: "id",
                            width: 75,
                        }],
                        dataSource: [],
                        filterRow: {
                            visible: false,
                        },
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
                        searchPanel: { visible: false },
                        selection: {
                            mode: "single",
                            showCheckBoxesMode: "none"
                        },
                        showBorders: true,
                        showRowLines: true,
                        sorting: {
                            mode: "single",
                        },
                        width: "100%"
                    }).dxDataGrid("instance");
                },
                deferRendering: false,
                dragEnabled: true,
                height: 400,
                hideOnOutsideClick: false,
                shading: false,
                showTitle: true,
                title: "Lịch sử tích hợp",
                width: 700,
            }).dxPopup("instance");
        this.newDataPopup = $("<div />").appendTo("body")
            .dxPopup({
                contentTemplate: (container) => {
                    $("<div />").appendTo(container).dxDataGrid({
                        allowColumnReordering: true,
                        allowColumnResizing: true,
                        columnChooser: {
                            enabled: false,
                            mode: "select",
                        },
                        columns: [{
                            alignment: "center",
                            allowFiltering: false,
                            allowSearch: false,
                            allowSorting: false,
                            caption: "#",
                            cellTemplate: (container, options) => {
                                const pageIndex = this.thoiGianGrid.pageIndex();
                                const pageSize = this.thoiGianGrid.pageSize();
                                container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                            },
                            visible: true,
                            width: 50,
                        }, {
                            caption: "Thông tin dữ liệu",
                            dataField: null
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
                                                hint: "Danh sách dữ lie",
                                                icon: "icon icon-edit-2",
                                                onClick: () => {
                                                },
                                                type: "success"
                                            },
                                            widget: "dxButton"
                                        },]
                                });
                            },
                            dataField: "id",
                            width: 75,
                        }],
                        dataSource: [],
                        filterRow: {
                            visible: false,
                        },
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
                        searchPanel: { visible: false },
                        selection: {
                            mode: "single",
                            showCheckBoxesMode: "none"
                        },
                        showBorders: true,
                        showRowLines: true,
                        sorting: {
                            mode: "single",
                        },
                        width: "100%"
                    }).dxDataGrid("instance");
                },
                deferRendering: false,
                dragEnabled: true,
                height: 400,
                hideOnOutsideClick: false,
                shading: false,
                showTitle: true,
                title: "Danh sách dữ liệu mới",
                width: 700
            }).dxPopup("instance");
    }
    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());
        this.attributesWindowComponent = new AttributesWindowComponent(null, {
            attributeEditors: new AttributesEditorComponent(null),
            oGConfig: this.config,
            showButton: true
        } as AttributesWindowOption);
        this.layerStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                if (key) {
                    $.get("/api/layer/" + key).done(xhr => {
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
            // insert: (values) => {
            //     return $.ajax({
            //         contentType: "application/json",
            //         data: JSON.stringify(values),
            //         success: (xhr) => {
            //             if (xhr.status == "OK") {
            //                 OGUtils.alert("Lưu lớp dữ liệu thành công");
            //             } else {
            //                 OGUtils.alert(xhr.errors[0].message, "Lỗi");
            //             }
            //         },
            //         type: "POST",
            //         url: "/api/layer/" + this.tableSchema + "/save",
            //     });
            // },
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
                args.take = loadOptions.take ? loadOptions.take : 100;
                args.tableSchema = this.tableSchema;

                if (loadOptions.filter && loadOptions.filter.length) {
                    args.keyword = loadOptions.filter[0].filterValue ?? loadOptions.filter.filterValue;
                }
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
                return deferred.promise();
            },
        });
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
            insert: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            OGUtils.alert("Thêm schema liệu thành công");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
                        }
                    },
                    type: "POST",
                    url: "/api/table/schema/create",
                });
            },
            key: "schema_name",
            load: () => {
                const deferred = $.Deferred();
                $.get("/api/table/schema/list").done(xhr => {
                    if (xhr && xhr.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data);
                    }
                    //
                    deferred.resolve({});
                });
                return deferred;
            },
            loadMode: "raw",
            remove: (key) => {
                return $.ajax({
                    data: { schema_name: key },
                    type: "POST",
                    url: "/api/table/schema/delete",
                });
            },
            update: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            OGUtils.alert("Cập nhật thành công");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
                        }
                    },
                    type: "POST",
                    url: "/api/table/schema/update",
                });
            },
        });
        this.initGridView();
        this.initPopup();
    }
}
export { ThietLapThoiGianTichHopView };